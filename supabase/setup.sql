-- =============================================================================
-- Portfolio setup — run once in Supabase SQL Editor
-- Dashboard → SQL → New query → paste → Run
-- =============================================================================

-- Extensions
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type user_role as enum ('admin', 'user');
create type media_type as enum ('image', 'video', 'audio');
create type page_type as enum ('project', 'contact', 'custom');
create type page_template as enum (
  'single_column',
  'multi_column',
  'alternating',
  'full_bleed',
  'video_gallery'
);
create type block_type as enum (
  'heading',
  'paragraph',
  'image',
  'video',
  'audio',
  'image_row',
  'text_media_split',
  'spacer',
  'inquiry_form'
);

-- -----------------------------------------------------------------------------
-- updated_at trigger
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Profiles (auth.users companion — passwords live in Supabase Auth, not here)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile when a user is added in Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Admin helper (for RLS)
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- Site settings (singleton)
-- -----------------------------------------------------------------------------
create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  logo_text text not null default 'Jerick Palacio',
  logo_link_path text not null default '/contact',
  logo_media_id uuid,
  footer_text text,
  footer_link_path text default '/contact',
  masthead_enabled boolean not null default true,
  masthead_title text default 'We''re so glad to have you.',
  masthead_subtitle text default 'Check out what We''ve got.',
  masthead_show_arrow boolean not null default true,
  masthead_bg_media_id uuid,
  work_grid_columns smallint not null default 2 check (work_grid_columns between 1 and 3),
  site_title text default 'Jerick Palacio',
  default_meta_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Navigation
-- -----------------------------------------------------------------------------
create table public.nav_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  path text not null,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger nav_items_updated_at
  before update on public.nav_items
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Media catalog (files live in Storage bucket: portfolio-media)
-- -----------------------------------------------------------------------------
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_bucket text not null default 'portfolio-media',
  storage_path text not null,
  public_url text not null,
  media_type media_type not null,
  alt_text text,
  caption text,
  file_name text,
  file_size bigint,
  mime_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger media_assets_updated_at
  before update on public.media_assets
  for each row execute function public.set_updated_at();

-- FKs on site_settings after media_assets exists
alter table public.site_settings
  add constraint site_settings_logo_media_fk
    foreign key (logo_media_id) references public.media_assets (id) on delete set null,
  add constraint site_settings_masthead_bg_media_fk
    foreign key (masthead_bg_media_id) references public.media_assets (id) on delete set null;

-- -----------------------------------------------------------------------------
-- Pages (project detail, contact, custom)
-- -----------------------------------------------------------------------------
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  page_type page_type not null default 'project',
  title text not null,
  template page_template not null default 'single_column',
  is_published boolean not null default false,
  meta_description text,
  og_image_media_id uuid references public.media_assets (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger pages_updated_at
  before update on public.pages
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Work grid items (home page cards)
-- -----------------------------------------------------------------------------
create table public.work_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  cover_media_id uuid references public.media_assets (id) on delete set null,
  cover_poster_media_id uuid references public.media_assets (id) on delete set null,
  detail_page_id uuid references public.pages (id) on delete set null,
  sort_order int not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger work_items_updated_at
  before update on public.work_items
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Page blocks (content inside any page)
-- -----------------------------------------------------------------------------
create table public.page_blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages (id) on delete cascade,
  block_type block_type not null,
  sort_order int not null default 0,
  content jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index page_blocks_page_sort on public.page_blocks (page_id, sort_order);

create trigger page_blocks_updated_at
  before update on public.page_blocks
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Contact inquiries
-- -----------------------------------------------------------------------------
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  message text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inquiries_contact_required check (
    (email is not null and length(trim(email)) > 0)
    or (phone is not null and length(trim(phone)) > 0)
  )
);

create trigger inquiries_updated_at
  before update on public.inquiries
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Table grants (required before RLS — without these you get 403 / error 42501)
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;

alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;

grant execute on function public.is_admin() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.nav_items enable row level security;
alter table public.media_assets enable row level security;
alter table public.pages enable row level security;
alter table public.work_items enable row level security;
alter table public.page_blocks enable row level security;
alter table public.inquiries enable row level security;

-- Profiles: users read own row; admins read all
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_admin" on public.profiles
  for update to authenticated
  using (public.is_admin());

