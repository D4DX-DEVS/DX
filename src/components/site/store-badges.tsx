import { AppleLogo, GooglePlayLogo, Smartphone } from "@/components/icons";
import { cn } from "@/lib/utils";

interface BadgeProps {
  href: string;
  /** The app's name, for the link's accessible name. */
  app: string;
  className?: string;
  /** "dark" is the black badge; "outline" is the quiet grey-outlined one for light pages. */
  variant?: "dark" | "outline";
}

const base =
  "store-badge group inline-flex h-14 min-w-[10.5rem] items-center gap-3 rounded-xl bg-black px-4 text-white ring-1 ring-white/35 transition-[transform,box-shadow,background-color] duration-300 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:bg-[#0b0b0f] hover:ring-white/70 hover:shadow-[0_14px_30px_-12px_rgb(255_255_255/0.28)] active:scale-[0.97]";

/** "Get it on Google Play": a black badge in the store's familiar shape. */
export function GooglePlayBadge({ href, app, className, variant = "dark" }: BadgeProps) {
  if (variant === "outline") {
    return (
      <OutlineBadge
        href={href}
        label={`Get ${app} on Google Play`}
        small="Android app on"
        big="Google Play"
        icon={<GooglePlayLogo weight="fill" aria-hidden="true" className="size-8 shrink-0 transition-transform duration-300 group-hover:scale-110" />}
        className={className}
      />
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Get ${app} on Google Play`} className={cn(base, className)}>
      <GooglePlayLogo weight="fill" aria-hidden="true" className="size-7 shrink-0 transition-transform duration-300 group-hover:scale-110" />
      <span className="flex flex-col leading-none">
        <span className="text-[0.625rem] font-medium tracking-[0.12em] uppercase">Get it on</span>
        <span className="mt-1 text-[1.1875rem] font-semibold tracking-[-0.01em]">Google Play</span>
      </span>
    </a>
  );
}

/** "Download on the App Store": the same badge for Apple's store. */
export function AppStoreBadge({ href, app, className, variant = "dark" }: BadgeProps) {
  if (variant === "outline") {
    return (
      <OutlineBadge
        href={href}
        label={`Download ${app} on the App Store`}
        small="Available on the"
        big="App Store"
        icon={<Smartphone weight="bold" aria-hidden="true" className="size-8 shrink-0 transition-transform duration-300 group-hover:scale-110" />}
        className={className}
      />
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Download ${app} on the App Store`} className={cn(base, className)}>
      <AppleLogo weight="fill" aria-hidden="true" className="size-7 shrink-0 transition-transform duration-300 group-hover:scale-110" />
      <span className="flex flex-col leading-none">
        <span className="text-[0.625rem] font-medium tracking-[0.04em]">Download on the</span>
        <span className="mt-1 text-[1.1875rem] font-semibold tracking-[-0.01em]">App Store</span>
      </span>
    </a>
  );
}

const outline =
  "group inline-flex h-16 min-w-[11.5rem] items-center gap-3.5 rounded-xl border-2 border-[#555b66] bg-transparent px-4 text-[#555b66] transition-[transform,background-color,color,border-color] duration-300 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-ink hover:bg-ink/[0.04] hover:text-ink active:scale-[0.97]";

/** The outlined store badge: a grey frame, a small line over a big store name, as in the stores' one-colour artwork. */
function OutlineBadge({ href, label, small, big, icon, className }: { href: string; label: string; small: string; big: string; icon: React.ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={cn(outline, className)}>
      {icon}
      <span className="flex flex-col leading-none">
        <span className="text-[0.6875rem] font-bold tracking-[0.06em] uppercase">{small}</span>
        <span className="mt-1 text-[1.5rem] font-medium tracking-[-0.02em]">{big}</span>
      </span>
    </a>
  );
}
