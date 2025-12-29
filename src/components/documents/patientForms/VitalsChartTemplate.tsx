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
      <div ref={ref} className="bg-white p-6" style={{ width: '297mm', minHeight: '210mm' }}>
        {/* Header */}
        <div className="border-b-2 border-teal-600 pb-3 mb-4">
          <h1 className="text-2xl font-bold text-teal-700">VITALS RECORDING CHART</h1>
          {patientData && (
            <div className="flex justify-between text-sm mt-2">
              <p><strong>MR#:</strong> {patientData.mr_number}</p>
              <p><strong>Patient:</strong> {patientData.name}</p>
            </div>
          )}
        </div>

        {/* Vitals Table */}
        <table className="w-full border-2 border-gray-800 text-xs">
          <thead>
            <tr className="bg-teal-100">
              <th className="border border-gray-800 p-2 w-20">Date</th>
              <th className="border border-gray-800 p-2 w-16">Time</th>
              <th className="border border-gray-800 p-2 w-24">BP<br/>(mmHg)</th>
              <th className="border border-gray-800 p-2 w-20">Pulse<br/>(bpm)</th>
              <th className="border border-gray-800 p-2 w-20">Temp<br/>(°F)</th>
              <th className="border border-gray-800 p-2 w-20">RR<br/>(br/min)</th>
              <th className="border border-gray-800 p-2 w-20">SpO2<br/>(%)</th>
              <th className="border border-gray-800 p-2 w-20">Weight<br/>(kg)</th>
              <th className="border border-gray-800 p-2 w-20">Height<br/>(cm)</th>
              <th className="border border-gray-800 p-2 w-20">BMI</th>
              <th className="border border-gray-800 p-2 flex-1">Remarks</th>
              <th className="border border-gray-800 p-2 w-24">Nurse<br/>Initials</th>
            </tr>
          </thead>
          <tbody>
            {vitalRows.map((num) => (
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
                <td className="border border-gray-800 p-1"></td>
                <td className="border border-gray-800 p-1"></td>
                <td className="border border-gray-800 p-1"></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Reference Values */}
        <div className="mt-4 bg-blue-50 border border-blue-300 p-3">
          <h3 className="font-bold text-xs mb-2">NORMAL REFERENCE VALUES:</h3>
          <div className="grid grid-cols-5 gap-2 text-xs">
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
          <div className="mt-2 text-xs">
            <strong>BMI:</strong> Underweight &lt;18.5 | Normal 18.5-24.9 | Overweight 25-29.9 | Obese ≥30
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-3 bg-yellow-50 border-l-4 border-yellow-400 p-2">
          <p className="text-xs"><strong>Instructions:</strong> Record vitals at each visit. Use blue/black pen only. Mark abnormal values in RED. Sign with initials after each entry.</p>
        </div>

        {/* Footer */}
        <div className="mt-3 text-center text-xs text-gray-500">
          <p>North Karachi Hospital - Nursing Documentation</p>
        </div>
      </div>
    );
  }
);

VitalsChartTemplate.displayName = 'VitalsChartTemplate';

export default VitalsChartTemplate;
