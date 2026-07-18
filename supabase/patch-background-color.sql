-- Site-wide theme: background, text color, font
alter table public.site_settings
  add column if not exists background_color text not null default '#ffffff',
  add column if not exists text_color text not null default '#111111',
  add column if not exists font_family text not null default 'work_sans';
