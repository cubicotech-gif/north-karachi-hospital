import React, { forwardRef } from 'react';

interface VisitNotesTemplateProps {
  patientData?: {
    mr_number: string;
    name: string;
  };
}

const VisitNotesTemplate = forwardRef<HTMLDivElement, VisitNotesTemplateProps>(
  ({ patientData }, ref) => {
    // Generate 5 blank visit note sections per page
    const visitSections = Array.from({ length: 5 }, (_, i) => i + 1);

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
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#000', margin: '0' }}>VISIT NOTES</h1>
            {patientData && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '8px' }}>
                <p style={{ margin: '0' }}><strong>MR#:</strong> {patientData.mr_number}</p>
                <p style={{ margin: '0' }}><strong>Patient:</strong> {patientData.name}</p>
              </div>
            )}
          </div>

          {/* Visit Note Sections */}
          {visitSections.map((num) => (
            <div key={num} style={{ marginBottom: '24px', border: '2px solid #333', padding: '12px' }} className="avoid-break">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600' }}>Date:</span>
                  <div style={{ flex: '1', borderBottom: '1px solid #666' }}></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600' }}>Time:</span>
                  <div style={{ flex: '1', borderBottom: '1px solid #666' }}></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600' }}>Token#:</span>
                  <div style={{ flex: '1', borderBottom: '1px solid #666' }}></div>
                </div>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <p style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px', margin: '0 0 4px 0' }}>CHIEF COMPLAINT:</p>
                <div style={{ borderBottom: '1px solid #333', height: '24px' }}></div>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <p style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px', margin: '0 0 4px 0' }}>HISTORY OF PRESENT ILLNESS:</p>
                <div>
                  {[1, 2, 3].map((line) => (
                    <div key={line} style={{ borderBottom: '1px solid #333', height: '20px', marginBottom: '4px' }}></div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px', margin: '0 0 4px 0' }}>EXAMINATION:</p>
                  <div>
                    {[1, 2].map((line) => (
                      <div key={line} style={{ borderBottom: '1px solid #333', height: '20px', marginBottom: '4px' }}></div>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px', margin: '0 0 4px 0' }}>DIAGNOSIS:</p>
                  <div>
                    {[1, 2].map((line) => (
                      <div key={line} style={{ borderBottom: '1px solid #333', height: '20px', marginBottom: '4px' }}></div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <p style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px', margin: '0 0 4px 0' }}>TREATMENT / ADVICE:</p>
                <div>
                  {[1, 2].map((line) => (
                    <div key={line} style={{ borderBottom: '1px solid #333', height: '20px', marginBottom: '4px' }}></div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                <span style={{ fontSize: '10px', fontWeight: '600' }}>Doctor's Signature:</span>
                <div style={{ flex: '1', borderBottom: '1px solid #666' }}></div>
                <span style={{ fontSize: '10px', fontWeight: '600' }}>Name:</span>
                <div style={{ width: '160px', borderBottom: '1px solid #666' }}></div>
              </div>
            </div>
          ))}

          {/* Footer */}
          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '10px', color: '#666', borderTop: '1px solid #333', paddingTop: '8px' }}>
            <p style={{ margin: '0' }}>Clinical Documentation</p>
          </div>
        </div>
      </div>
    );
  }
);

VisitNotesTemplate.displayName = 'VisitNotesTemplate';

export default VisitNotesTemplate;
