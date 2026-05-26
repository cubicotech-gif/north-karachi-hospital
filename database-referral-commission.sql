-- ============================================================================
-- Referral commission support.
-- ============================================================================
-- Lets a doctor route a share of their patients' OPD revenue to another party
-- (an existing doctor or an outside referrer). The referral share is taken from
-- the hospital's portion -- the treating doctor's own commission is unchanged.
--
-- Idempotent and safe to re-run. Run once in the Supabase SQL editor.
-- ============================================================================

-- Per-doctor referral configuration.
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS referral_share_rate DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS referral_recipient_name VARCHAR(255);
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS referral_recipient_doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL;

-- Vouchers can now be issued to a named party (external referrers have no
-- doctor_id). referral payouts reuse the existing voucher flow with a new type.
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(255);
