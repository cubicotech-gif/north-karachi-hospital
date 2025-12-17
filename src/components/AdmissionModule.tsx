import React, { useState, useEffect, useRef } from 'react';
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
import { useReactToPrint } from 'react-to-print';
import AdmissionFormTemplate from '@/components/documents/AdmissionFormTemplate';
import DocumentViewer from '@/components/documents/DocumentViewer';

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
  const [shouldPrint, setShouldPrint] = useState(false);
  const admissionFormRef = useRef<HTMLDivElement>(null);

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

  const handlePrint = useReactToPrint({
    content: () => admissionFormRef.current,
    documentTitle: `Admission-Form-${selectedPatient?.name || 'Unknown'}`,
    onAfterPrint: () => {
      toast.success('Admission form printed successfully');
      setShouldPrint(false);
    },
  });

  const printAdmissionForm = () => {
    if (!generatedAdmission || !selectedPatient || !selectedDoctor || !selectedRoom) {
      toast.error('Missing admission details');
      return;
    }
    setShouldPrint(true);
    setTimeout(() => {
      handlePrint();
    }, 100);
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

              <Button onClick={printAdmissionForm} variant="outline" className="w-full">
                <Printer className="h-4 w-4 mr-2" />
                Print Admission Form
              </Button>

              <Separator />

              {/* Uploaded Document Templates */}
              <div className="space-y-3">
                <DocumentViewer
                  moduleName="admission"
                  documentType="admission_form"
                  title="Admission Form Template"
                />
                <DocumentViewer
                  moduleName="admission"
                  documentType="consent_form"
                  title="Admission Consent Form"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden Admission Form Template for Printing */}
      {shouldPrint && selectedPatient && selectedDoctor && selectedRoom && generatedAdmission && (
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
              regNumber: generatedAdmission.id.slice(-8).toUpperCase(),
              department: selectedDoctor.department,
              consultant: selectedDoctor.name,
              admissionDateTime: new Date(generatedAdmission.admission_date).toLocaleString('en-GB'),
              modeOfAdmission:
                admissionType === 'OPD' ? 'From OPD' :
                admissionType === 'Emergency' ? 'Emergency' :
                'Refered',
              admissionFor: notes || selectedPatient.problem,
            }}
          />
        </div>
      )}
    </div>
  );
}
