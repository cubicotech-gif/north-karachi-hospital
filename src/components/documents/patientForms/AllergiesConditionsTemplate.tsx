import React, { forwardRef } from 'react';

interface AllergiesConditionsTemplateProps {
  patientData?: {
    mr_number: string;
    name: string;
    blood_group?: string;
  };
}

const AllergiesConditionsTemplate = forwardRef<HTMLDivElement, AllergiesConditionsTemplateProps>(
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
          {/* Header with ALERT styling */}
          <div style={{ border: '4px solid #000', backgroundColor: '#f5f5f5', padding: '16px', marginBottom: '16px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#000', textAlign: 'center', margin: '0' }}>⚠ ALLERGIES & CHRONIC CONDITIONS ⚠</h1>
            {patientData && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '12px', fontWeight: 'bold' }}>
                <p style={{ margin: '0' }}>MR#: {patientData.mr_number}</p>
                <p style={{ margin: '0' }}>Patient: {patientData.name}</p>
                <p style={{ margin: '0' }}>Blood Group: {patientData.blood_group || '______'}</p>
              </div>
            )}
          </div>

          <div style={{ backgroundColor: '#f5f5f5', borderLeft: '4px solid #000', padding: '12px', marginBottom: '24px' }}>
            <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#000', margin: '0' }}>
              CRITICAL: This form MUST be checked before prescribing any medication or treatment.
              All allergies must be written in RED INK. Place RED ALLERGY STICKER on file cover.
            </p>
          </div>

          {/* DRUG ALLERGIES Section */}
          <div style={{ marginBottom: '24px', border: '4px solid #000', padding: '16px' }} className="avoid-break">
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#000', marginBottom: '12px', backgroundColor: '#f5f5f5', padding: '8px', margin: '0 0 12px 0' }}>
              🚨 DRUG ALLERGIES (Write in RED)
            </h2>

            <div>
              {Array.from({ length: 8 }, (_, i) => i + 1).map((num) => (
                <div key={num} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', borderBottom: '2px solid #333', paddingBottom: '8px', marginBottom: '12px' }}>
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px', margin: '0 0 4px 0' }}>Drug Name:</p>
                    <div style={{ borderBottom: '2px solid #000', height: '24px' }}></div>
                  </div>
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px', margin: '0 0 4px 0' }}>Reaction:</p>
                    <div style={{ borderBottom: '2px solid #000', height: '24px' }}></div>
                  </div>
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px', margin: '0 0 4px 0' }}>Date Identified:</p>
                    <div style={{ borderBottom: '2px solid #000', height: '24px' }}></div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '24px', height: '24px', border: '2px solid #000' }}></div>
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>NO KNOWN DRUG ALLERGIES (NKDA)</span>
              <div style={{ flex: '1', borderBottom: '1px solid #666' }}></div>
              <span style={{ fontSize: '10px' }}>Verified by:</span>
              <div style={{ width: '128px', borderBottom: '1px solid #666' }}></div>
              <span style={{ fontSize: '10px' }}>Date:</span>
              <div style={{ width: '96px', borderBottom: '1px solid #666' }}></div>
            </div>
          </div>

          {/* FOOD ALLERGIES Section */}
          <div style={{ marginBottom: '24px', border: '2px solid #333', padding: '16px' }} className="avoid-break">
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', marginBottom: '12px', backgroundColor: '#f5f5f5', padding: '8px', margin: '0 0 12px 0' }}>
              FOOD ALLERGIES
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {Array.from({ length: 6 }, (_, i) => i + 1).map((num) => (
                <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '600' }}>Food Item:</span>
                  <div style={{ flex: '1', borderBottom: '1px solid #666' }}></div>
                  <span style={{ fontSize: '10px' }}>Reaction:</span>
                  <div style={{ width: '96px', borderBottom: '1px solid #666' }}></div>
                </div>
              ))}
            </div>
          </div>

          {/* CHRONIC CONDITIONS Section */}
          <div style={{ marginBottom: '24px', border: '2px solid #333', padding: '16px' }} className="avoid-break">
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', marginBottom: '12px', backgroundColor: '#f5f5f5', padding: '8px', margin: '0 0 12px 0' }}>
              CHRONIC CONDITIONS & ONGOING ILLNESSES
            </h2>

            <div>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                <div key={num} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', borderBottom: '1px solid #333', paddingBottom: '4px', marginBottom: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '600' }}>{num}. Condition:</span>
                      <div style={{ flex: '1', borderBottom: '1px solid #666' }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px' }}>Since:</span>
                      <div style={{ flex: '1', borderBottom: '1px solid #666' }}></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px' }}>Status:</span>
                      <div style={{ flex: '1', borderBottom: '1px solid #666' }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '10px' }}>
              <div style={{ backgroundColor: '#f5f5f5', padding: '8px', border: '1px solid #333' }}>
                <strong>Common Chronic Conditions:</strong> Diabetes, Hypertension, Asthma, COPD, Heart Disease,
                Kidney Disease, Liver Disease, Epilepsy, Thyroid Disorders, Arthritis, Cancer
              </div>
              <div style={{ backgroundColor: '#f5f5f5', padding: '8px', border: '1px solid #333' }}>
                <strong>Status Indicators:</strong> Active, Controlled, Uncontrolled, In Remission, Resolved
              </div>
            </div>
          </div>

          {/* OTHER ALERTS Section */}
          <div style={{ marginBottom: '16px', border: '2px solid #333', padding: '16px' }} className="avoid-break">
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', marginBottom: '12px', backgroundColor: '#f5f5f5', padding: '8px', margin: '0 0 12px 0' }}>
              OTHER MEDICAL ALERTS
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '8px' }}>
                  <div style={{ width: '20px', height: '20px', border: '2px solid #000' }}></div>
                  <strong>Pregnancy / Breastfeeding</strong>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '8px' }}>
                  <div style={{ width: '20px', height: '20px', border: '2px solid #000' }}></div>
                  <strong>Pacemaker / Implants</strong>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <div style={{ width: '20px', height: '20px', border: '2px solid #000' }}></div>
                  <strong>Blood Transfusion Restrictions</strong>
                </label>
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '8px' }}>
                  <div style={{ width: '20px', height: '20px', border: '2px solid #000' }}></div>
                  <strong>Latex Allergy</strong>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', marginBottom: '8px' }}>
                  <div style={{ width: '20px', height: '20px', border: '2px solid #000' }}></div>
                  <strong>Organ Donor</strong>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <div style={{ width: '20px', height: '20px', border: '2px solid #000' }}></div>
                  <strong>DNR (Do Not Resuscitate)</strong>
                </label>
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              <p style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px', margin: '0 0 4px 0' }}>Additional Notes / Special Precautions:</p>
              <div>
                {[1, 2, 3].map((line) => (
                  <div key={line} style={{ borderBottom: '1px solid #333', height: '20px', marginBottom: '4px' }}></div>
                ))}
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div style={{ borderTop: '2px solid #666', paddingTop: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '10px', marginBottom: '8px', margin: '0 0 8px 0' }}>Completed by (Doctor/Nurse):</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px' }}>Name:</span>
                  <div style={{ flex: '1', borderBottom: '1px solid #000' }}></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <span style={{ fontSize: '10px' }}>Signature:</span>
                  <div style={{ flex: '1', borderBottom: '1px solid #000' }}></div>
                </div>
              </div>
              <div>
                <p style={{ fontSize: '10px', marginBottom: '8px', margin: '0 0 8px 0' }}>Last Updated:</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px' }}>Date:</span>
                  <div style={{ flex: '1', borderBottom: '1px solid #000' }}></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <span style={{ fontSize: '10px' }}>Time:</span>
                  <div style={{ flex: '1', borderBottom: '1px solid #000' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '10px', color: '#666', borderTop: '1px solid #333', paddingTop: '8px' }}>
            <p style={{ fontWeight: 'bold', color: '#000', margin: '0 0 4px 0' }}>⚠ CRITICAL DOCUMENT - Keep at FRONT of patient file ⚠</p>
            <p style={{ margin: '0' }}>Patient Safety Department</p>
          </div>
        </div>
      </div>
    );
  }
);

AllergiesConditionsTemplate.displayName = 'AllergiesConditionsTemplate';

export default AllergiesConditionsTemplate;
