/** Plain, serialisable shapes that cross from the data layer into components. */

export interface Media {
  url: string;
  width: number;
  height: number;
  blur: string;
  alt: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string;
  count: number;
}

export interface ProjectCard {
  id: string;
  title: string;
  slug: string;
  client: string;
  year: number | null;
  category: { name: string; slug: string };
  cover: Media;
}

export type Platform = "android" | "ios" | "web" | "desktop";

/** A project card with its cover first, then a few gallery screens. */
export interface ProjectReel extends ProjectCard {
  frames: Media[];
}

export interface ProjectDetail extends ProjectCard {
  summary: string;
  body: string;
  features: string[];
  platforms: Platform[];
  links: { playStore: string; appStore: string; website: string };
  gallery: Media[];
  date: string | null;
}

export interface ProjectNeighbour {
  slug: string;
  title: string;
  cover: Media;
}

/** Every published project in display order, with what the home page needs beyond the cover. */
export interface ProjectIndexEntry extends ProjectNeighbour {
  /** A gallery screen that is not a copy of the cover (the first gallery image usually is), or null. */
  shot: Media | null;
  website: string;
  /** Has a Google Play or App Store listing. */
  onStores: boolean;
  platforms: Platform[];
  year: number | null;
}

export interface ServiceDTO {
  id: string;
  title: string;
  slug: string;
  summary: string;
  proof: string;
  points: string[];
  proofProject: ProjectIndexEntry | null;
}

export interface TeamMemberDTO {
  id: string;
  name: string;
  role: string;
  photo: Media | null;
  linkedin: string;
}

export interface TestimonialDTO {
  id: string;
  quote: string;
  name: string;
  role: string;
  context: string;
  projectSlug: string;
}

export interface PostCard {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover: Media | null;
  tags: string[];
  publishedAt: string | null;
}

export interface PostDetail extends PostCard {
  content: string;
}

export interface JobDTO {
  id: string;
  title: string;
  slug: string;
  level: string;
  experience: string;
  location: string;
  summary: string;
  requirements: string[];
}

export interface SiteSettings {
  tagline: string;
  email: string;
  careersEmail: string;
  phone: string;
  careersPhone: string;
  whatsapp: string;
  addressLines: string[];
  mapUrl: string;
  socials: { linkedin: string; instagram: string; facebook: string };
}

export interface LegalPageDTO {
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
}

export interface HeroWindow {
  key: "tall" | "top" | "bottom";
  slides: { title: string; slug: string; category: string; categorySlug: string; image: Media }[];
}

export interface ActionResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  id?: string;
}
