import { Download, ExternalLink, Mail, MessageCircle, Phone } from "@/components/icons";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DeleteButton } from "@/components/admin/delete-button";
import { PageHeader } from "@/components/admin/page-header";
import { FormSkeleton } from "@/components/admin/skeletons";
import { Button } from "@/components/ui/button";
import { deleteApplication, setApplicationStatus } from "@/lib/actions/admin/applications";
import { getApplication, type ApplicationExtras } from "@/lib/data/admin/applications";
import { dateTime } from "@/lib/format";
import { InboxStatusSelect } from "../../inquiries/_components/inbox-status-select";

export const metadata: Metadata = { title: "Application" };

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium tracking-wide text-soft uppercase">{label}</dt>
      <dd className="text-sm break-words text-ink">{children}</dd>
    </div>
  );
}

function ExternalUrl({ href }: { href: string }) {
  if (!href) return <span className="text-soft">Not given</span>;
  // Applicant-supplied: only http(s) becomes a link, so a javascript: URL can never run on click.
  if (!/^https?:\/\//i.test(href)) return <span className="break-all text-soft">{href}</span>;
  return (
    <a href={href} target="_blank" rel="noreferrer noopener" className="link inline-flex items-center gap-1.5 break-all">
      {href.replace(/^https?:\/\//, "")}
      <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
    </a>
  );
}

type Rows = [string, string][];

/** The longer form's answers as titled groups, leaving out what was not filled in. */
function extraSections(d: ApplicationExtras): [string, Rows][] {
  const keep = (rows: [string, string | undefined][]): Rows => rows.filter((r): r is [string, string] => Boolean(r[1]?.trim()));
  const a = d.address ?? {};
  const groups: [string, Rows][] = [
    ["Personal", keep([["Date of birth", d.dateOfBirth], ["Street address", a.street], ["Apartment, suite", a.line2], ["City", a.city], ["State or province", a.state], ["ZIP or postal code", a.zip], ["Country", a.country]])],
    ["Education", keep([["Highest qualification", d.education?.qualification], ["Degree or course", d.education?.course], ["Specialization", d.education?.specialization], ["University or institution", d.education?.institution], ["Year of graduation", d.education?.graduationYear], ["Percentage or CGPA", d.education?.grade]])],
    ["Professional", keep([["Experience", undefined], ["Current or last designation", d.professional?.designation], ["Notice period or availability", d.professional?.notice], ["Key skills", d.professional?.keySkills], ["Willing to relocate", d.relocate]])],
    ["Skills", keep([["Primary skills", d.skills?.primary], ["Secondary skills", d.skills?.secondary], ["Frameworks and technologies", d.skills?.frameworks], ["Tools and platforms", d.skills?.tools], ["Databases", d.skills?.databases]])],
    ["Projects", keep([["Relevant project experience", d.projects?.experience], ["Project description", d.projects?.description], ["Other relevant links", d.projects?.otherLinks]])],
  ];
  return groups.filter(([, rows]) => rows.length > 0);
}

function fileSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

async function ApplicationDetail({ params }: { params: PageProps<"/admin/applications/[id]">["params"] }) {
  const { id } = await params;
  const app = await getApplication(id);
  if (!app) notFound();
  const digits = app.phone.replace(/\D/g, "");
  const extras = extraSections(app.details);

  return (
    <>
      <PageHeader
        title={app.name}
        description={`${app.position} · received ${dateTime(app.created_at)}`}
        back={{ href: "/admin/applications", label: "Applications" }}
        actions={
          <>
            {app.resume.file ? (
              <Button asChild className="bg-brand text-on-brand hover:bg-[var(--brand-strong)]">
                {/* A route handler, not a page: a plain link downloads the file. */}
                <a href={`/admin/applications/${app.id}/resume`} download>
                  <Download className="size-4" aria-hidden="true" />
                  Download résumé
                </a>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <a href={`mailto:${app.email}`}>
                <Mail className="size-4" aria-hidden="true" />
                Email
              </a>
            </Button>
            {digits ? (
              <Button asChild variant="outline">
                <a href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4" aria-hidden="true" />
                  WhatsApp
                </a>
              </Button>
            ) : null}
          </>
        }
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          {extras.length ? (
            extras.map(([title, rows]) => (
              <section key={title} className="rounded-2xl border border-border bg-raised shadow-[var(--shadow-card)] p-4 sm:p-6">
                <h2 className="text-base font-semibold">{title}</h2>
                <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {rows.map(([label, value]) => (
                    <div key={label} className={value.length > 60 ? "sm:col-span-2" : undefined}>
                      <Detail label={label}>
                        <span className="whitespace-pre-line">{value}</span>
                      </Detail>
                    </div>
                  ))}
                </dl>
              </section>
            ))
          ) : (
            <section className="rounded-2xl border border-border bg-raised shadow-[var(--shadow-card)] p-4 sm:p-6">
              <h2 className="text-base font-semibold">Message</h2>
              {app.message ? (
                <p className="mt-4 text-[0.9375rem] leading-relaxed break-words whitespace-pre-line text-ink">{app.message}</p>
              ) : (
                <p className="mt-4 text-sm text-soft">The applicant did not add a message.</p>
              )}
            </section>
          )}
          <section className="rounded-2xl border border-border bg-raised shadow-[var(--shadow-card)] p-4 sm:p-6">
            <h2 className="text-base font-semibold">Work and documents</h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Detail label="Portfolio">
                <ExternalUrl href={app.portfolio_url} />
              </Detail>
              <Detail label="GitHub">
                <ExternalUrl href={app.github_url} />
              </Detail>
              <Detail label="Résumé">
                {app.resume.file ? (
                  <a href={`/admin/applications/${app.id}/resume`} download className="link inline-flex items-center gap-1.5 break-all">
                    <Download className="size-3.5 shrink-0" aria-hidden="true" />
                    {app.resume.name || "resume.pdf"} ({fileSize(app.resume.size)})
                  </a>
                ) : (
                  <span className="text-soft">No file</span>
                )}
              </Detail>
              <Detail label="Certificates">
                {app.certificates.file ? (
                  <a href={`/admin/applications/${app.id}/resume?file=certificates`} download className="link inline-flex items-center gap-1.5 break-all">
                    <Download className="size-3.5 shrink-0" aria-hidden="true" />
                    {app.certificates.name || "certificates.pdf"} ({fileSize(app.certificates.size)})
                  </a>
                ) : (
                  <span className="text-soft">None attached</span>
                )}
              </Detail>
            </dl>
          </section>
        </div>
        <aside className="space-y-6">
          <section className="space-y-4 rounded-2xl border border-border bg-raised shadow-[var(--shadow-card)] p-4 sm:p-6">
            <h2 className="text-base font-semibold">Applicant</h2>
            <dl className="space-y-4">
              <Detail label="Position">{app.position}</Detail>
              <Detail label="Experience">{app.experience || <span className="text-soft">Not given</span>}</Detail>
              <Detail label="Email">
                <a href={`mailto:${app.email}`} className="link">
                  {app.email}
                </a>
              </Detail>
              <Detail label="Phone">
                <a href={`tel:${app.phone.replace(/[^\d+]/g, "")}`} className="link inline-flex items-center gap-1.5">
                  <Phone className="size-3.5" aria-hidden="true" />
                  {app.phone}
                </a>
              </Detail>
              <Detail label="Received">{dateTime(app.created_at)}</Detail>
            </dl>
          </section>
          <section className="space-y-3 rounded-2xl border border-border bg-raised shadow-[var(--shadow-card)] p-4 sm:p-6">
            <label htmlFor="application-status" className="block text-base font-semibold">
              Status
            </label>
            <InboxStatusSelect id="application-status" value={app.status} action={setApplicationStatus.bind(null, app.id)} />
            <p className="text-sm text-soft">Archive applications you have answered.</p>
          </section>
          <DeleteButton
            name={`the application from ${app.name}`}
            consequence="The application and its résumé are removed."
            action={deleteApplication.bind(null, app.id)}
            redirectTo="/admin/applications"
          />
        </aside>
      </div>
    </>
  );
}

export default function ApplicationPage({ params }: PageProps<"/admin/applications/[id]">) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <Suspense fallback={<FormSkeleton fields={6} />}>
        <ApplicationDetail params={params} />
      </Suspense>
    </div>
  );
}
