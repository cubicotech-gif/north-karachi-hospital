import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (selectedPatient) {
      fetchAllDocuments();
    }
  }, [selectedPatient]);

  const fetchAllDocuments = async () => {
    if (!selectedPatient) return;

    setLoading(true);
    try {
      // Fetch all patient-related records
      const [opdData, labData, treatmentData, admissionData, dischargeData] = await Promise.all([
        db.opdTokens.getByPatientId(selectedPatient.id).catch(() => ({ data: [], error: null })),
        db.labOrders.getByPatientId(selectedPatient.id).catch(() => ({ data: [], error: null })),
        db.treatments.getByPatientId(selectedPatient.id).catch(() => ({ data: [], error: null })),
        db.admissions.getByPatientId(selectedPatient.id).catch(() => ({ data: [], error: null })),
        db.discharges.getByPatientId(selectedPatient.id).catch(() => ({ data: [], error: null })),
      ]);

      setOpdTokens(opdData.data || []);
      setLabOrders(labData.data || []);
      setTreatments(treatmentData.data || []);
      setAdmissions(admissionData.data || []);
      setDischarges(dischargeData.data || []);

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

  const handlePrintDocument = (doc: DocumentItem) => {
    toast.info(`Printing ${doc.title}...`);
    // The actual print logic would be implemented based on document type
    // This would trigger the same print functions used in individual modules
  };

  const handleDownloadDocument = (doc: DocumentItem) => {
    toast.info(`Downloading ${doc.title}...`);
    // Download logic would be implemented here
  };

  const handlePrintAllDocuments = () => {
    toast.info('Preparing complete patient file for printing...');
    // This would batch print all documents
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
    </div>
  );
}
