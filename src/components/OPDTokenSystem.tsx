import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Printer, Clock, User, Stethoscope, CreditCard, UserCheck, Percent, DollarSign, X } from 'lucide-react';
import { Patient, formatCurrency } from '@/lib/hospitalData';
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
  const [nextTokenNumber, setNextTokenNumber] = useState<number>(1);
  const [manualTokenNumber, setManualTokenNumber] = useState<string>('');
  const [useManualToken, setUseManualToken] = useState<boolean>(false);
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
    fetchNextTokenNumber();
  }, []);

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

  const fetchNextTokenNumber = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await db.opdTokens.getAll();

      if (error) {
        console.error('Error fetching tokens:', error);
        return;
      }

      // Get all tokens from today (any doctor) for daily reset
      const todayTokens = data?.filter(
        token => token.date === today
      ) || [];

      // Find the max token number from today
      const maxTokenNumber = todayTokens.reduce((max, token) => {
        return Math.max(max, token.token_number || 0);
      }, 0);

      setNextTokenNumber(maxTokenNumber + 1);
    } catch (error) {
      console.error('Error getting next token number:', error);
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

    // Determine the token number to use
    let tokenNumber: number;
    if (useManualToken && manualTokenNumber) {
      tokenNumber = parseInt(manualTokenNumber, 10);
      if (isNaN(tokenNumber) || tokenNumber < 1) {
        toast.error('Please enter a valid token number');
        return;
      }
    } else {
      tokenNumber = nextTokenNumber;
    }

    setLoading(true);

    try {
      const { finalFee } = calculateDiscountedFee(selectedDoctor.opd_fee);
      const tokenData = {
        token_number: tokenNumber,
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

      // Ensure the token number we used is set correctly (override in case DB returns different)
      setGeneratedToken({ ...data, token_number: tokenNumber });
      // Reset manual token input and set next token to continue the series
      setManualTokenNumber('');
      setUseManualToken(false);
      // Directly set next token number (tokenNumber + 1) so auto continues from current
      setNextTokenNumber(tokenNumber + 1);
      toast.success(`OPD Token #${tokenNumber} generated successfully!`);
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

  const cancelToken = async (tokenId: string, tokenNumber: number) => {
    if (!confirm(`Are you sure you want to cancel Token #${tokenNumber}? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await db.opdTokens.delete(tokenId);

      if (error) {
        console.error('Error cancelling token:', error);
        toast.error('Failed to cancel token');
        setLoading(false);
        return;
      }

      toast.success(`Token #${tokenNumber} cancelled successfully!`);

      // Clear generated token if it's the one being cancelled
      if (generatedToken?.id === tokenId) {
        setGeneratedToken(null);
      }

      // Refresh patient tokens list and next token number
      fetchPatientTokens();
      fetchNextTokenNumber();
    } catch (error) {
      console.error('Error cancelling token:', error);
      toast.error('Failed to cancel token');
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
            <div class="queue-number">${generatedToken.token_number}</div>
            <div class="queue-label">TOKEN NUMBER / ٹوکن نمبر</div>
          </div>

          <div class="info-row">
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
          <div style="font-size: 8px; color: #666;">Token #${generatedToken.token_number}</div>

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
            @page {
              size: A4;
              margin: 45mm 20mm 30mm 20mm;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body {
              height: 100%;
              width: 100%;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 16px;
              line-height: 1.4;
              position: relative;
            }
            .content {
              min-height: 100%;
              position: relative;
              padding-bottom: 160px;
            }
            .header-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #333;
            }
            .queue-box {
              background: #000;
              color: #fff;
              padding: 8px 20px;
              font-size: 22px;
              font-weight: bold;
              border-radius: 5px;
            }
            .doctor-info {
              text-align: right;
              font-size: 20px;
            }
            .doctor-name {
              font-size: 24px;
              font-weight: bold;
              color: #000;
            }
            .doctor-detail {
              font-size: 16px;
              color: #444;
            }
            .patient-box {
              padding: 12px 15px;
              background: #f5f5f5;
              border: 1px solid #ccc;
              border-radius: 5px;
              margin-bottom: 20px;
            }
            .patient-name {
              font-size: 22px;
              font-weight: bold;
              color: #000;
              margin-bottom: 6px;
            }
            .patient-details {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 14px;
              color: #333;
            }
            .patient-details .detail-item {
              white-space: nowrap;
            }
            .rx-symbol {
              font-size: 32px;
              font-weight: bold;
              margin: 15px 0;
              color: #000;
            }
            .prescription-area {
              min-height: 280px;
              border-left: 2px solid #ccc;
              padding-left: 15px;
              margin-bottom: 20px;
            }
            .bottom-sections {
              position: absolute;
              bottom: 38mm;
              left: 0;
              right: 0;
              display: flex;
              gap: 20px;
            }
            .section {
              flex: 1;
            }
            .section-title {
              font-weight: bold;
              font-size: 16px;
              color: #000;
              border-bottom: 1px solid #000;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .write-area {
              min-height: 60px;
              border: 1px solid #999;
              padding: 8px;
              background: #fafafa;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              html, body { height: auto; }
            }
          </style>
        </head>
        <body>
          <div class="content">
            <div class="header-row">
              <div class="queue-box">Token# ${generatedToken?.token_number || nextTokenNumber}</div>
              <div class="doctor-info">
                <div class="doctor-name">Dr. ${selectedDoctor.name}</div>
                <div class="doctor-detail">${selectedDoctor.department} | ${selectedDoctor.specialization}</div>
              </div>
            </div>

            <div class="patient-box">
              <div class="patient-name">${selectedPatient.name}</div>
              <div class="patient-details">
                <span class="detail-item"><strong>MR#:</strong> ${selectedPatient.mrNumber || 'N/A'}</span>
                <span class="detail-item"><strong>Age:</strong> ${selectedPatient.age}Y</span>
                <span class="detail-item"><strong>Gender:</strong> ${selectedPatient.gender}</span>
                <span class="detail-item"><strong>Contact:</strong> ${selectedPatient.contact}</span>
                ${referredBy ? `<span class="detail-item"><strong>Ref:</strong> ${referredBy}</span>` : ''}
              </div>
            </div>

            <div class="rx-symbol">℞</div>

            <div class="prescription-area"></div>

            <div class="bottom-sections">
              <div class="section">
                <div class="section-title">Diagnosis</div>
                <div class="write-area"></div>
              </div>
              <div class="section">
                <div class="section-title">Advice & Follow-up</div>
                <div class="write-area"></div>
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

  // ========== REPRINT FUNCTIONS FOR PREVIOUS VISITS ==========

  const reprintToken = (token: OPDToken, doctor: Doctor) => {
    if (!selectedPatient) return;

    const printContent = `
      <html>
        <head>
          <title>OPD Token - ${token.token_number}</title>
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
            .reprint-badge { background: #ff9800; color: white; padding: 1mm 3mm; font-size: 8px; border-radius: 2mm; display: inline-block; margin-top: 2mm; }
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
            <div class="reprint-badge">REPRINT / دوبارہ پرنٹ</div>
          </div>

          <div class="queue-box">
            <div class="queue-number">${token.token_number}</div>
            <div class="queue-label">TOKEN NUMBER / ٹوکن نمبر</div>
          </div>

          <div class="info-row">
            <span><strong>Date:</strong> ${new Date(token.date).toLocaleDateString('en-PK')}</span>
          </div>

          <div class="divider"></div>

          <div class="info-section">
            <div class="info-label">Patient:</div>
            <div>${selectedPatient.name}</div>
            <div class="mr-number">MR#: ${selectedPatient.mrNumber || 'N/A'}</div>
            <div>${selectedPatient.age}Y / ${selectedPatient.gender} | ${selectedPatient.contact}</div>
          </div>

          <div class="divider"></div>

          <div class="info-section">
            <div class="info-label">Doctor:</div>
            <div>Dr. ${doctor.name}</div>
            <div>${doctor.department}</div>
          </div>

          <div class="divider"></div>

          <div class="info-row" style="flex-direction: column;">
            <div style="display: flex; justify-content: space-between;">
              <span><strong>Fee:</strong></span>
              <span>${formatCurrency(token.fee)}</span>
            </div>
            <div style="text-align: right; margin-top: 2mm;">
              <strong>${token.payment_status.toUpperCase()}</strong>
            </div>
          </div>

          <div class="footer">
            Reprinted: ${new Date().toLocaleString('en-PK')}<br>
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

  const reprintPrescription = (token: OPDToken, doctor: Doctor) => {
    if (!selectedPatient) return;

    const printContent = `
      <html>
        <head>
          <title>Prescription - ${selectedPatient.name}</title>
          <style>
            @page {
              size: A4;
              margin: 45mm 20mm 30mm 20mm;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body {
              height: 100%;
              width: 100%;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 16px;
              line-height: 1.4;
              position: relative;
            }
            .content {
              min-height: 100%;
              position: relative;
              padding-bottom: 160px;
            }
            .header-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #333;
            }
            .queue-box {
              background: #000;
              color: #fff;
              padding: 8px 20px;
              font-size: 22px;
              font-weight: bold;
              border-radius: 5px;
            }
            .reprint-badge {
              background: #ff9800;
              color: white;
              padding: 4px 10px;
              font-size: 10px;
              border-radius: 3px;
              margin-left: 10px;
            }
            .doctor-info {
              text-align: right;
              font-size: 20px;
            }
            .doctor-name {
              font-size: 24px;
              font-weight: bold;
              color: #000;
            }
            .doctor-detail {
              font-size: 16px;
              color: #444;
            }
            .patient-box {
              padding: 12px 15px;
              background: #f5f5f5;
              border: 1px solid #ccc;
              border-radius: 5px;
              margin-bottom: 20px;
            }
            .patient-name {
              font-size: 22px;
              font-weight: bold;
              color: #000;
              margin-bottom: 6px;
            }
            .patient-details {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 14px;
              color: #333;
            }
            .patient-details .detail-item {
              white-space: nowrap;
            }
            .rx-symbol {
              font-size: 32px;
              font-weight: bold;
              margin: 15px 0;
              color: #000;
            }
            .prescription-area {
              min-height: 280px;
              border-left: 2px solid #ccc;
              padding-left: 15px;
              margin-bottom: 20px;
            }
            .bottom-sections {
              position: absolute;
              bottom: 38mm;
              left: 0;
              right: 0;
              display: flex;
              gap: 20px;
            }
            .section {
              flex: 1;
            }
            .section-title {
              font-weight: bold;
              font-size: 16px;
              color: #000;
              border-bottom: 1px solid #000;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .write-area {
              min-height: 60px;
              border: 1px solid #999;
              padding: 8px;
              background: #fafafa;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              html, body { height: auto; }
            }
          </style>
        </head>
        <body>
          <div class="content">
            <div class="header-row">
              <div>
                <span class="queue-box">Token# ${token.token_number}</span>
                <span class="reprint-badge">REPRINT</span>
              </div>
              <div class="doctor-info">
                <div class="doctor-name">Dr. ${doctor.name}</div>
                <div class="doctor-detail">${doctor.department} | ${doctor.specialization}</div>
              </div>
            </div>

            <div class="patient-box">
              <div class="patient-name">${selectedPatient.name}</div>
              <div class="patient-details">
                <span class="detail-item"><strong>MR#:</strong> ${selectedPatient.mrNumber || 'N/A'}</span>
                <span class="detail-item"><strong>Age:</strong> ${selectedPatient.age}Y</span>
                <span class="detail-item"><strong>Gender:</strong> ${selectedPatient.gender}</span>
                <span class="detail-item"><strong>Contact:</strong> ${selectedPatient.contact}</span>
                <span class="detail-item"><strong>Date:</strong> ${new Date(token.date).toLocaleDateString('en-PK')}</span>
              </div>
            </div>

            <div class="rx-symbol">℞</div>

            <div class="prescription-area"></div>

            <div class="bottom-sections">
              <div class="section">
                <div class="section-title">Diagnosis</div>
                <div class="write-area"></div>
              </div>
              <div class="section">
                <div class="section-title">Advice & Follow-up</div>
                <div class="write-area"></div>
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
              <p className="text-sm text-blue-600 mt-1">Next Token Number: {nextTokenNumber}</p>
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

              {/* Token Number Section */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Label className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Token Number / ٹوکن نمبر
                </Label>
                <div className="flex gap-3 items-center mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tokenType"
                      checked={!useManualToken}
                      onChange={() => setUseManualToken(false)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Auto ({nextTokenNumber})</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tokenType"
                      checked={useManualToken}
                      onChange={() => setUseManualToken(true)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Manual</span>
                  </label>
                </div>
                {useManualToken && (
                  <Input
                    type="number"
                    min="1"
                    value={manualTokenNumber}
                    onChange={(e) => setManualTokenNumber(e.target.value)}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    placeholder="Enter token number"
                    className="bg-white"
                  />
                )}
                <p className="text-xs text-blue-600 mt-2">
                  {useManualToken
                    ? 'Enter custom token number to skip or use specific number'
                    : `Token resets daily. Today's next token: ${nextTokenNumber}`}
                </p>
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
                <div className="text-sm text-gray-600 mb-2">Token Number / ٹوکن نمبر</div>
                <h2 className="text-5xl font-bold text-red-600">{generatedToken.token_number}</h2>
                <p className="text-sm text-gray-500 mt-3">{new Date().toLocaleDateString('en-PK')}</p>
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
                <Button
                  onClick={() => cancelToken(generatedToken.id, generatedToken.token_number)}
                  variant="destructive"
                  size="sm"
                  disabled={loading}
                >
                  <X className="h-3 w-3 mr-2" />
                  Cancel Token
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
                      <div className="flex flex-col gap-2">
                        {token.payment_status === 'pending' && (
                          <Button
                            onClick={() => recordPaymentForToken(token.id)}
                            disabled={loading}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CreditCard className="h-3 w-3 mr-1" />
                            Record Payment
                          </Button>
                        )}
                        {token.payment_status === 'paid' && (
                          <div className="flex items-center gap-1 text-green-700 font-semibold text-sm">
                            <CreditCard className="h-4 w-4" />
                            Paid
                          </div>
                        )}
                        {/* Reprint Buttons */}
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => tokenDoctor && reprintToken(token, tokenDoctor)}
                            disabled={!tokenDoctor}
                            className="text-xs"
                          >
                            <Printer className="h-3 w-3 mr-1" />
                            Token
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => tokenDoctor && reprintPrescription(token, tokenDoctor)}
                            disabled={!tokenDoctor}
                            className="text-xs"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Rx
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => cancelToken(token.id, token.token_number)}
                            disabled={loading}
                            className="text-xs"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
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
