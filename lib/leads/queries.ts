import { createSupabaseServerClient } from "@/lib/supabase/server";
import { errorCode } from "@/lib/products/errors";
import type { DataResult } from "@/lib/result";

/**
 * CMS reads for customer enquiries.
 *
 * These rows hold names, e-mail addresses and messages, so the RLS policy allows **only
 * administrators** to select them. An editor or viewer running this query gets zero rows and no
 * error, which is why the page checks the role before relying on the list.
 */

export const INQUIRY_PAGE_SIZE = 20;

export type Inquiry = {
  id: string;
  name: string;
  email: string;
  company: string;
  location: string;
  message: string;
  sourcePath: string;
  createdAt: string;
};

export type InquiryPage = {
  inquiries: Inquiry[];
  total: number;
  page: number;
  pageCount: number;
};

type InquiryRow = {
  id: string;
  name: string;
  email: string;
  company: string;
  location: string;
  message: string;
  source_path: string;
  created_at: string;
};

const INQUIRY_COLUMNS =
  "id,name,email,company,location,message,source_path,created_at";

export function mapInquiry(row: InquiryRow): Inquiry {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company,
    location: row.location,
    message: row.message,
    sourcePath: row.source_path,
    createdAt: row.created_at,
  };
}

export async function getInquiries(
  requestedPage: number,
): Promise<DataResult<InquiryPage>> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "Supabase is not configured for this environment." };

  try {
    const { count, error: countError } = await supabase
      .from("contact_submissions")
      .select("id", { count: "exact", head: true });
    if (countError) throw countError;

    const total = count ?? 0;
    const pageCount = Math.max(1, Math.ceil(total / INQUIRY_PAGE_SIZE));
    const page = Math.min(Math.max(1, requestedPage), pageCount);

    const { data, error } = await supabase
      .from("contact_submissions")
      .select(INQUIRY_COLUMNS)
      .order("created_at", { ascending: false })
      .range((page - 1) * INQUIRY_PAGE_SIZE, page * INQUIRY_PAGE_SIZE - 1);
    if (error) throw error;

    return {
      ok: true,
      data: {
        inquiries: ((data ?? []) as unknown as InquiryRow[]).map(mapInquiry),
        total,
        page,
        pageCount,
      },
    };
  } catch (error) {
    console.error("[cms:inquiries] Failed to load enquiries", error);
    return {
      ok: false,
      error:
        errorCode(error) === "PGRST205"
          ? "The enquiry table does not exist yet. Apply the migrations in supabase/migrations/ in order."
          : "The enquiries could not be loaded. Please try again.",
    };
  }
}
