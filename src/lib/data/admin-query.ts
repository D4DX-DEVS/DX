import "server-only";
import { batch } from "@/lib/db";
import { escapeLike, toPaginated, type Paginated } from "@/lib/listing";

type Param = string | number | null;

export interface ListSpec {
  /** Table (or join) after FROM. */
  from: string;
  select: string;
  /** Columns matched by the search box (case-insensitive substring). */
  search: string[];
  /** Whitelisted sort keys mapped to SQL expressions. */
  sorts: Record<string, string>;
  /** Extra conditions joined with AND, with their params in order. */
  where?: { sql: string; params?: Param[] }[];
  /** Appended after the chosen sort so pages are stable. */
  tiebreak?: string;
}

export interface ListQuery {
  page: number;
  pageSize: number;
  search: string;
  sort: string;
  order: "asc" | "desc";
}

/** One page of an admin listing plus its total, in a single D1 round trip. */
export async function listPage<T>(spec: ListSpec, q: ListQuery): Promise<Paginated<T>> {
  const conditions: string[] = [];
  const params: Param[] = [];
  for (const w of spec.where ?? []) {
    conditions.push(w.sql);
    params.push(...(w.params ?? []));
  }
  if (q.search) {
    const pattern = `%${escapeLike(q.search)}%`;
    conditions.push(`(${spec.search.map((c) => `${c} LIKE ? ESCAPE '\\'`).join(" OR ")})`);
    params.push(...spec.search.map(() => pattern));
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const sortExpr = spec.sorts[q.sort] ?? Object.values(spec.sorts)[0];
  const order = `ORDER BY ${sortExpr} ${q.order === "asc" ? "ASC" : "DESC"}${spec.tiebreak ? `, ${spec.tiebreak}` : ""}`;

  const [rows, count] = await batch([
    { sql: `SELECT ${spec.select} FROM ${spec.from} ${where} ${order} LIMIT ? OFFSET ?`, params: [...params, q.pageSize, (q.page - 1) * q.pageSize] },
    { sql: `SELECT COUNT(*) AS n FROM ${spec.from} ${where}`, params },
  ]);
  const total = Number((count[0] as { n?: number } | undefined)?.n ?? 0);
  return toPaginated(rows as unknown as T[], total, q.page, q.pageSize);
}
