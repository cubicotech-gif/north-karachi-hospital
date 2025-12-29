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
      <div ref={ref} className="bg-white p-6" style={{ width: '210mm', minHeight: '297mm' }}>
        {prescriptionForms.map((formNum) => (
          <div key={formNum} className="mb-6 border-2 border-teal-600 p-4" style={{ pageBreakInside: 'avoid' }}>
            {/* Prescription Header */}
            <div className="border-b-2 border-teal-600 pb-2 mb-3">
              <h1 className="text-2xl font-bold text-teal-700">NORTH KARACHI HOSPITAL</h1>
              <p className="text-xs text-gray-600">Prescription Form</p>
            </div>

            {/* Patient Info */}
            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold">MR#:</span>
                {patientData ? (
                  <span>{patientData.mr_number}</span>
                ) : (
                  <div className="flex-1 border-b border-gray-600"></div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Date:</span>
                <div className="flex-1 border-b border-gray-600"></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Patient Name:</span>
                {patientData ? (
                  <span>{patientData.name}</span>
                ) : (
                  <div className="flex-1 border-b border-gray-600"></div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Age/Gender:</span>
                {patientData ? (
                  <span>{patientData.age} / {patientData.gender}</span>
                ) : (
                  <div className="flex-1 border-b border-gray-600"></div>
                )}
              </div>
            </div>

            {/* Rx Symbol */}
            <div className="mb-2">
              <p className="text-4xl font-serif italic text-blue-700">℞</p>
            </div>

            {/* Prescription Lines */}
            <div className="mb-3 min-h-[120px]">
              <div className="space-y-2">
                {Array.from({ length: 8 }, (_, i) => i + 1).map((line) => (
                  <div key={line} className="flex items-start gap-2">
                    <span className="text-xs text-gray-500 w-4">{line}.</span>
                    <div className="flex-1 border-b border-gray-400"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-3">
              <div className="flex items-center gap-2 text-sm mb-1">
                <span className="font-semibold">Special Instructions:</span>
                <div className="flex-1 border-b border-gray-400"></div>
              </div>
              <div className="border-b border-gray-400 h-5"></div>
            </div>

            {/* Follow-up */}
            <div className="mb-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="font-semibold">Follow-up:</span>
                <label className="flex items-center gap-1">
                  <div className="w-4 h-4 border-2 border-gray-600"></div>
                  <span className="text-xs">Not required</span>
                </label>
                <label className="flex items-center gap-1">
                  <div className="w-4 h-4 border-2 border-gray-600"></div>
                  <span className="text-xs">After</span>
                </label>
                <div className="w-16 border-b border-gray-600"></div>
                <span className="text-xs">days/weeks</span>
              </div>
            </div>

            {/* Doctor Info */}
            <div className="border-t border-gray-400 pt-3 mt-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">Doctor's Name:</span>
                    <div className="flex-1 border-b border-gray-600"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Qualification:</span>
                    <div className="flex-1 border-b border-gray-600"></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">PMDC Reg#:</span>
                    <div className="flex-1 border-b border-gray-600"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Signature:</span>
                    <div className="flex-1 border-b border-gray-600"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-2 text-center text-xs text-gray-500">
              <p>Contact: [Hospital Phone] | Emergency: [Emergency Line]</p>
            </div>

            {/* Copy Indicator */}
            <div className="absolute top-2 right-2 text-xs text-gray-400">
              {formNum === 1 && '(Original - Patient Copy)'}
              {formNum === 2 && '(Duplicate - File Copy)'}
              {formNum > 2 && '(Additional Copy)'}
            </div>
          </div>
        ))}
      </div>
    );
  }
);

PrescriptionPadTemplate.displayName = 'PrescriptionPadTemplate';

export default PrescriptionPadTemplate;
