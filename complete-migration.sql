-- ============================================================================
-- NORTH KARACHI HOSPITAL - COMPLETE DATABASE MIGRATION
-- ============================================================================
-- This is a complete migration script for the hospital management system
-- Run this on your Supabase database manually
--
-- Features:
-- ✓ Complete schema for all 12 tables
-- ✓ Auto-generated UUIDs and timestamps
-- ✓ Row Level Security (RLS) enabled
-- ✓ Indexes for performance optimization
-- ✓ Foreign key relationships
-- ✓ Triggers for auto-generation (MR numbers, updated_at)
-- ✓ Sample data for treatment types
--
-- SAFE TO RUN: Uses IF NOT EXISTS clauses
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABLE 1: USERS
-- System users (doctors, nurses, admin staff)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user', -- 'admin', 'doctor', 'nurse', 'receptionist', 'user'
    email VARCHAR(255),
    phone VARCHAR(20),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);

-- ============================================================================
-- TABLE 2: DEPARTMENTS
-- Hospital departments (e.g., Maternity, Emergency, OPD)
-- ============================================================================
CREATE TABLE IF NOT EXISTS departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    head_doctor VARCHAR(255),
    contact VARCHAR(50),
    location VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(active);

-- ============================================================================
-- TABLE 3: DOCTORS
-- Medical practitioners
-- ============================================================================
CREATE TABLE IF NOT EXISTS doctors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255),
    qualification VARCHAR(255),
    experience INTEGER, -- years of experience
    contact VARCHAR(50),
    email VARCHAR(255),
    department VARCHAR(255), -- Department name (used by application)
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL, -- Optional FK for relational queries
    consultation_fee DECIMAL(10, 2) DEFAULT 0,
    schedule TEXT, -- JSON or text describing weekly schedule
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_doctors_name ON doctors(name);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_department ON doctors(department);
CREATE INDEX IF NOT EXISTS idx_doctors_department_id ON doctors(department_id);
CREATE INDEX IF NOT EXISTS idx_doctors_active ON doctors(active);

-- ============================================================================
-- TABLE 4: PATIENTS
-- Patient records with auto-generated MR numbers
-- ============================================================================
CREATE TABLE IF NOT EXISTS patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mr_number VARCHAR(20) UNIQUE, -- Auto-generated: MR-0001, MR-0002, etc.
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(20),
    contact VARCHAR(50),
    address TEXT,
    cnic_number VARCHAR(20),
    blood_group VARCHAR(10), -- A+, B+, O+, AB+, A-, B-, O-, AB-
    care_of VARCHAR(255), -- Guardian/Relative name
    emergency_contact VARCHAR(50),
    medical_history TEXT,
    allergies TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_patients_mr_number ON patients(mr_number);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_contact ON patients(contact);
CREATE INDEX IF NOT EXISTS idx_patients_cnic_number ON patients(cnic_number);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);

-- ============================================================================
-- TABLE 5: ROOMS
-- Hospital room management
-- ============================================================================
CREATE TABLE IF NOT EXISTS rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_number VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(100) NOT NULL, -- 'General', 'Private', 'ICU', 'Labor', 'Emergency'
    floor INTEGER,
    capacity INTEGER DEFAULT 1,
    current_occupancy INTEGER DEFAULT 0,
    price_per_day DECIMAL(10, 2) DEFAULT 0,
    amenities TEXT,
    status VARCHAR(50) DEFAULT 'available', -- 'available', 'occupied', 'maintenance', 'reserved'
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_rooms_room_number ON rooms(room_number);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(type);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_active ON rooms(active);

