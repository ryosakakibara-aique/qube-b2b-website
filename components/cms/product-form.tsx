"use client";

import { useActionState } from "react";
import type { Product } from "@/lib/products/types";
import { saveProduct } from "@/lib/products/actions";

const emptyProduct: Product = {
  id: "",
  title: "",
  slug: "",
  description: "",
  tags: [],
  acquisition: "",
  locations: "",
  ctaLabel: "",
  contentSections: [],
};

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  wide = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder: string;
  wide?: boolean;
}) {
  return (
    <label className={`block text-[10px] ${wide ? "sm:col-span-2" : ""}`}>
      {label}
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="cms-input mt-1 h-8 text-[10px]"
      />
    </label>
  );
}

function ContentEditor({
  index,
  heading,
  body,
}: {
  index: number;
  heading?: string;
  body?: string;
}) {
  return (
    <fieldset className="border-t border-[#e2e8f0] pt-4">
      <legend className="text-xs font-bold">Content {index}</legend>
      <div className="mt-3 space-y-3">
        <Field
          label={`Heading ${index}`}
          name={`content${index}Heading`}
          defaultValue={heading}
          placeholder={`Add Header ${index}`}
        />
        <label className="block text-[10px]">
          {index === 1 ? "Long Content" : "Short Content"}
          <textarea
            name={`content${index}Body`}
            defaultValue={body}
            placeholder={
              index === 1
                ? "Add long description up to 3,000 characters"
                : "Add short description up to 1,000 characters"
            }
            className="cms-input mt-1 min-h-[76px] resize-y text-[10px]"
          />
          <span className="mt-1 block text-[10px] font-bold tracking-[0.2em]">
            B&nbsp;&nbsp; I&nbsp;&nbsp; ⋮
          </span>
        </label>
        {index < 3 ? (
          <div>
            <p className="text-[10px]">
              Content {index} Image{index === 1 ? "s" : ""}
            </p>
            <div
              className={`mt-2 grid gap-4 ${index === 1 ? "grid-cols-2" : "grid-cols-1"}`}
            >
              {Array.from({ length: index === 1 ? 2 : 1 }).map(
                (_, imageIndex) => (
                  <div key={imageIndex}>
                    <div
                      className="h-24 rounded-2xl bg-[#e2e8f0]"
                      aria-label={`Content ${index} image ${imageIndex + 1}`}
                    />
                    <button
                      type="button"
                      className="mt-2 rounded-lg bg-[#3f3f46] px-3 py-1 text-[9px] font-bold text-white"
                    >
                      Browse
                    </button>
                    <input
                      name={`content${index}Image${imageIndex + 1}Alt`}
                      placeholder="Add image alt"
                      className="cms-input mt-2 h-7 text-[10px]"
                    />
                  </div>
                ),
              )}
            </div>
          </div>
        ) : null}
      </div>
    </fieldset>
  );
}

export function ProductForm({
  product = emptyProduct,
  formId = "product-form",
}: {
  product?: Product;
  formId?: string;
}) {
  const [state, formAction, pending] = useActionState(saveProduct, {});
  const sections = [1, 2, 3].map((index) => ({
    index,
    content: product.contentSections[index - 1],
  }));
  return (
    <form
      id={formId}
      action={formAction}
      className="grid gap-x-4 gap-y-5 lg:grid-cols-[304px_1fr]"
    >
      <input type="hidden" name="id" value={product.id} />
      <div className="space-y-4">
        <Field
          label="Product Title"
          name="title"
          defaultValue={product.title}
          placeholder="Add title"
        />
        <Field
          label="Description"
          name="description"
          defaultValue={product.description}
          placeholder="Add short description 5000 characters"
        />
        <Field
          label="Tags"
          name="tags"
          defaultValue={product.tags.join(", ")}
          placeholder="Add tags, press Enter to add more"
        />
        <div>
          <p className="text-[10px]">Product Image</p>
          <div
            className="mt-1 h-32 w-32 rounded-2xl bg-[#e2e8f0]"
            aria-label={product.imageAlt ?? "Product image"}
          />
          <button
            type="button"
            className="mt-2 rounded-lg bg-[#3f3f46] px-3 py-1 text-[9px] font-bold text-white"
          >
            Browse
          </button>
          <Field
            label="Image alt"
            name="imageAlt"
            defaultValue={product.imageAlt}
            placeholder="Add image alt"
          />
        </div>
        <Field
          label="Acquisition"
          name="acquisition"
          defaultValue={product.acquisition}
          placeholder="Add acquisition method"
        />
        <Field
          label="Locations"
          name="locations"
          defaultValue={product.locations}
          placeholder="Add number of locations"
        />
        <Field
          label="CTA"
          name="ctaLabel"
          defaultValue={product.ctaLabel}
          placeholder="Add button label"
        />
        <div className="flex items-center gap-2 border-t border-[#e2e8f0] pt-3 text-[10px]">
          <span>Path</span>
          <span className="text-[#71717a]">business.qubesmartlockers.com/</span>
          <input
            name="slug"
            required
            defaultValue={product.slug}
            placeholder="id or path"
            className="h-7 min-w-0 flex-1 rounded-lg border border-[#cbd5e1] bg-[#e2e8f0] px-2 text-[10px]"
          />
        </div>
      </div>
      <div className="space-y-5">
        {sections.map(({ index, content }) => (
          <ContentEditor
            key={index}
            index={index}
            heading={content?.heading}
            body={content?.body}
          />
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 lg:col-span-2">
        {state.error ? (
          <p role="alert" className="mr-auto text-xs text-red-700">
            {state.error}
          </p>
        ) : null}
        <button
          type="reset"
          className="rounded-lg border border-[#94a3b8] px-3 py-1 text-[10px]"
        >
          Cancel
        </button>
        <button
          disabled={pending}
          type="submit"
          className="rounded-lg bg-[#3f3f46] px-3 py-1 text-[10px] font-bold text-white"
        >
          {pending ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
