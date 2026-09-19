import { test } from "node:test";
import assert from "node:assert/strict";
import {
  NOTIFY_TIMEOUT_MS,
  buildInquiryPayload,
  formatInquirySummary,
  notifyNewInquiry,
} from "../lib/leads/notify.ts";

/**
 * Notification dispatch.
 *
 * The enquiry is written to the database before this runs, so every branch here is best-effort: it
 * must never throw, and it must not post anything when no endpoint is configured.
 */

const inquiry = {
  name: "Maria Santos",
  email: "maria@example.com",
  company: "Example Corp",
  location: "Manila",
  message: "We would like lockers.",
  sourcePath: "/products/test-listing",
};

async function withFetch(
  stub: typeof fetch,
  run: () => Promise<void>,
): Promise<void> {
  const original = globalThis.fetch;
  globalThis.fetch = stub;
  try {
    await run();
  } finally {
    globalThis.fetch = original;
  }
}

async function withWebhookUrl(value: string | undefined, run: () => Promise<void>) {
  const previous = process.env.INQUIRY_WEBHOOK_URL;
  if (value === undefined) delete process.env.INQUIRY_WEBHOOK_URL;
  else process.env.INQUIRY_WEBHOOK_URL = value;
  try {
    await run();
  } finally {
    if (previous === undefined) delete process.env.INQUIRY_WEBHOOK_URL;
    else process.env.INQUIRY_WEBHOOK_URL = previous;
  }
}

test("the summary reads like a notification, not a data dump", () => {
  const summary = formatInquirySummary(inquiry);
  assert.match(summary, /New enquiry: Maria Santos \(maria@example\.com\)/);
  assert.match(summary, /Company: Example Corp/);
  assert.match(summary, /Page: \/products\/test-listing/);
});

test("the summary omits fields the visitor left blank", () => {
  const summary = formatInquirySummary({ ...inquiry, company: "", location: "", message: "" });
  assert.doesNotMatch(summary, /Company:/);
  assert.doesNotMatch(summary, /Location:/);
  assert.doesNotMatch(summary, /Message:/);
});

test("no endpoint configured means no request and no error", async () => {
  let called = false;
  await withWebhookUrl(undefined, async () => {
    await withFetch(
      (async () => {
        called = true;
        return new Response(null, { status: 200 });
      }) as typeof fetch,
      async () => {
        assert.equal(await notifyNewInquiry(inquiry), false);
      },
    );
  });
  assert.equal(called, false, "nothing should be posted without a configured endpoint");
});

test("a configured endpoint receives the fields and a text summary", async () => {
  let seenUrl: string | undefined;
  let body: Record<string, unknown> | undefined;
  let method: string | undefined;

  await withWebhookUrl("https://hooks.example.test/incoming", async () => {
    await withFetch(
      (async (input: RequestInfo | URL, init?: RequestInit) => {
        seenUrl = String(input);
        method = init?.method;
        body = JSON.parse(String(init?.body));
        return new Response(null, { status: 200 });
      }) as typeof fetch,
      async () => {
        assert.equal(await notifyNewInquiry(inquiry), true);
      },
    );
  });

  assert.equal(seenUrl, "https://hooks.example.test/incoming");
  assert.equal(method, "POST");
  assert.equal(body?.name, "Maria Santos");
  assert.equal(body?.email, "maria@example.com");
  assert.equal(body?.sourcePath, "/products/test-listing");
  assert.match(String(body?.text), /New enquiry/);
});

test("a rejecting endpoint is reported and does not throw", async () => {
  await withWebhookUrl("https://hooks.example.test/incoming", async () => {
    await withFetch(
      (async () => new Response("bad request", { status: 400 })) as typeof fetch,
      async () => {
        assert.equal(await notifyNewInquiry(inquiry), false);
      },
    );
  });
});

test("a network failure is reported and does not throw", async () => {
  await withWebhookUrl("https://hooks.example.test/incoming", async () => {
    await withFetch(
      (async () => {
        throw new TypeError("network down");
      }) as typeof fetch,
      async () => {
        assert.equal(await notifyNewInquiry(inquiry), false);
      },
    );
  });
});

test("the request cannot hang the visitor indefinitely", () => {
  assert.ok(NOTIFY_TIMEOUT_MS > 0 && NOTIFY_TIMEOUT_MS <= 10_000);
});

/**
 * The payload has to satisfy two very different consumers at once: a plain message action (or Slack)
 * reading `text`, and the Teams "webhook request received" template, which branches on whether
 * `attachments` exist and then posts `item()?['content']` as a card. Sending a body that is not a
 * card is what makes that template fail with "message body is invalid JSON".
 */

type CardBlock =
  | { type: "TextBlock"; text: string; wrap?: boolean; weight?: string; size?: string }
  | { type: "FactSet"; facts: Array<{ title: string; value: string }> };

function cardBody(inquiry: Parameters<typeof buildInquiryPayload>[0]): CardBlock[] {
  return buildInquiryPayload(inquiry).attachments[0].content.body as CardBlock[];
}

function factsOf(blocks: CardBlock[]): Array<{ title: string; value: string }> {
  const factSet = blocks.find((block) => block.type === "FactSet");
  return factSet && factSet.type === "FactSet" ? factSet.facts : [];
}

test("the payload carries the connector card format Teams expects", () => {
  const payload = buildInquiryPayload(inquiry);

  assert.equal(payload.type, "message");
  assert.equal(payload.attachments.length, 1);

  const attachment = payload.attachments[0];
  assert.equal(attachment.contentType, "application/vnd.microsoft.card.adaptive");
  assert.equal(attachment.content.type, "AdaptiveCard");
  assert.equal(attachment.content.$schema, "http://adaptivecards.io/schemas/adaptive-card.json");
  assert.match(attachment.content.version, /^\d+\.\d+$/);
});

test("the card shows the enquiry rather than raw data", () => {
  const blocks = cardBody(inquiry);

  const title = blocks[0];
  assert.equal(title.type, "TextBlock");
  assert.match(title.text, /New enquiry from Maria Santos/);

  assert.deepEqual(
    factsOf(blocks).map((fact) => fact.title),
    ["E-mail", "Company", "Location", "Page"],
  );

  const message = blocks[2];
  assert.equal(message.type, "TextBlock");
  assert.equal(message.text, inquiry.message);
});

test("the card omits fields the visitor left blank", () => {
  const blocks = cardBody({ ...inquiry, company: "", location: "", message: "" });

  assert.deepEqual(
    factsOf(blocks).map((fact) => fact.title),
    ["E-mail", "Page"],
  );
  assert.equal(blocks.length, 2, "no empty message block is rendered");
});

test("the flat fields survive for consumers that do not read cards", () => {
  const payload = buildInquiryPayload(inquiry);
  assert.equal(payload.name, "Maria Santos");
  assert.equal(payload.email, "maria@example.com");
  assert.equal(payload.sourcePath, "/products/test-listing");
  assert.match(payload.text, /New enquiry/);
});
