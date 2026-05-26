-- ============================================================================
-- Birth certificate data persistence.
-- ============================================================================
-- Stores the exact values entered on a baby's birth certificate so the form
-- auto-fills the next time it is opened for that baby. Keyed per baby (the
-- newborn's patient record). Additive and safe to re-run.
--
-- Run once in the Supabase SQL editor.
-- ============================================================================

ALTER TABLE patients ADD COLUMN IF NOT EXISTS birth_certificate_data JSONB;
