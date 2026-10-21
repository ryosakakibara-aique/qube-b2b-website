-- Storage for homepage imagery: client logos, the nine showcase tiles and the success-story cards.
--
-- The client's rule is PNG only, 2 MB maximum, with the author resizing the file before upload. That
-- rule is set on the bucket as well as in `lib/media/storage.ts`, because bucket-level limits are
-- enforced by Storage itself: an oversized object or a JPEG is refused before any application code
-- runs, so the rule cannot be bypassed by a request that skips the form.
--
-- 2 MB is well under the 6 MB Server Action request limit in `next.config.ts`, so no upload is
-- refused by Next before it reaches this bucket.
--
-- SVG stays refused, as on `product-images`: a public bucket would serve attacker-controlled markup
-- from an origin the site links to. The eight client logos are SVG files today, so moving them into
-- the CMS means exporting them as PNG first.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-images', 'site-images', true, 2097152, array['image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Homepage images are publicly readable" on storage.objects;
create policy "Homepage images are publicly readable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'site-images');

drop policy if exists "Editors can manage homepage images" on storage.objects;
create policy "Editors can manage homepage images"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'site-images'
    and public.current_user_role() in ('admin', 'editor')
  )
  with check (
    bucket_id = 'site-images'
    and public.current_user_role() in ('admin', 'editor')
  );
