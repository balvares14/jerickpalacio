-- Add inquiry_form block type for customizable contact form copy
alter type block_type add value if not exists 'inquiry_form';

-- Ensure contact page has an inquiry form block (optional seed)
insert into public.page_blocks (page_id, block_type, sort_order, content)
select
  p.id,
  'inquiry_form',
  999,
  '{
    "form_title": "Send an inquiry",
    "form_lead": "Share your email or phone number and a message — no account needed.",
    "name_label": "Name",
    "name_optional_text": "(optional)",
    "name_placeholder": "Your name",
    "email_label": "Email",
    "email_placeholder": "you@example.com",
    "phone_label": "Phone",
    "phone_placeholder": "(555) 555-5555",
    "contact_hint": "Provide at least one: email or phone.",
    "message_label": "Message",
    "message_required_text": "*",
    "message_placeholder": "Tell us about your project or question…",
    "submit_label": "Send inquiry",
    "submit_loading_label": "Sending…",
    "success_message": "Thank you — your inquiry was sent. We''ll be in touch soon."
  }'::jsonb
from public.pages p
where p.slug = 'contact'
  and not exists (
    select 1 from public.page_blocks pb
    where pb.page_id = p.id and pb.block_type = 'inquiry_form'
  );
