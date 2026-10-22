/**
 * Cache tags. Every public read is cached under the tags of the entities it reads, and every
 * admin save calls updateTag() for exactly the entities it changed, so a team edit never
 * throws away the cached work pages and vice versa.
 */
export const TAGS = {
  settings: "settings",
  categories: "categories",
  projects: "projects",
  project: (slug: string) => `project:${slug}`,
  services: "services",
  team: "team",
  testimonials: "testimonials",
  posts: "posts",
  post: (slug: string) => `post:${slug}`,
  jobs: "jobs",
  pages: "pages",
  page: (slug: string) => `page:${slug}`,
} as const;
