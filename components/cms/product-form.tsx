"use client";

import Image from "next/image";
import { useActionState, useRef, useState, type RefObject } from "react";
import { saveProduct } from "@/lib/products/actions";
import { uploadProductImage } from "@/lib/media/actions";
import {
  MAX_ALT_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_SECTION_COUNT,
  MAX_TITLE_LENGTH,
  MIN_SECTION_COUNT,
  sectionBodyLimit,
  sectionImageSlots,
} from "@/lib/products/validation";
import type { Product, ProductImage } from "@/lib/products/types";

const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp";

type DraftSection = {
  id: string;
  heading: string;
  body: string;
  images: ProductImage[];
};

const emptyProduct: Product = {
  id: "",
  title: "",
  slug: "",
  description: "",
  tags: [],
  acquisition: "",
  locations: "",
  ctaLabel: "",
  published: false,
  createdAt: "",
  updatedAt: "",
  contentSections: [],
};

function initialSections(product: Product): DraftSection[] {
  const sections: DraftSection[] = product.contentSections.map((section, index) => ({
    id: `saved-${index + 1}`,
    heading: section.heading,
    body: section.body,
    images: section.images,
  }));

  while (sections.length < MIN_SECTION_COUNT) {
    sections.push({
      id: `blank-${sections.length + 1}`,
      heading: "",
      body: "",
      images: [],
    });
  }

  return sections;
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  error,
  required = false,
  maxLength,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder: string;
  error?: string;
  required?: boolean;
  maxLength?: number;
}) {
  const errorId = `${name}-error`;

  return (
    <div>
      <label htmlFor={name} className="block text-[10px]">
        {label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="cms-input mt-1 h-8 text-[10px]"
      />
      {error ? (
        <p id={errorId} className="mt-1 text-[9px] text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ImageField({
  label,
  urlName,
  altName,
  initialUrl,
  initialAlt,
  altError,
}: {
  label: string;
  urlName: string;
  altName: string;
  initialUrl?: string;
  initialAlt?: string;
  altError?: string;
}) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = `${altName}-error`;
  const fileId = `${urlName}-file`;

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const body = new FormData();
    body.set("file", file);
    const result = await uploadProductImage(body);

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";

    if (result.ok) setUrl(result.url);
    else setUploadError(result.error);
  }

  return (
    <div>
      <label htmlFor={fileId} className="block text-[10px]">
        {label}
      </label>
      <div className="mt-1 flex items-start gap-3">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[var(--radius-card-sm)] bg-[var(--surface-muted)]">
          {url ? (
            <Image src={url} alt="" fill sizes="96px" className="object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center px-2 text-center text-[9px] text-[var(--text-muted)]">
              No image yet
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <input
            ref={inputRef}
            id={fileId}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            disabled={uploading}
            onChange={handleFile}
            className="block w-full text-[9px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] file:mr-2 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[var(--cms-surface)] file:px-3 file:py-1 file:text-[9px] file:font-bold file:text-white disabled:opacity-60"
          />
          <input type="hidden" name={urlName} value={url} />

          {uploading ? (
            <p role="status" className="mt-1 text-[9px] text-[var(--text-muted)]">
              Uploading image...
            </p>
          ) : null}
          {uploadError ? (
            <p role="alert" className="mt-1 text-[9px] text-red-700">
              {uploadError}
            </p>
          ) : null}
          {url && !uploading ? (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="mt-1 text-[9px] underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
            >
              Remove image
            </button>
          ) : null}

          <label htmlFor={altName} className="mt-2 block text-[10px]">
            Image alt
          </label>
          <input
            id={altName}
            name={altName}
            defaultValue={initialAlt ?? ""}
            maxLength={MAX_ALT_LENGTH}
            placeholder="Add image alt"
            aria-invalid={altError ? true : undefined}
            aria-describedby={altError ? errorId : undefined}
            className="cms-input mt-1 h-7 text-[10px]"
          />
          {altError ? (
            <p id={errorId} className="mt-1 text-[9px] text-red-700">
              {altError}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Bold / Italic / List for a content body.
 *
 * The field stays a plain textarea: pressing a button wraps the selection in the markers that
 * `lib/products/richtext.ts` understands, and pressing List again removes them. Keeping the markup
 * visible means the author can always see and edit exactly what will be rendered.
 */
function FormatToolbar({
  textareaRef,
  label,
}: {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  label: string;
}) {
  function apply(kind: "bold" | "italic" | "list") {
    const element = textareaRef.current;
    if (!element) return;

    const value = element.value;
    const start = element.selectionStart ?? 0;
    const end = element.selectionEnd ?? 0;

    if (kind === "list") {
      const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
      const nextBreak = value.indexOf("\n", end);
      const lineEnd = nextBreak === -1 ? value.length : nextBreak;
      const lines = value.slice(lineStart, lineEnd).split("\n");
      const alreadyListed = lines.every(
        (line) => line.trim() === "" || /^\s*[-*]\s+/.test(line),
      );

      const updated = lines
        .map((line) => {
          if (line.trim() === "") return line;
          return alreadyListed
            ? line.replace(/^(\s*)[-*]\s+/, "$1")
            : `- ${line.replace(/^\s*[-*]\s+/, "")}`;
        })
        .join("\n");

      element.value = value.slice(0, lineStart) + updated + value.slice(lineEnd);
      element.focus();
      element.setSelectionRange(lineStart, lineStart + updated.length);
      return;
    }

    const marker = kind === "bold" ? "**" : "*";
    const inner =
      value.slice(start, end) || (kind === "bold" ? "bold text" : "italic text");
    const replacement = `${marker}${inner}${marker}`;

    element.value = value.slice(0, start) + replacement + value.slice(end);
    element.focus();
    element.setSelectionRange(
      start + marker.length,
      start + marker.length + inner.length,
    );
  }

  const buttonClass =
    "rounded-[var(--radius-chip)] border border-[var(--border)] px-2 py-0.5 text-[9px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]";

  return (
    <div
      role="group"
      aria-label={`Formatting for ${label}`}
      className="mt-1 flex flex-wrap items-center gap-1"
    >
      {/* preventDefault keeps the textarea selection while the button is pressed */}
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => apply("bold")}
        aria-label={`Bold ${label}`}
        className={`${buttonClass} font-bold`}
      >
        B
      </button>
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => apply("italic")}
        aria-label={`Italic ${label}`}
        className={`${buttonClass} italic`}
      >
        I
      </button>
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => apply("list")}
        aria-label={`Bulleted list ${label}`}
        className={buttonClass}
      >
        &bull; List
      </button>
      <span className="ml-1 text-[9px] text-[var(--text-muted)]">
        Select text, then format
      </span>
    </div>
  );
}

function ContentEditor({
  position,
  section,
  errors,
  onRemove,
}: {
  position: number;
  section: DraftSection;
  errors: Record<string, string>;
  onRemove: () => void;
}) {
  const bodyLimit = sectionBodyLimit(position);
  const slots = sectionImageSlots(position);
  const headingName = `content${position}Heading`;
  const bodyName = `content${position}Body`;
  const bodyError = errors[bodyName];
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const bodyLabel = position === 1 ? "Long Content" : "Short Content";

  return (
    <fieldset className="border-t border-[var(--border-subtle)] pt-4">
      <legend className="text-xs font-bold">Content {position}</legend>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onRemove}
          className="text-[9px] text-[var(--text-muted)] underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
        >
          Remove content {position}
        </button>
      </div>

      <div className="mt-3 space-y-3">
        <Field
          label={`Heading ${position}`}
          name={headingName}
          defaultValue={section.heading}
          placeholder={`Add Header ${position}`}
          error={errors[headingName]}
        />

        <div>
          <label htmlFor={bodyName} className="block text-[10px]">
            {bodyLabel}
          </label>
          <textarea
            ref={bodyRef}
            id={bodyName}
            name={bodyName}
            defaultValue={section.body}
            maxLength={bodyLimit}
            placeholder={`Add content up to ${bodyLimit.toLocaleString("en-US")} characters`}
            aria-invalid={bodyError ? true : undefined}
            aria-describedby={bodyError ? `${bodyName}-error` : undefined}
            className="cms-input mt-1 min-h-[76px] resize-y text-[10px]"
          />
          <FormatToolbar textareaRef={bodyRef} label={`content ${position}`} />
          {bodyError ? (
            <p id={`${bodyName}-error`} className="mt-1 text-[9px] text-red-700">
              {bodyError}
            </p>
          ) : null}
        </div>

        <div>
          <p className="text-[10px]">
            Content {position} Image{slots > 1 ? "s" : ""}
          </p>
          <div className={`mt-2 grid gap-4 ${slots > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
            {Array.from({ length: slots }).map((_, slotIndex) => {
              const slot = slotIndex + 1;
              const urlName = `content${position}Image${slot}Url`;
              const altName = `content${position}Image${slot}Alt`;

              return (
                <ImageField
                  key={urlName}
                  label={`Image ${slot}`}
                  urlName={urlName}
                  altName={altName}
                  initialUrl={section.images[slotIndex]?.url}
                  initialAlt={section.images[slotIndex]?.alt}
                  altError={errors[altName]}
                />
              );
            })}
          </div>
        </div>
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
  const errors = state.fieldErrors ?? {};
  const slugError = errors.slug;
  const [sections, setSections] = useState<DraftSection[]>(() => initialSections(product));
  const nextId = useRef(0);

  function addSection() {
    setSections((current) => {
      if (current.length >= MAX_SECTION_COUNT) return current;
      nextId.current += 1;
      return [
        ...current,
        { id: `added-${nextId.current}`, heading: "", body: "", images: [] },
      ];
    });
  }

  function removeSection(id: string) {
    setSections((current) => current.filter((section) => section.id !== id));
  }

  return (
    <form
      id={formId}
      action={formAction}
      className="grid gap-x-4 gap-y-5 lg:grid-cols-[304px_1fr]"
    >
      <input type="hidden" name="id" value={product.id} />
      <input type="hidden" name="published" value={String(product.published)} />
      <input type="hidden" name="sectionCount" value={sections.length} />

      <div className="space-y-4">
        <Field
          label="Product Title"
          name="title"
          defaultValue={product.title}
          placeholder="Add title"
          error={errors.title}
          required
          maxLength={MAX_TITLE_LENGTH}
        />

        <div className="border-t border-[var(--border-subtle)] pt-3">
          <label htmlFor="slug" className="block text-[10px]">
            Path
          </label>
          <p className="text-[10px] text-[var(--text-muted)]">
            business.qubesmartlockers.com/
          </p>
          <input
            id="slug"
            name="slug"
            required
            defaultValue={product.slug}
            placeholder="id or path"
            aria-invalid={slugError ? true : undefined}
            aria-describedby={slugError ? "slug-error" : undefined}
            className="cms-input mt-1 h-7 text-[10px]"
          />
          {slugError ? (
            <p id="slug-error" className="mt-1 text-[9px] text-red-700">
              {slugError}
            </p>
          ) : null}
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-4">
          <ImageField
            label="Product Image"
            urlName="imageUrl"
            altName="imageAlt"
            initialUrl={product.imageUrl}
            initialAlt={product.imageAlt}
            altError={errors.imageAlt}
          />
        </div>

        <div className="space-y-4 pt-2">
          <Field
            label="Acquisition"
            name="acquisition"
            defaultValue={product.acquisition}
            placeholder="Add acquisition method"
            error={errors.acquisition}
          />
          <Field
            label="Locations"
            name="locations"
            defaultValue={product.locations}
            placeholder="Add number of locations"
            error={errors.locations}
          />
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-4">
          <Field
            label="CTA"
            name="ctaLabel"
            defaultValue={product.ctaLabel}
            placeholder="Add button label"
            error={errors.ctaLabel}
          />
        </div>
      </div>

      <div className="space-y-4">
        <Field
          label="Description"
          name="description"
          defaultValue={product.description}
          placeholder="Add short description"
          error={errors.description}
          required
          maxLength={MAX_DESCRIPTION_LENGTH}
        />
        <Field
          label="Tags"
          name="tags"
          defaultValue={product.tags.join(", ")}
          placeholder="Add tags, separated by commas"
          error={errors.tags}
        />

        <div className="space-y-5">
          {sections.map((section, index) => (
            <ContentEditor
              key={section.id}
              position={index + 1}
              section={section}
              errors={errors}
              onRemove={() => removeSection(section.id)}
            />
          ))}

          <div className="border-t border-[var(--border-subtle)] pt-4">
            <button
              type="button"
              onClick={addSection}
              disabled={sections.length >= MAX_SECTION_COUNT}
              className="rounded-[var(--radius-chip)] border border-[var(--border)] px-3 py-1 text-[10px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-60"
            >
              Add content section
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 lg:col-span-2">
        {state.error ? (
          <p role="alert" className="mr-auto text-xs text-red-700">
            {state.error}
          </p>
        ) : null}
        <button
          type="reset"
          className="rounded-[var(--radius-chip)] border border-[var(--border)] px-3 py-1 text-[10px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
        >
          Cancel
        </button>
        <button
          disabled={pending}
          type="submit"
          className="rounded-[var(--radius-chip)] bg-[var(--cms-surface)] px-3 py-1 text-[10px] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
