create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  tags text[] not null default '{}',
  image_url text,
  image_alt text,
  acquisition text not null default '',
  locations text not null default '',
  cta_label text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_content_sections (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order integer not null,
  heading text not null default '',
  body text not null default '',
  image_url text,
  image_alt text,
  unique (product_id, sort_order)
);

alter table public.products enable row level security;
alter table public.product_content_sections enable row level security;

create policy "Public can read products" on public.products for select using (true);
create policy "Public can read product sections" on public.product_content_sections for select using (true);
create policy "Authenticated users can manage products" on public.products for all to authenticated using (true) with check (true);
create policy "Authenticated users can manage product sections" on public.product_content_sections for all to authenticated using (true) with check (true);
