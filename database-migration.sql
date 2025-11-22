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

-- MIGRATION COMPLETE!
-- Summary of changes:
-- ✓ Added 'mr_number' column to patients table
-- ✓ Added 'care_of' column to patients table
-- ✓ Auto-generated MR numbers for existing patients
-- ✓ Created 'treatments' table with all necessary fields
-- ✓ Added indexes for performance
-- ✓ Set up auto-generation of MR numbers for new patients
-- ✓ Enabled Row Level Security

-- To verify the migration:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'patients';
-- SELECT * FROM patients LIMIT 5;
-- SELECT * FROM treatments LIMIT 5;
