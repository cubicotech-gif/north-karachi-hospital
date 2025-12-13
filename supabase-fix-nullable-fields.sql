-- ========================================
-- MAKE OPTIONAL FIELDS NULLABLE IN DATABASE
-- Run this in Supabase SQL Editor
-- ========================================

-- PATIENTS TABLE
-- Keep name, contact as NOT NULL (required)
-- Make everything else nullable
ALTER TABLE patients ALTER COLUMN age DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN cnic_number DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN gender DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN department DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN blood_group DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN marital_status DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN address DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN emergency_contact DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN care_of DROP NOT NULL;
ALTER TABLE patients ALTER COLUMN chief_complaint DROP NOT NULL;

-- DOCTORS TABLE
-- Keep name, contact as NOT NULL (required)
-- Make everything else nullable INCLUDING department
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

-- APPOINTMENTS TABLE
-- Keep patient_id, doctor_id, appointment_date, appointment_time as NOT NULL
-- Make everything else nullable
ALTER TABLE appointments ALTER COLUMN reason DROP NOT NULL;
ALTER TABLE appointments ALTER COLUMN notes DROP NOT NULL;

-- DEPARTMENTS TABLE
-- Keep name as NOT NULL
-- Make everything else nullable
ALTER TABLE departments ALTER COLUMN description DROP NOT NULL;
ALTER TABLE departments ALTER COLUMN location DROP NOT NULL;
ALTER TABLE departments ALTER COLUMN contact_extension DROP NOT NULL;
ALTER TABLE departments ALTER COLUMN head_of_department DROP NOT NULL;

-- LAB_TESTS TABLE
-- Keep name, price as NOT NULL
-- Make everything else nullable
ALTER TABLE lab_tests ALTER COLUMN department DROP NOT NULL;
ALTER TABLE lab_tests ALTER COLUMN normal_range DROP NOT NULL;
ALTER TABLE lab_tests ALTER COLUMN description DROP NOT NULL;
ALTER TABLE lab_tests ALTER COLUMN sample_type DROP NOT NULL;
ALTER TABLE lab_tests ALTER COLUMN report_time DROP NOT NULL;

-- ROOMS TABLE
-- Keep room_number, type as NOT NULL
-- Make everything else nullable
ALTER TABLE rooms ALTER COLUMN bed_count DROP NOT NULL;
ALTER TABLE rooms ALTER COLUMN price_per_day DROP NOT NULL;
ALTER TABLE rooms ALTER COLUMN department DROP NOT NULL;

-- USERS TABLE
-- Keep username, email as NOT NULL
-- Make everything else nullable
ALTER TABLE users ALTER COLUMN full_name DROP NOT NULL;
ALTER TABLE users ALTER COLUMN contact DROP NOT NULL;
ALTER TABLE users ALTER COLUMN cnic_number DROP NOT NULL;

-- TREATMENT_TYPES TABLE
-- Make all optional fields nullable
ALTER TABLE treatment_types ALTER COLUMN description DROP NOT NULL;
ALTER TABLE treatment_types ALTER COLUMN process_details DROP NOT NULL;
ALTER TABLE treatment_types ALTER COLUMN duration DROP NOT NULL;
ALTER TABLE treatment_types ALTER COLUMN requirements DROP NOT NULL;

-- ========================================
-- VERIFICATION QUERIES
-- Run these to verify changes
-- ========================================

-- Check patients table constraints
SELECT
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name = 'patients'
ORDER BY ordinal_position;

-- Check doctors table constraints
SELECT
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name = 'doctors'
ORDER BY ordinal_position;
