import React, { useState, useEffect } from 'react';
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
  ClipboardList, Download
} from 'lucide-react';
import { Patient, formatCurrency, generateMRNumber } from '@/lib/hospitalData';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';

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
    } catch (error) {
      console.error('Error loading patient history:', error);
      toast.error('Failed to load patient history');
    } finally {
      setLoading(false);
    }
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
          @page { size: A4; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Tahoma', 'Arial', sans-serif; font-size: 11pt; line-height: 1.6; padding: 8mm; padding-top: 76mm; }
          .title-box { text-align: center; background: #007B8A; color: white; padding: 10px; margin-bottom: 20px; }
          .title { font-size: 16pt; font-weight: bold; }
          .title-urdu { font-size: 14pt; }
          .patient-info { background: #E8F7FC; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007B8A; }
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
          .footer { margin-top: 30px; padding-top: 15px; border-top: 1px dashed #ccc; font-size: 9pt; color: #666; text-align: center; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <!-- Pre-printed letterhead space - content starts 5 inches from top -->
        <div class="title-box">
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
      pending.push({ type: 'OPD', description: `Token #${o.token_number}`, amount: o.fee, date: o.date });
    });

    history.labOrders?.data?.filter((l: any) => l.payment_status !== 'paid').forEach((l: any) => {
      pending.push({ type: 'Lab', description: `${l.tests?.length || 0} tests`, amount: l.total_amount, date: l.order_date });
    });

    history.treatments?.data?.filter((t: any) => t.payment_status !== 'paid').forEach((t: any) => {
      pending.push({ type: 'Treatment', description: t.treatment_name, amount: t.price, date: t.date });
    });

    return pending;
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
          @page { size: A4; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Tahoma', 'Arial', sans-serif; font-size: 11pt; line-height: 1.4; padding: 8mm; padding-top: 76mm; }
          .title-bar { text-align: center; background: #007B8A; color: white; padding: 10px; margin-bottom: 15px; }
          .title-bar h1 { font-size: 14pt; margin-bottom: 5px; }
          .mr-box { background: #005F6B; color: white; padding: 5px 15px; font-size: 14pt; font-weight: bold; display: inline-block; border-radius: 5px; font-family: 'Courier New', monospace; }
          .section { margin: 15px 0; page-break-inside: avoid; }
          .section-title { font-size: 12pt; font-weight: bold; color: #007B8A; border-bottom: 2px solid #007B8A; padding-bottom: 5px; margin-bottom: 10px; }
          .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: #E8F7FC; padding: 15px; border-radius: 5px; }
          .info-item { }
          .info-label { font-size: 9pt; color: #666; }
          .info-value { font-weight: bold; }
          .timeline-item { border-left: 3px solid #007B8A; padding-left: 15px; margin-bottom: 15px; }
          .timeline-date { font-size: 9pt; color: #666; }
          .timeline-type { font-weight: bold; color: #007B8A; }
          .timeline-details { font-size: 10pt; margin-top: 5px; }
          .financial-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
          .financial-box { background: #E8F7FC; padding: 10px; border-radius: 5px; text-align: center; }
          .financial-amount { font-size: 14pt; font-weight: bold; }
          .financial-label { font-size: 9pt; color: #666; }
          .footer { border-top: 1px solid #ccc; padding-top: 10px; margin-top: 20px; font-size: 9pt; color: #666; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10pt; }
          th { background: #E8F7FC; }
          .status-paid { color: green; }
          .status-pending { color: red; }
        </style>
      </head>
      <body>
        <!-- Pre-printed letterhead space - content starts 5 inches from top -->
        <div class="title-bar">
          <h1>Complete Patient Medical Record</h1>
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

        <!-- Admissions Section -->
        ${history.admissions?.data?.length > 0 ? `
        <div class="section">
          <div class="section-title">Admissions (${history.admissions.data.length} records)</div>
          ${history.admissions.data.map((a: any) => `
            <div style="background: #f8f9fa; padding: 12px; margin-bottom: 10px; border-left: 4px solid #007B8A; border-radius: 4px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <strong style="color: #007B8A;">Admission: ${formatDate(a.admission_date)}</strong>
                <span class="${a.status === 'discharged' ? 'status-paid' : 'status-pending'}">${a.status?.toUpperCase() || 'ACTIVE'}</span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 10pt;">
                <div><strong>Type:</strong> ${a.admission_type || 'N/A'}</div>
                <div><strong>Room:</strong> ${a.rooms?.room_number || 'N/A'} (${a.rooms?.room_type || ''})</div>
                <div><strong>Deposit:</strong> ${formatCurrency(a.deposit || 0)}</div>
                <div><strong>Doctor:</strong> Dr. ${a.doctors?.name || 'N/A'}</div>
                ${a.discharge_date ? `<div><strong>Discharged:</strong> ${formatDate(a.discharge_date)}</div>` : ''}
                ${a.discharge_condition ? `<div><strong>Condition:</strong> ${a.discharge_condition}</div>` : ''}
              </div>
              ${a.diagnosis ? `<div style="margin-top: 8px;"><strong>Diagnosis:</strong> ${a.diagnosis}</div>` : ''}
              ${a.notes ? `<div style="margin-top: 5px;"><strong>Notes:</strong> ${a.notes}</div>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Treatments Section -->
        ${history.treatments?.data?.length > 0 ? `
        <div class="section">
          <div class="section-title">Treatments (${history.treatments.data.length} records)</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Treatment Name</th>
                <th>Type</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${history.treatments.data.map((t: any) => `
                <tr>
                  <td>${formatDate(t.date)}</td>
                  <td><strong>${t.treatment_name || 'N/A'}</strong></td>
                  <td>${t.treatment_type || 'N/A'}</td>
                  <td style="max-width: 200px;">${t.description || t.notes || 'N/A'}</td>
                  <td>${formatCurrency(t.price || 0)}</td>
                  <td class="${t.payment_status === 'paid' ? 'status-paid' : 'status-pending'}">${t.payment_status || 'pending'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Lab Tests Section -->
        ${history.labOrders?.data?.length > 0 ? `
        <div class="section">
          <div class="section-title">Laboratory Tests (${history.labOrders.data.length} orders)</div>
          ${history.labOrders.data.map((lab: any) => `
            <div style="background: #f8f9fa; padding: 12px; margin-bottom: 10px; border-left: 4px solid #3A9AD9; border-radius: 4px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <strong style="color: #3A9AD9;">Order Date: ${formatDate(lab.order_date)}</strong>
                <span class="${lab.status === 'completed' ? 'status-paid' : 'status-pending'}">${lab.status?.toUpperCase() || 'PENDING'}</span>
              </div>
              <div style="font-size: 10pt;">
                <div><strong>Tests:</strong> ${lab.tests?.map((t: any) => t.test_name || t.name).join(', ') || 'N/A'}</div>
                <div><strong>Total Amount:</strong> ${formatCurrency(lab.total_amount || 0)} | <strong>Payment:</strong> <span class="${lab.payment_status === 'paid' ? 'status-paid' : 'status-pending'}">${lab.payment_status || 'pending'}</span></div>
                ${lab.doctors ? `<div><strong>Ordered by:</strong> Dr. ${lab.doctors.name}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- OPD Visits Section -->
        ${history.opdTokens?.data?.length > 0 ? `
        <div class="section">
          <div class="section-title">OPD Visits (${history.opdTokens.data.length} visits)</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Token #</th>
                <th>Doctor</th>
                <th>Department</th>
                <th>Fee</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${history.opdTokens.data.map((opd: any) => `
                <tr>
                  <td>${formatDate(opd.date)}</td>
                  <td><strong>${opd.token_number}</strong></td>
                  <td>Dr. ${opd.doctors?.name || 'N/A'}</td>
                  <td>${opd.doctors?.department || 'N/A'}</td>
                  <td>${formatCurrency(opd.fee || 0)}</td>
                  <td class="${opd.payment_status === 'paid' ? 'status-paid' : 'status-pending'}">${opd.payment_status || 'pending'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Visit Timeline Summary -->
        <div class="section">
          <div class="section-title">Complete Visit History (${timeline.length} records)</div>
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
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <h4 className="font-semibold text-red-700">Pending Payments ({pendingItems.length})</h4>
              </div>
              <div className="space-y-2">
                {pendingItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.type}: {item.description}</span>
                    <span className="font-semibold">{formatCurrency(item.amount)}</span>
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
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="timeline">Timeline ({timeline.length})</TabsTrigger>
              <TabsTrigger value="opd">OPD ({history.opdTokens?.data?.length || 0})</TabsTrigger>
              <TabsTrigger value="admissions">Admissions ({history.admissions?.data?.length || 0})</TabsTrigger>
              <TabsTrigger value="treatments">Treatments ({history.treatments?.data?.length || 0})</TabsTrigger>
              <TabsTrigger value="labs">Labs ({history.labOrders?.data?.length || 0})</TabsTrigger>
              <TabsTrigger value="appointments">Appointments ({history.appointments?.data?.length || 0})</TabsTrigger>
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
                    <Card key={opd.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-lg">Token #{opd.token_number}</p>
                          <p className="text-sm text-gray-600">Doctor: {opd.doctors?.name || 'N/A'}</p>
                          <p className="text-sm text-gray-600">Fee: {formatCurrency(opd.fee || 0)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 mb-1">{formatDateTime(opd.created_at || opd.date)}</p>
                          <Badge className={opd.payment_status === 'paid' ? 'bg-green-500' : 'bg-red-500'}>
                            {opd.payment_status}
                          </Badge>
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
                    <Card key={admission.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-lg">
                            Room {admission.rooms?.room_number} - {admission.rooms?.type}
                          </p>
                          <p className="text-sm text-gray-600">Type: {admission.admission_type}</p>
                          <p className="text-sm text-gray-600">Doctor: {admission.doctors?.name || 'N/A'}</p>
                          <p className="text-sm text-gray-600">Deposit: {formatCurrency(admission.deposit || 0)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 mb-1">{formatDateTime(admission.created_at || admission.admission_date)}</p>
                          <Badge>{admission.status}</Badge>
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
                    <Card key={treatment.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-lg">{treatment.treatment_name}</p>
                          <p className="text-sm text-gray-600">Type: {treatment.treatment_type}</p>
                          <p className="text-sm text-gray-600">Doctor: {treatment.doctors?.name || 'N/A'}</p>
                          <p className="text-sm text-gray-600">Price: {formatCurrency(treatment.price || 0)}</p>
                          {treatment.description && (
                            <p className="text-sm text-gray-500 mt-1">{treatment.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 mb-1">{formatDateTime(treatment.created_at || treatment.date)}</p>
                          <Badge className={treatment.payment_status === 'paid' ? 'bg-green-500' : 'bg-red-500'}>
                            {treatment.payment_status}
                          </Badge>
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
                    <Card key={lab.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-lg">{lab.tests?.length || 0} Tests Ordered</p>
                          <p className="text-sm text-gray-600">Tests: {lab.tests?.join(', ') || 'N/A'}</p>
                          <p className="text-sm text-gray-600">Amount: {formatCurrency(lab.total_amount || 0)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 mb-1">{formatDateTime(lab.created_at || lab.order_date)}</p>
                          <Badge>{lab.status}</Badge>
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
    </div>
  );
}
