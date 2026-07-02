-- Run this in Supabase SQL Editor if you get "permission denied for table profiles"
-- (403 / error 42501 after login)

-- Schema access
grant usage on schema public to anon, authenticated;

-- Table access (RLS still controls row-level access)
grant select, insert, update, delete on all tables in schema public to anon, authenticated;

-- Sequences (for uuid defaults)
grant usage, select on all sequences in schema public to anon, authenticated;

-- Future tables
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;

alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;

-- Functions used by RLS policies
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.set_updated_at() to anon, authenticated;
