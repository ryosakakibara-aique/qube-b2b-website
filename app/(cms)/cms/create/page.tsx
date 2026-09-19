import Link from "next/link";
import { Notice } from "@/components/ui/notice";
import { ProductForm } from "@/components/cms/product-form";
import { canEditContent } from "@/lib/auth/roles";
import { getSessionUser } from "@/lib/auth/session";

export default async function CmsCreatePage() {
  const user = await getSessionUser();
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
          <h1 className="mt-4 text-lg font-bold">Add Product Content</h1>
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">
            New products are saved as drafts. Publish them from the product list
            when they are ready to appear on the website.
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
              form="create-product-form"
              type="submit"
              className="rounded-[var(--radius-chip)] bg-[var(--cms-surface)] px-3 py-1 text-[10px] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
            >
              Save
            </button>
          </div>
        ) : null}
      </div>

      {canEdit ? (
        <ProductForm formId="create-product-form" />
      ) : (
        <Notice variant="error">
          Your account does not have permission to create products.
        </Notice>
      )}
    </section>
  );
}
