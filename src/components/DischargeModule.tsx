import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LogOut,
  Printer,
  DollarSign,
  Bed,
  TestTube,
  Activity,
  Heart,
  Baby,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Percent,
  Receipt,
  History,
  Search,
  Eye,
  CreditCard,
  Banknote,
  Wallet
} from 'lucide-react';
import { formatCurrency } from '@/lib/hospitalData';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import DischargeSummaryTemplate from '@/components/documents/DischargeSummaryTemplate';
import DischargeBillingReceipt from '@/components/documents/DischargeBillingReceipt';

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
  address?: string;
  care_of?: string;
  patient_type?: string;
  mother_patient_id?: string;
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
  current_occupancy?: number;
}

interface DischargeRecord {
  id: string;
  discharge_number: string;
  discharge_date: string;
  patient_id: string;
  patients?: {
    name: string;
    mr_number: string;
    gender: string;
    age: number;
  };
  doctors?: {
    name: string;
  };
  total_charges: number;
  payment_status: string;
  condition_at_discharge: string;
}

const conditionOptions = [
  'Improved',
  'Stable',
  'Satisfactory',
  'Guarded',
  'Critical',
  'Referred',
  'LAMA (Left Against Medical Advice)',
  'Expired'
];

const paymentMethods = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'online', label: 'Online Transfer', icon: Wallet }
];

