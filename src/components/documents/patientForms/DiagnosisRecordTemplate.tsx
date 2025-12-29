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
      <div ref={ref} className="bg-white p-8" style={{ width: '210mm', minHeight: '297mm' }}>
        {/* Header */}
        <div className="border-b-2 border-teal-600 pb-3 mb-4">
          <h1 className="text-2xl font-bold text-teal-700">DIAGNOSIS RECORD SHEET</h1>
          {patientData && (
            <div className="flex justify-between text-sm mt-2">
              <p><strong>MR#:</strong> {patientData.mr_number}</p>
              <p><strong>Patient:</strong> {patientData.name}</p>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-600 p-3 mb-4">
          <p className="text-xs font-semibold">
            Record all diagnoses chronologically. Include ICD-10 codes when available.
            Mark chronic/ongoing conditions with ★
          </p>
        </div>

        {/* Diagnosis Entries */}
        <div className="space-y-3">
          {diagnosisEntries.map((num) => (
            <div key={num} className="border-2 border-gray-300 p-3">
              <div className="grid grid-cols-4 gap-3 mb-2">
                <div className="col-span-2 flex items-center gap-2">
                  <span className="text-xs font-semibold">Date:</span>
                  <div className="flex-1 border-b border-gray-400"></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">Token#:</span>
                  <div className="flex-1 border-b border-gray-400"></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">Doctor:</span>
                  <div className="flex-1 border-b border-gray-400"></div>
                </div>
              </div>

              <div className="mb-2">
                <p className="text-xs font-semibold mb-1">PRIMARY DIAGNOSIS:</p>
                <div className="border-b border-gray-300 h-6"></div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-2">
                <div>
                  <p className="text-xs font-semibold mb-1">ICD-10 CODE:</p>
                  <div className="border-b border-gray-300 h-5"></div>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1">STATUS:</p>
                  <div className="flex gap-4 text-xs">
                    <label className="flex items-center gap-1">
                      <div className="w-4 h-4 border-2 border-gray-400"></div>
                      Acute
                    </label>
                    <label className="flex items-center gap-1">
                      <div className="w-4 h-4 border-2 border-gray-400"></div>
                      Chronic
                    </label>
                    <label className="flex items-center gap-1">
                      <div className="w-4 h-4 border-2 border-gray-400"></div>
                      Resolved
                    </label>
                  </div>
                </div>
              </div>

              <div className="mb-2">
                <p className="text-xs font-semibold mb-1">SECONDARY DIAGNOSIS / COMPLICATIONS:</p>
                <div className="border-b border-gray-300 h-5"></div>
              </div>

              <div className="mb-2">
                <p className="text-xs font-semibold mb-1">NOTES / INVESTIGATIONS ORDERED:</p>
                <div className="border-b border-gray-300 h-5"></div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-semibold">Doctor's Signature:</span>
                <div className="flex-1 border-b border-gray-400"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-xs text-gray-500 border-t border-gray-300 pt-2">
          <p>North Karachi Hospital - Medical Records Department</p>
        </div>
      </div>
    );
  }
);

DiagnosisRecordTemplate.displayName = 'DiagnosisRecordTemplate';

export default DiagnosisRecordTemplate;
