-- ============================================================
-- Reset to a clean demo state.
-- Run in: Supabase Dashboard > SQL Editor > New query
--
-- Wipes everything the app has recorded so the pending queue starts
-- empty. Your user account and profile are left alone.
--
-- To get the three historical approvals back in the audit log,
-- run seed.sql afterwards.
-- ============================================================

delete from audit_log;
delete from actions;
delete from events;
delete from rate_limits;
