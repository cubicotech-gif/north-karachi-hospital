import React, { forwardRef } from 'react';

interface TLConsentFormData {
  patientName: string;
  parentName: string;
  age?: number;
  address?: string;
  date: string;
  patientSignature?: string;
  husbandSignature?: string;
  witnessName?: string;
}

interface TLConsentFormProps {
  data: TLConsentFormData;
}

const TLConsentForm = forwardRef<HTMLDivElement, TLConsentFormProps>(
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
              font-size: 16px;
              line-height: 2;
            }
          `}
        </style>

        {/* Pre-printed letterhead space - content starts 5 inches from top */}

        {/* Form Title */}
        <div className="border-2 border-black p-3 mb-6 text-center">
          <h2 className="text-2xl font-bold urdu-text" dir="rtl">
            ٹیوب کی پٹی بندش (T.L) کا اجازت نامہ
          </h2>
        </div>

        {/* Patient & Parent Name */}
        <div className="mb-6 space-y-3">
          <div className="flex items-baseline gap-4" dir="rtl">
            <span className="urdu-text font-semibold">میں نام:</span>
            <div className="flex-1 border-b-2 border-dotted border-gray-600 pb-1">
              <span className="urdu-text text-lg">{data.patientName}</span>
            </div>
            <span className="urdu-text">والد</span>
            <div className="flex-1 border-b-2 border-dotted border-gray-600 pb-1">
              <span className="urdu-text text-lg">{data.parentName}</span>
            </div>
          </div>
        </div>

        {/* Main Consent Text */}
        <div className="mb-8 urdu-text leading-loose" dir="rtl">
          <p className="mb-4">
            بخوشی شوقو رضامندی وحواس باتی بیوی سالمہ{' '}
            <span className="inline-block border-b border-dotted border-gray-600 min-w-[150px] text-center px-2">
              {data.age ? `${data.age} سال` : '___________'}
            </span>{' '}
            کے آئندہ
          </p>

          <p className="mb-4">
            ڈیلوری کی بار عرشن ہونے والے ٹیوب کی پٹی بندش (T.L) کروانے کی اجازت دیتاہوں۔
          </p>

          <div className="border-t-2 border-black pt-4 mt-6">
            <p className="font-semibold mb-2">دستخط شوہر</p>
          </div>
        </div>

        {/* Special Notes Box */}
        <div className="border-2 border-black p-4 mb-6">
          <h3 className="text-center font-bold text-xl mb-4 urdu-text" dir="rtl">
            خصوصی نوٹ
          </h3>

          <div className="urdu-text leading-loose space-y-3" dir="rtl">
            <p>
              میں مریض اور میرا خاوند مندرجہ ذیل بیان پر کاربند ہیں اور دونوں اس کو سمجھ کر خوشی سے قبول کرتے ہیں۔
            </p>

            <p>
              یہ عمل مستقل ہے اور اسے ہر گز ناکام یا واپس نہیں لایا جا سکتا ۔ ہم یہ سمجھتے ہیں کہ اس عمل سے ہمیں مزید اولاد نہیں ہوگی۔
            </p>

            <p>
              ڈاکٹر نے مجھے یہ بتایا ہے کہ یہ عمل ہونے والی چند خطرات ہیں لیکن عموماً یہ محفوظ اور موثر ہوتا ہے۔
            </p>

            <p>
              مریض کی عمر، صحت کی حالت اور خاندانی حالات کو مد نظر رکھتے ہوئے یہ اجازت دی جا رہی ہے۔
            </p>

            <p>
              ڈاکٹر اس طریق کار کو انجام دینے کی پوری کوشش کریں گے لیکن کوئی ضمانت نہیں دی جا سکتی۔
            </p>

            <p>
              میں اس بات سے آگاہ ہوں کہ دوران علاج نتیجہ خوشگوار نہ ہونے کی صورت میں مریض کی صحت میں خرابی ہو سکتی ہے اور اگر علاج ناکام رہا ہے۔
            </p>
          </div>
        </div>

        {/* Signature Section */}
        <div className="mt-12 grid grid-cols-2 gap-8">
          <div>
            <div className="border-t-2 border-black pt-2 mb-1">
              <p className="text-sm urdu-text text-right" dir="rtl">نام اور دستخط:</p>
            </div>
            <div className="h-16"></div>
            <p className="text-center urdu-text" dir="rtl">خاتوناں اُنگشہ (مریض)</p>
          </div>

          <div>
            <div className="border-t-2 border-black pt-2 mb-1">
              <p className="text-sm urdu-text text-right" dir="rtl">نام اور دستخط:</p>
            </div>
            <div className="h-16"></div>
            <p className="text-center urdu-text" dir="rtl">دختا انسان اُنگشا (مریض)</p>
          </div>
        </div>

        {/* Date and Witness */}
        <div className="mt-8 pt-4 border-t border-gray-400">
          <div className="grid grid-cols-2 gap-4">
            <div dir="rtl">
              <p className="urdu-text">
                تاریخ: <span className="font-semibold">{new Date(data.date).toLocaleDateString('en-GB')}</span>
              </p>
            </div>
            <div className="text-right" dir="rtl">
              <p className="urdu-text">
                گواہ: {data.witnessName && <span className="font-semibold">{data.witnessName}</span>}
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

TLConsentForm.displayName = 'TLConsentForm';

export default TLConsentForm;
