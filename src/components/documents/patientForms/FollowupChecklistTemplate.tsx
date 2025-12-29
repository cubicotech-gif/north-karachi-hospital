import React, { forwardRef } from 'react';

interface FollowupChecklistTemplateProps {
  patientData?: {
    mr_number: string;
    name: string;
  };
}

const FollowupChecklistTemplate = forwardRef<HTMLDivElement, FollowupChecklistTemplateProps>(
  ({ patientData }, ref) => {
    // Generate 15 follow-up entry rows
    const followupEntries = Array.from({ length: 15 }, (_, i) => i + 1);

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
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#000', margin: '0' }}>FOLLOW-UP VISIT CHECKLIST</h1>
            {patientData && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '8px' }}>
                <p style={{ margin: '0' }}><strong>MR#:</strong> {patientData.mr_number}</p>
                <p style={{ margin: '0' }}><strong>Patient:</strong> {patientData.name}</p>
              </div>
            )}
          </div>

          <div style={{ backgroundColor: '#f5f5f5', borderLeft: '4px solid #000', padding: '12px', marginBottom: '16px' }}>
            <p style={{ fontSize: '10px', fontWeight: '600', margin: '0' }}>
              Track all scheduled follow-up visits and ensure patient compliance. Mark completed visits with ✓.
              Contact patient if appointment is missed.
            </p>
          </div>

          {/* Follow-up Tracking Table */}
          <table style={{ width: '100%', border: '2px solid #000', fontSize: '10px', borderCollapse: 'collapse', marginBottom: '16px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ border: '1px solid #000', padding: '8px', width: '48px' }}>#</th>
                <th style={{ border: '1px solid #000', padding: '8px', width: '96px' }}>Date<br/>Scheduled</th>
                <th style={{ border: '1px solid #000', padding: '8px', width: '80px' }}>Time</th>
                <th style={{ border: '1px solid #000', padding: '8px', width: '112px' }}>Doctor</th>
                <th style={{ border: '1px solid #000', padding: '8px' }}>Purpose of Visit</th>
                <th style={{ border: '1px solid #000', padding: '8px', width: '96px' }}>Date<br/>Completed</th>
                <th style={{ border: '1px solid #000', padding: '8px', width: '64px' }}>Status</th>
                <th style={{ border: '1px solid #000', padding: '8px', width: '112px' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {followupEntries.map((num) => (
                <tr key={num} style={{ height: '32px' }}>
                  <td style={{ border: '1px solid #000', padding: '4px', textAlign: 'center', fontWeight: '600' }}>{num}</td>
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

          {/* Status Legend */}
          <div style={{ marginBottom: '16px', backgroundColor: '#f5f5f5', border: '1px solid #333', padding: '12px' }}>
            <h3 style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '8px', margin: '0 0 8px 0' }}>STATUS CODES:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '10px' }}>
              <div><strong>✓</strong> - Completed</div>
              <div><strong>✗</strong> - Cancelled</div>
              <div><strong>R</strong> - Rescheduled</div>
              <div><strong>NP</strong> - No Show (Patient)</div>
              <div><strong>ND</strong> - No Show (Doctor)</div>
              <div><strong>P</strong> - Pending</div>
            </div>
          </div>

          {/* Missed Appointment Tracking */}
          <div style={{ marginBottom: '16px', border: '2px solid #333', padding: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', marginBottom: '12px', backgroundColor: '#f5f5f5', padding: '8px', margin: '0 0 12px 0' }}>
              MISSED APPOINTMENTS - PATIENT CONTACT LOG
            </h2>

            {Array.from({ length: 5 }, (_, i) => i + 1).map((num) => (
              <div key={num} style={{ marginBottom: '12px', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', fontSize: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: '600' }}>Missed Date:</span>
                    <div style={{ flex: '1', borderBottom: '1px solid #666' }}></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: '600' }}>Contact Date:</span>
                    <div style={{ flex: '1', borderBottom: '1px solid #666' }}></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: '600' }}>Method:</span>
                    <div style={{ flex: '1', borderBottom: '1px solid #666' }}></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: '600' }}>Staff:</span>
                    <div style={{ flex: '1', borderBottom: '1px solid #666' }}></div>
                  </div>
                </div>
                <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
                  <span style={{ fontWeight: '600' }}>Reason / Response:</span>
                  <div style={{ flex: '1', borderBottom: '1px solid #666' }}></div>
                </div>
              </div>
            ))}
          </div>

          {/* Important Reminders */}
          <div style={{ marginBottom: '16px', border: '2px solid #333', padding: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', marginBottom: '12px', backgroundColor: '#f5f5f5', padding: '8px', margin: '0 0 12px 0' }}>
              FOLLOW-UP CARE REMINDERS
            </h2>

            <div style={{ fontSize: '12px' }}>
              {[
                'Lab work required before next visit',
                'Imaging/X-ray needed',
                'Medication refill needed',
                'Specialist referral pending',
                'Pre-operative clearance required',
                'Vaccination due',
                'Chronic disease monitoring'
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ width: '20px', height: '20px', border: '2px solid #000' }}></div>
                  <span style={{ fontSize: '10px' }}>{item}</span>
                  <div style={{ flex: '1', borderBottom: '1px solid #333', marginLeft: '8px' }}></div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '12px' }}>
              <p style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px', margin: '0 0 4px 0' }}>Additional Notes:</p>
              <div>
                {[1, 2].map((line) => (
                  <div key={line} style={{ borderBottom: '1px solid #333', height: '20px', marginBottom: '4px' }}></div>
                ))}
              </div>
            </div>
          </div>

          {/* Appointment Reminder System */}
          <div style={{ backgroundColor: '#f5f5f5', border: '1px solid #333', padding: '12px' }}>
            <h3 style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '8px', margin: '0 0 8px 0' }}>APPOINTMENT REMINDER PROTOCOL:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '16px', height: '16px', border: '2px solid #000' }}></div>
                <span>SMS sent (3 days before)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '16px', height: '16px', border: '2px solid #000' }}></div>
                <span>Phone call (1 day before)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '16px', height: '16px', border: '2px solid #000' }}></div>
                <span>WhatsApp message sent</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '10px', color: '#666', borderTop: '1px solid #333', paddingTop: '8px' }}>
            <p style={{ margin: '0' }}>Patient Follow-up Department</p>
          </div>
        </div>
      </div>
    );
  }
);

FollowupChecklistTemplate.displayName = 'FollowupChecklistTemplate';

export default FollowupChecklistTemplate;
