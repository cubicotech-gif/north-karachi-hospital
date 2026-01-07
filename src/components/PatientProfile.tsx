import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User, Calendar, FileText, Bed, TestTube, Activity, Clock, Printer,
  Search, CreditCard, Phone, MapPin, Heart, Users, DollarSign,
  AlertCircle, CheckCircle, XCircle, ChevronRight, RefreshCw, FileCheck,
  ClipboardList, Download, Eye, X, Baby, Stethoscope
} from 'lucide-react';
import DeliveryRecordForm from './DeliveryRecordForm';
import NICUObservationForm from './NICUObservationForm';
import BirthCertificateTemplate from './documents/BirthCertificateTemplate';
import { Patient, formatCurrency, generateMRNumber } from '@/lib/hospitalData';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';

// Import patient file form templates
import FileCoverSheet from '@/components/documents/patientForms/FileCoverSheet';
import VisitNotesTemplate from '@/components/documents/patientForms/VisitNotesTemplate';
import VitalsChartTemplate from '@/components/documents/patientForms/VitalsChartTemplate';
import DiagnosisRecordTemplate from '@/components/documents/patientForms/DiagnosisRecordTemplate';
import MedicationChartTemplate from '@/components/documents/patientForms/MedicationChartTemplate';
import AllergiesConditionsTemplate from '@/components/documents/patientForms/AllergiesConditionsTemplate';
import PrescriptionPadTemplate from '@/components/documents/patientForms/PrescriptionPadTemplate';
import FollowupChecklistTemplate from '@/components/documents/patientForms/FollowupChecklistTemplate';

interface PatientProfileProps {
  selectedPatient: Patient | null;
}

