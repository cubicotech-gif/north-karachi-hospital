import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bed, Building, User, Printer, CreditCard } from 'lucide-react';
import { Patient, Doctor, Room, Admission, mockDoctors, mockRooms, generateId, formatCurrency } from '@/lib/hospitalData';
import { toast } from 'sonner';

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

  const availableRooms = mockRooms.filter(room => room.occupiedBeds < room.bedCount);

  const handleDoctorSelect = (doctorId: string) => {
    const doctor = mockDoctors.find(d => d.id === doctorId);
    setSelectedDoctor(doctor || null);
  };

  const handleRoomSelect = (roomId: string) => {
    const room = mockRooms.find(r => r.id === roomId);
    setSelectedRoom(room || null);
    if (room) {
      setDeposit(room.pricePerDay * 3); // Default 3 days deposit
    }
  };

  const createAdmission = () => {
    if (!selectedPatient || !selectedDoctor || !selectedRoom) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (bedNumber > selectedRoom.bedCount || bedNumber < 1) {
      toast.error(`Bed number must be between 1 and ${selectedRoom.bedCount}`);
      return;
    }

    const admission: Admission = {
      id: generateId(),
      patientId: selectedPatient.id,
      doctorId: selectedDoctor.id,
      roomId: selectedRoom.id,
      bedNumber: bedNumber,
      admissionDate: new Date().toISOString().split('T')[0],
      admissionType: admissionType,
      deposit: deposit,
      status: 'active',
      notes: notes
    };

    // Update room occupancy
    selectedRoom.occupiedBeds += 1;
    
    setGeneratedAdmission(admission);
    toast.success('Patient admission created successfully!');
  };

  const printAdmissionForm = () => {
    if (!generatedAdmission || !selectedPatient || !selectedDoctor || !selectedRoom) return;

    const admissionContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #333;">HOSPITAL MANAGEMENT SYSTEM</h2>
          <p style="margin: 5px 0; color: #666;">Patient Admission Form</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <strong>Admission ID:</strong> ${generatedAdmission.id}<br>
            <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
            <strong>Type:</strong> ${generatedAdmission.admissionType}
          </div>
          <div style="text-align: right;">
            <strong>Room:</strong> ${selectedRoom.roomNumber}<br>
            <strong>Bed:</strong> ${generatedAdmission.bedNumber}<br>
            <strong>Type:</strong> ${selectedRoom.type}
          </div>
        </div>
        
        <div style="margin-bottom: 20px; background: #f5f5f5; padding: 15px; border-radius: 5px;">
          <strong>Patient Information:</strong><br>
          Name: ${selectedPatient.name}<br>
          Age: ${selectedPatient.age} years | Gender: ${selectedPatient.gender}<br>
          Contact: ${selectedPatient.contact}<br>
          Emergency Contact: ${selectedPatient.emergencyContact || 'N/A'}<br>
          Problem: ${selectedPatient.problem}
        </div>
        
        <div style="margin-bottom: 20px; background: #e8f4fd; padding: 15px; border-radius: 5px;">
          <strong>Attending Doctor:</strong><br>
          Dr. ${selectedDoctor.name}<br>
          Department: ${selectedDoctor.department}<br>
          Specialization: ${selectedDoctor.specialization}
        </div>
        
        <div style="margin-bottom: 20px;">
          <strong>Admission Details:</strong><br>
          Room Number: ${selectedRoom.roomNumber} (${selectedRoom.type})<br>
          Bed Number: ${generatedAdmission.bedNumber}<br>
          Room Rate: ${formatCurrency(selectedRoom.pricePerDay)}/day<br>
          Deposit Paid: ${formatCurrency(generatedAdmission.deposit)}
        </div>
        
        ${generatedAdmission.notes ? `
        <div style="margin-bottom: 20px;">
          <strong>Admission Notes:</strong><br>
          ${generatedAdmission.notes}
        </div>
        ` : ''}
        
        <div style="margin-bottom: 30px;">
          <strong>Terms & Conditions:</strong><br>
          <div style="font-size: 12px; color: #666; margin-top: 10px;">
            1. The deposit is refundable upon discharge after adjusting dues.<br>
            2. Visiting hours: 10:00 AM - 12:00 PM & 4:00 PM - 7:00 PM<br>
            3. Patient attendant must follow hospital rules and regulations.<br>
            4. Hospital is not responsible for personal belongings.
          </div>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-top: 50px;">
          <div style="text-align: center;">
            <div style="border-top: 1px solid #333; width: 150px; padding-top: 10px;">
              Patient/Guardian Signature
            </div>
          </div>
          <div style="text-align: center;">
            <div style="border-top: 1px solid #333; width: 150px; padding-top: 10px;">
              Hospital Authority
            </div>
          </div>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(admissionContent);
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
                {mockDoctors.map((doctor) => (
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
                {availableRooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.roomNumber} - {room.type} ({room.bedCount - room.occupiedBeds} beds available) - {formatCurrency(room.pricePerDay)}/day
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
                  max={selectedRoom.bedCount}
                  value={bedNumber}
                  onChange={(e) => setBedNumber(parseInt(e.target.value))}
                />
                <p className="text-sm text-gray-600 mt-1">
                  Available beds: 1 to {selectedRoom.bedCount}
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
                  Suggested: {formatCurrency(selectedRoom.pricePerDay * 3)} (3 days)
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
                <p><strong>Room:</strong> {selectedRoom.roomNumber}</p>
                <p><strong>Type:</strong> {selectedRoom.type}</p>
                <p><strong>Total Beds:</strong> {selectedRoom.bedCount}</p>
              </div>
              <div>
                <p><strong>Rate:</strong> {formatCurrency(selectedRoom.pricePerDay)}/day</p>
                <p><strong>Available:</strong> {selectedRoom.bedCount - selectedRoom.occupiedBeds} beds</p>
                <Badge variant={selectedRoom.bedCount - selectedRoom.occupiedBeds > 0 ? 'default' : 'destructive'}>
                  {selectedRoom.bedCount - selectedRoom.occupiedBeds > 0 ? 'Available' : 'Full'}
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
            disabled={!selectedDoctor || !selectedRoom}
          >
            <Bed className="h-4 w-4 mr-2" />
            Create Admission
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
                  <p className="font-medium">Room: {selectedRoom?.roomNumber}</p>
                  <p className="text-sm text-gray-600">Bed: {generatedAdmission.bedNumber}</p>
                </div>
                <div>
                  <p className="font-medium">Deposit: {formatCurrency(generatedAdmission.deposit)}</p>
                  <p className="text-sm text-gray-600">Type: {generatedAdmission.admissionType}</p>
                </div>
              </div>

              <Button onClick={printAdmissionForm} variant="outline" className="w-full">
                <Printer className="h-4 w-4 mr-2" />
                Print Admission Form
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}