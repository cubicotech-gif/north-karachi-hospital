-- ========================================
-- FIX TREATMENT_TYPES TABLE
-- Make optional fields nullable
-- Run this in Supabase SQL Editor
-- ========================================

-- Make optional fields nullable
ALTER TABLE treatment_types ALTER COLUMN description DROP NOT NULL;
ALTER TABLE treatment_types ALTER COLUMN process_details DROP NOT NULL;
ALTER TABLE treatment_types ALTER COLUMN duration DROP NOT NULL;
ALTER TABLE treatment_types ALTER COLUMN requirements DROP NOT NULL;
ALTER TABLE treatment_types ALTER COLUMN category DROP NOT NULL;

-- Verify the changes
SELECT
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name = 'treatment_types'
ORDER BY ordinal_position;
