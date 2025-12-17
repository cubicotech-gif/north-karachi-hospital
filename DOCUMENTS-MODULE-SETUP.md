# Documents Module Setup Guide

This guide will help you set up the centralized Documents & Paperwork Management module for North Karachi Hospital.

## Overview

The Documents Module allows you to:
- ✅ Upload all hospital paper templates (PDFs, images, Word docs)
- ✅ Manage hospital logo from one central location
- ✅ Connect templates to specific modules (billing, admission, discharge, etc.)
- ✅ Update templates without touching code
- ✅ Store physical document formats digitally

## Setup Steps

### 1. Run the Database SQL

Execute the SQL script to create the necessary tables:

```bash
# In your Supabase SQL Editor, run:
database-documents-module.sql
```

This creates:
- `document_categories` - Organizes document types
- `document_templates` - Stores uploaded templates
- `document_template_mappings` - Links templates to modules

### 2. Create Supabase Storage Bucket

You need to create a storage bucket for document uploads:

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Click on **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Enter bucket name: `hospital-documents`
5. Set **Public bucket** to `ON` (so documents can be viewed)
6. Click **Create bucket**

#### Option B: Using SQL

```sql
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('hospital-documents', 'hospital-documents', true);

-- Set bucket policies (allow authenticated users to upload)
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'hospital-documents');

-- Allow public reads
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'hospital-documents');

-- Allow authenticated deletes (for admins)
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'hospital-documents');
```

### 3. Grant User Permissions

Add the 'documents' module permission to admin users:

```sql
-- Grant admin users access to documents module
UPDATE user_roles
SET permissions = permissions || '["documents"]'::jsonb
WHERE role = 'admin';

-- Or grant to specific users
UPDATE user_roles
SET permissions = permissions || '["documents"]'::jsonb
WHERE user_id = 'YOUR_USER_ID';
```

### 4. Upload Your First Template

1. Navigate to **Documents & Paperwork** in the app
2. Click **Upload Documents** tab
3. Fill in:
   - **Template Name**: e.g., "Urdu/English Receipt Template"
   - **Category**: Select appropriate category (Receipts, Consent Forms, etc.)
   - **Description**: Brief description
   - **File**: Upload your PDF/image/Word document
4. Click **Upload Template**

### 5. Connect Template to Module

1. Go to **Module Connections** tab
2. Select your uploaded template
3. Choose the module (e.g., "Billing & Invoices")
4. Choose document type (e.g., "Receipt")
5. Click **Create Connection**

Now when users print from that module, it will use your custom template!

## Document Categories

The system comes with pre-configured categories:

- **Receipts** - Payment receipts and billing documents
- **Consent Forms** - Patient consent forms for procedures
- **Discharge Documents** - Discharge summaries and certificates
- **Lab Reports** - Laboratory test report templates
- **Admission Forms** - Patient admission and registration forms
- **Prescriptions** - Doctor prescription templates
- **Letterheads** - Hospital letterheads and headers
- **Certificates** - Medical certificates and documents
- **Other Documents** - Miscellaneous documents

## Hospital Logo Management

To upload your hospital logo:

1. Go to **Hospital Settings** module
2. In the **Branding** tab, upload your logo
3. The logo will automatically appear on all letterheads and documents

## Supported File Formats

- **PDF** (.pdf) - Best for finalized documents
- **Images** (.png, .jpg, .jpeg) - Good for scanned forms
- **Word Documents** (.doc, .docx) - For editable templates
- **Maximum file size**: 10MB per file

## Module Integrations

The Documents Module integrates with:

- **Billing & Invoices** - Receipt templates
- **Patient Admission** - Admission forms, consent forms
- **Patient Discharge** - Discharge summaries, certificates
- **Lab Management** - Lab report templates, lab slips
- **Treatment Management** - Treatment consent forms, receipts
- **OPD** - OPD token slips
- **Pharmacy** - Prescription templates

## Troubleshooting

### Upload fails with "storage bucket not found"

- **Solution**: Create the `hospital-documents` storage bucket (see Step 2)

### Can't see Documents module in navigation

- **Solution**: Grant your user the 'documents' permission (see Step 3)

### Template uploaded but not showing in module

- **Solution**: Create a mapping in the **Module Connections** tab (Step 5)

### File upload fails

- **Solution**: Check file size (must be under 10MB) and format (PDF, PNG, JPG, DOC)

## Examples

### Example 1: Upload Receipt Template

1. Have your receipt template as PDF (Urdu/English)
2. Upload to **Receipts** category
3. Name it: "Bilingual Receipt - Urdu/English"
4. Connect to **Billing** module → **Receipt** type

### Example 2: Upload Consent Form

1. Scan your consent form (or save as PDF)
2. Upload to **Consent Forms** category
3. Name it: "Tubal Ligation Consent - Urdu"
4. Connect to **Treatment** module → **Consent Form** type

### Example 3: Upload Hospital Letterhead

1. Design your letterhead with logo (PDF or image)
2. Upload to **Letterheads** category
3. Name it: "Official Hospital Letterhead"
4. Connect to multiple modules as needed

## Advanced Features

### Setting Default Template

When uploading, you can mark a template as "default" for its category. This template will be used by default if no specific mapping exists.

### Template Versioning

To update a template:
1. Upload the new version
2. Delete the old version (it will be soft-deleted)
3. Update the module mapping if needed

### Viewing Uploaded Documents

Click **View Templates** tab to see all uploaded documents organized by category. You can:
- Preview documents (opens in new tab)
- Download documents
- Delete documents

## Security Notes

- ✅ Only authenticated users can upload documents
- ✅ All users can view documents (public read access)
- ✅ Only admins can delete documents
- ✅ All uploads are stored in Supabase Storage
- ✅ File URLs are public (do not upload sensitive internal documents)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify all setup steps were completed
3. Check Supabase dashboard for error logs
4. Contact system administrator

---

**Last Updated**: 2025-12-17
**Module Version**: 1.0
