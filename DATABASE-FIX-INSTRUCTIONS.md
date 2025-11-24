# Database Schema Fix - Department Column Issue

## Problem
The error `ERROR: 42703: column "department_id" does not exist` occurs due to a schema mismatch:

- **Database schema**: Expects `department_id UUID` (foreign key)
- **Application code**: Uses `department VARCHAR` (department name as string)

## Solution

### Option 1: Apply the Quick Fix (Recommended for Existing Databases)

If your database is already created with the old schema, run this SQL migration:

1. Open your Supabase SQL Editor
2. Run the contents of `fix-doctors-department.sql`:

```sql
-- Add the department column as VARCHAR
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS department VARCHAR(255);

-- Make department_id nullable (optional)
ALTER TABLE doctors ALTER COLUMN department_id DROP NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_doctors_department ON doctors(department);
```

3. Verify the fix:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'doctors'
ORDER BY ordinal_position;
```

You should see both columns:
- `department` (character varying, YES)
- `department_id` (uuid, YES)

### Option 2: Fresh Database Setup

If you're setting up a new database, use the updated `complete-migration.sql` file:

1. Drop the existing doctors table (⚠️ WARNING: This deletes all data):
```sql
DROP TABLE IF EXISTS doctors CASCADE;
```

2. Run the updated `complete-migration.sql` file in your Supabase SQL Editor

The updated schema now includes both fields:
- `department VARCHAR(255)` - Used by the application
- `department_id UUID` - Optional foreign key for relational queries (future use)

## Verification Steps

After applying the fix:

1. **Check the schema**:
```sql
\d doctors;
```

2. **Test inserting a doctor**:
```sql
INSERT INTO doctors (name, contact, department, consultation_fee)
VALUES ('Dr. Test', '0300-1234567', 'General Medicine', 1000.00);
```

3. **Verify the data**:
```sql
SELECT id, name, department, department_id FROM doctors LIMIT 5;
```

4. **Test the application**: Try adding a new doctor through the web interface

## Root Cause

The original migration file (`complete-migration.sql`) was designed with a normalized schema using `department_id` as a foreign key to the `departments` table. However, the application code (particularly `DoctorManagement.tsx` and `hospitalData.ts`) was implemented to use department names as strings.

## Future Improvements (Optional)

To fully utilize the relational database design:

1. Modify the application to use department IDs instead of names
2. Add a department selector that loads from the `departments` table
3. Update all doctor operations to store `department_id` and display `department.name`

This would provide better data integrity and allow for easier department management.

## Files Modified

- ✅ `fix-doctors-department.sql` - Quick fix migration
- ✅ `complete-migration.sql` - Updated with both columns for future deployments
- 📝 `DATABASE-FIX-INSTRUCTIONS.md` - This file

## Need Help?

If you encounter any issues:
1. Check your Supabase logs for detailed error messages
2. Verify your RLS policies allow the operations
3. Ensure you're authenticated when running queries
4. Check that the `departments` table exists (it's used by the FK constraint)
