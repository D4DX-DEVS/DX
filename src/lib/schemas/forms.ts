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

export const applicationSchema = z.object({
  position: z.string().trim().min(1, "Choose a position.").max(100),
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  email: z.email("Please enter a valid email address.").trim().max(160),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter your phone number.")
    .max(30)
    .regex(/^[+\d\s()-]+$/, "Use digits, spaces and + only."),
  experience: z.string().trim().max(40),
  portfolioUrl: optionalUrl,
  githubUrl: optionalUrl,
  message: z.string().trim().max(3000),
  website: z.string().max(0).optional(),
});
export type ApplicationInput = z.infer<typeof applicationSchema>;
