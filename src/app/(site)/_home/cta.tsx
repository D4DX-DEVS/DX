import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import mavoor from "@/assets/mavoor-road.jpg";
import { MarkIcon } from "@/components/brand/logo";
import { getSettings } from "@/lib/data/public";

/** The close: a blue card asking for the project, the studio's street beside it. */
export async function Cta() {
  const settings = await getSettings();
  const phone = settings.whatsapp.replace(/\D/g, "");
  const message = "Hello D4DX, I'd like to talk about a new project.";

  return (
    <section aria-labelledby="cta-title" className="frame py-[var(--section-gap)]">
      <div className="relative grid grid-cols-1 overflow-hidden rounded-3xl bg-brand text-white md:grid-cols-12">
        <MarkIcon className="pointer-events-none absolute -bottom-[30%] -left-[8%] w-[min(60vw,420px)] text-white/[0.07]" />
        <div className="relative flex flex-col justify-center p-8 sm:p-10 md:col-span-7 md:p-14">
          <p className="text-xs font-semibold tracking-[0.14em] text-white/75 uppercase">Let&apos;s build together</p>
          <h2 id="cta-title" className="mt-3 text-[clamp(1.875rem,3.4vw,3rem)] leading-[1.05] font-semibold tracking-[-0.03em]">
            Have a project in mind?
          </h2>
          <p className="mt-4 max-w-[42ch] text-[length:var(--step-lead)] leading-snug text-white/85">
            Tell us who will use it and what it must do on day one. We will call you back to talk it through.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/contact" className="btn bg-white text-brand hover:bg-white/90">
              Get started
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            {phone ? (
              <a
                href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link inline-flex min-h-11 items-center font-medium"
              >
                Message on WhatsApp
              </a>
            ) : null}
          </div>
        </div>
        <div className="relative min-h-56 md:col-span-5 md:min-h-full">
          <Image
            src={mavoor}
            alt="Mavoor Road, Kozhikode, where the studio is"
            placeholder="blur"
            fill
            sizes="(min-width: 768px) 40vw, 100vw"
            className="object-cover object-[50%_42%]"
          />
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-brand via-transparent to-transparent md:bg-gradient-to-r" />
        </div>
      </div>
    </section>
  );
}
