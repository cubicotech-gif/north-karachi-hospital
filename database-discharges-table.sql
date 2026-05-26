-- ============================================================================
-- Create the discharges table and supporting objects.
-- ============================================================================
-- DischargeModule saves to db.discharges (the 'discharges' table) and looks up
-- the next number via get_next_discharge_number(), but neither existed in this
-- database. Every discharge save was therefore failing, which is why the
-- Billing "Discharge" tab stayed empty. This migration creates exactly what the
-- discharge flow needs. It is idempotent and safe to re-run.
--
-- Run once in the Supabase SQL editor.
-- ============================================================================

-- Shared trigger function for updated_at (safe if it already exists).
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- discharges table (columns match the record written by DischargeModule)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS discharges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    admission_id UUID NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,

    discharge_date DATE NOT NULL DEFAULT CURRENT_DATE,
    discharge_time TIME DEFAULT CURRENT_TIME,
    discharge_number VARCHAR(20) UNIQUE,

    final_diagnosis TEXT,
    treatment_summary TEXT,
    condition_at_discharge VARCHAR(100),
    medications TEXT,
    follow_up_instructions TEXT,
    follow_up_date DATE,
    discharge_notes TEXT,

    admission_date DATE NOT NULL,
    total_days INTEGER NOT NULL DEFAULT 1,
    room_number VARCHAR(20),
    room_type VARCHAR(50),

    room_charges DECIMAL(10, 2) DEFAULT 0,
    treatment_charges DECIMAL(10, 2) DEFAULT 0,
    lab_charges DECIMAL(10, 2) DEFAULT 0,
    nicu_charges DECIMAL(10, 2) DEFAULT 0,
    medical_charges DECIMAL(10, 2) DEFAULT 0,
    medicine_charges DECIMAL(10, 2) DEFAULT 0,
    other_charges DECIMAL(10, 2) DEFAULT 0,

    discount_type VARCHAR(20) DEFAULT 'percentage',
    discount_value DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,

    subtotal DECIMAL(10, 2) DEFAULT 0,
    total_charges DECIMAL(10, 2) DEFAULT 0,
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    deposit_amount DECIMAL(10, 2) DEFAULT 0,
    additional_payment DECIMAL(10, 2) DEFAULT 0,
    balance_due DECIMAL(10, 2) DEFAULT 0,
    refund_amount DECIMAL(10, 2) DEFAULT 0,

    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_notes TEXT,

    is_newborn_discharge BOOLEAN DEFAULT FALSE,
    mother_patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,

    print_count INTEGER DEFAULT 0,
    last_printed_at TIMESTAMP WITH TIME ZONE,

    created_by UUID REFERENCES users(id) ON DELETE SET NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_discharges_admission_id ON discharges(admission_id);
CREATE INDEX IF NOT EXISTS idx_discharges_patient_id ON discharges(patient_id);
CREATE INDEX IF NOT EXISTS idx_discharges_discharge_date ON discharges(discharge_date);
CREATE INDEX IF NOT EXISTS idx_discharges_discharge_number ON discharges(discharge_number);
CREATE INDEX IF NOT EXISTS idx_discharges_payment_status ON discharges(payment_status);

ALTER TABLE discharges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON discharges;
CREATE POLICY "Enable all for authenticated users" ON discharges FOR ALL USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS update_discharges_updated_at ON discharges;
CREATE TRIGGER update_discharges_updated_at
    BEFORE UPDATE ON discharges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Discharge number counter + generator
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hospital_settings') THEN
        ALTER TABLE hospital_settings ADD COLUMN IF NOT EXISTS discharge_counter INTEGER DEFAULT 0;
        ALTER TABLE hospital_settings ADD COLUMN IF NOT EXISTS discharge_prefix VARCHAR(10) DEFAULT 'DSC-';
    END IF;
END $$;

CREATE OR REPLACE FUNCTION get_next_discharge_number()
RETURNS VARCHAR AS $$
DECLARE
    next_number INTEGER;
    prefix VARCHAR(10);
    result VARCHAR(20);
BEGIN
    UPDATE hospital_settings
    SET discharge_counter = COALESCE(discharge_counter, 0) + 1
    RETURNING discharge_counter, COALESCE(discharge_prefix, 'DSC-')
    INTO next_number, prefix;

    IF next_number IS NULL THEN
        next_number := 1;
        prefix := 'DSC-';
    END IF;

    result := prefix || LPAD(next_number::TEXT, 6, '0');
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Link discharge back to its admission
-- ----------------------------------------------------------------------------
ALTER TABLE admissions ADD COLUMN IF NOT EXISTS discharge_id UUID REFERENCES discharges(id) ON DELETE SET NULL;
ALTER TABLE admissions ADD COLUMN IF NOT EXISTS discharged_at TIMESTAMP WITH TIME ZONE;
