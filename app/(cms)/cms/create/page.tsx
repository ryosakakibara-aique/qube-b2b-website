import Link from "next/link";
import { ProductForm } from "@/components/cms/product-form";

export default function CmsCreatePage() {
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <Link href="/cms/products" className="text-[10px] text-[#52525b]">
            ‹&nbsp; Back to Product List
          </Link>
          <h1 className="mt-4 text-lg font-bold">Edit Product Content</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/cms/products"
            className="rounded-lg border border-[#94a3b8] px-3 py-1 text-[10px]"
          >
            Cancel
          </Link>
          <button
            form="create-product-form"
            type="submit"
            className="rounded-lg bg-[#3f3f46] px-3 py-1 text-[10px] font-bold text-white"
          >
            Save
          </button>
        </div>
      </div>
      <ProductForm formId="create-product-form" />
    </section>
  );
}
