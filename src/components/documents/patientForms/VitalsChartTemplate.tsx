import React, { forwardRef } from 'react';

interface VitalsChartTemplateProps {
  patientData?: {
    mr_number: string;
    name: string;
  };
}

const VitalsChartTemplate = forwardRef<HTMLDivElement, VitalsChartTemplateProps>(
  ({ patientData }, ref) => {
    // Generate 20 blank rows for vitals recording
    const vitalRows = Array.from({ length: 20 }, (_, i) => i + 1);

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
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#000', margin: '0' }}>VITALS RECORDING CHART</h1>
            {patientData && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '8px' }}>
                <p style={{ margin: '0' }}><strong>MR#:</strong> {patientData.mr_number}</p>
                <p style={{ margin: '0' }}><strong>Patient:</strong> {patientData.name}</p>
              </div>
            )}
          </div>

          {/* Vitals Table */}
          <table style={{ width: '100%', border: '2px solid #000', fontSize: '10px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ border: '1px solid #000', padding: '8px', width: '80px' }}>Date</th>
                <th style={{ border: '1px solid #000', padding: '8px', width: '64px' }}>Time</th>
                <th style={{ border: '1px solid #000', padding: '8px', width: '96px' }}>BP<br/>(mmHg)</th>
                <th style={{ border: '1px solid #000', padding: '8px', width: '80px' }}>Pulse<br/>(bpm)</th>
                <th style={{ border: '1px solid #000', padding: '8px', width: '80px' }}>Temp<br/>(°F)</th>
                <th style={{ border: '1px solid #000', padding: '8px', width: '80px' }}>RR<br/>(br/min)</th>
                <th style={{ border: '1px solid #000', padding: '8px', width: '80px' }}>SpO2<br/>(%)</th>
                <th style={{ border: '1px solid #000', padding: '8px', width: '80px' }}>Weight<br/>(kg)</th>
                <th style={{ border: '1px solid #000', padding: '8px', width: '80px' }}>Height<br/>(cm)</th>
                <th style={{ border: '1px solid #000', padding: '8px', width: '80px' }}>BMI</th>
                <th style={{ border: '1px solid #000', padding: '8px' }}>Remarks</th>
                <th style={{ border: '1px solid #000', padding: '8px', width: '96px' }}>Nurse<br/>Initials</th>
              </tr>
            </thead>
            <tbody>
              {vitalRows.map((num) => (
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
                  <td style={{ border: '1px solid #000', padding: '4px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}></td>
                  <td style={{ border: '1px solid #000', padding: '4px' }}></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Reference Values */}
          <div style={{ marginTop: '16px', backgroundColor: '#f5f5f5', border: '1px solid #333', padding: '12px' }}>
            <h3 style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '8px', margin: '0 0 8px 0' }}>NORMAL REFERENCE VALUES:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: '8px', fontSize: '10px' }}>
              <div>
                <strong>BP:</strong> 120/80 mmHg
              </div>
              <div>
                <strong>Pulse:</strong> 60-100 bpm
              </div>
              <div>
                <strong>Temp:</strong> 97-99°F
              </div>
              <div>
                <strong>RR:</strong> 12-20 br/min
              </div>
              <div>
                <strong>SpO2:</strong> 95-100%
              </div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '10px' }}>
              <strong>BMI:</strong> Underweight &lt;18.5 | Normal 18.5-24.9 | Overweight 25-29.9 | Obese ≥30
            </div>
          </div>

          {/* Instructions */}
          <div style={{ marginTop: '12px', backgroundColor: '#f5f5f5', borderLeft: '4px solid #000', padding: '8px' }}>
            <p style={{ fontSize: '10px', margin: '0' }}><strong>Instructions:</strong> Record vitals at each visit. Use blue/black pen only. Mark abnormal values in RED. Sign with initials after each entry.</p>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '10px', color: '#666' }}>
            <p style={{ margin: '0' }}>Nursing Documentation</p>
          </div>
        </div>
      </div>
    );
  }
);

VitalsChartTemplate.displayName = 'VitalsChartTemplate';

export default VitalsChartTemplate;
