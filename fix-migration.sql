-- ============================================================================
-- FIX MIGRATION - North Karachi Hospital
-- ============================================================================
-- This script safely adds missing columns and tables to your existing database
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Step 1: Check what tables exist
-- Run this first to see your current database state:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Step 2: Add missing columns to existing tables (if they don't have them)

-- Add department_id to doctors table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'doctors' AND column_name = 'department_id'
    ) THEN
        ALTER TABLE doctors ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add other potentially missing columns to doctors
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doctors' AND column_name = 'qualification') THEN
        ALTER TABLE doctors ADD COLUMN qualification VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doctors' AND column_name = 'experience') THEN
        ALTER TABLE doctors ADD COLUMN experience INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doctors' AND column_name = 'consultation_fee') THEN
        ALTER TABLE doctors ADD COLUMN consultation_fee DECIMAL(10, 2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doctors' AND column_name = 'schedule') THEN
        ALTER TABLE doctors ADD COLUMN schedule TEXT;
    END IF;
END $$;

-- Add missing columns to patients
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'blood_group') THEN
        ALTER TABLE patients ADD COLUMN blood_group VARCHAR(10);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'allergies') THEN
        ALTER TABLE patients ADD COLUMN allergies TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'emergency_contact') THEN
        ALTER TABLE patients ADD COLUMN emergency_contact VARCHAR(50);
    END IF;
END $$;

-- Add missing columns to treatments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'treatments' AND column_name = 'outcome') THEN
        ALTER TABLE treatments ADD COLUMN outcome VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'treatments' AND column_name = 'follow_up_required') THEN
        ALTER TABLE treatments ADD COLUMN follow_up_required BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'treatments' AND column_name = 'follow_up_date') THEN
        ALTER TABLE treatments ADD COLUMN follow_up_date DATE;
    END IF;
END $$;

-- Step 3: Create treatment_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS treatment_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100),
    description TEXT,
    default_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    process_details TEXT,
    duration VARCHAR(50),
    requirements TEXT,
    complications TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_treatment_types_name ON treatment_types(name);
CREATE INDEX IF NOT EXISTS idx_treatment_types_category ON treatment_types(category);
CREATE INDEX IF NOT EXISTS idx_treatment_types_active ON treatment_types(active);

-- Enable RLS
ALTER TABLE treatment_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "Enable all for authenticated users" ON treatment_types;
CREATE POLICY "Enable all for authenticated users" ON treatment_types FOR ALL USING (true) WITH CHECK (true);

-- Step 4: Create update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for treatment_types
DROP TRIGGER IF EXISTS update_treatment_types_updated_at ON treatment_types;
CREATE TRIGGER update_treatment_types_updated_at
    BEFORE UPDATE ON treatment_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Insert default treatment types
