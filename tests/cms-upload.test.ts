import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/**
 * The CMS image upload's failure paths.
 *
 * A client component cannot be rendered by Node's test runner, so these are static checks — but they
 * guard a bug that actually shipped: an upload that failed for any reason left the field reading
 * "Uploading image..." forever, with no error and the file input disabled, because the handler reset
 * that state on the success path only. The trigger was an image larger than the Server Action request
 * limit, refused before the action ran; the missing `finally` is what turned it into a hang.
 */

const projectRoot = process.cwd();
const FORM = "components/cms/product-form.tsx";

function read(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("the upload handler clears its own state however the upload ends", () => {
  const source = read(FORM);

  assert.ok(
    source.includes("try {") && source.includes("catch {"),
    "the upload call must be guarded, so a rejection has somewhere to land",
  );
  assert.ok(
    source.includes("finally {"),
    "the spinner has to be cleared on every path, not just the successful one",
  );

  const finallyAt = source.indexOf("finally {");
  const resetAt = source.indexOf("setUploading(false)", finallyAt);

  assert.ok(
    resetAt > finallyAt,
    "setUploading(false) must sit in the finally block. On the success path only — which is how " +
      "this shipped — any rejection skips it and the field stays on 'Uploading image...' forever, " +
      "with the file input disabled so the user cannot even retry.",
  );
});

test("an oversized image is refused before it is uploaded", () => {
  const source = read(FORM);

  const checkAt = source.indexOf("file.size > MAX_IMAGE_BYTES");
  const spinAt = source.indexOf("setUploading(true)");

  assert.ok(
    checkAt > -1,
    "the client should check the size, not upload a file and wait for the refusal",
  );
  assert.ok(
    spinAt > checkAt,
    "the size check must run before the spinner starts, so the user gets an instant answer instead " +
      "of watching a file upload that was always going to be rejected",
  );
  assert.ok(
    source.includes("Images must be ${MAX_IMAGE_SIZE_LABEL} or smaller"),
    "the refusal should state the limit rather than a bare failure",
  );
});

test("the file picker offers what the server will actually accept", () => {
  const source = read(FORM);

  assert.ok(
    source.includes('ALLOWED_IMAGE_TYPES.join(",")'),
    "the accept attribute should be derived from the server's list so the two cannot drift",
  );
});
