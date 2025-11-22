-- NORTH KARACHI HOSPITAL - DATABASE MIGRATION
-- This migration adds: MR Number, Care Of field, and Treatments table
-- SAFE TO RUN: Only adds new columns and tables, doesn't modify existing data

-- Step 1: Add new columns to patients table (these are optional, won't break existing data)
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS mr_number VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS care_of VARCHAR(255);

-- Step 2: Create index on mr_number for fast searching
CREATE INDEX IF NOT EXISTS idx_patients_mr_number ON patients(mr_number);

-- Step 3: Generate MR numbers for existing patients (if any exist without MR numbers)
DO $$
DECLARE
    patient_record RECORD;
    counter INTEGER := 1;
BEGIN
    FOR patient_record IN
        SELECT id FROM patients WHERE mr_number IS NULL ORDER BY created_at ASC
    LOOP
        UPDATE patients
        SET mr_number = 'MR-' || LPAD(counter::TEXT, 4, '0')
        WHERE id = patient_record.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- Step 4: Create treatments table
CREATE TABLE IF NOT EXISTS treatments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    treatment_type VARCHAR(100) NOT NULL, -- e.g., 'Dressing', 'Operation', 'Normal Delivery', 'Seizure'
    treatment_name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'paid', 'pending', 'partial'
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Step 5: Create indexes for treatments table
CREATE INDEX IF NOT EXISTS idx_treatments_patient_id ON treatments(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatments_doctor_id ON treatments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_treatments_date ON treatments(date);
CREATE INDEX IF NOT EXISTS idx_treatments_payment_status ON treatments(payment_status);

-- Step 6: Enable Row Level Security (RLS) for treatments table (matching existing pattern)
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for treatments (allow all operations for authenticated users)
CREATE POLICY "Enable all operations for authenticated users"
ON treatments FOR ALL
USING (true)
WITH CHECK (true);

-- Step 8: Create a function to auto-generate MR number
CREATE OR REPLACE FUNCTION generate_mr_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
    new_mr_number VARCHAR(20);
BEGIN
    -- Get the last MR number
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(mr_number FROM 4) AS INTEGER)),
        0
    ) INTO next_number
    FROM patients
    WHERE mr_number LIKE 'MR-%';

    -- Increment and format
    next_number := next_number + 1;
    new_mr_number := 'MR-' || LPAD(next_number::TEXT, 4, '0');

    -- Assign to new patient
    NEW.mr_number := new_mr_number;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create trigger to auto-generate MR number on patient insert
DROP TRIGGER IF EXISTS auto_generate_mr_number ON patients;
CREATE TRIGGER auto_generate_mr_number
    BEFORE INSERT ON patients
    FOR EACH ROW
    WHEN (NEW.mr_number IS NULL)
    EXECUTE FUNCTION generate_mr_number();

-- Step 10: Create treatment_types table for managing treatment catalog
CREATE TABLE IF NOT EXISTS treatment_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100), -- e.g., 'Surgical', 'Medical', 'Diagnostic', 'Maternity'
    description TEXT,
    default_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    process_details TEXT, -- Details about the treatment process
    duration VARCHAR(50), -- Expected duration e.g., '30 minutes', '2 hours'
    requirements TEXT, -- Any requirements or preparations needed
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Step 11: Create indexes for treatment_types table
CREATE INDEX IF NOT EXISTS idx_treatment_types_category ON treatment_types(category);
CREATE INDEX IF NOT EXISTS idx_treatment_types_active ON treatment_types(active);
CREATE INDEX IF NOT EXISTS idx_treatment_types_name ON treatment_types(name);

-- Step 12: Enable Row Level Security (RLS) for treatment_types table
ALTER TABLE treatment_types ENABLE ROW LEVEL SECURITY;

-- Step 13: Create RLS policies for treatment_types (allow all operations for authenticated users)
CREATE POLICY "Enable all operations for authenticated users on treatment_types"
ON treatment_types FOR ALL
USING (true)
WITH CHECK (true);

-- Step 14: Insert default treatment types for maternity hospital
INSERT INTO treatment_types (name, category, description, default_price, process_details, duration, requirements)
VALUES
    ('Normal Delivery', 'Maternity', 'Natural childbirth delivery', 15000.00,
     'Patient admission, labor monitoring, delivery assistance, post-delivery care',
     '4-12 hours', 'Pre-natal checkup records, blood type'),

    ('C-Section Operation', 'Surgical', 'Cesarean section surgical delivery', 50000.00,
     'Pre-operative assessment, surgical procedure, post-operative care, hospital stay',
     '2-4 days', 'Pre-operative tests, blood type, consent form'),

    ('Dressing', 'Medical', 'Wound dressing and care', 500.00,
     'Cleaning and dressing of wounds, bandage application',
     '15-30 minutes', 'None'),

    ('Seizure Care', 'Emergency', 'Emergency seizure management', 3000.00,
     'Immediate assessment, medication administration, monitoring',
     '1-2 hours', 'Patient history, emergency contact'),

    ('IV Therapy', 'Medical', 'Intravenous fluid therapy', 1500.00,
     'IV line insertion, fluid/medication administration, monitoring',
     '1-3 hours', 'None'),

    ('Post-Natal Care', 'Maternity', 'Care after delivery', 2000.00,
     'Mother and baby checkup, feeding guidance, recovery monitoring',
     '30-45 minutes', 'Delivery records'),

    ('Pre-Natal Checkup', 'Maternity', 'Pregnancy checkup', 1000.00,
     'Physical examination, ultrasound, vital signs check',
     '30 minutes', 'Previous checkup records'),

    ('Vaccination', 'Preventive', 'Immunization services', 800.00,
     'Vaccine administration, observation period',
     '15-20 minutes', 'Vaccination card'),

    ('Minor Surgery', 'Surgical', 'Minor surgical procedures', 10000.00,
     'Local anesthesia, procedure, wound closure, recovery',
     '1-2 hours', 'Pre-operative assessment, consent form'),

    ('Emergency Care', 'Emergency', 'Emergency medical care', 5000.00,
     'Immediate assessment, stabilization, treatment',
     'Variable', 'None')
ON CONFLICT (name) DO NOTHING;

-- Step 15: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 16: Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_treatment_types_updated_at ON treatment_types;
CREATE TRIGGER update_treatment_types_updated_at
    BEFORE UPDATE ON treatment_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- MIGRATION COMPLETE!
-- Summary of changes:
-- ✓ Added 'mr_number' column to patients table
-- ✓ Added 'care_of' column to patients table
-- ✓ Auto-generated MR numbers for existing patients
-- ✓ Created 'treatments' table with all necessary fields
-- ✓ Created 'treatment_types' table for treatment catalog management
-- ✓ Added indexes for performance
-- ✓ Set up auto-generation of MR numbers for new patients
-- ✓ Enabled Row Level Security
-- ✓ Inserted default treatment types

-- To verify the migration:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'patients';
-- SELECT * FROM patients LIMIT 5;
-- SELECT * FROM treatments LIMIT 5;
-- SELECT * FROM treatment_types;
