-- Document Templates Management System
-- This creates a centralized document management system

-- Drop existing tables if they exist
DROP TABLE IF EXISTS document_template_mappings CASCADE;
DROP TABLE IF EXISTS document_templates CASCADE;
DROP TABLE IF EXISTS document_categories CASCADE;

-- Document Categories (types of documents)
CREATE TABLE document_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document Templates (uploaded templates)
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES document_categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL, -- URL to uploaded file (Supabase Storage)
  file_type VARCHAR(50), -- pdf, image, docx, etc.
  file_size INTEGER, -- in bytes
  thumbnail_url TEXT, -- preview thumbnail
  is_default BOOLEAN DEFAULT false, -- default template for this category
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document Template Mappings (connect templates to modules)
CREATE TABLE document_template_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES document_templates(id) ON DELETE CASCADE,
  module_name VARCHAR(100) NOT NULL, -- 'billing', 'admission', 'discharge', 'lab', 'treatment'
  document_type VARCHAR(100) NOT NULL, -- 'receipt', 'consent_form', 'discharge_summary', etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default document categories
INSERT INTO document_categories (name, description, icon) VALUES
  ('Receipts', 'Payment receipts and billing documents', 'Receipt'),
  ('Consent Forms', 'Patient consent forms for procedures', 'FileCheck'),
  ('Discharge Documents', 'Discharge summaries and certificates', 'FileText'),
  ('Lab Reports', 'Laboratory test report templates', 'TestTube'),
  ('Admission Forms', 'Patient admission and registration forms', 'ClipboardList'),
  ('Prescriptions', 'Doctor prescription templates', 'Pill'),
  ('Letterheads', 'Hospital letterheads and headers', 'FileImage'),
  ('Certificates', 'Medical certificates and documents', 'Award'),
  ('Other Documents', 'Miscellaneous documents', 'File');

-- Create indexes for better performance
CREATE INDEX idx_document_templates_category ON document_templates(category_id);
CREATE INDEX idx_document_templates_active ON document_templates(active);
CREATE INDEX idx_document_template_mappings_module ON document_template_mappings(module_name);
CREATE INDEX idx_document_template_mappings_template ON document_template_mappings(template_id);

-- Function to get active templates by category
CREATE OR REPLACE FUNCTION get_templates_by_category(cat_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  description TEXT,
  file_url TEXT,
  file_type VARCHAR,
  is_default BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dt.id,
    dt.name,
    dt.description,
    dt.file_url,
    dt.file_type,
    dt.is_default
  FROM document_templates dt
  WHERE dt.category_id = cat_id AND dt.active = true
  ORDER BY dt.is_default DESC, dt.name ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get template for specific module and document type
CREATE OR REPLACE FUNCTION get_module_template(
  mod_name VARCHAR,
  doc_type VARCHAR
)
RETURNS TABLE (
  template_id UUID,
  template_name VARCHAR,
  file_url TEXT,
  file_type VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dt.id,
    dt.name,
    dt.file_url,
    dt.file_type
  FROM document_templates dt
  INNER JOIN document_template_mappings dtm ON dt.id = dtm.template_id
  WHERE dtm.module_name = mod_name
    AND dtm.document_type = doc_type
    AND dtm.is_active = true
    AND dt.active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE document_categories IS 'Categories for organizing document templates';
COMMENT ON TABLE document_templates IS 'Uploaded document templates (PDFs, images, etc.)';
COMMENT ON TABLE document_template_mappings IS 'Maps templates to specific modules and document types';
