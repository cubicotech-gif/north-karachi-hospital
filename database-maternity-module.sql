-- ============================================================================
-- NORTH KARACHI HOSPITAL - MATERNITY MODULE MIGRATION
-- ============================================================================
-- This migration adds:
-- 1. delivery_records table for tracking births
-- 2. Updates to patients table (mother_patient_id, patient_type)
-- 3. Updates to rooms table (price_per_hour for NICU)
-- 4. Auto-generate NB-XXXX MR numbers for newborns
-- 5. Birth certificate numbering
-- ============================================================================

-- ============================================================================
-- STEP 1: ALTER PATIENTS TABLE
-- Add fields for linking babies to mothers and identifying patient type
-- ============================================================================

-- Add mother_patient_id to link baby records to mother
ALTER TABLE patients ADD COLUMN IF NOT EXISTS mother_patient_id UUID REFERENCES patients(id) ON DELETE SET NULL;

-- Add patient_type to distinguish adults from newborns
ALTER TABLE patients ADD COLUMN IF NOT EXISTS patient_type VARCHAR(20) DEFAULT 'adult';
-- Values: 'adult', 'newborn'

-- Create index for mother lookups
CREATE INDEX IF NOT EXISTS idx_patients_mother_patient_id ON patients(mother_patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_patient_type ON patients(patient_type);

-- ============================================================================
-- STEP 2: ALTER ROOMS TABLE
-- Add price_per_hour for NICU hourly billing
-- ============================================================================

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS price_per_hour DECIMAL(10, 2) DEFAULT 0;

-- ============================================================================
-- STEP 3: CREATE DELIVERY_RECORDS TABLE
-- Stores birth details linked to mother's admission
-- ============================================================================

CREATE TABLE IF NOT EXISTS delivery_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Links to mother
    admission_id UUID REFERENCES admissions(id) ON DELETE CASCADE,
    mother_patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- Delivery details
    delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
    delivery_time TIME NOT NULL,
    delivery_type VARCHAR(50) NOT NULL, -- 'Normal', 'C-Section', 'Assisted', 'Vacuum', 'Forceps'

    -- Baby details
    baby_gender VARCHAR(20) NOT NULL, -- 'Male', 'Female'
    baby_weight_kg DECIMAL(4, 2), -- e.g., 3.25 kg
    baby_weight_grams INTEGER, -- Alternative: weight in grams (e.g., 3250)
    apgar_score_1min INTEGER, -- APGAR score at 1 minute (0-10)
    apgar_score_5min INTEGER, -- APGAR score at 5 minutes (0-10)
    baby_condition VARCHAR(100), -- 'Healthy', 'Requires NICU', 'Critical', etc.
    baby_cry VARCHAR(50), -- 'Immediate', 'Delayed', 'Weak', etc.

    -- Link to baby's patient record (created for every birth)
    baby_patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,

    -- Birth certificate
    birth_certificate_number VARCHAR(20) UNIQUE,
    birth_certificate_printed BOOLEAN DEFAULT FALSE,
    birth_certificate_printed_at TIMESTAMP WITH TIME ZONE,

    -- Delivery information
    delivering_doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    complications TEXT,
    notes TEXT,

    -- For multiple births (twins, triplets)
    multiple_birth BOOLEAN DEFAULT FALSE,
    birth_order INTEGER DEFAULT 1, -- 1 for single birth, 1/2/3 for twins/triplets
    total_babies INTEGER DEFAULT 1,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for delivery_records
CREATE INDEX IF NOT EXISTS idx_delivery_records_admission_id ON delivery_records(admission_id);
CREATE INDEX IF NOT EXISTS idx_delivery_records_mother_patient_id ON delivery_records(mother_patient_id);
CREATE INDEX IF NOT EXISTS idx_delivery_records_baby_patient_id ON delivery_records(baby_patient_id);
CREATE INDEX IF NOT EXISTS idx_delivery_records_delivery_date ON delivery_records(delivery_date);
CREATE INDEX IF NOT EXISTS idx_delivery_records_birth_certificate ON delivery_records(birth_certificate_number);

-- Enable RLS
ALTER TABLE delivery_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Enable all for authenticated users" ON delivery_records FOR ALL USING (true) WITH CHECK (true);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_delivery_records_updated_at ON delivery_records;
CREATE TRIGGER update_delivery_records_updated_at
    BEFORE UPDATE ON delivery_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 4: CREATE NICU_OBSERVATIONS TABLE
-- Tracks hourly NICU observations and charges
-- ============================================================================

CREATE TABLE IF NOT EXISTS nicu_observations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Links
    baby_patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    admission_id UUID REFERENCES admissions(id) ON DELETE CASCADE,
    delivery_record_id UUID REFERENCES delivery_records(id) ON DELETE SET NULL,

    -- Observation details
    observation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,

    -- Vitals and observations
    temperature DECIMAL(4, 1), -- in Celsius
    heart_rate INTEGER, -- beats per minute
    respiratory_rate INTEGER, -- breaths per minute
    oxygen_saturation INTEGER, -- percentage
    weight_grams INTEGER,
    feeding_type VARCHAR(50), -- 'Breast', 'Formula', 'IV', 'NG Tube'
    feeding_amount_ml INTEGER,

    -- Care provided
    care_provided TEXT,
    medications TEXT,
    procedures TEXT,

    -- Status
    condition VARCHAR(100), -- 'Stable', 'Improving', 'Critical', 'Discharged'

    -- Billing
    hours_charged DECIMAL(4, 1) DEFAULT 0,
    hourly_rate DECIMAL(10, 2) DEFAULT 0,
    total_charge DECIMAL(10, 2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'pending',

    -- Staff
    nurse_id UUID REFERENCES users(id) ON DELETE SET NULL,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,

    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nicu_observations_baby_patient_id ON nicu_observations(baby_patient_id);
CREATE INDEX IF NOT EXISTS idx_nicu_observations_admission_id ON nicu_observations(admission_id);
CREATE INDEX IF NOT EXISTS idx_nicu_observations_observation_date ON nicu_observations(observation_date);

-- Enable RLS
ALTER TABLE nicu_observations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Enable all for authenticated users" ON nicu_observations FOR ALL USING (true) WITH CHECK (true);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_nicu_observations_updated_at ON nicu_observations;
CREATE TRIGGER update_nicu_observations_updated_at
    BEFORE UPDATE ON nicu_observations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 5: AUTO-GENERATE MR NUMBER FOR NEWBORNS (NB-0001 format)
-- ============================================================================

-- Update the existing generate_mr_number function to handle newborns
CREATE OR REPLACE FUNCTION generate_mr_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
    new_mr_number VARCHAR(20);
    prefix VARCHAR(10);
BEGIN
    -- Determine prefix based on patient type
    IF NEW.patient_type = 'newborn' THEN
        prefix := 'NB-';
        -- Get the last NB number
        SELECT COALESCE(
            MAX(CAST(SUBSTRING(mr_number FROM 4) AS INTEGER)),
            0
        ) INTO next_number
        FROM patients
        WHERE mr_number LIKE 'NB-%';
    ELSE
        prefix := 'MR-';
        -- Get the last MR number
        SELECT COALESCE(
            MAX(CAST(SUBSTRING(mr_number FROM 4) AS INTEGER)),
            0
        ) INTO next_number
        FROM patients
        WHERE mr_number LIKE 'MR-%';
    END IF;

    -- Increment and format
    next_number := next_number + 1;
    new_mr_number := prefix || LPAD(next_number::TEXT, 4, '0');

    -- Assign to new patient
    NEW.mr_number := new_mr_number;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 6: ADD BIRTH CERTIFICATE COUNTER TO HOSPITAL SETTINGS
-- ============================================================================

-- Add birth certificate counter to hospital_settings if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hospital_settings') THEN
        ALTER TABLE hospital_settings ADD COLUMN IF NOT EXISTS birth_certificate_counter INTEGER DEFAULT 0;
        ALTER TABLE hospital_settings ADD COLUMN IF NOT EXISTS birth_certificate_prefix VARCHAR(10) DEFAULT 'BC-';
    END IF;
END $$;

-- Function to get next birth certificate number
CREATE OR REPLACE FUNCTION get_next_birth_certificate_number()
RETURNS VARCHAR AS $$
DECLARE
    next_number INTEGER;
    prefix VARCHAR(10);
    result VARCHAR(20);
BEGIN
    -- Get and increment the counter
    UPDATE hospital_settings
    SET birth_certificate_counter = COALESCE(birth_certificate_counter, 0) + 1
    RETURNING birth_certificate_counter, COALESCE(birth_certificate_prefix, 'BC-')
    INTO next_number, prefix;

    -- If no hospital_settings record, use default
    IF next_number IS NULL THEN
        next_number := 1;
        prefix := 'BC-';
    END IF;

    result := LPAD(next_number::TEXT, 4, '0');
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 7: INSERT NICU ROOM TYPE
-- ============================================================================

INSERT INTO rooms (room_number, type, floor, capacity, current_occupancy, price_per_day, price_per_hour, amenities, status, active)
VALUES
    ('NICU-1', 'NICU', 1, 4, 0, 5000.00, 500.00, 'Incubator, Monitoring Equipment, Oxygen Supply, IV Stand', 'available', true),
    ('NICU-2', 'NICU', 1, 4, 0, 5000.00, 500.00, 'Incubator, Monitoring Equipment, Oxygen Supply, IV Stand', 'available', true)
ON CONFLICT (room_number) DO UPDATE SET
    price_per_hour = EXCLUDED.price_per_hour,
    type = EXCLUDED.type;

-- ============================================================================
-- STEP 8: ADD NICU-RELATED TREATMENT TYPES
-- ============================================================================

INSERT INTO treatment_types (name, category, description, default_price, process_details, duration, requirements, active)
VALUES
    ('NICU Admission', 'Pediatric', 'Neonatal Intensive Care Unit admission', 5000.00,
     'Initial assessment, incubator setup, vital signs monitoring, IV access if needed',
     'Variable', 'Delivery record, pediatrician order'),

    ('NICU Hourly Care', 'Pediatric', 'Hourly NICU observation and care', 500.00,
     'Continuous monitoring, feeding support, temperature regulation, medication administration',
     '1 hour', 'Active NICU admission'),

    ('Phototherapy (Jaundice)', 'Pediatric', 'Light therapy for neonatal jaundice', 3000.00,
     'Bilirubin check, phototherapy unit setup, continuous monitoring, feeding support',
     '12-48 hours', 'Bilirubin test results'),

    ('Incubator Care', 'Pediatric', 'Temperature-controlled incubator care', 2000.00,
     'Temperature regulation, humidity control, continuous monitoring',
     'Per day', 'NICU admission'),

    ('Newborn Resuscitation', 'Emergency', 'Emergency newborn resuscitation', 8000.00,
     'Airway management, breathing support, circulation support, medication if needed',
     'Variable', 'Emergency situation')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- New tables created:
-- 1. delivery_records - Birth records with baby details
-- 2. nicu_observations - NICU hourly tracking
--
-- Modified tables:
-- 1. patients - Added mother_patient_id, patient_type
-- 2. rooms - Added price_per_hour
-- 3. hospital_settings - Added birth_certificate_counter
--
-- New functions:
-- 1. get_next_birth_certificate_number() - Auto-generate BC numbers
--
-- Updated functions:
-- 1. generate_mr_number() - Now handles NB-XXXX for newborns
--
-- New data:
-- 1. NICU rooms (NICU-1, NICU-2)
-- 2. NICU treatment types
-- ============================================================================
