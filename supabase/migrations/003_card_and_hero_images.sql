-- ---------------------------------------------------------------------------
-- Card and hero imagery
-- ---------------------------------------------------------------------------
-- The product page banner and the /products carousel card want images of different shapes: the card
-- is a 210px square, the banner is a wide crop of up to 1040 x 408. One column served both, so one of
-- the two always lost something — a square banner asset had 61% of its height cropped away.
--
-- `image_url` therefore becomes the **hero** image (only its CMS label changes; renaming the column
-- would break the running application the moment this was applied, because it selects by name), and
-- the card gains a column pair of its own.
--
-- Both are nullable and independent. There is no fallback between them: a product may legitimately
-- have either, both, or neither, and a product with no card image renders a card with no picture
-- rather than borrowing the hero.
--
-- Re-runnable, and safe to apply while the previous deploy is still live: it only adds columns.

alter table public.products
  add column if not exists card_image_url text,
  add column if not exists card_image_alt text;

-- ---------------------------------------------------------------------------
-- save_product_content, extended to carry them
-- ---------------------------------------------------------------------------
-- Replaces a product and its content sections in one transaction. Without this, a failure between
-- "delete old sections" and "insert new sections" would silently destroy authored content.
--
-- To Postgres a changed parameter list is a *new function*, not a replacement, so the
-- twelve-parameter version created in 002 is deliberately left in place: the deployed application
-- still calls it, and PostgREST resolves a call by the argument names it is given, so both keep
-- working while the application catches up.
-- `004_drop_legacy_save_product_content.sql` removes the old one once the deploy is confirmed.
--
-- A save from a browser still running the old code cannot wipe the new fields: that function's
-- insert and update do not name these columns at all.

create or replace function public.save_product_content(
  p_id uuid,
  p_title text,
  p_slug text,
  p_description text,
  p_tags text[],
  p_image_url text,
  p_image_alt text,
  p_card_image_url text,
  p_card_image_alt text,
  p_acquisition text,
  p_locations text,
  p_cta_label text,
  p_published boolean,
  p_sections jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
  v_section jsonb;
  v_section_id uuid;
  v_section_index integer := 0;
  v_image jsonb;
  v_image_index integer;
begin
  if p_id is null then
    insert into public.products (
      title, slug, description, tags, image_url, image_alt, card_image_url, card_image_alt,
      acquisition, locations, cta_label, published
    )
    values (
      p_title, p_slug, p_description, coalesce(p_tags, '{}'), p_image_url, p_image_alt,
      p_card_image_url, p_card_image_alt,
      coalesce(p_acquisition, ''), coalesce(p_locations, ''), coalesce(p_cta_label, ''),
      coalesce(p_published, false)
    )
    returning id into v_id;
  else
    update public.products set
      title = p_title,
      slug = p_slug,
      description = p_description,
      tags = coalesce(p_tags, '{}'),
      image_url = p_image_url,
      image_alt = p_image_alt,
      card_image_url = p_card_image_url,
      card_image_alt = p_card_image_alt,
      acquisition = coalesce(p_acquisition, ''),
      locations = coalesce(p_locations, ''),
      cta_label = coalesce(p_cta_label, ''),
      published = coalesce(p_published, published)
    where id = p_id
    returning id into v_id;

    if v_id is null then
      raise exception 'Product % does not exist', p_id using errcode = 'no_data_found';
    end if;

    delete from public.product_content_sections where product_id = v_id;
  end if;

  for v_section in select * from jsonb_array_elements(coalesce(p_sections, '[]'::jsonb))
  loop
    v_section_index := v_section_index + 1;

    insert into public.product_content_sections (product_id, sort_order, heading, body)
    values (
      v_id,
      v_section_index,
      coalesce(v_section ->> 'heading', ''),
      coalesce(v_section ->> 'body', '')
    )
    returning id into v_section_id;

    v_image_index := 0;
    for v_image in select * from jsonb_array_elements(coalesce(v_section -> 'images', '[]'::jsonb))
    loop
      if coalesce(v_image ->> 'url', '') <> '' then
        v_image_index := v_image_index + 1;
        insert into public.product_content_section_images (section_id, sort_order, url, alt)
        values (
          v_section_id,
          v_image_index,
          v_image ->> 'url',
          coalesce(v_image ->> 'alt', '')
        );
      end if;
    end loop;
  end loop;

  return v_id;
end;
$$;

-- Only signed-in staff ever write content; anonymous callers are refused before the work starts.
-- Grants are per-signature, and a new function is executable by PUBLIC until this runs, so it is
-- repeated here rather than assumed to carry over from 002.
revoke execute on function public.save_product_content(
  uuid, text, text, text, text[], text, text, text, text, text, text, text, boolean, jsonb
) from anon;
