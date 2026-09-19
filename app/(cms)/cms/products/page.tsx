import Link from "next/link";
import { Notice } from "@/components/ui/notice";
import { PublishToggle } from "@/components/cms/publish-toggle";
import { canEditContent } from "@/lib/auth/roles";
import { getSessionUser } from "@/lib/auth/session";
import { formatTimestamp } from "@/lib/format";
import { CMS_PAGE_SIZE, getCmsProducts } from "@/lib/products/cms";

export default async function CmsProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; saved?: string }>;
}) {
  const params = await searchParams;
  const parsedPage = Number.parseInt(params.page ?? "1", 10);

  const [result, user] = await Promise.all([
    getCmsProducts(Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1),
    getSessionUser(),
  ]);

  const canEdit = user ? canEditContent(user.role) : false;
  const page = result.ok ? result.data.page : 1;
  const pageCount = result.ok ? result.data.pageCount : 1;
  const products = result.ok ? result.data.products : [];
  const total = result.ok ? result.data.total : 0;
  const firstRow = total === 0 ? 0 : (page - 1) * CMS_PAGE_SIZE + 1;
  const lastRow = Math.min(total, (page - 1) * CMS_PAGE_SIZE + products.length);

  return (
    <section className="rounded-[28px] border border-[var(--border-subtle)] px-6 py-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-bold">Edit Product List</h1>
        {canEdit ? (
          <Link
            href="/cms/create"
            className="rounded-[var(--radius-control)] bg-[var(--cms-surface)] px-6 py-2 text-xs font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
          >
            Add Product
          </Link>
        ) : null}
      </div>

      {params.saved ? (
        <div className="mt-4">
          <Notice variant="success">
            Saved &ldquo;{params.saved}&rdquo;.
          </Notice>
        </div>
      ) : null}

      {!canEdit && user ? (
        <div className="mt-4">
          <Notice variant="info">
            Your account has read-only access, so products cannot be changed here.
          </Notice>
        </div>
      ) : null}

      {!result.ok ? (
        <div className="mt-4">
          <Notice variant="error">{result.error}</Notice>
        </div>
      ) : null}

      <div className="mt-8 min-h-[512px] overflow-hidden rounded-[var(--radius-card-sm)] border border-[var(--border-subtle)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">
              Products in the QUBE catalogue
            </caption>
            <thead className="border-b border-[var(--border)]">
              <tr>
                <th scope="col" className="px-4 py-4 font-bold">
                  Product Title
                </th>
                <th scope="col" className="px-4 py-4 font-bold">
                  Path
                </th>
                <th scope="col" className="px-4 py-4 font-bold">
                  Description
                </th>
                <th scope="col" className="px-4 py-4 font-bold">
                  Date Created
                </th>
                <th scope="col" className="px-4 py-4 font-bold">
                  Date Updated
                </th>
                <th scope="col" className="px-4 py-4 text-right font-bold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-[var(--border-subtle)] last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium">{product.title}</span>
                    {!product.published ? (
                      <span className="ml-2 rounded-full border border-[var(--border)] px-2 py-0.5 text-[9px] text-[var(--text-muted)]">
                        Draft
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    /products/{product.slug}
                  </td>
                  <td className="max-w-[330px] truncate px-4 py-3 text-[var(--text-muted)]">
                    {product.description}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--text-muted)]">
                    <time dateTime={product.createdAt}>
                      {formatTimestamp(product.createdAt)}
                    </time>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--text-muted)]">
                    <time dateTime={product.updatedAt}>
                      {formatTimestamp(product.updatedAt)}
                    </time>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      {canEdit ? (
                        <PublishToggle
                          id={product.id}
                          slug={product.slug}
                          published={product.published}
                          title={product.title}
                        />
                      ) : null}
                      <Link
                        href={`/cms/edit/${product.slug}`}
                        className="font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {total === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-[var(--text-muted)]"
                  >
                    No products yet.
                    {canEdit ? (
                      <>
                        {" "}
                        <Link href="/cms/create" className="font-bold underline">
                          Add the first product
                        </Link>
                        .
                      </>
                    ) : null}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 px-2 text-xs">
        <span className="text-[var(--text-muted)]">
          {total === 0
            ? "No products to show"
            : `Showing ${firstRow}-${lastRow} of ${total}`}
        </span>

        {pageCount > 1 ? (
          <nav className="flex items-center gap-3" aria-label="Pagination">
            {page > 1 ? (
              <Link href={`/cms/products?page=${page - 1}`} className="hover:underline">
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
              <Link href={`/cms/products?page=${page + 1}`} className="hover:underline">
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
