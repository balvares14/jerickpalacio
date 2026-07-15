-- Repair Home page if it drifted to single_column / wrong settings
-- Safe to re-run

-- Ensure home template enum exists
do $$ begin
  alter type page_template add value if not exists 'home';
exception when duplicate_object then null;
end $$;

-- Ensure page_settings / page_id columns exist (from patch-pages-refactor)
alter table public.pages
  add column if not exists page_settings jsonb not null default '{}';

alter table public.work_items
  add column if not exists page_id uuid references public.pages (id) on delete cascade;

-- Fix any /work page that isn't template=home
update public.pages
set
  template = 'home',
  page_type = 'custom',
  slug = 'work',
  page_settings = coalesce(page_settings, '{}'::jsonb) || jsonb_build_object(
    'masthead_enabled', coalesce((page_settings->>'masthead_enabled')::boolean, true),
    'masthead_show_arrow', coalesce((page_settings->>'masthead_show_arrow')::boolean, true),
    'show_back_to_top', coalesce((page_settings->>'show_back_to_top')::boolean, false),
    'work_grid_columns', coalesce((page_settings->>'work_grid_columns')::int, 2)
  )
where slug = 'work' and template is distinct from 'home';

-- Also fix rows titled Home with template home-like intent
update public.pages
set template = 'home', slug = 'work', page_type = 'custom'
where lower(title) = 'home'
  and template is distinct from 'home'
  and not exists (select 1 from public.pages p2 where p2.template = 'home');

-- Link orphan work_items to the home page
update public.work_items wi
set page_id = p.id
from public.pages p
where p.template = 'home' and wi.page_id is null;
