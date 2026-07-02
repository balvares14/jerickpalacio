-- Run once on existing projects (after setup.sql)
-- Adds page-level settings, Home template, links work grid to home page

-- Home template enum value
alter type page_template add value if not exists 'home';

-- Page-level template settings (masthead, grid, etc.)
alter table public.pages
  add column if not exists page_settings jsonb not null default '{}';

alter table public.pages
  add column if not exists sort_order int not null default 0;

-- Work grid items belong to a page (Home)
alter table public.work_items
  add column if not exists page_id uuid references public.pages (id) on delete cascade;

create index if not exists work_items_page_id_sort on public.work_items (page_id, sort_order);

-- Create Home page from existing site_settings masthead/grid (if no home page yet)
insert into public.pages (title, slug, page_type, template, is_published, sort_order, page_settings)
select
  'Home',
  'work',
  'custom',
  'home',
  true,
  0,
  jsonb_build_object(
    'masthead_enabled', coalesce(ss.masthead_enabled, true),
    'masthead_title', coalesce(ss.masthead_title, 'We''re so glad to have you.'),
    'masthead_subtitle', coalesce(ss.masthead_subtitle, 'Check out what We''ve got.'),
    'masthead_show_arrow', coalesce(ss.masthead_show_arrow, true),
    'work_grid_columns', coalesce(ss.work_grid_columns, 2)
  )
from public.site_settings ss
where not exists (select 1 from public.pages where template = 'home');

-- Link existing work items to the home page
update public.work_items wi
set page_id = p.id
from public.pages p
where p.template = 'home' and wi.page_id is null;

-- Optional: seed a Contact page shell
insert into public.pages (title, slug, page_type, template, is_published, sort_order, page_settings)
select
  'Contact Inquiry',
  'contact',
  'contact',
  'single_column',
  true,
  1,
  '{"show_page_title": true, "intro_enabled": false}'::jsonb
where not exists (select 1 from public.pages where slug = 'contact');
