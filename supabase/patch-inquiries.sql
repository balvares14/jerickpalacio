-- Add phone to inquiries; email OR phone required (not auth profiles — public form rows)
alter table public.inquiries
  add column if not exists phone text;

alter table public.inquiries
  alter column name drop not null;

alter table public.inquiries
  alter column email drop not null;

alter table public.inquiries
  drop constraint if exists inquiries_contact_required;

alter table public.inquiries
  add constraint inquiries_contact_required check (
    (email is not null and length(trim(email)) > 0)
    or (phone is not null and length(trim(phone)) > 0)
  );
