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
      <div ref={ref} className="bg-white p-8" style={{ width: '210mm', minHeight: '297mm' }}>
        {/* Header */}
        <div className="border-b-2 border-teal-600 pb-3 mb-4">
          <h1 className="text-2xl font-bold text-teal-700">VISIT NOTES</h1>
          {patientData && (
            <div className="flex justify-between text-sm mt-2">
              <p><strong>MR#:</strong> {patientData.mr_number}</p>
              <p><strong>Patient:</strong> {patientData.name}</p>
            </div>
          )}
        </div>

        {/* Visit Note Sections */}
        {visitSections.map((num) => (
          <div key={num} className="mb-6 border-2 border-gray-300 p-3">
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Date:</span>
                <div className="flex-1 border-b border-gray-400"></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Time:</span>
                <div className="flex-1 border-b border-gray-400"></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Token#:</span>
                <div className="flex-1 border-b border-gray-400"></div>
              </div>
            </div>

            <div className="mb-2">
              <p className="text-xs font-semibold mb-1">CHIEF COMPLAINT:</p>
              <div className="border-b border-gray-300 h-6"></div>
            </div>

            <div className="mb-2">
              <p className="text-xs font-semibold mb-1">HISTORY OF PRESENT ILLNESS:</p>
              <div className="space-y-1">
                {[1, 2, 3].map((line) => (
                  <div key={line} className="border-b border-gray-300 h-5"></div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <p className="text-xs font-semibold mb-1">EXAMINATION:</p>
                <div className="space-y-1">
                  {[1, 2].map((line) => (
                    <div key={line} className="border-b border-gray-300 h-5"></div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1">DIAGNOSIS:</p>
                <div className="space-y-1">
                  {[1, 2].map((line) => (
                    <div key={line} className="border-b border-gray-300 h-5"></div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-2">
              <p className="text-xs font-semibold mb-1">TREATMENT / ADVICE:</p>
              <div className="space-y-1">
                {[1, 2].map((line) => (
                  <div key={line} className="border-b border-gray-300 h-5"></div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs font-semibold">Doctor's Signature:</span>
              <div className="flex-1 border-b border-gray-400"></div>
              <span className="text-xs font-semibold">Name:</span>
              <div className="w-40 border-b border-gray-400"></div>
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="mt-4 text-center text-xs text-gray-500 border-t border-gray-300 pt-2">
          <p>North Karachi Hospital - Clinical Documentation</p>
        </div>
      </div>
    );
  }
);

VisitNotesTemplate.displayName = 'VisitNotesTemplate';

export default VisitNotesTemplate;
