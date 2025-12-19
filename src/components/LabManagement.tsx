import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TestTube, User, Printer, CreditCard, FileText } from 'lucide-react';
import { Patient, generateId, formatCurrency } from '@/lib/hospitalData';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import SimpleReceiptTemplate from '@/components/documents/SimpleReceiptTemplate';
import ConsentFormTemplate from '@/components/documents/ConsentFormTemplate';
import ConsentModal from '@/components/ConsentModal';

interface Doctor {
  id: string;
  name: string;
  department: string;
}

interface LabTest {
  id: string;
  name: string;
  price: number;
  department: string;
  normal_range?: string;
  active: boolean;
}

interface LabOrder {
  id: string;
  patient_id: string;
  doctor_id?: string;
  tests: string[];
  total_amount: number;
  status: string;
  order_date: string;
}

interface LabManagementProps {
  selectedPatient: Patient | null;
}

export default function LabManagement({ selectedPatient }: LabManagementProps) {
  const [orderType, setOrderType] = useState<'OPD' | 'Direct'>('OPD');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [generatedOrder, setGeneratedOrder] = useState<LabOrder | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [shouldPrintBill, setShouldPrintBill] = useState(false);
  const [shouldPrintConsentForm, setShouldPrintConsentForm] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const consentFormRef = useRef<HTMLDivElement>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);

  // Fetch doctors and lab tests from database
  useEffect(() => {
    fetchDoctors();
    fetchLabTests();
  }, []);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await db.doctors.getAll();
      if (error) {
        console.error('Error fetching doctors:', error);
        return;
      }
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchLabTests = async () => {
    try {
      const { data, error } = await db.labTests.getActive();
      if (error) {
        console.error('Error fetching lab tests:', error);
        return;
      }
      setLabTests(data || []);
    } catch (error) {
      console.error('Error fetching lab tests:', error);
    }
  };

  const handleTestSelection = (testId: string, checked: boolean) => {
    if (checked) {
      setSelectedTests([...selectedTests, testId]);
    } else {
      setSelectedTests(selectedTests.filter(id => id !== testId));
    }
  };

  const handleDoctorSelect = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    setSelectedDoctor(doctor || null);
  };

  const calculateTotal = () => {
    return selectedTests.reduce((total, testId) => {
      const test = labTests.find(t => t.id === testId);
      return total + (test?.price || 0);
    }, 0);
  };

  const createLabOrder = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient first');
      return;
    }

    if (orderType === 'OPD' && !selectedDoctor) {
      toast.error('Please select referring doctor for OPD orders');
      return;
    }

    if (selectedTests.length === 0) {
      toast.error('Please select at least one test');
      return;
    }

    // Prepare order data and show consent modal
    const orderData = {
      patient_id: selectedPatient.id,
      doctor_id: selectedDoctor?.id,
      tests: selectedTests,
      total_amount: calculateTotal(),
      status: 'pending',
      order_date: new Date().toISOString().split('T')[0]
    };

    setPendingOrderData(orderData);
    setShowConsentModal(true);
  };

  const handleConsentAccepted = async () => {
    setShowConsentModal(false);
    setLoading(true);

    try {
      const { data, error } = await db.labOrders.create(pendingOrderData);

      if (error) {
        console.error('Error creating lab order:', error);
        toast.error('Failed to create lab order');
        setLoading(false);
        return;
      }

      setGeneratedOrder(data);
      toast.success('Lab order created successfully with consent!');
      setPendingOrderData(null);
    } catch (error) {
      console.error('Error creating lab order:', error);
      toast.error('Failed to create lab order');
    } finally {
      setLoading(false);
    }
  };

  const handleConsentDeclined = () => {
    setShowConsentModal(false);
    setPendingOrderData(null);
    toast.info('Lab order cancelled - consent not provided');
  };

  const handlePayment = () => {
    if (generatedOrder) {
      setPaymentStatus('paid');
      toast.success('Payment recorded successfully!');
    }
  };

  const handlePrintBill = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Lab-Bill-${selectedPatient?.name || 'Unknown'}`,
    onAfterPrint: () => {
      toast.success('Lab bill printed successfully');
      setShouldPrintBill(false);
    },
  });

  const printLabBill = () => {
    if (!generatedOrder || !selectedPatient) {
      toast.error('Missing order details');
      return;
    }
    setShouldPrintBill(true);
    setTimeout(() => {
      handlePrintBill();
    }, 100);
  };

  const handlePrintConsentForm = useReactToPrint({
    content: () => consentFormRef.current,
    documentTitle: `Lab-Consent-${selectedPatient?.name || 'Unknown'}`,
    onAfterPrint: () => {
      toast.success('Lab consent form printed successfully');
      setShouldPrintConsentForm(false);
    },
  });

  const printLabConsentForm = () => {
    if (!generatedOrder || !selectedPatient) {
      toast.error('Missing order details');
      return;
    }
    setShouldPrintConsentForm(true);
    setTimeout(() => {
      handlePrintConsentForm();
    }, 100);
  };

  const printLabSlip = () => {
    if (!generatedOrder || !selectedPatient) return;

    const selectedTestDetails = labTests.filter(test => 
      generatedOrder.tests.includes(test.id)
    );

    const slipContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #333;">HOSPITAL MANAGEMENT SYSTEM</h2>
          <p style="margin: 5px 0; color: #666;">Laboratory Request Slip</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <strong>Order ID:</strong> ${generatedOrder.id}<br>
            <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
            <strong>Time:</strong> ${new Date().toLocaleTimeString()}
          </div>
          <div style="text-align: right;">
            <strong>Priority:</strong> Routine<br>
            ${selectedDoctor ? `<strong>Ref. Dr.:</strong> ${selectedDoctor.name}` : ''}
          </div>
        </div>
        
        <div style="margin-bottom: 20px; background: #e8f4fd; padding: 15px; border-radius: 5px;">
          <strong>Patient Information:</strong><br>
          Name: ${selectedPatient.name}<br>
          Age: ${selectedPatient.age} years | Gender: ${selectedPatient.gender}<br>
          Contact: ${selectedPatient.contact}<br>
          Patient ID: ${selectedPatient.id}
        </div>
        
        <div style="margin-bottom: 30px;">
          <strong>Tests to be Performed:</strong><br>
          ${selectedTestDetails.map((test, index) => `
            <div style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
              <strong>${index + 1}. ${test.name}</strong><br>
              <span style="color: #666; font-size: 12px;">Department: ${test.department}</span>
              ${test.normal_range ? `<br><span style="color: #666; font-size: 12px;">Normal Range: ${test.normal_range}</span>` : ''}
              <div style="margin-top: 15px; border-top: 1px dotted #ccc; padding-top: 10px;">
                <strong>Result:</strong><br>
                <div style="height: 40px; border: 1px solid #ccc; margin-top: 5px;"></div>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div style="margin-top: 50px; display: flex; justify-content: space-between;">
          <div style="text-align: center;">
            <div style="border-top: 1px solid #333; width: 120px; padding-top: 10px; font-size: 12px;">
              Technician
            </div>
          </div>
          <div style="text-align: center;">
            <div style="border-top: 1px solid #333; width: 120px; padding-top: 10px; font-size: 12px;">
              Verified By
            </div>
          </div>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(slipContent);
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
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Name:</strong> {selectedPatient.name}</p>
              <p><strong>Age:</strong> {selectedPatient.age} years</p>
              <p><strong>Gender:</strong> {selectedPatient.gender}</p>
            </div>
            <div>
              <p><strong>Contact:</strong> {selectedPatient.contact}</p>
              <p><strong>Problem:</strong> {selectedPatient.problem}</p>
              <p><strong>Department:</strong> {selectedPatient.department}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Lab Order Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Order Type</label>
            <Select value={orderType} onValueChange={(value) => setOrderType(value as 'OPD' | 'Direct')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPD">From OPD (Doctor Prescribed)</SelectItem>
                <SelectItem value="Direct">Direct Lab Visit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {orderType === 'OPD' && (
            <div>
              <label className="text-sm font-medium">Referring Doctor</label>
              <Select onValueChange={handleDoctorSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select referring doctor..." />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      Dr. {doctor.name} - {doctor.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Select Lab Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
            {labTests.map((test) => (
              <div key={test.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={test.id}
                  checked={selectedTests.includes(test.id)}
                  onCheckedChange={(checked) => handleTestSelection(test.id, checked as boolean)}
                />
                <div className="flex-1">
                  <label htmlFor={test.id} className="font-medium cursor-pointer">
                    {test.name}
                  </label>
                  <p className="text-sm text-gray-600">{test.department}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(test.price)}</p>
                </div>
              </div>
            ))}
          </div>

          {selectedTests.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Selected Tests: {selectedTests.length}</span>
                <span className="text-xl font-bold text-blue-600">
                  Total: {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create Lab Order</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={createLabOrder} 
            className="w-full"
            disabled={selectedTests.length === 0 || loading}
          >
            <TestTube className="h-4 w-4 mr-2" />
            {loading ? 'Creating...' : 'Create Lab Order'}
          </Button>
        </CardContent>
      </Card>

      {generatedOrder && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Lab Order Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <h2 className="text-2xl font-bold text-green-600">Order #{generatedOrder.id.slice(-6)}</h2>
                <p className="text-gray-600 mt-2">Created on {new Date().toLocaleDateString()}</p>
                <Badge className="mt-2" variant={paymentStatus === 'paid' ? 'default' : 'secondary'}>
                  {paymentStatus === 'paid' ? 'Payment Completed' : 'Payment Pending'}
                </Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Total Amount</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(generatedOrder.total_amount)}</p>
                </div>
                <div>
                  <p className="font-medium">Tests Ordered</p>
                  <p className="text-2xl font-bold text-blue-600">{generatedOrder.tests.length}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {paymentStatus === 'pending' && (
                  <Button onClick={handlePayment} variant="outline" size="sm">
                    <CreditCard className="h-3 w-3 mr-2" />
                    Record Payment
                  </Button>
                )}
                <Button onClick={printLabConsentForm} variant="outline" size="sm">
                  <Printer className="h-3 w-3 mr-2" />
                  Print Consent Form
                </Button>
                <Button onClick={printLabBill} variant="outline" size="sm">
                  <Printer className="h-3 w-3 mr-2" />
                  Print Bill
                </Button>
                <Button onClick={printLabSlip} variant="outline" size="sm">
                  <Printer className="h-3 w-3 mr-2" />
                  Print Lab Slip
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden Receipt Template for Lab Bill Printing */}
      {shouldPrintBill && selectedPatient && generatedOrder && (
        <div style={{ display: 'none' }}>
          <SimpleReceiptTemplate
            ref={receiptRef}
            data={{
              receiptNumber: `LAB-${generatedOrder.id.slice(-8).toUpperCase()}`,
              date: generatedOrder.order_date,
              patientName: selectedPatient.name,
              patientContact: selectedPatient.contact,
              items: labTests
                .filter(test => generatedOrder.tests.includes(test.id))
                .map(test => ({
                  description: test.name,
                  amount: test.price,
                })),
              total: generatedOrder.total_amount,
              paymentStatus: paymentStatus === 'paid' ? 'paid' : 'unpaid',
              amountPaid: paymentStatus === 'paid' ? generatedOrder.total_amount : 0,
              balanceDue: paymentStatus === 'paid' ? 0 : generatedOrder.total_amount,
            }}
          />
        </div>
      )}

      {/* Lab Test Consent Modal */}
      <ConsentModal
        isOpen={showConsentModal}
        consentType="lab"
        patientName={selectedPatient?.name || ''}
        procedureName={`Laboratory Testing (${selectedTests.length} test${selectedTests.length !== 1 ? 's' : ''})`}
        onAccept={handleConsentAccepted}
        onDecline={handleConsentDeclined}
      />

      {/* Hidden Consent Form Template for Lab Printing */}
      {shouldPrintConsentForm && selectedPatient && generatedOrder && (
        <div style={{ display: 'none' }}>
          <ConsentFormTemplate
            ref={consentFormRef}
            consentType="lab"
            patientName={selectedPatient.name}
            patientAge={selectedPatient.age}
            patientGender={selectedPatient.gender}
            patientContact={selectedPatient.contact}
            doctorName={selectedDoctor?.name}
            procedureName={`Laboratory Testing - ${generatedOrder.tests.length} test${generatedOrder.tests.length !== 1 ? 's' : ''}`}
            date={new Date(generatedOrder.order_date).toLocaleDateString('en-PK')}
          />
        </div>
      )}
    </div>
  );
}
