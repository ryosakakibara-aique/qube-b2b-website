-- Phase 1/3 foundation:
--   * staff roles (admin / editor / viewer) stored server-side and enforced by RLS
--   * product publication state, driven by the toggle in the CMS product list
--   * product section image galleries (Content 1 accepts two images in the Figma form)
--   * Supabase Storage bucket for CMS-uploaded product imagery
--   * contact enquiries submitted from the public "Talk to an Expert" forms
--   * an atomic content-write function so a failed save cannot destroy existing sections
--
-- Decision record: docs/DEVELOPMENT-PHASES.md §1 (D1 hybrid roles + published toggle, D5 media,
-- D8 lead capture). BUSINESS_RULES.md's review workflow, audit log and soft delete are deferred.

-- ---------------------------------------------------------------------------
-- 1. Roles
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'editor', 'viewer');
  end if;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  role public.user_role not null default 'viewer',
  -- Having an account is not the same as being staff. Supabase projects allow public sign-up by
  -- default, and a new account must not be able to read unpublished drafts or customer enquiries
  -- just by existing. Access requires an explicit operator approval.
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Reads the caller's role, or NULL when the account has not been approved. SECURITY DEFINER so that
-- policies on other tables can call it without re-entering the profiles policies (which would
-- recurse). Every role check in every policy therefore also enforces approval.
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and approved;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Every new auth user gets a profile, but it starts unapproved and therefore grants nothing.
-- Granting access is a deliberate operator action:
--   update public.profiles set role = 'editor', approved = true where email = 'someone@example.com';
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, approved)
  values (new.id, coalesce(new.email, ''), 'viewer', false)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for users that already exist. They are created unapproved, so an operator must
-- grant access explicitly:
--   update public.profiles set role = 'admin', approved = true where email = 'you@example.com';
insert into public.profiles (id, email)
select id, coalesce(email, '') from auth.users
on conflict (id) do nothing;

-- Trigger helpers are not part of the API surface, and Supabase grants EXECUTE on new functions to
-- anon/authenticated by default.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles"
  on public.profiles for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- 2. Product publication
-- ---------------------------------------------------------------------------

alter table public.products
  add column if not exists published boolean;

-- Rows that predate this column were publicly visible under the previous permissive policies, so
-- they are backfilled as published to preserve existing behaviour. Written to be re-runnable:
-- only rows with no value yet are touched.
update public.products set published = true where published is null;

alter table public.products alter column published set default false;
alter table public.products alter column published set not null;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Section image galleries
-- ---------------------------------------------------------------------------

create table if not exists public.product_content_section_images (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.product_content_sections(id) on delete cascade,
  sort_order integer not null,
  url text not null,
  alt text not null default '',
  unique (section_id, sort_order)
);

alter table public.product_content_section_images enable row level security;

-- Carry any image stored on the section itself into the gallery before the columns are dropped.
insert into public.product_content_section_images (section_id, sort_order, url, alt)
select id, 1, image_url, coalesce(image_alt, '')
from public.product_content_sections
where image_url is not null
on conflict (section_id, sort_order) do nothing;

alter table public.product_content_sections
  drop column if exists image_url,
  drop column if exists image_alt;

-- ---------------------------------------------------------------------------
-- 4. Row level security for product content
-- ---------------------------------------------------------------------------

drop policy if exists "Public can read products" on public.products;
drop policy if exists "Authenticated users can manage products" on public.products;
drop policy if exists "Public can read product sections" on public.product_content_sections;
drop policy if exists "Authenticated users can manage product sections" on public.product_content_sections;

create policy "Published products are publicly readable"
  on public.products for select to anon, authenticated
  using (published = true);

create policy "Staff can read every product"
  on public.products for select to authenticated
  using (public.current_user_role() in ('admin', 'editor', 'viewer'));

create policy "Editors can create products"
  on public.products for insert to authenticated
  with check (public.current_user_role() in ('admin', 'editor'));

create policy "Editors can update products"
  on public.products for update to authenticated
  using (public.current_user_role() in ('admin', 'editor'))
  with check (public.current_user_role() in ('admin', 'editor'));

create policy "Admins can delete products"
  on public.products for delete to authenticated
  using (public.current_user_role() = 'admin');

-- Sections and their images are readable publicly only while their product is published, so an
-- unpublished draft cannot be read straight from the REST API.

create policy "Published product sections are publicly readable"
  on public.product_content_sections for select to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.published = true
    )
  );

create policy "Staff can read every product section"
  on public.product_content_sections for select to authenticated
  using (public.current_user_role() in ('admin', 'editor', 'viewer'));

create policy "Editors can manage product sections"
  on public.product_content_sections for all to authenticated
  using (public.current_user_role() in ('admin', 'editor'))
  with check (public.current_user_role() in ('admin', 'editor'));

create policy "Published section images are publicly readable"
  on public.product_content_section_images for select to anon, authenticated
  using (
    exists (
      select 1
      from public.product_content_sections s
      join public.products p on p.id = s.product_id
      where s.id = section_id and p.published = true
    )
  );

create policy "Staff can read every section image"
  on public.product_content_section_images for select to authenticated
  using (public.current_user_role() in ('admin', 'editor', 'viewer'));

create policy "Editors can manage section images"
  on public.product_content_section_images for all to authenticated
  using (public.current_user_role() in ('admin', 'editor'))
  with check (public.current_user_role() in ('admin', 'editor'));

-- ---------------------------------------------------------------------------
-- 5. Atomic content write
-- ---------------------------------------------------------------------------

-- Replaces a product and its content sections in one transaction. Without this, a failure between
-- "delete old sections" and "insert new sections" would silently destroy authored content.
create or replace function public.save_product_content(
  p_id uuid,
  p_title text,
  p_slug text,
  p_description text,
  p_tags text[],
  p_image_url text,
  p_image_alt text,
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
      title, slug, description, tags, image_url, image_alt,
      acquisition, locations, cta_label, published
    )
    values (
      p_title, p_slug, p_description, coalesce(p_tags, '{}'), p_image_url, p_image_alt,
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
revoke execute on function public.save_product_content(
  uuid, text, text, text, text[], text, text, text, text, text, boolean, jsonb
) from anon;

-- ---------------------------------------------------------------------------
-- 6. Product media storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Product images are publicly readable" on storage.objects;
create policy "Product images are publicly readable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "Editors can manage product images" on storage.objects;
create policy "Editors can manage product images"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'product-images'
    and public.current_user_role() in ('admin', 'editor')
  )
  with check (
    bucket_id = 'product-images'
    and public.current_user_role() in ('admin', 'editor')
  );

-- ---------------------------------------------------------------------------
-- 7. Contact enquiries
-- ---------------------------------------------------------------------------

create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text not null default '',
  location text not null default '',
  message text not null default '',
  source_path text not null default '',
  created_at timestamptz not null default now()
);

alter table public.contact_submissions enable row level security;

drop policy if exists "Anyone can submit an enquiry" on public.contact_submissions;
create policy "Anyone can submit an enquiry"
  on public.contact_submissions for insert to anon, authenticated
  with check (true);

drop policy if exists "Staff can read enquiries" on public.contact_submissions;
drop policy if exists "Admins can read enquiries" on public.contact_submissions;
-- Enquiries hold customer names, e-mail addresses and messages. Nothing in the CMS reads them yet,
-- so only administrators may, and the surface stays as small as possible.
create policy "Admins can read enquiries"
  on public.contact_submissions for select to authenticated
  using (public.current_user_role() = 'admin');
