-- NORTH KARACHI HOSPITAL - VOUCHERS & AUDIT LOG MIGRATION
-- This migration adds: Vouchers table for doctor payments and Audit Log for tracking deletions/cancellations

-- ================================
-- PART 1: VOUCHERS TABLE
-- ================================

-- Create vouchers table for doctor commission payments
CREATE TABLE IF NOT EXISTS vouchers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    voucher_number VARCHAR(20) UNIQUE NOT NULL,
    voucher_type VARCHAR(50) NOT NULL DEFAULT 'doctor_commission', -- 'doctor_commission', 'expense', 'refund', 'other'
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    period_start DATE, -- For commission vouchers: period covered
    period_end DATE,
    patient_count INTEGER DEFAULT 0, -- Number of patients in this period
    total_opd_revenue DECIMAL(10, 2) DEFAULT 0, -- Total OPD revenue for the period
    commission_rate DECIMAL(5, 2), -- Commission rate applied
    commission_type VARCHAR(20), -- 'percentage' or 'fixed'
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'cancelled'
    payment_method VARCHAR(50), -- 'cash', 'bank_transfer', 'cheque', 'other'
    payment_reference VARCHAR(100), -- Cheque number, transaction ID, etc.
    paid_date DATE,
    created_by VARCHAR(100),
    approved_by VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for vouchers table
CREATE INDEX IF NOT EXISTS idx_vouchers_doctor_id ON vouchers(doctor_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status);
CREATE INDEX IF NOT EXISTS idx_vouchers_voucher_type ON vouchers(voucher_type);
CREATE INDEX IF NOT EXISTS idx_vouchers_created_at ON vouchers(created_at);
CREATE INDEX IF NOT EXISTS idx_vouchers_voucher_number ON vouchers(voucher_number);
CREATE INDEX IF NOT EXISTS idx_vouchers_period ON vouchers(period_start, period_end);

-- Enable Row Level Security (RLS) for vouchers table
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vouchers
CREATE POLICY "Enable all operations for authenticated users on vouchers"
ON vouchers FOR ALL
USING (true)
WITH CHECK (true);

-- Function to generate voucher number
CREATE OR REPLACE FUNCTION generate_voucher_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
    new_voucher_number VARCHAR(20);
    prefix VARCHAR(5);
BEGIN
    -- Set prefix based on voucher type
    IF NEW.voucher_type = 'doctor_commission' THEN
        prefix := 'VDC';
    ELSIF NEW.voucher_type = 'expense' THEN
        prefix := 'VEX';
    ELSIF NEW.voucher_type = 'refund' THEN
        prefix := 'VRF';
    ELSE
        prefix := 'VOT';
    END IF;

    -- Get the last voucher number for this type
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(voucher_number FROM 5) AS INTEGER)),
        0
    ) INTO next_number
    FROM vouchers
    WHERE voucher_number LIKE prefix || '-%';

    -- Increment and format
    next_number := next_number + 1;
    new_voucher_number := prefix || '-' || LPAD(next_number::TEXT, 5, '0');

    -- Assign to new voucher
    NEW.voucher_number := new_voucher_number;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate voucher number
DROP TRIGGER IF EXISTS auto_generate_voucher_number ON vouchers;
CREATE TRIGGER auto_generate_voucher_number
    BEFORE INSERT ON vouchers
    FOR EACH ROW
    WHEN (NEW.voucher_number IS NULL OR NEW.voucher_number = '')
    EXECUTE FUNCTION generate_voucher_number();

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_vouchers_updated_at ON vouchers;
CREATE TRIGGER update_vouchers_updated_at
    BEFORE UPDATE ON vouchers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- PART 2: AUDIT LOG TABLE
-- ================================

-- Create audit_log table to track all deletions and cancellations
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action VARCHAR(50) NOT NULL, -- 'delete', 'cancel', 'update', 'create'
    table_name VARCHAR(100) NOT NULL, -- 'opd_tokens', 'admissions', 'lab_orders', etc.
    record_id UUID NOT NULL, -- ID of the affected record
    record_data JSONB, -- Full record data before deletion/change
    reason TEXT, -- Reason for deletion/cancellation
    performed_by VARCHAR(100), -- User who performed the action
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for audit_log table
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id ON audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_by ON audit_log(performed_by);

-- Enable Row Level Security (RLS) for audit_log table
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit_log
CREATE POLICY "Enable all operations for authenticated users on audit_log"
ON audit_log FOR ALL
USING (true)
WITH CHECK (true);

-- ================================
-- PART 3: ADD SOFT DELETE TO OPD TOKENS
-- ================================