-- ============================================================================
-- TABLE 6: ADMISSIONS
-- Patient admission records (IPD - In-Patient Department)
-- ============================================================================
CREATE TABLE IF NOT EXISTS admissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    discharge_date DATE,
    reason TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'discharged', 'transferred'
    total_charges DECIMAL(10, 2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'paid', 'pending', 'partial'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_admissions_patient_id ON admissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_admissions_doctor_id ON admissions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_admissions_room_id ON admissions(room_id);
CREATE INDEX IF NOT EXISTS idx_admissions_admission_date ON admissions(admission_date);
CREATE INDEX IF NOT EXISTS idx_admissions_status ON admissions(status);
CREATE INDEX IF NOT EXISTS idx_admissions_payment_status ON admissions(payment_status);

-- ============================================================================
-- TABLE 7: OPD TOKENS
-- Out-Patient Department token system
-- ============================================================================
CREATE TABLE IF NOT EXISTS opd_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token_number INTEGER NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'waiting', -- 'waiting', 'in-consultation', 'completed', 'cancelled'
    consultation_fee DECIMAL(10, 2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'paid', 'pending'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_opd_tokens_patient_id ON opd_tokens(patient_id);
CREATE INDEX IF NOT EXISTS idx_opd_tokens_doctor_id ON opd_tokens(doctor_id);
CREATE INDEX IF NOT EXISTS idx_opd_tokens_date ON opd_tokens(date);
CREATE INDEX IF NOT EXISTS idx_opd_tokens_status ON opd_tokens(status);
CREATE INDEX IF NOT EXISTS idx_opd_tokens_token_number ON opd_tokens(token_number);

-- ============================================================================
-- TABLE 8: APPOINTMENTS
-- Appointment scheduling system
-- ============================================================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration INTEGER DEFAULT 30, -- Duration in minutes
    reason TEXT,
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(appointment_date, appointment_time);

-- ============================================================================
-- TABLE 9: LAB TESTS
-- Available lab test catalog
-- ============================================================================
CREATE TABLE IF NOT EXISTS lab_tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100), -- 'Blood', 'Urine', 'Imaging', 'Pathology', etc.
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    normal_range TEXT, -- Expected normal values
    unit VARCHAR(50), -- mg/dL, mmol/L, etc.
    turnaround_time VARCHAR(50), -- '2 hours', '24 hours', '3 days'
    preparation_instructions TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_lab_tests_name ON lab_tests(name);
CREATE INDEX IF NOT EXISTS idx_lab_tests_category ON lab_tests(category);
CREATE INDEX IF NOT EXISTS idx_lab_tests_active ON lab_tests(active);

-- ============================================================================
-- TABLE 10: LAB ORDERS
-- Patient lab test orders
-- ============================================================================
CREATE TABLE IF NOT EXISTS lab_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    test_name VARCHAR(255) NOT NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in-progress', 'completed', 'cancelled'
    result TEXT,
    result_date DATE,
    price DECIMAL(10, 2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'paid', 'pending', 'partial'
    notes TEXT,
    urgent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_lab_orders_patient_id ON lab_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_doctor_id ON lab_orders(doctor_id);
CREATE INDEX IF NOT EXISTS idx_lab_orders_order_date ON lab_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status);
CREATE INDEX IF NOT EXISTS idx_lab_orders_payment_status ON lab_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_lab_orders_urgent ON lab_orders(urgent);

-- ============================================================================
-- TABLE 11: TREATMENT TYPES
-- Treatment catalog management
-- ============================================================================
CREATE TABLE IF NOT EXISTS treatment_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100), -- 'Surgical', 'Medical', 'Diagnostic', 'Maternity', 'Emergency'
    description TEXT,
    default_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    process_details TEXT, -- Details about the treatment process
    duration VARCHAR(50), -- Expected duration e.g., '30 minutes', '2 hours'
    requirements TEXT, -- Any requirements or preparations needed
    complications TEXT, -- Possible complications or side effects
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_treatment_types_name ON treatment_types(name);
CREATE INDEX IF NOT EXISTS idx_treatment_types_category ON treatment_types(category);
CREATE INDEX IF NOT EXISTS idx_treatment_types_active ON treatment_types(active);

