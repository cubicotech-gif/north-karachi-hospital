-- ============================================================================
-- NORTH KARACHI HOSPITAL - EXTERNAL NEWBORN & DISCHARGE MODULE MIGRATION
-- ============================================================================
-- This migration adds:
-- 1. Fields for external newborn registration (father_name, is_external, referral_source)
-- 2. Discharges table for storing discharge records (enabling reprinting)
-- 3. Additional NICU treatment types
-- ============================================================================

-- ============================================================================
-- STEP 1: ALTER PATIENTS TABLE FOR EXTERNAL NEWBORNS
-- Add fields for external baby registration (not born in hospital)
-- ============================================================================

-- Father's name for newborns
ALTER TABLE patients ADD COLUMN IF NOT EXISTS father_name VARCHAR(255);

-- Flag to indicate if this is an external admission (baby not born here)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_external_admission BOOLEAN DEFAULT FALSE;

-- Referral source for external admissions
ALTER TABLE patients ADD COLUMN IF NOT EXISTS referral_source VARCHAR(255);

-- Referral notes (reason for referral, referring doctor, etc.)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS referral_notes TEXT;

-- Date of birth for accurate age calculation (especially for newborns)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Create index for external admissions
CREATE INDEX IF NOT EXISTS idx_patients_is_external ON patients(is_external_admission) WHERE is_external_admission = true;

-- ============================================================================
-- STEP 2: CREATE DISCHARGES TABLE
-- Stores all discharge records for reprinting and history
-- ============================================================================

CREATE TABLE IF NOT EXISTS discharges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Links
    admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,

    -- Discharge details
    discharge_date DATE NOT NULL DEFAULT CURRENT_DATE,
    discharge_time TIME DEFAULT CURRENT_TIME,
    discharge_number VARCHAR(20) UNIQUE,

    -- Clinical information
    final_diagnosis TEXT,
    treatment_summary TEXT,
    condition_at_discharge VARCHAR(100), -- 'Improved', 'Stable', 'Referred', 'LAMA', 'Expired'
    medications TEXT,
    follow_up_instructions TEXT,
    follow_up_date DATE,
    discharge_notes TEXT,

    -- Stay information
    admission_date DATE NOT NULL,
    total_days INTEGER NOT NULL DEFAULT 1,
    room_number VARCHAR(20),
    room_type VARCHAR(50),

    -- Billing breakdown (stored for reprinting)
    room_charges DECIMAL(10, 2) DEFAULT 0,
    treatment_charges DECIMAL(10, 2) DEFAULT 0,
    lab_charges DECIMAL(10, 2) DEFAULT 0,
    nicu_charges DECIMAL(10, 2) DEFAULT 0,
    medical_charges DECIMAL(10, 2) DEFAULT 0,
    medicine_charges DECIMAL(10, 2) DEFAULT 0,
    other_charges DECIMAL(10, 2) DEFAULT 0,

    -- Discount
    discount_type VARCHAR(20) DEFAULT 'percentage', -- 'percentage' or 'fixed'
    discount_value DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,

    -- Totals
    subtotal DECIMAL(10, 2) DEFAULT 0,
    total_charges DECIMAL(10, 2) DEFAULT 0,
    amount_paid DECIMAL(10, 2) DEFAULT 0, -- Total paid including deposit and additional
    deposit_amount DECIMAL(10, 2) DEFAULT 0, -- Original deposit
    additional_payment DECIMAL(10, 2) DEFAULT 0, -- Payment made at discharge
    balance_due DECIMAL(10, 2) DEFAULT 0,
    refund_amount DECIMAL(10, 2) DEFAULT 0,

    -- Payment
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'paid', 'pending', 'partial', 'refund'
    payment_method VARCHAR(50), -- 'cash', 'card', 'online', 'mixed'
    payment_notes TEXT,

    -- For babies (if discharging a newborn)
    is_newborn_discharge BOOLEAN DEFAULT FALSE,
    mother_patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,

    -- Print tracking
    print_count INTEGER DEFAULT 0,
    last_printed_at TIMESTAMP WITH TIME ZONE,

    -- Created by
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for discharges
CREATE INDEX IF NOT EXISTS idx_discharges_admission_id ON discharges(admission_id);
CREATE INDEX IF NOT EXISTS idx_discharges_patient_id ON discharges(patient_id);
CREATE INDEX IF NOT EXISTS idx_discharges_discharge_date ON discharges(discharge_date);
CREATE INDEX IF NOT EXISTS idx_discharges_discharge_number ON discharges(discharge_number);
CREATE INDEX IF NOT EXISTS idx_discharges_payment_status ON discharges(payment_status);

