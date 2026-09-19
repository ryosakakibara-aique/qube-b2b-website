import Link from "next/link";
import { Notice } from "@/components/ui/notice";
import { getSessionUser } from "@/lib/auth/session";
import { formatTimestamp } from "@/lib/format";
import { INQUIRY_PAGE_SIZE, getInquiries } from "@/lib/leads/queries";

/**
 * Customer enquiries.
 *
 * Administrators only: these rows hold names, e-mail addresses and messages, and the RLS policy on
 * `contact_submissions` grants select to `admin` alone. The role is checked here as well so an
 * editor or viewer gets an explanation rather than an empty table that looks broken.
 */
export default async function CmsInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const parsedPage = Number.parseInt(params.page ?? "1", 10);
  const user = await getSessionUser();

  if (user?.role !== "admin") {
    return (
      <section className="space-y-5">
        <h1 className="text-lg font-bold">Customer Inquiries</h1>
        <Notice variant="error">
          Only administrators can read customer inquiries.
        </Notice>
      </section>
    );
  }

  const result = await getInquiries(
    Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1,
  );

  const page = result.ok ? result.data.page : 1;
  const pageCount = result.ok ? result.data.pageCount : 1;
  const inquiries = result.ok ? result.data.inquiries : [];
  const total = result.ok ? result.data.total : 0;
  const firstRow = total === 0 ? 0 : (page - 1) * INQUIRY_PAGE_SIZE + 1;
  const lastRow = Math.min(total, (page - 1) * INQUIRY_PAGE_SIZE + inquiries.length);

  return (
    <section className="rounded-[28px] border border-[var(--border-subtle)] px-6 py-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-bold">Customer Inquiries</h1>
        <p className="text-xs text-[var(--text-muted)]">
          {total === 0 ? "No inquiries yet" : `${total} total`}
        </p>
      </div>

      {!result.ok ? (
        <div className="mt-4">
          <Notice variant="error">{result.error}</Notice>
        </div>
      ) : null}

      <div className="mt-8 overflow-hidden rounded-[var(--radius-card-sm)] border border-[var(--border-subtle)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">
              Enquiries submitted through the website contact forms
            </caption>
            <thead className="border-b border-[var(--border)]">
              <tr>
                <th scope="col" className="px-4 py-4 font-bold">
                  Received
                </th>
                <th scope="col" className="px-4 py-4 font-bold">
                  Name
                </th>
                <th scope="col" className="px-4 py-4 font-bold">
                  E-mail
                </th>
                <th scope="col" className="px-4 py-4 font-bold">
                  Company
                </th>
                <th scope="col" className="px-4 py-4 font-bold">
                  Location
                </th>
                <th scope="col" className="px-4 py-4 font-bold">
                  Message
                </th>
                <th scope="col" className="px-4 py-4 font-bold">
                  Page
                </th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inquiry) => (
                <tr
                  key={inquiry.id}
                  className="border-b border-[var(--border-subtle)] align-top last:border-b-0"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--text-muted)]">
                    <time dateTime={inquiry.createdAt}>
                      {formatTimestamp(inquiry.createdAt)}
                    </time>
                  </td>
                  <td className="px-4 py-3 font-medium">{inquiry.name}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <a
                      href={`mailto:${inquiry.email}`}
                      className="underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                    >
                      {inquiry.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {inquiry.company || "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {inquiry.location || "—"}
                  </td>
                  <td className="max-w-[320px] whitespace-pre-line px-4 py-3">
                    {inquiry.message || "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {inquiry.sourcePath || "—"}
                  </td>
                </tr>
              ))}
              {total === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-[var(--text-muted)]"
                  >
                    No inquiries have been submitted yet. They will appear here as soon as
                    someone uses a contact form on the website.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 px-2 text-xs">
        <span className="text-[var(--text-muted)]">
          {total === 0 ? "Nothing to show" : `Showing ${firstRow}-${lastRow} of ${total}`}
        </span>

        {pageCount > 1 ? (
          <nav className="flex items-center gap-3" aria-label="Pagination">
            {page > 1 ? (
              <Link href={`/cms/inquiries?page=${page - 1}`} className="hover:underline">
                &lsaquo;&nbsp; Previous
              </Link>
            ) : (
              <span className="text-[var(--text-subtle)]">
                &lsaquo;&nbsp; Previous
              </span>
            )}

            <span aria-current="page" className="font-bold">
              Page {page} of {pageCount}
            </span>

            {page < pageCount ? (
              <Link href={`/cms/inquiries?page=${page + 1}`} className="hover:underline">
                Next&nbsp;&rsaquo;
              </Link>
            ) : (
              <span className="text-[var(--text-subtle)]">Next&nbsp;&rsaquo;</span>
            )}
          </nav>
        ) : null}
      </div>
    </section>
  );
}
