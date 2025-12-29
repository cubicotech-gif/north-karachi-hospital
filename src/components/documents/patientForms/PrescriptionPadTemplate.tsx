import React, { forwardRef } from 'react';

interface PrescriptionPadTemplateProps {
  patientData?: {
    mr_number: string;
    name: string;
    age: number;
    gender: string;
  };
}

const PrescriptionPadTemplate = forwardRef<HTMLDivElement, PrescriptionPadTemplateProps>(
  ({ patientData }, ref) => {
    // Generate 4 prescription forms per page
    const prescriptionForms = Array.from({ length: 4 }, (_, i) => i + 1);

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
          {prescriptionForms.map((formNum) => (
            <div key={formNum} style={{ marginBottom: '24px', border: '2px solid #000', padding: '16px' }} className="avoid-break">
              {/* Prescription Header */}
              <div style={{ borderBottom: '2px solid #000', paddingBottom: '8px', marginBottom: '12px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#000', margin: '0' }}>Prescription Form</h1>
              </div>

              {/* Patient Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '600' }}>MR#:</span>
                  {patientData ? (
                    <span>{patientData.mr_number}</span>
                  ) : (
                    <div style={{ flex: '1', borderBottom: '1px solid #000' }}></div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '600' }}>Date:</span>
                  <div style={{ flex: '1', borderBottom: '1px solid #000' }}></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '600' }}>Patient Name:</span>
                  {patientData ? (
                    <span>{patientData.name}</span>
                  ) : (
                    <div style={{ flex: '1', borderBottom: '1px solid #000' }}></div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '600' }}>Age/Gender:</span>
                  {patientData ? (
                    <span>{patientData.age} / {patientData.gender}</span>
                  ) : (
                    <div style={{ flex: '1', borderBottom: '1px solid #000' }}></div>
                  )}
                </div>
              </div>

              {/* Rx Symbol */}
              <div style={{ marginBottom: '8px' }}>
                <p style={{ fontSize: '32px', fontFamily: 'serif', fontStyle: 'italic', color: '#000', margin: '0' }}>℞</p>
              </div>

              {/* Prescription Lines */}
              <div style={{ marginBottom: '12px', minHeight: '120px' }}>
                <div>
                  {Array.from({ length: 8 }, (_, i) => i + 1).map((line) => (
                    <div key={line} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ fontSize: '10px', color: '#666', width: '16px' }}>{line}.</span>
                      <div style={{ flex: '1', borderBottom: '1px solid #666' }}></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600' }}>Special Instructions:</span>
                  <div style={{ flex: '1', borderBottom: '1px solid #666' }}></div>
                </div>
                <div style={{ borderBottom: '1px solid #666', height: '20px' }}></div>
              </div>

              {/* Follow-up */}
              <div style={{ marginBottom: '12px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: '600' }}>Follow-up:</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '16px', height: '16px', border: '2px solid #000' }}></div>
                    <span style={{ fontSize: '10px' }}>Not required</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '16px', height: '16px', border: '2px solid #000' }}></div>
                    <span style={{ fontSize: '10px' }}>After</span>
                  </label>
                  <div style={{ width: '64px', borderBottom: '1px solid #000' }}></div>
                  <span style={{ fontSize: '10px' }}>days/weeks</span>
                </div>
              </div>

              {/* Doctor Info */}
              <div style={{ borderTop: '1px solid #666', paddingTop: '12px', marginTop: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '600' }}>Doctor's Name:</span>
                      <div style={{ flex: '1', borderBottom: '1px solid #000' }}></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '600' }}>Qualification:</span>
                      <div style={{ flex: '1', borderBottom: '1px solid #000' }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '600' }}>PMDC Reg#:</span>
                      <div style={{ flex: '1', borderBottom: '1px solid #000' }}></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '600' }}>Signature:</span>
                      <div style={{ flex: '1', borderBottom: '1px solid #000' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '10px', color: '#666' }}>
                <p style={{ margin: '0' }}>Contact: [Hospital Phone] | Emergency: [Emergency Line]</p>
              </div>

              {/* Copy Indicator */}
              <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '10px', color: '#666' }}>
                {formNum === 1 && '(Original - Patient Copy)'}
                {formNum === 2 && '(Duplicate - File Copy)'}
                {formNum > 2 && '(Additional Copy)'}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

PrescriptionPadTemplate.displayName = 'PrescriptionPadTemplate';

export default PrescriptionPadTemplate;
