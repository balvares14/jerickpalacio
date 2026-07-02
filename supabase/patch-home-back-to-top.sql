-- Optional: set show_back_to_top on existing Home pages (default off)
update public.pages
set page_settings = page_settings || '{"show_back_to_top": false}'::jsonb
where template = 'home'
  and not (page_settings ? 'show_back_to_top');
