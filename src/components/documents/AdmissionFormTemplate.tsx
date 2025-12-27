import React, { forwardRef } from 'react';

interface AdmissionFormData {
  patientName: string;
  age?: number;
  gender?: 'M' | 'F';
  sonDaughterWifeOf?: string;
  address?: string;
  phone?: string;
  cellPhone?: string;
  regNumber?: string;
  department?: string;
  rmo?: string;
  consultant?: string;
  refBy?: string;
  admissionDateTime?: string;
  dischargeDateTime?: string;
  modeOfAdmission?: 'From OPD' | 'Emergency' | 'Refered';
  admissionFor?: string;
  conditionAtDischarge?: 'Improved' | 'Not Improved' | 'L.M.A.A' | 'Transferred' | 'Expired';
}

interface AdmissionFormTemplateProps {
  data: AdmissionFormData;
}

const AdmissionFormTemplate = forwardRef<HTMLDivElement, AdmissionFormTemplateProps>(
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

            .urdu-text {
              font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif;
              font-size: 15px;
              line-height: 2;
            }

            .checkbox {
              width: 20px;
              height: 20px;
              border: 2px solid #333;
              display: inline-block;
              text-align: center;
              line-height: 18px;
              font-weight: bold;
            }

            .field-line {
              border-bottom: 1px solid #666;
              display: inline-block;
              min-width: 150px;
              padding: 0 8px;
            }
          `}
        </style>

        {/* Pre-printed letterhead space - content starts 5 inches from top */}

        {/* Patient Information */}
        <div className="mb-6 space-y-3 text-sm">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold">Name:</span>
            <span className="field-line flex-1">{data.patientName}</span>
            <span className="font-semibold ml-4">age:</span>
            <span className="field-line w-16">{data.age || '__'}</span>
            <span className="font-semibold ml-2">S/D, W/O:</span>
            <span className="field-line flex-1">{data.sonDaughterWifeOf}</span>
            <span className="font-semibold ml-2">Sex:</span>
            <span className="field-line w-12">{data.gender || '_'}</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-semibold">Address:</span>
            <span className="field-line flex-1">{data.address}</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-semibold">Ph:</span>
            <span className="field-line w-40">{data.phone || '___________'}</span>
            <span className="font-semibold ml-4">Cell:</span>
            <span className="field-line flex-1">{data.cellPhone}</span>
            <span className="font-semibold ml-4">Reg #:</span>
            <span className="field-line w-32">{data.regNumber}</span>
            <span className="font-semibold ml-2">Dept:</span>
            <span className="field-line flex-1">{data.department}</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-semibold">R.M.O:</span>
            <span className="field-line w-48">{data.rmo}</span>
            <span className="font-semibold ml-4">Consultant:</span>
            <span className="field-line flex-1">{data.consultant}</span>
            <span className="font-semibold ml-4">Ref by:</span>
            <span className="field-line flex-1">{data.refBy}</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-semibold">Date & Time Of Admission:</span>
            <span className="field-line flex-1">{data.admissionDateTime}</span>
            <span className="font-semibold ml-4">at:</span>
            <span className="field-line w-20">____</span>
            <span className="checkbox mx-1">□</span>
            <span className="text-xs">A.m</span>
            <span className="checkbox mx-1">□</span>
            <span className="text-xs">P.m</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-semibold">Date & Time Of Discharge:</span>
            <span className="field-line flex-1">{data.dischargeDateTime}</span>
            <span className="font-semibold ml-4">at:</span>
            <span className="field-line w-20">____</span>
            <span className="checkbox mx-1">□</span>
            <span className="text-xs">A.m</span>
            <span className="checkbox mx-1">□</span>
            <span className="text-xs">P.m</span>
          </div>
        </div>

        {/* Mode of Admission */}
        <div className="mb-4 flex items-center gap-6 text-sm">
          <span className="font-semibold">Mode Of Admission:</span>
          <div className="flex items-center gap-2">
            <span>From OPD</span>
            <span className="checkbox">{data.modeOfAdmission === 'From OPD' ? '✓' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Emergency</span>
            <span className="checkbox">{data.modeOfAdmission === 'Emergency' ? '✓' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Refered</span>
            <span className="checkbox">{data.modeOfAdmission === 'Refered' ? '✓' : ''}</span>
          </div>
          <span className="font-semibold ml-4">Admission for:</span>
          <span className="field-line flex-1">{data.admissionFor}</span>
        </div>

        {/* Condition at Discharge */}
        <div className="mb-6 flex items-center gap-6 text-sm">
          <span className="font-semibold">Cond. of Disch:</span>
          <div className="flex items-center gap-2">
            <span>Improved</span>
            <span className="checkbox">{data.conditionAtDischarge === 'Improved' ? '✓' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Not Improved</span>
            <span className="checkbox">{data.conditionAtDischarge === 'Not Improved' ? '✓' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>L.M.A.A</span>
            <span className="checkbox">{data.conditionAtDischarge === 'L.M.A.A' ? '✓' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Transferred</span>
            <span className="checkbox">{data.conditionAtDischarge === 'Transferred' ? '✓' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Expired</span>
            <span className="checkbox">{data.conditionAtDischarge === 'Expired' ? '✓' : ''}</span>
          </div>
        </div>

        {/* Consent Section in Urdu */}
        <div className="border-2 border-gray-400 rounded-lg p-4 mb-6">
          <h3 className="text-center font-bold text-lg mb-3 urdu-text" dir="rtl">
            اجازت نامہ برائے علاج / پروسیجر / ڈیلیوری / بیہوشی / آپریشن
          </h3>

          <div className="mb-4 space-y-2">
            <div className="flex items-baseline gap-2" dir="rtl">
              <span className="urdu-text">نام کی اسات (مریض کا نام)</span>
              <span className="field-line flex-1 text-center">{data.patientName}</span>
              <span className="urdu-text">الحم</span>
              <span className="field-line flex-1"></span>
            </div>
            <div className="flex items-baseline gap-2" dir="rtl">
              <span className="urdu-text">نام کی رپورٹ</span>
              <span className="field-line flex-1 text-center">{data.consultant}</span>
              <span className="urdu-text">ولدا ادوزوجہ</span>
              <span className="field-line flex-1 text-center">{data.sonDaughterWifeOf}</span>
            </div>
          </div>

          <div className="urdu-text leading-loose space-y-3" dir="rtl">
            <p>
              یا تو اعمال یا علاج ہونے دی واری اہتمام انہار کرتا ہوں / کرتی ہوں کہ مجھے میرے مرض اور علاج کے
              بارے میں تفصیل سے گفتگو ہوئی ہے اور میں اس بات کی اجازت دیتا ہوں / دیتی ہوں۔
            </p>

            <p>
              دوران علاج اگر ڈاکٹر صاحب کو کوئی اور ضروری اقدامات کرنے کی ضرورت ہو تو میں ان کے فیصلہ پر مکمل
              اعتماد رکھتا ہوں / رکھتی ہوں اور میں اس بات کی اجازت دیتا ہوں / دیتی ہوں۔
            </p>

            <p>
              ڈیپ ہوں کے دوران علاج نتیجہ خوندوادیر دو بندواپس دیں اور میں نے ان سے وابستہ خطرات اور پیچیدگیوں کی
              صورت میں داخت راہ خطرات اور محدودی کی صورت میں قبول کرتی ہوں۔
            </p>

            <p>
              مریخ پے پر ےب دوم دے شخلمہے دوخے پو ثت ککروٹیجی حبلی نمای کوٹاکی فیمرمواقف وجیوڑی کی صورت میں پریشی کوئی
              دوسرے سے چھال نہیں جاسکتا ہے۔ ہسپتال پے عہود لے سے فائدہ یا بابت اعادہ کر لائی جائے۔
            </p>
          </div>
        </div>

        {/* Signature Section */}
        <div className="mt-8 grid grid-cols-2 gap-8">
          <div>
            <div className="h-16 border-b-2 border-gray-600"></div>
            <p className="text-center mt-2 font-semibold text-sm">
              Patient Signature / مریض کے دستخط
            </p>
          </div>

          <div>
            <div className="h-16 border-b-2 border-gray-600"></div>
            <p className="text-center mt-2 font-semibold text-sm">
              Guardian/Attendant Signature / دختا انسان اُنگشا (مریض)
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-xs text-gray-500 text-center">
          <p>Form Generated: {new Date().toLocaleString('en-GB')}</p>
        </div>
      </div>
    );
  }
);

AdmissionFormTemplate.displayName = 'AdmissionFormTemplate';

export default AdmissionFormTemplate;
