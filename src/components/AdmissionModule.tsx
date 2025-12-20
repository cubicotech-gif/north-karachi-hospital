import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bed, Building, User, Printer } from 'lucide-react';
import { Patient, formatCurrency } from '@/lib/hospitalData';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';

interface Doctor {
  id: string;
  name: string;
  department: string;
  specialization: string;
}

interface Room {
  id: string;
  room_number: string;
  type: string;
  bed_count: number;
  occupied_beds: number;
  price_per_day: number;
  department: string;
  active: boolean;
}

interface Admission {
  id: string;
  patient_id: string;
  doctor_id: string;
  room_id: string;
  bed_number: number;
  admission_date: string;
  admission_type: string;
  deposit: number;
  status: string;
  notes: string;
}

interface AdmissionModuleProps {
  selectedPatient: Patient | null;
}

export default function AdmissionModule({ selectedPatient }: AdmissionModuleProps) {
  const [admissionType, setAdmissionType] = useState<'OPD' | 'Direct' | 'Emergency'>('OPD');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [bedNumber, setBedNumber] = useState<number>(1);
  const [deposit, setDeposit] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [generatedAdmission, setGeneratedAdmission] = useState<Admission | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch doctors and rooms from database
  useEffect(() => {
    fetchDoctors();
    fetchRooms();
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

  const fetchRooms = async () => {
    try {
      const { data, error } = await db.rooms.getAvailable();
      if (error) {
        console.error('Error fetching rooms:', error);
        toast.error('Failed to load rooms');
        return;
      }
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Failed to load rooms');
    }
  };

  const handleDoctorSelect = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    setSelectedDoctor(doctor || null);
  };

  const handleRoomSelect = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    setSelectedRoom(room || null);
    if (room) {
      setDeposit(room.price_per_day * 3); // Default 3 days deposit
    }
  };

  const createAdmission = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient first');
      return;
    }

    if (bedNumber > selectedRoom.bed_count || bedNumber < 1) {
      toast.error(`Bed number must be between 1 and ${selectedRoom.bed_count}`);
      return;
    }

    setLoading(true);
    try {
      const admissionData = {
        patient_id: selectedPatient.id,
        doctor_id: selectedDoctor.id,
        room_id: selectedRoom.id,
        bed_number: bedNumber,
        admission_date: new Date().toISOString().split('T')[0],
        admission_type: admissionType,
        deposit: deposit,
        status: 'active',
        notes: notes
      };

      const { data, error } = await db.admissions.create(admissionData);
      
      if (error) {
        console.error('Error creating admission:', error);
        toast.error('Failed to create admission');
        setLoading(false);
        return;
      }

      // Update room occupancy
      await db.rooms.update(selectedRoom.id, {
        occupied_beds: selectedRoom.occupied_beds + 1
      });

      setGeneratedAdmission(data);
      toast.success('Patient admission created successfully!');
      
      // Refresh rooms list
      fetchRooms();
    } catch (error) {
      console.error('Error creating admission:', error);
      toast.error('Failed to create admission');
    } finally {
      setLoading(false);
    }
  };

  const printAdmissionForm = () => {
    if (!generatedAdmission || !selectedPatient || !selectedDoctor || !selectedRoom) {
      toast.error('Missing admission details');
      return;
    }

    const formContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Admission Form - ${selectedPatient.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; border-bottom: 3px solid #e74c3c; padding-bottom: 15px; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #333; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; font-size: 14px; }
          .form-title { background: #2563eb; color: white; padding: 10px; text-align: center; font-size: 18px; font-weight: bold; margin: 15px 0; }
          .section { margin-bottom: 20px; }
          .section-title { background: #f0f0f0; padding: 8px 12px; font-weight: bold; border-left: 4px solid #2563eb; margin-bottom: 10px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .info-item { padding: 8px; border: 1px solid #ddd; }
          .info-item label { font-weight: bold; color: #666; font-size: 12px; display: block; }
          .info-item span { font-size: 14px; }
          .signature-section { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
          .signature-box { text-align: center; }
          .signature-line { border-bottom: 2px solid #333; height: 50px; margin-bottom: 5px; }
          .signature-label { font-size: 12px; color: #666; }
          .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>NORTH KARACHI HOSPITAL</h1>
          <p>C-122, Sector 11-B, North Karachi Township, Karachi</p>
          <p>Ph: 36989080</p>
        </div>

        <div class="form-title">HOSPITAL ADMISSION FORM</div>

        <div class="section">
          <div class="section-title">PATIENT INFORMATION</div>
          <div class="info-grid">
            <div class="info-item">
              <label>Patient Name</label>
              <span>${selectedPatient.name}</span>
            </div>
            <div class="info-item">
              <label>Age / Gender</label>
              <span>${selectedPatient.age} years / ${selectedPatient.gender}</span>
            </div>
            <div class="info-item">
              <label>Contact Number</label>
              <span>${selectedPatient.contact}</span>
            </div>
            <div class="info-item">
              <label>Emergency Contact</label>
              <span>${selectedPatient.emergencyContact || 'N/A'}</span>
            </div>
            <div class="info-item" style="grid-column: 1 / -1;">
              <label>Address</label>
              <span>${selectedPatient.address || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">ADMISSION DETAILS</div>
          <div class="info-grid">
            <div class="info-item">
              <label>Admission ID</label>
              <span>${generatedAdmission.id.slice(-8).toUpperCase()}</span>
            </div>
            <div class="info-item">
              <label>Admission Date</label>
              <span>${new Date(generatedAdmission.admission_date).toLocaleDateString('en-GB')}</span>
            </div>
            <div class="info-item">
              <label>Admission Type</label>
              <span>${admissionType === 'OPD' ? 'From OPD' : admissionType === 'Emergency' ? 'Emergency' : 'Direct Admission'}</span>
            </div>
            <div class="info-item">
              <label>Department</label>
              <span>${selectedDoctor.department}</span>
            </div>
            <div class="info-item">
              <label>Attending Doctor</label>
              <span>Dr. ${selectedDoctor.name}</span>
            </div>
            <div class="info-item">
              <label>Reason for Admission</label>
              <span>${notes || selectedPatient.problem || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">ROOM & BED ALLOCATION</div>
          <div class="info-grid">
            <div class="info-item">
              <label>Room Number</label>
              <span>${selectedRoom.room_number}</span>
            </div>
            <div class="info-item">
              <label>Room Type</label>
              <span>${selectedRoom.type}</span>
            </div>
            <div class="info-item">
              <label>Bed Number</label>
              <span>${generatedAdmission.bed_number}</span>
            </div>
            <div class="info-item">
              <label>Daily Rate</label>
              <span>${formatCurrency(selectedRoom.price_per_day)}</span>
            </div>
            <div class="info-item">
              <label>Deposit Paid</label>
              <span>${formatCurrency(generatedAdmission.deposit)}</span>
            </div>
            <div class="info-item">
              <label>Status</label>
              <span style="color: green; font-weight: bold;">ACTIVE</span>
            </div>
          </div>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Patient / Attendant Signature</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Doctor's Signature</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Admission Officer</div>
          </div>
        </div>

        <div class="footer">
          <p>This is an official hospital document. Please retain for your records.</p>
          <p>Generated: ${new Date().toLocaleString('en-GB')}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(formContent);
      printWindow.document.close();
      printWindow.print();
      toast.success('Admission form printed successfully');
    }
  };

  const printConsentForm = () => {
    if (!generatedAdmission || !selectedPatient || !selectedDoctor) {
      toast.error('Missing admission details');
      return;
    }

    const consentContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Admission Consent - ${selectedPatient.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 3px solid #e74c3c; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #333; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; font-size: 14px; }
          .consent-title { background: #e74c3c; color: white; padding: 10px; text-align: center; font-size: 18px; font-weight: bold; margin: 15px 0; }
          .patient-info { border: 2px solid #e74c3c; padding: 20px; margin-bottom: 30px; background: #fff5f5; }
          .patient-info h3 { margin: 0 0 15px 0; color: #e74c3c; border-bottom: 2px solid #e74c3c; padding-bottom: 8px; }
          .patient-info p { margin: 8px 0; font-size: 14px; }
          .consent-text { line-height: 1.8; text-align: justify; margin-bottom: 30px; }
          .consent-text ul { margin: 15px 0; padding-left: 25px; }
          .consent-text li { margin: 8px 0; }
          .checkbox-section { border: 1px solid #ddd; padding: 15px; margin-bottom: 30px; background: #f9f9f9; }
          .checkbox-item { margin: 10px 0; font-size: 13px; display: flex; align-items: center; gap: 10px; }
          .checkbox-box { width: 18px; height: 18px; border: 2px solid #333; display: inline-block; }
          .signature-section { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
          .signature-box { text-align: center; }
          .signature-line { border-bottom: 2px solid #333; height: 60px; margin-bottom: 10px; }
          .signature-label { font-size: 13px; font-weight: bold; }
          .signature-fields { font-size: 12px; color: #666; margin-top: 5px; }
          .footer-note { margin-top: 40px; padding: 15px; background: #f5f5f5; border: 1px solid #ddd; font-size: 11px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>NORTH KARACHI HOSPITAL</h1>
          <p>C-122, Sector 11-B, North Karachi Township, Karachi</p>
          <p>Ph: 36989080</p>
        </div>

        <div class="consent-title">HOSPITAL ADMISSION CONSENT FORM</div>

        <div style="text-align: right; margin-bottom: 20px; font-size: 14px;">
          <strong>Date:</strong> ${new Date(generatedAdmission.admission_date).toLocaleDateString('en-GB')}
        </div>

        <div class="patient-info">
          <h3>PATIENT INFORMATION</h3>
          <p><strong>Patient Name:</strong> ${selectedPatient.name}</p>
          <p><strong>Age:</strong> ${selectedPatient.age} years</p>
          <p><strong>Gender:</strong> ${selectedPatient.gender}</p>
          <p><strong>Contact:</strong> ${selectedPatient.contact}</p>
          <p><strong>Department:</strong> ${selectedDoctor.department}</p>
          <p><strong>Attending Doctor:</strong> Dr. ${selectedDoctor.name}</p>
        </div>

        <div class="consent-text">
          <h3>CONSENT STATEMENT</h3>
          <p>I, the undersigned, hereby give my consent for admission of the patient named above to North Karachi Hospital.</p>
          <p>I understand that:</p>
          <ul>
            <li>The patient requires hospitalization for medical care</li>
            <li>Hospital rules and regulations must be followed</li>
            <li>Medical procedures and treatments may be performed as necessary</li>
            <li>Visitors must follow hospital visiting hours and policies</li>
            <li>I am responsible for hospital charges and fees</li>
            <li>I will inform staff of any changes in the patient's condition</li>
            <li>I have the right to discharge the patient against medical advice</li>
          </ul>
          <p>I voluntarily consent to this hospital admission and agree to the terms stated above.</p>
        </div>

        <div class="checkbox-section">
          <div class="checkbox-item">
            <span class="checkbox-box"></span>
            I have read and understood the above consent statement
          </div>
          <div class="checkbox-item">
            <span class="checkbox-box"></span>
            I understand the hospital rules, visiting hours, and policies
          </div>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Patient / Guardian Signature</div>
            <div class="signature-fields">
              Name: _______________________<br>
              Relationship: _________________<br>
              CNIC: ________________________
            </div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Witness Signature</div>
            <div class="signature-fields">
              Name: _______________________<br>
              Designation: _________________<br>
              Date: ________________________
            </div>
          </div>
        </div>

        <div class="footer-note">
          <strong>Note:</strong> This consent form is a legal document. Please read it carefully before signing.<br>
          If you have any questions, please ask the medical staff before signing.
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(consentContent);
      printWindow.document.close();
      printWindow.print();
      toast.success('Consent form printed successfully');
    }
  };

  const printDepositReceipt = () => {
    if (!generatedAdmission || !selectedPatient || !selectedRoom) {
      toast.error('Missing admission details');
      return;
    }

    const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Deposit Receipt - ${selectedPatient.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; border-bottom: 3px solid #e74c3c; padding-bottom: 15px; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #333; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; font-size: 14px; }
          .receipt-title { background: #2563eb; color: white; padding: 10px; text-align: center; font-size: 18px; font-weight: bold; margin: 15px 0; }
          .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
          .info-box { background: #f5f5f5; padding: 15px; border-radius: 5px; }
          .info-box p { margin: 5px 0; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #2563eb; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          .total-row { font-weight: bold; font-size: 16px; background: #f0f7ff; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          .status-badge { display: inline-block; padding: 8px 20px; border-radius: 15px; font-weight: bold; background: #d4edda; color: #155724; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>NORTH KARACHI HOSPITAL</h1>
          <p>C-122, Sector 11-B, North Karachi Township, Karachi</p>
          <p>Ph: 36989080</p>
        </div>

        <div class="receipt-title">ADMISSION DEPOSIT RECEIPT</div>

        <div class="info-section">
          <div class="info-box">
            <p><strong>Receipt No:</strong> ADM-${generatedAdmission.id.slice(-8).toUpperCase()}</p>
            <p><strong>Date:</strong> ${new Date(generatedAdmission.admission_date).toLocaleDateString('en-GB')}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
          </div>
          <div class="info-box">
            <p><strong>Patient:</strong> ${selectedPatient.name}</p>
            <p><strong>Age/Gender:</strong> ${selectedPatient.age} yrs / ${selectedPatient.gender}</p>
            <p><strong>Contact:</strong> ${selectedPatient.contact}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Admission Deposit</strong><br>
                <span style="font-size: 13px; color: #666;">
                  Room: ${selectedRoom.room_number} (${selectedRoom.type})<br>
                  Bed Number: ${generatedAdmission.bed_number}<br>
                  Daily Rate: ${formatCurrency(selectedRoom.price_per_day)}
                </span>
              </td>
              <td style="text-align: right; vertical-align: top;">${formatCurrency(generatedAdmission.deposit)}</td>
            </tr>
            <tr class="total-row">
              <td style="text-align: right;"><strong>TOTAL DEPOSIT:</strong></td>
              <td style="text-align: right;"><strong>${formatCurrency(generatedAdmission.deposit)}</strong></td>
            </tr>
          </tbody>
        </table>

        <div style="text-align: center; margin: 20px 0;">
          <span class="status-badge">PAID</span>
        </div>

        <div class="footer">
          <p>Thank you for choosing North Karachi Hospital</p>
          <p>This is a computer generated receipt. Please retain for your records.</p>
          <p>This deposit is adjustable against final hospital bill.</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.print();
      toast.success('Deposit receipt printed successfully');
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
              <p><strong>Emergency:</strong> {selectedPatient.emergencyContact || 'N/A'}</p>
              <p><strong>Problem:</strong> {selectedPatient.problem}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bed className="h-5 w-5" />
            Admission Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="admissionType">Admission Type</Label>
            <Select value={admissionType} onValueChange={(value) => setAdmissionType(value as 'OPD' | 'Direct' | 'Emergency')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPD">From OPD</SelectItem>
                <SelectItem value="Direct">Direct Admission</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="doctor">Attending Doctor</Label>
            <Select onValueChange={handleDoctorSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select attending doctor..." />
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

          <div>
            <Label htmlFor="room">Room Selection</Label>
            <Select onValueChange={handleRoomSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select room..." />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.room_number} - {room.type} ({room.bed_count - room.occupied_beds} beds available) - {formatCurrency(room.price_per_day)}/day
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRoom && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bedNumber">Bed Number</Label>
                <Input
                  id="bedNumber"
                  type="number"
                  min="1"
                  max={selectedRoom.bed_count}
                  value={bedNumber}
                  onChange={(e) => setBedNumber(parseInt(e.target.value))}
                />
                <p className="text-sm text-gray-600 mt-1">
                  Available beds: 1 to {selectedRoom.bed_count}
                </p>
              </div>
              <div>
                <Label htmlFor="deposit">Deposit Amount</Label>
                <Input
                  id="deposit"
                  type="number"
                  value={deposit}
                  onChange={(e) => setDeposit(parseInt(e.target.value))}
                />
                <p className="text-sm text-gray-600 mt-1">
                  Suggested: {formatCurrency(selectedRoom.price_per_day * 3)} (3 days)
                </p>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Admission Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Doctor's admission notes, special instructions, etc."
            />
          </div>
        </CardContent>
      </Card>

      {selectedRoom && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Room Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p><strong>Room:</strong> {selectedRoom.room_number}</p>
                <p><strong>Type:</strong> {selectedRoom.type}</p>
                <p><strong>Total Beds:</strong> {selectedRoom.bed_count}</p>
              </div>
              <div>
                <p><strong>Rate:</strong> {formatCurrency(selectedRoom.price_per_day)}/day</p>
                <p><strong>Available:</strong> {selectedRoom.bed_count - selectedRoom.occupied_beds} beds</p>
                <Badge variant={selectedRoom.bed_count - selectedRoom.occupied_beds > 0 ? 'default' : 'destructive'}>
                  {selectedRoom.bed_count - selectedRoom.occupied_beds > 0 ? 'Available' : 'Full'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create Admission</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={createAdmission} 
            className="w-full"
            disabled={!selectedDoctor || !selectedRoom || loading}
          >
            <Bed className="h-4 w-4 mr-2" />
            {loading ? 'Creating Admission...' : 'Create Admission'}
          </Button>
        </CardContent>
      </Card>

      {generatedAdmission && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bed className="h-5 w-5" />
              Admission Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <h2 className="text-2xl font-bold text-green-600">Admission Successful</h2>
                <p className="text-gray-600 mt-2">Admission ID: {generatedAdmission.id}</p>
                <Badge className="mt-2">Active</Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Room: {selectedRoom?.room_number}</p>
                  <p className="text-sm text-gray-600">Bed: {generatedAdmission.bed_number}</p>
                </div>
                <div>
                  <p className="font-medium">Deposit: {formatCurrency(generatedAdmission.deposit)}</p>
                  <p className="text-sm text-gray-600">Type: {generatedAdmission.admission_type}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button onClick={printAdmissionForm} variant="outline" size="sm">
                  <Printer className="h-3 w-3 mr-2" />
                  Admission Form
                </Button>
                <Button onClick={printConsentForm} variant="outline" size="sm">
                  <Printer className="h-3 w-3 mr-2" />
                  Consent Form
                </Button>
                <Button onClick={printDepositReceipt} variant="outline" size="sm">
                  <Printer className="h-3 w-3 mr-2" />
                  Deposit Receipt
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
