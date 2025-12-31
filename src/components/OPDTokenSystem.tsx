import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Printer, Clock, User, Stethoscope, CreditCard, UserCheck, Percent, DollarSign } from 'lucide-react';
import { Patient, generateTokenNumber, formatCurrency } from '@/lib/hospitalData';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';

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
  const [referredBy, setReferredBy] = useState<string>('');
  const [patientTokens, setPatientTokens] = useState<OPDToken[]>([]);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Calculate discounted fee
  const calculateDiscountedFee = (originalFee: number): { discountAmount: number; finalFee: number } => {
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (originalFee * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }
    // Ensure discount doesn't exceed original fee
    discountAmount = Math.min(discountAmount, originalFee);
    const finalFee = originalFee - discountAmount;
    return { discountAmount, finalFee };
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      getQueueNumber(selectedDoctor.id);
    }
  }, [selectedDoctor]);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientTokens();
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

    setLoading(true);

    try {
      const { finalFee } = calculateDiscountedFee(selectedDoctor.opd_fee);
      const tokenData = {
        token_number: generateTokenNumber(),
        patient_id: selectedPatient.id,
        doctor_id: selectedDoctor.id,
        date: new Date().toISOString().split('T')[0],
        status: 'waiting',
        fee: finalFee,
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
      toast.success('OPD Token generated successfully!');
    } catch (error) {
      console.error('Error creating token:', error);
      toast.error('Failed to generate token');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientTokens = async () => {
    if (!selectedPatient) return;

    try {
      const { data, error } = await db.opdTokens.getAll();
      if (error) {
        console.error('Error fetching patient tokens:', error);
        return;
      }

      const patientSpecificTokens = data?.filter(
        token => token.patient_id === selectedPatient.id
      ) || [];

      // Sort by date descending (newest first)
      patientSpecificTokens.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setPatientTokens(patientSpecificTokens);
    } catch (error) {
      console.error('Error fetching patient tokens:', error);
    }
  };

  const recordPaymentForToken = async (tokenId: string) => {
    setLoading(true);
    try {
      const { error } = await db.opdTokens.update(tokenId, {
        payment_status: 'paid'
      });

      if (error) {
        console.error('Error recording payment:', error);
        toast.error('Failed to record payment');
        setLoading(false);
        return;
      }

      toast.success('Payment recorded successfully!');

      // Refresh patient tokens list
      fetchPatientTokens();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
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
            @page { size: 80mm auto; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Arial', sans-serif;
              width: 80mm;
              padding: 3mm;
              font-size: 11px;
            }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 3mm; margin-bottom: 3mm; }
            .hospital-name { font-size: 14px; font-weight: bold; }
            .hospital-urdu { font-size: 12px; }
            .subtitle { font-size: 10px; margin-top: 2px; }
            .queue-box { background: #000; color: white; padding: 3mm; text-align: center; margin: 3mm 0; }
            .queue-number { font-size: 36px; font-weight: bold; }
            .queue-label { font-size: 10px; }
            .info-row { display: flex; justify-content: space-between; font-size: 10px; margin: 2mm 0; }
            .info-section { margin: 2mm 0; font-size: 10px; line-height: 1.4; }
            .info-label { font-weight: bold; }
            .mr-number { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 2mm 0; }
            .footer { text-align: center; font-size: 9px; margin-top: 3mm; padding-top: 2mm; border-top: 1px dashed #000; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="hospital-name">North Karachi Hospital</div>
            <div class="hospital-urdu">نارتھ کراچی ہسپتال</div>
            <div class="subtitle">OPD Token / او پی ڈی ٹوکن</div>
          </div>

          <div class="queue-box">
            <div class="queue-number">${queueNumber}</div>
            <div class="queue-label">QUEUE NUMBER</div>
          </div>

          <div class="info-row">
            <span><strong>Token:</strong> ${generatedToken.token_number}</span>
            <span><strong>Date:</strong> ${new Date().toLocaleDateString('en-PK')}</span>
          </div>

          <div class="divider"></div>

          <div class="info-section">
            <div class="info-label">Patient:</div>
            <div>${selectedPatient.name}</div>
            <div class="mr-number">MR#: ${selectedPatient.mrNumber || 'N/A'}</div>
            <div>${selectedPatient.age}Y / ${selectedPatient.gender} | ${selectedPatient.contact}</div>
            ${referredBy ? `<div><strong>Ref:</strong> ${referredBy}</div>` : ''}
          </div>

          <div class="divider"></div>

          <div class="info-section">
            <div class="info-label">Doctor:</div>
            <div>Dr. ${selectedDoctor.name}</div>
            <div>${selectedDoctor.department}</div>
          </div>

          <div class="divider"></div>

          <div class="info-row" style="flex-direction: column;">
            ${discountValue > 0 ? `
              <div style="display: flex; justify-content: space-between;">
                <span>Original Fee:</span>
                <span style="text-decoration: line-through;">${formatCurrency(selectedDoctor.opd_fee)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; color: green;">
                <span>Discount (${discountType === 'percentage' ? discountValue + '%' : 'Fixed'}):</span>
                <span>-${formatCurrency(calculateDiscountedFee(selectedDoctor.opd_fee).discountAmount)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: bold;">
                <span>Final Fee:</span>
                <span>${formatCurrency(generatedToken.fee)}</span>
              </div>
            ` : `
              <div style="display: flex; justify-content: space-between;">
                <span><strong>Fee:</strong></span>
                <span>${formatCurrency(generatedToken.fee)}</span>
              </div>
            `}
            <div style="text-align: right; margin-top: 2mm;">
              <strong>${generatedToken.payment_status.toUpperCase()}</strong>
            </div>
          </div>

          <div class="footer">
            Please wait for your turn<br>
            براہ کرم اپنی باری کا انتظار کریں
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
            @page { size: 80mm auto; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Arial', sans-serif;
              width: 80mm;
              padding: 3mm;
              font-size: 10px;
            }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 2mm; margin-bottom: 2mm; }
            .hospital-name { font-size: 13px; font-weight: bold; }
            .hospital-urdu { font-size: 11px; }
            .address { font-size: 8px; margin-top: 1mm; }
            .receipt-title { background: #000; color: white; padding: 2mm; text-align: center; font-size: 12px; font-weight: bold; margin: 2mm 0; }
            .info-row { display: flex; justify-content: space-between; font-size: 9px; margin: 1mm 0; }
            .divider { border-top: 1px dashed #000; margin: 2mm 0; }
            .patient-section { font-size: 9px; line-height: 1.4; margin: 2mm 0; }
            .item-row { display: flex; justify-content: space-between; font-size: 9px; padding: 1mm 0; border-bottom: 1px dotted #ccc; }
            .total-section { margin: 2mm 0; padding: 2mm; background: #f0f0f0; }
            .total-row { display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; }
            .status { text-align: center; padding: 2mm; margin-top: 2mm; font-weight: bold; font-size: 11px; }
            .status.paid { background: #000; color: white; }
            .status.unpaid { border: 2px solid #000; }
            .footer { text-align: center; font-size: 8px; margin-top: 3mm; padding-top: 2mm; border-top: 1px dashed #000; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="hospital-name">North Karachi Hospital</div>
            <div class="hospital-urdu">نارتھ کراچی ہسپتال</div>
            <div class="address">C-122, Sector 11-B, North Karachi | 36989080</div>
          </div>

          <div class="receipt-title">RECEIPT / رسید</div>

          <div class="info-row">
            <span><strong>No:</strong> ${receiptNumber}</span>
            <span><strong>Date:</strong> ${new Date().toLocaleDateString('en-PK')}</span>
          </div>

          <div class="divider"></div>

          <div class="patient-section">
            <div><strong>Patient:</strong> ${selectedPatient.name}</div>
            <div><strong>MR#:</strong> ${selectedPatient.mrNumber || 'N/A'}</div>
            <div>${selectedPatient.age}Y / ${selectedPatient.gender} | ${selectedPatient.contact}</div>
            ${referredBy ? `<div><strong>Ref:</strong> ${referredBy}</div>` : ''}
          </div>

          <div class="divider"></div>

          <div class="item-row">
            <span>OPD Fee - Dr. ${selectedDoctor.name}</span>
            <span>${formatCurrency(selectedDoctor.opd_fee)}</span>
          </div>
          <div style="font-size: 8px; color: #666;">Token #${generatedToken.token_number} | Queue #${queueNumber}</div>

          ${discountValue > 0 ? `
          <div class="item-row" style="color: green;">
            <span>Discount (${discountType === 'percentage' ? discountValue + '%' : 'Fixed'}) / رعایت</span>
            <span>-${formatCurrency(calculateDiscountedFee(selectedDoctor.opd_fee).discountAmount)}</span>
          </div>
          ` : ''}

          <div class="total-section">
            <div class="total-row">
              <span>TOTAL / کل:</span>
              <span>${formatCurrency(generatedToken.fee)}</span>
            </div>
            ${discountValue > 0 ? `
            <div style="font-size: 8px; text-align: right; color: green;">
              You saved ${formatCurrency(calculateDiscountedFee(selectedDoctor.opd_fee).discountAmount)}!
            </div>
            ` : ''}
          </div>

          <div class="status ${isPaid ? 'paid' : 'unpaid'}">
            ${isPaid ? '✓ PAID / ادا شدہ' : '✗ UNPAID / غیر ادا شدہ'}
          </div>

          <div class="footer">
            Thank you / شکریہ<br>
            ${new Date().toLocaleString('en-PK')}
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
            @page { size: A4; margin: 50mm 25mm 20mm 25mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              font-size: 14px;
              line-height: 1.5;
              width: 100%;
              max-width: 210mm;
              display: flex;
              flex-direction: column;
              min-height: 100%;
            }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px; }
            .patient-box { padding: 10px 0; border-bottom: 1px solid #ccc; margin-bottom: 15px; font-size: 14px; line-height: 1.6; }
            .blank-area { flex: 1; min-height: 280px; }
            .bottom-sections { margin-top: auto; }
            .section { margin-bottom: 12px; }
            .section-title { font-weight: bold; font-size: 15px; color: #000; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 8px; }
            .write-area { min-height: 80px; border: 1px solid #999; padding: 8px; background: #fafafa; }
            .two-col { display: flex; gap: 15px; }
            .two-col > div { flex: 1; }
            .signature { margin-top: 20px; text-align: right; }
            .signature-line { border-top: 1px solid #333; width: 200px; margin-left: auto; padding-top: 6px; font-size: 13px; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="info-row">
            <div>
              <strong>Date:</strong> ${new Date().toLocaleDateString('en-PK')} &nbsp;&nbsp;
              <strong>Token:</strong> ${generatedToken?.token_number || 'N/A'} &nbsp;&nbsp;
              <strong>Queue:</strong> ${queueNumber}
            </div>
            <div style="text-align: right;">
              <strong>Dr. ${selectedDoctor.name}</strong> &nbsp;|&nbsp; ${selectedDoctor.department} &nbsp;|&nbsp; ${selectedDoctor.specialization}
            </div>
          </div>

          <div class="patient-box">
            <strong>Patient:</strong> ${selectedPatient.name} &nbsp;&nbsp;
            <strong>MR#:</strong> ${selectedPatient.mrNumber || 'N/A'} &nbsp;&nbsp;
            <strong>Age:</strong> ${selectedPatient.age}Y &nbsp;&nbsp;
            <strong>Gender:</strong> ${selectedPatient.gender} &nbsp;&nbsp;
            <strong>Contact:</strong> ${selectedPatient.contact}
            ${referredBy ? ` &nbsp;&nbsp;<strong>Referred By:</strong> ${referredBy}` : ''}
            <br><strong>Chief Complaint:</strong> ${selectedPatient.problem || 'N/A'}
          </div>

          <div class="blank-area"></div>

          <div class="bottom-sections">
            <div class="two-col">
              <div class="section">
                <div class="section-title">Diagnosis</div>
                <div class="write-area"></div>
              </div>
              <div class="section">
                <div class="section-title">Advice & Follow-up</div>
                <div class="write-area"></div>
              </div>
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
            <p className="text-blue-600 font-semibold"><strong>MR Number:</strong> {selectedPatient.mrNumber || 'N/A'}</p>
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
              {/* Referred By Field */}
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <Label htmlFor="referredBy" className="flex items-center gap-2 mb-2">
                  <UserCheck className="h-4 w-4 text-amber-600" />
                  Referred By / حوالہ دہندہ
                </Label>
                <Input
                  id="referredBy"
                  value={referredBy}
                  onChange={(e) => setReferredBy(e.target.value)}
                  placeholder="Enter referral name (Doctor, Clinic, Hospital, Person)"
                  className="bg-white"
                />
                <p className="text-xs text-amber-600 mt-1">Optional - Enter if patient was referred by someone</p>
              </div>

              {/* Discount Section */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <Label className="flex items-center gap-2 mb-3">
                  <Percent className="h-4 w-4 text-green-600" />
                  Discount / رعایت
                </Label>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label htmlFor="discountType" className="text-xs text-gray-600 mb-1 block">Type</Label>
                    <Select value={discountType} onValueChange={(val: 'percentage' | 'fixed') => setDiscountType(val)}>
                      <SelectTrigger className="bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">
                          <span className="flex items-center gap-1"><Percent className="h-3 w-3" /> Percentage (%)</span>
                        </SelectItem>
                        <SelectItem value="fixed">
                          <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> Fixed Amount (Rs.)</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="discountValue" className="text-xs text-gray-600 mb-1 block">
                      {discountType === 'percentage' ? 'Percentage' : 'Amount'}
                    </Label>
                    <Input
                      id="discountValue"
                      type="number"
                      min="0"
                      max={discountType === 'percentage' ? 100 : selectedDoctor.opd_fee}
                      value={discountValue || ''}
                      onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                      placeholder={discountType === 'percentage' ? 'e.g. 10' : 'e.g. 100'}
                      className="bg-white"
                    />
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">Optional - Apply discount if applicable</p>
              </div>

              {/* Fee Display with Discount */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Original OPD Fee</p>
                    <p className={`text-lg font-semibold ${discountValue > 0 ? 'line-through text-gray-400' : 'text-blue-600'}`}>
                      {formatCurrency(selectedDoctor.opd_fee)}
                    </p>

                    {discountValue > 0 && (
                      <>
                        <p className="text-sm text-green-600 mt-1">
                          Discount: {discountType === 'percentage' ? `${discountValue}%` : formatCurrency(discountValue)}
                          {' = '}-{formatCurrency(calculateDiscountedFee(selectedDoctor.opd_fee).discountAmount)}
                        </p>
                        <p className="text-sm font-medium mt-1">Final Fee</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(calculateDiscountedFee(selectedDoctor.opd_fee).finalFee)}
                        </p>
                      </>
                    )}

                    {discountValue === 0 && (
                      <p className="text-2xl font-bold text-blue-600 mt-1">
                        {formatCurrency(selectedDoctor.opd_fee)}
                      </p>
                    )}
                  </div>
                  <Badge variant={paymentStatus === 'paid' ? 'default' : 'secondary'}>
                    {paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                  </Badge>
                </div>
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

      {/* Previous OPD Visits - Payment History */}
      {patientTokens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Previous OPD Visits ({patientTokens.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {patientTokens.map((token) => {
                const tokenDoctor = doctors.find(d => d.id === token.doctor_id);
                return (
                  <Card key={token.id} className={`p-4 ${token.payment_status === 'pending' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Token #{token.token_number}</Badge>
                          <Badge className={token.payment_status === 'paid' ? 'bg-green-500' : 'bg-red-500'}>
                            {token.payment_status === 'paid' ? 'PAID' : 'PENDING'}
                          </Badge>
                          <span className="text-sm text-gray-600">{new Date(token.date).toLocaleDateString('en-PK')}</span>
                        </div>
                        <div className="text-sm text-gray-700">
                          <p><strong>Doctor:</strong> Dr. {tokenDoctor?.name || 'N/A'}</p>
                          <p><strong>Department:</strong> {tokenDoctor?.department || 'N/A'}</p>
                          <p><strong>Fee:</strong> {formatCurrency(token.fee)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {token.payment_status === 'pending' && (
                          <Button
                            onClick={() => recordPaymentForToken(token.id)}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Record Payment
                          </Button>
                        )}
                        {token.payment_status === 'paid' && (
                          <div className="flex items-center gap-1 text-green-700 font-semibold">
                            <CreditCard className="h-4 w-4" />
                            Paid
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
