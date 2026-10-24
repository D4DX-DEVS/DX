import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone, type LucideIcon } from "@/components/icons";
import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/site/page-hero";
import { Lines } from "@/components/site/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategories, getSettings } from "@/lib/data/public";
import type { SearchParamsRecord } from "@/lib/listing";
import { ContactForm } from "./_components/contact-form";
import { TitleFx } from "@/components/motion/title-fx";

export const metadata: Metadata = {
  title: "Contact",
  description: "Start a project with D4DX Innovations: call, WhatsApp, email or visit the studio on Mavoor Road, Calicut.",
};

interface Way {
  icon: LucideIcon;
  label: string;
  value: string;
  href: string;
  external?: boolean;
}

async function Ways() {
  const settings = await getSettings();
  const whatsapp = settings.whatsapp.replace(/\D/g, "");
  const ways: Way[] = [
    settings.phone ? { icon: Phone, label: "Call", value: settings.phone, href: `tel:${settings.phone.replace(/[^\d+]/g, "")}` } : null,
    whatsapp ? { icon: MessageCircle, label: "WhatsApp", value: settings.whatsapp, href: `https://wa.me/${whatsapp}`, external: true } : null,
    settings.email ? { icon: Mail, label: "Email", value: settings.email, href: `mailto:${settings.email}` } : null,
    settings.addressLines.length
      ? { icon: MapPin, label: "Visit the studio", value: settings.addressLines.join(", "), href: settings.mapUrl, external: true }
      : null,
  ].filter((w): w is Way => w !== null);

  return (
    <ul className="flex flex-col gap-3">
      {ways.map((w) => {
        const Icon = w.icon;
        const body = (
          <>
            <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-xl bg-[var(--brand-tint)] text-brand-ink transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-6">
              <Icon weight="duotone" className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-soft">{w.label}</span>
              <span className="mt-0.5 block font-semibold break-words">{w.value}</span>
            </span>
            {w.href ? <ArrowUpRight className="size-4 shrink-0 text-soft transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" /> : null}
          </>
        );
        const cls = "group flex items-center gap-4 rounded-2xl border border-border bg-raised p-4 transition-shadow hover:shadow-[0_14px_32px_-18px_rgb(11_20_48/0.3)]";
        return (
          <li key={w.label}>
            {w.href ? (
              <a href={w.href} className={cls} {...(w.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {body}
              </a>
            ) : (
              <div className={cls}>{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

async function Form({ searchParams }: { searchParams: Promise<SearchParamsRecord> }) {
  const [categories, params] = await Promise.all([getCategories(), searchParams]);
  const options = categories.map((c) => ({ value: c.slug, label: c.name }));
  const type = typeof params.type === "string" ? params.type : "";
  return <ContactForm options={options} initialService={options.some((o) => o.value === type) ? type : ""} />;
}

function FormSkeleton() {
  return (
    <div className="rounded-3xl border border-border bg-raised p-6 sm:p-8 md:p-10" aria-busy="true" aria-label="Loading form">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i}>
            <Skeleton className="shimmer-line h-4 w-24" />
            <Skeleton className="mt-2 h-12 rounded-xl" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-5 h-36 rounded-xl" />
      <Skeleton className="mt-5 ml-auto h-12 w-40 rounded-full" />
    </div>
  );
}

export default function ContactPage({ searchParams }: PageProps<"/contact">) {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let's build it together"
        lead="Tell us who will use it and what it must do on day one. We reply within one working day, usually with a call."
      />
      <div className="theme-light">
        <section aria-label="Get in touch" className="frame grid grid-cols-1 gap-y-10 py-[var(--section-gap)] lg:grid-cols-12 lg:gap-x-[var(--gutter)]">
          <div className="lg:col-span-4">
            <TitleFx as="h2" className="text-[length:var(--step-head)] leading-tight font-semibold tracking-[-0.02em]">Reach us directly</TitleFx>
            <p className="mt-3 max-w-[38ch] text-soft">Prefer to talk? Call or message us, or drop in at the studio during working hours.</p>
            <div className="mt-8">
              <Suspense fallback={<Lines count={4} />}>
                <Ways />
              </Suspense>
            </div>
          </div>
          <div className="lg:col-span-8">
            <Suspense fallback={<FormSkeleton />}>
              <Form searchParams={searchParams} />
            </Suspense>
          </div>
        </section>
      </div>
    </>
  );
}
