"use server";

import { getSupabasePublicClient } from "@/lib/supabase/public";
import { notifyNewInquiry } from "@/lib/leads/notify";
import type { ContactActionState } from "@/lib/leads/types";

const MAX_NAME = 120;
const MAX_COMPANY = 120;
const MAX_LOCATION = 120;
const MAX_MESSAGE = 2000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Stores a "Talk to an Expert" enquiry.
 *
 * The form is anonymous by design, so the insert runs through the anonymous client and is
 * constrained by the RLS insert policy on `contact_submissions` (no read access for anon).
 */
export async function submitContactEnquiry(
  _: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  // Bots fill every field they find; humans never see this one.
  if (text(formData, "website")) {
    return { status: "success" };
  }

  const fieldErrors: Record<string, string> = {};
  const name = text(formData, "name");
  const email = text(formData, "email");
  const company = text(formData, "company");
  const location = text(formData, "location");
  const message = text(formData, "message");
  const sourcePath = text(formData, "sourcePath");

  if (!name) fieldErrors.name = "Enter your name.";
  else if (name.length > MAX_NAME) fieldErrors.name = "That name is too long.";

  if (!email) fieldErrors.email = "Enter your work e-mail.";
  else if (!EMAIL_PATTERN.test(email)) fieldErrors.email = "Enter a valid e-mail address.";

  if (company.length > MAX_COMPANY) fieldErrors.company = "That company name is too long.";
  if (location.length > MAX_LOCATION) fieldErrors.location = "That location is too long.";
  if (message.length > MAX_MESSAGE) fieldErrors.message = "Please shorten your message.";

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", error: "Please correct the highlighted fields.", fieldErrors };
  }

  const supabase = getSupabasePublicClient();
  if (!supabase) {
    return { status: "error", error: "This form is not connected in this environment." };
  }

  const { error } = await supabase.from("contact_submissions").insert({
    name,
    email,
    company,
    location,
    message,
    source_path: sourcePath,
  });

  if (error) {
    console.error("[leads] Failed to store contact enquiry", error);
    return { status: "error", error: "Your message could not be sent. Please try again." };
  }

  // The enquiry is stored before this runs, so a notification failure is reported server-side and
  // never changes what the visitor sees. It is awaited rather than dispatched after the response,
  // because a serverless function may be frozen the moment the response is sent.
  await notifyNewInquiry({ name, email, company, location, message, sourcePath });

  return { status: "success" };
}
