import React, { forwardRef } from 'react';

interface Medication {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
}

interface PrescriptionData {
  prescriptionNumber: string;
  patientName: string;
  age?: number;
  gender?: string;
  contact?: string;
  date: string;
  doctorName: string;
  doctorSpecialization?: string;
  doctorQualification?: string;
  diagnosis?: string;
  medications: Medication[];
  advice?: string;
  followUpDate?: string;
}

interface PrescriptionTemplateProps {
  data: PrescriptionData;
}

const PrescriptionTemplate = forwardRef<HTMLDivElement, PrescriptionTemplateProps>(
  ({ data }, ref) => {
    return (
      <div ref={ref} className="bg-white max-w-4xl mx-auto" style={{ padding: '8mm', paddingTop: '76mm' }}>
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

            .rx-symbol {
              font-family: Georgia, serif;
              font-size: 48px;
              font-weight: bold;
              color: #007B8A;
            }
          `}
        </style>

        {/* Pre-printed letterhead space - content starts 5 inches from top */}

        {/* Prescription Number and Date */}
        <div className="flex justify-between items-center mb-4 text-sm">
          <div>
            <p><strong>Rx No:</strong> {data.prescriptionNumber}</p>
          </div>
          <div className="text-right">
            <p><strong>Date:</strong> {new Date(data.date).toLocaleDateString('en-GB')}</p>
          </div>
        </div>

        {/* Patient Information */}
        <div className="border-2 border-gray-300 rounded-lg p-4 mb-6 bg-gray-50">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p><strong>Patient Name:</strong> {data.patientName}</p>
            </div>
            <div>
              <p>
                <strong>Age/Gender:</strong> {data.age ? `${data.age} years` : '__'} / {data.gender || '__'}
              </p>
            </div>
            {data.contact && (
              <div className="col-span-2">
                <p><strong>Contact:</strong> {data.contact}</p>
              </div>
            )}
          </div>
        </div>

        {/* Diagnosis */}
        {data.diagnosis && (
          <div className="mb-4">
            <p className="text-sm">
              <strong>Diagnosis:</strong> <span className="text-gray-700">{data.diagnosis}</span>
            </p>
          </div>
        )}

        {/* Prescription Symbol and Medications */}
        <div className="mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="rx-symbol">℞</div>
            <div className="text-xl font-semibold text-gray-700 pt-3">Prescription</div>
          </div>

          <div className="border-l-4 border-blue-500 pl-6 space-y-4">
            {data.medications.map((med, index) => (
              <div key={index} className="pb-3 border-b border-gray-200 last:border-0">
                <p className="font-bold text-lg text-gray-800 mb-1">
                  {index + 1}. {med.name}
                </p>
                <div className="ml-4 space-y-1 text-sm text-gray-700">
                  {med.dosage && (
                    <p>
                      <span className="font-semibold">Dosage:</span> {med.dosage}
                    </p>
                  )}
                  {med.frequency && (
                    <p>
                      <span className="font-semibold">Frequency:</span> {med.frequency}
                    </p>
                  )}
                  {med.duration && (
                    <p>
                      <span className="font-semibold">Duration:</span> {med.duration}
                    </p>
                  )}
                  {med.instructions && (
                    <p className="italic text-gray-600">
                      <span className="font-semibold not-italic">Instructions:</span> {med.instructions}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Advice */}
        {data.advice && (
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="font-semibold text-sm mb-2">Medical Advice:</p>
            <p className="text-sm text-gray-700 whitespace-pre-line">{data.advice}</p>
          </div>
        )}

        {/* Follow-up */}
        {data.followUpDate && (
          <div className="mb-6 p-3 bg-yellow-50 border border-yellow-300 rounded">
            <p className="text-sm">
              <strong>Follow-up Date:</strong>{' '}
              <span className="text-lg font-semibold text-yellow-800">
                {new Date(data.followUpDate).toLocaleDateString('en-GB')}
              </span>
            </p>
          </div>
        )}

        {/* Doctor Information and Signature */}
        <div className="mt-12 pt-6 border-t-2 border-gray-300">
          <div className="flex justify-between items-start">
            <div className="text-sm text-gray-600">
              <p className="italic">This is a computer-generated prescription.</p>
              <p className="mt-1">Please bring this prescription on your next visit.</p>
            </div>

            <div className="text-right">
              <div className="h-16 mb-2"></div>
              <div className="border-t-2 border-gray-600 pt-2 min-w-[250px]">
                <p className="font-bold text-base">{data.doctorName}</p>
                {data.doctorQualification && (
                  <p className="text-sm text-gray-600">{data.doctorQualification}</p>
                )}
                {data.doctorSpecialization && (
                  <p className="text-sm text-gray-600">{data.doctorSpecialization}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
          <p>Generated: {new Date().toLocaleString('en-GB')}</p>
          <p className="mt-1 font-semibold">
            Note: Do not self-medicate. Take medicines only as prescribed by your doctor.
          </p>
        </div>
      </div>
    );
  }
);

PrescriptionTemplate.displayName = 'PrescriptionTemplate';

export default PrescriptionTemplate;
