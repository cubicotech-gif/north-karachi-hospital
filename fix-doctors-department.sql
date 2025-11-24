-- ============================================================================
-- FIX: Add 'department' column to doctors table
-- ============================================================================
-- This migration fixes the schema mismatch between the database and application
-- The application expects a 'department' VARCHAR field, not 'department_id' UUID
-- ============================================================================

-- Add the department column as VARCHAR to store department names
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS department VARCHAR(255);

-- Optionally: If you want to migrate data from department_id to department names
-- UPDATE doctors d
-- SET department = dept.name
-- FROM departments dept
-- WHERE d.department_id = dept.id;

-- Make department_id nullable (if you want to keep it for future use)
ALTER TABLE doctors ALTER COLUMN department_id DROP NOT NULL;

-- Add index for the new department column for better query performance
CREATE INDEX IF NOT EXISTS idx_doctors_department ON doctors(department);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration, you can verify with:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'doctors'
-- ORDER BY ordinal_position;
-- ============================================================================
