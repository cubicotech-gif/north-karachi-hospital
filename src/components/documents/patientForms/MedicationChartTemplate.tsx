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
      <div ref={ref} className="bg-white p-6" style={{ width: '297mm', minHeight: '210mm' }}>
        {/* Header */}
        <div className="border-b-2 border-teal-600 pb-3 mb-4">
          <h1 className="text-2xl font-bold text-teal-700">MEDICATION ADMINISTRATION CHART</h1>
          {patientData && (
            <div className="flex justify-between text-sm mt-2">
              <p><strong>MR#:</strong> {patientData.mr_number}</p>
              <p><strong>Patient:</strong> {patientData.name}</p>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 mb-3">
          <p className="text-xs font-semibold">
            ⚠ Record ALL medications prescribed and administered. Cross-check for drug interactions and allergies before administration.
          </p>
        </div>

        {/* Medication Table */}
        <table className="w-full border-2 border-gray-800 text-xs">
          <thead>
            <tr className="bg-teal-100">
              <th className="border border-gray-800 p-2 w-16">Date<br/>Started</th>
              <th className="border border-gray-800 p-2 w-32">Medication Name<br/>& Strength</th>
              <th className="border border-gray-800 p-2 w-24">Dosage &<br/>Route</th>
              <th className="border border-gray-800 p-2 w-20">Frequency</th>
              <th className="border border-gray-800 p-2 w-20">Duration</th>
              <th className="border border-gray-800 p-2 w-28">Prescribed By<br/>(Doctor)</th>
              <th className="border border-gray-800 p-2 flex-1">Indication /<br/>Purpose</th>
              <th className="border border-gray-800 p-2 w-16">Date<br/>Stopped</th>
              <th className="border border-gray-800 p-2 w-24">Reason for<br/>Discontinuation</th>
            </tr>
          </thead>
          <tbody>
            {medicationRows.map((num) => (
              <tr key={num} className="h-8">
                <td className="border border-gray-800 p-1"></td>
                <td className="border border-gray-800 p-1"></td>
                <td className="border border-gray-800 p-1"></td>
                <td className="border border-gray-800 p-1"></td>
                <td className="border border-gray-800 p-1"></td>
                <td className="border border-gray-800 p-1"></td>
                <td className="border border-gray-800 p-1"></td>
                <td className="border border-gray-800 p-1"></td>
                <td className="border border-gray-800 p-1"></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Legend and Instructions */}
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-300 p-2">
            <h3 className="font-bold text-xs mb-2">ROUTE ABBREVIATIONS:</h3>
            <div className="grid grid-cols-2 gap-x-3 text-xs">
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

          <div className="bg-green-50 border border-green-300 p-2">
            <h3 className="font-bold text-xs mb-2">FREQUENCY ABBREVIATIONS:</h3>
            <div className="grid grid-cols-2 gap-x-3 text-xs">
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

        <div className="mt-2 bg-red-50 border-l-4 border-red-500 p-2">
          <p className="text-xs">
            <strong>CRITICAL:</strong> Always check patient allergies and current medications before prescribing new drugs.
            Mark discontinued medications clearly. Update this chart with every medication change.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-2 text-center text-xs text-gray-500">
          <p>North Karachi Hospital - Pharmacy & Medical Records</p>
        </div>
      </div>
    );
  }
);

MedicationChartTemplate.displayName = 'MedicationChartTemplate';

export default MedicationChartTemplate;
