import { ArrowRight, FacebookLogo, InstagramLogo, LinkedinLogo, Mail, MapPin, Phone, WhatsappLogo } from "@/components/icons";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { Logo } from "@/components/brand/logo";
import { getLegalSlugs, getServices, getSettings } from "@/lib/data/public";
import { FooterBackdrop } from "./footer-backdrop";
import { NAV } from "./nav";
import { TitleFx } from "@/components/motion/title-fx";

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[0.75rem] font-semibold tracking-[0.3em] text-white/85 uppercase">{children}</h2>;
}

/** A link row: the label, an arrow that leans in on hover, a hairline under it. */
function Row({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="footer-row group flex min-h-11 items-center justify-between gap-4 border-b border-white/10 text-[0.9375rem] text-white/90 transition-colors hover:border-brand-ink/60 hover:text-white"
      >
        {children}
        <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-brand-ink transition-transform duration-300 group-hover:translate-x-1.5" />
      </Link>
    </li>
  );
}

const badge =
  "footer-badge grid size-12 shrink-0 place-items-center rounded-full border border-brand-ink/50 bg-brand/15 text-brand-ink shadow-[0_0_24px_-6px_rgb(59_95_230/0.7)] transition-[transform,background-color,box-shadow] duration-300";

/**
 * The close of every page: the ask for a project, then the logo, pages, solutions and contact over
 * an animated backdrop (flowing waves, a turning globe, rising motes), and the legal strip.
 */