-- Site settings: public read; admin write
create policy "site_settings_select_public" on public.site_settings
  for select to anon, authenticated
  using (true);

create policy "site_settings_insert_admin" on public.site_settings
  for insert to authenticated
  with check (public.is_admin());

create policy "site_settings_update_admin" on public.site_settings
  for update to authenticated
  using (public.is_admin());

-- Nav: public read visible; admin full
create policy "nav_select_public" on public.nav_items
  for select to anon, authenticated
  using (is_visible = true or public.is_admin());

create policy "nav_insert_admin" on public.nav_items
  for insert to authenticated
  with check (public.is_admin());

create policy "nav_update_admin" on public.nav_items
  for update to authenticated
  using (public.is_admin());

create policy "nav_delete_admin" on public.nav_items
  for delete to authenticated
  using (public.is_admin());

-- Media: public read; admin write
create policy "media_select_public" on public.media_assets
  for select to anon, authenticated
  using (true);

create policy "media_insert_admin" on public.media_assets
  for insert to authenticated
  with check (public.is_admin());

create policy "media_update_admin" on public.media_assets
  for update to authenticated
  using (public.is_admin());

create policy "media_delete_admin" on public.media_assets
  for delete to authenticated
  using (public.is_admin());

-- Pages: public read published; admin full
create policy "pages_select_public" on public.pages
  for select to anon, authenticated
  using (is_published = true or public.is_admin());

create policy "pages_insert_admin" on public.pages
  for insert to authenticated
  with check (public.is_admin());

create policy "pages_update_admin" on public.pages
  for update to authenticated
  using (public.is_admin());

create policy "pages_delete_admin" on public.pages
  for delete to authenticated
  using (public.is_admin());

-- Work items: public read published; admin full
create policy "work_items_select_public" on public.work_items
  for select to anon, authenticated
  using (is_published = true or public.is_admin());

create policy "work_items_insert_admin" on public.work_items
  for insert to authenticated
  with check (public.is_admin());

create policy "work_items_update_admin" on public.work_items
  for update to authenticated
  using (public.is_admin());

create policy "work_items_delete_admin" on public.work_items
  for delete to authenticated
  using (public.is_admin());

-- Page blocks: public read if parent page published; admin full
create policy "page_blocks_select_public" on public.page_blocks
  for select to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.pages p
      where p.id = page_id and p.is_published = true
    )
  );

create policy "page_blocks_insert_admin" on public.page_blocks
  for insert to authenticated
  with check (public.is_admin());

create policy "page_blocks_update_admin" on public.page_blocks
  for update to authenticated
  using (public.is_admin());

create policy "page_blocks_delete_admin" on public.page_blocks
  for delete to authenticated
  using (public.is_admin());

-- Inquiries: anyone can submit; admin reads
create policy "inquiries_insert_public" on public.inquiries
  for insert to anon, authenticated
  with check (true);

create policy "inquiries_select_admin" on public.inquiries
  for select to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- Storage bucket: portfolio-media
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-media',
  'portfolio-media',
  true,
  52428800,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/wav', 'audio/mp4'
  ]
)
on conflict (id) do nothing;

-- Public read
create policy "storage_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'portfolio-media');

-- Admin upload / update / delete
create policy "storage_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'portfolio-media' and public.is_admin());

create policy "storage_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'portfolio-media' and public.is_admin());

create policy "storage_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'portfolio-media' and public.is_admin());

-- -----------------------------------------------------------------------------
-- Seed defaults
-- -----------------------------------------------------------------------------
insert into public.site_settings (
  logo_text,
  masthead_title,
  masthead_subtitle,
  site_title
) values (
  'Jerick Palacio',
  'We''re so glad to have you.',
  'Check out what We''ve got.',
  'Jerick Palacio'
);

insert into public.nav_items (label, path, sort_order) values
  ('Work', '/work', 0),
  ('Contact Inquiry', '/contact', 1);

-- =============================================================================
-- FIRST ADMIN USER (run after creating user in Auth → Users → Add user)
-- Replace YOUR_USER_UUID and email with values from the Auth dashboard:
--
--   update public.profiles
--   set role = 'admin'
--   where email = 'you@example.com';
-- =============================================================================
