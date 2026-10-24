import { z } from "zod";

/** Shared by the contact form in the browser and the server action that stores it. */
export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  email: z.email("Please enter a valid email address.").trim().max(160),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[+\d\s()-]*$/, "Use digits, spaces and + only."),
  service: z.string().trim().max(40),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters).").max(4000),
  /** Honeypot: people never see it, so anything in it came from a bot. */
  website: z.string().max(0).optional(),
});
export type InquiryInput = z.infer<typeof inquirySchema>;

// http(s) only: these links are shown to admins, so other schemes (javascript:, data:) are refused.
const optionalUrl = z.union([z.literal(""), z.url({ protocol: /^https?$/, message: "Enter a full link starting with https://" }).max(300)]);

const required = (what: string, max: number) => z.string().trim().min(1, `Please enter ${what}.`).max(max);
const optional = (max: number) => z.string().trim().max(max);

export const EXPERIENCE_LEVELS = ["Fresher", "Experienced", "Intern"] as const;

/** Everything the Apply Now form asks. The honeypot `website` stays empty for people. */
export const applicationSchema = z.object({
  position: z.string().trim().min(1, "Choose a position.").max(100),
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  email: z.email("Please enter a valid email address.").trim().max(160),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter your mobile number.")
    .max(30)
    .regex(/^[+\d\s()-]+$/, "Use digits, spaces and + only."),
  dob: z.iso.date("Please enter your date of birth."),
  street: optional(160),
  address2: optional(160),
  city: optional(80),
  state: optional(80),
  zip: optional(20),
  country: optional(60),
  qualification: required("your highest qualification", 120),
  course: required("your degree or course name", 120),
  specialization: optional(120),
  institution: required("your university or institution", 160),
  graduationYear: required("your year of graduation", 20),
  grade: optional(40),
  experience: z.enum(EXPERIENCE_LEVELS, { message: "Choose one." }),
  keySkills: required("your key skills", 1500),
  designation: optional(120),
  notice: required("your notice period or when you can join", 120),
  primarySkills: optional(800),
  secondarySkills: optional(800),
  frameworks: optional(800),
  tools: optional(800),
  databases: optional(800),
  projectExperience: optional(2000),
  projectDescription: optional(2000),
  portfolioUrl: optionalUrl,
  githubUrl: optionalUrl,
  otherLinks: optional(1000),
  relocate: optional(120),
  consentAccurate: z.boolean().refine((v) => v, { message: "Please confirm the information is accurate and complete." }),
  consentData: z.boolean().refine((v) => v, { message: "Please agree to the use of your information for recruitment." }),
  website: z.string().max(0).optional(),
});
export type ApplicationInput = z.infer<typeof applicationSchema>;
