import Link from "next/link";
import { notFound } from "next/navigation";
import { Notice } from "@/components/ui/notice";
import { ProductForm } from "@/components/cms/product-form";
import { canEditContent } from "@/lib/auth/roles";
import { getSessionUser } from "@/lib/auth/session";
import { formatTimestamp } from "@/lib/format";
import { getCmsProductBySlug } from "@/lib/products/cms";

export default async function CmsEditProductPage({
  params,
}: {
  params: Promise<{ product: string }>;
}) {
  const { product } = await params;

  const [result, user] = await Promise.all([
    getCmsProductBySlug(product),
    getSessionUser(),
  ]);

  if (!result.ok) {
    return (
      <section className="space-y-5">
        <Notice variant="error">{result.error}</Notice>
        <Link href="/cms/products" className="text-[10px] underline">
          &lsaquo;&nbsp; Back to Product List
        </Link>
      </section>
    );
  }

  if (!result.data) notFound();

  const productData = result.data;
  const canEdit = user ? canEditContent(user.role) : false;

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Link
            href="/cms/products"
            className="text-[10px] text-[var(--text-muted)] hover:underline"
          >
            &lsaquo;&nbsp; Back to Product List
          </Link>
          <h1 className="mt-4 text-lg font-bold">Edit Product Content</h1>
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">
            Last updated: {formatTimestamp(productData.updatedAt)}
            {productData.published ? "" : " | Draft"}
          </p>
        </div>
        {canEdit ? (
          <div className="flex gap-2">
            <Link
              href="/cms/products"
              className="rounded-[var(--radius-chip)] border border-[var(--border)] px-3 py-1 text-[10px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
            >
              Cancel
            </Link>
            <button
              form="edit-product-form"
              type="submit"
              className="rounded-[var(--radius-chip)] bg-[var(--cms-surface)] px-3 py-1 text-[10px] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
            >
              Save
            </button>
          </div>
        ) : null}
      </div>

      {canEdit ? (
        <ProductForm formId="edit-product-form" product={productData} />
      ) : (
        <Notice variant="error">
          Your account does not have permission to edit products.
        </Notice>
      )}
    </section>
  );
}
