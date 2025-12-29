import React, { forwardRef } from 'react';

interface DiagnosisRecordTemplateProps {
  patientData?: {
    mr_number: string;
    name: string;
  };
}

const DiagnosisRecordTemplate = forwardRef<HTMLDivElement, DiagnosisRecordTemplateProps>(
  ({ patientData }, ref) => {
    // Generate 12 blank diagnosis entry sections
    const diagnosisEntries = Array.from({ length: 12 }, (_, i) => i + 1);

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
          {/* Header */}
          <div style={{ borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '16px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#000', margin: '0' }}>DIAGNOSIS RECORD SHEET</h1>
            {patientData && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '8px' }}>
                <p style={{ margin: '0' }}><strong>MR#:</strong> {patientData.mr_number}</p>
                <p style={{ margin: '0' }}><strong>Patient:</strong> {patientData.name}</p>
              </div>
            )}
          </div>

          <div style={{ backgroundColor: '#f5f5f5', borderLeft: '4px solid #000', padding: '12px', marginBottom: '16px' }}>
            <p style={{ fontSize: '10px', fontWeight: '600', margin: '0' }}>
              Record all diagnoses chronologically. Include ICD-10 codes when available.
              Mark chronic/ongoing conditions with ★
            </p>
          </div>

          {/* Diagnosis Entries */}
          <div>
            {diagnosisEntries.map((num) => (
              <div key={num} style={{ border: '2px solid #333', padding: '12px', marginBottom: '12px' }} className="avoid-break">
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '600' }}>Date:</span>
                    <div style={{ flex: '1', borderBottom: '1px solid #666' }}></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '600' }}>Token#:</span>
                    <div style={{ flex: '1', borderBottom: '1px solid #666' }}></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '600' }}>Doctor:</span>
                    <div style={{ flex: '1', borderBottom: '1px solid #666' }}></div>
                  </div>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <p style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px', margin: '0 0 4px 0' }}>PRIMARY DIAGNOSIS:</p>
                  <div style={{ borderBottom: '1px solid #333', height: '24px' }}></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px', margin: '0 0 4px 0' }}>ICD-10 CODE:</p>
                    <div style={{ borderBottom: '1px solid #333', height: '20px' }}></div>
                  </div>
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px', margin: '0 0 4px 0' }}>STATUS:</p>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '16px', height: '16px', border: '2px solid #666' }}></div>
                        Acute
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '16px', height: '16px', border: '2px solid #666' }}></div>
                        Chronic
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '16px', height: '16px', border: '2px solid #666' }}></div>
                        Resolved
                      </label>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <p style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px', margin: '0 0 4px 0' }}>SECONDARY DIAGNOSIS / COMPLICATIONS:</p>
                  <div style={{ borderBottom: '1px solid #333', height: '20px' }}></div>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <p style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px', margin: '0 0 4px 0' }}>NOTES / INVESTIGATIONS ORDERED:</p>
                  <div style={{ borderBottom: '1px solid #333', height: '20px' }}></div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '600' }}>Doctor's Signature:</span>
                  <div style={{ flex: '1', borderBottom: '1px solid #666' }}></div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '10px', color: '#666', borderTop: '1px solid #333', paddingTop: '8px' }}>
            <p style={{ margin: '0' }}>Medical Records Department</p>
          </div>
        </div>
      </div>
    );
  }
);

DiagnosisRecordTemplate.displayName = 'DiagnosisRecordTemplate';

export default DiagnosisRecordTemplate;
