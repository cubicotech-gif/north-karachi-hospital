import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LogOut, Printer, DollarSign, Bed, TestTube, Activity, Heart, Baby, RefreshCw, Eye, ChevronDown, ChevronUp, Percent } from 'lucide-react';
import { formatCurrency } from '@/lib/hospitalData';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import DischargeSummaryTemplate from '@/components/documents/DischargeSummaryTemplate';
import DocumentViewer from '@/components/documents/DocumentViewer';

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
  mr_number?: string;
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
  const [admissionPatients, setAdmissionPatients] = useState<{ [key: string]: Patient }>({});
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [shouldPrint, setShouldPrint] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showChargesBreakdown, setShowChargesBreakdown] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  // Fetched charges from database
  const [labCharges, setLabCharges] = useState<{ total: number; items: any[] }>({ total: 0, items: [] });
  const [treatmentCharges, setTreatmentCharges] = useState<{ total: number; items: any[] }>({ total: 0, items: [] });
  const [nicuCharges, setNicuCharges] = useState<{ total: number; items: any[] }>({ total: 0, items: [] });
  const [babyPatients, setBabyPatients] = useState<any[]>([]);
  const [loadingCharges, setLoadingCharges] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Calculate discount on total
  const calculateDiscount = (total: number): { discountAmount: number; finalTotal: number } => {
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (total * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }
    discountAmount = Math.min(discountAmount, total);
    const finalTotal = total - discountAmount;
    return { discountAmount, finalTotal };
  };

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
  }, [selectedAdmission, room, dischargeData.discharge_date, dischargeData.medical_charges, dischargeData.medicine_charges, dischargeData.other_charges, labCharges.total, treatmentCharges.total, nicuCharges.total, discountType, discountValue]);

  const fetchActiveAdmissions = async () => {
    try {
      const { data, error } = await db.admissions.getActive();
      if (error) {
        console.error('Error fetching admissions:', error);
        return;
      }
      setAdmissions(data || []);

      // Fetch patient details for each admission
      const patientMap: { [key: string]: Patient } = {};
      for (const admission of (data || [])) {
        const { data: patientData } = await db.patients.getById(admission.patient_id);
        if (patientData) {
          patientMap[admission.id] = patientData;
        }
      }
      setAdmissionPatients(patientMap);
    } catch (error) {
      console.error('Error fetching admissions:', error);
    }
  };

  const handleSelectAdmission = async (admission: Admission) => {
    setSelectedAdmission(admission);
    setLoadingCharges(true);

    // Fetch patient details
    const { data: patientData } = await db.patients.getById(admission.patient_id);
    setPatient(patientData);

    // Fetch doctor details
    const { data: doctorData } = await db.doctors.getById(admission.doctor_id);
    setDoctor(doctorData);

    // Fetch room details
    const { data: roomData } = await db.rooms.getById(admission.room_id);
    setRoom(roomData);

    // Fetch all charges for this admission
    await loadAllCharges(admission, patientData);
    setLoadingCharges(false);
  };

  // Load all charges for an admission (lab, treatment, NICU, baby charges)
  const loadAllCharges = async (admission: Admission, patientData: any) => {
    try {
      // 1. Fetch lab orders for this patient during admission period
      const { data: labOrders } = await db.labOrders.getByPatientId(admission.patient_id);
      const admissionDate = new Date(admission.admission_date);
      const relevantLabs = (labOrders || []).filter((lab: any) => {
        const labDate = new Date(lab.created_at);
        return labDate >= admissionDate;
      });
      const labTotal = relevantLabs.reduce((sum: number, lab: any) => sum + (lab.total_cost || 0), 0);
      setLabCharges({ total: labTotal, items: relevantLabs });

      // 2. Fetch treatments for this patient during admission
      const { data: treatments } = await db.treatments.getByPatientId(admission.patient_id);
      const relevantTreatments = (treatments || []).filter((t: any) => {
        const treatDate = new Date(t.treatment_date || t.created_at);
        return treatDate >= admissionDate;
      });
      const treatmentTotal = relevantTreatments.reduce((sum: number, t: any) => sum + (t.price || 0), 0);
      setTreatmentCharges({ total: treatmentTotal, items: relevantTreatments });

      // 3. Fetch NICU observations for this admission
      let allNicuItems: any[] = [];
      let nicuTotal = 0;

      // NICU directly linked to admission
      const { data: nicuObs } = await db.nicuObservations.getByAdmissionId(admission.id);
      if (nicuObs && nicuObs.length > 0) {
        allNicuItems = [...nicuObs];
        nicuTotal = nicuObs.reduce((sum: number, obs: any) => sum + (obs.total_charge || 0), 0);
      }

      // 4. If patient is female, check for baby patients and their NICU charges
      if (patientData?.gender === 'Female') {
        const { data: babies } = await db.babyPatients.getByMotherId(admission.patient_id);
        if (babies && babies.length > 0) {
          setBabyPatients(babies);

          // Fetch NICU for each baby
          for (const baby of babies) {
            const { data: babyNicu } = await db.nicuObservations.getByBabyPatientId(baby.id);
            if (babyNicu && babyNicu.length > 0) {
              // Filter NICU during admission period
              const relevantNicu = babyNicu.filter((obs: any) => {
                const obsDate = new Date(obs.observation_date || obs.created_at);
                return obsDate >= admissionDate;
              });
              allNicuItems = [...allNicuItems, ...relevantNicu.map((obs: any) => ({ ...obs, babyName: baby.name }))];
              nicuTotal += relevantNicu.reduce((sum: number, obs: any) => sum + (obs.total_charge || 0), 0);
            }
          }
        }
      }

      setNicuCharges({ total: nicuTotal, items: allNicuItems });

    } catch (error) {
      console.error('Error loading charges:', error);
      toast.error('Failed to load some charges');
    }
  };

  const calculateCharges = () => {
    if (!selectedAdmission || !room) return;

    const admissionDate = new Date(selectedAdmission.admission_date);
    const dischargeDate = new Date(dischargeData.discharge_date);
    const totalDays = Math.max(1, Math.ceil((dischargeDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24)));

    const roomCharges = totalDays * room.price_per_day;

    // Subtotal includes: Room + Lab + Treatment + NICU + Manual charges
    const subtotal =
      roomCharges +
      labCharges.total +
      treatmentCharges.total +
      nicuCharges.total +
      dischargeData.medical_charges +
      dischargeData.medicine_charges +
      dischargeData.other_charges;

    // Apply discount
    const { discountAmount, finalTotal } = calculateDiscount(subtotal);

    const balanceDue = finalTotal - selectedAdmission.deposit;

    setDischargeData(prev => ({
      ...prev,
      total_days: totalDays,
      room_charges: roomCharges,
      total_charges: finalTotal, // Final after discount
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

  const handlePrint = useReactToPrint({
    contentRef: summaryRef,
    documentTitle: `Discharge-Summary-${patient?.name || 'Unknown'}`,
    onAfterPrint: () => {
      toast.success('Discharge summary printed successfully');
      setShouldPrint(false);
    },
  });

  const printDischargeSummary = () => {
    if (!patient || !doctor || !room || !selectedAdmission) {
      toast.error('Missing discharge details');
      return;
    }
    setShouldPrint(true);
    setTimeout(() => {
      handlePrint();
    }, 100);
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
              {admissions.map((admission) => {
                const admPatient = admissionPatients[admission.id];
                return (
                  <Card
                    key={admission.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedAdmission?.id === admission.id ? 'border-blue-500 border-2' : ''}`}
                    onClick={() => handleSelectAdmission(admission)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-lg">{admPatient?.name || 'Loading...'}</p>
                        <p className="text-sm font-semibold text-blue-600">
                          MR#: {admPatient?.mr_number || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Admitted: {new Date(admission.admission_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge>{admission.admission_type}</Badge>
                    </div>
                  </Card>
                );
              })}
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
                  <p className="text-blue-600 font-semibold"><strong>MR Number:</strong> {patient.mr_number || 'N/A'}</p>
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
                {loadingCharges && <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* System-fetched charges (read-only) */}
              {(labCharges.total > 0 || treatmentCharges.total > 0 || nicuCharges.total > 0 || babyPatients.length > 0) && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-blue-800">Auto-fetched Charges</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowChargesBreakdown(!showChargesBreakdown)}
                      className="text-blue-600"
                    >
                      {showChargesBreakdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {showChargesBreakdown ? 'Hide Details' : 'Show Details'}
                    </Button>
                  </div>

                  {labCharges.total > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className="flex items-center gap-2">
                        <TestTube className="h-4 w-4 text-purple-600" />
                        Lab Tests ({labCharges.items.length})
                      </span>
                      <span className="font-medium text-purple-600">{formatCurrency(labCharges.total)}</span>
                    </div>
                  )}

                  {treatmentCharges.total > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-teal-600" />
                        Treatments ({treatmentCharges.items.length})
                      </span>
                      <span className="font-medium text-teal-600">{formatCurrency(treatmentCharges.total)}</span>
                    </div>
                  )}

                  {nicuCharges.total > 0 && (
                    <div className="flex justify-between items-center py-1">
                      <span className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-orange-600" />
                        NICU Charges ({nicuCharges.items.length})
                      </span>
                      <span className="font-medium text-orange-600">{formatCurrency(nicuCharges.total)}</span>
                    </div>
                  )}

                  {babyPatients.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <span className="flex items-center gap-2 text-sm text-blue-700">
                        <Baby className="h-4 w-4" />
                        Baby charges included: {babyPatients.map(b => b.name).join(', ')}
                      </span>
                    </div>
                  )}

                  {showChargesBreakdown && (
                    <div className="mt-3 pt-3 border-t border-blue-200 space-y-2 text-sm">
                      {labCharges.items.length > 0 && (
                        <div>
                          <p className="font-medium text-purple-700">Lab Tests:</p>
                          {labCharges.items.map((lab: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-gray-600 pl-4">
                              <span>{lab.test_names || 'Lab Order'}</span>
                              <span>{formatCurrency(lab.total_cost || 0)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {treatmentCharges.items.length > 0 && (
                        <div>
                          <p className="font-medium text-teal-700">Treatments:</p>
                          {treatmentCharges.items.map((t: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-gray-600 pl-4">
                              <span>{t.treatment_types?.name || 'Treatment'}</span>
                              <span>{formatCurrency(t.price || 0)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {nicuCharges.items.length > 0 && (
                        <div>
                          <p className="font-medium text-orange-700">NICU Observations:</p>
                          {nicuCharges.items.map((obs: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-gray-600 pl-4">
                              <span>
                                {obs.babyName ? `${obs.babyName} - ` : ''}
                                {obs.hours_charged || 0} hrs @ Rs.{obs.hourly_rate || 500}/hr
                              </span>
                              <span>{formatCurrency(obs.total_charge || 0)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Manual charges input */}
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

              {/* Discount Section */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <Label className="flex items-center gap-2 mb-3">
                  <Percent className="h-4 w-4 text-green-600" />
                  Discount on Total Bill / رعایت
                </Label>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-xs text-gray-600 mb-1 block">Type</Label>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                      className="w-full h-10 px-3 rounded-md border border-input bg-white text-sm"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (Rs.)</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-gray-600 mb-1 block">
                      {discountType === 'percentage' ? 'Percentage' : 'Amount'}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max={discountType === 'percentage' ? 100 : undefined}
                      value={discountValue || ''}
                      onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                      placeholder={discountType === 'percentage' ? 'e.g. 10' : 'e.g. 5000'}
                      className="bg-white"
                    />
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">Optional - Apply discount on final bill if applicable</p>
              </div>

              <Separator />

              {/* Total Summary */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Total Days:</span>
                  <span className="font-medium">{dischargeData.total_days} days</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="flex items-center gap-2"><Bed className="h-4 w-4" /> Room Charges:</span>
                  <span className="font-medium">{formatCurrency(dischargeData.room_charges)}</span>
                </div>
                {labCharges.total > 0 && (
                  <div className="flex justify-between text-purple-700">
                    <span className="flex items-center gap-2"><TestTube className="h-4 w-4" /> Lab Tests:</span>
                    <span className="font-medium">{formatCurrency(labCharges.total)}</span>
                  </div>
                )}
                {treatmentCharges.total > 0 && (
                  <div className="flex justify-between text-teal-700">
                    <span className="flex items-center gap-2"><Activity className="h-4 w-4" /> Treatments:</span>
                    <span className="font-medium">{formatCurrency(treatmentCharges.total)}</span>
                  </div>
                )}
                {nicuCharges.total > 0 && (
                  <div className="flex justify-between text-orange-700">
                    <span className="flex items-center gap-2"><Heart className="h-4 w-4" /> NICU Charges:</span>
                    <span className="font-medium">{formatCurrency(nicuCharges.total)}</span>
                  </div>
                )}
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

                {/* Subtotal */}
                <div className="flex justify-between font-medium">
                  <span>Subtotal:</span>
                  <span className={discountValue > 0 ? 'line-through text-gray-400' : ''}>
                    {formatCurrency(
                      dischargeData.room_charges +
                      labCharges.total +
                      treatmentCharges.total +
                      nicuCharges.total +
                      dischargeData.medical_charges +
                      dischargeData.medicine_charges +
                      dischargeData.other_charges
                    )}
                  </span>
                </div>

                {/* Discount Display */}
                {discountValue > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Discount ({discountType === 'percentage' ? `${discountValue}%` : 'Fixed'}) / رعایت:
                    </span>
                    <span className="font-medium">
                      -{formatCurrency(calculateDiscount(
                        dischargeData.room_charges +
                        labCharges.total +
                        treatmentCharges.total +
                        nicuCharges.total +
                        dischargeData.medical_charges +
                        dischargeData.medicine_charges +
                        dischargeData.other_charges
                      ).discountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold">
                  <span>Total Charges:</span>
                  <span>{formatCurrency(dischargeData.total_charges)}</span>
                </div>

                {discountValue > 0 && (
                  <div className="text-right text-sm text-green-600">
                    You saved {formatCurrency(calculateDiscount(
                      dischargeData.room_charges +
                      labCharges.total +
                      treatmentCharges.total +
                      nicuCharges.total +
                      dischargeData.medical_charges +
                      dischargeData.medicine_charges +
                      dischargeData.other_charges
                    ).discountAmount)}!
                  </div>
                )}

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

              <Separator className="my-4" />

              {/* Uploaded Document Templates */}
              <div className="space-y-3">
                <DocumentViewer
                  moduleName="discharge"
                  documentType="discharge_summary"
                  title="Discharge Summary Template"
                />
                <DocumentViewer
                  moduleName="discharge"
                  documentType="consent_form"
                  title="Discharge Consent Form"
                />
                <DocumentViewer
                  moduleName="discharge"
                  documentType="certificate"
                  title="Discharge Certificate"
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Hidden Discharge Summary Template for Printing */}
      {shouldPrint && patient && doctor && room && selectedAdmission && (
        <div style={{ display: 'none' }}>
          <DischargeSummaryTemplate
            ref={summaryRef}
            data={{
              summaryNumber: `DSC-${selectedAdmission.id.slice(-6).toUpperCase()}`,
              patientName: patient.name,
              age: patient.age,
              gender: patient.gender,
              mrNumber: patient.mr_number || 'N/A',
              admissionDate: selectedAdmission.admission_date,
              dischargeDate: dischargeData.discharge_date,
              totalDays: dischargeData.total_days,
              consultantName: doctor.name,
              diagnosis: dischargeData.final_diagnosis,
              treatmentGiven: dischargeData.treatment_summary,
              conditionAtDischarge: 'Improved',
              medications: dischargeData.medications,
              advice: dischargeData.follow_up_instructions,
            }}
          />
        </div>
      )}
    </div>
  );
}
