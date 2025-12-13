import React, { forwardRef } from 'react';
import Letterhead from './Letterhead';

interface GeneralConsentFormData {
  patientName: string;
  age?: number;
  gender?: string;
  guardianName?: string;
  treatmentName: string;
  doctorName: string;
  date: string;
  procedureDetails?: string;
  risks?: string;
  alternatives?: string;
}

interface GeneralConsentFormProps {
  data: GeneralConsentFormData;
}

const GeneralConsentForm = forwardRef<HTMLDivElement, GeneralConsentFormProps>(
  ({ data }, ref) => {
    return (
      <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto">
        <style>
          {`
            @media print {
              @page {
                size: A4;
                margin: 15mm;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print {
                display: none !important;
              }
            }

            .urdu-text {
              font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif;
              font-size: 15px;
              line-height: 2;
            }
          `}
        </style>

        {/* Letterhead */}
        <Letterhead showUrdu={false} variant="compact" />

        {/* Form Title */}
        <div className="border-2 border-black p-3 mb-6 rounded">
          <h2 className="text-center text-xl font-bold urdu-text" dir="rtl">
            اجازت نامہ برائے علاج / پروسیجر / ڈیلیوری / بیہوشی / آپریشن
          </h2>
        </div>

        {/* Patient Details */}
        <div className="mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-baseline gap-2" dir="rtl">
              <span className="urdu-text font-semibold">نام کی اسات (مریض کا نام):</span>
              <div className="flex-1 border-b border-dotted border-gray-600">
                <span className="text-base">{data.patientName}</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2" dir="rtl">
              <span className="urdu-text font-semibold">الحم (علاج):</span>
              <div className="flex-1 border-b border-dotted border-gray-600">
                <span className="text-base">{data.treatmentName}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-baseline gap-2" dir="rtl">
              <span className="urdu-text font-semibold">نام کی رپورٹ (علاج):</span>
              <div className="flex-1 border-b border-dotted border-gray-600">
                <span className="text-base">{data.doctorName}</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2" dir="rtl">
              <span className="urdu-text font-semibold">ولدا ادوزوجہ (علاج):</span>
              <div className="flex-1 border-b border-dotted border-gray-600">
                <span className="text-base">{data.guardianName || '_______________'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Consent Text */}
        <div className="border-2 border-gray-300 rounded-lg p-5 mb-6 bg-gray-50">
          <div className="urdu-text leading-loose space-y-4" dir="rtl">
            <p>
              یا تو اعمال یا علاج ہونے دی واری اہتمام انہار کرتا ہوں / کرتی ہوں کہ مجھے میرے مرض اور علاج کے
              بارے میں تفصیل سے گفتگو ہوئی ہے اور میں اس بات کی اجازت دیتا ہوں / دیتی ہوں۔
            </p>

            <p>
              دوران علاج اگر ڈاکٹر صاحب کو کوئی اور ضروری اقدامات کرنے کی ضرورت ہو تو میں ان کے فیصلہ پر مکمل
              اعتماد رکھتا ہوں / رکھتی ہوں اور میں اس بات کی اجازت دیتا ہوں / دیتی ہوں۔
            </p>

            <p>
              ڈیپ ہوں کے دوران علاج نتیجہ رونددواد ہجلوبٹ دیں اور میں نے ان سے وابستہ خطرات اور پیچیدگیوں کی
              صورت میں داخت راہ خطرات نزاع ومحادن ہی صورت میں قبول کری ہوں۔
            </p>

            <p>
              مریخ پے پر ےب دوم دے شخلمہے دوخے پوثت ککروٹیجی حبلی نمای کورٹاکی فیمرمواقف وجیوڑی کی صورت میں پریشی کوئی
              دوسرے سے چھال نہیں جاسکتا ہے۔ ہسپتال پے عہود لے سے فائدہ یا بابت اعادہ کر لائی جائے۔
            </p>
          </div>
        </div>

        {/* Additional Information */}
        {(data.procedureDetails || data.risks || data.alternatives) && (
          <div className="mb-6 space-y-3">
            {data.procedureDetails && (
              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <p className="font-semibold text-sm mb-1">Procedure Details:</p>
                <p className="text-sm text-gray-700">{data.procedureDetails}</p>
              </div>
            )}

            {data.risks && (
              <div className="border-l-4 border-red-500 pl-4 py-2">
                <p className="font-semibold text-sm mb-1">Associated Risks:</p>
                <p className="text-sm text-gray-700">{data.risks}</p>
              </div>
            )}

            {data.alternatives && (
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <p className="font-semibold text-sm mb-1">Alternative Treatments:</p>
                <p className="text-sm text-gray-700">{data.alternatives}</p>
              </div>
            )}
          </div>
        )}

        {/* Signature Section */}
        <div className="mt-12 grid grid-cols-2 gap-8">
          <div>
            <div className="h-20 border-b-2 border-gray-400"></div>
            <p className="text-center mt-2 urdu-text" dir="rtl">
              دستخط ختون انگشہ (مریض)
            </p>
            <p className="text-center text-xs text-gray-500 mt-1">Patient Signature</p>
          </div>

          <div>
            <div className="h-20 border-b-2 border-gray-400"></div>
            <p className="text-center mt-2 urdu-text" dir="rtl">
              دستخط انسان انگشہ (مریض)
            </p>
            <p className="text-center text-xs text-gray-500 mt-1">Guardian/Attendant Signature</p>
          </div>
        </div>

        {/* Date and Doctor */}
        <div className="mt-8 pt-4 border-t border-gray-300">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Date:</strong> {new Date(data.date).toLocaleDateString('en-GB')}</p>
              <p className="urdu-text" dir="rtl">
                <strong>تاریخ:</strong> {new Date(data.date).toLocaleDateString('en-GB')}
              </p>
            </div>
            <div className="text-right">
              <p><strong>Doctor:</strong> {data.doctorName}</p>
              <p className="urdu-text" dir="rtl">
                <strong>ڈاکٹر:</strong> {data.doctorName}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-xs text-gray-500 text-center">
          <p>Form Generated: {new Date().toLocaleString('en-GB')}</p>
        </div>
      </div>
    );
  }
);

GeneralConsentForm.displayName = 'GeneralConsentForm';

export default GeneralConsentForm;
