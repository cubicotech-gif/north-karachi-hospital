-- ========================================
-- COMPLETE FIX FOR DOCTORS TABLE
-- Make ALL columns nullable EXCEPT name and contact
-- Run this in Supabase SQL Editor
-- ========================================

-- Make ALL these columns nullable (optional)
ALTER TABLE doctors ALTER COLUMN department DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN cnic_number DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN date_of_birth DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN gender DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN email DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN address DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN opd_fee DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN commission_type DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN commission_rate DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN specialization DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN qualification DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN experience DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN consultation_hours DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN room_number DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN available DROP NOT NULL;
ALTER TABLE doctors ALTER COLUMN joining_date DROP NOT NULL;

-- Verify the changes - should show 'YES' for is_nullable on all columns except id, name, contact
SELECT
    column_name,
    is_nullable,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'doctors'
ORDER BY ordinal_position;
