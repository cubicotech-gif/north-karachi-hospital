-- ============================================================================
-- SIMPLE FIX FOR TREATMENT TYPES ERROR
-- ============================================================================
-- Just copy this ENTIRE file and paste it into Supabase SQL Editor
-- Then click RUN
-- ============================================================================

-- Create the treatment_types table
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

-- Create indexes for faster searches
CREATE INDEX IF NOT EXISTS idx_treatment_types_name ON treatment_types(name);
CREATE INDEX IF NOT EXISTS idx_treatment_types_category ON treatment_types(category);
CREATE INDEX IF NOT EXISTS idx_treatment_types_active ON treatment_types(active);

-- Enable Row Level Security
ALTER TABLE treatment_types ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read/write (you can customize this later)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON treatment_types;
CREATE POLICY "Enable all for authenticated users" ON treatment_types
FOR ALL USING (true) WITH CHECK (true);

-- Add some sample treatment types
INSERT INTO treatment_types (name, category, description, default_price, duration, requirements) VALUES
('Normal Delivery', 'Maternity', 'Natural childbirth delivery', 15000.00, '4-12 hours', 'Pre-natal checkup records'),
('C-Section Operation', 'Surgical', 'Cesarean section delivery', 50000.00, '3-5 days', 'Pre-operative tests required'),
('Dressing', 'Medical', 'Wound dressing and care', 500.00, '15-30 minutes', 'None'),
('IV Therapy', 'Medical', 'Intravenous therapy', 1500.00, '1-3 hours', 'None'),
('Ultrasound', 'Diagnostic', 'Ultrasound imaging', 2000.00, '20-30 minutes', 'Appointment required'),
('Doctor Consultation', 'Consultation', 'General consultation', 1000.00, '15-30 minutes', 'None')
ON CONFLICT (name) DO NOTHING;

-- Create trigger function for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to treatment_types
DROP TRIGGER IF EXISTS update_treatment_types_updated_at ON treatment_types;
CREATE TRIGGER update_treatment_types_updated_at
    BEFORE UPDATE ON treatment_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DONE! Now refresh your web app and the error should be gone.
-- ============================================================================

-- Verify it worked by running this:
SELECT COUNT(*) as total_treatments FROM treatment_types;