INSERT INTO treatment_types (name, category, description, default_price, process_details, duration, requirements)
VALUES
    -- Maternity Treatments
    ('Normal Delivery', 'Maternity', 'Natural childbirth delivery', 15000.00,
     'Patient admission, labor monitoring, delivery assistance, post-delivery care, basic newborn care',
     '4-12 hours', 'Pre-natal checkup records, blood type, consent form'),

    ('C-Section Operation', 'Surgical', 'Cesarean section surgical delivery', 50000.00,
     'Pre-operative assessment, anesthesia, surgical procedure, post-operative care, hospital stay (3-5 days)',
     '3-5 days', 'Pre-operative tests (CBC, Blood Group, Coagulation profile), ultrasound report, consent form'),

    ('Post-Natal Care', 'Maternity', 'Post-delivery care for mother and baby', 2000.00,
     'Mother and baby checkup, feeding guidance, recovery monitoring, wound care if applicable',
     '30-45 minutes', 'Delivery records'),

    ('Pre-Natal Checkup', 'Maternity', 'Pregnancy checkup and monitoring', 1000.00,
     'Physical examination, fetal heart monitoring, blood pressure check, basic ultrasound',
     '30 minutes', 'Previous checkup records if available'),

    ('High-Risk Pregnancy Care', 'Maternity', 'Specialized care for high-risk pregnancies', 3000.00,
     'Detailed monitoring, specialized tests, consultations, risk assessment',
     '1-2 hours', 'Complete medical history, previous pregnancy records, current medications'),

    -- Medical Treatments
    ('Dressing', 'Medical', 'Wound dressing and care', 500.00,
     'Cleaning and dressing of wounds, bandage application, antiseptic treatment',
     '15-30 minutes', 'None'),

    ('IV Therapy', 'Medical', 'Intravenous fluid and medication therapy', 1500.00,
     'IV line insertion, fluid/medication administration, continuous monitoring',
     '1-3 hours', 'Current medication list, allergy information'),

    ('Injection Administration', 'Medical', 'Intramuscular or subcutaneous injections', 300.00,
     'Medication preparation, administration, observation period',
     '10-15 minutes', 'Prescription or doctor''s order'),

    ('Catheterization', 'Medical', 'Urinary catheter insertion', 800.00,
     'Patient preparation, sterile catheter insertion, securing and monitoring',
     '15-20 minutes', 'None'),

    ('Nebulization', 'Medical', 'Respiratory therapy via nebulizer', 600.00,
     'Medication preparation, nebulization session, breathing assessment',
     '15-20 minutes', 'Prescription for medication'),

    -- Emergency Treatments
    ('Seizure Care', 'Emergency', 'Emergency seizure management', 3000.00,
     'Immediate assessment, protective positioning, medication administration, monitoring, stabilization',
     '1-2 hours', 'Patient history if available, emergency contact'),

    ('Emergency Care', 'Emergency', 'General emergency medical care', 5000.00,
     'Immediate assessment, stabilization, initial treatment, monitoring',
     'Variable', 'None - emergency situations'),

    ('Hemorrhage Control', 'Emergency', 'Emergency bleeding control', 4000.00,
     'Immediate assessment, bleeding control measures, stabilization, monitoring',
     '30 minutes - 2 hours', 'Blood group information if available'),

    ('Resuscitation', 'Emergency', 'Emergency resuscitation procedures', 8000.00,
     'CPR, advanced life support, stabilization, intensive monitoring',
     'Variable', 'None - emergency situations'),

    -- Surgical Treatments
    ('Minor Surgery', 'Surgical', 'Minor surgical procedures', 10000.00,
     'Local anesthesia, surgical procedure, wound closure, post-op care, recovery',
     '1-2 hours', 'Pre-operative assessment, consent form, fasting if required'),

    ('Episiotomy Repair', 'Surgical', 'Surgical repair of episiotomy', 5000.00,
     'Local anesthesia, surgical repair, wound care instructions',
     '30-45 minutes', 'Recent delivery, assessment of tear'),

    ('D&C (Dilation and Curettage)', 'Surgical', 'Uterine procedure for various conditions', 12000.00,
     'Anesthesia, dilation, curettage procedure, recovery, monitoring',
     '1-2 hours', 'Pre-operative assessment, consent form, fasting'),

    -- Preventive & Diagnostic
    ('Vaccination', 'Preventive', 'Immunization services for mother or child', 800.00,
     'Vaccine preparation, administration, observation period (15-30 minutes)',
     '20-30 minutes', 'Vaccination card, medical history'),

    ('Ultrasound', 'Diagnostic', 'Ultrasound imaging', 2000.00,
     'Patient preparation, scanning procedure, image capture and analysis',
     '20-30 minutes', 'Appointment, full bladder for some scans'),

    ('ECG', 'Diagnostic', 'Electrocardiogram test', 1200.00,
     'Patient preparation, electrode placement, recording, interpretation',
     '15-20 minutes', 'None'),

    ('Fetal Monitoring', 'Diagnostic', 'Non-stress test for fetal well-being', 1500.00,
     'External monitor placement, continuous recording, interpretation',
     '20-40 minutes', 'None'),

    -- Newborn Care
    ('Newborn Assessment', 'Pediatric', 'Complete newborn health assessment', 1500.00,
     'Physical examination, vital signs, screening tests, parental guidance',
     '30-45 minutes', 'Birth records'),

    ('Phototherapy', 'Pediatric', 'Light therapy for neonatal jaundice', 3000.00,
     'Setup of phototherapy unit, continuous treatment, monitoring bilirubin levels',
     '12-24 hours', 'Bilirubin test results, newborn assessment'),

    ('Newborn Vaccination', 'Preventive', 'Birth vaccines (BCG, Hepatitis B)', 500.00,
     'Vaccine administration, observation, documentation',
     '15 minutes', 'Birth certificate or hospital birth record'),

    -- Consultation & Follow-up
    ('Doctor Consultation', 'Consultation', 'General doctor consultation', 1000.00,
     'Medical history review, physical examination, diagnosis, treatment plan',
     '15-30 minutes', 'Previous medical records if available'),

    ('Specialist Consultation', 'Consultation', 'Specialist doctor consultation', 2000.00,
     'Detailed medical history, specialized examination, expert diagnosis and treatment plan',
     '30-45 minutes', 'Referral letter, previous test results'),

    ('Follow-up Visit', 'Consultation', 'Post-treatment follow-up', 500.00,
     'Progress assessment, wound check, medication adjustment if needed',
     '15-20 minutes', 'Previous treatment records')

ON CONFLICT (name) DO NOTHING;

-- Step 6: Verify the fix
-- SELECT COUNT(*) as treatment_types_count FROM treatment_types;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'doctors' ORDER BY column_name;

-- ============================================================================
-- FIX COMPLETE!
-- ============================================================================
-- Now refresh your web application and the error should be gone.
-- ============================================================================
