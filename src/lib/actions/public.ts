"use server";

import { z } from "zod";
import { FORM_RULE, hit } from "@/lib/auth/throttle";
import { newId, nowIso, run } from "@/lib/db";
import { logger } from "@/lib/logger";
import { MediaError, savePrivatePdf } from "@/lib/media";
import { MAX_PDF_BYTES } from "@/lib/media-utils";
import { clientIp } from "@/lib/request";
import { applicationSchema, inquirySchema, type InquiryInput } from "@/lib/schemas/forms";
import type { ActionResult } from "@/lib/types";

const BUSY: ActionResult = { ok: false, message: "Too many messages from this connection. Please try again in a few minutes." };
const FAILED: ActionResult = { ok: false, message: "Something went wrong on our side. Please try again, or email us directly." };

/** The contact form: validated again here, throttled per IP, stored in the admin inbox. */
export async function submitInquiry(input: InquiryInput): Promise<ActionResult> {
  const parsed = inquirySchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Please check the form.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  // A filled honeypot gets the same answer as a real message, and nothing is stored.
  if (parsed.data.website) return { ok: true };

  try {
    if (!(await hit("inquiry", [await clientIp()], FORM_RULE))) return BUSY;
    const { name, email, phone, service, message } = parsed.data;
    const now = nowIso();
    await run(
      "INSERT INTO inquiries (id, name, email, phone, service, message, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?)",
      [newId(), name, email, phone, service, message, now, now],
    );
    return { ok: true };
  } catch (error: unknown) {
    logger.error("inquiry failed", error);
    return FAILED;
  }
}

function text(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

/** A job application with its résumé (a PDF, kept outside the public media folder). */
const APPLICATION_TEXT = [
  "position", "name", "email", "phone", "dob", "street", "address2", "city", "state", "zip", "country",
  "qualification", "course", "specialization", "institution", "graduationYear", "grade", "experience",
  "keySkills", "designation", "notice", "primarySkills", "secondarySkills", "frameworks", "tools", "databases",
  "projectExperience", "projectDescription", "portfolioUrl", "githubUrl", "otherLinks", "relocate", "website",
] as const;

/** The Apply Now form: validated again here, throttled per IP, with the résumé (and any certificates) kept privately. */
export async function submitApplication(form: FormData): Promise<ActionResult> {
  const raw: Record<string, unknown> = Object.fromEntries(APPLICATION_TEXT.map((key) => [key, text(form, key)]));
  raw.consentAccurate = text(form, "consentAccurate") === "true";
  raw.consentData = text(form, "consentData") === "true";
  const parsed = applicationSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Please check the form.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  if (parsed.data.website) return { ok: true };

  const resume = form.get("resume");
  if (!(resume instanceof File) || resume.size === 0) {
    return { ok: false, message: "Please attach your résumé.", fieldErrors: { resume: ["Attach your résumé as a PDF."] } };
  }
  if (resume.size > MAX_PDF_BYTES) {
    return { ok: false, message: "The résumé is too large.", fieldErrors: { resume: ["The résumé must be 5 MB or smaller."] } };
  }
  const certificates = form.get("certificates");
  const hasCertificates = certificates instanceof File && certificates.size > 0;
  if (hasCertificates && certificates.size > MAX_PDF_BYTES) {
    return { ok: false, message: "The certificates file is too large.", fieldErrors: { certificates: ["Certificates must be 5 MB or smaller."] } };
  }

  try {
    if (!(await hit("application", [await clientIp()], FORM_RULE))) return BUSY;
    const stored = await savePrivatePdf(Buffer.from(await resume.arrayBuffer()), resume.name);
    const certs = hasCertificates ? await savePrivatePdf(Buffer.from(await certificates.arrayBuffer()), certificates.name) : "";
    const d = parsed.data;
    // What does not have a column of its own is kept whole, so the admin can show every answer.
    const details = {
      dateOfBirth: d.dob,
      address: { street: d.street, line2: d.address2, city: d.city, state: d.state, zip: d.zip, country: d.country },
      education: { qualification: d.qualification, course: d.course, specialization: d.specialization, institution: d.institution, graduationYear: d.graduationYear, grade: d.grade },
      professional: { designation: d.designation, notice: d.notice, keySkills: d.keySkills },
      skills: { primary: d.primarySkills, secondary: d.secondarySkills, frameworks: d.frameworks, tools: d.tools, databases: d.databases },
      projects: { experience: d.projectExperience, description: d.projectDescription, otherLinks: d.otherLinks },
      relocate: d.relocate,
    };
    const now = nowIso();
    await run(
      `INSERT INTO applications (id, position, name, email, phone, experience, portfolio_url, github_url, message, resume, certificates, details, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`,
      [newId(), d.position, d.name, d.email, d.phone, d.experience, d.portfolioUrl, d.githubUrl, d.keySkills.slice(0, 3000), stored, certs, details, now, now],
    );
    return { ok: true };
  } catch (error: unknown) {
    if (error instanceof MediaError) return { ok: false, message: error.message, fieldErrors: { resume: [error.message] } };
    logger.error("application failed", error);
    return FAILED;
  }
}
