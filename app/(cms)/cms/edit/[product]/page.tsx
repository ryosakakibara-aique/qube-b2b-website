import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/cms/product-form";
import { getProductBySlug } from "@/lib/products/queries";

export default async function CmsEditProductPage({
  params,
}: {
  params: Promise<{ product: string }>;
}) {
  const { product } = await params;
  const productData = await getProductBySlug(product);
  if (!productData) notFound();
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <Link href="/cms/products" className="text-[10px] text-[#52525b]">
            ‹&nbsp; Back to Product List
          </Link>
          <h1 className="mt-4 text-lg font-bold">Edit Product Content</h1>
          <p className="mt-1 text-[10px] text-[#71717a]">
            Last updated: 9/13/2025, 4:22 PM
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/cms/products"
            className="rounded-lg border border-[#94a3b8] px-3 py-1 text-[10px]"
          >
            Cancel
          </Link>
          <button
            form="edit-product-form"
            type="submit"
            className="rounded-lg bg-[#3f3f46] px-3 py-1 text-[10px] font-bold text-white"
          >
            Save
          </button>
        </div>
      </div>
      <ProductForm formId="edit-product-form" product={productData} />
    </section>
  );
}