-- Enable RLS
ALTER TABLE discharges ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Enable all for authenticated users" ON discharges FOR ALL USING (true) WITH CHECK (true);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_discharges_updated_at ON discharges;
CREATE TRIGGER update_discharges_updated_at
    BEFORE UPDATE ON discharges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 3: ADD DISCHARGE NUMBER COUNTER TO HOSPITAL SETTINGS
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hospital_settings') THEN
        ALTER TABLE hospital_settings ADD COLUMN IF NOT EXISTS discharge_counter INTEGER DEFAULT 0;
        ALTER TABLE hospital_settings ADD COLUMN IF NOT EXISTS discharge_prefix VARCHAR(10) DEFAULT 'DSC-';
    END IF;
END $$;

-- Function to get next discharge number
CREATE OR REPLACE FUNCTION get_next_discharge_number()
RETURNS VARCHAR AS $$
DECLARE
    next_number INTEGER;
    prefix VARCHAR(10);
    result VARCHAR(20);
BEGIN
    -- Get and increment the counter
    UPDATE hospital_settings
    SET discharge_counter = COALESCE(discharge_counter, 0) + 1
    RETURNING discharge_counter, COALESCE(discharge_prefix, 'DSC-')
    INTO next_number, prefix;

    -- If no hospital_settings record, use default
    IF next_number IS NULL THEN
        next_number := 1;
        prefix := 'DSC-';
    END IF;

    result := prefix || LPAD(next_number::TEXT, 6, '0');
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: ADD MORE NICU TREATMENT TYPES
-- ============================================================================

INSERT INTO treatment_types (name, category, description, default_price, process_details, duration, requirements, active)
VALUES
    ('NICU Daily Care', 'NICU Care', 'Daily NICU bed and nursing care', 5000.00,
     'Round-the-clock monitoring, feeding support, temperature control, nursing care',
     'Per day', 'NICU admission'),

    ('Incubator Care (Daily)', 'NICU Care', 'Temperature-controlled incubator care per day', 2000.00,
     'Continuous temperature regulation, humidity control, monitoring',
     'Per day', 'NICU admission'),

    ('Oxygen Therapy (NICU)', 'NICU Care', 'Supplemental oxygen therapy for newborn', 1500.00,
     'Oxygen administration via hood/cannula, SpO2 monitoring',
     'Per day', 'Doctor order'),

    ('IV Fluids (NICU)', 'NICU Care', 'Intravenous fluid therapy for newborn', 1000.00,
     'IV line maintenance, fluid administration, monitoring',
     'Per day', 'Doctor order'),

    ('Feeding Support (NG Tube)', 'NICU Care', 'Nasogastric tube feeding support', 500.00,
     'NG tube insertion/maintenance, formula preparation, feeding',
     'Per day', 'Feeding difficulty assessment'),

    ('NICU Monitoring', 'NICU Care', 'Continuous vital signs monitoring', 1000.00,
     'Heart rate, respiratory rate, SpO2, temperature monitoring',
     'Per day', 'NICU admission'),

    ('Kangaroo Care Session', 'NICU Care', 'Skin-to-skin care session with parent', 0.00,
     'Supervised skin-to-skin contact between parent and baby',
     '1-2 hours', 'Stable baby condition'),

    ('Blood Transfusion (Neonatal)', 'NICU Care', 'Blood transfusion for newborn', 5000.00,
     'Cross-matching, transfusion, monitoring for reactions',
     '2-4 hours', 'Blood bank, consent'),

    ('CPAP Therapy', 'NICU Care', 'Continuous Positive Airway Pressure', 3000.00,
     'CPAP machine setup, pressure titration, monitoring',
     'Per day', 'Respiratory assessment'),

    ('Surfactant Therapy', 'NICU Care', 'Pulmonary surfactant administration', 15000.00,
     'Intratracheal surfactant administration for RDS',
     'Single dose', 'Premature baby with RDS')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STEP 5: UPDATE ADMISSIONS TABLE TO TRACK DISCHARGE
-- ============================================================================

ALTER TABLE admissions ADD COLUMN IF NOT EXISTS discharge_id UUID REFERENCES discharges(id) ON DELETE SET NULL;
ALTER TABLE admissions ADD COLUMN IF NOT EXISTS discharged_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- New columns in patients:
-- - father_name: Father's name for newborns
-- - is_external_admission: Flag for babies not born in hospital
-- - referral_source: Where the patient was referred from
-- - referral_notes: Additional referral information
-- - date_of_birth: Accurate birth date
--
-- New table: discharges
-- - Stores complete discharge records with billing breakdown
-- - Enables reprinting of discharge summaries and receipts
-- - Tracks payment status and amounts
--
-- New function: get_next_discharge_number()
-- - Auto-generates discharge numbers (DSC-000001 format)
--
-- New treatment types for NICU care
-- ============================================================================
