import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Printer, Clock, User, Stethoscope, CreditCard } from 'lucide-react';
import { Patient, generateTokenNumber, formatCurrency } from '@/lib/hospitalData';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';
import ConsentModal from '@/components/ConsentModal';

interface Doctor {
  id: string;
  name: string;
  department: string;
  specialization: string;
  opd_fee: number;
  available: boolean;
}

interface OPDToken {
  id: string;
  token_number: number;
  patient_id: string;
  doctor_id: string;
  date: string;
  status: string;
  fee: number;
  payment_status: string;
}

interface OPDTokenSystemProps {
  selectedPatient: Patient | null;
}

export default function OPDTokenSystem({ selectedPatient }: OPDTokenSystemProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [generatedToken, setGeneratedToken] = useState<OPDToken | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending');
  const [loading, setLoading] = useState(false);
  const [queueNumber, setQueueNumber] = useState<number>(0);
  const [showConsentModal, setShowConsentModal] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      getQueueNumber(selectedDoctor.id);
    }
  }, [selectedDoctor]);

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

  const getQueueNumber = async (doctorId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await db.opdTokens.getAll();

      if (error) {
        console.error('Error fetching tokens:', error);
        return;
      }

      const todayTokens = data?.filter(
        token => token.doctor_id === doctorId && token.date === today
      ) || [];

      setQueueNumber(todayTokens.length + 1);
    } catch (error) {
      console.error('Error getting queue number:', error);
    }
  };

  const handleDoctorSelect = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    setSelectedDoctor(doctor || null);
  };

  const generateOPDToken = async () => {
    if (!selectedPatient || !selectedDoctor) {
      toast.error('Please select both patient and doctor');
      return;
    }
    setShowConsentModal(true);
  };

  const handleConsentAccepted = async () => {
    setShowConsentModal(false);
    setLoading(true);

    try {
      const tokenData = {
        token_number: generateTokenNumber(),
        patient_id: selectedPatient!.id,
        doctor_id: selectedDoctor!.id,
        date: new Date().toISOString().split('T')[0],
        status: 'waiting',
        fee: selectedDoctor!.opd_fee,
        payment_status: paymentStatus
      };

      const { data, error } = await db.opdTokens.create(tokenData);

      if (error) {
        console.error('Error creating token:', error);
        toast.error('Failed to generate token');
        setLoading(false);
        return;
      }

      setGeneratedToken(data);
      toast.success('OPD Token generated successfully with consent!');
    } catch (error) {
      console.error('Error creating token:', error);
      toast.error('Failed to generate token');
    } finally {
      setLoading(false);
    }
  };

  const handleConsentDeclined = () => {
    setShowConsentModal(false);
    toast.info('OPD consultation cancelled - consent not provided');
  };

  const handlePayment = async () => {
    if (!generatedToken) return;

    setLoading(true);
    try {
      const { error } = await db.opdTokens.update(generatedToken.id, {
        payment_status: 'paid'
      });

      if (error) {
        console.error('Error updating payment:', error);
        toast.error('Failed to record payment');
        setLoading(false);
        return;
      }

      setGeneratedToken({ ...generatedToken, payment_status: 'paid' });
      setPaymentStatus('paid');
      toast.success('Payment recorded successfully!');
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  // ========== ALL PRINT FUNCTIONS USE window.open ==========

  const printToken = () => {
    if (!generatedToken || !selectedPatient || !selectedDoctor) return;

    const printContent = `
      <html>
        <head>
          <title>OPD Token - ${generatedToken.token_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 400px; margin: 0 auto; border: 2px solid #333; padding: 20px; }
            .header { text-align: center; border-bottom: 3px solid #e74c3c; padding-bottom: 15px; margin-bottom: 20px; }
            .hospital-name { font-size: 22px; font-weight: bold; color: #333; margin: 5px 0; }
            .hospital-urdu { font-size: 18px; color: #666; }
            .subtitle { color: #666; font-size: 14px; }
            .queue-box { background: #e74c3c; color: white; padding: 15px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .queue-number { font-size: 48px; font-weight: bold; margin: 0; }
            .queue-label { font-size: 14px; margin: 5px 0 0 0; }
            .info-section { margin: 15px 0; }
            .info-label { font-weight: bold; color: #333; }
            .footer { border-top: 1px solid #ccc; padding-top: 10px; margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="hospital-name">North Karachi Hospital</div>
              <div class="hospital-urdu">نارتھ کراچی ہسپتال</div>
              <div class="subtitle">OPD Token / او پی ڈی ٹوکن</div>
            </div>

            <div class="queue-box">
              <p class="queue-number">${queueNumber}</p>
              <p class="queue-label">QUEUE NUMBER</p>
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
              <div><strong>Token:</strong> ${generatedToken.token_number}</div>
              <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-PK')}</div>
            </div>

            <div class="info-section">
              <div class="info-label">Patient Details:</div>
              <div>Name: ${selectedPatient.name}</div>
              <div>Age: ${selectedPatient.age} years | Gender: ${selectedPatient.gender}</div>
              <div>Contact: ${selectedPatient.contact}</div>
            </div>

            <div class="info-section">
              <div class="info-label">Doctor Details:</div>
              <div>Dr. ${selectedDoctor.name}</div>
              <div>${selectedDoctor.department}</div>
              <div>${selectedDoctor.specialization}</div>
            </div>

            <div class="info-section">
              <div><strong>Fee:</strong> ${formatCurrency(selectedDoctor.opd_fee)}</div>
              <div><strong>Payment:</strong> ${generatedToken.payment_status.toUpperCase()}</div>
            </div>

            <div class="footer">
              Please wait for your turn. Show this token to the doctor.<br>
              براہ کرم اپنی باری کا انتظار کریں۔
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const printReceipt = () => {
    if (!generatedToken || !selectedPatient || !selectedDoctor) {
      toast.error('Missing OPD details');
      return;
    }

    const receiptNumber = `OPD-${generatedToken.id.slice(-8).toUpperCase()}`;
    const isPaid = generatedToken.payment_status === 'paid';

    const printContent = `
      <html>
        <head>
          <title>OPD Receipt - ${receiptNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 500px; margin: 0 auto; border: 2px solid #333; padding: 25px; }
            .header { text-align: center; border-bottom: 3px solid #e74c3c; padding-bottom: 15px; margin-bottom: 20px; }
            .hospital-name { font-size: 24px; font-weight: bold; color: #333; }
            .hospital-urdu { font-size: 18px; color: #666; }
            .address { font-size: 12px; color: #666; margin-top: 5px; }
            .receipt-title { background: #e74c3c; color: white; padding: 10px; text-align: center; font-size: 18px; font-weight: bold; margin: 15px 0; }
            .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 5px 0; border-bottom: 1px dashed #ddd; }
            .patient-box { background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .amount-box { background: #e8f5e9; padding: 15px; margin: 15px 0; border-radius: 5px; text-align: center; }
            .total { font-size: 28px; font-weight: bold; color: #2e7d32; }
            .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-weight: bold; margin-top: 10px; }
            .paid { background: #4caf50; color: white; }
            .unpaid { background: #f44336; color: white; }
            .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
            .sig-line { border-top: 1px solid #333; width: 150px; text-align: center; padding-top: 5px; font-size: 12px; }
            .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="hospital-name">North Karachi Hospital</div>
              <div class="hospital-urdu">نارتھ کراچی ہسپتال</div>
              <div class="address">C-122, Sector 11-B, North Karachi | Ph: 36989080</div>
            </div>

            <div class="receipt-title">RECEIPT / رسید</div>

            <div class="info-row">
              <span><strong>Receipt No:</strong> ${receiptNumber}</span>
              <span><strong>Date:</strong> ${new Date().toLocaleDateString('en-PK')}</span>
            </div>

            <div class="patient-box">
              <strong>Patient Details:</strong><br>
              Name: ${selectedPatient.name}<br>
              Contact: ${selectedPatient.contact}<br>
              Age/Gender: ${selectedPatient.age} yrs / ${selectedPatient.gender}
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
              <tr style="background: #f0f0f0;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Description</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Amount</th>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">
                  OPD Consultation Fee<br>
                  <small>Dr. ${selectedDoctor.name} - ${selectedDoctor.department}</small><br>
                  <small>Token #${generatedToken.token_number} | Queue #${queueNumber}</small>
                </td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">
                  ${formatCurrency(selectedDoctor.opd_fee)}
                </td>
              </tr>
            </table>

            <div class="amount-box">
              <div>Total Amount / کل رقم</div>
              <div class="total">${formatCurrency(selectedDoctor.opd_fee)}</div>
              <div class="status ${isPaid ? 'paid' : 'unpaid'}">
                ${isPaid ? 'PAID / ادا شدہ' : 'UNPAID / غیر ادا شدہ'}
              </div>
            </div>

            <div class="signatures">
              <div class="sig-line">Patient Signature<br>مریض کے دستخط</div>
              <div class="sig-line">Cashier<br>کیشیئر</div>
            </div>

            <div class="footer">
              Thank you for choosing North Karachi Hospital<br>
              نارتھ کراچی ہسپتال کا انتخاب کرنے کا شکریہ<br>
              <small>Printed: ${new Date().toLocaleString('en-PK')}</small>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const printPrescription = () => {
    if (!selectedPatient || !selectedDoctor) return;

    const printContent = `
      <html>
        <head>
          <title>Prescription - ${selectedPatient.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 700px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 3px solid #e74c3c; padding-bottom: 15px; margin-bottom: 25px; }
            .hospital-name { font-size: 28px; font-weight: bold; color: #333; }
            .hospital-urdu { font-size: 18px; color: #666; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .patient-box { background: #f5f5f5; padding: 15px; border-left: 4px solid #e74c3c; margin-bottom: 25px; }
            .section { margin-bottom: 25px; }
            .section-title { font-weight: bold; font-size: 16px; color: #333; margin-bottom: 10px; border-bottom: 2px solid #e74c3c; padding-bottom: 5px; }
            .write-area { min-height: 80px; border: 1px solid #ddd; padding: 10px; margin-top: 10px; }
            .signature { margin-top: 60px; text-align: right; }
            .signature-line { border-top: 1px solid #333; width: 250px; margin-left: auto; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="hospital-name">North Karachi Hospital</div>
              <div class="hospital-urdu">نارتھ کراچی ہسپتال</div>
              <div style="font-size: 14px; color: #666;">Prescription & Medical Record</div>
            </div>

            <div class="info-row">
              <div>
                <strong>Date:</strong> ${new Date().toLocaleDateString('en-PK')}<br>
                <strong>Token No:</strong> ${generatedToken?.token_number || 'N/A'}<br>
                <strong>Queue No:</strong> ${queueNumber}
              </div>
              <div style="text-align: right;">
                <strong style="font-size: 18px;">Dr. ${selectedDoctor.name}</strong><br>
                ${selectedDoctor.department}<br>
                ${selectedDoctor.specialization}
              </div>
            </div>

            <div class="patient-box">
              <strong>Patient Information:</strong><br>
              Name: ${selectedPatient.name}<br>
              Age: ${selectedPatient.age} years | Gender: ${selectedPatient.gender}<br>
              Contact: ${selectedPatient.contact}<br>
              Chief Complaint: ${selectedPatient.problem}
            </div>

            <div class="section">
              <div class="section-title">Clinical Examination</div>
              <div class="write-area" style="min-height: 100px;"></div>
            </div>

            <div class="section">
              <div class="section-title">Diagnosis</div>
              <div class="write-area" style="min-height: 80px;"></div>
            </div>

            <div class="section">
              <div class="section-title">℞ Prescription</div>
              <div class="write-area" style="min-height: 180px;"></div>
            </div>

            <div class="section">
              <div class="section-title">Lab Tests / Investigations</div>
              <div class="write-area" style="min-height: 100px;"></div>
            </div>

            <div class="section">
              <div class="section-title">Advice & Follow-up</div>
              <div class="write-area" style="min-height: 80px;"></div>
            </div>

            <div class="signature">
              <div class="signature-line">
                <strong>Dr. ${selectedDoctor.name}</strong><br>
                ${selectedDoctor.specialization}
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
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
            Selected Patient
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Name:</strong> {selectedPatient.name}</p>
            <p><strong>Age:</strong> {selectedPatient.age} years</p>
            <p><strong>Gender:</strong> {selectedPatient.gender}</p>
            <p><strong>Contact:</strong> {selectedPatient.contact}</p>
            <p><strong>Problem:</strong> {selectedPatient.problem}</p>
            <p><strong>Department:</strong> {selectedPatient.department}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Select Doctor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={handleDoctorSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a doctor..." />
            </SelectTrigger>
            <SelectContent>
              {doctors
                .filter(doctor => doctor.available)
                .map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    Dr. {doctor.name} - {doctor.department} ({formatCurrency(doctor.opd_fee)})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {selectedDoctor && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold">Dr. {selectedDoctor.name}</h3>
              <p className="text-sm text-gray-600">{selectedDoctor.department}</p>
              <p className="text-sm text-gray-600">{selectedDoctor.specialization}</p>
              <p className="font-medium mt-2">OPD Fee: {formatCurrency(selectedDoctor.opd_fee)}</p>
              <p className="text-sm text-blue-600 mt-1">Next Queue Number: {queueNumber}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedDoctor && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate OPD Token
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Total OPD Fee</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(selectedDoctor.opd_fee)}</p>
                </div>
                <Badge variant={paymentStatus === 'paid' ? 'default' : 'secondary'}>
                  {paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button onClick={generateOPDToken} className="flex-1" disabled={loading}>
                  <Clock className="h-4 w-4 mr-2" />
                  {loading ? 'Generating...' : 'Generate Token'}
                </Button>
                {generatedToken && paymentStatus === 'pending' && (
                  <Button onClick={handlePayment} variant="outline" disabled={loading}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {generatedToken && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generated Token
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-6 bg-green-50 rounded-lg border-2 border-green-200">
                <div className="text-sm text-gray-600 mb-2">Queue Number</div>
                <h2 className="text-5xl font-bold text-red-600">{queueNumber}</h2>
                <p className="text-gray-600 mt-3">Token #{generatedToken.token_number}</p>
                <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-PK')}</p>
                <Badge className="mt-2" variant={generatedToken.payment_status === 'paid' ? 'default' : 'secondary'}>
                  {generatedToken.payment_status === 'paid' ? 'Payment Completed' : 'Payment Pending'}
                </Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Patient: {selectedPatient.name}</p>
                  <p className="text-sm text-gray-600">{selectedPatient.contact}</p>
                </div>
                <div>
                  <p className="font-medium">Doctor: Dr. {selectedDoctor?.name}</p>
                  <p className="text-sm text-gray-600">{selectedDoctor?.department}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={printToken} variant="outline" size="sm">
                  <Printer className="h-3 w-3 mr-2" />
                  Print Token
                </Button>
                <Button onClick={printPrescription} variant="outline" size="sm">
                  <Printer className="h-3 w-3 mr-2" />
                  Print Prescription
                </Button>
                <Button onClick={printReceipt} variant="outline" size="sm">
                  <Printer className="h-3 w-3 mr-2" />
                  Print Receipt
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <ConsentModal
        isOpen={showConsentModal}
        consentType="opd"
        patientName={selectedPatient?.name || ''}
        procedureName={`OPD Consultation with Dr. ${selectedDoctor?.name}`}
        onAccept={handleConsentAccepted}
        onDecline={handleConsentDeclined}
      />
    </div>
  );
}
