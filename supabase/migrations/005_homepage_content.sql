-- Homepage content: one row, edited from /cms/home.
--
-- Decision record: docs/DEVELOPMENT-PHASES.md §1 (D14). The editorial scope is the client's own list
-- — hero text and its secondary link, the primary CTA, the hero video link, the client logos, the
-- twelve-cell business grid, the nine PANDORA tiles, the "Our Clients" heading and the success-story
-- cards. Site chrome, the enquiry section, the parallax band, the "Ask how we can help" band and the
-- PANDORA grid geometry stay in code.
--
-- **This migration seeds no row, deliberately.** `lib/content/defaults.ts` carries the copy the page
-- shipped with, and `/` renders it until a CMS user saves for the first time, so nothing is
-- transcribed here and no migration can silently change what the live page says. The first save
-- (an upsert on the fixed id) is what persists the record. See D14 for the read-failure rule that
-- makes this safe.
--
-- Unlike products there is no `save_*` function: the repeated groups are single `jsonb` columns
-- rather than child rows, so one UPDATE is already atomic.

create table if not exists public.homepage (
  id integer primary key check (id = 1),
  hero_heading text not null default '',
  hero_sub_label text not null default '',
  hero_link_label text not null default '',
  hero_link_href text not null default '',
  cta_label text not null default '',
  cta_href text not null default '',
  -- A YouTube link in any of its common forms. Stored as pasted; the id is derived at render time.
  video_url text not null default '',
  -- The iframe's accessible name. Empty means "no video", which renders the poster.
  video_title text not null default '',
  features_heading text not null default '',
  showcase_heading text not null default '',
  clients_heading text not null default '',
  -- [{title, headline, text}] x 12 (fixed: the grid divides by 1, 2 and 3)
  business_features jsonb not null default '[]'::jsonb
    check (jsonb_typeof(business_features) = 'array'),
  -- [{label, imageUrl}] x 9 (fixed: the panel is a 3x4 grid with hand-placed spans)
  showcase_tiles jsonb not null default '[]'::jsonb
    check (jsonb_typeof(showcase_tiles) = 'array'),
  -- [{name, imageUrl, width, height}] — width/height drive next/image's reserved space
  client_logos jsonb not null default '[]'::jsonb
    check (jsonb_typeof(client_logos) = 'array'),
  -- [{name, logoUrl, logoWidth, logoHeight, imageUrl}]
  stories jsonb not null default '[]'::jsonb
    check (jsonb_typeof(stories) = 'array'),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.homepage enable row level security;

-- The whole record is public marketing copy, so one read policy covers visitors and staff alike.
drop policy if exists "Homepage content is publicly readable" on public.homepage;
create policy "Homepage content is publicly readable"
  on public.homepage for select to anon, authenticated
  using (true);

drop policy if exists "Editors can add homepage content" on public.homepage;
create policy "Editors can add homepage content"
  on public.homepage for insert to authenticated
  with check (public.current_user_role() in ('admin', 'editor'));

drop policy if exists "Editors can update homepage content" on public.homepage;
create policy "Editors can update homepage content"
  on public.homepage for update to authenticated
  using (public.current_user_role() in ('admin', 'editor'))
  with check (public.current_user_role() in ('admin', 'editor'));

-- No delete policy: there is exactly one row and removing it is not an editorial action.

-- Stamp who changed the copy and when. `set_updated_at()` only covers the timestamp, so the editor's
-- id needs its own trigger; `auth.uid()` is null for anyone who is not signed in, which RLS already
-- prevents from writing.
create or replace function public.homepage_set_audit()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

-- Trigger helpers are not part of the API surface, and Supabase grants EXECUTE on new functions to
-- anon/authenticated by default.
revoke execute on function public.homepage_set_audit() from public, anon, authenticated;

drop trigger if exists homepage_set_audit on public.homepage;
create trigger homepage_set_audit
  before insert or update on public.homepage
  for each row execute function public.homepage_set_audit();
