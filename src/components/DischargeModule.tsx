import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LogOut, Printer, DollarSign, Bed } from 'lucide-react';
import { formatCurrency } from '@/lib/hospitalData';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';

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

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  contact: string;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

interface Room {
  id: string;
  room_number: string;
  type: string;
  price_per_day: number;
}

interface DischargeData {
  discharge_date: string;
  discharge_notes: string;
  final_diagnosis: string;
  treatment_summary: string;
  medications: string;
  follow_up_instructions: string;
  total_days: number;
  room_charges: number;
  medical_charges: number;
  medicine_charges: number;
  other_charges: number;
  total_charges: number;
  amount_paid: number;
  balance_due: number;
}

export default function DischargeModule() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [dischargeData, setDischargeData] = useState<DischargeData>({
    discharge_date: new Date().toISOString().split('T')[0],
    discharge_notes: '',
    final_diagnosis: '',
    treatment_summary: '',
    medications: '',
    follow_up_instructions: '',
    total_days: 0,
    room_charges: 0,
    medical_charges: 0,
    medicine_charges: 0,
    other_charges: 0,
    total_charges: 0,
    amount_paid: 0,
    balance_due: 0
  });

  useEffect(() => {
    fetchActiveAdmissions();
  }, []);

  useEffect(() => {
    if (selectedAdmission && room) {
      calculateCharges();
    }
  }, [selectedAdmission, room, dischargeData.discharge_date, dischargeData.medical_charges, dischargeData.medicine_charges, dischargeData.other_charges]);

  const fetchActiveAdmissions = async () => {
    try {
      const { data, error } = await db.admissions.getActive();
      if (error) {
        console.error('Error fetching admissions:', error);
        return;
      }
      setAdmissions(data || []);
    } catch (error) {
      console.error('Error fetching admissions:', error);
    }
  };

  const handleSelectAdmission = async (admission: Admission) => {
    setSelectedAdmission(admission);
    
    // Fetch patient details
    const { data: patientData } = await db.patients.getById(admission.patient_id);
    setPatient(patientData);
    
    // Fetch doctor details
    const { data: doctorData } = await db.doctors.getById(admission.doctor_id);
    setDoctor(doctorData);
    
    // Fetch room details
    const { data: roomData } = await db.rooms.getById(admission.room_id);
    setRoom(roomData);
  };

  const calculateCharges = () => {
    if (!selectedAdmission || !room) return;

    const admissionDate = new Date(selectedAdmission.admission_date);
    const dischargeDate = new Date(dischargeData.discharge_date);
    const totalDays = Math.max(1, Math.ceil((dischargeDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    const roomCharges = totalDays * room.price_per_day;
    const totalCharges = roomCharges + dischargeData.medical_charges + dischargeData.medicine_charges + dischargeData.other_charges;
    const balanceDue = totalCharges - selectedAdmission.deposit;

    setDischargeData(prev => ({
      ...prev,
      total_days: totalDays,
      room_charges: roomCharges,
      total_charges: totalCharges,
      amount_paid: selectedAdmission.deposit,
      balance_due: balanceDue
    }));
  };

  const handleDischarge = async () => {
    if (!selectedAdmission || !patient || !doctor || !room) {
      toast.error('Missing admission details');
      return;
    }


    setLoading(true);
    try {
      // Update admission status
      const { error: admissionError } = await db.admissions.update(selectedAdmission.id, {
        status: 'discharged'
      });

      if (admissionError) {
        toast.error('Failed to discharge patient');
        setLoading(false);
        return;
      }

      // Update room occupancy
      await db.rooms.update(selectedAdmission.room_id, {
        occupied_beds: room.occupied_beds - 1
      });

      toast.success('Patient discharged successfully!');
      printDischargeSummary();
      
      // Reset
      setSelectedAdmission(null);
      setPatient(null);
      setDoctor(null);
      setRoom(null);
      fetchActiveAdmissions();
    } catch (error) {
      console.error('Error discharging patient:', error);
      toast.error('Failed to discharge patient');
    } finally {
      setLoading(false);
    }
  };

  const printDischargeSummary = () => {
    if (!patient || !doctor || !room || !selectedAdmission) return;

    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #333;">HOSPITAL MANAGEMENT SYSTEM</h2>
          <p style="margin: 5px 0; color: #666;">Discharge Summary</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="margin-bottom: 10px;">Patient Information</h3>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
            <p><strong>Name:</strong> ${patient.name}</p>
            <p><strong>Age:</strong> ${patient.age} years | <strong>Gender:</strong> ${patient.gender}</p>
            <p><strong>Contact:</strong> ${patient.contact}</p>
            <p><strong>Admission Date:</strong> ${new Date(selectedAdmission.admission_date).toLocaleDateString()}</p>
            <p><strong>Discharge Date:</strong> ${new Date(dischargeData.discharge_date).toLocaleDateString()}</p>
            <p><strong>Total Days:</strong> ${dischargeData.total_days} days</p>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="margin-bottom: 10px;">Medical Details</h3>
          <div style="background: #e8f4fd; padding: 15px; border-radius: 5px;">
            <p><strong>Attending Doctor:</strong> Dr. ${doctor.name}</p>
            <p><strong>Specialization:</strong> ${doctor.specialization}</p>
            <p><strong>Room:</strong> ${room.room_number} (${room.type})</p>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="margin-bottom: 10px;">Clinical Summary</h3>
          <div style="padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
            <p><strong>Final Diagnosis:</strong></p>
            <p style="margin-left: 20px;">${dischargeData.final_diagnosis}</p>
            <br>
            <p><strong>Treatment Summary:</strong></p>
            <p style="margin-left: 20px;">${dischargeData.treatment_summary}</p>
            <br>
            <p><strong>Medications Prescribed:</strong></p>
            <p style="margin-left: 20px;">${dischargeData.medications || 'None'}</p>
            <br>
            <p><strong>Follow-up Instructions:</strong></p>
            <p style="margin-left: 20px;">${dischargeData.follow_up_instructions || 'None'}</p>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="margin-bottom: 10px;">Billing Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background: #f0f0f0;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Item</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Amount</th>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">Room Charges (${dischargeData.total_days} days)</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(dischargeData.room_charges)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">Medical Charges</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(dischargeData.medical_charges)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">Medicine Charges</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(dischargeData.medicine_charges)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">Other Charges</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(dischargeData.other_charges)}</td>
            </tr>
            <tr style="background: #f0f0f0; font-weight: bold;">
              <td style="border: 1px solid #ddd; padding: 8px;">Total Charges</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(dischargeData.total_charges)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">Advance Paid</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(dischargeData.amount_paid)}</td>
            </tr>
            <tr style="background: ${dischargeData.balance_due > 0 ? '#fff3cd' : '#d4edda'}; font-weight: bold;">
              <td style="border: 1px solid #ddd; padding: 8px;">${dischargeData.balance_due > 0 ? 'Balance Due' : 'Refund Amount'}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${formatCurrency(Math.abs(dischargeData.balance_due))}</td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 50px; display: flex; justify-content: space-between;">
          <div style="text-align: center;">
            <div style="border-top: 1px solid #333; width: 200px; padding-top: 10px;">
              Doctor's Signature
            </div>
          </div>
          <div style="text-align: center;">
            <div style="border-top: 1px solid #333; width: 200px; padding-top: 10px;">
              Hospital Authority
            </div>
          </div>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Patient Discharge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Label>Select Patient to Discharge</Label>
            <div className="grid grid-cols-1 gap-3">
              {admissions.map((admission) => (
                <Card 
                  key={admission.id} 
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedAdmission?.id === admission.id ? 'border-blue-500 border-2' : ''}`}
                  onClick={() => handleSelectAdmission(admission)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Admission ID: {admission.id.slice(-8)}</p>
                      <p className="text-sm text-gray-600">
                        Admitted: {new Date(admission.admission_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge>{admission.admission_type}</Badge>
                  </div>
                </Card>
              ))}
              {admissions.length === 0 && (
                <p className="text-center text-gray-500 py-8">No active admissions</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedAdmission && patient && doctor && room && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Patient Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><strong>Name:</strong> {patient.name}</p>
                  <p><strong>Age:</strong> {patient.age} years</p>
                  <p><strong>Gender:</strong> {patient.gender}</p>
                </div>
                <div>
                  <p><strong>Doctor:</strong> Dr. {doctor.name}</p>
                  <p><strong>Room:</strong> {room.room_number}</p>
                  <p><strong>Admitted:</strong> {new Date(selectedAdmission.admission_date).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Discharge Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="dischargeDate">Discharge Date</Label>
                <Input
                  id="dischargeDate"
                  type="date"
                  value={dischargeData.discharge_date}
                  onChange={(e) => setDischargeData({ ...dischargeData, discharge_date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="finalDiagnosis">Final Diagnosis</Label>
                <Textarea
                  id="finalDiagnosis"
                  value={dischargeData.final_diagnosis}
                  onChange={(e) => setDischargeData({ ...dischargeData, final_diagnosis: e.target.value })}
                  placeholder="Enter final diagnosis..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="treatmentSummary">Treatment Summary</Label>
                <Textarea
                  id="treatmentSummary"
                  value={dischargeData.treatment_summary}
                  onChange={(e) => setDischargeData({ ...dischargeData, treatment_summary: e.target.value })}
                  placeholder="Enter treatment summary..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="medications">Medications Prescribed</Label>
                <Textarea
                  id="medications"
                  value={dischargeData.medications}
                  onChange={(e) => setDischargeData({ ...dischargeData, medications: e.target.value })}
                  placeholder="List medications..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="followUp">Follow-up Instructions</Label>
                <Textarea
                  id="followUp"
                  value={dischargeData.follow_up_instructions}
                  onChange={(e) => setDischargeData({ ...dischargeData, follow_up_instructions: e.target.value })}
                  placeholder="Follow-up instructions..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Billing Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="medicalCharges">Medical Charges</Label>
                  <Input
                    id="medicalCharges"
                    type="number"
                    value={dischargeData.medical_charges}
                    onChange={(e) => setDischargeData({ ...dischargeData, medical_charges: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="medicineCharges">Medicine Charges</Label>
                  <Input
                    id="medicineCharges"
                    type="number"
                    value={dischargeData.medicine_charges}
                    onChange={(e) => setDischargeData({ ...dischargeData, medicine_charges: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="otherCharges">Other Charges</Label>
                  <Input
                    id="otherCharges"
                    type="number"
                    value={dischargeData.other_charges}
                    onChange={(e) => setDischargeData({ ...dischargeData, other_charges: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <Separator />

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Total Days:</span>
                  <span className="font-medium">{dischargeData.total_days} days</span>
                </div>
                <div className="flex justify-between">
                  <span>Room Charges:</span>
                  <span className="font-medium">{formatCurrency(dischargeData.room_charges)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Medical Charges:</span>
                  <span className="font-medium">{formatCurrency(dischargeData.medical_charges)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Medicine Charges:</span>
                  <span className="font-medium">{formatCurrency(dischargeData.medicine_charges)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Other Charges:</span>
                  <span className="font-medium">{formatCurrency(dischargeData.other_charges)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Charges:</span>
                  <span>{formatCurrency(dischargeData.total_charges)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Advance Paid:</span>
                  <span className="font-medium text-green-600">{formatCurrency(dischargeData.amount_paid)}</span>
                </div>
                <Separator />
                <div className={`flex justify-between text-lg font-bold ${dischargeData.balance_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  <span>{dischargeData.balance_due > 0 ? 'Balance Due:' : 'Refund Amount:'}</span>
                  <span>{formatCurrency(Math.abs(dischargeData.balance_due))}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleDischarge} className="flex-1" disabled={loading}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {loading ? 'Discharging...' : 'Discharge Patient'}
                </Button>
                <Button onClick={printDischargeSummary} variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
