-- ========================================
-- FIX DOCTORS TABLE - Make department optional
-- Copy and run this in Supabase SQL Editor
-- ========================================

-- Make department nullable for doctors
ALTER TABLE doctors ALTER COLUMN department DROP NOT NULL;

-- Verify the change
SELECT
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name = 'doctors'
AND column_name = 'department';
