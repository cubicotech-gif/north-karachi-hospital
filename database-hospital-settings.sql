-- Hospital Settings Table
-- This stores the hospital's basic information, branding, and configuration

CREATE TABLE IF NOT EXISTS hospital_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Information
  hospital_name VARCHAR(255) NOT NULL DEFAULT 'North Karachi Hospital',
  hospital_name_urdu VARCHAR(255), -- Urdu name for documents

  -- Contact Information
  address TEXT,
  address_urdu TEXT,
  city VARCHAR(100) DEFAULT 'Karachi',
  phone VARCHAR(50),
  phone2 VARCHAR(50), -- Additional phone
  email VARCHAR(100),
  website VARCHAR(100),

  -- Registration & Legal
  registration_number VARCHAR(100),
  ntn_number VARCHAR(50), -- National Tax Number
  license_number VARCHAR(100),

  -- Branding
  logo_url TEXT, -- URL to logo stored in Supabase Storage
  letterhead_color VARCHAR(7) DEFAULT '#2563eb', -- Hex color code

  -- Document Settings
  receipt_prefix VARCHAR(10) DEFAULT 'RCP', -- e.g., RCP-001234
  invoice_prefix VARCHAR(10) DEFAULT 'INV',
  admission_prefix VARCHAR(10) DEFAULT 'ADM',
  discharge_prefix VARCHAR(10) DEFAULT 'DSC',
  prescription_prefix VARCHAR(10) DEFAULT 'PRX',

  -- Counters for sequential numbering
  receipt_counter INTEGER DEFAULT 1,
  invoice_counter INTEGER DEFAULT 1,
  admission_counter INTEGER DEFAULT 1,
  discharge_counter INTEGER DEFAULT 1,
  prescription_counter INTEGER DEFAULT 1,

  -- Print Settings
  print_footer TEXT, -- Footer text for all documents
  print_footer_urdu TEXT,

  -- Metadata
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default record with actual North Karachi Hospital information
INSERT INTO hospital_settings (
  hospital_name,
  hospital_name_urdu,
  address,
  city,
  phone,
  email,
  website
) VALUES (
  'North Karachi Hospital',
  'نارتھ کراچی ہسپتال',
  'C-122, Sector 11-B, North Karachi Township',
  'Karachi',
  '36989080',
  'info@northkarachihospital.com',
  'www.northkarachihospital.com'
) ON CONFLICT DO NOTHING;

-- Document Generation Log Table
-- Tracks all generated documents for reprinting and auditing
CREATE TABLE IF NOT EXISTS generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Document Identification
  document_type VARCHAR(50) NOT NULL, -- 'receipt', 'prescription', 'discharge', 'consent', etc.
  document_number VARCHAR(50) NOT NULL UNIQUE, -- e.g., RCP-001234

  -- Related Entities
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,

  -- Related Transactions
  opd_token_id UUID,
  admission_id UUID,
  lab_order_id UUID,
  treatment_id UUID,

  -- Document Data (stored as JSON for flexibility)
  document_data JSONB NOT NULL,

  -- Tracking
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  generated_by UUID REFERENCES auth.users(id),
  print_count INTEGER DEFAULT 0,
  last_printed_at TIMESTAMP,

  -- Indexing
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_patient ON generated_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_documents_doctor ON generated_documents(doctor_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON generated_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_number ON generated_documents(document_number);
CREATE INDEX IF NOT EXISTS idx_documents_date ON generated_documents(generated_at);

-- Function to get next document number
CREATE OR REPLACE FUNCTION get_next_document_number(doc_type VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  prefix VARCHAR;
  counter INTEGER;
  next_number VARCHAR;
BEGIN
  -- Get prefix and increment counter based on document type
  CASE doc_type
    WHEN 'receipt' THEN
      UPDATE hospital_settings SET receipt_counter = receipt_counter + 1
      RETURNING receipt_prefix, receipt_counter INTO prefix, counter;
    WHEN 'invoice' THEN
      UPDATE hospital_settings SET invoice_counter = invoice_counter + 1
      RETURNING invoice_prefix, invoice_counter INTO prefix, counter;
    WHEN 'admission' THEN
      UPDATE hospital_settings SET admission_counter = admission_counter + 1
      RETURNING admission_prefix, admission_counter INTO prefix, counter;
    WHEN 'discharge' THEN
      UPDATE hospital_settings SET discharge_counter = discharge_counter + 1
      RETURNING discharge_prefix, discharge_counter INTO prefix, counter;
    WHEN 'prescription' THEN
      UPDATE hospital_settings SET prescription_counter = prescription_counter + 1
      RETURNING prescription_prefix, prescription_counter INTO prefix, counter;
    ELSE
      prefix := 'DOC';
      counter := 1;
  END CASE;

  -- Format: PREFIX-NNNNNN (6 digits with leading zeros)
  next_number := prefix || '-' || LPAD(counter::TEXT, 6, '0');

  RETURN next_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE hospital_settings IS 'Stores hospital configuration, branding, and settings for document generation';
COMMENT ON TABLE generated_documents IS 'Audit trail and reprint capability for all generated documents';
COMMENT ON FUNCTION get_next_document_number IS 'Generates sequential document numbers with prefixes';
