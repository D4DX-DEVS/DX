import { Mail, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DeleteButton } from "@/components/admin/delete-button";
import { PageHeader } from "@/components/admin/page-header";
import { FormSkeleton } from "@/components/admin/skeletons";
import { Button } from "@/components/ui/button";
import { deleteInquiry, setInquiryStatus } from "@/lib/actions/admin/inquiries";
import { getInquiry } from "@/lib/data/admin/inquiries";
import { dateTime } from "@/lib/format";
import { InboxStatusSelect } from "../_components/inbox-status-select";

export const metadata: Metadata = { title: "Inquiry" };

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium tracking-wide text-soft uppercase">{label}</dt>
      <dd className="text-sm break-words text-ink">{children}</dd>
    </div>
  );
}

async function InquiryDetail({ params }: { params: PageProps<"/admin/inquiries/[id]">["params"] }) {
  const { id } = await params;
  const inquiry = await getInquiry(id);
  if (!inquiry) notFound();
  const digits = inquiry.phone.replace(/\D/g, "");

  return (
    <>
      <PageHeader
        title={inquiry.name}
        description={`Received ${dateTime(inquiry.created_at)}`}
        back={{ href: "/admin/inquiries", label: "Inquiries" }}
        actions={
          <>
            <Button asChild variant="outline">
              <a href={`mailto:${inquiry.email}`}>
                <Mail className="size-4" aria-hidden="true" />
                Reply by email
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
        <section className="rounded-2xl border border-border bg-raised p-4 sm:p-6">
          <h2 className="text-base font-semibold">Message</h2>
          <p className="mt-4 text-[0.9375rem] leading-relaxed break-words whitespace-pre-line text-ink">{inquiry.message}</p>
        </section>
        <aside className="space-y-6">
          <section className="space-y-4 rounded-2xl border border-border bg-raised p-4 sm:p-6">
            <h2 className="text-base font-semibold">Details</h2>
            <dl className="space-y-4">
              <Detail label="Email">
                <a href={`mailto:${inquiry.email}`} className="link">
                  {inquiry.email}
                </a>
              </Detail>
              <Detail label="Phone">
                {inquiry.phone ? (
                  <a href={`tel:${inquiry.phone.replace(/[^\d+]/g, "")}`} className="link inline-flex items-center gap-1.5">
                    <Phone className="size-3.5" aria-hidden="true" />
                    {inquiry.phone}
                  </a>
                ) : (
                  <span className="text-soft">Not given</span>
                )}
              </Detail>
              <Detail label="Service">{inquiry.service || <span className="text-soft">Not given</span>}</Detail>
              <Detail label="Received">{dateTime(inquiry.created_at)}</Detail>
            </dl>
          </section>
          <section className="space-y-3 rounded-2xl border border-border bg-raised p-4 sm:p-6">
            <label htmlFor="inquiry-status" className="block text-base font-semibold">
              Status
            </label>
            <InboxStatusSelect id="inquiry-status" value={inquiry.status} action={setInquiryStatus.bind(null, inquiry.id)} />
            <p className="text-sm text-soft">Archive messages you have dealt with to keep the inbox short.</p>
          </section>
          <DeleteButton
            name={`the inquiry from ${inquiry.name}`}
            consequence="The message is removed from the inbox."
            action={deleteInquiry.bind(null, inquiry.id)}
            redirectTo="/admin/inquiries"
          />
        </aside>
      </div>
    </>
  );
}

export default function InquiryPage({ params }: PageProps<"/admin/inquiries/[id]">) {
  return (
    <div className="space-y-6 lg:space-y-8">
      <Suspense fallback={<FormSkeleton fields={5} />}>
        <InquiryDetail params={params} />
      </Suspense>
    </div>
  );
}
