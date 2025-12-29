import React, { forwardRef } from 'react';

interface FileCoverSheetProps {
  patientData: {
    mr_number: string;
    name: string;
    age: number;
    gender: string;
    contact: string;
    cnic_number?: string;
    blood_group?: string;
    address?: string;
    emergency_contact?: string;
    created_at: string;
  };
}

const FileCoverSheet = forwardRef<HTMLDivElement, FileCoverSheetProps>(
  ({ patientData }, ref) => {
    return (
      <div ref={ref} style={{ width: '210mm', minHeight: '297mm', padding: '0', margin: '0', backgroundColor: 'white' }}>
        <style>{`
          @page {
            size: A4;
            margin: 50mm 25mm 25mm 25mm;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .page-break {
              page-break-before: always;
            }
            .avoid-break {
              page-break-inside: avoid;
            }
          }
        `}</style>

        <div style={{ padding: '0', fontFamily: 'Arial, sans-serif', color: '#000' }}>
          {/* MR Number - Large and prominent */}
          <div style={{ border: '2px solid #000', padding: '12px', marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', color: '#333', marginBottom: '4px' }}>Medical Record Number</p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#000', margin: '0' }}>{patientData.mr_number}</p>
          </div>

          {/* Patient Information */}
          <div style={{ marginBottom: '20px' }} className="avoid-break">
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', marginBottom: '12px', borderBottom: '2px solid #000', paddingBottom: '6px' }}>
              PATIENT INFORMATION
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ borderBottom: '1px solid #333', paddingBottom: '6px' }}>
                <p style={{ fontSize: '10px', color: '#666', margin: '0' }}>Full Name</p>
                <p style={{ fontSize: '14px', fontWeight: '600', margin: '0' }}>{patientData.name}</p>
              </div>

              <div style={{ borderBottom: '1px solid #333', paddingBottom: '6px' }}>
                <p style={{ fontSize: '10px', color: '#666', margin: '0' }}>Age / Gender</p>
                <p style={{ fontSize: '14px', fontWeight: '600', margin: '0' }}>{patientData.age} years / {patientData.gender}</p>
              </div>

              <div style={{ borderBottom: '1px solid #333', paddingBottom: '6px' }}>
                <p style={{ fontSize: '10px', color: '#666', margin: '0' }}>Contact Number</p>
                <p style={{ fontSize: '14px', fontWeight: '600', margin: '0' }}>{patientData.contact}</p>
              </div>

              <div style={{ borderBottom: '1px solid #333', paddingBottom: '6px' }}>
                <p style={{ fontSize: '10px', color: '#666', margin: '0' }}>CNIC Number</p>
                <p style={{ fontSize: '14px', fontWeight: '600', margin: '0' }}>{patientData.cnic_number || 'N/A'}</p>
              </div>

              <div style={{ borderBottom: '1px solid #333', paddingBottom: '6px' }}>
                <p style={{ fontSize: '10px', color: '#666', margin: '0' }}>Blood Group</p>
                <p style={{ fontSize: '14px', fontWeight: '600', margin: '0' }}>{patientData.blood_group || 'N/A'}</p>
              </div>

              <div style={{ borderBottom: '1px solid #333', paddingBottom: '6px' }}>
                <p style={{ fontSize: '10px', color: '#666', margin: '0' }}>Registration Date</p>
                <p style={{ fontSize: '14px', fontWeight: '600', margin: '0' }}>
                  {new Date(patientData.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {patientData.address && (
              <div style={{ borderBottom: '1px solid #333', paddingBottom: '6px', marginTop: '12px' }}>
                <p style={{ fontSize: '10px', color: '#666', margin: '0' }}>Address</p>
                <p style={{ fontSize: '14px', fontWeight: '600', margin: '0' }}>{patientData.address}</p>
              </div>
            )}

            {patientData.emergency_contact && (
              <div style={{ borderBottom: '1px solid #333', paddingBottom: '6px', marginTop: '12px' }}>
                <p style={{ fontSize: '10px', color: '#666', margin: '0' }}>Emergency Contact</p>
                <p style={{ fontSize: '14px', fontWeight: '600', margin: '0' }}>{patientData.emergency_contact}</p>
              </div>
            )}
          </div>

          {/* File Contents Checklist */}
          <div style={{ marginBottom: '20px' }} className="avoid-break">
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', marginBottom: '12px', borderBottom: '2px solid #000', paddingBottom: '6px' }}>
              FILE CONTENTS CHECKLIST
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {[
                'Registration Form',
                'Visit Notes',
                'Vitals Chart',
                'Diagnosis Records',
                'Medication Chart',
                'Allergies & Conditions',
                'Prescriptions',
                'Lab Reports',
                'OPD Receipts',
                'Treatment Records',
                'Admission Records',
                'Discharge Summary',
                'Follow-up Checklists',
                'Imaging Reports',
                'Consent Forms',
                'Other Documents'
              ].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', border: '1px solid #333', padding: '6px' }}>
                  <div style={{ width: '16px', height: '16px', border: '2px solid #000', marginRight: '8px' }}></div>
                  <span style={{ fontSize: '11px' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div style={{ border: '1px solid #333', borderLeft: '4px solid #000', padding: '12px', backgroundColor: '#f5f5f5' }} className="avoid-break">
            <h3 style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '6px', margin: '0 0 6px 0' }}>FILE HANDLING INSTRUCTIONS:</h3>
            <ul style={{ fontSize: '10px', margin: '0', paddingLeft: '20px', lineHeight: '1.6' }}>
              <li>Keep all documents in chronological order (newest on top)</li>
              <li>Staple all receipts and printed documents securely</li>
              <li>Record all visit dates on the Visit Notes section</li>
              <li>Update Medication Chart with each prescription change</li>
              <li>Mark allergies in RED on the Allergies form</li>
              <li>File must be returned to Records Department after each visit</li>
            </ul>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '10px', color: '#666' }}>
            <p style={{ margin: '0' }}>This is a confidential medical record. Handle with care.</p>
          </div>
        </div>
      </div>
    );
  }
);

FileCoverSheet.displayName = 'FileCoverSheet';

export default FileCoverSheet;
