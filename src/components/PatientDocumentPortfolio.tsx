import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  User,
  Download,
  Printer,
  Clock,
  TestTube,
  Activity,
  Bed,
  FileCheck,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Patient, formatCurrency } from '@/lib/hospitalData';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import ReceiptTemplate from '@/components/documents/ReceiptTemplate';
import ConsentFormTemplate from '@/components/documents/ConsentFormTemplate';
import AdmissionFormTemplate from '@/components/documents/AdmissionFormTemplate';
import DischargeSummaryTemplate from '@/components/documents/DischargeSummaryTemplate';

interface PatientDocumentPortfolioProps {
  selectedPatient: Patient | null;
}

interface DocumentItem {
  id: string;
  type: string;
  title: string;
  date: string;
  status: 'complete' | 'pending' | 'missing';
  module: string;
  icon: React.ReactNode;
  data?: any;
}

export default function PatientDocumentPortfolio({ selectedPatient }: PatientDocumentPortfolioProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [opdTokens, setOpdTokens] = useState<any[]>([]);
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [discharges, setDischarges] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [labTests, setLabTests] = useState<any[]>([]);

  // Print state
  const [printingDoc, setPrintingDoc] = useState<DocumentItem | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const consentFormRef = useRef<HTMLDivElement>(null);
  const admissionFormRef = useRef<HTMLDivElement>(null);
  const dischargeFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedPatient) {
      fetchAllDocuments();
    }
  }, [selectedPatient]);

  const fetchAllDocuments = async () => {
    if (!selectedPatient) return;

    setLoading(true);
    try {
      // Fetch all patient-related records and reference data
      const [opdData, labData, treatmentData, admissionData, dischargeData, doctorsData, labTestsData] = await Promise.all([
        db.opdTokens.getByPatientId(selectedPatient.id).catch(() => ({ data: [], error: null })),
        db.labOrders.getByPatientId(selectedPatient.id).catch(() => ({ data: [], error: null })),
        db.treatments.getByPatientId(selectedPatient.id).catch(() => ({ data: [], error: null })),
        db.admissions.getByPatientId(selectedPatient.id).catch(() => ({ data: [], error: null })),
        db.discharges.getByPatientId(selectedPatient.id).catch(() => ({ data: [], error: null })),
        db.doctors.getAll().catch(() => ({ data: [], error: null })),
        db.labTests.getActive().catch(() => ({ data: [], error: null })),
      ]);

      setOpdTokens(opdData.data || []);
      setLabOrders(labData.data || []);
      setTreatments(treatmentData.data || []);
      setAdmissions(admissionData.data || []);
      setDischarges(dischargeData.data || []);
      setDoctors(doctorsData.data || []);
      setLabTests(labTestsData.data || []);

      // Build document list
      buildDocumentList(
        opdData.data || [],
        labData.data || [],
        treatmentData.data || [],
        admissionData.data || [],
        dischargeData.data || []
      );
    } catch (error) {
      console.error('Error fetching patient documents:', error);
      toast.error('Failed to load patient documents');
    } finally {
      setLoading(false);
    }
  };

  const buildDocumentList = (
    opd: any[],
    lab: any[],
    treatment: any[],
    admission: any[],
    discharge: any[]
  ) => {
    const docList: DocumentItem[] = [];

    // Registration Documents (always present for registered patient)
    docList.push({
      id: `reg-${selectedPatient?.id}`,
      type: 'registration_form',
      title: 'Patient Registration Form',
      date: selectedPatient?.created_at || new Date().toISOString(),
      status: 'complete',
      module: 'Registration',
      icon: <ClipboardList className="h-4 w-4" />,
      data: selectedPatient,
    });

    // OPD Documents
    opd.forEach((token) => {
      docList.push({
        id: `opd-token-${token.id}`,
        type: 'opd_token',
        title: `OPD Token #${token.token_number}`,
        date: token.date,
        status: 'complete',
        module: 'OPD',
        icon: <FileText className="h-4 w-4" />,
        data: token,
      });

      docList.push({
        id: `opd-receipt-${token.id}`,
        type: 'opd_receipt',
        title: `OPD Fee Receipt`,
        date: token.date,
        status: token.payment_status === 'paid' ? 'complete' : 'pending',
        module: 'OPD',
        icon: <FileCheck className="h-4 w-4" />,
        data: token,
      });

      docList.push({
        id: `opd-prescription-${token.id}`,
        type: 'prescription',
        title: 'Prescription',
        date: token.date,
        status: 'complete',
        module: 'OPD',
        icon: <FileText className="h-4 w-4" />,
        data: token,
      });
    });

    // Lab Documents
    lab.forEach((order) => {
      docList.push({
        id: `lab-order-${order.id}`,
        type: 'lab_order',
        title: `Lab Order (${order.tests?.length || 0} tests)`,
        date: order.order_date,
        status: 'complete',
        module: 'Laboratory',
        icon: <TestTube className="h-4 w-4" />,
        data: order,
      });

      docList.push({
        id: `lab-receipt-${order.id}`,
        type: 'lab_receipt',
        title: 'Lab Bill Receipt',
        date: order.order_date,
        status: 'complete',
        module: 'Laboratory',
        icon: <FileCheck className="h-4 w-4" />,
        data: order,
      });

      docList.push({
        id: `lab-result-${order.id}`,
        type: 'lab_result',
        title: 'Lab Test Results',
        date: order.order_date,
        status: order.status === 'completed' ? 'complete' : 'pending',
        module: 'Laboratory',
        icon: <FileText className="h-4 w-4" />,
        data: order,
      });
    });

    // Treatment Documents
    treatment.forEach((trt) => {
      docList.push({
        id: `treatment-consent-${trt.id}`,
        type: 'treatment_consent',
        title: `Treatment Consent - ${trt.treatment_name}`,
        date: trt.date,
        status: 'complete',
        module: 'Treatment',
        icon: <FileCheck className="h-4 w-4" />,
        data: trt,
      });

      docList.push({
        id: `treatment-receipt-${trt.id}`,
        type: 'treatment_receipt',
        title: `Treatment Receipt`,
        date: trt.date,
        status: 'complete',
        module: 'Treatment',
        icon: <Activity className="h-4 w-4" />,
        data: trt,
      });
    });

    // Admission Documents
    admission.forEach((adm) => {
      docList.push({
        id: `admission-form-${adm.id}`,
        type: 'admission_form',
        title: 'Admission Form',
        date: adm.admission_date,
        status: 'complete',
        module: 'Admission',
        icon: <Bed className="h-4 w-4" />,
        data: adm,
      });

      docList.push({
        id: `admission-consent-${adm.id}`,
        type: 'admission_consent',
        title: 'Admission Consent Form',
        date: adm.admission_date,
        status: 'complete',
        module: 'Admission',
        icon: <FileCheck className="h-4 w-4" />,
        data: adm,
      });
    });

    // Discharge Documents
    discharge.forEach((dis) => {
      docList.push({
        id: `discharge-summary-${dis.id}`,
        type: 'discharge_summary',
        title: 'Discharge Summary',
        date: dis.discharge_date,
        status: 'complete',
        module: 'Discharge',
        icon: <FileText className="h-4 w-4" />,
        data: dis,
      });

      docList.push({
        id: `discharge-certificate-${dis.id}`,
        type: 'discharge_certificate',
        title: 'Discharge Certificate',
        date: dis.discharge_date,
        status: 'complete',
        module: 'Discharge',
        icon: <FileCheck className="h-4 w-4" />,
        data: dis,
      });
    });

    // Sort by date (most recent first)
    docList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setDocuments(docList);
  };

  const getCompletionStats = () => {
    const total = documents.length;
    const completed = documents.filter((d) => d.status === 'complete').length;
    const pending = documents.filter((d) => d.status === 'pending').length;
    const missing = documents.filter((d) => d.status === 'missing').length;

    return { total, completed, pending, missing, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const groupDocumentsByModule = () => {
    const grouped: Record<string, DocumentItem[]> = {};
    documents.forEach((doc) => {
      if (!grouped[doc.module]) {
        grouped[doc.module] = [];
      }
      grouped[doc.module].push(doc);
    });
    return grouped;
  };

  // Print handlers using useReactToPrint
  const handlePrintReceipt = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Receipt-${selectedPatient?.name || 'Patient'}`,
    onAfterPrint: () => {
      toast.success('Receipt printed successfully');
      setPrintingDoc(null);
    },
  });

  const handlePrintConsent = useReactToPrint({
    contentRef: consentFormRef,
    documentTitle: `Consent-${selectedPatient?.name || 'Patient'}`,
    onAfterPrint: () => {
      toast.success('Consent form printed successfully');
      setPrintingDoc(null);
    },
  });

  const handlePrintAdmission = useReactToPrint({
    contentRef: admissionFormRef,
    documentTitle: `Admission-${selectedPatient?.name || 'Patient'}`,
    onAfterPrint: () => {
      toast.success('Admission form printed successfully');
      setPrintingDoc(null);
    },
  });

  const handlePrintDischarge = useReactToPrint({
    contentRef: dischargeFormRef,
    documentTitle: `Discharge-${selectedPatient?.name || 'Patient'}`,
    onAfterPrint: () => {
      toast.success('Discharge summary printed successfully');
      setPrintingDoc(null);
    },
  });

  const handlePrintDocument = (doc: DocumentItem) => {
    if (!selectedPatient) {
      toast.error('No patient selected');
      return;
    }

    setPrintingDoc(doc);

    // Determine which print handler to use based on document type
    setTimeout(() => {
      const docType = doc.type;

      // Receipt types
      if (docType.includes('receipt') || docType === 'lab_order') {
        handlePrintReceipt();
        return;
      }

      // Consent types
      if (docType.includes('consent')) {
        handlePrintConsent();
        return;
      }

      // Admission form
      if (docType === 'admission_form') {
        handlePrintAdmission();
        return;
      }

      // Discharge types
      if (docType === 'discharge_summary' || docType === 'discharge_certificate') {
        handlePrintDischarge();
        return;
      }

      // OPD Token - use simple window print
      if (docType === 'opd_token') {
        printOPDToken(doc.data);
        setPrintingDoc(null);
        return;
      }

      // Prescription - use simple window print
      if (docType === 'prescription') {
        printPrescription(doc.data);
        setPrintingDoc(null);
        return;
      }

      // Lab result - use simple window print
      if (docType === 'lab_result') {
        printLabResult(doc.data);
        setPrintingDoc(null);
        return;
      }

      // Registration form - use simple window print
      if (docType === 'registration_form') {
        printRegistrationForm();
        setPrintingDoc(null);
        return;
      }

      toast.info(`Printing ${doc.title}...`);
      setPrintingDoc(null);
    }, 100);
  };

  // Simple window-based prints for tokens and prescriptions
  const printOPDToken = (tokenData: any) => {
    if (!selectedPatient || !tokenData) return;
    const doctor = doctors.find(d => d.id === tokenData.doctor_id);

    const printContent = `
      <html>
        <head>
          <title>OPD Token - ${tokenData.token_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 400px; margin: 0 auto; border: 2px solid #333; padding: 20px; }
            .header { text-align: center; border-bottom: 3px solid #e74c3c; padding-bottom: 15px; margin-bottom: 20px; }
            .hospital-name { font-size: 22px; font-weight: bold; color: #333; margin: 5px 0; }
            .subtitle { color: #666; font-size: 14px; }
            .queue-box { background: #e74c3c; color: white; padding: 15px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .queue-number { font-size: 48px; font-weight: bold; margin: 0; }
            .info-section { margin: 15px 0; }
            .footer { border-top: 1px solid #ccc; padding-top: 10px; margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="hospital-name">North Karachi Hospital</div>
              <div class="subtitle">OPD Token</div>
            </div>
            <div class="queue-box">
              <p class="queue-number">${tokenData.token_number}</p>
            </div>
            <div class="info-section">
              <p><strong>Patient:</strong> ${selectedPatient.name}</p>
              <p><strong>Age/Gender:</strong> ${selectedPatient.age} yrs / ${selectedPatient.gender}</p>
              <p><strong>Doctor:</strong> Dr. ${doctor?.name || 'N/A'}</p>
              <p><strong>Department:</strong> ${doctor?.department || 'N/A'}</p>
              <p><strong>Date:</strong> ${new Date(tokenData.date).toLocaleDateString('en-GB')}</p>
              <p><strong>Fee:</strong> Rs. ${tokenData.fee?.toLocaleString() || '0'}</p>
              <p><strong>Status:</strong> ${tokenData.payment_status?.toUpperCase()}</p>
            </div>
            <div class="footer">Please wait for your turn. Show this token to the doctor.</div>
          </div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
      toast.success('OPD Token printed successfully');
    }
  };

  const printPrescription = (tokenData: any) => {
    if (!selectedPatient || !tokenData) return;
    const doctor = doctors.find(d => d.id === tokenData.doctor_id);

    const printContent = `
      <html>
        <head>
          <title>Prescription - ${selectedPatient.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 700px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 3px solid #e74c3c; padding-bottom: 15px; margin-bottom: 25px; }
            .hospital-name { font-size: 28px; font-weight: bold; color: #333; }
            .patient-box { background: #f5f5f5; padding: 15px; border-left: 4px solid #e74c3c; margin-bottom: 25px; }
            .section { margin-bottom: 25px; }
            .section-title { font-weight: bold; font-size: 16px; border-bottom: 2px solid #e74c3c; padding-bottom: 5px; margin-bottom: 10px; }
            .write-area { min-height: 80px; border: 1px solid #ddd; padding: 10px; margin-top: 10px; }
            .signature { margin-top: 60px; text-align: right; }
            .signature-line { border-top: 1px solid #333; width: 200px; margin-left: auto; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="hospital-name">North Karachi Hospital</div>
              <p>Prescription & Medical Record</p>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
              <div><strong>Date:</strong> ${new Date(tokenData.date).toLocaleDateString('en-GB')}<br><strong>Token:</strong> ${tokenData.token_number}</div>
              <div style="text-align: right;"><strong>Dr. ${doctor?.name || 'N/A'}</strong><br>${doctor?.department || ''}<br>${doctor?.specialization || ''}</div>
            </div>
            <div class="patient-box">
              <strong>Patient:</strong> ${selectedPatient.name}<br>
              <strong>Age/Gender:</strong> ${selectedPatient.age} yrs / ${selectedPatient.gender}<br>
              <strong>Contact:</strong> ${selectedPatient.contact}<br>
              <strong>Complaint:</strong> ${selectedPatient.problem}
            </div>
            <div class="section"><div class="section-title">Clinical Examination</div><div class="write-area"></div></div>
            <div class="section"><div class="section-title">Diagnosis</div><div class="write-area"></div></div>
            <div class="section"><div class="section-title">℞ Prescription</div><div class="write-area" style="min-height: 150px;"></div></div>
            <div class="section"><div class="section-title">Advice & Follow-up</div><div class="write-area"></div></div>
            <div class="signature"><div class="signature-line"><strong>Dr. ${doctor?.name || ''}</strong></div></div>
          </div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
      toast.success('Prescription printed successfully');
    }
  };

  const printLabResult = (orderData: any) => {
    if (!selectedPatient || !orderData) return;
    const testsDetails = labTests.filter(t => orderData.tests?.includes(t.id));

    const printContent = `
      <html>
        <head>
          <title>Lab Results - ${selectedPatient.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 700px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 3px solid #e74c3c; padding-bottom: 15px; margin-bottom: 25px; }
            .hospital-name { font-size: 24px; font-weight: bold; }
            .patient-info { background: #f0f8ff; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
            .test-item { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
            .test-name { font-weight: bold; font-size: 16px; color: #333; }
            .result-box { margin-top: 10px; min-height: 50px; border: 1px solid #ccc; padding: 10px; }
            .signatures { margin-top: 50px; display: flex; justify-content: space-between; }
            .sig-line { border-top: 1px solid #333; width: 150px; text-align: center; padding-top: 5px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="hospital-name">North Karachi Hospital</div>
              <p>Laboratory Test Results</p>
            </div>
            <div class="patient-info">
              <strong>Patient:</strong> ${selectedPatient.name} | <strong>Age:</strong> ${selectedPatient.age} yrs | <strong>Gender:</strong> ${selectedPatient.gender}<br>
              <strong>Order Date:</strong> ${new Date(orderData.order_date).toLocaleDateString('en-GB')} | <strong>Order ID:</strong> ${orderData.id?.slice(-8).toUpperCase()}
            </div>
            <h3>Tests Performed:</h3>
            ${testsDetails.map(test => `
              <div class="test-item">
                <div class="test-name">${test.name}</div>
                <p style="color: #666; font-size: 12px;">Normal Range: ${test.normal_range || 'N/A'}</p>
                <div class="result-box"><strong>Result:</strong></div>
              </div>
            `).join('')}
            <div class="signatures">
              <div class="sig-line">Lab Technician</div>
              <div class="sig-line">Verified By</div>
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
      toast.success('Lab results printed successfully');
    }
  };

  const printRegistrationForm = () => {
    if (!selectedPatient) return;

    const printContent = `
      <html>
        <head>
          <title>Patient Registration - ${selectedPatient.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 700px; margin: 0 auto; border: 2px solid #333; padding: 30px; }
            .header { text-align: center; border-bottom: 3px solid #e74c3c; padding-bottom: 15px; margin-bottom: 25px; }
            .hospital-name { font-size: 24px; font-weight: bold; }
            .form-title { background: #e74c3c; color: white; padding: 10px; font-weight: bold; margin-top: 15px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
            .info-item { padding: 10px; border-bottom: 1px solid #ddd; }
            .label { font-weight: bold; color: #666; font-size: 12px; }
            .value { font-size: 14px; margin-top: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="hospital-name">North Karachi Hospital</div>
              <p>C-122, Sector 11-B, North Karachi | Ph: 36989080</p>
            </div>
            <div class="form-title">PATIENT REGISTRATION FORM</div>
            <div class="info-grid">
              <div class="info-item"><div class="label">MR Number</div><div class="value">${selectedPatient.mrNumber || 'N/A'}</div></div>
              <div class="info-item"><div class="label">Registration Date</div><div class="value">${new Date(selectedPatient.created_at || new Date()).toLocaleDateString('en-GB')}</div></div>
              <div class="info-item"><div class="label">Patient Name</div><div class="value">${selectedPatient.name}</div></div>
              <div class="info-item"><div class="label">Father/Husband Name</div><div class="value">${selectedPatient.fatherName || 'N/A'}</div></div>
              <div class="info-item"><div class="label">Age</div><div class="value">${selectedPatient.age} years</div></div>
              <div class="info-item"><div class="label">Gender</div><div class="value">${selectedPatient.gender}</div></div>
              <div class="info-item"><div class="label">CNIC</div><div class="value">${selectedPatient.cnicNumber || 'N/A'}</div></div>
              <div class="info-item"><div class="label">Contact</div><div class="value">${selectedPatient.contact}</div></div>
              <div class="info-item"><div class="label">Emergency Contact</div><div class="value">${selectedPatient.emergencyContact || 'N/A'}</div></div>
              <div class="info-item"><div class="label">Department</div><div class="value">${selectedPatient.department}</div></div>
              <div class="info-item" style="grid-column: span 2;"><div class="label">Address</div><div class="value">${selectedPatient.address || 'N/A'}</div></div>
              <div class="info-item" style="grid-column: span 2;"><div class="label">Chief Complaint</div><div class="value">${selectedPatient.problem}</div></div>
            </div>
            <div style="margin-top: 40px; display: flex; justify-content: space-between;">
              <div style="border-top: 1px solid #333; width: 150px; text-align: center; padding-top: 5px;">Patient Signature</div>
              <div style="border-top: 1px solid #333; width: 150px; text-align: center; padding-top: 5px;">Receptionist</div>
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
      toast.success('Registration form printed successfully');
    }
  };

  const handleDownloadDocument = (doc: DocumentItem) => {
    // For now, trigger print which can be saved as PDF
    handlePrintDocument(doc);
    toast.info('Use "Save as PDF" option in the print dialog to download');
  };

  const handlePrintAllDocuments = () => {
    toast.info('Printing documents one by one...');
    // Print documents sequentially with delay
    let index = 0;
    const printNext = () => {
      if (index < documents.length) {
        const doc = documents[index];
        if (doc.status !== 'missing') {
          handlePrintDocument(doc);
        }
        index++;
        setTimeout(printNext, 2000); // 2 second delay between prints
      } else {
        toast.success('All documents printed');
      }
    };
    printNext();
  };

  // Helper function to get receipt data for printing
  const getReceiptData = (doc: DocumentItem) => {
    const data = doc.data;
    const type = doc.type;

    if (type === 'opd_receipt') {
      const doctor = doctors.find(d => d.id === data?.doctor_id);
      return {
        receiptNumber: `OPD-${data?.id?.slice(-8).toUpperCase() || 'N/A'}`,
        date: data?.date || new Date().toISOString(),
        patientName: selectedPatient?.name || '',
        patientContact: selectedPatient?.contact || '',
        items: [{ description: `OPD Fee - Dr. ${doctor?.name || 'N/A'}`, amount: data?.fee || 0 }],
        total: data?.fee || 0,
        paymentStatus: data?.payment_status || 'unpaid',
        amountPaid: data?.payment_status === 'paid' ? (data?.fee || 0) : 0,
        balanceDue: data?.payment_status === 'paid' ? 0 : (data?.fee || 0),
      };
    }

    if (type === 'lab_receipt' || type === 'lab_order') {
      const testsDetails = labTests.filter(t => data?.tests?.includes(t.id));
      return {
        receiptNumber: `LAB-${data?.id?.slice(-8).toUpperCase() || 'N/A'}`,
        date: data?.order_date || new Date().toISOString(),
        patientName: selectedPatient?.name || '',
        patientContact: selectedPatient?.contact || '',
        items: testsDetails.map(t => ({ description: t.name, amount: t.price })),
        total: data?.total_amount || testsDetails.reduce((sum, t) => sum + t.price, 0),
        paymentStatus: data?.payment_status || 'unpaid',
        amountPaid: data?.payment_status === 'paid' ? (data?.total_amount || 0) : 0,
        balanceDue: data?.payment_status === 'paid' ? 0 : (data?.total_amount || 0),
      };
    }

    if (type === 'treatment_receipt') {
      return {
        receiptNumber: `TRT-${data?.id?.slice(-8).toUpperCase() || 'N/A'}`,
        date: data?.date || new Date().toISOString(),
        patientName: selectedPatient?.name || '',
        patientContact: selectedPatient?.contact || '',
        items: [{ description: `${data?.treatment_type || 'Treatment'} - ${data?.treatment_name || ''}`, amount: data?.price || 0 }],
        total: data?.price || 0,
        paymentStatus: data?.payment_status || 'unpaid',
        amountPaid: data?.payment_status === 'paid' ? (data?.price || 0) : 0,
        balanceDue: data?.payment_status === 'paid' ? 0 : (data?.price || 0),
      };
    }

    return null;
  };

  // Helper function to get consent type
  const getConsentType = (docType: string): 'treatment' | 'admission' | 'lab' | 'opd' => {
    if (docType.includes('treatment')) return 'treatment';
    if (docType.includes('admission')) return 'admission';
    if (docType.includes('lab')) return 'lab';
    return 'opd';
  };

  if (!selectedPatient) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Please select a patient to view their document portfolio</p>
        </CardContent>
      </Card>
    );
  }

  const stats = getCompletionStats();
  const groupedDocs = groupDocumentsByModule();

  return (
    <div className="space-y-6">
      {/* Patient Info & Stats */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold">{selectedPatient.name}</h2>
                <p className="text-sm text-gray-600 font-normal">
                  {selectedPatient.age} years • {selectedPatient.gender} • {selectedPatient.contact}
                </p>
              </div>
            </div>
            <Button onClick={handlePrintAllDocuments} variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print Complete File
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Documents</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-3xl font-bold text-blue-600">{stats.percentage}%</div>
              <div className="text-sm text-gray-600">Completion</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-spin" />
            <p className="text-gray-600">Loading patient documents...</p>
          </CardContent>
        </Card>
      )}

      {/* Documents by Module */}
      {!loading && documents.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No documents found for this patient</p>
            <p className="text-sm text-gray-500 mt-2">
              Documents will appear here as patient visits different modules
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && Object.entries(groupedDocs).map(([module, docs]) => (
        <Card key={module}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {docs[0].icon}
                {module}
              </div>
              <Badge variant="outline">
                {docs.length} document{docs.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {doc.icon}
                    <div>
                      <div className="font-medium">{doc.title}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(doc.date).toLocaleDateString('en-PK', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        doc.status === 'complete'
                          ? 'default'
                          : doc.status === 'pending'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {doc.status === 'complete' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {doc.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                      {doc.status === 'missing' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {doc.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePrintDocument(doc)}
                      disabled={doc.status === 'missing'}
                    >
                      <Printer className="h-3 w-3 mr-1" />
                      Print
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadDocument(doc)}
                      disabled={doc.status === 'missing'}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Hidden Print Templates */}
      {printingDoc && selectedPatient && (
        <>
          {/* Receipt Template */}
          {(printingDoc.type.includes('receipt') || printingDoc.type === 'lab_order') && getReceiptData(printingDoc) && (
            <div style={{ display: 'none' }}>
              <ReceiptTemplate
                ref={receiptRef}
                data={getReceiptData(printingDoc)!}
              />
            </div>
          )}

          {/* Consent Form Template */}
          {printingDoc.type.includes('consent') && (
            <div style={{ display: 'none' }}>
              <ConsentFormTemplate
                ref={consentFormRef}
                consentType={getConsentType(printingDoc.type)}
                patientName={selectedPatient.name}
                patientAge={selectedPatient.age}
                patientGender={selectedPatient.gender}
                patientContact={selectedPatient.contact}
                doctorName={doctors.find(d => d.id === printingDoc.data?.doctor_id)?.name}
                procedureName={
                  printingDoc.type.includes('treatment')
                    ? `${printingDoc.data?.treatment_type || 'Treatment'} - ${printingDoc.data?.treatment_name || ''}`
                    : printingDoc.type.includes('lab')
                    ? `Laboratory Testing (${printingDoc.data?.tests?.length || 0} tests)`
                    : printingDoc.type.includes('admission')
                    ? 'Hospital Admission'
                    : 'OPD Consultation'
                }
                date={new Date(printingDoc.data?.date || printingDoc.data?.admission_date || new Date()).toLocaleDateString('en-PK')}
              />
            </div>
          )}

          {/* Admission Form Template */}
          {printingDoc.type === 'admission_form' && (
            <div style={{ display: 'none' }}>
              <AdmissionFormTemplate
                ref={admissionFormRef}
                data={{
                  patientName: selectedPatient.name,
                  age: selectedPatient.age,
                  gender: selectedPatient.gender === 'Male' ? 'M' : selectedPatient.gender === 'Female' ? 'F' : undefined,
                  address: selectedPatient.address,
                  phone: selectedPatient.contact,
                  cellPhone: selectedPatient.emergencyContact,
                  regNumber: printingDoc.data?.id?.slice(-8).toUpperCase() || 'N/A',
                  department: doctors.find(d => d.id === printingDoc.data?.doctor_id)?.department || '',
                  consultant: doctors.find(d => d.id === printingDoc.data?.doctor_id)?.name || '',
                  admissionDateTime: new Date(printingDoc.data?.admission_date).toLocaleString('en-GB'),
                  modeOfAdmission: printingDoc.data?.admission_type || 'Direct',
                  admissionFor: printingDoc.data?.notes || selectedPatient.problem,
                }}
              />
            </div>
          )}

          {/* Discharge Summary Template */}
          {(printingDoc.type === 'discharge_summary' || printingDoc.type === 'discharge_certificate') && (
            <div style={{ display: 'none' }}>
              <DischargeSummaryTemplate
                ref={dischargeFormRef}
                data={{
                  summaryNumber: `DS-${printingDoc.data?.id?.slice(-8).toUpperCase() || 'N/A'}`,
                  patientName: selectedPatient.name,
                  mrNumber: selectedPatient.mrNumber || 'N/A',
                  age: selectedPatient.age,
                  gender: selectedPatient.gender,
                  admissionDate: printingDoc.data?.admission_date || new Date().toISOString(),
                  dischargeDate: printingDoc.data?.discharge_date || new Date().toISOString(),
                  totalDays: Math.ceil((new Date(printingDoc.data?.discharge_date).getTime() - new Date(printingDoc.data?.admission_date).getTime()) / (1000 * 60 * 60 * 24)) || 1,
                  department: doctors.find(d => d.id === printingDoc.data?.doctor_id)?.department || 'General',
                  consultantName: doctors.find(d => d.id === printingDoc.data?.doctor_id)?.name || 'N/A',
                  diagnosis: printingDoc.data?.final_diagnosis || selectedPatient.problem || 'N/A',
                  treatmentGiven: printingDoc.data?.treatment_summary || 'As per clinical notes',
                  conditionAtDischarge: printingDoc.data?.condition_at_discharge || 'Stable',
                  followUpInstructions: printingDoc.data?.follow_up_instructions || '',
                  followUpDate: printingDoc.data?.follow_up_date,
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
