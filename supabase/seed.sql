-- ============================================================
-- AI Approval Queue: demo seed data
-- Run AFTER schema.sql, and AFTER you have signed up at least once.
-- Run in: Supabase Dashboard > SQL Editor > New query
-- Safe to re-run (fixed UUIDs + on conflict do nothing).
-- ============================================================
--
-- Inserts three already-approved historical actions so the audit log has
-- history on demo day. These are status='approved', so they do NOT appear
-- in the pending queue.

-- Attributed to your first (oldest) signed-up user.
-- If no user exists yet, approver_id/actor_id land as NULL and the audit
-- page shows a dash, so sign up first to avoid that.

insert into events (id, source, payload, received_at) values
  (
    'a1000000-0000-4000-8000-000000000001',
    'web_form',
    '{"from":"dana@northwind.com","subject":"Pricing for 40 seats","body":"We are comparing three vendors and need pricing for 40 seats before Friday."}'::jsonb,
    now() - interval '5 days'
  ),
  (
    'a1000000-0000-4000-8000-000000000002',
    'customer_portal',
    '{"from":"omar@brightlabs.io","order_id":"ORD-7712","amount":89.00,"reason":"Duplicate charge on the same invoice"}'::jsonb,
    now() - interval '3 days'
  ),
  (
    'a1000000-0000-4000-8000-000000000003',
    'support_form',
    '{"from":"priya@quantacare.org","subject":"Data export blocked","body":"Our nightly export has failed four nights running and we have a compliance deadline."}'::jsonb,
    now() - interval '1 day'
  )
on conflict (id) do nothing;

insert into actions (id, event_id, action_type, ai_draft, status, approver_id, human_edits, created_at, decided_at) values
  (
    'b2000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000001',
    'reply_email',
    '{"action_type":"reply_email","confidence":0.91,"reasoning":"Inbound pricing request from a qualified lead with a stated deadline.","draft_content":{"to":"dana@northwind.com","subject":"Re: Pricing for 40 seats","body":"Hi Dana,\n\nHappy to help. For 40 seats our team plan comes to $12/seat/month billed annually. I can send a formal quote today so you have it well before Friday.\n\nWould a 15-minute call tomorrow work?\n\nBest,\nSales Team","amount":null,"structured_fields":{}}}'::jsonb,
    'approved',
    (select id from auth.users order by created_at asc limit 1),
    null,
    now() - interval '5 days',
    now() - interval '5 days' + interval '22 minutes'
  ),
  (
    'b2000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000002',
    'process_refund',
    '{"action_type":"process_refund","confidence":0.78,"reasoning":"Duplicate charge is verifiable from the invoice and falls inside the automatic refund threshold.","draft_content":{"to":"omar@brightlabs.io","subject":"Refund issued for ORD-7712","body":"Hi Omar,\n\nYou were charged twice on invoice ORD-7712. We have refunded the duplicate $89.00 charge; it should appear within 3-5 business days.\n\nSorry for the trouble.\n\nSupport","amount":89.00,"structured_fields":{"order_id":"ORD-7712"}}}'::jsonb,
    'approved',
    (select id from auth.users order by created_at asc limit 1),
    '{"body":"Hi Omar,\n\nYou were charged twice on invoice ORD-7712. We have refunded the duplicate $89.00 charge and it should land within 3-5 business days. I have also added a note to your account so this cannot recur.\n\nApologies for the hassle.\n\nSupport"}'::jsonb,
    now() - interval '3 days',
    now() - interval '3 days' + interval '8 minutes'
  ),
  (
    'b2000000-0000-4000-8000-000000000003',
    'a1000000-0000-4000-8000-000000000003',
    'escalate',
    '{"action_type":"escalate","confidence":0.64,"reasoning":"Repeated infrastructure failure with a compliance deadline exceeds first-line support authority.","draft_content":{"to":"priya@quantacare.org","subject":"Re: Data export blocked","body":"Escalating to the platform on-call engineer. Customer has a compliance deadline and four consecutive failed nightly exports.","amount":null,"structured_fields":{"severity":"high"}}}'::jsonb,
    'approved',
    (select id from auth.users order by created_at asc limit 1),
    null,
    now() - interval '1 day',
    now() - interval '1 day' + interval '4 minutes'
  )
on conflict (id) do nothing;

insert into audit_log (id, actor_id, action, entity, entity_id, metadata, ts) values
  (
    'c3000000-0000-4000-8000-000000000001',
    (select id from auth.users order by created_at asc limit 1),
    'approve_action', 'action', 'b2000000-0000-4000-8000-000000000001',
    '{"action_type":"reply_email","ai_confidence":0.91,"was_edited":false}'::jsonb,
    now() - interval '5 days' + interval '22 minutes'
  ),
  (
    'c3000000-0000-4000-8000-000000000002',
    (select id from auth.users order by created_at asc limit 1),
    'simulate_execution', 'action', 'b2000000-0000-4000-8000-000000000001',
    '{"simulated":"Would send email to dana@northwind.com with subject \"Re: Pricing for 40 seats\" (241 chars)","dry_run":true}'::jsonb,
    now() - interval '5 days' + interval '22 minutes'
  ),
  (
    'c3000000-0000-4000-8000-000000000003',
    (select id from auth.users order by created_at asc limit 1),
    'edit_draft', 'action', 'b2000000-0000-4000-8000-000000000002',
    '{"new_length":268}'::jsonb,
    now() - interval '3 days' + interval '6 minutes'
  ),
  (
    'c3000000-0000-4000-8000-000000000004',
    (select id from auth.users order by created_at asc limit 1),
    'approve_action', 'action', 'b2000000-0000-4000-8000-000000000002',
    '{"action_type":"process_refund","ai_confidence":0.78,"was_edited":true}'::jsonb,
    now() - interval '3 days' + interval '8 minutes'
  ),
  (
    'c3000000-0000-4000-8000-000000000005',
    (select id from auth.users order by created_at asc limit 1),
    'simulate_execution', 'action', 'b2000000-0000-4000-8000-000000000002',
    '{"simulated":"Would process refund of $89 to omar@brightlabs.io","dry_run":true}'::jsonb,
    now() - interval '3 days' + interval '8 minutes'
  ),
  (
    'c3000000-0000-4000-8000-000000000006',
    (select id from auth.users order by created_at asc limit 1),
    'approve_action', 'action', 'b2000000-0000-4000-8000-000000000003',
    '{"action_type":"escalate","ai_confidence":0.64,"was_edited":false}'::jsonb,
    now() - interval '1 day' + interval '4 minutes'
  ),
  (
    'c3000000-0000-4000-8000-000000000007',
    (select id from auth.users order by created_at asc limit 1),
    'simulate_execution', 'action', 'b2000000-0000-4000-8000-000000000003',
    '{"simulated":"Would escalate to a human specialist","dry_run":true}'::jsonb,
    now() - interval '1 day' + interval '4 minutes'
  )
on conflict (id) do nothing;
