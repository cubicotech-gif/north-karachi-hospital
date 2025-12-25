import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Activity, Printer, Trash2, Plus } from 'lucide-react';
import { Patient, formatCurrency } from '@/lib/hospitalData';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';
import ConsentModal from '@/components/ConsentModal';

interface Doctor {
  id: string;
  name: string;
  department: string;
  specialization: string;
}

interface TreatmentManagementProps {
  selectedPatient: Patient | null;
}

interface TreatmentType {
  id: string;
  name: string;
  category: string;
  description: string;
  default_price: number;
  process_details: string;
  duration: string;
  requirements: string;
  active: boolean;
}

export default function TreatmentManagement({ selectedPatient }: TreatmentManagementProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [treatmentTypes, setTreatmentTypes] = useState<TreatmentType[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedTreatmentType, setSelectedTreatmentType] = useState<TreatmentType | null>(null);
  const [treatmentName, setTreatmentName] = useState<string>('');
  const [price, setPrice] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'partial'>('pending');
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingTreatmentData, setPendingTreatmentData] = useState<any>(null);

  useEffect(() => {
    fetchDoctors();
    fetchTreatmentTypes();
    if (selectedPatient) {
      fetchTreatments();
    }
  }, [selectedPatient]);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await db.doctors.getAll();
      if (error) {
        console.error('Error fetching doctors:', error);
        toast.error('Failed to load doctors');
        return;
      }
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    }
  };

  const fetchTreatmentTypes = async () => {
    try {
      const { data, error } = await db.treatmentTypes.getActive();
      if (error) {
        console.error('Error fetching treatment types:', error);
        toast.error('Failed to load treatment types');
        return;
      }
      setTreatmentTypes(data || []);
    } catch (error) {
      console.error('Error fetching treatment types:', error);
      toast.error('Failed to load treatment types');
    }
  };

  const fetchTreatments = async () => {
    if (!selectedPatient) return;

    try {
      const { data, error } = await db.treatments.getByPatientId(selectedPatient.id);
      if (error) {
        console.error('Error fetching treatments:', error);
        return;
      }
      setTreatments(data || []);
    } catch (error) {
      console.error('Error fetching treatments:', error);
    }
  };

  const handleTreatmentTypeChange = (treatmentTypeId: string) => {
    const selectedType = treatmentTypes.find(t => t.id === treatmentTypeId);
    if (selectedType) {
      setSelectedTreatmentType(selectedType);
      setTreatmentName(selectedType.name);
      setPrice(selectedType.default_price);
      setDescription(selectedType.description || '');
    }
  };

  const handleAddTreatment = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient first');
      return;
    }

    if (!selectedTreatmentType) {
      toast.error('Please select a treatment type');
      return;
    }

    // Prepare treatment data and show consent modal
    const treatmentData = {
      patient_id: selectedPatient.id,
      doctor_id: selectedDoctor || null,
      treatment_type: selectedTreatmentType.name,
      treatment_name: treatmentName,
      description: description || null,
      price: price,
      payment_status: paymentStatus,
      date: new Date().toISOString().split('T')[0],
      notes: notes || null
    };

    setPendingTreatmentData(treatmentData);
    setShowConsentModal(true);
  };

  const handleConsentAccepted = async () => {
    setShowConsentModal(false);
    setLoading(true);

    try {
      const { data, error } = await db.treatments.create(pendingTreatmentData);

      if (error) {
        console.error('Error creating treatment:', error);
        toast.error('Failed to add treatment');
        setLoading(false);
        return;
      }

      toast.success('Treatment added successfully with consent!');
      fetchTreatments();

      // Reset form
      setSelectedTreatmentType(null);
      setTreatmentName('');
      setSelectedDoctor('');
      setPrice(0);
      setPaymentStatus('pending');
      setDescription('');
      setNotes('');
      setShowForm(false);
      setPendingTreatmentData(null);
    } catch (error) {
      console.error('Error creating treatment:', error);
      toast.error('Failed to add treatment');
    } finally {
      setLoading(false);
    }
  };

  const handleConsentDeclined = () => {
    setShowConsentModal(false);
    setPendingTreatmentData(null);
    toast.info('Treatment cancelled - consent not provided');
  };

  const handleDeleteTreatment = async (treatmentId: string) => {
    if (!confirm('Are you sure you want to delete this treatment record?')) {
      return;
    }

    try {
      const { error } = await db.treatments.delete(treatmentId);

      if (error) {
        console.error('Error deleting treatment:', error);
        toast.error('Failed to delete treatment');
        return;
      }

      toast.success('Treatment deleted successfully');
      fetchTreatments();
    } catch (error) {
      console.error('Error deleting treatment:', error);
      toast.error('Failed to delete treatment');
    }
  };

  const printTreatmentReceipt = (treatment: any) => {
    if (!selectedPatient || !treatment) {
      toast.error('Missing treatment details');
      return;
    }

    const doctor = doctors.find(d => d.id === treatment.doctor_id);

    const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Treatment Receipt - ${selectedPatient.name}</title>
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
          .status-pending { background: #f8d7da; color: #721c24; }
          .status-partial { background: #fff3cd; color: #856404; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>NORTH KARACHI HOSPITAL</h1>
          <p>C-122, Sector 11-B, North Karachi Township, Karachi</p>
          <p>Ph: 36989080</p>
        </div>

        <div class="receipt-title">TREATMENT RECEIPT</div>

        <div class="info-section">
          <div class="info-box">
            <p><strong>Receipt No:</strong> TRT-${treatment.id.slice(-8).toUpperCase()}</p>
            <p><strong>Date:</strong> ${new Date(treatment.date).toLocaleDateString('en-GB')}</p>
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
              <th>Description</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>${treatment.treatment_type}</strong> - ${treatment.treatment_name}
                ${treatment.description ? `<br><span style="font-size: 13px; color: #666;">${treatment.description}</span>` : ''}
                ${doctor ? `<br><span style="font-size: 13px; color: #666;">Doctor: Dr. ${doctor.name}</span>` : ''}
              </td>
              <td style="text-align: right;">${formatCurrency(treatment.price)}</td>
            </tr>
            <tr class="total-row">
              <td style="text-align: right;"><strong>TOTAL:</strong></td>
              <td style="text-align: right;"><strong>${formatCurrency(treatment.price)}</strong></td>
            </tr>
          </tbody>
        </table>

        <div style="text-align: center; margin: 20px 0;">
          <span class="status-badge status-${treatment.payment_status}">
            ${treatment.payment_status === 'paid' ? 'PAID' : treatment.payment_status === 'partial' ? 'PARTIAL PAYMENT' : 'PAYMENT PENDING'}
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
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.print();
      toast.success('Treatment receipt printed successfully');
    }
  };

  const printTreatmentConsentForm = (treatment: any) => {
    if (!selectedPatient || !treatment) {
      toast.error('Missing treatment details');
      return;
    }

    const doctor = doctors.find(d => d.id === treatment.doctor_id);
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
          body {
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: white;
          }
          .page {
            width: 210mm;
            min-height: 297mm;
            padding: 10mm;
            margin: 0 auto;
            background: white;
          }

          /* Header with Logo */
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 15px;
            border-bottom: 3px solid #1a5f2a;
            margin-bottom: 15px;
          }
          .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .logo {
            width: 80px;
            height: 80px;
            object-fit: contain;
          }
          .hospital-info {
            text-align: left;
          }
          .hospital-name {
            font-size: 22px;
            font-weight: bold;
            color: #1a5f2a;
            margin-bottom: 3px;
          }
          .hospital-name-urdu {
            font-size: 18px;
            font-weight: bold;
            color: #1a5f2a;
            font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', Arial;
          }
          .hospital-address {
            font-size: 11px;
            color: #555;
          }
          .header-right {
            text-align: right;
          }
          .date-box {
            background: #f0f0f0;
            padding: 8px 15px;
            border-radius: 5px;
            font-size: 12px;
          }

          /* Title */
          .consent-title {
            background: linear-gradient(135deg, #1a5f2a 0%, #2d8f4a 100%);
            color: white;
            padding: 12px 20px;
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin: 15px 0;
            border-radius: 5px;
          }
          .consent-title-urdu {
            font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', Arial;
            font-size: 18px;
            direction: rtl;
          }

          /* Patient Info Section */
          .patient-section {
            background: #f8fdf9;
            border: 2px solid #1a5f2a;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
          }
          .patient-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          .patient-item {
            display: flex;
            gap: 5px;
          }
          .patient-label {
            font-weight: bold;
            color: #1a5f2a;
            min-width: 120px;
          }
          .patient-item-urdu {
            direction: rtl;
            text-align: right;
            font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', Arial;
          }

          /* Urdu Content */
          .urdu-section {
            direction: rtl;
            text-align: right;
            font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', Arial;
            background: #fffef5;
            border: 1px solid #e0d5a0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            line-height: 2;
          }
          .urdu-title {
            font-size: 16px;
            font-weight: bold;
            color: #1a5f2a;
            border-bottom: 2px solid #1a5f2a;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .urdu-text {
            font-size: 14px;
            margin-bottom: 10px;
          }
          .urdu-field {
            display: inline-block;
            border-bottom: 1px solid #333;
            min-width: 150px;
            margin: 0 5px;
          }

          /* English Section */
          .english-section {
            background: #f5f9ff;
            border: 1px solid #cce0ff;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
          }
          .english-title {
            font-size: 14px;
            font-weight: bold;
            color: #1a5f2a;
            border-bottom: 2px solid #1a5f2a;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .english-text {
            font-size: 11px;
            line-height: 1.6;
            color: #444;
          }
          .english-field {
            display: inline-block;
            border-bottom: 1px solid #333;
            min-width: 120px;
            margin: 0 3px;
          }

          /* Signature Section */
          .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-top: 25px;
            padding-top: 15px;
            border-top: 2px dashed #ccc;
          }
          .signature-box {
            text-align: center;
          }
          .signature-line {
            border-bottom: 2px solid #333;
            height: 50px;
            margin-bottom: 8px;
          }
          .signature-label {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 3px;
          }
          .signature-label-urdu {
            font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', Arial;
            direction: rtl;
            font-size: 13px;
          }

          /* Footer */
          .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 10px;
            color: #666;
          }

          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page { width: 100%; min-height: auto; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <!-- Header with Logo -->
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
              <div class="date-box">
                <strong>Date / تاریخ:</strong> ${currentDate}
              </div>
            </div>
          </div>

          <!-- Title -->
          <div class="consent-title">
            <div class="consent-title-urdu">اجازت نامہ برائے علاج / پروسیجر / ڈلیوری / بیہوشی / آپریشن</div>
            <div style="font-size: 12px; margin-top: 5px;">CONSENT FORM FOR TREATMENT / PROCEDURE / DELIVERY / ANESTHESIA / OPERATION</div>
          </div>

          <!-- Patient Information -->
          <div class="patient-section">
            <div class="patient-grid">
              <div class="patient-item">
                <span class="patient-label">Patient Name:</span>
                <span>${selectedPatient.name}</span>
              </div>
              <div class="patient-item">
                <span class="patient-label">Age / Gender:</span>
                <span>${selectedPatient.age} years / ${selectedPatient.gender}</span>
              </div>
              <div class="patient-item">
                <span class="patient-label">Contact:</span>
                <span>${selectedPatient.contact}</span>
              </div>
              <div class="patient-item">
                <span class="patient-label">Treatment:</span>
                <span>${treatment.treatment_type} - ${treatment.treatment_name}</span>
              </div>
              ${doctor ? `
              <div class="patient-item">
                <span class="patient-label">Doctor:</span>
                <span>Dr. ${doctor.name}</span>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Urdu Section -->
          <div class="urdu-section">
            <div class="urdu-title">بیان حلفی / اقرار نامہ</div>
            <div class="urdu-text">
              میں مسمی / مسمات <span class="urdu-field">${selectedPatient.name}</span>
              ولد / زوجہ <span class="urdu-field"></span>
            </div>
            <div class="urdu-text">
              نام سرپرست <span class="urdu-field"></span>
              ولد / زوجہ <span class="urdu-field"></span>
            </div>
            <div class="urdu-text">
              مریض سے رشتہ <span class="urdu-field"></span>
            </div>
            <div class="urdu-text" style="margin-top: 15px;">
              بالغ / عاقل / باقائم ہوش و حواس اقرار کرتا ہوں / کرتی ہوں کہ ڈاکٹر صاحب نے مجھے میرے مرض اور علاج کے بارے میں تفصیل سے آگاہ کر دیا ہے۔ اور میں نے مکمل طور پر سمجھ لیا ہے اور یہ کہ میں اس بات کی اجازت دیتا ہوں / دیتی ہوں کہ دورانِ علاج، علاج / پروسیجر / ڈلیوری / بیہوشی / آپریشن سے ہونے والی کسی بھی قسم کی ناگزیر پیچیدگی کی صورت میں ڈاکٹر / عملہ یا ہسپتال کی انتظامیہ ذمہ دار نہ ہوگی۔
            </div>
            <div class="urdu-text">
              مزید یہ کہ کسی غیر متوقع پیچیدگی کی صورت میں مریض کو کسی دوسرے ہسپتال بھیجا جا سکتا ہے۔ ہسپتال چھوڑنے سے قبل بقایاجات ادا کرنا لازمی ہے۔
            </div>
          </div>

          <!-- English Section -->
          <div class="english-section">
            <div class="english-title">Declaration / Consent (English Translation)</div>
            <div class="english-text">
              <p>I, Mr./Ms. <span class="english-field">${selectedPatient.name}</span> S/o / W/o <span class="english-field"></span></p>
              <p style="margin-top: 8px;">Guardian Name <span class="english-field"></span> S/o / W/o <span class="english-field"></span></p>
              <p style="margin-top: 8px;">Relationship to Patient <span class="english-field"></span></p>
              <p style="margin-top: 12px;">
                Being an adult, sane, and in full possession of my senses, I affirm that the doctor has informed me in detail about my illness and treatment. I have understood it completely, and I grant permission that in case of any unavoidable complication arising during the treatment, procedure, delivery, anesthesia, or operation, the doctor, staff, or hospital administration will not be held responsible.
              </p>
              <p style="margin-top: 8px;">
                Furthermore, in case of any unexpected complication, the patient may be transferred to another hospital. It is mandatory to clear all dues before leaving the hospital.
              </p>
            </div>
          </div>

          <!-- Signature Section -->
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

          <!-- Footer -->
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
      toast.success('Treatment consent form printed successfully');
    }
  };

  if (!selectedPatient) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-gray-600">
            <Activity className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>Please select a patient from Patient Registration to add treatments</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Treatment Management
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-2" />
              {showForm ? 'Hide Form' : 'Add Treatment'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Patient Info Banner */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {selectedPatient.mrNumber && (
                    <Badge variant="outline" className="text-blue-700 border-blue-700 font-mono">
                      {selectedPatient.mrNumber}
                    </Badge>
                  )}
                  <h3 className="font-semibold text-lg">{selectedPatient.name}</h3>
                  <Badge>{selectedPatient.department}</Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Age: {selectedPatient.age} • Gender: {selectedPatient.gender} • Contact: {selectedPatient.contact}
                </p>
              </div>
            </div>
          </div>

          {/* Add Treatment Form */}
          {showForm && (
            <Card className="mb-6 bg-gray-50">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Add New Treatment</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="treatmentType">Treatment Type</Label>
                    <Select
                      value={selectedTreatmentType?.id || ''}
                      onValueChange={handleTreatmentTypeChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select treatment type" />
                      </SelectTrigger>
                      <SelectContent>
                        {treatmentTypes.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500">
                            No treatment types available. Please add them in Treatment Types Management.
                          </div>
                        ) : (
                          treatmentTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name} - Rs. {type.default_price.toLocaleString()}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="treatmentName">Treatment Name</Label>
                    <Input
                      id="treatmentName"
                      value={treatmentName}
                      onChange={(e) => setTreatmentName(e.target.value)}
                      placeholder="e.g., Normal Delivery"
                    />
                  </div>
                </div>

                {/* Treatment Details Info */}
                {selectedTreatmentType && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                    <h4 className="font-semibold text-blue-900 mb-2">Treatment Information:</h4>
                    {selectedTreatmentType.category && (
                      <p className="text-gray-700"><strong>Category:</strong> {selectedTreatmentType.category}</p>
                    )}
                    {selectedTreatmentType.duration && (
                      <p className="text-gray-700"><strong>Duration:</strong> {selectedTreatmentType.duration}</p>
                    )}
                    {selectedTreatmentType.process_details && (
                      <p className="text-gray-700 mt-1"><strong>Process:</strong> {selectedTreatmentType.process_details}</p>
                    )}
                    {selectedTreatmentType.requirements && (
                      <p className="text-gray-700 mt-1"><strong>Requirements:</strong> {selectedTreatmentType.requirements}</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="price">Price (Rs)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      value={price || ''}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                      placeholder="Enter price"
                    />
                  </div>

                  <div>
                    <Label htmlFor="doctor">Doctor (Optional)</Label>
                    <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            {doctor.name} - {doctor.department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="paymentStatus">Payment Status</Label>
                    <Select value={paymentStatus} onValueChange={(value: any) => setPaymentStatus(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Treatment description"
                    rows={2}
                  />
                </div>

                <div className="mt-4">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddTreatment} disabled={loading}>
                    {loading ? 'Adding...' : 'Add Treatment'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator className="my-6" />

          {/* Treatment History */}
          <div>
            <h3 className="font-semibold mb-4">Treatment History</h3>
            {treatments.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <Activity className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No treatments recorded for this patient</p>
              </div>
            ) : (
              <div className="space-y-3">
                {treatments.map((treatment) => {
                  const doctor = doctors.find(d => d.id === treatment.doctor_id);
                  return (
                    <Card key={treatment.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{treatment.treatment_type}</Badge>
                            <Badge
                              className={
                                treatment.payment_status === 'paid' ? 'bg-green-500' :
                                treatment.payment_status === 'partial' ? 'bg-yellow-500' :
                                'bg-red-500'
                              }
                            >
                              {treatment.payment_status}
                            </Badge>
                          </div>
                          <h4 className="font-semibold">{treatment.treatment_name}</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
                            <p><strong>Date:</strong> {new Date(treatment.date).toLocaleDateString('en-PK')}</p>
                            <p><strong>Price:</strong> {formatCurrency(treatment.price)}</p>
                            {doctor && <p><strong>Doctor:</strong> {doctor.name}</p>}
                            {treatment.description && (
                              <p className="col-span-2"><strong>Description:</strong> {treatment.description}</p>
                            )}
                            {treatment.notes && (
                              <p className="col-span-2"><strong>Notes:</strong> {treatment.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => printTreatmentConsentForm(treatment)}
                          >
                            <Printer className="h-3 w-3 mr-1" />
                            Consent
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => printTreatmentReceipt(treatment)}
                          >
                            <Printer className="h-3 w-3 mr-1" />
                            Receipt
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTreatment(treatment.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>

                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Treatment Consent Modal */}
      <ConsentModal
        isOpen={showConsentModal}
        consentType="treatment"
        patientName={selectedPatient?.name || ''}
        procedureName={treatmentName || selectedTreatmentType?.name}
        onAccept={handleConsentAccepted}
        onDecline={handleConsentDeclined}
      />
    </div>
  );
}
