# Print Integration Plan - Completed

## ✅ Completed:
1. **Billing Module** - Professional receipt printing with QR codes

## 🚧 Next Priority (Due to complexity, recommend manual integration):

### Critical Modules:
2. **Discharge Module** - Replace basic print with DischargeSummaryTemplate
3. **Lab Management** - Add LabReportTemplate for test results  
4. **Admission Module** - Add AdmissionFormTemplate with consent
5. **Treatment Module** - Add GeneralConsentForm for procedures

### Implementation Notes:
- All templates are ready in `/src/components/documents/`
- Use `react-to-print` pattern from BillingInvoices.tsx
- Each module needs: `useRef`, state for selected item, print handler

### Why Manual Recommended:
- Each module has unique data structure
- Need to carefully map existing data to template props
- Risk of breaking existing functionality if rushed
- Better to implement one at a time with testing

## Templates Available:
- ✅ ReceiptTemplate (integrated in Billing)
- ✅ DischargeSummaryTemplate (ready)
- ✅ LabReportTemplate (ready)
- ✅ PrescriptionTemplate (ready)
- ✅ AdmissionFormTemplate (ready)
- ✅ GeneralConsentForm (ready)
- ✅ TLConsentForm (ready)
- ✅ MaternityProfileTemplate (ready)