export default function PatientProfile({ selectedPatient: initialPatient }: PatientProfileProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(initialPatient);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [history, setHistory] = useState<any>({
    opdTokens: { data: [], error: null },
    admissions: { data: [], error: null },
    labOrders: { data: [], error: null },
    treatments: { data: [], error: null },
    appointments: { data: [], error: null }
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Detail modal states
  const [selectedOPDDetail, setSelectedOPDDetail] = useState<any>(null);
  const [selectedLabDetail, setSelectedLabDetail] = useState<any>(null);
  const [selectedTreatmentDetail, setSelectedTreatmentDetail] = useState<any>(null);
  const [selectedAdmissionDetail, setSelectedAdmissionDetail] = useState<any>(null);

  // Maternity related states
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [showNICUForm, setShowNICUForm] = useState(false);
  const [deliveryRecords, setDeliveryRecords] = useState<any[]>([]);
  const [babyPatients, setBabyPatients] = useState<any[]>([]);
  const [selectedBabyForNICU, setSelectedBabyForNICU] = useState<any>(null);
  const [showBirthCertificate, setShowBirthCertificate] = useState(false);
  const [birthCertificateData, setBirthCertificateData] = useState<any>(null);

  // Baby management states
  const [selectedBabyForActions, setSelectedBabyForActions] = useState<any>(null);
  const [showBabyActionsDialog, setShowBabyActionsDialog] = useState(false);
  const [babyNicuObservations, setBabyNicuObservations] = useState<any[]>([]);
  const [babyDeliveryRecord, setBabyDeliveryRecord] = useState<any>(null);
  const [loadingBabyData, setLoadingBabyData] = useState(false);

  // Cancellation states
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Refs for patient file forms printing
  const birthCertificateRef = useRef<HTMLDivElement>(null);
  const coverSheetRef = useRef<HTMLDivElement>(null);
  const visitNotesRef = useRef<HTMLDivElement>(null);
  const vitalsChartRef = useRef<HTMLDivElement>(null);
  const diagnosisRecordRef = useRef<HTMLDivElement>(null);
  const medicationChartRef = useRef<HTMLDivElement>(null);
  const allergiesConditionsRef = useRef<HTMLDivElement>(null);
  const prescriptionPadRef = useRef<HTMLDivElement>(null);
  const followupChecklistRef = useRef<HTMLDivElement>(null);

  // Update selected patient when prop changes
  useEffect(() => {
    if (initialPatient) {
      setSelectedPatient(initialPatient);
    }
  }, [initialPatient]);

  useEffect(() => {
    if (selectedPatient) {
      loadPatientHistory();
    }
  }, [selectedPatient]);

  const loadPatientHistory = async () => {
    if (!selectedPatient) return;

    setLoading(true);
    try {
      const historyData = await db.patientHistory.getByPatientId(selectedPatient.id);
      setHistory(historyData);

      // Load maternity data if female patient
      if (selectedPatient.gender === 'Female') {
        loadMaternityData();
      }
    } catch (error) {
      console.error('Error loading patient history:', error);
      toast.error('Failed to load patient history');
    } finally {
      setLoading(false);
    }
  };

  // Load maternity-related data (delivery records, babies)
  const loadMaternityData = async () => {
    if (!selectedPatient) return;

    try {
      // Load delivery records for this mother
      const { data: deliveries, error: deliveryError } = await db.deliveryRecords.getByMotherPatientId(selectedPatient.id);
      if (!deliveryError && deliveries) {
        setDeliveryRecords(deliveries);
      }

      // Load baby patients linked to this mother
      const { data: babies, error: babiesError } = await db.babyPatients.getByMotherId(selectedPatient.id);
      if (!babiesError && babies) {
        setBabyPatients(babies);
      }
    } catch (error) {
      console.error('Error loading maternity data:', error);
    }
  };

  // Load data for a specific baby (for baby actions dialog)
  const loadBabyData = async (baby: any) => {
    setLoadingBabyData(true);
    try {
      // Load NICU observations for this baby
      const { data: nicuData, error: nicuError } = await db.nicuObservations.getByBabyPatientId(baby.id);
      if (!nicuError && nicuData) {
        setBabyNicuObservations(nicuData);
      }

      // Find delivery record for this baby
      const { data: deliveryData, error: deliveryError } = await db.deliveryRecords.getByBabyPatientId(baby.id);
      if (!deliveryError && deliveryData) {
        setBabyDeliveryRecord(deliveryData);
      }
    } catch (error) {
      console.error('Error loading baby data:', error);
    } finally {
      setLoadingBabyData(false);
    }
  };

  // Open baby actions dialog
  const openBabyActions = (baby: any) => {
    setSelectedBabyForActions({
      ...baby,
      mother_patient_id: baby.mother_patient_id || selectedPatient?.id
    });
    loadBabyData(baby);
    setShowBabyActionsDialog(true);
  };

  // Calculate age in days
  const getAgeInDays = (createdAt: string) => {
    const birth = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - birth.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Calculate NICU charges for a baby
  const calculateBabyNicuCharges = () => {
    return babyNicuObservations.reduce((sum, obs) => {
      return sum + (obs.total_charge || 0);
    }, 0);
  };

  // ======= CANCELLATION FUNCTIONS =======
  const cancelOPDToken = async (tokenId: string) => {
    if (!window.confirm('Are you sure you want to cancel this OPD token?')) return;

    setCancellingId(tokenId);
    try {
      const { error } = await db.opdTokens.update(tokenId, {
        status: 'cancelled'
      });

      if (error) {
        console.error('Cancel OPD error:', error);
        toast.error('Failed to cancel OPD token');
        return;
      }

      toast.success('OPD token cancelled successfully');
      loadPatientHistory(); // Refresh data
    } catch (error) {
      console.error('Error cancelling OPD token:', error);
      toast.error('Failed to cancel OPD token');
    } finally {
      setCancellingId(null);
    }
  };

  const cancelLabOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this lab order?')) return;

    setCancellingId(orderId);
    try {
      const { error } = await db.labOrders.update(orderId, {
        status: 'cancelled'
      });

      if (error) {
        console.error('Cancel Lab error:', error);
        toast.error('Failed to cancel lab order');
        return;
      }

      toast.success('Lab order cancelled successfully');
      loadPatientHistory();
    } catch (error) {
      console.error('Error cancelling lab order:', error);
      toast.error('Failed to cancel lab order');
    } finally {
      setCancellingId(null);
    }
  };

  const cancelTreatment = async (treatmentId: string) => {
    if (!window.confirm('Are you sure you want to cancel this treatment?')) return;

    setCancellingId(treatmentId);
    try {
      const { error } = await db.treatments.update(treatmentId, {
        status: 'cancelled'
      });

      if (error) {
        console.error('Cancel Treatment error:', error);
        toast.error('Failed to cancel treatment');
        return;
      }

      toast.success('Treatment cancelled successfully');
      loadPatientHistory();
    } catch (error) {
      console.error('Error cancelling treatment:', error);
      toast.error('Failed to cancel treatment');
    } finally {
      setCancellingId(null);
    }
  };

  const cancelAdmission = async (admissionId: string) => {
    if (!window.confirm('Are you sure you want to cancel this admission?')) return;

    setCancellingId(admissionId);
    try {
      const { error } = await db.admissions.update(admissionId, {
        status: 'cancelled'
      });

      if (error) {
        console.error('Cancel Admission error:', error);
        toast.error('Failed to cancel admission');
        return;
      }

      toast.success('Admission cancelled successfully');
      loadPatientHistory();
    } catch (error) {
      console.error('Error cancelling admission:', error);
      toast.error('Failed to cancel admission');
    } finally {
      setCancellingId(null);
    }
  };

  // ======= ACCOUNTS CALCULATION =======
  const calculatePatientAccounts = () => {
    // OPD Fees
    const opdData = history.opdTokens?.data || [];
    const activeOPD = opdData.filter((t: any) => t.status !== 'cancelled' && !t.is_cancelled);
    const totalOPDFees = activeOPD.reduce((sum: number, t: any) => sum + (t.fee || 0), 0);
    const paidOPDFees = activeOPD.filter((t: any) => t.payment_status === 'paid').reduce((sum: number, t: any) => sum + (t.fee || 0), 0);

    // Lab Fees
    const labData = history.labOrders?.data || [];
    const activeLabs = labData.filter((l: any) => l.status !== 'cancelled' && !l.is_cancelled);
    const totalLabFees = activeLabs.reduce((sum: number, l: any) => sum + (l.total_amount || 0), 0);
    const paidLabFees = activeLabs.filter((l: any) => l.payment_status === 'paid').reduce((sum: number, l: any) => sum + (l.total_amount || 0), 0);

    // Treatment Fees
    const treatmentData = history.treatments?.data || [];
    const activeTreatments = treatmentData.filter((t: any) => t.status !== 'cancelled' && !t.is_cancelled);
    const totalTreatmentFees = activeTreatments.reduce((sum: number, t: any) => sum + (t.price || 0), 0);
    const paidTreatmentFees = activeTreatments.filter((t: any) => t.payment_status === 'paid').reduce((sum: number, t: any) => sum + (t.price || 0), 0);

    // Admission Deposits
    const admissionData = history.admissions?.data || [];
    const activeAdmissions = admissionData.filter((a: any) => a.status !== 'cancelled' && !a.is_cancelled);
    const totalDeposits = activeAdmissions.reduce((sum: number, a: any) => sum + (a.deposit || 0), 0);

    // Baby NICU charges (if mother)
    let babyCharges = 0;
    babyPatients.forEach((baby: any) => {
      // Note: Baby NICU charges need to be fetched separately if not already loaded
    });

    const totalCharges = totalOPDFees + totalLabFees + totalTreatmentFees;
    const totalPaid = paidOPDFees + paidLabFees + paidTreatmentFees;
    const totalBalance = totalCharges - totalPaid;

    return {
      opd: { total: totalOPDFees, paid: paidOPDFees, count: activeOPD.length },
      lab: { total: totalLabFees, paid: paidLabFees, count: activeLabs.length },
      treatment: { total: totalTreatmentFees, paid: paidTreatmentFees, count: activeTreatments.length },
      admission: { deposits: totalDeposits, count: activeAdmissions.length },
      totalCharges,
      totalPaid,
      totalBalance,
      depositsReceived: totalDeposits
    };
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter MR number, name, or contact to search');
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await db.patients.search(searchQuery);

      if (error) {
        console.error('Error searching patients:', error);
        toast.error('Search failed');
        return;
      }

      const patientsData = data?.map((p: any) => ({
        id: p.id,
        mrNumber: p.mr_number,
        name: p.name,
        age: p.age,
        dateOfBirth: p.date_of_birth,
        cnicNumber: p.cnic_number,
        gender: p.gender,
        contact: p.contact,
        careOf: p.care_of,
        problem: p.problem,
        department: p.department,
        registrationDate: p.registration_date,
        medicalHistory: p.medical_history,
        emergencyContact: p.emergency_contact,
        address: p.address,
        bloodGroup: p.blood_group,
        maritalStatus: p.marital_status
      })) || [];

      setPatients(patientsData);

      if (patientsData.length === 0) {
        toast.info('No patients found');
      } else if (patientsData.length === 1) {
        // Auto-select if only one result
        setSelectedPatient(patientsData[0]);
        toast.success(`Found: ${patientsData[0].name}`);
      } else {
        toast.success(`Found ${patientsData.length} patients`);
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  // Print MR Card function
  const printMRCard = (patient: Patient) => {
    const cardContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>MR Card - ${patient.mrNumber}</title>
        <style>
          @page { size: 85mm 54mm; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Tahoma', 'Arial', sans-serif; background: #fff; }
          .card { width: 85mm; height: 54mm; padding: 4mm; border: 2px solid #1a5f2a; border-radius: 3mm; background: linear-gradient(135deg, #f0f9f0 0%, #ffffff 100%); }
          .header { display: flex; align-items: center; gap: 3mm; border-bottom: 1px solid #1a5f2a; padding-bottom: 2mm; margin-bottom: 2mm; }
          .logo { width: 12mm; height: 12mm; object-fit: contain; }
          .hospital-name { font-size: 10pt; font-weight: bold; color: #1a5f2a; }
          .hospital-name-urdu { font-size: 9pt; color: #1a5f2a; direction: rtl; }
          .mr-number { background: #1a5f2a; color: white; padding: 2mm 4mm; font-size: 14pt; font-weight: bold; text-align: center; border-radius: 2mm; margin: 2mm 0; font-family: 'Courier New', monospace; }
          .patient-info { font-size: 8pt; line-height: 1.4; }
          .patient-name { font-size: 10pt; font-weight: bold; margin-bottom: 1mm; }
          .info-row { display: flex; gap: 3mm; }
          .label { color: #666; min-width: 15mm; }
          .footer { font-size: 6pt; color: #888; text-align: center; margin-top: 2mm; border-top: 1px dashed #ccc; padding-top: 1mm; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <img src="/logo.png" class="logo" onerror="this.style.display='none'" />
            <div>
              <div class="hospital-name">NORTH KARACHI HOSPITAL</div>
              <div class="hospital-name-urdu">نارتھ کراچی ہسپتال</div>
            </div>
          </div>
          <div class="mr-number">${patient.mrNumber}</div>
          <div class="patient-info">
            <div class="patient-name">${patient.name}</div>
            <div class="info-row"><span class="label">Age/Gender:</span><span>${patient.age} years / ${patient.gender}</span></div>
            <div class="info-row"><span class="label">Contact:</span><span>${patient.contact}</span></div>
            ${patient.bloodGroup ? `<div class="info-row"><span class="label">Blood:</span><span>${patient.bloodGroup}</span></div>` : ''}
          </div>
          <div class="footer">Keep this card safe. Present at every visit. | یہ کارڈ محفوظ رکھیں</div>
        </div>
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(cardContent);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    }
  };

  // Print handler functions for patient file forms
  const handlePrintFileCoverSheet = useReactToPrint({
    contentRef: coverSheetRef,
    documentTitle: 'Patient-File-Cover-Sheet',
    onAfterPrint: () => toast.success('File Cover Sheet printed'),
  });

  const handlePrintVisitNotes = useReactToPrint({
    contentRef: visitNotesRef,
    documentTitle: 'Visit-Notes-Template',
    onAfterPrint: () => toast.success('Visit Notes printed'),
  });

  const handlePrintVitalsChart = useReactToPrint({
    contentRef: vitalsChartRef,
    documentTitle: 'Vitals-Chart-Template',
    onAfterPrint: () => toast.success('Vitals Chart printed'),
  });

  const handlePrintDiagnosisRecord = useReactToPrint({
    contentRef: diagnosisRecordRef,
    documentTitle: 'Diagnosis-Record-Template',
    onAfterPrint: () => toast.success('Diagnosis Record printed'),
  });

  const handlePrintMedicationChart = useReactToPrint({
    contentRef: medicationChartRef,
    documentTitle: 'Medication-Chart-Template',
    onAfterPrint: () => toast.success('Medication Chart printed'),
  });

  const handlePrintAllergiesConditions = useReactToPrint({
    contentRef: allergiesConditionsRef,
    documentTitle: 'Allergies-Conditions-Template',
    onAfterPrint: () => toast.success('Allergies & Conditions printed'),
  });

  const handlePrintPrescriptionPad = useReactToPrint({
    contentRef: prescriptionPadRef,
    documentTitle: 'Prescription-Pad-Template',
    onAfterPrint: () => toast.success('Prescription Pad printed'),
  });

  const handlePrintFollowupChecklist = useReactToPrint({
    contentRef: followupChecklistRef,
    documentTitle: 'Followup-Checklist-Template',
    onAfterPrint: () => toast.success('Follow-up Checklist printed'),
  });

  // Print all patient file forms at once
  const handlePrintAllPatientFileForms = () => {
    if (!selectedPatient) return;
    toast.info('Printing all patient file forms...');
    setTimeout(() => handlePrintFileCoverSheet(), 100);
    setTimeout(() => handlePrintAllergiesConditions(), 1000);
    setTimeout(() => handlePrintVisitNotes(), 2000);
    setTimeout(() => handlePrintVitalsChart(), 3000);
    setTimeout(() => handlePrintDiagnosisRecord(), 4000);
    setTimeout(() => handlePrintMedicationChart(), 5000);
    setTimeout(() => handlePrintPrescriptionPad(), 6000);
    setTimeout(() => handlePrintFollowupChecklist(), 7000);
  };

  // Print birth certificate handler
  const handlePrintBirthCertificate = useReactToPrint({
    contentRef: birthCertificateRef,
    documentTitle: 'Birth_Certificate',
    onAfterPrint: () => {
      toast.success('Birth certificate printed');
    }
  });

  // Reprint Birth Certificate from delivery record
  const reprintBirthCertificate = (deliveryRecord: any) => {
    if (!selectedPatient) return;

    const dateObj = new Date(deliveryRecord.delivery_date);
    const certData = {
      serialNumber: deliveryRecord.birth_certificate_number || 'N/A',
      date: new Date().toLocaleDateString('en-GB'),
      babyGender: deliveryRecord.baby_gender as 'Male' | 'Female',
      weightKg: Math.floor(deliveryRecord.baby_weight_kg || 0),
      weightGrams: deliveryRecord.baby_weight_grams || Math.round(((deliveryRecord.baby_weight_kg || 0) % 1) * 1000),
      motherName: selectedPatient.name,
      fatherName: selectedPatient.care_of || '',
      address: selectedPatient.address || '',
      birthDay: dateObj.getDate().toString(),
      birthMonth: (dateObj.getMonth() + 1).toString(),
      birthYear: dateObj.getFullYear().toString(),
      birthTime: deliveryRecord.delivery_time || '',
      attendingObstetrician: deliveryRecord.doctors?.name || '',
    };

    setBirthCertificateData(certData);
    setTimeout(() => {
      setShowBirthCertificate(true);
    }, 50);
  };

  // Reprint OPD Receipt
  const reprintOPDReceipt = (opdRecord: any) => {
    if (!selectedPatient) return;

    const receiptNumber = `OPD-${opdRecord.id.slice(-8).toUpperCase()}`;
    const isPaid = opdRecord.payment_status === 'paid';
    const doctorName = opdRecord.doctors?.name || 'N/A';
    const fee = opdRecord.fee || 0;

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

          <div class="receipt-title">RECEIPT / رسید (REPRINT)</div>

          <div class="info-row">
            <span><strong>No:</strong> ${receiptNumber}</span>
            <span><strong>Date:</strong> ${new Date(opdRecord.date || opdRecord.created_at).toLocaleDateString('en-PK')}</span>
          </div>

          <div class="divider"></div>

          <div class="patient-section">
            <div><strong>Patient:</strong> ${selectedPatient.name}</div>
            <div><strong>MR#:</strong> ${selectedPatient.mrNumber || 'N/A'}</div>
            <div>${selectedPatient.age}Y / ${selectedPatient.gender} | ${selectedPatient.contact}</div>
          </div>

          <div class="divider"></div>

          <div class="item-row">
            <span>OPD Fee - Dr. ${doctorName}</span>
            <span>${formatCurrency(fee)}</span>
          </div>
          <div style="font-size: 8px; color: #666;">Token #${opdRecord.token_number}</div>

          <div class="total-section">
            <div class="total-row">
              <span>TOTAL / کل:</span>
              <span>${formatCurrency(fee)}</span>
            </div>
          </div>

          <div class="status ${isPaid ? 'paid' : 'unpaid'}">
            ${isPaid ? '✓ PAID / ادا شدہ' : '✗ UNPAID / غیر ادا شدہ'}
          </div>

          <div class="footer">
            Thank you / شکریہ<br>
            Reprinted on ${new Date().toLocaleString('en-PK')}
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
    toast.success('Receipt sent to printer');
  };

  // Reprint Lab Receipt
  const reprintLabReceipt = (labRecord: any) => {
    if (!selectedPatient) return;

    const receiptNumber = `LAB-${labRecord.id.slice(-8).toUpperCase()}`;
    const tests = labRecord.tests || [];
    const totalAmount = labRecord.total_amount || 0;

    const printContent = `
      <html>
        <head>
          <title>Lab Receipt - ${receiptNumber}</title>
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

          <div class="receipt-title">LAB RECEIPT / رسید (REPRINT)</div>

          <div class="info-row">
            <span><strong>No:</strong> ${receiptNumber}</span>
            <span><strong>Date:</strong> ${new Date(labRecord.order_date || labRecord.created_at).toLocaleDateString('en-PK')}</span>
          </div>

          <div class="divider"></div>

          <div class="patient-section">
            <div><strong>Patient:</strong> ${selectedPatient.name}</div>
            <div><strong>MR#:</strong> ${selectedPatient.mrNumber || 'N/A'}</div>
            <div>${selectedPatient.age}Y / ${selectedPatient.gender} | ${selectedPatient.contact}</div>
          </div>

          <div class="divider"></div>

          ${tests.map((test: string) => `
            <div class="item-row">
              <span>${test}</span>
            </div>
          `).join('')}

          <div class="total-section">
            <div class="total-row">
              <span>TOTAL / کل:</span>
              <span>${formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <div class="status ${labRecord.payment_status === 'paid' ? 'paid' : 'unpaid'}">
            ${labRecord.payment_status === 'paid' ? '✓ PAID / ادا شدہ' : '✗ UNPAID / غیر ادا شدہ'}
          </div>

          <div class="footer">
            Thank you / شکریہ<br>
            Reprinted on ${new Date().toLocaleString('en-PK')}
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
    toast.success('Receipt sent to printer');
  };

  // Reprint Treatment Receipt
  const reprintTreatmentReceipt = (treatmentRecord: any) => {
    if (!selectedPatient) return;

    const receiptNumber = `TRT-${treatmentRecord.id.slice(-8).toUpperCase()}`;
    const isPaid = treatmentRecord.payment_status === 'paid';

    const printContent = `
      <html>
        <head>
          <title>Treatment Receipt - ${receiptNumber}</title>
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

          <div class="receipt-title">TREATMENT RECEIPT / رسید (REPRINT)</div>

          <div class="info-row">
            <span><strong>No:</strong> ${receiptNumber}</span>
            <span><strong>Date:</strong> ${new Date(treatmentRecord.date || treatmentRecord.created_at).toLocaleDateString('en-PK')}</span>
          </div>

          <div class="divider"></div>

          <div class="patient-section">
            <div><strong>Patient:</strong> ${selectedPatient.name}</div>
            <div><strong>MR#:</strong> ${selectedPatient.mrNumber || 'N/A'}</div>
            <div>${selectedPatient.age}Y / ${selectedPatient.gender} | ${selectedPatient.contact}</div>
          </div>

          <div class="divider"></div>

          <div class="item-row">
            <span>${treatmentRecord.treatment_name}</span>
            <span>${formatCurrency(treatmentRecord.price || 0)}</span>
          </div>
          <div style="font-size: 8px; color: #666;">Type: ${treatmentRecord.treatment_type || 'N/A'}</div>
          ${treatmentRecord.description ? `<div style="font-size: 8px; color: #666; margin-top: 1mm;">${treatmentRecord.description}</div>` : ''}

          <div class="total-section">
            <div class="total-row">
              <span>TOTAL / کل:</span>
              <span>${formatCurrency(treatmentRecord.price || 0)}</span>
            </div>
          </div>

          <div class="status ${isPaid ? 'paid' : 'unpaid'}">
            ${isPaid ? '✓ PAID / ادا شدہ' : '✗ UNPAID / غیر ادا شدہ'}
          </div>

          <div class="footer">
            Thank you / شکریہ<br>
            Reprinted on ${new Date().toLocaleString('en-PK')}
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
    toast.success('Receipt sent to printer');
  };

  // Print consent forms
  const printConsentForm = (type: 'treatment' | 'tl' | 'lama') => {
    if (!selectedPatient) return;

    const today = new Date().toLocaleDateString('en-PK');
    const titles: Record<string, { en: string; ur: string }> = {
      treatment: { en: 'Treatment Consent Form', ur: 'علاج کی رضامندی فارم' },
      tl: { en: 'Tubal Ligation Consent Form', ur: 'ٹیوبل لیگیشن رضامندی فارم' },
      lama: { en: 'LAMA - Leave Against Medical Advice', ur: 'طبی مشورے کے خلاف رخصتی' }
    };

    const title = titles[type];

    const formContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title.en} - ${selectedPatient.name}</title>
        <style>
          @page { size: A4; margin: 50mm 25mm 25mm 25mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Tahoma', 'Arial', sans-serif; font-size: 11pt; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 16pt; font-weight: bold; margin-top: 0; color: #000; }
          .title-urdu { font-size: 14pt; direction: rtl; color: #000; margin-top: 5px; }
          .patient-info { background: #f5f5f5; padding: 15px; margin: 20px 0; }
          .info-row { display: flex; margin-bottom: 8px; }
          .info-label { font-weight: bold; width: 150px; }
          .content { margin: 20px 0; }
          .content p { margin-bottom: 10px; }
          .bilingual { display: flex; gap: 20px; margin-bottom: 15px; }
          .english { flex: 1; }
          .urdu { flex: 1; direction: rtl; text-align: right; }
          .signature-area { margin-top: 40px; display: flex; justify-content: space-between; }
          .signature-box { text-align: center; width: 200px; }
          .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; }
          .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #666; font-size: 9pt; color: #666; text-align: center; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${title.en}</div>
          <div class="title-urdu">${title.ur}</div>
        </div>

        <div class="patient-info">
          <div class="info-row"><span class="info-label">MR Number:</span><span>${selectedPatient.mrNumber || 'N/A'}</span></div>
          <div class="info-row"><span class="info-label">Patient Name:</span><span>${selectedPatient.name}</span></div>
          <div class="info-row"><span class="info-label">Age/Gender:</span><span>${selectedPatient.age} years / ${selectedPatient.gender}</span></div>
          <div class="info-row"><span class="info-label">Guardian (C/O):</span><span>${selectedPatient.careOf || 'N/A'}</span></div>
          <div class="info-row"><span class="info-label">Contact:</span><span>${selectedPatient.contact}</span></div>
          <div class="info-row"><span class="info-label">Date:</span><span>${today}</span></div>
        </div>

        <div class="content">
          ${type === 'treatment' ? `
            <div class="bilingual">
              <div class="english">
                <p>I, the undersigned patient/guardian, hereby consent to the medical treatment, procedures, and care recommended by the medical staff of North Karachi Hospital.</p>
                <p>I understand that:</p>
                <ul>
                  <li>The nature of my condition has been explained to me</li>
                  <li>The proposed treatment and its benefits have been discussed</li>
                  <li>Possible risks and complications have been explained</li>
                  <li>Alternative treatments, if any, have been discussed</li>
                </ul>
                <p>I give my full consent to proceed with the recommended treatment.</p>
              </div>
              <div class="urdu">
                <p>میں، زیر دستخطی مریض/سرپرست، نارتھ کراچی ہسپتال کے طبی عملے کی تجویز کردہ طبی علاج، طریقہ کار اور دیکھ بھال کے لیے رضامندی دیتا/دیتی ہوں۔</p>
                <p>میں سمجھتا/سمجھتی ہوں کہ:</p>
                <ul>
                  <li>میری حالت کی نوعیت مجھے سمجھائی گئی ہے</li>
                  <li>تجویز کردہ علاج اور اس کے فوائد پر بات ہوئی ہے</li>
                  <li>ممکنہ خطرات اور پیچیدگیاں بیان کی گئی ہیں</li>
                  <li>متبادل علاج، اگر کوئی ہے، پر بھی بات ہوئی ہے</li>
                </ul>
                <p>میں تجویز کردہ علاج کے ساتھ آگے بڑھنے کی مکمل رضامندی دیتا/دیتی ہوں۔</p>
              </div>
            </div>
          ` : type === 'tl' ? `
            <div class="bilingual">
              <div class="english">
                <p>I, the undersigned, hereby give my consent for Tubal Ligation (permanent sterilization) procedure.</p>
                <p>I understand that:</p>
                <ul>
                  <li>This is a permanent method of contraception</li>
                  <li>The procedure involves blocking or cutting the fallopian tubes</li>
                  <li>This procedure is intended to be permanent and irreversible</li>
                  <li>There are risks associated with any surgical procedure</li>
                  <li>Alternative methods of contraception are available</li>
                </ul>
                <p>I have made this decision voluntarily without any coercion.</p>
              </div>
              <div class="urdu">
                <p>میں، زیر دستخطی، ٹیوبل لیگیشن (مستقل نس بندی) کے طریقہ کار کے لیے اپنی رضامندی دیتا/دیتی ہوں۔</p>
                <p>میں سمجھتا/سمجھتی ہوں کہ:</p>
                <ul>
                  <li>یہ مانع حمل کا مستقل طریقہ ہے</li>
                  <li>اس طریقہ کار میں فیلوپین ٹیوب کو بند یا کاٹنا شامل ہے</li>
                  <li>یہ طریقہ کار مستقل اور ناقابل واپسی ہے</li>
                  <li>کسی بھی سرجیکل طریقہ کار سے خطرات وابستہ ہیں</li>
                  <li>مانع حمل کے متبادل طریقے دستیاب ہیں</li>
                </ul>
                <p>میں نے یہ فیصلہ اپنی مرضی سے بغیر کسی جبر کے کیا ہے۔</p>
              </div>
            </div>
          ` : `
            <div class="bilingual">
              <div class="english">
                <p><strong>LEAVE AGAINST MEDICAL ADVICE (LAMA)</strong></p>
                <p>I, the undersigned patient/guardian, hereby declare that I am leaving North Karachi Hospital against the advice of the treating physician(s).</p>
                <p>I understand that:</p>
                <ul>
                  <li>The medical staff has advised me to continue treatment</li>
                  <li>Leaving may result in worsening of my condition</li>
                  <li>There may be serious health consequences</li>
                  <li>I am taking full responsibility for this decision</li>
                </ul>
                <p>I release the hospital and its staff from any liability.</p>
              </div>
              <div class="urdu">
                <p><strong>طبی مشورے کے خلاف رخصتی</strong></p>
                <p>میں، زیر دستخطی مریض/سرپرست، اعلان کرتا/کرتی ہوں کہ میں نارتھ کراچی ہسپتال سے معالج ڈاکٹروں کے مشورے کے خلاف جا رہا/رہی ہوں۔</p>
                <p>میں سمجھتا/سمجھتی ہوں کہ:</p>
                <ul>
                  <li>طبی عملے نے مجھے علاج جاری رکھنے کا مشورہ دیا ہے</li>
                  <li>چھوڑنے سے میری حالت بگڑ سکتی ہے</li>
                  <li>صحت کے سنگین نتائج ہو سکتے ہیں</li>
                  <li>میں اس فیصلے کی پوری ذمہ داری لے رہا/رہی ہوں</li>
                </ul>
                <p>میں ہسپتال اور اس کے عملے کو کسی بھی ذمہ داری سے بری کرتا/کرتی ہوں۔</p>
              </div>
            </div>
          `}
        </div>

        <div class="signature-area">
          <div class="signature-box">
            <div class="signature-line">Patient/Guardian Signature<br/>مریض/سرپرست کے دستخط</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Witness Signature<br/>گواہ کے دستخط</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Doctor's Signature<br/>ڈاکٹر کے دستخط</div>
          </div>
        </div>

        <div class="footer">
          <p>North Karachi Hospital | C-122, Sector 11-B, North Karachi | Ph: 36989080</p>
          <p>Document generated on: ${new Date().toLocaleString('en-PK')}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(formContent);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    }
  };

  // Get document types available for this patient
  const getPatientDocuments = () => {
    const docs = [];

    // Always available consent forms
    docs.push({ id: 'treatment', name: 'Treatment Consent', nameUr: 'علاج کی رضامندی', type: 'consent', available: true });
    docs.push({ id: 'tl', name: 'T.L. Consent', nameUr: 'ٹی ایل رضامندی', type: 'consent', available: true });
    docs.push({ id: 'lama', name: 'LAMA Form', nameUr: 'لاما فارم', type: 'consent', available: true });

    // OPD receipts
    if (history.opdTokens?.data?.length > 0) {
      docs.push({ id: 'opd-receipts', name: 'OPD Receipts', nameUr: 'او پی ڈی رسیدیں', type: 'receipt', count: history.opdTokens.data.length, available: true });
    }

    // Lab reports
    if (history.labOrders?.data?.length > 0) {
      docs.push({ id: 'lab-reports', name: 'Lab Reports', nameUr: 'لیب رپورٹس', type: 'report', count: history.labOrders.data.length, available: true });
    }

    // Admission papers
    if (history.admissions?.data?.length > 0) {
      docs.push({ id: 'admission-papers', name: 'Admission Papers', nameUr: 'داخلے کے کاغذات', type: 'admission', count: history.admissions.data.length, available: true });
    }

    // Treatment records
    if (history.treatments?.data?.length > 0) {
      docs.push({ id: 'treatment-records', name: 'Treatment Records', nameUr: 'علاج کے ریکارڈ', type: 'treatment', count: history.treatments.data.length, available: true });
    }

    return docs;
  };

  // Format date and time
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Combine all activities into a timeline
  const getTimeline = () => {
    const timeline: any[] = [];

    // Add OPD tokens
    history.opdTokens?.data?.forEach((opd: any) => {
      timeline.push({
        type: 'OPD Visit',
        date: opd.date,
        created_at: opd.created_at,
        data: opd,
        icon: FileText,
        color: 'blue',
        amount: opd.fee || 0,
        status: opd.payment_status
      });
    });

    // Add admissions
    history.admissions?.data?.forEach((admission: any) => {
      timeline.push({
        type: 'Admission',
        date: admission.admission_date,
        created_at: admission.created_at,
        data: admission,
        icon: Bed,
        color: 'purple',
        amount: admission.deposit || 0,
        status: admission.status
      });
    });

    // Add lab orders
    history.labOrders?.data?.forEach((lab: any) => {
      timeline.push({
        type: 'Lab Tests',
        date: lab.order_date,
        created_at: lab.created_at,
        data: lab,
        icon: TestTube,
        color: 'green',
        amount: lab.total_amount || 0,
        status: lab.status
      });
    });

    // Add treatments
    history.treatments?.data?.forEach((treatment: any) => {
      timeline.push({
        type: 'Treatment',
        date: treatment.date,
        created_at: treatment.created_at,
        data: treatment,
        icon: Activity,
        color: 'red',
        amount: treatment.price || 0,
        status: treatment.payment_status
      });
    });

    // Add appointments
    history.appointments?.data?.forEach((appointment: any) => {
      timeline.push({
        type: 'Appointment',
        date: appointment.appointment_date,
        created_at: appointment.created_at,
        data: appointment,
        icon: Calendar,
        color: 'yellow',
        amount: 0,
        status: appointment.status
      });
    });

    // Sort by date (most recent first)
    return timeline.sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime());
  };

  // Calculate financial summary
  const getFinancialSummary = () => {
    const timeline = getTimeline();

    const opdTotal = history.opdTokens?.data?.reduce((sum: number, o: any) => sum + (o.fee || 0), 0) || 0;
    const opdPaid = history.opdTokens?.data?.filter((o: any) => o.payment_status === 'paid').reduce((sum: number, o: any) => sum + (o.fee || 0), 0) || 0;

    const labTotal = history.labOrders?.data?.reduce((sum: number, l: any) => sum + (l.total_amount || 0), 0) || 0;
    const labPaid = history.labOrders?.data?.filter((l: any) => l.payment_status === 'paid').reduce((sum: number, l: any) => sum + (l.total_amount || 0), 0) || 0;

    const treatmentTotal = history.treatments?.data?.reduce((sum: number, t: any) => sum + (t.price || 0), 0) || 0;
    const treatmentPaid = history.treatments?.data?.filter((t: any) => t.payment_status === 'paid').reduce((sum: number, t: any) => sum + (t.price || 0), 0) || 0;

    const admissionDeposits = history.admissions?.data?.reduce((sum: number, a: any) => sum + (a.deposit || 0), 0) || 0;

    const totalBilled = opdTotal + labTotal + treatmentTotal;
    const totalPaid = opdPaid + labPaid + treatmentPaid + admissionDeposits;
    const totalPending = totalBilled - (opdPaid + labPaid + treatmentPaid);

    return {
      opd: { total: opdTotal, paid: opdPaid, pending: opdTotal - opdPaid },
      lab: { total: labTotal, paid: labPaid, pending: labTotal - labPaid },
      treatment: { total: treatmentTotal, paid: treatmentPaid, pending: treatmentTotal - treatmentPaid },
      admissionDeposits,
      totalBilled,
      totalPaid,
      totalPending
    };
  };

  // Get pending items
  const getPendingItems = () => {
    const pending: any[] = [];

    history.opdTokens?.data?.filter((o: any) => o.payment_status !== 'paid').forEach((o: any) => {
      pending.push({ id: o.id, type: 'OPD', description: `Token #${o.token_number}`, amount: o.fee, date: o.date });
    });

    history.labOrders?.data?.filter((l: any) => l.payment_status !== 'paid').forEach((l: any) => {
      pending.push({ id: l.id, type: 'Lab', description: `${l.tests?.length || 0} tests`, amount: l.total_amount, date: l.order_date });
    });

    history.treatments?.data?.filter((t: any) => t.payment_status !== 'paid').forEach((t: any) => {
      pending.push({ id: t.id, type: 'Treatment', description: t.treatment_name, amount: t.price, date: t.date });
    });

    return pending;
  };

  const recordPayment = async (itemId: string, itemType: 'OPD' | 'Lab' | 'Treatment') => {
    setPaymentLoading(true);
    try {
      let error = null;

      if (itemType === 'OPD') {
        const result = await db.opdTokens.update(itemId, { payment_status: 'paid' });
        error = result.error;
      } else if (itemType === 'Lab') {
        const result = await db.labOrders.update(itemId, { payment_status: 'paid' });
        error = result.error;
      } else if (itemType === 'Treatment') {
        const result = await db.treatments.update(itemId, { payment_status: 'paid' });
        error = result.error;
      }

      if (error) {
        console.error('Error recording payment:', error);
        toast.error('Failed to record payment');
        setPaymentLoading(false);
        return;
      }

      toast.success('Payment recorded successfully!');

      // Reload patient history
      loadPatientHistory();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const recordAllPayments = async () => {
    const pendingItems = getPendingItems();

    if (pendingItems.length === 0) {
      toast.info('No pending payments');
      return;
    }

    if (!confirm(`Record payment for all ${pendingItems.length} pending items (Total: ${formatCurrency(pendingItems.reduce((sum, item) => sum + item.amount, 0))})?`)) {
      return;
    }

    setPaymentLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const item of pendingItems) {
      try {
        let error = null;

        if (item.type === 'OPD') {
          const result = await db.opdTokens.update(item.id, { payment_status: 'paid' });
          error = result.error;
        } else if (item.type === 'Lab') {
          const result = await db.labOrders.update(item.id, { payment_status: 'paid' });
          error = result.error;
        } else if (item.type === 'Treatment') {
          const result = await db.treatments.update(item.id, { payment_status: 'paid' });
          error = result.error;
        }

        if (error) {
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    setPaymentLoading(false);

    if (successCount > 0) {
      toast.success(`${successCount} payment(s) recorded successfully!`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} payment(s) failed`);
    }

    // Reload patient history
    loadPatientHistory();
  };

  const printCompleteProfile = () => {
    if (!selectedPatient) return;

    const timeline = getTimeline();
    const financial = getFinancialSummary();

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Complete Patient File - ${selectedPatient.name}</title>
        <style>
          @page { size: A4; margin: 50mm 25mm 25mm 25mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Tahoma', 'Arial', sans-serif; font-size: 11pt; line-height: 1.4; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .subtitle { color: #000; font-size: 14pt; font-weight: bold; }
          .mr-box { background: #000; color: white; padding: 8px 15px; font-size: 14pt; font-weight: bold; display: inline-block; margin: 10px 0; font-family: 'Courier New', monospace; }
          .section { margin: 20px 0; page-break-inside: avoid; }
          .section-title { font-size: 12pt; font-weight: bold; color: #000; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
          .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: #f5f5f5; padding: 15px; }
          .info-item { }
          .info-label { font-size: 9pt; color: #666; }
          .info-value { font-weight: bold; }
          .timeline-item { border-left: 3px solid #000; padding-left: 15px; margin-bottom: 15px; }
          .timeline-date { font-size: 9pt; color: #666; }
          .timeline-type { font-weight: bold; color: #000; }
          .timeline-details { font-size: 10pt; margin-top: 5px; }
          .financial-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
          .financial-box { background: #f5f5f5; padding: 10px; text-align: center; }
          .financial-amount { font-size: 14pt; font-weight: bold; }
          .financial-label { font-size: 9pt; color: #666; }
          .footer { border-top: 1px solid #666; padding-top: 10px; margin-top: 20px; font-size: 9pt; color: #666; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #666; padding: 8px; text-align: left; font-size: 10pt; }
          th { background: #f5f5f5; }
          .status-paid { color: #000; }
          .status-pending { color: #000; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="subtitle">COMPLETE PATIENT MEDICAL RECORD</div>
          <div class="mr-box">${selectedPatient.mrNumber || 'N/A'}</div>
        </div>

        <div class="section">
          <div class="section-title">Patient Information</div>
          <div class="info-grid">
            <div class="info-item"><div class="info-label">Full Name</div><div class="info-value">${selectedPatient.name}</div></div>
            <div class="info-item"><div class="info-label">Age</div><div class="info-value">${selectedPatient.age} years</div></div>
            <div class="info-item"><div class="info-label">Gender</div><div class="info-value">${selectedPatient.gender}</div></div>
            <div class="info-item"><div class="info-label">Contact</div><div class="info-value">${selectedPatient.contact}</div></div>
            <div class="info-item"><div class="info-label">Emergency Contact</div><div class="info-value">${selectedPatient.emergencyContact || 'N/A'}</div></div>
            <div class="info-item"><div class="info-label">Blood Group</div><div class="info-value">${selectedPatient.bloodGroup || 'N/A'}</div></div>
            <div class="info-item"><div class="info-label">CNIC</div><div class="info-value">${selectedPatient.cnicNumber || 'N/A'}</div></div>
            <div class="info-item"><div class="info-label">Care Of</div><div class="info-value">${selectedPatient.careOf || 'N/A'}</div></div>
            <div class="info-item"><div class="info-label">Department</div><div class="info-value">${selectedPatient.department}</div></div>
            <div class="info-item" style="grid-column: span 3;"><div class="info-label">Address</div><div class="info-value">${selectedPatient.address || 'N/A'}</div></div>
            <div class="info-item"><div class="info-label">Registration Date</div><div class="info-value">${formatDate(selectedPatient.registrationDate)}</div></div>
            <div class="info-item"><div class="info-label">Chief Complaint</div><div class="info-value">${selectedPatient.problem || 'N/A'}</div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Financial Summary</div>
          <div class="financial-grid">
            <div class="financial-box"><div class="financial-amount">${formatCurrency(financial.totalBilled)}</div><div class="financial-label">Total Billed</div></div>
            <div class="financial-box"><div class="financial-amount" style="color: green;">${formatCurrency(financial.totalPaid)}</div><div class="financial-label">Total Paid</div></div>
            <div class="financial-box"><div class="financial-amount" style="color: red;">${formatCurrency(financial.totalPending)}</div><div class="financial-label">Pending</div></div>
            <div class="financial-box"><div class="financial-amount">${timeline.length}</div><div class="financial-label">Total Visits</div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Visit History (${timeline.length} records)</div>
          ${timeline.length === 0 ? '<p style="color: #666;">No medical history recorded</p>' : `
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Details</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${timeline.map(item => `
                <tr>
                  <td>${formatDateTime(item.created_at || item.date)}</td>
                  <td><strong>${item.type}</strong></td>
                  <td>
                    ${item.type === 'OPD Visit' ? `Token #${item.data.token_number} - Dr. ${item.data.doctors?.name || 'N/A'}` : ''}
                    ${item.type === 'Admission' ? `Room ${item.data.rooms?.room_number || 'N/A'} - ${item.data.admission_type}` : ''}
                    ${item.type === 'Lab Tests' ? `${item.data.tests?.length || 0} tests ordered` : ''}
                    ${item.type === 'Treatment' ? `${item.data.treatment_name} (${item.data.treatment_type})` : ''}
                    ${item.type === 'Appointment' ? `${item.data.appointment_time} - Dr. ${item.data.doctors?.name || 'N/A'}` : ''}
                  </td>
                  <td>${formatCurrency(item.amount)}</td>
                  <td class="${item.status === 'paid' || item.status === 'completed' ? 'status-paid' : 'status-pending'}">${item.status || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          `}
        </div>

        <div class="footer">
          <p>Printed on: ${new Date().toLocaleString('en-PK')} | North Karachi Hospital - Complete Patient Medical Record</p>
          <p>This document contains confidential medical information.</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    }
  };

  const timeline = getTimeline();
  const financial = getFinancialSummary();
  const pendingItems = getPendingItems();

  // Search view when no patient is selected
  if (!selectedPatient) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient File Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-xl mx-auto space-y-4">
              <div className="text-center mb-6">
                <CreditCard className="h-16 w-16 mx-auto mb-4 text-green-600" />
                <h2 className="text-xl font-semibold mb-2">Search Patient by MR Number</h2>
                <p className="text-gray-600">Enter MR number, patient name, or contact number to view complete file</p>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Enter MR Number (e.g., NKH-20251225-1234) or Name or Contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="text-lg py-6"
                />
                <Button onClick={handleSearch} disabled={isSearching} size="lg">
                  {isSearching ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                </Button>
              </div>

              {/* Search Results */}
              {patients.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h3 className="font-semibold text-gray-700">Search Results ({patients.length})</h3>
                  {patients.map((patient) => (
                    <Card
                      key={patient.id}
                      className="p-4 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {patient.mrNumber && (
                            <Badge variant="outline" className="text-blue-700 border-blue-700 font-mono text-lg px-3 py-1">
                              {patient.mrNumber}
                            </Badge>
                          )}
                          <div>
                            <p className="font-semibold text-lg">{patient.name}</p>
                            <p className="text-sm text-gray-600">
                              {patient.age} yrs • {patient.gender} • {patient.contact}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Full patient profile view
  return (
    <div className="space-y-6">
      {/* Back button and MR Card */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setSelectedPatient(null)}>
          ← Back to Search
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => printMRCard(selectedPatient)}>
            <CreditCard className="h-4 w-4 mr-2" />
            Print MR Card
          </Button>
          <Button onClick={printCompleteProfile}>
            <Printer className="h-4 w-4 mr-2" />
            Print Complete File
          </Button>
          {/* Maternity Actions - Only show for female patients */}
          {selectedPatient.gender === 'Female' && (
            <Button
              onClick={() => setShowDeliveryForm(true)}
              className="bg-pink-600 hover:bg-pink-700"
            >
              <Baby className="h-4 w-4 mr-2" />
              Record Delivery
            </Button>
          )}
        </div>
      </div>

      {/* Patient Header Card */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            {/* MR Number Badge */}
            <div className="text-center">
              <div className="bg-green-700 text-white px-6 py-3 rounded-lg font-mono text-xl font-bold">
                {selectedPatient.mrNumber || 'N/A'}
              </div>
              <p className="text-xs text-gray-500 mt-1">MR Number</p>
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{selectedPatient.name}</h2>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>{selectedPatient.age} yrs • {selectedPatient.gender}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{selectedPatient.contact}</span>
                </div>
                {selectedPatient.bloodGroup && (
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-400" />
                    <span className="font-semibold text-red-600">{selectedPatient.bloodGroup}</span>
                  </div>
                )}
                {selectedPatient.careOf && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{selectedPatient.careOf}</span>
                  </div>
                )}
              </div>
              {selectedPatient.address && (
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{selectedPatient.address}</span>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="text-right">
              <Badge className="mb-2">{selectedPatient.department}</Badge>
              <p className="text-xs text-gray-500">Registered: {formatDate(selectedPatient.registrationDate)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4 bg-blue-50">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{history.opdTokens?.data?.length || 0}</p>
              <p className="text-sm text-gray-600">OPD Visits</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-purple-50">
          <div className="flex items-center gap-3">
            <Bed className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{history.admissions?.data?.length || 0}</p>
              <p className="text-sm text-gray-600">Admissions</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-red-50">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{history.treatments?.data?.length || 0}</p>
              <p className="text-sm text-gray-600">Treatments</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-green-50">
          <div className="flex items-center gap-3">
            <TestTube className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{history.labOrders?.data?.length || 0}</p>
              <p className="text-sm text-gray-600">Lab Tests</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-yellow-50">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold">{history.appointments?.data?.length || 0}</p>
              <p className="text-sm text-gray-600">Appointments</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold">{formatCurrency(financial.totalBilled)}</p>
              <p className="text-sm text-gray-600">Total Billed</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{formatCurrency(financial.totalPaid)}</p>
              <p className="text-sm text-gray-600">Total Paid</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">{formatCurrency(financial.totalPending)}</p>
              <p className="text-sm text-gray-600">Pending Payment</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(financial.admissionDeposits)}</p>
              <p className="text-sm text-gray-600">Deposits</p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="p-3 border rounded">
              <p className="font-semibold mb-2">OPD Visits</p>
              <p>Total: {formatCurrency(financial.opd.total)}</p>
              <p className="text-green-600">Paid: {formatCurrency(financial.opd.paid)}</p>
              <p className="text-red-600">Pending: {formatCurrency(financial.opd.pending)}</p>
            </div>
            <div className="p-3 border rounded">
              <p className="font-semibold mb-2">Lab Tests</p>
              <p>Total: {formatCurrency(financial.lab.total)}</p>
              <p className="text-green-600">Paid: {formatCurrency(financial.lab.paid)}</p>
              <p className="text-red-600">Pending: {formatCurrency(financial.lab.pending)}</p>
            </div>
            <div className="p-3 border rounded">
              <p className="font-semibold mb-2">Treatments</p>
              <p>Total: {formatCurrency(financial.treatment.total)}</p>
              <p className="text-green-600">Paid: {formatCurrency(financial.treatment.paid)}</p>
              <p className="text-red-600">Pending: {formatCurrency(financial.treatment.pending)}</p>
            </div>
          </div>

          {/* Pending Items Alert */}
          {pendingItems.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <h4 className="font-semibold text-red-700">Pending Payments ({pendingItems.length})</h4>
                </div>
                <Button
                  size="sm"
                  onClick={recordAllPayments}
                  disabled={paymentLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Pay All ({formatCurrency(pendingItems.reduce((sum, item) => sum + item.amount, 0))})
                </Button>
              </div>
              <div className="space-y-2">
                {pendingItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-red-100">
                    <div className="flex-1">
                      <span className="font-medium">{item.type}:</span> {item.description}
                      <span className="text-xs text-gray-500 ml-2">({new Date(item.date).toLocaleDateString('en-PK')})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{formatCurrency(item.amount)}</span>
                      <Button
                        size="sm"
                        onClick={() => recordPayment(item.id, item.type)}
                        disabled={paymentLoading}
                        className="bg-green-600 hover:bg-green-700 h-8 px-3"
                      >
                        <CreditCard className="h-3 w-3 mr-1" />
                        Pay
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for detailed history */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Medical History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex flex-wrap gap-1">
              <TabsTrigger value="timeline">Timeline ({timeline.length})</TabsTrigger>
              <TabsTrigger value="accounts" className="bg-green-50">
                <DollarSign className="h-3 w-3 mr-1" />
                Accounts
              </TabsTrigger>
              <TabsTrigger value="opd">OPD ({history.opdTokens?.data?.length || 0})</TabsTrigger>
              <TabsTrigger value="admissions">Admissions ({history.admissions?.data?.length || 0})</TabsTrigger>
              <TabsTrigger value="treatments">Treatments ({history.treatments?.data?.length || 0})</TabsTrigger>
              <TabsTrigger value="labs">Labs ({history.labOrders?.data?.length || 0})</TabsTrigger>
              <TabsTrigger value="appointments">Appointments ({history.appointments?.data?.length || 0})</TabsTrigger>
              {selectedPatient.gender === 'Female' && (
                <TabsTrigger value="maternity" className="bg-pink-50">
                  <Baby className="h-3 w-3 mr-1" />
                  Maternity ({deliveryRecords.length})
                </TabsTrigger>
              )}
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            {/* Timeline Tab */}
            <TabsContent value="timeline">
              <div className="space-y-4 mt-4">
                {loading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-spin" />
                    <p className="text-gray-600">Loading history...</p>
                  </div>
                ) : timeline.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No medical history recorded</p>
                  </div>
                ) : (
                  timeline.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Card key={index} className="p-4 border-l-4 border-l-blue-500">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-blue-100">
                            <Icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{item.type}</h4>
                              <div className="text-right">
                                <p className="text-sm font-medium">{formatDateTime(item.created_at || item.date)}</p>
                                <Badge className={item.status === 'paid' || item.status === 'completed' ? 'bg-green-500' : 'bg-red-500'}>
                                  {item.status || 'N/A'}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              {item.type === 'OPD Visit' && (
                                <>
                                  <p><strong>Token:</strong> #{item.data.token_number}</p>
                                  <p><strong>Doctor:</strong> {item.data.doctors?.name || 'N/A'}</p>
                                  <p><strong>Fee:</strong> {formatCurrency(item.data.fee || 0)}</p>
                                </>
                              )}
                              {item.type === 'Admission' && (
                                <>
                                  <p><strong>Room:</strong> {item.data.rooms?.room_number} ({item.data.rooms?.type})</p>
                                  <p><strong>Type:</strong> {item.data.admission_type}</p>
                                  <p><strong>Doctor:</strong> {item.data.doctors?.name || 'N/A'}</p>
                                  <p><strong>Deposit:</strong> {formatCurrency(item.data.deposit || 0)}</p>
                                </>
                              )}
                              {item.type === 'Lab Tests' && (
                                <>
                                  <p><strong>Tests:</strong> {item.data.tests?.length || 0} ordered</p>
                                  <p><strong>Amount:</strong> {formatCurrency(item.data.total_amount || 0)}</p>
                                </>
                              )}
                              {item.type === 'Treatment' && (
                                <>
                                  <p><strong>Treatment:</strong> {item.data.treatment_name}</p>
                                  <p><strong>Type:</strong> {item.data.treatment_type}</p>
                                  <p><strong>Doctor:</strong> {item.data.doctors?.name || 'N/A'}</p>
                                  <p><strong>Price:</strong> {formatCurrency(item.data.price || 0)}</p>
                                </>
                              )}
                              {item.type === 'Appointment' && (
                                <>
                                  <p><strong>Time:</strong> {item.data.appointment_time}</p>
                                  <p><strong>Doctor:</strong> {item.data.doctors?.name || 'N/A'}</p>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{formatCurrency(item.amount)}</p>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>

            {/* Accounts Tab - Complete Billing Summary */}
            <TabsContent value="accounts">
              <div className="space-y-4 mt-4">
                {(() => {
                  const accounts = calculatePatientAccounts();
                  return (
                    <>
                      {/* Summary Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-blue-50 border-blue-200">
                          <CardContent className="p-4 text-center">
                            <DollarSign className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                            <p className="text-2xl font-bold text-blue-700">{formatCurrency(accounts.totalCharges)}</p>
                            <p className="text-sm text-blue-600">Total Charges</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-green-50 border-green-200">
                          <CardContent className="p-4 text-center">
                            <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                            <p className="text-2xl font-bold text-green-700">{formatCurrency(accounts.totalPaid)}</p>
                            <p className="text-sm text-green-600">Total Paid</p>
                          </CardContent>
                        </Card>
                        <Card className={`${accounts.totalBalance > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                          <CardContent className="p-4 text-center">
                            <AlertCircle className={`h-8 w-8 mx-auto mb-2 ${accounts.totalBalance > 0 ? 'text-red-600' : 'text-gray-600'}`} />
                            <p className={`text-2xl font-bold ${accounts.totalBalance > 0 ? 'text-red-700' : 'text-gray-700'}`}>{formatCurrency(accounts.totalBalance)}</p>
                            <p className={`text-sm ${accounts.totalBalance > 0 ? 'text-red-600' : 'text-gray-600'}`}>Balance Due</p>
                          </CardContent>
                        </Card>
                        <Card className="bg-yellow-50 border-yellow-200">
                          <CardContent className="p-4 text-center">
                            <CreditCard className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                            <p className="text-2xl font-bold text-yellow-700">{formatCurrency(accounts.depositsReceived)}</p>
                            <p className="text-sm text-yellow-600">Deposits</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Detailed Breakdown */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Charges Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {/* OPD Fees */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-blue-600" />
                                <div>
                                  <p className="font-semibold">OPD Consultations</p>
                                  <p className="text-sm text-gray-600">{accounts.opd.count} visits</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{formatCurrency(accounts.opd.total)}</p>
                                <p className="text-sm text-green-600">Paid: {formatCurrency(accounts.opd.paid)}</p>
                              </div>
                            </div>

                            {/* Lab Fees */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <TestTube className="h-5 w-5 text-purple-600" />
                                <div>
                                  <p className="font-semibold">Laboratory Tests</p>
                                  <p className="text-sm text-gray-600">{accounts.lab.count} orders</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{formatCurrency(accounts.lab.total)}</p>
                                <p className="text-sm text-green-600">Paid: {formatCurrency(accounts.lab.paid)}</p>
                              </div>
                            </div>

                            {/* Treatment Fees */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Activity className="h-5 w-5 text-orange-600" />
                                <div>
                                  <p className="font-semibold">Treatments & Procedures</p>
                                  <p className="text-sm text-gray-600">{accounts.treatment.count} treatments</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{formatCurrency(accounts.treatment.total)}</p>
                                <p className="text-sm text-green-600">Paid: {formatCurrency(accounts.treatment.paid)}</p>
                              </div>
                            </div>

                            {/* Admission Deposits */}
                            {accounts.admission.count > 0 && (
                              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <Bed className="h-5 w-5 text-teal-600" />
                                  <div>
                                    <p className="font-semibold">Admission Deposits</p>
                                    <p className="text-sm text-gray-600">{accounts.admission.count} admissions</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold">{formatCurrency(accounts.admission.deposits)}</p>
                                  <p className="text-sm text-yellow-600">Deposit received</p>
                                </div>
                              </div>
                            )}

                            {/* Baby Expenses (if mother with babies) */}
                            {babyPatients.length > 0 && (
                              <div className="mt-4 pt-4 border-t">
                                <h4 className="font-semibold text-pink-700 mb-3 flex items-center gap-2">
                                  <Baby className="h-4 w-4" />
                                  Baby Expenses (Linked to Mother)
                                </h4>
                                {babyPatients.map((baby: any) => (
                                  <div key={baby.id} className="flex items-center justify-between p-3 bg-pink-50 rounded-lg mb-2">
                                    <div className="flex items-center gap-3">
                                      <Baby className="h-5 w-5 text-pink-600" />
                                      <div>
                                        <p className="font-semibold">{baby.name}</p>
                                        <p className="text-sm text-gray-600">MR#: {baby.mr_number}</p>
                                      </div>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openBabyActions(baby)}
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      View Billing
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </div>
            </TabsContent>

            {/* OPD Tab */}
            <TabsContent value="opd">
              <div className="space-y-3 mt-4">
                {history.opdTokens?.data?.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No OPD visits recorded</p>
                  </div>
                ) : (
                  history.opdTokens?.data?.map((opd: any) => (
                    <Card key={opd.id} className={`p-4 hover:shadow-md transition-shadow ${opd.status === 'cancelled' || opd.is_cancelled ? 'opacity-60 bg-red-50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-lg">Token #{opd.token_number}</p>
                            {(opd.status === 'cancelled' || opd.is_cancelled) && (
                              <Badge variant="destructive">CANCELLED</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">Doctor: {opd.doctors?.name || 'N/A'}</p>
                          <p className="text-sm text-gray-600">Fee: {formatCurrency(opd.fee || 0)}</p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <p className="text-sm text-gray-600">{formatDateTime(opd.created_at || opd.date)}</p>
                          {opd.status !== 'cancelled' && !opd.is_cancelled && (
                            <Badge className={opd.payment_status === 'paid' ? 'bg-green-500' : 'bg-red-500'}>
                              {opd.payment_status}
                            </Badge>
                          )}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOPDDetail(opd)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {opd.status !== 'cancelled' && !opd.is_cancelled && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => cancelOPDToken(opd.id)}
                                disabled={cancellingId === opd.id}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                {cancellingId === opd.id ? 'Cancelling...' : 'Cancel'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Admissions Tab */}
            <TabsContent value="admissions">
              <div className="space-y-3 mt-4">
                {history.admissions?.data?.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <Bed className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No admissions recorded</p>
                  </div>
                ) : (
                  history.admissions?.data?.map((admission: any) => (
                    <Card key={admission.id} className={`p-4 hover:shadow-md transition-shadow ${admission.status === 'cancelled' || admission.is_cancelled ? 'opacity-60 bg-red-50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-lg">
                              Room {admission.rooms?.room_number} - {admission.rooms?.type}
                            </p>
                            {(admission.status === 'cancelled' || admission.is_cancelled) && (
                              <Badge variant="destructive">CANCELLED</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">Type: {admission.admission_type}</p>
                          <p className="text-sm text-gray-600">Doctor: {admission.doctors?.name || 'N/A'}</p>
                          <p className="text-sm text-gray-600">Deposit: {formatCurrency(admission.deposit || 0)}</p>
                          <p className="text-sm text-gray-600">
                            Admitted: {new Date(admission.admission_date).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <p className="text-sm text-gray-600">{formatDateTime(admission.created_at || admission.admission_date)}</p>
                          {admission.status !== 'cancelled' && !admission.is_cancelled && (
                            <Badge className={admission.status === 'active' ? 'bg-green-500' : admission.status === 'discharged' ? 'bg-blue-500' : 'bg-gray-500'}>
                              {admission.status}
                            </Badge>
                          )}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedAdmissionDetail(admission)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {admission.status !== 'cancelled' && !admission.is_cancelled && admission.status !== 'discharged' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => cancelAdmission(admission.id)}
                                disabled={cancellingId === admission.id}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                {cancellingId === admission.id ? 'Cancelling...' : 'Cancel'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Treatments Tab */}
            <TabsContent value="treatments">
              <div className="space-y-3 mt-4">
                {history.treatments?.data?.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <Activity className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No treatments recorded</p>
                  </div>
                ) : (
                  history.treatments?.data?.map((treatment: any) => (
                    <Card key={treatment.id} className={`p-4 hover:shadow-md transition-shadow ${treatment.status === 'cancelled' || treatment.is_cancelled ? 'opacity-60 bg-red-50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-lg">{treatment.treatment_name}</p>
                            {(treatment.status === 'cancelled' || treatment.is_cancelled) && (
                              <Badge variant="destructive">CANCELLED</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">Type: {treatment.treatment_type}</p>
                          <p className="text-sm text-gray-600">Doctor: {treatment.doctors?.name || 'N/A'}</p>
                          <p className="text-sm text-gray-600">Price: {formatCurrency(treatment.price || 0)}</p>
                          {treatment.description && (
                            <p className="text-sm text-gray-500 mt-1">{treatment.description}</p>
                          )}
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <p className="text-sm text-gray-600">{formatDateTime(treatment.created_at || treatment.date)}</p>
                          {treatment.status !== 'cancelled' && !treatment.is_cancelled && (
                            <Badge className={treatment.payment_status === 'paid' ? 'bg-green-500' : 'bg-red-500'}>
                              {treatment.payment_status}
                            </Badge>
                          )}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedTreatmentDetail(treatment)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {treatment.status !== 'cancelled' && !treatment.is_cancelled && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => cancelTreatment(treatment.id)}
                                disabled={cancellingId === treatment.id}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                {cancellingId === treatment.id ? 'Cancelling...' : 'Cancel'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Labs Tab */}
            <TabsContent value="labs">
              <div className="space-y-3 mt-4">
                {history.labOrders?.data?.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <TestTube className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No lab orders recorded</p>
                  </div>
                ) : (
                  history.labOrders?.data?.map((lab: any) => (
                    <Card key={lab.id} className={`p-4 hover:shadow-md transition-shadow ${lab.status === 'cancelled' || lab.is_cancelled ? 'opacity-60 bg-red-50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-lg">{lab.tests?.length || 0} Tests Ordered</p>
                            {(lab.status === 'cancelled' || lab.is_cancelled) && (
                              <Badge variant="destructive">CANCELLED</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">Tests: {lab.tests?.join(', ') || 'N/A'}</p>
                          <p className="text-sm text-gray-600">Amount: {formatCurrency(lab.total_amount || 0)}</p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <p className="text-sm text-gray-600">{formatDateTime(lab.created_at || lab.order_date)}</p>
                          {lab.status !== 'cancelled' && !lab.is_cancelled && (
                            <Badge>{lab.status}</Badge>
                          )}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedLabDetail(lab)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {lab.status !== 'cancelled' && !lab.is_cancelled && lab.status !== 'completed' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => cancelLabOrder(lab.id)}
                                disabled={cancellingId === lab.id}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                {cancellingId === lab.id ? 'Cancelling...' : 'Cancel'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Appointments Tab */}
            <TabsContent value="appointments">
              <div className="space-y-3 mt-4">
                {history.appointments?.data?.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No appointments recorded</p>
                  </div>
                ) : (
                  history.appointments?.data?.map((appointment: any) => (
                    <Card key={appointment.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-lg">{appointment.appointment_time}</p>
                          <p className="text-sm text-gray-600">Doctor: {appointment.doctors?.name || 'N/A'}</p>
                          <p className="text-sm text-gray-600">Reason: {appointment.reason || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 mb-1">{formatDateTime(appointment.created_at || appointment.appointment_date)}</p>
                          <Badge>{appointment.status}</Badge>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Maternity Tab - Only for female patients */}
            {selectedPatient.gender === 'Female' && (
              <TabsContent value="maternity">
                <div className="space-y-4 mt-4">
                  {/* Maternity Quick Actions */}
                  <div className="flex gap-2 mb-4">
                    <Button
                      onClick={() => setShowDeliveryForm(true)}
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      <Baby className="h-4 w-4 mr-2" />
                      Record New Delivery
                    </Button>
                  </div>

                  {/* Delivery Records */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Baby className="h-5 w-5 text-pink-500" />
                        Delivery Records ({deliveryRecords.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {deliveryRecords.length === 0 ? (
                        <div className="text-center py-8 text-gray-600">
                          <Baby className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                          <p>No delivery records found</p>
                          <p className="text-sm text-gray-500 mt-1">Click "Record New Delivery" to add birth details</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {deliveryRecords.map((record: any) => (
                            <Card key={record.id} className="p-4 border-pink-200 bg-pink-50/50">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-semibold text-lg">
                                    {record.baby_gender === 'Male' ? '👦' : '👧'} Baby {record.baby_gender}
                                    {record.multiple_birth && ` (${record.birth_order}/${record.total_babies})`}
                                  </p>
                                  <div className="text-sm text-gray-600 space-y-1 mt-2">
                                    <p><strong>Date/Time:</strong> {new Date(record.delivery_date).toLocaleDateString('en-GB')} at {record.delivery_time}</p>
                                    <p><strong>Delivery Type:</strong> {record.delivery_type}</p>
                                    <p><strong>Weight:</strong> {record.baby_weight_kg}kg ({record.baby_weight_grams}g)</p>
                                    {record.apgar_score_1min && (
                                      <p><strong>APGAR:</strong> {record.apgar_score_1min}/10 (1min), {record.apgar_score_5min}/10 (5min)</p>
                                    )}
                                    <p><strong>Condition:</strong> <Badge variant={record.baby_condition === 'Healthy' ? 'default' : 'destructive'}>{record.baby_condition}</Badge></p>
                                    <p><strong>Birth Certificate:</strong> #{record.birth_certificate_number}</p>
                                    {record.doctors?.name && <p><strong>Obstetrician:</strong> {record.doctors.name}</p>}
                                  </div>
                                </div>
                                <div className="text-right space-y-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => reprintBirthCertificate(record)}
                                  >
                                    <Printer className="h-4 w-4 mr-1" />
                                    Print Certificate
                                  </Button>
                                  {record.baby_patient_id && (
                                    <Button
                                      size="sm"
                                      className="bg-orange-500 hover:bg-orange-600"
                                      onClick={() => {
                                        // Find the baby patient or create minimal data for NICU form
                                        const babyPatient = babyPatients.find(b => b.id === record.baby_patient_id);
                                        if (babyPatient) {
                                          setSelectedBabyForNICU({
                                            ...babyPatient,
                                            mother_patient_id: selectedPatient?.id
                                          });
                                        } else {
                                          // Use delivery record data if baby not found
                                          setSelectedBabyForNICU({
                                            id: record.baby_patient_id,
                                            mr_number: 'N/A',
                                            name: `Baby of ${selectedPatient?.name}`,
                                            gender: record.baby_gender,
                                            mother_patient_id: selectedPatient?.id
                                          });
                                        }
                                        setShowNICUForm(true);
                                      }}
                                    >
                                      <Stethoscope className="h-4 w-4 mr-1" />
                                      NICU
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Baby Patients (Children of this mother) */}
                  {babyPatients.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-500" />
                          Registered Babies ({babyPatients.length})
                        </CardTitle>
                        <p className="text-sm text-gray-500">Click on a baby to manage treatments, lab tests, NICU, and billing</p>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {babyPatients.map((baby: any) => (
                            <Card
                              key={baby.id}
                              className={`p-4 cursor-pointer hover:shadow-lg transition-all border-l-4 ${baby.gender === 'Male' ? 'border-l-blue-400 hover:bg-blue-50' : 'border-l-pink-400 hover:bg-pink-50'}`}
                              onClick={() => openBabyActions(baby)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-full ${baby.gender === 'Male' ? 'bg-blue-100' : 'bg-pink-100'}`}>
                                    <Baby className={`h-5 w-5 ${baby.gender === 'Male' ? 'text-blue-600' : 'text-pink-600'}`} />
                                  </div>
                                  <div>
                                    <p className="font-semibold">{baby.name}</p>
                                    <p className="text-sm text-gray-600">
                                      <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{baby.mr_number}</span>
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                      <span>{baby.gender}</span>
                                      <span>•</span>
                                      <span>{getAgeInDays(baby.created_at)} days old</span>
                                    </div>
                                  </div>
                                </div>
                                <Badge variant={baby.gender === 'Male' ? 'default' : 'secondary'} className={baby.gender === 'Male' ? 'bg-blue-500' : 'bg-pink-500'}>
                                  {baby.gender}
                                </Badge>
                              </div>
                              <div className="flex gap-2 mt-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openBabyActions(baby);
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Manage Baby
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs border-orange-300 text-orange-600 hover:bg-orange-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBabyForNICU({
                                      ...baby,
                                      mother_patient_id: baby.mother_patient_id || selectedPatient?.id
                                    });
                                    setShowNICUForm(true);
                                  }}
                                >
                                  <Heart className="h-3 w-3 mr-1" />
                                  NICU
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            )}

            {/* Documents Tab */}
            <TabsContent value="documents">
              <div className="space-y-6 mt-4">
                {/* Consent Forms Section */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-emerald-600" />
                    Consent Forms
                    <span className="text-sm font-normal text-gray-500">(Print with patient info)</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="p-4 hover:bg-emerald-50 cursor-pointer transition-colors border-2 hover:border-emerald-300" onClick={() => printConsentForm('treatment')}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Treatment Consent</p>
                          <p className="text-sm text-gray-500" style={{ direction: 'rtl' }}>علاج کی رضامندی</p>
                        </div>
                        <Printer className="h-5 w-5 text-emerald-600" />
                      </div>
                    </Card>
                    <Card className="p-4 hover:bg-emerald-50 cursor-pointer transition-colors border-2 hover:border-emerald-300" onClick={() => printConsentForm('tl')}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">T.L. Consent</p>
                          <p className="text-sm text-gray-500" style={{ direction: 'rtl' }}>ٹیوبل لیگیشن</p>
                        </div>
                        <Printer className="h-5 w-5 text-emerald-600" />
                      </div>
                    </Card>
                    <Card className="p-4 hover:bg-red-50 cursor-pointer transition-colors border-2 hover:border-red-300" onClick={() => printConsentForm('lama')}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">LAMA Form</p>
                          <p className="text-sm text-gray-500" style={{ direction: 'rtl' }}>طبی مشورے کے خلاف</p>
                        </div>
                        <Printer className="h-5 w-5 text-red-600" />
                      </div>
                    </Card>
                  </div>
                </div>

                {/* Patient File Forms Section - Clinical Documentation */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-teal-600" />
                    Patient File Forms - Clinical Documentation
                    <span className="text-sm font-normal text-gray-500">(Print blank forms for manual documentation)</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <Card
                      className="p-4 hover:bg-teal-50 cursor-pointer transition-colors border-2 hover:border-teal-300"
                      onClick={handlePrintFileCoverSheet}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-teal-700">File Cover Sheet</p>
                          <p className="text-xs text-gray-500">Auto-populated with patient data</p>
                        </div>
                        <Printer className="h-5 w-5 text-teal-600" />
                      </div>
                    </Card>
                    <Card
                      className="p-4 hover:bg-red-50 cursor-pointer transition-colors border-2 hover:border-red-300"
                      onClick={handlePrintAllergiesConditions}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-red-700">Allergies & Conditions</p>
                          <p className="text-xs text-gray-500">⚠ Critical safety form</p>
                        </div>
                        <Printer className="h-5 w-5 text-red-600" />
                      </div>
                    </Card>
                    <Card
                      className="p-4 hover:bg-blue-50 cursor-pointer transition-colors border-2 hover:border-blue-300"
                      onClick={handlePrintVisitNotes}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-blue-700">Visit Notes</p>
                          <p className="text-xs text-gray-500">5 visits per page</p>
                        </div>
                        <Printer className="h-5 w-5 text-blue-600" />
                      </div>
                    </Card>
                    <Card
                      className="p-4 hover:bg-purple-50 cursor-pointer transition-colors border-2 hover:border-purple-300"
                      onClick={handlePrintVitalsChart}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-purple-700">Vitals Chart</p>
                          <p className="text-xs text-gray-500">20 entries (landscape)</p>
                        </div>
                        <Printer className="h-5 w-5 text-purple-600" />
                      </div>
                    </Card>
                    <Card
                      className="p-4 hover:bg-orange-50 cursor-pointer transition-colors border-2 hover:border-orange-300"
                      onClick={handlePrintDiagnosisRecord}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-orange-700">Diagnosis Record</p>
                          <p className="text-xs text-gray-500">With ICD-10 codes</p>
                        </div>
                        <Printer className="h-5 w-5 text-orange-600" />
                      </div>
                    </Card>
                    <Card
                      className="p-4 hover:bg-green-50 cursor-pointer transition-colors border-2 hover:border-green-300"
                      onClick={handlePrintMedicationChart}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-green-700">Medication Chart</p>
                          <p className="text-xs text-gray-500">25 entries (landscape)</p>
                        </div>
                        <Printer className="h-5 w-5 text-green-600" />
                      </div>
                    </Card>
                    <Card
                      className="p-4 hover:bg-indigo-50 cursor-pointer transition-colors border-2 hover:border-indigo-300"
                      onClick={handlePrintPrescriptionPad}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-indigo-700">Prescription Pad</p>
                          <p className="text-xs text-gray-500">4 prescriptions per page</p>
                        </div>
                        <Printer className="h-5 w-5 text-indigo-600" />
                      </div>
                    </Card>
                    <Card
                      className="p-4 hover:bg-pink-50 cursor-pointer transition-colors border-2 hover:border-pink-300"
                      onClick={handlePrintFollowupChecklist}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-pink-700">Follow-up Checklist</p>
                          <p className="text-xs text-gray-500">Appointment tracking</p>
                        </div>
                        <Printer className="h-5 w-5 text-pink-600" />
                      </div>
                    </Card>
                  </div>
                  <Button
                    onClick={handlePrintAllPatientFileForms}
                    className="w-full bg-teal-600 hover:bg-teal-700"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print All Forms (Complete File Set - 8 Forms)
                  </Button>
                  <p className="text-xs text-teal-600 mt-2">
                    📋 Print all forms and assemble in a physical file folder. Staple digital receipts as they are generated.
                  </p>
                </div>

                {/* Patient Records Section */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-blue-600" />
                    Patient Records
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {history.opdTokens?.data?.length > 0 && (
                      <Card className="p-4 bg-blue-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">OPD Receipts</p>
                            <p className="text-sm text-gray-600">{history.opdTokens.data.length} records available</p>
                          </div>
                          <Badge variant="outline" className="text-blue-600">{history.opdTokens.data.length}</Badge>
                        </div>
                      </Card>
                    )}
                    {history.labOrders?.data?.length > 0 && (
                      <Card className="p-4 bg-green-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Lab Reports</p>
                            <p className="text-sm text-gray-600">{history.labOrders.data.length} reports available</p>
                          </div>
                          <Badge variant="outline" className="text-green-600">{history.labOrders.data.length}</Badge>
                        </div>
                      </Card>
                    )}
                    {history.admissions?.data?.length > 0 && (
                      <Card className="p-4 bg-purple-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Admission Papers</p>
                            <p className="text-sm text-gray-600">{history.admissions.data.length} admissions</p>
                          </div>
                          <Badge variant="outline" className="text-purple-600">{history.admissions.data.length}</Badge>
                        </div>
                      </Card>
                    )}
                    {history.treatments?.data?.length > 0 && (
                      <Card className="p-4 bg-red-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Treatment Records</p>
                            <p className="text-sm text-gray-600">{history.treatments.data.length} treatments</p>
                          </div>
                          <Badge variant="outline" className="text-red-600">{history.treatments.data.length}</Badge>
                        </div>
                      </Card>
                    )}
                  </div>
                  {history.opdTokens?.data?.length === 0 && history.labOrders?.data?.length === 0 &&
                   history.admissions?.data?.length === 0 && history.treatments?.data?.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      <FileText className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                      <p>No records available yet</p>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-lg mb-3">Quick Print Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => printMRCard(selectedPatient)}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Print MR Card
                    </Button>
                    <Button variant="outline" onClick={printCompleteProfile}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print Complete File
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* OPD Detail Modal */}
      {selectedOPDDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">OPD Visit Details</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOPDDetail(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Receipt Number */}
                <div className="bg-teal-50 p-4 rounded-lg border-2 border-teal-600">
                  <p className="text-sm text-gray-600">Receipt Number</p>
                  <p className="text-2xl font-bold text-teal-700">
                    OPD-{selectedOPDDetail.id.slice(-8).toUpperCase()}
                  </p>
                </div>

                {/* Patient Info */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Patient Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="font-medium">{selectedPatient?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">MR Number</p>
                      <p className="font-medium">{selectedPatient?.mrNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Age / Gender</p>
                      <p className="font-medium">{selectedPatient?.age} years / {selectedPatient?.gender}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Contact</p>
                      <p className="font-medium">{selectedPatient?.contact}</p>
                    </div>
                  </div>
                </div>

                {/* Visit Details */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    Visit Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">Token Number</p>
                      <p className="font-medium text-lg">#{selectedOPDDetail.token_number}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Visit Date</p>
                      <p className="font-medium">{formatDateTime(selectedOPDDetail.created_at || selectedOPDDetail.date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Doctor</p>
                      <p className="font-medium">{selectedOPDDetail.doctors?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Department</p>
                      <p className="font-medium">{selectedOPDDetail.doctors?.department || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-yellow-600" />
                    Payment Details
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">OPD Fee</span>
                      <span className="font-bold text-lg">{formatCurrency(selectedOPDDetail.fee || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Payment Status</span>
                      <Badge className={selectedOPDDetail.payment_status === 'paid' ? 'bg-green-500' : 'bg-red-500'}>
                        {selectedOPDDetail.payment_status?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => reprintOPDReceipt(selectedOPDDetail)}
                    className="flex-1 bg-teal-600 hover:bg-teal-700"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Reprint Receipt
                  </Button>
                  <Button
                    onClick={() => setSelectedOPDDetail(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lab Detail Modal */}
      {selectedLabDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Lab Order Details</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedLabDetail(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Receipt Number */}
                <div className="bg-green-50 p-4 rounded-lg border-2 border-green-600">
                  <p className="text-sm text-gray-600">Receipt Number</p>
                  <p className="text-2xl font-bold text-green-700">
                    LAB-{selectedLabDetail.id.slice(-8).toUpperCase()}
                  </p>
                </div>

                {/* Patient Info */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Patient Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="font-medium">{selectedPatient?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">MR Number</p>
                      <p className="font-medium">{selectedPatient?.mrNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Age / Gender</p>
                      <p className="font-medium">{selectedPatient?.age} years / {selectedPatient?.gender}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Contact</p>
                      <p className="font-medium">{selectedPatient?.contact}</p>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <TestTube className="h-5 w-5 text-purple-600" />
                    Order Details
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Order Date</p>
                      <p className="font-medium">{formatDateTime(selectedLabDetail.created_at || selectedLabDetail.order_date)}</p>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <Badge>{selectedLabDetail.status}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Tests Ordered ({selectedLabDetail.tests?.length || 0})</p>
                      <ul className="space-y-1">
                        {selectedLabDetail.tests?.map((test: string, index: number) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>{test}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-yellow-600" />
                    Payment Details
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Total Amount</span>
                      <span className="font-bold text-lg">{formatCurrency(selectedLabDetail.total_amount || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Payment Status</span>
                      <Badge className={selectedLabDetail.payment_status === 'paid' ? 'bg-green-500' : 'bg-red-500'}>
                        {selectedLabDetail.payment_status?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => reprintLabReceipt(selectedLabDetail)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Reprint Receipt
                  </Button>
                  <Button
                    onClick={() => setSelectedLabDetail(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Treatment Detail Modal */}
      {selectedTreatmentDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Treatment Details</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTreatmentDetail(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Receipt Number */}
                <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-600">
                  <p className="text-sm text-gray-600">Receipt Number</p>
                  <p className="text-2xl font-bold text-orange-700">
                    TRT-{selectedTreatmentDetail.id.slice(-8).toUpperCase()}
                  </p>
                </div>

                {/* Patient Info */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Patient Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="font-medium">{selectedPatient?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">MR Number</p>
                      <p className="font-medium">{selectedPatient?.mrNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Age / Gender</p>
                      <p className="font-medium">{selectedPatient?.age} years / {selectedPatient?.gender}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Contact</p>
                      <p className="font-medium">{selectedPatient?.contact}</p>
                    </div>
                  </div>
                </div>

                {/* Treatment Details */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-orange-600" />
                    Treatment Details
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Treatment Name</p>
                      <p className="font-medium text-lg">{selectedTreatmentDetail.treatment_name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Type</p>
                        <p className="font-medium">{selectedTreatmentDetail.treatment_type || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="font-medium">{formatDateTime(selectedTreatmentDetail.created_at || selectedTreatmentDetail.date)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Doctor</p>
                      <p className="font-medium">{selectedTreatmentDetail.doctors?.name || 'N/A'}</p>
                    </div>
                    {selectedTreatmentDetail.description && (
                      <div>
                        <p className="text-xs text-gray-500">Description</p>
                        <p className="font-medium">{selectedTreatmentDetail.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Details */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-yellow-600" />
                    Payment Details
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Treatment Price</span>
                      <span className="font-bold text-lg">{formatCurrency(selectedTreatmentDetail.price || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Payment Status</span>
                      <Badge className={selectedTreatmentDetail.payment_status === 'paid' ? 'bg-green-500' : 'bg-red-500'}>
                        {selectedTreatmentDetail.payment_status?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => reprintTreatmentReceipt(selectedTreatmentDetail)}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Reprint Receipt
                  </Button>
                  <Button
                    onClick={() => setSelectedTreatmentDetail(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Admission Detail Modal */}
      {selectedAdmissionDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b bg-indigo-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Bed className="h-6 w-6 text-indigo-600" />
                  Admission Details
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAdmissionDetail(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Admission ID */}
                <div className="bg-indigo-50 p-4 rounded-lg border-2 border-indigo-600">
                  <p className="text-sm text-gray-600">Admission Reference</p>
                  <p className="text-2xl font-bold text-indigo-700">
                    ADM-{selectedAdmissionDetail.id.slice(-8).toUpperCase()}
                  </p>
                </div>

                {/* Patient Info */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Patient Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="font-medium">{selectedPatient?.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">MR Number</p>
                      <p className="font-medium">{selectedPatient?.mrNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Age / Gender</p>
                      <p className="font-medium">{selectedPatient?.age} years / {selectedPatient?.gender}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Contact</p>
                      <p className="font-medium">{selectedPatient?.contact}</p>
                    </div>
                  </div>
                </div>

                {/* Admission Details */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Bed className="h-5 w-5 text-indigo-600" />
                    Admission Information
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Room</p>
                        <p className="font-medium text-lg">
                          {selectedAdmissionDetail.rooms?.room_number} - {selectedAdmissionDetail.rooms?.type}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Bed Number</p>
                        <p className="font-medium">{selectedAdmissionDetail.bed_number || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Admission Type</p>
                        <p className="font-medium">{selectedAdmissionDetail.admission_type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <Badge className={selectedAdmissionDetail.status === 'active' ? 'bg-green-500' : selectedAdmissionDetail.status === 'discharged' ? 'bg-blue-500' : 'bg-gray-500'}>
                          {selectedAdmissionDetail.status?.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Admission Date</p>
                        <p className="font-medium">{new Date(selectedAdmissionDetail.admission_date).toLocaleDateString('en-GB')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Doctor</p>
                        <p className="font-medium">{selectedAdmissionDetail.doctors?.name || 'N/A'}</p>
                      </div>
                    </div>
                    {selectedAdmissionDetail.notes && (
                      <div>
                        <p className="text-xs text-gray-500">Notes</p>
                        <p className="font-medium">{selectedAdmissionDetail.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Details */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Financial Information
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Room Rate</span>
                      <span className="font-medium">{formatCurrency(selectedAdmissionDetail.rooms?.price_per_day || 0)}/day</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Deposit Paid</span>
                      <span className="font-bold text-lg text-green-600">{formatCurrency(selectedAdmissionDetail.deposit || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => setSelectedAdmissionDetail(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hidden components for printing patient file forms */}
      {selectedPatient && (
        <div style={{ display: 'none' }}>
          <FileCoverSheet
            ref={coverSheetRef}
            patientData={{
              mr_number: selectedPatient.mrNumber!,
              name: selectedPatient.name,
              age: selectedPatient.age,
              gender: selectedPatient.gender,
              contact: selectedPatient.contact,
              cnic_number: selectedPatient.cnicNumber,
              blood_group: selectedPatient.bloodGroup,
              address: selectedPatient.address,
              emergency_contact: selectedPatient.emergencyContact,
              created_at: selectedPatient.registrationDate!
            }}
          />
          <VisitNotesTemplate
            ref={visitNotesRef}
            patientData={{
              mr_number: selectedPatient.mrNumber!,
              name: selectedPatient.name
            }}
          />
          <VitalsChartTemplate
            ref={vitalsChartRef}
            patientData={{
              mr_number: selectedPatient.mrNumber!,
              name: selectedPatient.name
            }}
          />
          <DiagnosisRecordTemplate
            ref={diagnosisRecordRef}
            patientData={{
              mr_number: selectedPatient.mrNumber!,
              name: selectedPatient.name
            }}
          />
          <MedicationChartTemplate
            ref={medicationChartRef}
            patientData={{
              mr_number: selectedPatient.mrNumber!,
              name: selectedPatient.name
            }}
          />
          <AllergiesConditionsTemplate
            ref={allergiesConditionsRef}
            patientData={{
              mr_number: selectedPatient.mrNumber!,
              name: selectedPatient.name,
              blood_group: selectedPatient.bloodGroup
            }}
          />
          <PrescriptionPadTemplate
            ref={prescriptionPadRef}
            patientData={{
              mr_number: selectedPatient.mrNumber!,
              name: selectedPatient.name,
              age: selectedPatient.age,
              gender: selectedPatient.gender
            }}
          />
          <FollowupChecklistTemplate
            ref={followupChecklistRef}
            patientData={{
              mr_number: selectedPatient.mrNumber!,
              name: selectedPatient.name
            }}
          />
        </div>
      )}

      {/* Delivery Record Form Modal */}
      {selectedPatient && selectedPatient.gender === 'Female' && (
        <DeliveryRecordForm
          isOpen={showDeliveryForm}
          onClose={() => setShowDeliveryForm(false)}
          patient={{
            id: selectedPatient.id,
            mr_number: selectedPatient.mrNumber || '',
            name: selectedPatient.name,
            age: selectedPatient.age,
            gender: selectedPatient.gender,
            contact: selectedPatient.contact,
            address: selectedPatient.address,
            care_of: selectedPatient.careOf
          }}
          admission={history.admissions?.data?.find((a: any) => a.status === 'active')}
          onSuccess={() => {
            loadMaternityData();
            toast.success('Delivery record saved successfully');
          }}
          onNICUAdmit={(babyPatient) => {
            setSelectedBabyForNICU(babyPatient);
            setShowNICUForm(true);
          }}
        />
      )}

      {/* NICU Observation Form Modal */}
      {selectedBabyForNICU && (
        <NICUObservationForm
          isOpen={showNICUForm}
          onClose={() => {
            setShowNICUForm(false);
            setSelectedBabyForNICU(null);
          }}
          babyPatient={{
            id: selectedBabyForNICU.id,
            mr_number: selectedBabyForNICU.mr_number,
            name: selectedBabyForNICU.name,
            gender: selectedBabyForNICU.gender,
            mother_patient_id: selectedBabyForNICU.mother_patient_id
          }}
          onSuccess={() => {
            toast.success('NICU observation recorded');
            if (selectedPatient?.gender === 'Female') {
              loadMaternityData();
            }
          }}
        />
      )}

      {/* Birth Certificate Print Dialog */}
      {showBirthCertificate && birthCertificateData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Birth Certificate Preview</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowBirthCertificate(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <BirthCertificateTemplate ref={birthCertificateRef} data={birthCertificateData} />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowBirthCertificate(false)}>
                Close
              </Button>
              <Button onClick={() => handlePrintBirthCertificate()}>
                <Printer className="h-4 w-4 mr-2" />
                Print Certificate
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Baby Actions/Management Dialog */}
      {showBabyActionsDialog && selectedBabyForActions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
            {/* Header */}
            <div className={`p-4 ${selectedBabyForActions.gender === 'Male' ? 'bg-blue-50' : 'bg-pink-50'} border-b`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${selectedBabyForActions.gender === 'Male' ? 'bg-blue-100' : 'bg-pink-100'}`}>
                    <Baby className={`h-6 w-6 ${selectedBabyForActions.gender === 'Male' ? 'text-blue-600' : 'text-pink-600'}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{selectedBabyForActions.name}</h2>
                    <p className="text-sm text-gray-600">
                      <span className="font-mono bg-white px-2 py-0.5 rounded">{selectedBabyForActions.mr_number}</span>
                      <span className="mx-2">•</span>
                      <span>{selectedBabyForActions.gender}</span>
                      <span className="mx-2">•</span>
                      <span>{getAgeInDays(selectedBabyForActions.created_at)} days old</span>
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowBabyActionsDialog(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              {/* Billing Info Banner */}
              <div className="mt-3 p-2 bg-white rounded-lg border border-green-200 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">
                  <strong>Billing linked to:</strong> {selectedPatient?.name} ({selectedPatient?.mrNumber})
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <Tabs defaultValue="info">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="info">Baby Info</TabsTrigger>
                  <TabsTrigger value="nicu">NICU ({babyNicuObservations.length})</TabsTrigger>
                  <TabsTrigger value="actions">Quick Actions</TabsTrigger>
                  <TabsTrigger value="billing">Billing</TabsTrigger>
                </TabsList>

                {/* Baby Info Tab */}
                <TabsContent value="info" className="mt-4">
                  {loadingBabyData ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
                      <p className="text-gray-500 mt-2">Loading baby data...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-500">Baby Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Name:</span>
                            <span className="font-medium">{selectedBabyForActions.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">MR Number:</span>
                            <span className="font-mono">{selectedBabyForActions.mr_number}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Gender:</span>
                            <Badge className={selectedBabyForActions.gender === 'Male' ? 'bg-blue-500' : 'bg-pink-500'}>
                              {selectedBabyForActions.gender}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Age:</span>
                            <span>{getAgeInDays(selectedBabyForActions.created_at)} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Date of Birth:</span>
                            <span>{new Date(selectedBabyForActions.created_at).toLocaleDateString('en-GB')}</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-500">Birth Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          {babyDeliveryRecord ? (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Delivery Type:</span>
                                <span className="font-medium">{babyDeliveryRecord.delivery_type}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Weight:</span>
                                <span>{babyDeliveryRecord.baby_weight_kg}kg ({babyDeliveryRecord.baby_weight_grams}g)</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">APGAR (1/5 min):</span>
                                <span>{babyDeliveryRecord.apgar_score_1min || '-'}/{babyDeliveryRecord.apgar_score_5min || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Condition:</span>
                                <Badge variant={babyDeliveryRecord.baby_condition === 'Healthy' ? 'default' : 'destructive'}>
                                  {babyDeliveryRecord.baby_condition}
                                </Badge>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Birth Cert #:</span>
                                <span className="font-mono">{babyDeliveryRecord.birth_certificate_number}</span>
                              </div>
                            </>
                          ) : (
                            <p className="text-gray-500 text-center py-4">No delivery record found</p>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="col-span-2">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm text-gray-500">Mother Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Name:</span>
                            <p className="font-medium">{selectedPatient?.name}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">MR Number:</span>
                            <p className="font-mono">{selectedPatient?.mrNumber}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Contact:</span>
                            <p>{selectedPatient?.contact || 'N/A'}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>

                {/* NICU Tab */}
                <TabsContent value="nicu" className="mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">NICU Observations</h3>
                    <Button
                      className="bg-orange-500 hover:bg-orange-600"
                      onClick={() => {
                        setSelectedBabyForNICU(selectedBabyForActions);
                        setShowNICUForm(true);
                      }}
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      Add NICU Observation
                    </Button>
                  </div>

                  {loadingBabyData ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
                    </div>
                  ) : babyNicuObservations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Heart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No NICU observations recorded</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {babyNicuObservations.map((obs: any) => (
                        <Card key={obs.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                {new Date(obs.observation_date).toLocaleDateString('en-GB')}
                              </p>
                              <p className="text-sm text-gray-500">
                                {obs.start_time && new Date(obs.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                {obs.end_time && ` - ${new Date(obs.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
                                {!obs.end_time && ' - Ongoing'}
                              </p>
                            </div>
                            <Badge variant={obs.condition === 'Stable' ? 'default' : 'destructive'}>
                              {obs.condition}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
                            {obs.temperature && <div><span className="text-gray-500">Temp:</span> {obs.temperature}°C</div>}
                            {obs.heart_rate && <div><span className="text-gray-500">HR:</span> {obs.heart_rate} bpm</div>}
                            {obs.respiratory_rate && <div><span className="text-gray-500">RR:</span> {obs.respiratory_rate}/min</div>}
                            {obs.oxygen_saturation && <div><span className="text-gray-500">SpO2:</span> {obs.oxygen_saturation}%</div>}
                          </div>
                          {obs.hours_charged > 0 && (
                            <div className="mt-2 pt-2 border-t text-sm text-green-600">
                              <DollarSign className="h-3 w-3 inline mr-1" />
                              Rs. {obs.total_charge?.toLocaleString()} ({obs.hours_charged} hrs)
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Quick Actions Tab */}
                <TabsContent value="actions" className="mt-4">
                  <div className="text-center mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-green-700 text-sm">
                      <DollarSign className="h-4 w-4 inline mr-1" />
                      All charges will be added to <strong>{selectedPatient?.name}'s</strong> account
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Button
                      variant="outline"
                      className="h-24 flex flex-col gap-2 border-orange-300 hover:bg-orange-50"
                      onClick={() => {
                        setSelectedBabyForNICU(selectedBabyForActions);
                        setShowNICUForm(true);
                      }}
                    >
                      <Heart className="h-8 w-8 text-orange-600" />
                      <span className="text-sm">NICU Observation</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-24 flex flex-col gap-2 border-teal-300 hover:bg-teal-50"
                      onClick={() => {
                        toast.info(`To add treatment for ${selectedBabyForActions.name}: Go to Treatments module and select the baby as patient. Charges will be tracked under mother's file.`);
                      }}
                    >
                      <Activity className="h-8 w-8 text-teal-600" />
                      <span className="text-sm">Add Treatment</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-24 flex flex-col gap-2 border-purple-300 hover:bg-purple-50"
                      onClick={() => {
                        toast.info(`To order lab tests for ${selectedBabyForActions.name}: Go to Laboratory module and select the baby as patient. Charges will be tracked under mother's file.`);
                      }}
                    >
                      <TestTube className="h-8 w-8 text-purple-600" />
                      <span className="text-sm">Order Lab Test</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-24 flex flex-col gap-2 border-green-300 hover:bg-green-50"
                      onClick={() => {
                        if (babyDeliveryRecord) {
                          reprintBirthCertificate(babyDeliveryRecord);
                        } else {
                          toast.error('No delivery record found for this baby');
                        }
                      }}
                    >
                      <Printer className="h-8 w-8 text-green-600" />
                      <span className="text-sm">Print Birth Cert</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-24 flex flex-col gap-2 border-blue-300 hover:bg-blue-50"
                      onClick={() => {
                        toast.info(`Baby MR: ${selectedBabyForActions.mr_number} - You can search for this patient in Patient Files to view full history`);
                      }}
                    >
                      <FileText className="h-8 w-8 text-blue-600" />
                      <span className="text-sm">View Baby File</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="h-24 flex flex-col gap-2 border-gray-300 hover:bg-gray-50"
                      onClick={() => {
                        loadBabyData(selectedBabyForActions);
                        toast.success('Data refreshed');
                      }}
                    >
                      <RefreshCw className="h-8 w-8 text-gray-600" />
                      <span className="text-sm">Refresh Data</span>
                    </Button>
                  </div>
                </TabsContent>

                {/* Billing Tab */}
                <TabsContent value="billing" className="mt-4">
                  <Card className="mb-4 bg-green-50 border-green-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="font-semibold text-green-800">Billing Account: {selectedPatient?.name}</p>
                          <p className="text-sm text-green-600">MR: {selectedPatient?.mrNumber}</p>
                          <p className="text-xs text-gray-500 mt-1">All baby charges are linked to mother's account for consolidated billing</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Baby Charges Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Heart className="h-5 w-5 text-orange-600" />
                            <span>NICU Observations ({babyNicuObservations.length})</span>
                          </div>
                          <span className="font-bold text-orange-600">
                            Rs. {calculateBabyNicuCharges().toLocaleString()}
                          </span>
                        </div>

                        <Separator />

                        <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                          <span className="font-semibold">Total Baby Charges</span>
                          <span className="text-xl font-bold text-green-600">
                            Rs. {calculateBabyNicuCharges().toLocaleString()}
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 text-center mt-2">
                          * These charges will appear in the mother's billing invoice
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBabyActionsDialog(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
