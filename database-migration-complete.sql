-- =====================================================
-- NORTH KARACHI HOSPITAL - COMPLETE DATABASE MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. VOUCHERS TABLE (for doctor commission payments)
-- =====================================================
CREATE TABLE IF NOT EXISTS vouchers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    voucher_number VARCHAR(50) UNIQUE NOT NULL,
    voucher_type VARCHAR(50) NOT NULL DEFAULT 'doctor_commission',
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    description TEXT,
    period_start DATE,
    period_end DATE,
    patient_count INTEGER DEFAULT 0,
    total_opd_revenue DECIMAL(10, 2) DEFAULT 0,
    commission_rate DECIMAL(5, 2),
    commission_type VARCHAR(20), -- 'percentage' or 'fixed'
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, paid, cancelled
    paid_date DATE,
    payment_method VARCHAR(50),
    paid_by VARCHAR(100),
    notes TEXT,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on vouchers
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations on vouchers" ON vouchers;
CREATE POLICY "Allow all operations on vouchers" ON vouchers FOR ALL USING (true) WITH CHECK (true);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_vouchers_doctor_id ON vouchers(doctor_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status);
CREATE INDEX IF NOT EXISTS idx_vouchers_created_at ON vouchers(created_at);

-- =====================================================
-- 2. ADD CANCELLATION COLUMNS TO EXISTING TABLES
-- =====================================================

-- OPD TOKENS - Add cancellation fields
ALTER TABLE opd_tokens
ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(100);

-- LAB ORDERS - Add cancellation fields
ALTER TABLE lab_orders
ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(100);

-- TREATMENTS - Add cancellation fields
ALTER TABLE treatments
ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(100);

-- ADMISSIONS - Add cancellation fields
ALTER TABLE admissions
ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(100);

-- =====================================================
-- 3. ADD COMMISSION FIELDS TO DOCTORS TABLE
-- =====================================================

ALTER TABLE doctors
ADD COLUMN IF NOT EXISTS commission_type VARCHAR(20) DEFAULT 'percentage',
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(10, 2) DEFAULT 0;

-- =====================================================
-- 4. ADD EXTERNAL NEWBORN FIELDS TO PATIENTS TABLE
-- =====================================================

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS patient_type VARCHAR(50) DEFAULT 'regular',
ADD COLUMN IF NOT EXISTS is_external_admission BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS referral_source TEXT,
ADD COLUMN IF NOT EXISTS referral_notes TEXT;

-- =====================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- OPD Tokens indexes
CREATE INDEX IF NOT EXISTS idx_opd_tokens_patient_id ON opd_tokens(patient_id);
CREATE INDEX IF NOT EXISTS idx_opd_tokens_doctor_id ON opd_tokens(doctor_id);
CREATE INDEX IF NOT EXISTS idx_opd_tokens_date ON opd_tokens(date);
CREATE INDEX IF NOT EXISTS idx_opd_tokens_status ON opd_tokens(status);

-- Lab Orders indexes
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient_id ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status);

-- Treatments indexes
CREATE INDEX IF NOT EXISTS idx_treatments_patient_id ON treatments(patient_id);

-- Admissions indexes
CREATE INDEX IF NOT EXISTS idx_admissions_patient_id ON admissions(patient_id);

-- Patients indexes
CREATE INDEX IF NOT EXISTS idx_patients_mr_number ON patients(mr_number);
CREATE INDEX IF NOT EXISTS idx_patients_contact ON patients(contact);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);

-- =====================================================
-- 6. ENSURE RLS POLICIES ARE SET UP
-- =====================================================

-- Enable RLS on all tables (if not already)
ALTER TABLE opd_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (adjust as needed for production)
DROP POLICY IF EXISTS "Allow all opd_tokens" ON opd_tokens;
CREATE POLICY "Allow all opd_tokens" ON opd_tokens FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all lab_orders" ON lab_orders;
CREATE POLICY "Allow all lab_orders" ON lab_orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all treatments" ON treatments;
CREATE POLICY "Allow all treatments" ON treatments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all admissions" ON admissions;
CREATE POLICY "Allow all admissions" ON admissions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all patients" ON patients;
CREATE POLICY "Allow all patients" ON patients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all doctors" ON doctors;
CREATE POLICY "Allow all doctors" ON doctors FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 7. CREATE UPDATED_AT TRIGGER FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to vouchers table
DROP TRIGGER IF EXISTS update_vouchers_updated_at ON vouchers;
CREATE TRIGGER update_vouchers_updated_at
    BEFORE UPDATE ON vouchers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. HELPFUL VIEWS FOR REPORTING
-- =====================================================

-- View for patient accounts summary
CREATE OR REPLACE VIEW patient_accounts_summary AS
SELECT
    p.id as patient_id,
    p.mr_number,
    p.name as patient_name,
    COALESCE(SUM(CASE WHEN ot.is_cancelled = false THEN ot.fee ELSE 0 END), 0) as total_opd_fees,
    COALESCE(SUM(CASE WHEN lo.is_cancelled = false THEN lo.total_amount ELSE 0 END), 0) as total_lab_fees,
    COALESCE(SUM(CASE WHEN t.is_cancelled = false THEN t.price ELSE 0 END), 0) as total_treatment_fees,
    COUNT(DISTINCT CASE WHEN ot.is_cancelled = false THEN ot.id END) as opd_visits,
    COUNT(DISTINCT CASE WHEN lo.is_cancelled = false THEN lo.id END) as lab_orders,
    COUNT(DISTINCT CASE WHEN t.is_cancelled = false THEN t.id END) as treatments_count
FROM patients p
LEFT JOIN opd_tokens ot ON p.id = ot.patient_id
LEFT JOIN lab_orders lo ON p.id = lo.patient_id
LEFT JOIN treatments t ON p.id = t.patient_id
GROUP BY p.id, p.mr_number, p.name;

-- View for doctor commission summary
CREATE OR REPLACE VIEW doctor_commission_summary AS
SELECT
    d.id as doctor_id,
    d.name as doctor_name,
    d.department,
    d.commission_type,
    d.commission_rate,
    COUNT(DISTINCT ot.id) as total_patients,
    COALESCE(SUM(ot.fee), 0) as total_revenue,
    CASE
        WHEN d.commission_type = 'percentage' THEN COALESCE(SUM(ot.fee), 0) * d.commission_rate / 100
        ELSE COUNT(DISTINCT ot.id) * d.commission_rate
    END as commission_amount
FROM doctors d
LEFT JOIN opd_tokens ot ON d.id = ot.doctor_id
    AND ot.is_cancelled = false
    AND ot.status != 'cancelled'
GROUP BY d.id, d.name, d.department, d.commission_type, d.commission_rate;

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================
-- After running this migration:
-- 1. Refresh your application
-- 2. Doctor commissions can now be set from Doctor Management
-- 3. Vouchers can be created from Reports module
-- 4. Cancellation will work across all modules
-- =====================================================
