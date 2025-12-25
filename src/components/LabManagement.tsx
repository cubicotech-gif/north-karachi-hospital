import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TestTube, User, Printer, CreditCard, FileText } from 'lucide-react';
import { Patient, formatCurrency } from '@/lib/hospitalData';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';
import ConsentModal from '@/components/ConsentModal';

interface Doctor {
  id: string;
  name: string;
  department: string;
}

interface LabTest {
  id: string;
  name: string;
  price: number;
  department: string;
  normal_range?: string;
  active: boolean;
}

interface LabOrder {
  id: string;
  patient_id: string;
  doctor_id?: string;
  tests: string[];
  total_amount: number;
  status: string;
  order_date: string;
}

interface LabManagementProps {
  selectedPatient: Patient | null;
}

export default function LabManagement({ selectedPatient }: LabManagementProps) {
  const [orderType, setOrderType] = useState<'OPD' | 'Direct'>('OPD');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [generatedOrder, setGeneratedOrder] = useState<LabOrder | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);

  // Fetch doctors and lab tests from database
  useEffect(() => {
    fetchDoctors();
    fetchLabTests();
  }, []);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await db.doctors.getAll();
      if (error) {
        console.error('Error fetching doctors:', error);
        return;
      }
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchLabTests = async () => {
    try {
      const { data, error } = await db.labTests.getActive();
      if (error) {
        console.error('Error fetching lab tests:', error);
        return;
      }
      setLabTests(data || []);
    } catch (error) {
      console.error('Error fetching lab tests:', error);
    }
  };

  const handleTestSelection = (testId: string, checked: boolean) => {
    if (checked) {
      setSelectedTests([...selectedTests, testId]);
    } else {
      setSelectedTests(selectedTests.filter(id => id !== testId));
    }
  };

  const handleDoctorSelect = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    setSelectedDoctor(doctor || null);
  };

  const calculateTotal = () => {
    return selectedTests.reduce((total, testId) => {
      const test = labTests.find(t => t.id === testId);
      return total + (test?.price || 0);
    }, 0);
  };

  const createLabOrder = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient first');
      return;
    }

    if (orderType === 'OPD' && !selectedDoctor) {
      toast.error('Please select referring doctor for OPD orders');
      return;
    }

    if (selectedTests.length === 0) {
      toast.error('Please select at least one test');
      return;
    }

    // Prepare order data and show consent modal
    const orderData = {
      patient_id: selectedPatient.id,
      doctor_id: selectedDoctor?.id,
      tests: selectedTests,
      total_amount: calculateTotal(),
      status: 'pending',
      order_date: new Date().toISOString().split('T')[0]
    };

    setPendingOrderData(orderData);
    setShowConsentModal(true);
  };

  const handleConsentAccepted = async () => {
    setShowConsentModal(false);
    setLoading(true);

    try {
      const { data, error } = await db.labOrders.create(pendingOrderData);

      if (error) {
        console.error('Error creating lab order:', error);
        toast.error('Failed to create lab order');
        setLoading(false);
        return;
      }

      setGeneratedOrder(data);
      toast.success('Lab order created successfully with consent!');
      setPendingOrderData(null);
    } catch (error) {
      console.error('Error creating lab order:', error);
      toast.error('Failed to create lab order');
    } finally {
      setLoading(false);
    }
  };

  const handleConsentDeclined = () => {
    setShowConsentModal(false);
    setPendingOrderData(null);
    toast.info('Lab order cancelled - consent not provided');
  };

  const handlePayment = () => {
    if (generatedOrder) {
      setPaymentStatus('paid');
      toast.success('Payment recorded successfully!');
    }
  };

  const printLabBill = () => {
    if (!generatedOrder || !selectedPatient) {
      toast.error('Missing order details');
      return;
    }

    const selectedTestDetails = labTests.filter(test =>
      generatedOrder.tests.includes(test.id)
    );

    const billContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Lab Bill - ${selectedPatient.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; border-bottom: 3px solid #e74c3c; padding-bottom: 15px; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #333; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; font-size: 14px; }
          .receipt-title { background: #2563eb; color: white; padding: 10px; text-align: center; font-size: 18px; font-weight: bold; margin: 15px 0; }
          .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
          .info-box { background: #f5f5f5; padding: 15px; border-radius: 5px; }
          .info-box p { margin: 5px 0; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #2563eb; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          .total-row { font-weight: bold; font-size: 16px; background: #f0f7ff; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          .status-badge { display: inline-block; padding: 5px 15px; border-radius: 15px; font-weight: bold; }
          .status-paid { background: #d4edda; color: #155724; }
          .status-unpaid { background: #f8d7da; color: #721c24; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>NORTH KARACHI HOSPITAL</h1>
          <p>C-122, Sector 11-B, North Karachi Township, Karachi</p>
          <p>Ph: 36989080</p>
        </div>

        <div class="receipt-title">LABORATORY BILL / RECEIPT</div>

        <div class="info-section">
          <div class="info-box">
            <p><strong>Receipt No:</strong> LAB-${generatedOrder.id.slice(-8).toUpperCase()}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
          </div>
          <div class="info-box">
            <p><strong>Patient:</strong> ${selectedPatient.name}</p>
            <p><strong>Age/Gender:</strong> ${selectedPatient.age} yrs / ${selectedPatient.gender}</p>
            <p><strong>Contact:</strong> ${selectedPatient.contact}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Test Name</th>
              <th>Department</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${selectedTestDetails.map((test, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${test.name}</td>
                <td>${test.department}</td>
                <td style="text-align: right;">${formatCurrency(test.price)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="3" style="text-align: right;"><strong>TOTAL:</strong></td>
              <td style="text-align: right;"><strong>${formatCurrency(generatedOrder.total_amount)}</strong></td>
            </tr>
          </tbody>
        </table>

        <div style="text-align: center; margin: 20px 0;">
          <span class="status-badge ${paymentStatus === 'paid' ? 'status-paid' : 'status-unpaid'}">
            ${paymentStatus === 'paid' ? 'PAID' : 'PAYMENT PENDING'}
          </span>
        </div>

        <div class="footer">
          <p>Thank you for choosing North Karachi Hospital</p>
          <p>This is a computer generated receipt</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(billContent);
      printWindow.document.close();
      printWindow.print();
      toast.success('Lab bill printed successfully');
    }
  };

  const printLabConsentForm = () => {
    if (!generatedOrder || !selectedPatient) {
      toast.error('Missing order details');
      return;
    }

    const selectedTestDetails = labTests.filter(test =>
      generatedOrder.tests.includes(test.id)
    );
    const testNames = selectedTestDetails.map(t => t.name).join(', ');

    const currentDate = new Date().toLocaleDateString('en-GB');

    const consentContent = `
      <!DOCTYPE html>
      <html dir="ltr">
      <head>
        <meta charset="UTF-8">
        <title>Consent Form - ${selectedPatient.name}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #333; background: white; }
          .page { width: 210mm; min-height: 297mm; padding: 10mm; margin: 0 auto; background: white; }
          .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 15px; border-bottom: 3px solid #1a5f2a; margin-bottom: 15px; }
          .logo-section { display: flex; align-items: center; gap: 15px; }
          .logo { width: 80px; height: 80px; object-fit: contain; }
          .hospital-info { text-align: left; }
          .hospital-name { font-size: 22px; font-weight: bold; color: #1a5f2a; margin-bottom: 3px; }
          .hospital-name-urdu { font-size: 18px; font-weight: bold; color: #1a5f2a; font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', Arial; }
          .hospital-address { font-size: 11px; color: #555; }
          .header-right { text-align: right; }
          .date-box { background: #f0f0f0; padding: 8px 15px; border-radius: 5px; font-size: 12px; }
          .consent-title { background: linear-gradient(135deg, #1a5f2a 0%, #2d8f4a 100%); color: white; padding: 12px 20px; text-align: center; font-size: 16px; font-weight: bold; margin: 15px 0; border-radius: 5px; }
          .consent-title-urdu { font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', Arial; font-size: 18px; direction: rtl; }
          .patient-section { background: #f8fdf9; border: 2px solid #1a5f2a; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
          .patient-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .patient-item { display: flex; gap: 5px; }
          .patient-label { font-weight: bold; color: #1a5f2a; min-width: 120px; }
          .urdu-section { direction: rtl; text-align: right; font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', Arial; background: #fffef5; border: 1px solid #e0d5a0; border-radius: 8px; padding: 15px; margin-bottom: 15px; line-height: 2; }
          .urdu-title { font-size: 16px; font-weight: bold; color: #1a5f2a; border-bottom: 2px solid #1a5f2a; padding-bottom: 8px; margin-bottom: 12px; }
          .urdu-text { font-size: 14px; margin-bottom: 10px; }
          .urdu-field { display: inline-block; border-bottom: 1px solid #333; min-width: 150px; margin: 0 5px; }
          .english-section { background: #f5f9ff; border: 1px solid #cce0ff; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
          .english-title { font-size: 14px; font-weight: bold; color: #1a5f2a; border-bottom: 2px solid #1a5f2a; padding-bottom: 8px; margin-bottom: 12px; }
          .english-text { font-size: 11px; line-height: 1.6; color: #444; }
          .english-field { display: inline-block; border-bottom: 1px solid #333; min-width: 120px; margin: 0 3px; }
          .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 25px; padding-top: 15px; border-top: 2px dashed #ccc; }
          .signature-box { text-align: center; }
          .signature-line { border-bottom: 2px solid #333; height: 50px; margin-bottom: 8px; }
          .signature-label { font-weight: bold; font-size: 11px; margin-bottom: 3px; }
          .signature-label-urdu { font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', Arial; direction: rtl; font-size: 13px; }
          .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #666; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .page { width: 100%; min-height: auto; padding: 0; } }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div class="logo-section">
              <img src="/logo.png" alt="Hospital Logo" class="logo" onerror="this.style.display='none'">
              <div class="hospital-info">
                <div class="hospital-name">NORTH KARACHI HOSPITAL</div>
                <div class="hospital-name-urdu">نارتھ کراچی ہسپتال</div>
                <div class="hospital-address">C-122, Sector 11-B, North Karachi Township, Karachi | Ph: 36989080</div>
              </div>
            </div>
            <div class="header-right">
              <div class="date-box"><strong>Date / تاریخ:</strong> ${currentDate}</div>
            </div>
          </div>

          <div class="consent-title">
            <div class="consent-title-urdu">اجازت نامہ برائے علاج / پروسیجر / ڈلیوری / بیہوشی / آپریشن</div>
            <div style="font-size: 12px; margin-top: 5px;">CONSENT FORM FOR TREATMENT / PROCEDURE / DELIVERY / ANESTHESIA / OPERATION</div>
          </div>

          <div class="patient-section">
            <div class="patient-grid">
              <div class="patient-item"><span class="patient-label">Patient Name:</span><span>${selectedPatient.name}</span></div>
              <div class="patient-item"><span class="patient-label">Age / Gender:</span><span>${selectedPatient.age} years / ${selectedPatient.gender}</span></div>
              <div class="patient-item"><span class="patient-label">Contact:</span><span>${selectedPatient.contact}</span></div>
              <div class="patient-item"><span class="patient-label">Tests:</span><span>${testNames}</span></div>
              ${selectedDoctor ? `<div class="patient-item"><span class="patient-label">Doctor:</span><span>Dr. ${selectedDoctor.name}</span></div>` : ''}
            </div>
          </div>

          <div class="urdu-section">
            <div class="urdu-title">بیان حلفی / اقرار نامہ</div>
            <div class="urdu-text">میں مسمی / مسمات <span class="urdu-field">${selectedPatient.name}</span> ولد / زوجہ <span class="urdu-field"></span></div>
            <div class="urdu-text">نام سرپرست <span class="urdu-field"></span> ولد / زوجہ <span class="urdu-field"></span></div>
            <div class="urdu-text">مریض سے رشتہ <span class="urdu-field"></span></div>
            <div class="urdu-text" style="margin-top: 15px;">بالغ / عاقل / باقائم ہوش و حواس اقرار کرتا ہوں / کرتی ہوں کہ ڈاکٹر صاحب نے مجھے میرے مرض اور علاج کے بارے میں تفصیل سے آگاہ کر دیا ہے۔ اور میں نے مکمل طور پر سمجھ لیا ہے اور یہ کہ میں اس بات کی اجازت دیتا ہوں / دیتی ہوں کہ دورانِ علاج، علاج / پروسیجر / ڈلیوری / بیہوشی / آپریشن سے ہونے والی کسی بھی قسم کی ناگزیر پیچیدگی کی صورت میں ڈاکٹر / عملہ یا ہسپتال کی انتظامیہ ذمہ دار نہ ہوگی۔</div>
            <div class="urdu-text">مزید یہ کہ کسی غیر متوقع پیچیدگی کی صورت میں مریض کو کسی دوسرے ہسپتال بھیجا جا سکتا ہے۔ ہسپتال چھوڑنے سے قبل بقایاجات ادا کرنا لازمی ہے۔</div>
          </div>

          <div class="english-section">
            <div class="english-title">Declaration / Consent (English Translation)</div>
            <div class="english-text">
              <p>I, Mr./Ms. <span class="english-field">${selectedPatient.name}</span> S/o / W/o <span class="english-field"></span></p>
              <p style="margin-top: 8px;">Guardian Name <span class="english-field"></span> S/o / W/o <span class="english-field"></span></p>
              <p style="margin-top: 8px;">Relationship to Patient <span class="english-field"></span></p>
              <p style="margin-top: 12px;">Being an adult, sane, and in full possession of my senses, I affirm that the doctor has informed me in detail about my illness and treatment. I have understood it completely, and I grant permission that in case of any unavoidable complication arising during the treatment, procedure, delivery, anesthesia, or operation, the doctor, staff, or hospital administration will not be held responsible.</p>
              <p style="margin-top: 8px;">Furthermore, in case of any unexpected complication, the patient may be transferred to another hospital. It is mandatory to clear all dues before leaving the hospital.</p>
            </div>
          </div>

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label-urdu">دستخط / نشان انگوٹھا (مریض)</div>
              <div class="signature-label">Signature / Thumb Impression (Patient)</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label-urdu">دستخط / نشان انگوٹھا (سرپرست)</div>
              <div class="signature-label">Signature / Thumb Impression (Guardian)</div>
            </div>
          </div>

          <div class="footer">
            <p>This consent form is a legal document. Please read carefully before signing.</p>
            <p>یہ اجازت نامہ ایک قانونی دستاویز ہے۔ دستخط کرنے سے پہلے احتیاط سے پڑھیں۔</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(consentContent);
      printWindow.document.close();
      printWindow.print();
      toast.success('Lab consent form printed successfully');
    }
  };

  const printLabSlip = () => {
    if (!generatedOrder || !selectedPatient) return;

    const selectedTestDetails = labTests.filter(test => 
      generatedOrder.tests.includes(test.id)
    );

    const slipContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #333;">HOSPITAL MANAGEMENT SYSTEM</h2>
          <p style="margin: 5px 0; color: #666;">Laboratory Request Slip</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <strong>Order ID:</strong> ${generatedOrder.id}<br>
            <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
            <strong>Time:</strong> ${new Date().toLocaleTimeString()}
          </div>
          <div style="text-align: right;">
            <strong>Priority:</strong> Routine<br>
            ${selectedDoctor ? `<strong>Ref. Dr.:</strong> ${selectedDoctor.name}` : ''}
          </div>
        </div>
        
        <div style="margin-bottom: 20px; background: #e8f4fd; padding: 15px; border-radius: 5px;">
          <strong>Patient Information:</strong><br>
          Name: ${selectedPatient.name}<br>
          Age: ${selectedPatient.age} years | Gender: ${selectedPatient.gender}<br>
          Contact: ${selectedPatient.contact}<br>
          Patient ID: ${selectedPatient.id}
        </div>
        
        <div style="margin-bottom: 30px;">
          <strong>Tests to be Performed:</strong><br>
          ${selectedTestDetails.map((test, index) => `
            <div style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
              <strong>${index + 1}. ${test.name}</strong><br>
              <span style="color: #666; font-size: 12px;">Department: ${test.department}</span>
              ${test.normal_range ? `<br><span style="color: #666; font-size: 12px;">Normal Range: ${test.normal_range}</span>` : ''}
              <div style="margin-top: 15px; border-top: 1px dotted #ccc; padding-top: 10px;">
                <strong>Result:</strong><br>
                <div style="height: 40px; border: 1px solid #ccc; margin-top: 5px;"></div>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div style="margin-top: 50px; display: flex; justify-content: space-between;">
          <div style="text-align: center;">
            <div style="border-top: 1px solid #333; width: 120px; padding-top: 10px; font-size: 12px;">
              Technician
            </div>
          </div>
          <div style="text-align: center;">
            <div style="border-top: 1px solid #333; width: 120px; padding-top: 10px; font-size: 12px;">
              Verified By
            </div>
          </div>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(slipContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!selectedPatient) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Please select or register a patient first</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Name:</strong> {selectedPatient.name}</p>
              <p><strong>Age:</strong> {selectedPatient.age} years</p>
              <p><strong>Gender:</strong> {selectedPatient.gender}</p>
            </div>
            <div>
              <p><strong>Contact:</strong> {selectedPatient.contact}</p>
              <p><strong>Problem:</strong> {selectedPatient.problem}</p>
              <p><strong>Department:</strong> {selectedPatient.department}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Lab Order Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Order Type</label>
            <Select value={orderType} onValueChange={(value) => setOrderType(value as 'OPD' | 'Direct')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPD">From OPD (Doctor Prescribed)</SelectItem>
                <SelectItem value="Direct">Direct Lab Visit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {orderType === 'OPD' && (
            <div>
              <label className="text-sm font-medium">Referring Doctor</label>
              <Select onValueChange={handleDoctorSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select referring doctor..." />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      Dr. {doctor.name} - {doctor.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Select Lab Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
            {labTests.map((test) => (
              <div key={test.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={test.id}
                  checked={selectedTests.includes(test.id)}
                  onCheckedChange={(checked) => handleTestSelection(test.id, checked as boolean)}
                />
                <div className="flex-1">
                  <label htmlFor={test.id} className="font-medium cursor-pointer">
                    {test.name}
                  </label>
                  <p className="text-sm text-gray-600">{test.department}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(test.price)}</p>
                </div>
              </div>
            ))}
          </div>

          {selectedTests.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Selected Tests: {selectedTests.length}</span>
                <span className="text-xl font-bold text-blue-600">
                  Total: {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create Lab Order</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={createLabOrder} 
            className="w-full"
            disabled={selectedTests.length === 0 || loading}
          >
            <TestTube className="h-4 w-4 mr-2" />
            {loading ? 'Creating...' : 'Create Lab Order'}
          </Button>
        </CardContent>
      </Card>

      {generatedOrder && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Lab Order Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <h2 className="text-2xl font-bold text-green-600">Order #{generatedOrder.id.slice(-6)}</h2>
                <p className="text-gray-600 mt-2">Created on {new Date().toLocaleDateString()}</p>
                <Badge className="mt-2" variant={paymentStatus === 'paid' ? 'default' : 'secondary'}>
                  {paymentStatus === 'paid' ? 'Payment Completed' : 'Payment Pending'}
                </Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Total Amount</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(generatedOrder.total_amount)}</p>
                </div>
                <div>
                  <p className="font-medium">Tests Ordered</p>
                  <p className="text-2xl font-bold text-blue-600">{generatedOrder.tests.length}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {paymentStatus === 'pending' && (
                  <Button onClick={handlePayment} variant="outline" size="sm">
                    <CreditCard className="h-3 w-3 mr-2" />
                    Record Payment
                  </Button>
                )}
                <Button onClick={printLabConsentForm} variant="outline" size="sm">
                  <Printer className="h-3 w-3 mr-2" />
                  Print Consent Form
                </Button>
                <Button onClick={printLabBill} variant="outline" size="sm">
                  <Printer className="h-3 w-3 mr-2" />
                  Print Bill
                </Button>
                <Button onClick={printLabSlip} variant="outline" size="sm">
                  <Printer className="h-3 w-3 mr-2" />
                  Print Lab Slip
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lab Test Consent Modal */}
      <ConsentModal
        isOpen={showConsentModal}
        consentType="lab"
        patientName={selectedPatient?.name || ''}
        procedureName={`Laboratory Testing (${selectedTests.length} test${selectedTests.length !== 1 ? 's' : ''})`}
        onAccept={handleConsentAccepted}
        onDecline={handleConsentDeclined}
      />
    </div>
  );
}
