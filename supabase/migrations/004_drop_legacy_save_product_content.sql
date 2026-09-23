-- ---------------------------------------------------------------------------
-- Retire the twelve-parameter save_product_content
-- ---------------------------------------------------------------------------
-- 003 created a fourteen-parameter version and deliberately left this one in place so the running
-- application kept working across the deploy. Run this **only after** the deploy that sends the new
-- argument list is live and a save has been confirmed in the CMS.
--
-- Applying it early is not catastrophic — PostgREST would simply fail to find a function matching the
-- twelve names the old code sends, so saving would fail until the new deploy arrived — which is why
-- the order matters and why this is a separate file rather than part of 003.

drop function if exists public.save_product_content(
  uuid, text, text, text, text[], text, text, text, text, text, boolean, jsonb
);
