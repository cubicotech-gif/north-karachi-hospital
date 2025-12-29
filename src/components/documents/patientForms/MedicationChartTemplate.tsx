import React, { forwardRef } from 'react';

interface MedicationChartTemplateProps {
  patientData?: {
    mr_number: string;
    name: string;
  };
}

const MedicationChartTemplate = forwardRef<HTMLDivElement, MedicationChartTemplateProps>(
  ({ patientData }, ref) => {
    // Generate 25 blank rows for medication entries
    const medicationRows = Array.from({ length: 25 }, (_, i) => i + 1);

    return (
      <div ref={ref} style={{ width: '297mm', minHeight: '210mm', padding: '0', margin: '0', backgroundColor: 'white' }}>
        <style>{`
          @page {
            size: A4 landscape;
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
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#000', margin: '0' }}>MEDICATION ADMINISTRATION CHART</h1>
            {patientData && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '8px' }}>
                <p style={{ margin: '0' }}><strong>MR#:</strong> {patientData.mr_number}</p>
                <p style={{ margin: '0' }}><strong>Patient:</strong> {patientData.name}</p>
              </div>
            )}
          </div>

          <div style={{ backgroundColor: '#f5f5f5', borderLeft: '4px solid #000', padding: '8px', marginBottom: '12px' }}>
            <p style={{ fontSize: '10px', fontWeight: '600', margin: '0' }}>
              ⚠ Record ALL medications prescribed and administered. Cross-check for drug interactions and allergies before administration.
            </p>
          </div>

          {/* Medication Table */}
          <table style={{ width: '100%', border: '2px solid #000', fontSize: '10px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ border: '1px solid #000', padding: '8px', width: '64px' }}>Date<br/>Started</th>
                <th style={{ border: '1px solid #000', padding: '8px', width: '128px' }}>Medication Name<br/>& Strength</th>
                <th style={{ border: '1px solid #000', padding: '8px', width: '96px' }}>Dosage &<br/>Route</th>
                <th style={{ border: '1px solid #000', padding: '8px', width: '80px' }}>Frequency</th>
                <th style={{ border: '1px solid #000', padding: '8px', width: '80px' }}>Duration</th>
                <th style={{ border: '1px solid #000', padding: '8px', width: '112px' }}>Prescribed By<br/>(Doctor)</th>
                <th style={{ border: '1px solid #000', padding: '8px' }}>Indication /<br/>Purpose</th>
                <th style={{ border: '1px solid #000', padding: '8px', width: '64px' }}>Date<br/>Stopped</th>
                <th style={{ border: '1px solid #000', padding: '8px', width: '96px' }}>Reason for<br/>Discontinuation</th>
              </tr>
            </thead>
            <tbody>
              {medicationRows.map((num) => (
                <tr key={num} style={{ height: '32px' }}>
                  <td style={{ border: '1px solid #000', padding: '4px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Legend and Instructions */}
          <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ backgroundColor: '#f5f5f5', border: '1px solid #333', padding: '8px' }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '8px', margin: '0 0 8px 0' }}>ROUTE ABBREVIATIONS:</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '10px' }}>
                <div><strong>PO:</strong> Oral (by mouth)</div>
                <div><strong>IV:</strong> Intravenous</div>
                <div><strong>IM:</strong> Intramuscular</div>
                <div><strong>SC:</strong> Subcutaneous</div>
                <div><strong>SL:</strong> Sublingual</div>
                <div><strong>TOP:</strong> Topical</div>
                <div><strong>INH:</strong> Inhalation</div>
                <div><strong>PR:</strong> Per rectum</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#f5f5f5', border: '1px solid #333', padding: '8px' }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '8px', margin: '0 0 8px 0' }}>FREQUENCY ABBREVIATIONS:</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '10px' }}>
                <div><strong>OD:</strong> Once daily</div>
                <div><strong>BD:</strong> Twice daily</div>
                <div><strong>TDS:</strong> Three times daily</div>
                <div><strong>QID:</strong> Four times daily</div>
                <div><strong>PRN:</strong> As needed</div>
                <div><strong>STAT:</strong> Immediately</div>
                <div><strong>HS:</strong> At bedtime</div>
                <div><strong>AC:</strong> Before meals</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '8px', backgroundColor: '#f5f5f5', borderLeft: '4px solid #000', padding: '8px' }}>
            <p style={{ fontSize: '10px', margin: '0' }}>
              <strong>CRITICAL:</strong> Always check patient allergies and current medications before prescribing new drugs.
              Mark discontinued medications clearly. Update this chart with every medication change.
            </p>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '10px', color: '#666' }}>
            <p style={{ margin: '0' }}>Pharmacy & Medical Records</p>
          </div>
        </div>
      </div>
    );
  }
);

MedicationChartTemplate.displayName = 'MedicationChartTemplate';

export default MedicationChartTemplate;
