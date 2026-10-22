import { ShimmerImage } from "@/components/media/shimmer-image";
import { Tilt } from "@/components/motion/tilt";
import type { Platform, ProjectIndexEntry } from "@/lib/types";

const PLATFORM_LABEL: Record<Platform, string> = { android: "Android", ios: "iOS", web: "Web", desktop: "Desktop" };

function host(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** A browser window drawn in CSS around a real screenshot of the site. */
function BrowserFrame({ project }: { project: ProjectIndexEntry }) {
  const image = project.shot ?? project.cover;
  const address = host(project.website);
  return (
    <div className="overflow-hidden rounded-xl bg-[#e8ebf2]">
      <div className="flex h-9 items-center gap-1.5 px-3.5" aria-hidden="true">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        {address ? (
          <span className="mx-auto max-w-[60%] truncate rounded-md bg-white px-3 py-0.5 text-xs text-[#4b5263]">{address}</span>
        ) : null}
      </div>
      <ShimmerImage
        media={image}
        alt={address ? `${address}, the live site` : `${project.title}, the live site`}
        fill
        sizes="(min-width: 1024px) 58vw, 100vw"
        className="aspect-[16/10] bg-white"
        imgClassName="object-top transition-transform duration-700 ease-[var(--ease-soft)] group-hover:scale-[1.03]"
      />
    </div>
  );
}

/** A screen from the shipped app, with what it runs on floating in front of it. */
function AppShot({ project }: { project: ProjectIndexEntry }) {
  const image = project.shot ?? project.cover;
  return (
    <>
      <ShimmerImage
        media={image}
        alt={`${project.title}, screens from the app`}
        fill
        sizes="(min-width: 1024px) 58vw, 100vw"
        className="aspect-[16/10] rounded-xl bg-raised-2"
        imgClassName="transition-transform duration-700 ease-[var(--ease-soft)] group-hover:scale-[1.03]"
      />
      {project.platforms.length ? (
        <div className="tilt-pop pointer-events-none absolute top-3 left-3 flex flex-wrap gap-1.5">
          {project.platforms.map((p) => (
            <span key={p} className="rounded-full bg-ground/90 px-2.5 py-1 text-xs font-medium text-ink">
              {PLATFORM_LABEL[p]}
            </span>
          ))}
        </div>
      ) : null}
      {project.onStores ? (
        <span className="tilt-pop pointer-events-none absolute right-3 bottom-3 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-on-brand">
          Live on the stores
        </span>
      ) : null}
    </>
  );
}

/** The picture at the head of a service card: the proof project's own screens, leaning toward the pointer. */
export function ServiceVisual({ project }: { project: ProjectIndexEntry }) {
  const isSite = project.platforms.length > 0 && project.platforms.every((p) => p === "web");
  return <Tilt className="relative">{isSite ? <BrowserFrame project={project} /> : <AppShot project={project} />}</Tilt>;
}
