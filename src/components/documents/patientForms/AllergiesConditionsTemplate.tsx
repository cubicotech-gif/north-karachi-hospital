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
      <div ref={ref} className="bg-white p-8" style={{ width: '210mm', minHeight: '297mm' }}>
        {/* Header with ALERT styling */}
        <div className="border-4 border-red-600 bg-red-50 p-4 mb-4">
          <h1 className="text-3xl font-bold text-red-700 text-center">⚠ ALLERGIES & CHRONIC CONDITIONS ⚠</h1>
          {patientData && (
            <div className="flex justify-between text-sm mt-3 font-bold">
              <p>MR#: {patientData.mr_number}</p>
              <p>Patient: {patientData.name}</p>
              <p>Blood Group: {patientData.blood_group || '______'}</p>
            </div>
          )}
        </div>

        <div className="bg-red-100 border-l-4 border-red-600 p-3 mb-6">
          <p className="text-sm font-bold text-red-800">
            CRITICAL: This form MUST be checked before prescribing any medication or treatment.
            All allergies must be written in RED INK. Place RED ALLERGY STICKER on file cover.
          </p>
        </div>

        {/* DRUG ALLERGIES Section */}
        <div className="mb-6 border-4 border-red-400 p-4">
          <h2 className="text-xl font-bold text-red-700 mb-3 bg-red-100 p-2">
            🚨 DRUG ALLERGIES (Write in RED)
          </h2>

          <div className="space-y-3">
            {Array.from({ length: 8 }, (_, i) => i + 1).map((num) => (
              <div key={num} className="grid grid-cols-3 gap-3 border-b-2 border-red-200 pb-2">
                <div>
                  <p className="text-xs font-semibold mb-1">Drug Name:</p>
                  <div className="border-b-2 border-red-400 h-6"></div>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1">Reaction:</p>
                  <div className="border-b-2 border-red-400 h-6"></div>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1">Date Identified:</p>
                  <div className="border-b-2 border-red-400 h-6"></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-red-600"></div>
            <span className="text-sm font-bold">NO KNOWN DRUG ALLERGIES (NKDA)</span>
            <div className="flex-1 border-b border-gray-400"></div>
            <span className="text-xs">Verified by:</span>
            <div className="w-32 border-b border-gray-400"></div>
            <span className="text-xs">Date:</span>
            <div className="w-24 border-b border-gray-400"></div>
          </div>
        </div>

        {/* FOOD ALLERGIES Section */}
        <div className="mb-6 border-2 border-orange-400 p-4">
          <h2 className="text-lg font-bold text-orange-700 mb-3 bg-orange-100 p-2">
            FOOD ALLERGIES
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }, (_, i) => i + 1).map((num) => (
              <div key={num} className="flex items-center gap-2 border-b border-orange-200 pb-2">
                <span className="text-xs font-semibold">Food Item:</span>
                <div className="flex-1 border-b border-orange-400"></div>
                <span className="text-xs">Reaction:</span>
                <div className="w-24 border-b border-orange-400"></div>
              </div>
            ))}
          </div>
        </div>

        {/* CHRONIC CONDITIONS Section */}
        <div className="mb-6 border-2 border-blue-400 p-4">
          <h2 className="text-lg font-bold text-blue-700 mb-3 bg-blue-100 p-2">
            CHRONIC CONDITIONS & ONGOING ILLNESSES
          </h2>

          <div className="space-y-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
              <div key={num} className="grid grid-cols-4 gap-3 border-b border-blue-200 pb-1">
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{num}. Condition:</span>
                    <div className="flex-1 border-b border-blue-400"></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">Since:</span>
                    <div className="flex-1 border-b border-blue-400"></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">Status:</span>
                    <div className="flex-1 border-b border-blue-400"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div className="bg-blue-50 p-2 border border-blue-300">
              <strong>Common Chronic Conditions:</strong> Diabetes, Hypertension, Asthma, COPD, Heart Disease,
              Kidney Disease, Liver Disease, Epilepsy, Thyroid Disorders, Arthritis, Cancer
            </div>
            <div className="bg-green-50 p-2 border border-green-300">
              <strong>Status Indicators:</strong> Active, Controlled, Uncontrolled, In Remission, Resolved
            </div>
          </div>
        </div>

        {/* OTHER ALERTS Section */}
        <div className="mb-4 border-2 border-purple-400 p-4">
          <h2 className="text-lg font-bold text-purple-700 mb-3 bg-purple-100 p-2">
            OTHER MEDICAL ALERTS
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 border-2 border-gray-600"></div>
                <strong>Pregnancy / Breastfeeding</strong>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 border-2 border-gray-600"></div>
                <strong>Pacemaker / Implants</strong>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 border-2 border-gray-600"></div>
                <strong>Blood Transfusion Restrictions</strong>
              </label>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 border-2 border-gray-600"></div>
                <strong>Latex Allergy</strong>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 border-2 border-gray-600"></div>
                <strong>Organ Donor</strong>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 border-2 border-gray-600"></div>
                <strong>DNR (Do Not Resuscitate)</strong>
              </label>
            </div>
          </div>

          <div className="mt-3">
            <p className="text-xs font-semibold mb-1">Additional Notes / Special Precautions:</p>
            <div className="space-y-1">
              {[1, 2, 3].map((line) => (
                <div key={line} className="border-b border-gray-300 h-5"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Signature Section */}
        <div className="border-t-2 border-gray-400 pt-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs mb-2">Completed by (Doctor/Nurse):</p>
              <div className="flex items-center gap-2">
                <span className="text-xs">Name:</span>
                <div className="flex-1 border-b border-gray-600"></div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs">Signature:</span>
                <div className="flex-1 border-b border-gray-600"></div>
              </div>
            </div>
            <div>
              <p className="text-xs mb-2">Last Updated:</p>
              <div className="flex items-center gap-2">
                <span className="text-xs">Date:</span>
                <div className="flex-1 border-b border-gray-600"></div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs">Time:</span>
                <div className="flex-1 border-b border-gray-600"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-xs text-gray-500 border-t border-gray-300 pt-2">
          <p className="font-bold text-red-600">⚠ CRITICAL DOCUMENT - Keep at FRONT of patient file ⚠</p>
          <p>North Karachi Hospital - Patient Safety Department</p>
        </div>
      </div>
    );
  }
);

AllergiesConditionsTemplate.displayName = 'AllergiesConditionsTemplate';

export default AllergiesConditionsTemplate;