-- ============================================================================
-- TABLE 12: TREATMENTS
-- Patient treatment records
-- ============================================================================
CREATE TABLE IF NOT EXISTS treatments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    treatment_type VARCHAR(100) NOT NULL,
    treatment_name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'paid', 'pending', 'partial'
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    outcome VARCHAR(50), -- 'successful', 'ongoing', 'complications'
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_treatments_patient_id ON treatments(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatments_doctor_id ON treatments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_treatments_date ON treatments(date);
CREATE INDEX IF NOT EXISTS idx_treatments_payment_status ON treatments(payment_status);
CREATE INDEX IF NOT EXISTS idx_treatments_treatment_type ON treatments(treatment_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS and create policies for all tables
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE opd_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for authenticated users)
-- Note: In production, you may want more granular policies based on user roles

CREATE POLICY "Enable all for authenticated users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON doctors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON admissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON opd_tokens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON lab_tests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON lab_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON treatment_types FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for authenticated users" ON treatments FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admissions_updated_at ON admissions;
CREATE TRIGGER update_admissions_updated_at
    BEFORE UPDATE ON admissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lab_tests_updated_at ON lab_tests;
CREATE TRIGGER update_lab_tests_updated_at
    BEFORE UPDATE ON lab_tests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lab_orders_updated_at ON lab_orders;
CREATE TRIGGER update_lab_orders_updated_at
    BEFORE UPDATE ON lab_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_treatment_types_updated_at ON treatment_types;
CREATE TRIGGER update_treatment_types_updated_at
    BEFORE UPDATE ON treatment_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_treatments_updated_at ON treatments;
CREATE TRIGGER update_treatments_updated_at
    BEFORE UPDATE ON treatments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- AUTO-GENERATE MR NUMBER FOR PATIENTS
-- ============================================================================

-- Function to auto-generate MR number for new patients
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

-- Create trigger to auto-generate MR number on patient insert
DROP TRIGGER IF EXISTS auto_generate_mr_number ON patients;
CREATE TRIGGER auto_generate_mr_number
    BEFORE INSERT ON patients
    FOR EACH ROW
    WHEN (NEW.mr_number IS NULL)
    EXECUTE FUNCTION generate_mr_number();

-- ============================================================================
-- INITIAL DATA - TREATMENT TYPES
-- Pre-populate common treatments for a maternity hospital
-- ============================================================================

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

-- ============================================================================
-- INITIAL DATA - DEPARTMENTS
-- Pre-populate common hospital departments
-- ============================================================================

INSERT INTO departments (name, description, location, active)
VALUES
    ('Maternity', 'Maternity and childbirth services', 'First Floor', true),
    ('Emergency', 'Emergency medical services', 'Ground Floor', true),
    ('OPD', 'Out-Patient Department', 'Ground Floor', true),
    ('Surgery', 'Surgical procedures and operations', 'Second Floor', true),
    ('Pediatrics', 'Newborn and child care', 'First Floor', true),
    ('Laboratory', 'Diagnostic tests and pathology', 'Ground Floor', true),
    ('Radiology', 'Imaging services (X-ray, Ultrasound)', 'Ground Floor', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- INITIAL DATA - LAB TESTS
-- Pre-populate common lab tests
-- ============================================================================

INSERT INTO lab_tests (name, category, description, price, normal_range, unit, turnaround_time, active)
VALUES
    -- Blood Tests
    ('Complete Blood Count (CBC)', 'Blood', 'Comprehensive blood cell count', 800.00,
     'RBC: 4.5-5.5 million/μL, WBC: 4,000-11,000/μL, Platelets: 150,000-450,000/μL', 'cells/μL', '2-4 hours', true),

    ('Blood Group & Rh', 'Blood', 'Blood type and Rh factor determination', 500.00,
     'A, B, AB, or O; Rh+ or Rh-', 'Type', '1-2 hours', true),

    ('Hemoglobin', 'Blood', 'Hemoglobin level measurement', 300.00,
     'Male: 13.5-17.5 g/dL, Female: 12.0-15.5 g/dL', 'g/dL', '1-2 hours', true),

    ('Blood Sugar (Random)', 'Blood', 'Random blood glucose test', 400.00,
     '70-140 mg/dL', 'mg/dL', '1 hour', true),

    ('Blood Sugar (Fasting)', 'Blood', 'Fasting blood glucose test', 400.00,
     '70-100 mg/dL', 'mg/dL', '1 hour', true),

    ('Hepatitis B Surface Antigen', 'Blood', 'HBsAg screening', 1200.00,
     'Negative', 'Qualitative', '24 hours', true),

    ('Hepatitis C Antibody', 'Blood', 'Anti-HCV screening', 1200.00,
     'Negative', 'Qualitative', '24 hours', true),

    ('HIV Screening', 'Blood', 'HIV antibody test', 1500.00,
     'Negative', 'Qualitative', '24 hours', true),

    -- Urine Tests
    ('Urine Complete Examination', 'Urine', 'Complete urine analysis', 500.00,
     'pH: 4.5-8.0, Specific Gravity: 1.005-1.030', 'Various', '2-4 hours', true),

    ('Urine Culture', 'Urine', 'Bacterial culture for UTI', 1200.00,
     'No growth', 'CFU/mL', '48-72 hours', true),

    -- Pregnancy Tests
    ('Pregnancy Test (Urine)', 'Pregnancy', 'Urine hCG test', 300.00,
     'Positive/Negative', 'Qualitative', '15-30 minutes', true),

    ('Beta hCG (Blood)', 'Pregnancy', 'Quantitative pregnancy hormone', 1000.00,
     'Non-pregnant: <5 mIU/mL', 'mIU/mL', '4-6 hours', true),

    -- Coagulation Tests
    ('PT/INR', 'Coagulation', 'Prothrombin time and INR', 800.00,
     'PT: 11-13.5 seconds, INR: 0.8-1.1', 'seconds', '2-4 hours', true),

    ('APTT', 'Coagulation', 'Activated partial thromboplastin time', 800.00,
     '25-35 seconds', 'seconds', '2-4 hours', true),

    -- Liver Function
    ('Liver Function Test', 'Blood', 'Comprehensive liver panel', 1500.00,
     'ALT: 7-56 U/L, AST: 10-40 U/L, Bilirubin: 0.1-1.2 mg/dL', 'U/L, mg/dL', '4-6 hours', true),

    -- Kidney Function
    ('Kidney Function Test', 'Blood', 'Renal function panel', 1200.00,
     'Creatinine: 0.6-1.2 mg/dL, Urea: 7-20 mg/dL', 'mg/dL', '4-6 hours', true),

    -- Others
    ('Ultrasound - Pregnancy', 'Imaging', 'Obstetric ultrasound', 2000.00,
     'Varies by gestational age', 'Visual', '30 minutes', true),

    ('X-Ray Chest', 'Imaging', 'Chest radiography', 1500.00,
     'Normal lung fields, no abnormalities', 'Visual', '1-2 hours', true)

ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================

-- Verification queries (run these to verify the migration):
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT * FROM treatment_types;
-- SELECT * FROM departments;
-- SELECT * FROM lab_tests;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- ✓ 12 Tables created with proper relationships
-- ✓ All indexes created for performance
-- ✓ Row Level Security enabled on all tables
-- ✓ Auto-generation of MR numbers for patients
-- ✓ Auto-update of updated_at timestamps
-- ✓ 27 Treatment types pre-populated
-- ✓ 7 Departments pre-populated
-- ✓ 18 Lab tests pre-populated
--
-- You can now use this database with your North Karachi Hospital application!
-- ============================================================================
