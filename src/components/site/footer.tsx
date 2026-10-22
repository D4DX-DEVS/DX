import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { Logo } from "@/components/brand/logo";
import { getLegalSlugs, getServices, getSettings } from "@/lib/data/public";
import { NAV } from "./nav";

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[0.8125rem] font-medium text-soft">{title}</h2>
      <ul className="mt-3 flex flex-col">{children}</ul>
    </div>
  );
}

const linkClass = "link inline-flex min-h-9 items-center text-[0.9375rem]";

/** The logo and a line about the studio, the pages and services, then how to reach us. */
export async function Footer() {
  "use cache";
  cacheLife("content");
  const [settings, legal, services] = await Promise.all([getSettings(), getLegalSlugs(), getServices()]);
  const whatsapp = settings.whatsapp.replace(/\D/g, "");
  const socials = [
    { label: "LinkedIn", href: settings.socials.linkedin },
    { label: "Instagram", href: settings.socials.instagram },
    { label: "Facebook", href: settings.socials.facebook },
    { label: "WhatsApp", href: whatsapp ? `https://wa.me/${whatsapp}` : "" },
  ].filter((s) => s.href);

  return (
    <footer className="frame bg-ground pt-14 pb-8 md:pt-16">
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-12 md:gap-x-[var(--gutter)]">
        <div className="col-span-2 md:col-span-4">
          <Link href="/" aria-label="D4DX Innovations, home" className="inline-flex min-h-11 items-center">
            <Logo className="h-7 w-auto" />
          </Link>
          <p className="mt-4 max-w-[34ch] text-[0.9375rem] leading-relaxed text-soft">
            Building digital products that create value, connect people and make an impact.
          </p>
          {socials.length ? (
            <ul aria-label="Follow" className="mt-5 flex flex-wrap gap-2">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center rounded-full bg-raised-2 px-4 text-sm font-medium transition-colors hover:bg-brand hover:text-on-brand"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <nav aria-label="Footer" className="col-span-2 grid grid-cols-2 gap-x-6 gap-y-10 md:col-span-5">
          <Column title="Quick links">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/contact" className={linkClass}>
                Contact
              </Link>
            </li>
          </Column>
          {services.length ? (
            <Column title="Our services">
              {services.map((s) => (
                <li key={s.id}>
                  <Link href={`/services#${s.slug}`} className={linkClass}>
                    {s.title}
                  </Link>
                </li>
              ))}
            </Column>
          ) : null}
        </nav>

        <div className="col-span-2 md:col-span-3">
          <h2 className="text-[0.8125rem] font-medium text-soft">Contact us</h2>
          <address className="mt-3 flex flex-col gap-1 text-[0.9375rem] not-italic">
            {settings.addressLines.length ? (
              <span className="flex gap-3 py-2 leading-relaxed">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-ink" aria-hidden="true" />
                {settings.mapUrl ? (
                  <a href={settings.mapUrl} target="_blank" rel="noopener noreferrer" className="link">
                    {settings.addressLines.join(", ")}
                  </a>
                ) : (
                  <span>{settings.addressLines.join(", ")}</span>
                )}
              </span>
            ) : null}
            {settings.email ? (
              <a href={`mailto:${settings.email}`} className="link inline-flex min-h-11 w-fit items-center gap-3">
                <Mail className="size-4 shrink-0 text-brand-ink" aria-hidden="true" />
                {settings.email}
              </a>
            ) : null}
            {settings.phone ? (
              <a href={telHref(settings.phone)} className="link inline-flex min-h-11 w-fit items-center gap-3 num">
                <Phone className="size-4 shrink-0 text-brand-ink" aria-hidden="true" />
                {settings.phone}
              </a>
            ) : null}
          </address>
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-[0.8125rem] leading-relaxed text-soft md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()} D4DX Innovations LLP. Mavoor Road photo by Prof tpms,{" "}
          <a className="link" href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">
            CC BY-SA 4.0
          </a>
          .
        </p>
        <ul className="flex flex-wrap items-center gap-x-5">
          {legal.map((p) => (
            <li key={p.slug}>
              <Link href={`/legal/${p.slug}`} className="link inline-flex min-h-11 items-center">
                {p.title}
              </Link>
            </li>
          ))}
          <li>
            <a href="#top" className="link inline-flex min-h-11 items-center text-ink">
              Back to top
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
