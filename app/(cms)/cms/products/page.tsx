import Link from "next/link";
import { getProducts } from "@/lib/products/queries";

export default async function CmsProductsPage() {
  const products = (await getProducts()).slice(0, 4);

  return (
    <section className="rounded-[28px] border border-[#e2e8f0] px-6 py-6 lg:px-6 lg:py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Edit Product List</h1>
        <Link
          href="/cms/create"
          className="rounded-xl bg-[#3f3f46] px-6 py-2 text-xs font-bold text-white"
        >
          Add Product
        </Link>
      </div>
      <div className="mt-8 min-h-[512px] overflow-hidden rounded-2xl border border-[#e2e8f0]">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[#cbd5e1]">
            <tr>
              <th className="px-4 py-4 font-bold">Product Title</th>
              <th className="px-4 py-4 font-bold">Path</th>
              <th className="px-4 py-4 font-bold">Description</th>
              <th className="px-4 py-4 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr
                key={product.id}
                className={`border-b border-[#e2e8f0] ${index === 0 ? "bg-[#e2e8f0]" : ""}`}
              >
                <td className="px-4 py-3">{product.title}</td>
                <td className="px-4 py-3">/{product.slug}</td>
                <td className="max-w-[330px] truncate px-4 py-3">
                  Lorem ipsum dolor sit amet...
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-4">
                    <span
                      className={`relative inline-flex h-4 w-8 rounded-full ${index === 0 || index === 3 ? "bg-[#3f3f46]" : "bg-[#e2e8f0]"}`}
                    >
                      <span
                        className={`absolute top-0.5 h-3 w-3 rounded-full bg-white ${index === 0 || index === 3 ? "right-0.5" : "left-0.5"}`}
                      />
                    </span>
                    <Link
                      href={`/cms/edit/${product.slug}`}
                      className="font-bold"
                    >
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-[#71717a]"
                >
                  No products are available yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="mt-5 flex items-center justify-between px-2 text-xs">
        <span>
          Showing {products.length} of {products.length}
        </span>
        <nav className="flex items-center gap-5" aria-label="Pagination">
          <button type="button">‹&nbsp; Previous</button>
          <button type="button">1</button>
          <button
            type="button"
            className="rounded-lg bg-[#3f3f46] px-3 py-2 text-white"
          >
            2
          </button>
          <button type="button">3</button>
          <span>…</span>
          <button type="button">Next&nbsp; ›</button>
        </nav>
      </div>
    </section>
  );
}
