import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { TestTube, User, Printer, CreditCard, FileText } from 'lucide-react';
import { Patient, Doctor, LabTest, LabOrder, mockDoctors, mockLabTests, generateId, formatCurrency } from '@/lib/hospitalData';
import { toast } from 'sonner';

interface LabManagementProps {
  selectedPatient: Patient | null;
}

export default function LabManagement({ selectedPatient }: LabManagementProps) {
  const [orderType, setOrderType] = useState<'OPD' | 'Direct'>('OPD');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [generatedOrder, setGeneratedOrder] = useState<LabOrder | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending');

  const handleTestSelection = (testId: string, checked: boolean) => {
    if (checked) {
      setSelectedTests([...selectedTests, testId]);
    } else {
      setSelectedTests(selectedTests.filter(id => id !== testId));
    }
  };

  const handleDoctorSelect = (doctorId: string) => {
    const doctor = mockDoctors.find(d => d.id === doctorId);
    setSelectedDoctor(doctor || null);
  };

  const calculateTotal = () => {
    return selectedTests.reduce((total, testId) => {
      const test = mockLabTests.find(t => t.id === testId);
      return total + (test?.price || 0);
    }, 0);
  };

  const createLabOrder = () => {
    if (!selectedPatient || selectedTests.length === 0) {
      toast.error('Please select patient and at least one test');
      return;
    }

    if (orderType === 'OPD' && !selectedDoctor) {
      toast.error('Please select referring doctor for OPD orders');
      return;
    }

    const order: LabOrder = {
      id: generateId(),
      patientId: selectedPatient.id,
      doctorId: selectedDoctor?.id,
      tests: selectedTests,
      totalAmount: calculateTotal(),
      status: 'pending',
      orderDate: new Date().toISOString().split('T')[0]
    };

    setGeneratedOrder(order);
    toast.success('Lab order created successfully!');
  };

  const handlePayment = () => {
    if (generatedOrder) {
      setPaymentStatus('paid');
      toast.success('Payment recorded successfully!');
    }
  };

  const printLabBill = () => {
    if (!generatedOrder || !selectedPatient) return;

    const selectedTestDetails = mockLabTests.filter(test => 
      generatedOrder.tests.includes(test.id)
    );

    const billContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #333;">HOSPITAL MANAGEMENT SYSTEM</h2>
          <p style="margin: 5px 0; color: #666;">Laboratory Bill Receipt</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <strong>Order ID:</strong> ${generatedOrder.id}<br>
            <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
            <strong>Type:</strong> ${orderType}
          </div>
          <div style="text-align: right;">
            <strong>Status:</strong> ${paymentStatus.toUpperCase()}<br>
            ${selectedDoctor ? `<strong>Ref. Dr.:</strong> ${selectedDoctor.name}` : ''}
          </div>
        </div>
        
        <div style="margin-bottom: 20px; background: #f5f5f5; padding: 15px; border-radius: 5px;">
          <strong>Patient Information:</strong><br>
          Name: ${selectedPatient.name}<br>
          Age: ${selectedPatient.age} years | Gender: ${selectedPatient.gender}<br>
          Contact: ${selectedPatient.contact}
        </div>
        
        <div style="margin-bottom: 20px;">
          <strong>Lab Tests Ordered:</strong><br>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background: #f0f0f0;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Test Name</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${selectedTestDetails.map(test => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;">${test.name}</td>
                  <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(test.price)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background: #f0f0f0; font-weight: bold;">
                <td style="border: 1px solid #ddd; padding: 8px;">Total Amount</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(generatedOrder.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div style="margin-bottom: 20px; font-size: 12px; color: #666;">
          <strong>Instructions:</strong><br>
          • Please bring this receipt when collecting reports<br>
          • Reports will be available within 24-48 hours<br>
          • Fasting required for certain tests as advised<br>
          • Contact lab for any queries: Lab Extension 123
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <div style="border-top: 1px solid #333; width: 200px; margin: 0 auto; padding-top: 10px;">
            Authorized Signature
          </div>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(billContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const printLabSlip = () => {
    if (!generatedOrder || !selectedPatient) return;

    const selectedTestDetails = mockLabTests.filter(test => 
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
              ${test.normalRange ? `<br><span style="color: #666; font-size: 12px;">Normal Range: ${test.normalRange}</span>` : ''}
              <div style="margin-top: 15px; border-top: 1px dotted #ccc; padding-top: 10px;">
                <strong>Result:</strong><br>
                <div style="height: 40px; border: 1px solid #ccc; margin-top: 5px;"></div>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div style="margin-bottom: 20px; font-size: 12px; color: #666;">
          <strong>Lab Instructions:</strong><br>
          • Verify patient identity before sample collection<br>
          • Follow standard protocols for each test<br>
          • Mark completion status after testing<br>
          • Notify patient when reports are ready
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-top: 40px;">
          <div style="text-align: center;">
            <div style="border-top: 1px solid #333; width: 120px; padding-top: 10px; font-size: 12px;">
              Sample Collected By
            </div>
          </div>
          <div style="text-align: center;">
            <div style="border-top: 1px solid #333; width: 120px; padding-top: 10px; font-size: 12px;">
              Lab Technician
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
                  {mockDoctors.map((doctor) => (
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
            {mockLabTests.map((test) => (
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
            disabled={selectedTests.length === 0}
          >
            <TestTube className="h-4 w-4 mr-2" />
            Create Lab Order
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
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(generatedOrder.totalAmount)}</p>
                </div>
                <div>
                  <p className="font-medium">Tests Ordered</p>
                  <p className="text-2xl font-bold text-blue-600">{generatedOrder.tests.length}</p>
                </div>
              </div>

              <div className="flex gap-2">
                {paymentStatus === 'pending' && (
                  <Button onClick={handlePayment} variant="outline" className="flex-1">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Record Payment
                  </Button>
                )}
                <Button onClick={printLabBill} variant="outline" className="flex-1">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Bill
                </Button>
                <Button onClick={printLabSlip} variant="outline" className="flex-1">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Lab Slip
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}