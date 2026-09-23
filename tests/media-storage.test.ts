import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_SIZE_LABEL,
  RECOMMENDED_IMAGE_NOTE,
  RECOMMENDED_IMAGE_SIZE,
  SERVER_ACTION_BODY_LIMIT_BYTES,
  extensionFor,
  getProductImageBucket,
  isAllowedImageType,
  matchesImageSignature,
} from "../lib/media/storage.ts";

/**
 * Upload rules. The declared MIME type is client-controlled, so the signature check is the only
 * real gate — it is exercised here with genuine file headers.
 */

function bytes(...values: number[]): Uint8Array {
  return new Uint8Array(values);
}

const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00);
const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10);
const WEBP = bytes(
  0x52, 0x49, 0x46, 0x46, // "RIFF"
  0x20, 0x00, 0x00, 0x00,
  0x57, 0x45, 0x42, 0x50, // "WEBP"
);

test("only allows the three documented raster types", () => {
  assert.deepEqual([...ALLOWED_IMAGE_TYPES], ["image/png", "image/jpeg", "image/webp"]);
  assert.equal(isAllowedImageType("image/png"), true);
  assert.equal(isAllowedImageType("image/jpeg"), true);
  assert.equal(isAllowedImageType("image/webp"), true);
  assert.equal(isAllowedImageType("image/svg+xml"), false, "SVG must be refused");
  assert.equal(isAllowedImageType("image/gif"), false);
  assert.equal(isAllowedImageType("application/pdf"), false);
  assert.equal(isAllowedImageType(""), false);
});

test("maps each allowed type to one extension", () => {
  assert.equal(extensionFor("image/png"), "png");
  assert.equal(extensionFor("image/jpeg"), "jpg");
  assert.equal(extensionFor("image/webp"), "webp");
});

test("recognises genuine file headers", () => {
  assert.equal(matchesImageSignature(PNG, "image/png"), true);
  assert.equal(matchesImageSignature(JPEG, "image/jpeg"), true);
  assert.equal(matchesImageSignature(WEBP, "image/webp"), true);
});

test("rejects a file whose bytes contradict its declared type", () => {
  assert.equal(matchesImageSignature(PNG, "image/jpeg"), false);
  assert.equal(matchesImageSignature(JPEG, "image/png"), false);
  assert.equal(matchesImageSignature(WEBP, "image/png"), false);
  assert.equal(matchesImageSignature(JPEG, "image/webp"), false);
});

test("rejects a truncated or empty payload", () => {
  assert.equal(matchesImageSignature(new Uint8Array(), "image/png"), false);
  assert.equal(matchesImageSignature(bytes(0x89, 0x50), "image/png"), false);
  assert.equal(matchesImageSignature(bytes(0xff, 0xd8), "image/jpeg"), false);
});

test("rejects a RIFF container that is not WebP", () => {
  const riffWave = bytes(
    0x52, 0x49, 0x46, 0x46,
    0x20, 0x00, 0x00, 0x00,
    0x57, 0x41, 0x56, 0x45, // "WAVE"
  );
  assert.equal(matchesImageSignature(riffWave, "image/webp"), false);
});

test("caps uploads below Next's Server Action body limit", () => {
  assert.equal(MAX_IMAGE_BYTES, 5 * 1024 * 1024);
  assert.equal(MAX_IMAGE_SIZE_LABEL, "5 MB", "the copy has to mean what the cap enforces");

  assert.ok(
    MAX_IMAGE_BYTES < SERVER_ACTION_BODY_LIMIT_BYTES,
    "a cap at or above the request limit is unreachable: the 413 is raised before this module's " +
      "checks run, so the upload appears to hang instead of reporting a size problem. That is " +
      "exactly what happened when the limit was Next's 1 MiB default and the cap said 5 MB.",
  );

  assert.ok(
    SERVER_ACTION_BODY_LIMIT_BYTES - MAX_IMAGE_BYTES >= 1024 * 1024,
    "leave room for the multipart boundaries and part headers that travel with the file, or a " +
      "maximum-size image pushes the request over the limit",
  );

  // The number above is only true if the config actually asks for it. Next's default is 1 MiB, so a
  // missing or edited `bodySizeLimit` would silently reintroduce the unreachable-cap bug.
  const config = fs.readFileSync(
    path.join(process.cwd(), "next.config.ts"),
    "utf8",
  );
  const configured = /bodySizeLimit:\s*"(\d+)mb"/.exec(config);

  assert.ok(configured, "next.config.ts must set experimental.serverActions.bodySizeLimit");
  assert.equal(
    Number(configured[1]) * 1024 * 1024,
    SERVER_ACTION_BODY_LIMIT_BYTES,
    "next.config.ts and lib/media/storage.ts disagree about the request-body limit",
  );
});

test("states the recommended upload size for product images", () => {
  // Pins the reasoning, not the wording. The two views differ in kind: the carousel is a square box
  // using object-contain, so nothing is lost there, while the product page banner is a wide
  // object-cover band that centre-crops whatever it is given. The banner is therefore the view that
  // constrains the source: it has to clear 1040px, and is set for roughly 2x.
  assert.equal(
    RECOMMENDED_IMAGE_SIZE.width,
    RECOMMENDED_IMAGE_SIZE.height,
    "the carousel box is square and contains rather than crops, so a square source fills it with no " +
      "letterboxing; the hero banner is the view that crops",
  );
  assert.ok(
    RECOMMENDED_IMAGE_SIZE.width >= 1040,
    "below the banner width the same file would be upscaled on the product page",
  );
  assert.match(RECOMMENDED_IMAGE_NOTE, /2000 × 2000 px/);
});

test("defaults to the documented bucket and honours the env override", () => {
  const previous = process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET;

  const withBucket = (value: string | undefined, run: () => void) => {
    if (value === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET;
    else process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET = value;
    try {
      run();
    } finally {
      if (previous === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET;
      else process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET = previous;
    }
  };

  withBucket(undefined, () => assert.equal(getProductImageBucket(), "product-images"));
  withBucket("   ", () => assert.equal(getProductImageBucket(), "product-images"));
  withBucket("custom-bucket", () => assert.equal(getProductImageBucket(), "custom-bucket"));
});