export default function DischargeModule() {
  const [activeTab, setActiveTab] = useState('discharge');
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [admissionPatients, setAdmissionPatients] = useState<{ [key: string]: Patient }>({});
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [shouldPrintSummary, setShouldPrintSummary] = useState(false);
  const [shouldPrintReceipt, setShouldPrintReceipt] = useState(false);
  const [showChargesBreakdown, setShowChargesBreakdown] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Past discharges
  const [pastDischarges, setPastDischarges] = useState<DischargeRecord[]>([]);
  const [loadingPast, setLoadingPast] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPastDischarge, setSelectedPastDischarge] = useState<any>(null);

  // Fetched charges from database
  const [labCharges, setLabCharges] = useState<{ total: number; items: any[] }>({ total: 0, items: [] });
  const [treatmentCharges, setTreatmentCharges] = useState<{ total: number; items: any[] }>({ total: 0, items: [] });
  const [nicuCharges, setNicuCharges] = useState<{ total: number; items: any[] }>({ total: 0, items: [] });
  const [babyPatients, setBabyPatients] = useState<any[]>([]);
  const [loadingCharges, setLoadingCharges] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Payment fields
  const [additionalPayment, setAdditionalPayment] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');

  // Discharge form data
  const [dischargeData, setDischargeData] = useState({
    discharge_date: new Date().toISOString().split('T')[0],
    discharge_notes: '',
    final_diagnosis: '',
    treatment_summary: '',
    medications: '',
    follow_up_instructions: '',
    follow_up_date: '',
    condition_at_discharge: 'Improved',
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
    if (activeTab === 'history') {
      loadPastDischarges();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedAdmission && room) {
      calculateCharges();
    }
  }, [
    selectedAdmission,
    room,
    dischargeData.discharge_date,
    dischargeData.medical_charges,
    dischargeData.medicine_charges,
    dischargeData.other_charges,
    labCharges.total,
    treatmentCharges.total,
    nicuCharges.total,
    discountType,
    discountValue,
    additionalPayment
  ]);

  // Calculate discount
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
      for (const admission of data || []) {
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

  const loadPastDischarges = async () => {
    setLoadingPast(true);
    try {
      const { data, error } = await db.discharges.getRecent(100);
      if (error) {
        // Table may not exist yet - this is expected until migration is run
        console.warn('Discharges table may not exist yet:', error.message);
        setPastDischarges([]);
        return;
      }
      setPastDischarges(data || []);
    } catch (error) {
      // Table may not exist yet
      console.warn('Discharges table may not exist yet');
      setPastDischarges([]);
    } finally {
      setLoadingPast(false);
    }
  };

  const handleSelectAdmission = async (admission: Admission) => {
    setSelectedAdmission(admission);
    setLoadingCharges(true);

    // Reset payment fields
    setAdditionalPayment(0);
    setDiscountType('percentage');
    setDiscountValue(0);

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
        const treatDate = new Date(t.treatment_date || t.date || t.created_at);
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

      // 4. If patient is female or a newborn, check for baby patients and their NICU charges
      if (patientData?.gender === 'Female' || patientData?.patient_type === 'newborn') {
        const { data: babies } = await db.babyPatients.getByMotherId(admission.patient_id);
        if (babies && babies.length > 0) {
          setBabyPatients(babies);

          // Fetch NICU for each baby
          for (const baby of babies) {
            const { data: babyNicu } = await db.nicuObservations.getByBabyPatientId(baby.id);
            if (babyNicu && babyNicu.length > 0) {
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

      // For newborn patients, fetch their own NICU observations
      if (patientData?.patient_type === 'newborn') {
        const { data: babyNicu } = await db.nicuObservations.getByBabyPatientId(admission.patient_id);
        if (babyNicu && babyNicu.length > 0) {
          const relevantNicu = babyNicu.filter((obs: any) => {
            const obsDate = new Date(obs.observation_date || obs.created_at);
            return obsDate >= admissionDate;
          });
          // Avoid duplicates
          const existingIds = new Set(allNicuItems.map(item => item.id));
          const newItems = relevantNicu.filter((obs: any) => !existingIds.has(obs.id));
          allNicuItems = [...allNicuItems, ...newItems];
          nicuTotal += newItems.reduce((sum: number, obs: any) => sum + (obs.total_charge || 0), 0);
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

    // Calculate total paid and balance
    const totalPaid = selectedAdmission.deposit + additionalPayment;
    const balanceDue = finalTotal - totalPaid;

    setDischargeData(prev => ({
      ...prev,
      total_days: totalDays,
      room_charges: roomCharges,
      total_charges: finalTotal,
      amount_paid: totalPaid,
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
      // Get subtotal for discount calculation
      const subtotal =
        dischargeData.room_charges +
        labCharges.total +
        treatmentCharges.total +
        nicuCharges.total +
        dischargeData.medical_charges +
        dischargeData.medicine_charges +
        dischargeData.other_charges;

      const { discountAmount } = calculateDiscount(subtotal);

      // Generate discharge number
      let dischargeNumber = `DSC-${Date.now().toString().slice(-6)}`;
      try {
        const { data: nextNum } = await db.discharges.getNextDischargeNumber();
        if (nextNum) {
          dischargeNumber = `DSC-${nextNum}`;
        }
      } catch (e) {
        // Use fallback number
      }

      // Create discharge record
      const dischargeRecord = {
        admission_id: selectedAdmission.id,
        patient_id: patient.id,
        doctor_id: doctor.id,
        discharge_date: dischargeData.discharge_date,
        discharge_number: dischargeNumber,
        final_diagnosis: dischargeData.final_diagnosis,
        treatment_summary: dischargeData.treatment_summary,
        condition_at_discharge: dischargeData.condition_at_discharge,
        medications: dischargeData.medications,
        follow_up_instructions: dischargeData.follow_up_instructions,
        follow_up_date: dischargeData.follow_up_date || null,
        discharge_notes: dischargeData.discharge_notes,
        admission_date: selectedAdmission.admission_date,
        total_days: dischargeData.total_days,
        room_number: room.room_number,
        room_type: room.type,
        room_charges: dischargeData.room_charges,
        treatment_charges: treatmentCharges.total,
        lab_charges: labCharges.total,
        nicu_charges: nicuCharges.total,
        medical_charges: dischargeData.medical_charges,
        medicine_charges: dischargeData.medicine_charges,
        other_charges: dischargeData.other_charges,
        discount_type: discountType,
        discount_value: discountValue,
        discount_amount: discountAmount,
        subtotal: subtotal,
        total_charges: dischargeData.total_charges,
        deposit_amount: selectedAdmission.deposit,
        additional_payment: additionalPayment,
        amount_paid: dischargeData.amount_paid,
        balance_due: dischargeData.balance_due > 0 ? dischargeData.balance_due : 0,
        refund_amount: dischargeData.balance_due < 0 ? Math.abs(dischargeData.balance_due) : 0,
        payment_status: dischargeData.balance_due <= 0 ? 'paid' : (additionalPayment > 0 ? 'partial' : 'pending'),
        payment_method: paymentMethod,
        is_newborn_discharge: patient.patient_type === 'newborn',
        mother_patient_id: patient.mother_patient_id || null
      };

      // Try to save discharge record (table may not exist yet)
      let savedDischarge: any = null;
      try {
        const { data, error: dischargeError } = await db.discharges.create(dischargeRecord);
        if (!dischargeError) {
          savedDischarge = data;
        } else {
          console.warn('Discharge table may not exist yet, continuing without saving record:', dischargeError);
        }
      } catch (e) {
        console.warn('Discharge table may not exist yet, continuing without saving record:', e);
      }

      // Update admission status
      const { error: admissionError } = await db.admissions.update(selectedAdmission.id, {
        status: 'discharged',
        discharge_id: savedDischarge?.id || null,
        discharged_at: new Date().toISOString()
      });

      if (admissionError) {
        console.error('Error updating admission:', admissionError);
        toast.error('Failed to update admission status');
        setLoading(false);
        return;
      }

      // Update room occupancy (safely)
      if (room.current_occupancy && room.current_occupancy > 0) {
        await db.rooms.update(selectedAdmission.room_id, {
          current_occupancy: room.current_occupancy - 1
        });
      }

      toast.success('Patient discharged successfully!');

      // Print both documents
      printDischargeSummary();
      setTimeout(() => printBillingReceipt(), 500);

      // Reset state
      setSelectedAdmission(null);
      setPatient(null);
      setDoctor(null);
      setRoom(null);
      setAdditionalPayment(0);
      setDiscountType('percentage');
      setDiscountValue(0);
      fetchActiveAdmissions();
    } catch (error) {
      console.error('Error discharging patient:', error);
      toast.error('Failed to discharge patient');
    } finally {
      setLoading(false);
    }
  };

  // Print handlers
  const handlePrintSummary = useReactToPrint({
    contentRef: summaryRef,
    documentTitle: `Discharge-Summary-${patient?.name || 'Unknown'}`,
    onAfterPrint: () => {
      toast.success('Discharge summary printed');
      setShouldPrintSummary(false);
    }
  });

  const handlePrintReceipt = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Discharge-Receipt-${patient?.name || 'Unknown'}`,
    onAfterPrint: () => {
      toast.success('Billing receipt printed');
      setShouldPrintReceipt(false);
    }
  });

  const printDischargeSummary = () => {
    if (!patient || !doctor || !room || !selectedAdmission) {
      toast.error('Missing discharge details');
      return;
    }
    setShouldPrintSummary(true);
    setTimeout(() => handlePrintSummary(), 100);
  };

  const printBillingReceipt = () => {
    if (!patient || !doctor || !room || !selectedAdmission) {
      toast.error('Missing discharge details');
      return;
    }
    setShouldPrintReceipt(true);
    setTimeout(() => handlePrintReceipt(), 100);
  };

  // Reprint past discharge
  const handleReprintDischarge = async (discharge: DischargeRecord) => {
    try {
      const { data, error } = await db.discharges.getById(discharge.id);
      if (error || !data) {
        toast.error('Failed to load discharge details');
        return;
      }
      setSelectedPastDischarge(data);
      // Increment print count
      await db.discharges.incrementPrintCount(discharge.id);
      toast.info('Printing discharge documents...');
    } catch (error) {
      console.error('Error reprinting:', error);
      toast.error('Failed to reprint');
    }
  };

  // Calculate subtotal for display
  const getSubtotal = () => {
    return (
      dischargeData.room_charges +
      labCharges.total +
      treatmentCharges.total +
      nicuCharges.total +
      dischargeData.medical_charges +
      dischargeData.medicine_charges +
      dischargeData.other_charges
    );
  };

  // Filter past discharges
  const filteredDischarges = pastDischarges.filter(d => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      d.discharge_number?.toLowerCase().includes(query) ||
      d.patients?.name?.toLowerCase().includes(query) ||
      d.patients?.mr_number?.toLowerCase().includes(query)
    );
  });

  // Get billing receipt data
  const getBillingReceiptData = () => {
    if (!patient || !doctor || !room || !selectedAdmission) return null;

    const subtotal = getSubtotal();
    const { discountAmount } = calculateDiscount(subtotal);

    return {
      receiptNumber: `RCP-${Date.now().toString().slice(-6)}`,
      dischargeNumber: `DSC-${selectedAdmission.id.slice(-6).toUpperCase()}`,
      patientName: patient.name,
      mrNumber: patient.mr_number || 'N/A',
      age: patient.age,
      gender: patient.gender,
      contact: patient.contact,
      guardianName: patient.care_of,
      admissionDate: selectedAdmission.admission_date,
      dischargeDate: dischargeData.discharge_date,
      totalDays: dischargeData.total_days,
      roomNumber: room.room_number,
      roomType: room.type,
      doctorName: doctor.name,
      roomCharges: dischargeData.room_charges,
      treatmentCharges: treatmentCharges.total,
      labCharges: labCharges.total,
      nicuCharges: nicuCharges.total,
      medicalCharges: dischargeData.medical_charges,
      medicineCharges: dischargeData.medicine_charges,
      otherCharges: dischargeData.other_charges,
      discountType: discountType,
      discountValue: discountValue,
      discountAmount: discountAmount,
      subtotal: subtotal,
      totalCharges: dischargeData.total_charges,
      depositPaid: selectedAdmission.deposit,
      additionalPayment: additionalPayment,
      totalPaid: dischargeData.amount_paid,
      balanceDue: dischargeData.balance_due > 0 ? dischargeData.balance_due : 0,
      refundAmount: dischargeData.balance_due < 0 ? Math.abs(dischargeData.balance_due) : 0,
      paymentMethod: paymentMethod,
      paymentStatus: dischargeData.balance_due <= 0 ? 'Paid' : 'Pending',
      isNewborn: patient.patient_type === 'newborn',
      treatmentItems: treatmentCharges.items.map(t => ({
        description: t.treatment_name || t.treatment_type || 'Treatment',
        amount: t.price || 0
      })),
      labItems: labCharges.items.map(l => ({
        description: l.test_names || 'Lab Test',
        amount: l.total_cost || 0
      })),
      nicuItems: nicuCharges.items.map(n => ({
        description: `${n.babyName ? n.babyName + ' - ' : ''}${n.hours_charged || 0} hrs NICU`,
        amount: n.total_charge || 0
      }))
    };
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="discharge" className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                New Discharge
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Discharge History
              </TabsTrigger>
            </TabsList>

            {/* New Discharge Tab */}
            <TabsContent value="discharge" className="mt-4 space-y-4">
              <div className="space-y-4">
                <Label>Select Patient to Discharge</Label>
                <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                  {admissions.map((admission) => {
                    const admPatient = admissionPatients[admission.id];
                    const isNewborn = admPatient?.patient_type === 'newborn';
                    return (
                      <Card
                        key={admission.id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedAdmission?.id === admission.id ? 'border-blue-500 border-2 bg-blue-50' : ''
                        }`}
                        onClick={() => handleSelectAdmission(admission)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-lg">{admPatient?.name || 'Loading...'}</p>
                              {isNewborn && (
                                <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                                  <Baby className="h-3 w-3 mr-1" />
                                  Baby
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-blue-600">
                              MR#: {admPatient?.mr_number || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Admitted: {new Date(admission.admission_date).toLocaleDateString('en-GB')}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge>{admission.admission_type}</Badge>
                            <p className="text-sm text-green-600 mt-1">
                              Deposit: {formatCurrency(admission.deposit)}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                  {admissions.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No active admissions</p>
                  )}
                </div>
              </div>

              {selectedAdmission && patient && doctor && room && (
                <>
                  {/* Patient Details Card */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        Patient Details
                        {patient.patient_type === 'newborn' && (
                          <Badge className="bg-pink-500">
                            <Baby className="h-3 w-3 mr-1" />
                            Newborn
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Name:</strong> {patient.name}</p>
                          <p className="text-blue-600 font-semibold">
                            <strong>MR Number:</strong> {patient.mr_number || 'N/A'}
                          </p>
                          <p><strong>Age:</strong> {patient.age} years</p>
                          <p><strong>Gender:</strong> {patient.gender}</p>
                          {patient.care_of && <p><strong>Guardian:</strong> {patient.care_of}</p>}
                        </div>
                        <div>
                          <p><strong>Doctor:</strong> Dr. {doctor.name}</p>
                          <p><strong>Room:</strong> {room.room_number} ({room.type})</p>
                          <p><strong>Admitted:</strong> {new Date(selectedAdmission.admission_date).toLocaleDateString('en-GB')}</p>
                          <p><strong>Deposit:</strong> {formatCurrency(selectedAdmission.deposit)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Discharge Information */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Discharge Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
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
                          <Label htmlFor="condition">Condition at Discharge</Label>
                          <Select
                            value={dischargeData.condition_at_discharge}
                            onValueChange={(value) => setDischargeData({ ...dischargeData, condition_at_discharge: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {conditionOptions.map(option => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="finalDiagnosis">Final Diagnosis</Label>
                        <Textarea
                          id="finalDiagnosis"
                          value={dischargeData.final_diagnosis}
                          onChange={(e) => setDischargeData({ ...dischargeData, final_diagnosis: e.target.value })}
                          placeholder="Enter final diagnosis..."
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label htmlFor="treatmentSummary">Treatment Summary</Label>
                        <Textarea
                          id="treatmentSummary"
                          value={dischargeData.treatment_summary}
                          onChange={(e) => setDischargeData({ ...dischargeData, treatment_summary: e.target.value })}
                          placeholder="Enter treatment summary..."
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
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
                      </div>

                      <div>
                        <Label htmlFor="followUpDate">Follow-up Date (Optional)</Label>
                        <Input
                          id="followUpDate"
                          type="date"
                          value={dischargeData.follow_up_date}
                          onChange={(e) => setDischargeData({ ...dischargeData, follow_up_date: e.target.value })}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Billing Details */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <DollarSign className="h-5 w-5" />
                        Billing Details
                        {loadingCharges && <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Auto-fetched charges */}
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
                                      <span>{t.treatment_name || t.treatment_type || 'Treatment'}</span>
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

                      {/* Manual charges */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="medicalCharges">Medical Charges</Label>
                          <Input
                            id="medicalCharges"
                            type="number"
                            min="0"
                            value={dischargeData.medical_charges || ''}
                            onChange={(e) => setDischargeData({ ...dischargeData, medical_charges: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="medicineCharges">Medicine Charges</Label>
                          <Input
                            id="medicineCharges"
                            type="number"
                            min="0"
                            value={dischargeData.medicine_charges || ''}
                            onChange={(e) => setDischargeData({ ...dischargeData, medicine_charges: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="otherCharges">Other Charges</Label>
                          <Input
                            id="otherCharges"
                            type="number"
                            min="0"
                            value={dischargeData.other_charges || ''}
                            onChange={(e) => setDischargeData({ ...dischargeData, other_charges: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Discount Section */}
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <Label className="flex items-center gap-2 mb-3">
                          <Percent className="h-4 w-4 text-green-600" />
                          Discount / رعایت
                        </Label>
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <Label className="text-xs text-gray-600 mb-1 block">Type</Label>
                            <Select
                              value={discountType}
                              onValueChange={(value: 'percentage' | 'fixed') => setDiscountType(value)}
                            >
                              <SelectTrigger className="bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage (%)</SelectItem>
                                <SelectItem value="fixed">Fixed Amount (Rs.)</SelectItem>
                              </SelectContent>
                            </Select>
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
                      </div>

                      {/* Payment Section */}
                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <Label className="flex items-center gap-2 mb-3">
                          <DollarSign className="h-4 w-4 text-yellow-600" />
                          Payment at Discharge
                        </Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-gray-600 mb-1 block">Additional Payment</Label>
                            <Input
                              type="number"
                              min="0"
                              value={additionalPayment || ''}
                              onChange={(e) => setAdditionalPayment(Number(e.target.value) || 0)}
                              placeholder="Amount paying now"
                              className="bg-white"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600 mb-1 block">Payment Method</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                              <SelectTrigger className="bg-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {paymentMethods.map(method => (
                                  <SelectItem key={method.value} value={method.value}>
                                    <span className="flex items-center gap-2">
                                      <method.icon className="h-4 w-4" />
                                      {method.label}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Total Summary */}
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span>Total Days:</span>
                          <span className="font-medium">{dischargeData.total_days} day(s)</span>
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

                        {dischargeData.medical_charges > 0 && (
                          <div className="flex justify-between">
                            <span>Medical Charges:</span>
                            <span className="font-medium">{formatCurrency(dischargeData.medical_charges)}</span>
                          </div>
                        )}

                        {dischargeData.medicine_charges > 0 && (
                          <div className="flex justify-between">
                            <span>Medicine Charges:</span>
                            <span className="font-medium">{formatCurrency(dischargeData.medicine_charges)}</span>
                          </div>
                        )}

                        {dischargeData.other_charges > 0 && (
                          <div className="flex justify-between">
                            <span>Other Charges:</span>
                            <span className="font-medium">{formatCurrency(dischargeData.other_charges)}</span>
                          </div>
                        )}

                        <Separator />

                        {/* Subtotal */}
                        <div className="flex justify-between font-medium">
                          <span>Subtotal:</span>
                          <span className={discountValue > 0 ? 'line-through text-gray-400' : ''}>
                            {formatCurrency(getSubtotal())}
                          </span>
                        </div>

                        {/* Discount Display */}
                        {discountValue > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span className="flex items-center gap-2">
                              <Percent className="h-4 w-4" />
                              Discount ({discountType === 'percentage' ? `${discountValue}%` : 'Fixed'}):
                            </span>
                            <span className="font-medium">
                              -{formatCurrency(calculateDiscount(getSubtotal()).discountAmount)}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between text-lg font-bold">
                          <span>Total Charges:</span>
                          <span>{formatCurrency(dischargeData.total_charges)}</span>
                        </div>

                        <Separator />

                        <div className="flex justify-between text-blue-600">
                          <span>Advance Deposit:</span>
                          <span className="font-medium">{formatCurrency(selectedAdmission.deposit)}</span>
                        </div>

                        {additionalPayment > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Additional Payment:</span>
                            <span className="font-medium">{formatCurrency(additionalPayment)}</span>
                          </div>
                        )}

                        <div className="flex justify-between font-medium">
                          <span>Total Paid:</span>
                          <span className="text-green-600">{formatCurrency(dischargeData.amount_paid)}</span>
                        </div>

                        <Separator />

                        <div className={`flex justify-between text-lg font-bold ${
                          dischargeData.balance_due > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          <span>{dischargeData.balance_due > 0 ? 'Balance Due:' : dischargeData.balance_due < 0 ? 'Refund Amount:' : 'Fully Paid'}</span>
                          <span>{dischargeData.balance_due !== 0 ? formatCurrency(Math.abs(dischargeData.balance_due)) : '✓'}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button onClick={handleDischarge} className="flex-1" disabled={loading}>
                          <LogOut className="h-4 w-4 mr-2" />
                          {loading ? 'Discharging...' : 'Discharge Patient'}
                        </Button>
                        <Button onClick={printDischargeSummary} variant="outline">
                          <Printer className="h-4 w-4 mr-2" />
                          Summary
                        </Button>
                        <Button onClick={printBillingReceipt} variant="outline">
                          <Receipt className="h-4 w-4 mr-2" />
                          Receipt
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Discharge History Tab */}
            <TabsContent value="history" className="mt-4 space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by discharge number, patient name, or MR number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" onClick={loadPastDischarges}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loadingPast ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {loadingPast ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Loading discharge history...</p>
                </div>
              ) : filteredDischarges.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No discharge records found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDischarges.map((discharge) => (
                    <Card key={discharge.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-blue-600">{discharge.discharge_number}</span>
                            <Badge variant={discharge.payment_status === 'paid' ? 'default' : 'destructive'}>
                              {discharge.payment_status}
                            </Badge>
                          </div>
                          <p className="font-medium text-lg mt-1">{discharge.patients?.name}</p>
                          <p className="text-sm text-gray-600">
                            MR#: {discharge.patients?.mr_number} |
                            Discharged: {new Date(discharge.discharge_date).toLocaleDateString('en-GB')}
                          </p>
                          <p className="text-sm text-gray-500">
                            Condition: {discharge.condition_at_discharge} |
                            Total: {formatCurrency(discharge.total_charges)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReprintDischarge(discharge)}
                          >
                            <Printer className="h-4 w-4 mr-1" />
                            Reprint
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Hidden Discharge Summary Template for Printing */}
      {shouldPrintSummary && patient && doctor && room && selectedAdmission && (
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
              conditionAtDischarge: dischargeData.condition_at_discharge,
              medications: dischargeData.medications,
              advice: dischargeData.follow_up_instructions,
              followUpDate: dischargeData.follow_up_date
            }}
          />
        </div>
      )}

      {/* Hidden Billing Receipt Template for Printing */}
      {shouldPrintReceipt && patient && doctor && room && selectedAdmission && getBillingReceiptData() && (
        <div style={{ display: 'none' }}>
          <DischargeBillingReceipt
            ref={receiptRef}
            data={getBillingReceiptData()!}
          />
        </div>
      )}
    </div>
  );
}
