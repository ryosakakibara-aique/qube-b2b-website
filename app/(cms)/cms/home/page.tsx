import { Notice } from "@/components/ui/notice";
import { HomepageForm } from "@/components/cms/homepage-form";
import { canEditContent } from "@/lib/auth/roles";
import { getSessionUser } from "@/lib/auth/session";
import { getCmsHomepage } from "@/lib/content/cms";

/**
 * The homepage editor.
 *
 * A route the confirmed Figma scope does not contain — it covers sign-in, the product list, create and
 * edit. Like `/cms/inquiries`, this was added at the client's request and has no frame: it is built
 * from the CMS's existing primitives rather than from a new design, which is why it looks like a long
 * form and not like a page builder.
 *
 * It is one record, saved in place. There is no draft and no publish toggle: a product can sit
 * unpublished because the catalogue hides it, but hiding the homepage would take the site down, so a
 * save is live as soon as it succeeds.
 */
export default async function CmsHomePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const [params, result, user] = await Promise.all([
    searchParams,
    getCmsHomepage(),
    getSessionUser(),
  ]);

  const canEdit = user ? canEditContent(user.role) : false;

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-lg font-bold">Homepage Content</h1>
        <p className="mt-1 text-[10px] text-[var(--text-muted)]">
          What this changes: the landing page at <code>/</code>. Changes go live as
          soon as they are saved.
        </p>
      </div>

      {params.saved ? <Notice variant="success">Homepage saved.</Notice> : null}

      {!result.ok ? <Notice variant="error">{result.error}</Notice> : null}

      {result.ok && !result.data.saved ? (
        <Notice variant="info">
          Nothing has been saved yet, so the page is still showing the copy that
          ships with the site. Save once to store it here — after that, edits are
          kept in the database.
        </Notice>
      ) : null}

      {!canEdit && user ? (
        <Notice variant="info">
          Your account has read-only access, so the homepage cannot be changed here.
        </Notice>
      ) : null}

      {result.ok && canEdit ? (
        <HomepageForm formId="homepage-form" content={result.data.content} />
      ) : null}
    </section>
  );
}