-- Add columns for soft delete and cancellation
ALTER TABLE opd_tokens
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Create index for soft deleted records
CREATE INDEX IF NOT EXISTS idx_opd_tokens_is_deleted ON opd_tokens(is_deleted);
CREATE INDEX IF NOT EXISTS idx_opd_tokens_is_cancelled ON opd_tokens(is_cancelled);

-- ================================
-- PART 4: ADD SOFT DELETE TO OTHER TABLES
-- ================================

-- Add to admissions
ALTER TABLE admissions
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_admissions_is_deleted ON admissions(is_deleted);
CREATE INDEX IF NOT EXISTS idx_admissions_is_cancelled ON admissions(is_cancelled);

-- Add to lab_orders
ALTER TABLE lab_orders
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_lab_orders_is_deleted ON lab_orders(is_deleted);
CREATE INDEX IF NOT EXISTS idx_lab_orders_is_cancelled ON lab_orders(is_cancelled);

-- Add to treatments
ALTER TABLE treatments
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_treatments_is_deleted ON treatments(is_deleted);
CREATE INDEX IF NOT EXISTS idx_treatments_is_cancelled ON treatments(is_cancelled);

-- Add to appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_appointments_is_deleted ON appointments(is_deleted);
CREATE INDEX IF NOT EXISTS idx_appointments_is_cancelled ON appointments(is_cancelled);

-- ================================
-- PART 5: HELPER FUNCTIONS
-- ================================

-- Function to calculate doctor commission for a period
CREATE OR REPLACE FUNCTION calculate_doctor_commission(
    p_doctor_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    total_patients INTEGER,
    total_opd_revenue DECIMAL(10, 2),
    commission_type VARCHAR(20),
    commission_rate DECIMAL(5, 2),
    commission_amount DECIMAL(10, 2)
) AS $$
DECLARE
    v_commission_type VARCHAR(20);
    v_commission_rate DECIMAL(5, 2);
BEGIN
    -- Get doctor's commission settings
    SELECT d.commission_type, d.commission_rate
    INTO v_commission_type, v_commission_rate
    FROM doctors d
    WHERE d.id = p_doctor_id;

    RETURN QUERY
    SELECT
        COUNT(t.id)::INTEGER AS total_patients,
        COALESCE(SUM(t.fee), 0)::DECIMAL(10, 2) AS total_opd_revenue,
        v_commission_type AS commission_type,
        COALESCE(v_commission_rate, 0)::DECIMAL(5, 2) AS commission_rate,
        CASE
            WHEN v_commission_type = 'percentage' THEN
                ROUND((COALESCE(SUM(t.fee), 0) * COALESCE(v_commission_rate, 0) / 100), 2)
            WHEN v_commission_type = 'fixed' THEN
                (COUNT(t.id) * COALESCE(v_commission_rate, 0))
            ELSE 0
        END::DECIMAL(10, 2) AS commission_amount
    FROM opd_tokens t
    WHERE t.doctor_id = p_doctor_id
        AND t.date >= p_start_date
        AND t.date <= p_end_date
        AND t.payment_status = 'paid'
        AND (t.is_deleted IS NULL OR t.is_deleted = FALSE)
        AND (t.is_cancelled IS NULL OR t.is_cancelled = FALSE);
END;
$$ LANGUAGE plpgsql;

-- Function to get next voucher number
CREATE OR REPLACE FUNCTION get_next_voucher_number(p_voucher_type VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    next_number INTEGER;
    prefix VARCHAR(5);
    result VARCHAR(20);
BEGIN
    IF p_voucher_type = 'doctor_commission' THEN
        prefix := 'VDC';
    ELSIF p_voucher_type = 'expense' THEN
        prefix := 'VEX';
    ELSIF p_voucher_type = 'refund' THEN
        prefix := 'VRF';
    ELSE
        prefix := 'VOT';
    END IF;

    SELECT COALESCE(
        MAX(CAST(SUBSTRING(voucher_number FROM 5) AS INTEGER)),
        0
    ) + 1 INTO next_number
    FROM vouchers
    WHERE voucher_number LIKE prefix || '-%';

    result := prefix || '-' || LPAD(next_number::TEXT, 5, '0');
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- MIGRATION COMPLETE!
-- ================================
-- Summary of changes:
-- ✓ Created 'vouchers' table for doctor commission payments
-- ✓ Created 'audit_log' table for tracking deletions/cancellations
-- ✓ Added soft delete columns to opd_tokens, admissions, lab_orders, treatments, appointments
-- ✓ Created function to calculate doctor commission
-- ✓ Created indexes for performance
-- ✓ Enabled Row Level Security on new tables
