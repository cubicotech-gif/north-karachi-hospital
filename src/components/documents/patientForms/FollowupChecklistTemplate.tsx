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
      <div ref={ref} className="bg-white p-8" style={{ width: '210mm', minHeight: '297mm' }}>
        {/* Header */}
        <div className="border-b-2 border-teal-600 pb-3 mb-4">
          <h1 className="text-2xl font-bold text-teal-700">FOLLOW-UP VISIT CHECKLIST</h1>
          {patientData && (
            <div className="flex justify-between text-sm mt-2">
              <p><strong>MR#:</strong> {patientData.mr_number}</p>
              <p><strong>Patient:</strong> {patientData.name}</p>
            </div>
          )}
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-600 p-3 mb-4">
          <p className="text-xs font-semibold">
            Track all scheduled follow-up visits and ensure patient compliance. Mark completed visits with ✓.
            Contact patient if appointment is missed.
          </p>
        </div>

        {/* Follow-up Tracking Table */}
        <table className="w-full border-2 border-gray-800 text-xs mb-4">
          <thead>
            <tr className="bg-teal-100">
              <th className="border border-gray-800 p-2 w-12">#</th>
              <th className="border border-gray-800 p-2 w-24">Date<br/>Scheduled</th>
              <th className="border border-gray-800 p-2 w-20">Time</th>
              <th className="border border-gray-800 p-2 w-28">Doctor</th>
              <th className="border border-gray-800 p-2 flex-1">Purpose of Visit</th>
              <th className="border border-gray-800 p-2 w-24">Date<br/>Completed</th>
              <th className="border border-gray-800 p-2 w-16">Status</th>
              <th className="border border-gray-800 p-2 w-28">Notes</th>
            </tr>
          </thead>
          <tbody>
            {followupEntries.map((num) => (
              <tr key={num} className="h-8">
                <td className="border border-gray-800 p-1 text-center font-semibold">{num}</td>
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

        {/* Status Legend */}
        <div className="mb-4 bg-gray-50 border border-gray-300 p-3">
          <h3 className="font-bold text-xs mb-2">STATUS CODES:</h3>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div><strong>✓</strong> - Completed</div>
            <div><strong>✗</strong> - Cancelled</div>
            <div><strong>R</strong> - Rescheduled</div>
            <div><strong>NP</strong> - No Show (Patient)</div>
            <div><strong>ND</strong> - No Show (Doctor)</div>
            <div><strong>P</strong> - Pending</div>
          </div>
        </div>

        {/* Missed Appointment Tracking */}
        <div className="mb-4 border-2 border-orange-400 p-3">
          <h2 className="text-lg font-bold text-orange-700 mb-3 bg-orange-100 p-2">
            MISSED APPOINTMENTS - PATIENT CONTACT LOG
          </h2>

          {Array.from({ length: 5 }, (_, i) => i + 1).map((num) => (
            <div key={num} className="mb-3 border-b border-orange-200 pb-2">
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <span className="font-semibold">Missed Date:</span>
                  <div className="flex-1 border-b border-gray-400"></div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">Contact Date:</span>
                  <div className="flex-1 border-b border-gray-400"></div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">Method:</span>
                  <div className="flex-1 border-b border-gray-400"></div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">Staff:</span>
                  <div className="flex-1 border-b border-gray-400"></div>
                </div>
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs">
                <span className="font-semibold">Reason / Response:</span>
                <div className="flex-1 border-b border-gray-400"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Important Reminders */}
        <div className="mb-4 border-2 border-purple-400 p-3">
          <h2 className="text-lg font-bold text-purple-700 mb-3 bg-purple-100 p-2">
            FOLLOW-UP CARE REMINDERS
          </h2>

          <div className="space-y-2 text-sm">
            {[
              'Lab work required before next visit',
              'Imaging/X-ray needed',
              'Medication refill needed',
              'Specialist referral pending',
              'Pre-operative clearance required',
              'Vaccination due',
              'Chronic disease monitoring'
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-gray-600"></div>
                <span className="text-xs">{item}</span>
                <div className="flex-1 border-b border-gray-300 ml-2"></div>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <p className="text-xs font-semibold mb-1">Additional Notes:</p>
            <div className="space-y-1">
              {[1, 2].map((line) => (
                <div key={line} className="border-b border-gray-300 h-5"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Appointment Reminder System */}
        <div className="bg-green-50 border border-green-400 p-3">
          <h3 className="font-bold text-xs mb-2">APPOINTMENT REMINDER PROTOCOL:</h3>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 border-2 border-gray-600"></div>
              <span>SMS sent (3 days before)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 border-2 border-gray-600"></div>
              <span>Phone call (1 day before)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 border-2 border-gray-600"></div>
              <span>WhatsApp message sent</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-xs text-gray-500 border-t border-gray-300 pt-2">
          <p>North Karachi Hospital - Patient Follow-up Department</p>
        </div>
      </div>
    );
  }
);

FollowupChecklistTemplate.displayName = 'FollowupChecklistTemplate';

export default FollowupChecklistTemplate;
