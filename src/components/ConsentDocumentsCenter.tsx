import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Printer,
  User,
  FileCheck,
  AlertTriangle,
  Baby,
  ClipboardList
} from 'lucide-react';
import { toast } from 'sonner';

interface Patient {
  id: string;
  name: string;
  phone: string;
  cnic?: string;
  gender: string;
  age: number;
  guardian_name?: string;
  address?: string;
}

interface ConsentDocumentsCenterProps {
  selectedPatient: Patient | null;
}

const ConsentDocumentsCenter = ({ selectedPatient }: ConsentDocumentsCenterProps) => {

  // Common print styles with Nastaleeq font
  const getPrintStyles = () => `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap');

    @page {
      size: A4;
      margin: 15mm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #000;
      background: #fff;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 10mm;
      margin: 0 auto;
      background: white;
    }

    .header {
      text-align: center;
      border-bottom: 3px solid #1a5f2a;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }

    .logo {
      width: 80px;
      height: 80px;
      object-fit: contain;
      margin-bottom: 10px;
    }

    .hospital-name {
      font-size: 28px;
      font-weight: bold;
      color: #1a5f2a;
      margin: 5px 0;
    }

    .hospital-name-urdu {
      font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif;
      font-size: 32px;
      font-weight: bold;
      color: #1a5f2a;
      direction: rtl;
    }

    .hospital-tagline {
      font-size: 12px;
      color: #666;
    }

    .form-title {
      text-align: center;
      margin: 20px 0;
      padding: 10px;
      background: #f0f7f0;
      border: 2px solid #1a5f2a;
      border-radius: 5px;
    }

    .form-title-urdu {
      font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif;
      font-size: 24px;
      font-weight: bold;
      color: #1a5f2a;
      direction: rtl;
    }

    .form-title-english {
      font-size: 16px;
      color: #333;
      margin-top: 5px;
    }

    .urdu-section {
      direction: rtl;
      text-align: right;
      font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif;
      padding: 20px;
      background: #fafafa;
      border: 1px solid #ddd;
      border-radius: 5px;
      margin-bottom: 20px;
      line-height: 2.2;
    }

    .urdu-text {
      font-size: 18px;
      margin-bottom: 15px;
    }

    .urdu-field {
      display: inline-block;
      min-width: 150px;
      border-bottom: 1px solid #333;
      margin: 0 10px;
      padding: 0 5px;
    }

    .english-section {
      padding: 20px;
      background: #f9f9f9;
      border: 1px solid #ddd;
      border-radius: 5px;
      margin-bottom: 20px;
    }

    .english-title {
      font-size: 16px;
      font-weight: bold;
      color: #1a5f2a;
      margin-bottom: 10px;
      border-bottom: 1px solid #1a5f2a;
      padding-bottom: 5px;
    }

    .english-text {
      font-size: 13px;
      line-height: 1.8;
      color: #333;
    }

    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      padding-top: 20px;
    }

    .signature-box {
      width: 45%;
      text-align: center;
    }

    .signature-line {
      border-top: 1px solid #333;
      margin-top: 60px;
      padding-top: 10px;
    }

    .signature-label {
      font-size: 12px;
      color: #666;
    }

    .signature-label-urdu {
      font-family: 'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', serif;
      font-size: 14px;
      direction: rtl;
    }

    .date-field {
      text-align: center;
      margin-top: 30px;
      font-size: 14px;
    }

    .footer {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 2px solid #1a5f2a;
      text-align: center;
      font-size: 11px;
      color: #666;
    }

    .patient-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 20px;
      padding: 15px;
      background: #e8f5e9;
      border-radius: 5px;
      font-size: 13px;
    }

    .patient-info-item {
      display: flex;
      gap: 5px;
    }

    .patient-info-label {
      font-weight: bold;
      color: #1a5f2a;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { margin: 0; }
    }
  `;

  // Get common header HTML
  const getHeaderHTML = () => `
    <div class="header">
      <img src="/logo.png" class="logo" onerror="this.style.display='none'" />
      <div class="hospital-name">NORTH KARACHI HOSPITAL</div>
      <div class="hospital-name-urdu">نارتھ کراچی ہسپتال</div>
      <div class="hospital-tagline">Quality Healthcare for Everyone</div>
    </div>
  `;

  // Get common footer HTML
  const getFooterHTML = () => `
    <div class="footer">
      <p>North Karachi Hospital | نارتھ کراچی ہسپتال</p>
      <p>Address: North Karachi, Sector 5-C, Karachi | Phone: 021-1234567</p>
    </div>
  `;

  // 1. General Treatment Consent Form
  const printTreatmentConsent = () => {
    if (!selectedPatient) {
      toast.error('Please select a patient first');
      return;
    }

    const currentDate = new Date().toLocaleDateString('en-GB');
    const patientName = selectedPatient.name;
    const guardianName = selectedPatient.guardian_name || '_______________';

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Treatment Consent Form - ${patientName}</title>
        <style>${getPrintStyles()}</style>
      </head>
      <body>
        <div class="page">
          ${getHeaderHTML()}

          <div class="form-title">
            <div class="form-title-urdu">اجازت نامہ برائے علاج / پروسیجر / ڈلیوری / بیہوشی / آپریشن</div>
            <div class="form-title-english">Consent Form for Treatment / Procedure / Delivery / Anesthesia / Operation</div>
          </div>

          <div class="patient-info">
            <div class="patient-info-item"><span class="patient-info-label">Patient Name:</span> ${patientName}</div>
            <div class="patient-info-item"><span class="patient-info-label">Date:</span> ${currentDate}</div>
            <div class="patient-info-item"><span class="patient-info-label">Guardian:</span> ${guardianName}</div>
            <div class="patient-info-item"><span class="patient-info-label">Gender/Age:</span> ${selectedPatient.gender} / ${selectedPatient.age} years</div>
          </div>

          <div class="urdu-section">
            <div class="urdu-text">
              <strong>بیان حلفی / اقرار نامہ</strong>
            </div>
            <div class="urdu-text">
              میں مسمی/مسمات <span class="urdu-field">${patientName}</span>
              ولد/زوجہ <span class="urdu-field">${guardianName}</span>
            </div>
            <div class="urdu-text">
              اپنے مریض/مریضہ <span class="urdu-field">${patientName}</span>
              جو کہ میرا/میری <span class="urdu-field">_______________</span> ہے،
              کے علاج / پروسیجر / ڈلیوری / بیہوشی / آپریشن کی اجازت دیتا/دیتی ہوں۔
            </div>
            <div class="urdu-text">
              مجھے ڈاکٹر صاحب/صاحبہ نے علاج کے طریقہ کار، ممکنہ خطرات، اور نتائج کے بارے میں مکمل طور پر آگاہ کر دیا ہے۔
              میں اپنی مرضی سے یہ اجازت نامہ دے رہا/رہی ہوں اور کسی بھی ناگہانی صورتحال کی ذمہ داری ہسپتال انتظامیہ پر نہیں ہوگی۔
            </div>
          </div>

          <div class="english-section">
            <div class="english-title">English Translation</div>
            <div class="english-text">
              <p><strong>Affidavit / Declaration</strong></p>
              <p>I, <strong>${patientName}</strong>, son/daughter/wife of <strong>${guardianName}</strong>,</p>
              <p>hereby give consent for treatment / procedure / delivery / anesthesia / operation of my patient <strong>${patientName}</strong>, who is my _______________.</p>
              <p>The doctor has fully informed me about the treatment procedure, possible risks, and outcomes. I am giving this consent of my own free will and understand that the hospital administration will not be responsible for any unforeseen circumstances.</p>
            </div>
          </div>

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">
                <div class="signature-label-urdu">دستخط مریض / نشان انگوٹھا</div>
                <div class="signature-label">Patient Signature / Thumb Impression</div>
              </div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                <div class="signature-label-urdu">دستخط سرپرست / لواحقین</div>
                <div class="signature-label">Guardian Signature</div>
              </div>
            </div>
          </div>

          <div class="date-field">
            <strong>Date / تاریخ:</strong> ${currentDate}
          </div>

          ${getFooterHTML()}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    }
  };

  // 2. T.L (Tubal Ligation) Consent Form
  const printTLConsent = () => {
    if (!selectedPatient) {
      toast.error('Please select a patient first');
      return;
    }

    const currentDate = new Date().toLocaleDateString('en-GB');
    const patientName = selectedPatient.name;

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>T.L Consent Form - ${patientName}</title>
        <style>${getPrintStyles()}</style>
      </head>
      <body>
        <div class="page">
          ${getHeaderHTML()}

          <div class="form-title">
            <div class="form-title-urdu">بچے کی بندش (T.L) کا اجازت نامہ</div>
            <div class="form-title-english">Consent Form for Tubal Ligation (T.L)</div>
          </div>

          <div class="patient-info">
            <div class="patient-info-item"><span class="patient-info-label">Patient Name:</span> ${patientName}</div>
            <div class="patient-info-item"><span class="patient-info-label">Date:</span> ${currentDate}</div>
            <div class="patient-info-item"><span class="patient-info-label">Gender/Age:</span> ${selectedPatient.gender} / ${selectedPatient.age} years</div>
          </div>

          <div class="urdu-section">
            <div class="urdu-text">
              میں <span class="urdu-field">_______________</span>
              ولد <span class="urdu-field">_______________</span> (شوہر کا نام)
            </div>
            <div class="urdu-text">
              بحیثیت شوہر بمعہ ہوش و حواس اپنی بیوی مسمات <span class="urdu-field">${patientName}</span>
              کے آئندہ ڈلیوری یا آپریشن کے دوران بچے کی بندش (T.L) کا پروسیجر کروانے کی اجازت دیتا ہوں۔
            </div>
            <div class="urdu-text">
              مجھے اس عمل کے نتائج اور اثرات کے بارے میں ڈاکٹر نے مکمل طور پر آگاہ کر دیا ہے
              اور میں اپنی رضا مندی سے یہ اجازت نامہ دے رہا ہوں۔
            </div>
          </div>

          <div class="english-section">
            <div class="english-title">English Translation</div>
            <div class="english-text">
              <p>I, _______________ son of _______________ (Husband's Name),</p>
              <p>being the husband, in full consciousness, hereby give consent for the Tubal Ligation (T.L) procedure to be performed on my wife <strong>${patientName}</strong> during upcoming delivery or operation.</p>
              <p>The doctor has fully informed me about the results and effects of this procedure, and I am giving this consent of my own free will.</p>
            </div>
          </div>

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">
                <div class="signature-label-urdu">دستخط شوہر</div>
                <div class="signature-label">Husband's Signature</div>
              </div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                <div class="signature-label-urdu">دستخط بیوی / مریضہ</div>
                <div class="signature-label">Wife / Patient Signature</div>
              </div>
            </div>
          </div>

          <div class="date-field">
            <strong>Date / تاریخ:</strong> ${currentDate}
          </div>

          ${getFooterHTML()}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    }
  };

  // 3. LAMA (Left Against Medical Advice) Consent Form
  const printLAMAConsent = () => {
    if (!selectedPatient) {
      toast.error('Please select a patient first');
      return;
    }

    const currentDate = new Date().toLocaleDateString('en-GB');
    const patientName = selectedPatient.name;
    const guardianName = selectedPatient.guardian_name || '_______________';

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>LAMA Consent Form - ${patientName}</title>
        <style>${getPrintStyles()}</style>
      </head>
      <body>
        <div class="page">
          ${getHeaderHTML()}

          <div class="form-title">
            <div class="form-title-urdu">اپنی مرضی سے ہسپتال چھوڑنے کا بیان</div>
            <div class="form-title-english">Left Against Medical Advice (LAMA)</div>
          </div>

          <div class="patient-info">
            <div class="patient-info-item"><span class="patient-info-label">Patient Name:</span> ${patientName}</div>
            <div class="patient-info-item"><span class="patient-info-label">Date:</span> ${currentDate}</div>
            <div class="patient-info-item"><span class="patient-info-label">Guardian:</span> ${guardianName}</div>
            <div class="patient-info-item"><span class="patient-info-label">Gender/Age:</span> ${selectedPatient.gender} / ${selectedPatient.age} years</div>
          </div>

          <div class="urdu-section">
            <div class="urdu-text">
              ہم / میں اپنی مرضی سے اپنے مریض / مریضہ <span class="urdu-field">${patientName}</span>
              کو ڈاکٹر کے مشورے کے برخلاف ہسپتال سے لے کر جا رہے ہیں۔
            </div>
            <div class="urdu-text">
              ڈاکٹروں نے ہمیں مریض کی حالت اور علاج کی ضرورت کے بارے میں آگاہ کر دیا ہے،
              لیکن ہم پھر بھی اپنی ذاتی ذمہ داری پر مریض کو ڈسچارج کروا رہے ہیں۔
            </div>
            <div class="urdu-text">
              اگر ہسپتال سے جانے کے بعد یا راستے میں مریض کی طبیعت خراب ہوتی ہے یا کوئی جانی نقصان ہوتا ہے،
              تو اس کی ذمہ داری ہسپتال انتظامیہ یا ڈاکٹروں پر نہیں ہوگی۔ ہم خود اس کے ذمہ دار ہیں۔
            </div>
          </div>

          <div class="english-section">
            <div class="english-title">English Translation</div>
            <div class="english-text">
              <p>We/I am taking our patient <strong>${patientName}</strong> from the hospital against medical advice and of our own will.</p>
              <p>The doctors have informed us about the patient's condition and the need for treatment, but we are still discharging the patient on our own responsibility.</p>
              <p>If the patient's health deteriorates after leaving the hospital or on the way, or if there is any loss of life, the hospital administration or doctors will not be responsible. We ourselves are responsible for this.</p>
            </div>
          </div>

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">
                <div class="signature-label-urdu">نام سرپرست / لواحقین</div>
                <div class="signature-label">Guardian Name: ${guardianName}</div>
              </div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                <div class="signature-label-urdu">دستخط / نشان انگوٹھا</div>
                <div class="signature-label">Signature / Thumb Impression</div>
              </div>
            </div>
          </div>

          <div style="margin-top: 30px; text-align: center;">
            <div style="font-family: 'Noto Nastaliq Urdu', serif; direction: rtl; font-size: 14px;">
              شناختی کارڈ نمبر (اگر دستیاب ہو): _______________
            </div>
            <div style="font-size: 12px; color: #666; margin-top: 5px;">
              CNIC Number (if available): ${selectedPatient.cnic || '_______________'}
            </div>
          </div>

          <div class="date-field">
            <strong>Date / تاریخ:</strong> ${currentDate}
          </div>

          ${getFooterHTML()}
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-green-600" />
            Consent & Documents Center
            <span className="text-sm font-normal text-gray-500 mr-2">| مرکز برائے اجازت نامے اور دستاویزات</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Selected Patient Display */}
          {selectedPatient ? (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-semibold text-lg">{selectedPatient.name}</p>
                  <p className="text-sm text-gray-600">
                    {selectedPatient.phone} | {selectedPatient.gender} | {selectedPatient.age} years
                    {selectedPatient.guardian_name && ` | Guardian: ${selectedPatient.guardian_name}`}
                  </p>
                </div>
                <Badge className="ml-auto bg-green-600">Selected</Badge>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <p className="text-yellow-700 font-medium">No Patient Selected</p>
              <p className="text-sm text-yellow-600 mt-1">
                Please select a patient from "Patient Registration" module first
              </p>
              <p className="text-sm mt-1" style={{ fontFamily: 'Noto Nastaliq Urdu, serif', direction: 'rtl' }}>
                براہ کرم پہلے مریض رجسٹریشن سے مریض منتخب کریں
              </p>
            </div>
          )}

          {/* Consent Forms Tabs */}
          <Tabs defaultValue="consent" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="consent">Consent Forms / اجازت نامے</TabsTrigger>
              <TabsTrigger value="documents">Other Documents / دیگر دستاویزات</TabsTrigger>
            </TabsList>

            <TabsContent value="consent" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* General Treatment Consent */}
                <Card className="border-2 hover:border-green-300 transition-colors">
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                        <ClipboardList className="h-8 w-8 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Treatment Consent</h3>
                        <p className="text-sm text-gray-500 font-urdu" style={{ fontFamily: 'Noto Nastaliq Urdu, serif', direction: 'rtl' }}>
                          اجازت نامہ برائے علاج
                        </p>
                      </div>
                      <p className="text-xs text-gray-400">
                        For Treatment / Procedure / Delivery / Anesthesia / Operation
                      </p>
                      <Button
                        onClick={printTreatmentConsent}
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={!selectedPatient}
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Print Form
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* T.L Consent */}
                <Card className="border-2 hover:border-pink-300 transition-colors">
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 mx-auto bg-pink-100 rounded-full flex items-center justify-center">
                        <Baby className="h-8 w-8 text-pink-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">T.L Consent</h3>
                        <p className="text-sm text-gray-500 font-urdu" style={{ fontFamily: 'Noto Nastaliq Urdu, serif', direction: 'rtl' }}>
                          بچے کی بندش کا اجازت نامہ
                        </p>
                      </div>
                      <p className="text-xs text-gray-400">
                        Tubal Ligation Consent Form
                      </p>
                      <Button
                        onClick={printTLConsent}
                        className="w-full bg-pink-600 hover:bg-pink-700"
                        disabled={!selectedPatient}
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Print Form
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* LAMA Consent */}
                <Card className="border-2 hover:border-orange-300 transition-colors">
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">LAMA Consent</h3>
                        <p className="text-sm text-gray-500 font-urdu" style={{ fontFamily: 'Noto Nastaliq Urdu, serif', direction: 'rtl' }}>
                          اپنی مرضی سے ڈسچارج
                        </p>
                      </div>
                      <p className="text-xs text-gray-400">
                        Left Against Medical Advice
                      </p>
                      <Button
                        onClick={printLAMAConsent}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                        disabled={!selectedPatient}
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Print Form
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">More Documents Coming Soon</p>
                <p className="text-sm" style={{ fontFamily: 'Noto Nastaliq Urdu, serif', direction: 'rtl' }}>
                  مزید دستاویزات جلد آرہی ہیں
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Birth certificates, death certificates, medical certificates, etc.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsentDocumentsCenter;
