import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Printer, Clock, User, Stethoscope, CreditCard } from 'lucide-react';
import { Patient, generateId, generateTokenNumber, formatCurrency } from '@/lib/hospitalData';
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

  // Fetch doctors from database
  useEffect(() => {
    fetchDoctors();
  }, []);

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
      const tokenData = {
        token_number: generateTokenNumber(),
        patient_id: selectedPatient.id,
        doctor_id: selectedDoctor.id,
        date: new Date().toISOString().split('T')[0],
        status: 'waiting',
        fee: selectedDoctor.opd_fee,
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

  const printToken = () => {
    if (!generatedToken || !selectedPatient || !selectedDoctor) return;

    const printContent = `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #333;">HOSPITAL MANAGEMENT SYSTEM</h2>
          <p style="margin: 5px 0; color: #666;">OPD Token</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <strong>Token No:</strong> ${generatedToken.token_number}
          </div>
          <div>
            <strong>Date:</strong> ${new Date().toLocaleDateString()}
          </div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong>Patient Details:</strong><br>
          Name: ${selectedPatient.name}<br>
          Age: ${selectedPatient.age} years<br>
          Gender: ${selectedPatient.gender}<br>
          Contact: ${selectedPatient.contact}
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong>Doctor Details:</strong><br>
          Dr. ${selectedDoctor.name}<br>
          Department: ${selectedDoctor.department}<br>
          Specialization: ${selectedDoctor.specialization}
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong>Fee:</strong> ${formatCurrency(selectedDoctor.opd_fee)}<br>
          <strong>Payment Status:</strong> ${generatedToken.payment_status.toUpperCase()}
        </div>
        
        <div style="border-top: 1px solid #ccc; padding-top: 10px; margin-top: 20px;">
          <p style="margin: 0; font-size: 12px; color: #666;">
            Please wait for your turn. Show this token to the doctor.
          </p>
        </div>
      </div>
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #333;">HOSPITAL MANAGEMENT SYSTEM</h2>
          <p style="margin: 5px 0; color: #666;">Prescription & Medical Record</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
            <strong>Token No:</strong> ${generatedToken?.token_number || 'N/A'}
          </div>
          <div style="text-align: right;">
            <strong>Dr. ${selectedDoctor.name}</strong><br>
            ${selectedDoctor.department}<br>
            ${selectedDoctor.specialization}
          </div>
        </div>
        
        <div style="margin-bottom: 20px; background: #f5f5f5; padding: 15px; border-radius: 5px;">
          <strong>Patient Information:</strong><br>
          Name: ${selectedPatient.name}<br>
          Age: ${selectedPatient.age} years | Gender: ${selectedPatient.gender}<br>
          Contact: ${selectedPatient.contact}<br>
          Problem: ${selectedPatient.problem}
        </div>
        
        <div style="margin-bottom: 30px;">
          <strong>Clinical Examination:</strong><br>
          <div style="height: 100px; border: 1px solid #ccc; margin-top: 10px;"></div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <strong>Diagnosis:</strong><br>
          <div style="height: 80px; border: 1px solid #ccc; margin-top: 10px;"></div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <strong>Prescription:</strong><br>
          <div style="height: 150px; border: 1px solid #ccc; margin-top: 10px;"></div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <strong>Lab Tests / Investigations:</strong><br>
          <div style="height: 100px; border: 1px solid #ccc; margin-top: 10px;"></div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <strong>Advice / Follow-up:</strong><br>
          <div style="height: 80px; border: 1px solid #ccc; margin-top: 10px;"></div>
        </div>
        
        <div style="margin-top: 50px; text-align: right;">
          <div style="border-top: 1px solid #333; width: 200px; margin-left: auto; padding-top: 10px;">
            Doctor's Signature
          </div>
        </div>
      </div>
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
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <h2 className="text-3xl font-bold text-green-600">Token #{generatedToken.token_number}</h2>
                <p className="text-gray-600 mt-2">Generated on {new Date().toLocaleDateString()}</p>
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
                  Print Prescription Sheet
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