export async function Footer() {
  "use cache";
  cacheLife("content");
  const [settings, legal, services] = await Promise.all([getSettings(), getLegalSlugs(), getServices()]);
  const whatsapp = settings.whatsapp.replace(/\D/g, "");
  const message = "Hello D4DX, I'd like to talk about a new project.";
  const socials = [
    { label: "Facebook", href: settings.socials.facebook, icon: FacebookLogo },
    { label: "Instagram", href: settings.socials.instagram, icon: InstagramLogo },
    { label: "LinkedIn", href: settings.socials.linkedin, icon: LinkedinLogo },
    { label: "WhatsApp", href: whatsapp ? `https://wa.me/${whatsapp}` : "", icon: WhatsappLogo },
  ].filter((s) => s.href);

  return (
    <footer className="theme-dark footer-surface relative isolate overflow-hidden pb-36 lg:pb-0">
      <FooterBackdrop />
      <div className="frame relative">
        <section aria-labelledby="cta-title" className="hidden grid-cols-1 gap-y-8 pt-20 pb-12 md:grid md:grid-cols-12 md:pt-28 md:pb-14">
          <div className="md:col-span-8 lg:col-span-7">
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-[0.14em] text-white/85 uppercase ring-1 ring-white/15 backdrop-blur-sm">
              <span aria-hidden="true" className="ai-dot size-1.5 rounded-full bg-[#8fb0ff]" />
              Let&apos;s build together
            </p>
            <TitleFx as="h2" id="cta-title" className="mt-5 text-[clamp(2rem,4vw,3.5rem)] leading-[1.04] font-semibold tracking-[-0.03em] text-white">
              Have a <span className="text-shine">project</span> in mind?
            </TitleFx>
            <p className="mt-4 max-w-[44ch] text-[length:var(--step-lead)] leading-snug text-white/80">
              Tell us who will use it and what it must do on day one. We will call you back to talk it through.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/contact" className="btn bg-white text-brand hover:bg-white/90">
                Get started
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              {whatsapp ? (
                <a
                  href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link inline-flex min-h-11 items-center font-medium text-white"
                >
                  Message on WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        </section>

        <div aria-hidden="true" className="footer-rule hidden h-px md:block" />

        <div className="hidden grid-cols-1 gap-x-10 gap-y-12 py-14 md:grid md:grid-cols-12 md:py-16">
          <div className="md:col-span-12 lg:col-span-4">
            <Link href="/" aria-label="D4DX Innovations, home" className="inline-flex min-h-11 items-center">
              <Logo className="h-12 w-auto" sizes="180px" />
            </Link>
            <p className="mt-5 max-w-[34ch] text-[1.0625rem] leading-relaxed text-white/75">
              Building digital products that create value, connect people and make an impact.
            </p>
            {socials.length ? (
              <ul aria-label="Follow us" className="mt-7 flex flex-wrap gap-3">
                {socials.map(({ label, href, icon: Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="footer-social grid size-12 place-items-center rounded-full border border-brand-ink/45 bg-brand/10 text-white transition-[transform,background-color,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-brand-ink hover:bg-brand hover:shadow-[0_12px_28px_-8px_rgb(45_80_210/0.95)]"
                    >
                      <Icon weight="fill" aria-hidden="true" className="size-5" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <nav aria-label="Footer" className="grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 md:col-span-7 lg:col-span-5 lg:border-x lg:border-white/10 lg:px-10">
            <div>
              <Heading>Quick links</Heading>
              <ul className="mt-5 flex flex-col">
                {NAV.map((item) => (
                  <Row key={item.href} href={item.href}>
                    {item.label}
                  </Row>
                ))}
                <Row href="/contact">Contact</Row>
              </ul>
            </div>
            {services.length ? (
              <div>
                <Heading>Our solutions</Heading>
                <ul className="mt-5 flex flex-col">
                  {services.map((s) => (
                    <Row key={s.id} href={`/services#${s.slug}`}>
                      {s.title}
                    </Row>
                  ))}
                </ul>
              </div>
            ) : null}
          </nav>

          <div className="md:col-span-5 lg:col-span-3">
            <Heading>Contact us</Heading>
            <address className="mt-5 flex flex-col gap-5 text-[0.9375rem] leading-relaxed not-italic text-white/90">
              {settings.addressLines.length ? (
                <div className="group flex items-center gap-4">
                  <span className={badge}>
                    <MapPin weight="fill" aria-hidden="true" className="size-5" />
                  </span>
                  {settings.mapUrl ? (
                    <a href={settings.mapUrl} target="_blank" rel="noopener noreferrer" className="link">
                      {settings.addressLines.join(", ")}
                    </a>
                  ) : (
                    <span>{settings.addressLines.join(", ")}</span>
                  )}
                </div>
              ) : null}
              {settings.email ? (
                <a href={`mailto:${settings.email}`} className="group flex items-center gap-4">
                  <span className={badge}>
                    <Mail weight="fill" aria-hidden="true" className="size-5" />
                  </span>
                  <span className="link">{settings.email}</span>
                </a>
              ) : null}
              {settings.phone ? (
                <a href={telHref(settings.phone)} className="group flex items-center gap-4 num">
                  <span className={badge}>
                    <Phone weight="fill" aria-hidden="true" className="size-5" />
                  </span>
                  <span className="link">{settings.phone}</span>
                </a>
              ) : null}
            </address>
          </div>
        </div>

        <div className="footer-rule hidden h-px md:block" aria-hidden="true" />
        <div className="hidden flex-col gap-4 py-7 text-[0.8125rem] leading-relaxed text-white/70 md:flex lg:flex-row lg:items-center lg:justify-between">
          <p>© {new Date().getFullYear()} D4DX Innovations LLP. All rights reserved.</p>
          <ul className="flex flex-wrap items-center gap-y-1">
            {legal.map((p) => (
              <li key={p.slug} className="flex items-center">
                <Link href={`/legal/${p.slug}`} className="link inline-flex min-h-11 items-center px-4 first:pl-0 lg:first:pl-4">
                  {p.title}
                </Link>
                <span aria-hidden="true" className="h-4 w-px bg-brand-ink/50 last:hidden" />
              </li>
            ))}
          </ul>
          <p>
            Powered by{" "}
            <Link href="/" className="link font-semibold text-brand-ink">
              D4DX Innovations
            </Link>
          </p>
        </div>

        {/* On a phone the footer is two rows: how to reach us (address and social icons), then the small print. */}
        <div className="md:hidden">
          <div aria-hidden="true" className="footer-rule h-px" />
          <div className="flex flex-col items-center gap-5 pt-9 pb-8 text-center">
            <address className="flex flex-col items-center gap-2.5 text-[0.8125rem] leading-snug not-italic text-white/85">
              {settings.addressLines.length ? (
                <p className="flex max-w-[30ch] items-start justify-center gap-2">
                  <MapPin weight="fill" aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-ink" />
                  {settings.mapUrl ? (
                    <a href={settings.mapUrl} target="_blank" rel="noopener noreferrer" className="link">
                      {settings.addressLines.join(", ")}
                    </a>
                  ) : (
                    <span>{settings.addressLines.join(", ")}</span>
                  )}
                </p>
              ) : null}
              {settings.email ? (
                <a href={`mailto:${settings.email}`} className="inline-flex items-center gap-2">
                  <Mail weight="fill" aria-hidden="true" className="size-4 text-brand-ink" />
                  <span className="link">{settings.email}</span>
                </a>
              ) : null}
              {settings.phone ? (
                <a href={telHref(settings.phone)} className="inline-flex items-center gap-2 num">
                  <Phone weight="fill" aria-hidden="true" className="size-4 text-brand-ink" />
                  <span className="link">{settings.phone}</span>
                </a>
              ) : null}
            </address>
            {socials.length ? (
              <ul aria-label="Follow us" className="flex justify-center gap-3">
                {socials.map(({ label, href, icon: Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="footer-social grid size-11 place-items-center rounded-full border border-brand-ink/45 bg-brand/10 text-white transition-[transform,background-color] duration-300 active:scale-90"
                    >
                      <Icon weight="fill" aria-hidden="true" className="size-5" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div aria-hidden="true" className="footer-rule h-px" />
          <p className="px-2 py-5 text-center text-[0.6875rem] leading-[1.9] text-white/60">
            © {new Date().getFullYear()} D4DX Innovations LLP. All rights reserved.{" "}
            {legal.map((p, i) => (
              <span key={p.slug}>
                {i > 0 ? " " : null}
                <span className="whitespace-nowrap">
                  <Link href={`/legal/${p.slug}`} className="link inline-block py-1">
                    {p.title}
                  </Link>
                  {i < legal.length - 1 ? <span aria-hidden="true"> ·</span> : null}
                </span>
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
