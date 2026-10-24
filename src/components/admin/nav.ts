import {
  BriefcaseBusiness,
  FileText,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  Layers,
  MessageSquareQuote,
  Newspaper,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  type LucideIcon,
} from "@/components/icons";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Only owners see it. */
  ownerOnly?: boolean;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: "",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/projects", label: "Projects", icon: FolderKanban },
      { href: "/admin/categories", label: "Categories", icon: Layers },
      { href: "/admin/services", label: "Services", icon: Sparkles },
      { href: "/admin/team", label: "Team", icon: Users },
      {
        href: "/admin/testimonials",
        label: "Testimonials",
        icon: MessageSquareQuote,
      },
      { href: "/admin/posts", label: "Blog posts", icon: Newspaper },
      { href: "/admin/jobs", label: "Positions", icon: BriefcaseBusiness },
      { href: "/admin/pages", label: "Pages", icon: FileText },
    ],
  },
  {
    label: "Inbox",
    items: [
      { href: "/admin/inquiries", label: "Inquiries", icon: Inbox },
      { href: "/admin/applications", label: "Applications", icon: UserRound },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/admin/settings", label: "Site settings", icon: Settings },
      {
        href: "/admin/users",
        label: "Admin users",
        icon: ShieldCheck,
        ownerOnly: true,
      },
    ],
  },
];

/** The nav item a path belongs to: the longest matching href wins, /admin only matches itself. */
export function activeHref(pathname: string): string | null {
  const all = ADMIN_NAV.flatMap((g) => g.items.map((i) => i.href));
  const matches = all.filter((href) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`),
  );
  return matches.sort((a, b) => b.length - a.length)[0] ?? null;
}
