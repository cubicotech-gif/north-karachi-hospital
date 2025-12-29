import React, { forwardRef } from 'react';

interface FileCoverSheetProps {
  patientData: {
    mr_number: string;
    name: string;
    age: number;
    gender: string;
    contact: string;
    cnic_number?: string;
    blood_group?: string;
    address?: string;
    emergency_contact?: string;
    created_at: string;
  };
}

const FileCoverSheet = forwardRef<HTMLDivElement, FileCoverSheetProps>(
  ({ patientData }, ref) => {
    return (
      <div ref={ref} className="bg-white p-8" style={{ width: '210mm', minHeight: '297mm' }}>
        {/* Header */}
        <div className="border-4 border-teal-600 p-6 mb-6">
          <h1 className="text-3xl font-bold text-center text-teal-700 mb-2">
            NORTH KARACHI HOSPITAL
          </h1>
          <p className="text-center text-gray-600 text-sm">
            Complete Medical Record File
          </p>
        </div>

        {/* MR Number - Large and prominent */}
        <div className="bg-teal-50 border-2 border-teal-600 p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">Medical Record Number</p>
          <p className="text-4xl font-bold text-teal-700">{patientData.mr_number}</p>
        </div>

        {/* Patient Information */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-teal-700 mb-4 border-b-2 border-teal-600 pb-2">
            PATIENT INFORMATION
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="border-b border-gray-300 pb-2">
              <p className="text-xs text-gray-500">Full Name</p>
              <p className="text-lg font-semibold">{patientData.name}</p>
            </div>

            <div className="border-b border-gray-300 pb-2">
              <p className="text-xs text-gray-500">Age / Gender</p>
              <p className="text-lg font-semibold">{patientData.age} years / {patientData.gender}</p>
            </div>

            <div className="border-b border-gray-300 pb-2">
              <p className="text-xs text-gray-500">Contact Number</p>
              <p className="text-lg font-semibold">{patientData.contact}</p>
            </div>

            <div className="border-b border-gray-300 pb-2">
              <p className="text-xs text-gray-500">CNIC Number</p>
              <p className="text-lg font-semibold">{patientData.cnic_number || 'N/A'}</p>
            </div>

            <div className="border-b border-gray-300 pb-2">
              <p className="text-xs text-gray-500">Blood Group</p>
              <p className="text-lg font-semibold">{patientData.blood_group || 'N/A'}</p>
            </div>

            <div className="border-b border-gray-300 pb-2">
              <p className="text-xs text-gray-500">Registration Date</p>
              <p className="text-lg font-semibold">
                {new Date(patientData.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {patientData.address && (
            <div className="border-b border-gray-300 pb-2 mt-4">
              <p className="text-xs text-gray-500">Address</p>
              <p className="text-lg font-semibold">{patientData.address}</p>
            </div>
          )}

          {patientData.emergency_contact && (
            <div className="border-b border-gray-300 pb-2 mt-4">
              <p className="text-xs text-gray-500">Emergency Contact</p>
              <p className="text-lg font-semibold">{patientData.emergency_contact}</p>
            </div>
          )}
        </div>

        {/* File Contents Checklist */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-teal-700 mb-4 border-b-2 border-teal-600 pb-2">
            FILE CONTENTS CHECKLIST
          </h2>

          <div className="grid grid-cols-2 gap-2">
            {[
              'Registration Form',
              'Visit Notes',
              'Vitals Chart',
              'Diagnosis Records',
              'Medication Chart',
              'Allergies & Conditions',
              'Prescriptions',
              'Lab Reports',
              'OPD Receipts',
              'Treatment Records',
              'Admission Records',
              'Discharge Summary',
              'Follow-up Checklists',
              'Imaging Reports',
              'Consent Forms',
              'Other Documents'
            ].map((item) => (
              <div key={item} className="flex items-center border border-gray-300 p-2">
                <div className="w-5 h-5 border-2 border-gray-400 mr-3"></div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <h3 className="font-bold text-sm mb-2">FILE HANDLING INSTRUCTIONS:</h3>
          <ul className="text-xs space-y-1 list-disc list-inside">
            <li>Keep all documents in chronological order (newest on top)</li>
            <li>Staple all receipts and printed documents securely</li>
            <li>Record all visit dates on the Visit Notes section</li>
            <li>Update Medication Chart with each prescription change</li>
            <li>Mark allergies in RED on the Allergies form</li>
            <li>File must be returned to Records Department after each visit</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>North Karachi Hospital - Medical Records Department</p>
          <p>This is a confidential medical record. Handle with care.</p>
        </div>
      </div>
    );
  }
);

FileCoverSheet.displayName = 'FileCoverSheet';

export default FileCoverSheet;
