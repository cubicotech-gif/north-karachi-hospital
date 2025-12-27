import React, { forwardRef } from 'react';

interface DischargeSummaryData {
  summaryNumber: string;
  patientName: string;
  age?: number;
  gender?: string;
  mrNumber?: string;
  admissionDate: string;
  dischargeDate: string;
  totalDays: number;
  department?: string;
  consultantName: string;
  diagnosis: string;
  chiefComplaints?: string;
  historyOfPresentIllness?: string;
  pastMedicalHistory?: string;
  physicalExamination?: string;
  investigations?: string;
  treatmentGiven: string;
  conditionAtDischarge: string;
  medications?: string;
  advice?: string;
  followUpDate?: string;
  followUpInstructions?: string;
}

interface DischargeSummaryTemplateProps {
  data: DischargeSummaryData;
}

const DischargeSummaryTemplate = forwardRef<HTMLDivElement, DischargeSummaryTemplateProps>(
  ({ data }, ref) => {
    return (
      <div ref={ref} className="bg-white mx-auto" style={{ maxWidth: '210mm', fontSize: '10px', padding: '8mm', paddingTop: '76mm' }}>
        <style>
          {`
            @media print {
              @page {
                size: A4;
                margin: 0;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print {
                display: none !important;
              }
            }

            .section-title {
              background-color: #007B8A;
              color: white;
              padding: 3px 8px;
              font-weight: bold;
              margin-top: 6px;
              margin-bottom: 4px;
              font-size: 10px;
            }

            .section-content {
              padding: 4px 8px;
              background-color: #f9fafb;
              border-left: 2px solid #007B8A;
              font-size: 9px;
              line-height: 1.4;
            }
          `}
        </style>

        {/* Pre-printed letterhead space - content starts 5 inches from top */}

        {/* Document Title */}
        <div className="text-center mb-3">
          <h2 className="text-lg font-bold text-gray-800">DISCHARGE SUMMARY</h2>
          <p className="text-xs text-gray-600">Summary No: {data.summaryNumber}</p>
        </div>

        {/* Patient Information */}
        <div className="border border-gray-800 p-2 mb-3">
          <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-xs">
            <div>
              <strong>Patient Name:</strong> {data.patientName}
            </div>
            <div>
              <strong>Age/Gender:</strong> {data.age || '__'} years / {data.gender || '__'}
            </div>
            <div>
              <strong>MR Number:</strong> {data.mrNumber || 'N/A'}
            </div>
            <div>
              <strong>Department:</strong> {data.department || 'General'}
            </div>
            <div>
              <strong>Admission Date:</strong> {new Date(data.admissionDate).toLocaleDateString('en-GB')}
            </div>
            <div>
              <strong>Discharge Date:</strong> {new Date(data.dischargeDate).toLocaleDateString('en-GB')}
            </div>
            <div>
              <strong>Total Stay:</strong> {data.totalDays} days
            </div>
            <div>
              <strong>Consultant:</strong> {data.consultantName}
            </div>
          </div>
        </div>

        {/* Final Diagnosis */}
        <div className="section-title">FINAL DIAGNOSIS</div>
        <div className="section-content">
          <p className="font-semibold text-base">{data.diagnosis}</p>
        </div>

        {/* Chief Complaints */}
        {data.chiefComplaints && (
          <>
            <div className="section-title">CHIEF COMPLAINTS</div>
            <div className="section-content">
              <p>{data.chiefComplaints}</p>
            </div>
          </>
        )}

        {/* History of Present Illness */}
        {data.historyOfPresentIllness && (
          <>
            <div className="section-title">HISTORY OF PRESENT ILLNESS</div>
            <div className="section-content">
              <p className="whitespace-pre-line">{data.historyOfPresentIllness}</p>
            </div>
          </>
        )}

        {/* Past Medical History */}
        {data.pastMedicalHistory && (
          <>
            <div className="section-title">PAST MEDICAL HISTORY</div>
            <div className="section-content">
              <p>{data.pastMedicalHistory}</p>
            </div>
          </>
        )}

        {/* Physical Examination */}
        {data.physicalExamination && (
          <>
            <div className="section-title">PHYSICAL EXAMINATION</div>
            <div className="section-content">
              <p className="whitespace-pre-line">{data.physicalExamination}</p>
            </div>
          </>
        )}

        {/* Investigations */}
        {data.investigations && (
          <>
            <div className="section-title">INVESTIGATIONS</div>
            <div className="section-content">
              <p className="whitespace-pre-line">{data.investigations}</p>
            </div>
          </>
        )}

        {/* Treatment Given */}
        <div className="section-title">TREATMENT GIVEN</div>
        <div className="section-content">
          <p className="whitespace-pre-line">{data.treatmentGiven}</p>
        </div>

        {/* Condition at Discharge */}
        <div className="section-title">CONDITION AT DISCHARGE</div>
        <div className="section-content">
          <p className="font-semibold">{data.conditionAtDischarge}</p>
        </div>

        {/* Medications on Discharge */}
        {data.medications && (
          <>
            <div className="section-title">MEDICATIONS ON DISCHARGE</div>
            <div className="section-content">
              <p className="whitespace-pre-line">{data.medications}</p>
            </div>
          </>
        )}

        {/* Advice */}
        {data.advice && (
          <>
            <div className="section-title">ADVICE & INSTRUCTIONS</div>
            <div className="section-content">
              <p className="whitespace-pre-line">{data.advice}</p>
            </div>
          </>
        )}

        {/* Follow-up */}
        {data.followUpDate && (
          <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded">
            <p className="font-bold text-base mb-2">FOLLOW-UP APPOINTMENT</p>
            <p className="text-sm">
              <strong>Date:</strong>{' '}
              <span className="text-lg font-semibold text-yellow-800">
                {new Date(data.followUpDate).toLocaleDateString('en-GB')}
              </span>
            </p>
            {data.followUpInstructions && (
              <p className="text-sm mt-2">
                <strong>Instructions:</strong> {data.followUpInstructions}
              </p>
            )}
          </div>
        )}

        {/* Doctor Signature */}
        <div className="mt-6 pt-3 border-t border-gray-800">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs mb-1 text-gray-600">Prepared by:</p>
              <div className="h-10 border-b border-gray-400"></div>
              <p className="text-xs mt-1 text-gray-500">Medical Officer</p>
            </div>

            <div className="text-right">
              <p className="text-xs mb-1 text-gray-600">Approved by:</p>
              <div className="h-10 border-b border-gray-600"></div>
              <p className="font-bold text-xs mt-1">{data.consultantName}</p>
              <p className="text-xs text-gray-500">Consultant</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-gray-300 text-xs text-gray-500 text-center">
          <p>Generated: {new Date().toLocaleString('en-GB')} | Keep this document safe</p>
        </div>
      </div>
    );
  }
);

DischargeSummaryTemplate.displayName = 'DischargeSummaryTemplate';

export default DischargeSummaryTemplate;
