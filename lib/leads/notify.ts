/**
 * Optional notification when a new enquiry arrives.
 *
 * The row is written to `contact_submissions` first, so this is a convenience: it may fail without
 * costing the lead, and it never throws. Point `INQUIRY_WEBHOOK_URL` at a Microsoft Teams workflow,
 * a Slack incoming webhook, or any endpoint that accepts JSON.
 *
 * The payload carries a human-readable `text` summary as well as the individual fields, so it works
 * with a Teams incoming webhook (which expects `text`) and with a Power Automate flow (where the
 * fields are mapped by name in the designer).
 */

export type InquiryNotification = {
  name: string;
  email: string;
  company: string;
  location: string;
  message: string;
  sourcePath: string;
};

/** Long enough for a chat webhook, short enough not to hold the visitor's response open. */
export const NOTIFY_TIMEOUT_MS = 4000;

export function formatInquirySummary(inquiry: InquiryNotification): string {
  const lines = [`New enquiry: ${inquiry.name} (${inquiry.email})`];
  if (inquiry.company) lines.push(`Company: ${inquiry.company}`);
  if (inquiry.location) lines.push(`Location: ${inquiry.location}`);
  if (inquiry.message) lines.push(`Message: ${inquiry.message}`);
  if (inquiry.sourcePath) lines.push(`Page: ${inquiry.sourcePath}`);
  return lines.join("\n");
}

/**
 * The webhook payload.
 *
 * It is deliberately a superset so one endpoint shape serves every consumer:
 *
 * - `text` plus the flat fields are what a plain message action, a Slack incoming webhook, or any
 *   hand-made consumer reads.
 * - `attachments` is the legacy Office 365 connector format, which is what the Teams
 *   "When a Teams webhook request is received" workflow template expects: its condition branches on
 *   whether attachments exist and then posts `item()?['content']` as the card. Sending a card here
 *   is what makes that template work without editing the flow.
 */
export function buildInquiryPayload(inquiry: InquiryNotification) {
  const summary = formatInquirySummary(inquiry);

  const facts = [
    { title: "E-mail", value: inquiry.email },
    ...(inquiry.company ? [{ title: "Company", value: inquiry.company }] : []),
    ...(inquiry.location ? [{ title: "Location", value: inquiry.location }] : []),
    ...(inquiry.sourcePath ? [{ title: "Page", value: inquiry.sourcePath }] : []),
  ];

  const card = {
    type: "AdaptiveCard",
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.4",
    body: [
      {
        type: "TextBlock",
        text: `New enquiry from ${inquiry.name}`,
        weight: "Bolder",
        size: "Medium",
        wrap: true,
      },
      { type: "FactSet", facts },
      ...(inquiry.message
        ? [{ type: "TextBlock", text: inquiry.message, wrap: true }]
        : []),
    ],
  };

  return {
    type: "message",
    text: summary,
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: card,
      },
    ],
    name: inquiry.name,
    email: inquiry.email,
    company: inquiry.company,
    location: inquiry.location,
    message: inquiry.message,
    sourcePath: inquiry.sourcePath,
  };
}

/** Returns true when the notification was delivered, false when it was skipped or failed. */
export async function notifyNewInquiry(
  inquiry: InquiryNotification,
): Promise<boolean> {
  const url = process.env.INQUIRY_WEBHOOK_URL?.trim();
  if (!url) return false;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildInquiryPayload(inquiry)),
      signal: AbortSignal.timeout(NOTIFY_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(
        `[leads] Enquiry stored, but the notification endpoint answered ${response.status}`,
      );
      return false;
    }

    return true;
  } catch (error) {
    // Including the timeout: the enquiry is already stored, so this is reported and dropped.
    console.error("[leads] Enquiry stored, but the notification could not be sent", error);
    return false;
  }
}
