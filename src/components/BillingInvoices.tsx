import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Receipt, DollarSign, Printer, Search, Calendar, Filter,
  CheckCircle, XCircle, Clock, User, FileText
} from 'lucide-react';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/hospitalData';
import { useReactToPrint } from 'react-to-print';
import ReceiptTemplate from '@/components/documents/ReceiptTemplate';
import DocumentViewer from '@/components/documents/DocumentViewer';

interface Invoice {
  id: string;
  type: 'OPD' | 'Admission' | 'Lab' | 'Discharge' | 'Treatment';
  patient_id: string;
  patient_name: string;
  amount: number;
  payment_status: 'paid' | 'unpaid' | 'partial';
  date: string;
  created_at?: string;
  description: string;
}

export default function BillingInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAllInvoices();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [invoices, searchTerm, filterStatus, filterDate]);

  const fetchAllInvoices = async () => {
    setLoading(true);
    try {
      const [opdTokensRes, admissionsRes, labOrdersRes, treatmentsRes, patientsRes] = await Promise.all([
        db.opdTokens.getAll(),
        db.admissions.getAll(),
        db.labOrders.getAll(),
        db.treatments.getAll(),
        db.patients.getAll()
      ]);

      if (opdTokensRes.error) throw opdTokensRes.error;
      if (admissionsRes.error) throw admissionsRes.error;
      if (labOrdersRes.error) throw labOrdersRes.error;
      if (treatmentsRes.error) throw treatmentsRes.error;
      if (patientsRes.error) throw patientsRes.error;

      const patients = patientsRes.data || [];
      const opdTokens = opdTokensRes.data || [];
      const admissions = admissionsRes.data || [];
      const labOrders = labOrdersRes.data || [];
      const treatments = treatmentsRes.data || [];

      const allInvoices: Invoice[] = [];

      // OPD Invoices
      opdTokens.forEach((token: any) => {
        const patient = patients.find((p: any) => p.id === token.patient_id);
        allInvoices.push({
          id: `opd-${token.id}`,
          type: 'OPD',
          patient_id: token.patient_id,
          patient_name: patient?.name || 'Unknown Patient',
          amount: token.fee || 0,
          payment_status: token.payment_status || 'unpaid',
          date: token.date,
          created_at: token.created_at,
          description: `OPD Token #${token.token_number}`
        });
      });

      // Admission Invoices
      admissions.forEach((admission: any) => {
        const patient = patients.find((p: any) => p.id === admission.patient_id);
        allInvoices.push({
          id: `admission-${admission.id}`,
          type: 'Admission',
          patient_id: admission.patient_id,
          patient_name: patient?.name || 'Unknown Patient',
          amount: admission.deposit || 0,
          payment_status: 'paid',
          date: admission.admission_date,
          created_at: admission.created_at,
          description: `Admission Deposit`
        });
      });

      // Lab Order Invoices
      labOrders.forEach((order: any) => {
        const patient = patients.find((p: any) => p.id === order.patient_id);
        allInvoices.push({
          id: `lab-${order.id}`,
          type: 'Lab',
          patient_id: order.patient_id,
          patient_name: patient?.name || 'Unknown Patient',
          amount: order.total_cost || 0,
          payment_status: order.payment_status || 'unpaid',
          date: order.order_date,
          created_at: order.created_at,
          description: `Lab Order - ${order.tests?.length || 0} tests`
        });
      });

      // Treatment Invoices
      treatments.forEach((treatment: any) => {
        const patient = patients.find((p: any) => p.id === treatment.patient_id);
        allInvoices.push({
          id: `treatment-${treatment.id}`,
          type: 'Treatment',
          patient_id: treatment.patient_id,
          patient_name: patient?.name || 'Unknown Patient',
          amount: treatment.price || 0,
          payment_status: treatment.payment_status || 'unpaid',
          date: treatment.date,
          created_at: treatment.created_at,
          description: `${treatment.treatment_type} - ${treatment.treatment_name}`
        });
      });

      // Sort by date (newest first)
      allInvoices.sort((a, b) => {
        const dateA = new Date(a.date || a.created_at || '');
        const dateB = new Date(b.date || b.created_at || '');
        return dateB.getTime() - dateA.getTime();
      });

      setInvoices(allInvoices);
      setPatients(patients);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...invoices];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(invoice => invoice.payment_status === filterStatus);
    }

    // Date filter
    if (filterDate) {
      filtered = filtered.filter(invoice => invoice.date === filterDate);
    }

    setFilteredInvoices(filtered);
  };

  const getStats = () => {
    const totalRevenue = invoices
      .filter(i => i.payment_status === 'paid')
      .reduce((sum, i) => sum + i.amount, 0);

    const pending = invoices
      .filter(i => i.payment_status === 'unpaid')
      .reduce((sum, i) => sum + i.amount, 0);

    return {
      total: invoices.length,
      paid: invoices.filter(i => i.payment_status === 'paid').length,
      unpaid: invoices.filter(i => i.payment_status === 'unpaid').length,
      totalRevenue,
      pending
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'OPD':
        return 'bg-blue-100 text-blue-800';
      case 'Admission':
        return 'bg-purple-100 text-purple-800';
      case 'Lab':
        return 'bg-green-100 text-green-800';
      case 'Discharge':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Receipt-${selectedInvoice?.id || 'Unknown'}`,
    onAfterPrint: () => {
      toast.success('Receipt printed successfully');
      setSelectedInvoice(null);
    },
  });

  const openPrintDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    // Trigger print after state is updated
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  const stats = getStats();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Receipt className="h-8 w-8 mx-auto mb-4 animate-pulse text-blue-600" />
          <p className="text-gray-600">Loading invoices...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-700">{stats.total}</p>
            <p className="text-sm text-gray-600">Total Invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
            <p className="text-sm text-gray-600">Paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.unpaid}</p>
            <p className="text-sm text-gray-600">Unpaid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-sm text-gray-600">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pending)}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Billing & Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search patient, invoice ID..."
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Payment Status</Label>
              <select
                id="status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
              </select>
            </div>
            <div>
              <Label htmlFor="date">Filter by Date</Label>
              <Input
                id="date"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
          </div>

          {/* Invoices List */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({filteredInvoices.length})</TabsTrigger>
              <TabsTrigger value="OPD">OPD ({filteredInvoices.filter(i => i.type === 'OPD').length})</TabsTrigger>
              <TabsTrigger value="Admission">Admissions ({filteredInvoices.filter(i => i.type === 'Admission').length})</TabsTrigger>
              <TabsTrigger value="Lab">Lab ({filteredInvoices.filter(i => i.type === 'Lab').length})</TabsTrigger>
              <TabsTrigger value="Discharge">Discharge ({filteredInvoices.filter(i => i.type === 'Discharge').length})</TabsTrigger>
            </TabsList>

            {['all', 'OPD', 'Admission', 'Lab', 'Discharge'].map(tabType => (
              <TabsContent key={tabType} value={tabType} className="space-y-3 mt-4">
                {filteredInvoices
                  .filter(invoice => tabType === 'all' || invoice.type === tabType)
                  .map(invoice => (
                    <Card key={invoice.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="text-center">
                              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Receipt className="h-8 w-8 text-gray-600" />
                              </div>
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{invoice.patient_name}</span>
                                <Badge className={getTypeColor(invoice.type)}>
                                  {invoice.type}
                                </Badge>
                                <Badge className={getStatusColor(invoice.payment_status)}>
                                  {invoice.payment_status}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p className="flex items-center gap-2">
                                  <FileText className="h-3 w-3" />
                                  {invoice.description}
                                </p>
                                <p className="flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(invoice.date).toLocaleDateString()}
                                </p>
                                <p className="flex items-center gap-2">
                                  <DollarSign className="h-3 w-3" />
                                  <span className="font-semibold text-base">{formatCurrency(invoice.amount)}</span>
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openPrintDialog(invoice)}
                            >
                              <Printer className="h-4 w-4 mr-2" />
                              Print Receipt
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                {filteredInvoices.filter(invoice => tabType === 'all' || invoice.type === tabType).length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center text-gray-500">
                      No invoices found
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Available Document Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Available Receipt Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <DocumentViewer
              moduleName="billing"
              documentType="receipt"
              title="Billing Receipt Template"
            />
          </div>
        </CardContent>
      </Card>

      {/* Hidden Receipt Template for Printing */}
      {selectedInvoice && (
        <div style={{ display: 'none' }}>
          <ReceiptTemplate
            ref={receiptRef}
            data={{
              receiptNumber: selectedInvoice.id.toUpperCase(),
              date: selectedInvoice.date,
              patientName: selectedInvoice.patient_name,
              patientCnic: patients.find(p => p.id === selectedInvoice.patient_id)?.cnic_number,
              patientContact: patients.find(p => p.id === selectedInvoice.patient_id)?.contact,
              items: [
                {
                  description: selectedInvoice.description,
                  amount: selectedInvoice.amount
                }
              ],
              total: selectedInvoice.amount,
              paymentStatus: selectedInvoice.payment_status,
              amountPaid: selectedInvoice.payment_status === 'paid' ? selectedInvoice.amount : 0,
              balanceDue: selectedInvoice.payment_status === 'paid' ? 0 : selectedInvoice.amount,
            }}
          />
        </div>
      )}
    </div>
  );
}
