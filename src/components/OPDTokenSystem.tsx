import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Printer, Clock, User, Stethoscope, CreditCard } from 'lucide-react';
import { Patient, generateId, generateTokenNumber, formatCurrency } from '@/lib/hospitalData';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import ConsentModal from '@/components/ConsentModal';
import ReceiptTemplate from '@/components/documents/ReceiptTemplate';
import DocumentViewer from '@/components/documents/DocumentViewer';

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
  const [shouldPrintReceipt, setShouldPrintReceipt] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Get today's queue number for selected doctor
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

      // Count tokens for this doctor today
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

    // Show consent modal first
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

  const handlePrintReceipt = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `OPD-Receipt-${selectedPatient?.name || 'Unknown'}`,
    onAfterPrint: () => {
      toast.success('OPD receipt printed successfully');
      setShouldPrintReceipt(false);
    },
  });

  const printOPDReceipt = () => {
    if (!generatedToken || !selectedPatient || !selectedDoctor) {
      toast.error('Missing OPD details');
      return;
    }
    setShouldPrintReceipt(true);
    setTimeout(() => {
      handlePrintReceipt();
    }, 100);
  };

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
            .logo { width: 80px; height: 80px; margin: 0 auto 10px; }
            .hospital-name { font-size: 22px; font-weight: bold; color: #333; margin: 5px 0; }
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
              <img src="/logo.png" alt="Logo" class="logo" />
              <div class="hospital-name">North Karachi Hospital</div>
              <div class="subtitle">OPD Token</div>
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
              Please wait for your turn. Show this token to the doctor.
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

  const printPrescriptionSheet = () => {
    if (!selectedPatient || !selectedDoctor) return;

    const prescriptionContent = `
      <html>
        <head>
          <title>Prescription - ${selectedPatient.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 700px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 3px solid #e74c3c; padding-bottom: 15px; margin-bottom: 25px; }
            .logo { width: 100px; height: 100px; margin: 0 auto 10px; }
            .hospital-name { font-size: 28px; font-weight: bold; color: #333; margin: 5px 0; }
            .subtitle { color: #666; font-size: 16px; }
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
              <img src="/logo.png" alt="Logo" class="logo" />
              <div class="hospital-name">North Karachi Hospital</div>
              <div class="subtitle">Prescription & Medical Record</div>
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
      printWindow.document.write(prescriptionContent);
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

              <div className="flex gap-2">
                <Button onClick={printToken} variant="outline" className="flex-1">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Token
                </Button>
                <Button onClick={printPrescriptionSheet} variant="outline" className="flex-1">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Prescription
                </Button>
                <Button onClick={printOPDReceipt} variant="outline" className="flex-1">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
              </div>

              <Separator />

              {/* Uploaded Document Templates */}
              <div className="space-y-3">
                <DocumentViewer
                  moduleName="opd"
                  documentType="receipt"
                  title="OPD Receipt Template"
                />
                <DocumentViewer
                  moduleName="opd"
                  documentType="consent_form"
                  title="OPD Consent Form"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* OPD Consent Modal */}
      <ConsentModal
        isOpen={showConsentModal}
        consentType="opd"
        patientName={selectedPatient?.name || ''}
        procedureName={`OPD Consultation with Dr. ${selectedDoctor?.name}`}
        onAccept={handleConsentAccepted}
        onDecline={handleConsentDeclined}
      />

      {/* Hidden Receipt Template for OPD Printing */}
      {shouldPrintReceipt && selectedPatient && selectedDoctor && generatedToken && (
        <div style={{ display: 'none' }}>
          <ReceiptTemplate
            ref={receiptRef}
            data={{
              receiptNumber: `OPD-${generatedToken.id.slice(-8).toUpperCase()}`,
              date: generatedToken.date,
              patientName: selectedPatient.name,
              patientContact: selectedPatient.contact,
              items: [
                {
                  description: `OPD Consultation Fee\nDoctor: Dr. ${selectedDoctor.name}\nDepartment: ${selectedDoctor.department}\nToken #${generatedToken.token_number} | Queue #${queueNumber}`,
                  amount: selectedDoctor.opd_fee,
                },
              ],
              total: selectedDoctor.opd_fee,
              paymentStatus: generatedToken.payment_status === 'paid' ? 'paid' : 'unpaid',
              amountPaid: generatedToken.payment_status === 'paid' ? selectedDoctor.opd_fee : 0,
              balanceDue: generatedToken.payment_status === 'paid' ? 0 : selectedDoctor.opd_fee,
            }}
          />
        </div>
      )}
    </div>
  );
}
