"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { formatFileSize, readImageSize } from "@/components/cms/image-upload";
import { uploadSiteImage } from "@/lib/media/actions";
import {
  SITE_IMAGE_BYTES,
  SITE_IMAGE_SIZE_LABEL,
  SITE_IMAGE_TYPES,
} from "@/lib/media/storage";

/**
 * One homepage image field: preview, upload, and the hidden inputs the save reads.
 *
 * The upload rules are the client's — PNG only, 2 MB, resized before it is chosen — and the size is
 * checked here as well as on the server so an oversized file is refused immediately rather than
 * uploaded to a limit that was always going to reject it. The bucket enforces the same pair, so
 * neither this component nor the action is the last line of defence.
 *
 * When `widthName`/`heightName` are given, the file's pixel size is measured as it uploads and posted
 * with it: `next/image` needs an intrinsic size to reserve space, and a logo strip whose cells appear
 * as each logo loads is a layout shift the design does not have.
 */

const ACCEPTED = SITE_IMAGE_TYPES.join(",");

export function SiteImageField({
  label,
  hint,
  urlName,
  widthName,
  heightName,
  initialUrl,
  initialWidth,
  initialHeight,
  error,
}: {
  label: string;
  hint: string;
  urlName: string;
  widthName?: string;
  heightName?: string;
  initialUrl?: string;
  initialWidth?: number;
  initialHeight?: number;
  error?: string;
}) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    initialUrl && initialWidth && initialHeight
      ? { width: initialWidth, height: initialHeight }
      : null,
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileId = `${urlName}-file`;
  const errorId = `${urlName}-error`;

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > SITE_IMAGE_BYTES) {
      if (inputRef.current) inputRef.current.value = "";
      setUploadError(
        `Images must be ${SITE_IMAGE_SIZE_LABEL} or smaller. That one is ${formatFileSize(file.size)}.`,
      );
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const body = new FormData();
      body.set("file", file);
      const [result, measured] = await Promise.all([
        uploadSiteImage(body),
        readImageSize(file),
      ]);

      if (measured) setSize(measured);
      if (result.ok) setUrl(result.url);
      else setUploadError(result.error);
    } catch {
      // Anything that rejects — a dropped connection, a request refused before the action ran — has
      // to clear the spinner and say so, or the field sits on "Uploading..." forever.
      setUploadError("The upload did not complete. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="min-w-0">
      <label htmlFor={fileId} className="block text-[10px]">
        {label}
      </label>
      <div className="mt-1 flex items-start gap-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-card-sm)] bg-[var(--surface-muted)]">
          {url ? (
            <Image
              src={url}
              alt=""
              fill
              sizes="80px"
              className="object-contain"
              // The shipped logos are SVGs and the image optimiser refuses them without
              // `dangerouslyAllowSVG`; a preview needs no optimisation, so it is served as-is.
              unoptimized={url.endsWith(".svg")}
            />
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
            accept={ACCEPTED}
            disabled={uploading}
            onChange={handleFile}
            className="block w-full text-[9px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] file:mr-2 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[var(--cms-surface)] file:px-3 file:py-1 file:text-[9px] file:font-bold file:text-white disabled:opacity-60"
          />
          <input type="hidden" name={urlName} value={url} />
          {widthName ? (
            <input type="hidden" name={widthName} value={size?.width ?? 0} />
          ) : null}
          {heightName ? (
            <input type="hidden" name={heightName} value={size?.height ?? 0} />
          ) : null}

          {!uploading && !uploadError ? (
            <p className="mt-1 text-[9px] text-[var(--text-muted)]">
              PNG only, up to {SITE_IMAGE_SIZE_LABEL} — {hint}.
            </p>
          ) : null}
          {uploading ? (
            <p role="status" className="mt-1 text-[9px] text-[var(--text-muted)]">
              Uploading image...
            </p>
          ) : null}
          {size && !uploading ? (
            <p role="status" className="mt-1 text-[9px] text-[var(--text-muted)]">
              {size.width} × {size.height} px
            </p>
          ) : null}
          {uploadError ? (
            <p role="alert" className="mt-1 text-[9px] text-red-700">
              {uploadError}
            </p>
          ) : null}
          {error ? (
            <p id={errorId} className="mt-1 text-[9px] text-red-700">
              {error}
            </p>
          ) : null}
          {url && !uploading ? (
            <button
              type="button"
              onClick={() => {
                setUrl("");
                setSize(null);
              }}
              className="mt-1 text-[9px] underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
            >
              Remove image
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
