-- Logo image layout (header + footer) and favicon option
alter table public.site_settings
  add column if not exists logo_layout text not null default 'text_only',
  add column if not exists footer_logo_layout text not null default 'text_only',
  add column if not exists logo_as_favicon boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'site_settings_logo_layout_check'
  ) then
    alter table public.site_settings
      add constraint site_settings_logo_layout_check
      check (logo_layout in ('text_only', 'image_only', 'image_left', 'image_right', 'image_top'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'site_settings_footer_logo_layout_check'
  ) then
    alter table public.site_settings
      add constraint site_settings_footer_logo_layout_check
      check (footer_logo_layout in ('text_only', 'image_only', 'image_left', 'image_right', 'image_top'));
  end if;
end $$;
