import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Plus, UserPlus, Edit, Trash2, X, Printer, CreditCard, FileText, ClipboardList } from 'lucide-react';
import { Patient, validateCNIC, formatCNIC, generateMRNumber } from '@/lib/hospitalData';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';

// Import patient file form templates
import FileCoverSheet from '@/components/documents/patientForms/FileCoverSheet';
import VisitNotesTemplate from '@/components/documents/patientForms/VisitNotesTemplate';
import VitalsChartTemplate from '@/components/documents/patientForms/VitalsChartTemplate';
import DiagnosisRecordTemplate from '@/components/documents/patientForms/DiagnosisRecordTemplate';
import MedicationChartTemplate from '@/components/documents/patientForms/MedicationChartTemplate';
import AllergiesConditionsTemplate from '@/components/documents/patientForms/AllergiesConditionsTemplate';
import PrescriptionPadTemplate from '@/components/documents/patientForms/PrescriptionPadTemplate';
import FollowupChecklistTemplate from '@/components/documents/patientForms/FollowupChecklistTemplate';

interface PatientRegistrationProps {
  onPatientSelect: (patient: Patient) => void;
  onNewPatient: (patient: Patient) => void;
}

export default function PatientRegistration({ onPatientSelect, onNewPatient }: PatientRegistrationProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newlyRegisteredPatient, setNewlyRegisteredPatient] = useState<Patient | null>(null);
  const [newPatient, setNewPatient] = useState<Partial<Patient>>({
    name: '',
    age: 0,
    cnicNumber: '',
    gender: 'Male',
    contact: '',
    careOf: '',
    problem: '',
    department: 'General Medicine',
    emergencyContact: '',
    address: '',
    bloodGroup: '',
    maritalStatus: 'Single'
  });

  // Refs for patient file forms printing
  const [showPrintForms, setShowPrintForms] = useState(false);
  const coverSheetRef = useRef<HTMLDivElement>(null);
  const visitNotesRef = useRef<HTMLDivElement>(null);
  const vitalsChartRef = useRef<HTMLDivElement>(null);
  const diagnosisRecordRef = useRef<HTMLDivElement>(null);
  const medicationChartRef = useRef<HTMLDivElement>(null);
  const allergiesConditionsRef = useRef<HTMLDivElement>(null);
  const prescriptionPadRef = useRef<HTMLDivElement>(null);
  const followupChecklistRef = useRef<HTMLDivElement>(null);

  const departments = [
    'General Medicine',
    'Pediatrics',
    'Orthopedics',
    'Gynecology',
    'Cardiology',
    'Dermatology',
    'ENT',
    'Neurology',
    'Emergency'
  ];

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await db.patients.getAll();
      
      if (error) {
        console.error('Error loading patients:', error);
        toast.error('Failed to load patients');
        return;
      }

      const patientsData = data?.map((p: any) => ({
        id: p.id,
        mrNumber: p.mr_number,
        name: p.name,
        age: p.age,
        dateOfBirth: p.date_of_birth,
        cnicNumber: p.cnic_number,
        gender: p.gender,
        contact: p.contact,
        careOf: p.care_of,
        problem: p.problem,
        department: p.department,
        registrationDate: p.registration_date,
        medicalHistory: p.medical_history,
        emergencyContact: p.emergency_contact,
        address: p.address,
        bloodGroup: p.blood_group,
        maritalStatus: p.marital_status
      })) || [];

      setPatients(patientsData);
    } catch (error) {
      console.error('Failed to load patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (patient: Patient, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setEditingPatient(patient);
    setNewPatient({
      name: patient.name,
      age: patient.age,
      cnicNumber: patient.cnicNumber,
      gender: patient.gender,
      contact: patient.contact,
      careOf: patient.careOf,
      problem: patient.problem,
      department: patient.department,
      emergencyContact: patient.emergencyContact,
      address: patient.address,
      bloodGroup: patient.bloodGroup,
      maritalStatus: patient.maritalStatus
    });
    setShowRegisterForm(true);
  };

  const handleDelete = async (patientId: string, patientName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (!confirm(`Are you sure you want to delete ${patientName}?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await db.patients.delete(patientId);
      
      if (error) {
        console.error('Error deleting patient:', error);
        toast.error('Failed to delete patient');
        return;
      }

      setPatients(patients.filter(p => p.id !== patientId));
      toast.success(`${patientName} deleted successfully!`);
    } catch (error) {
      console.error('Failed to delete patient:', error);
      toast.error('Failed to delete patient');
    }
  };

  const handleRegisterOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate only essential fields
    if (!newPatient.name?.trim()) {
      toast.error('Patient name is required');
      return;
    }

    if (!newPatient.contact?.trim()) {
      toast.error('Contact number is required');
      return;
    }

    if (newPatient.cnicNumber && !validateCNIC(newPatient.cnicNumber)) {
      toast.error('Invalid CNIC format. Use: 12345-6789012-3');
      return;
    }

    const patientData = {
  name: newPatient.name,
  age: newPatient.age,
  cnic_number: newPatient.cnicNumber ? formatCNIC(newPatient.cnicNumber) : null,
  gender: newPatient.gender,
  contact: newPatient.contact,
  care_of: newPatient.careOf || null,
  problem: newPatient.problem || null,
  department: newPatient.department || null,
  emergency_contact: newPatient.emergencyContact || null,
  address: newPatient.address || null,
  blood_group: newPatient.bloodGroup || null,
  marital_status: newPatient.maritalStatus || null,
};

    try {
      if (editingPatient) {
        // UPDATE existing patient
        const { data, error } = await db.patients.update(editingPatient.id, patientData);
        
        if (error) {
          console.error('Error updating patient:', error);
          toast.error('Failed to update patient');
          return;
        }

        const updatedPatient: Patient = {
          id: data.id,
          mrNumber: data.mr_number,
          name: data.name,
          age: data.age,
          dateOfBirth: data.date_of_birth,
          cnicNumber: data.cnic_number,
          gender: data.gender,
          contact: data.contact,
          careOf: data.care_of,
          problem: data.problem,
          department: data.department,
          registrationDate: data.registration_date,
          medicalHistory: data.medical_history,
          emergencyContact: data.emergency_contact,
          address: data.address,
          bloodGroup: data.blood_group,
          maritalStatus: data.marital_status
        };

        setPatients(patients.map(p => p.id === editingPatient.id ? updatedPatient : p));
        toast.success('Patient updated successfully!');
        setEditingPatient(null);
      } else {
        // CREATE new patient with auto-generated MR number
        const dataWithDate = {
          ...patientData,
          mr_number: generateMRNumber(),
          registration_date: new Date().toISOString().split('T')[0]
        };

        const { data, error } = await db.patients.create(dataWithDate);
        
        if (error) {
          console.error('Error creating patient:', error);
          toast.error('Failed to register patient');
          return;
        }

        const createdPatient: Patient = {
          id: data.id,
          mrNumber: data.mr_number,
          name: data.name,
          age: data.age,
          dateOfBirth: data.date_of_birth,
          cnicNumber: data.cnic_number,
          gender: data.gender,
          contact: data.contact,
          careOf: data.care_of,
          problem: data.problem,
          department: data.department,
          registrationDate: data.registration_date,
          medicalHistory: data.medical_history,
          emergencyContact: data.emergency_contact,
          address: data.address,
          bloodGroup: data.blood_group,
          maritalStatus: data.marital_status
        };

        setPatients([createdPatient, ...patients]);
        toast.success(`Patient registered successfully! MR#: ${createdPatient.mrNumber}`);
        setNewlyRegisteredPatient(createdPatient);
        onNewPatient(createdPatient);
      }
      
      // Reset form
      setNewPatient({
        name: '',
        age: 0,
        cnicNumber: '',
        gender: 'Male',
        contact: '',
        careOf: '',
        problem: '',
        department: 'General Medicine',
        emergencyContact: '',
        address: '',
        bloodGroup: '',
        maritalStatus: 'Single'
      });
      setShowRegisterForm(false);
    } catch (error) {
      console.error('Failed to save patient:', error);
      toast.error('Failed to save patient');
    }
  };

  const handleSearchPatients = async () => {
    if (!searchQuery.trim()) {
      loadPatients();
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await db.patients.search(searchQuery);
      
      if (error) {
        console.error('Error searching patients:', error);
        toast.error('Search failed');
        return;
      }

      const patientsData = data?.map((p: any) => ({
        id: p.id,
        mrNumber: p.mr_number,
        name: p.name,
        age: p.age,
        dateOfBirth: p.date_of_birth,
        cnicNumber: p.cnic_number,
        gender: p.gender,
        contact: p.contact,
        careOf: p.care_of,
        problem: p.problem,
        department: p.department,
        registrationDate: p.registration_date,
        medicalHistory: p.medical_history,
        emergencyContact: p.emergency_contact,
        address: p.address,
        bloodGroup: p.blood_group,
        maritalStatus: p.marital_status
      })) || [];

      setPatients(patientsData);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Print MR Card function
  const printMRCard = (patient: Patient) => {
    const cardContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>MR Card - ${patient.mrNumber}</title>
        <style>
          @page { size: 85mm 54mm; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Tahoma', 'Arial', sans-serif;
            background: #fff;
          }
          .card {
            width: 85mm;
            height: 54mm;
            padding: 4mm;
            border: 2px solid #1a5f2a;
            border-radius: 3mm;
            background: linear-gradient(135deg, #f0f9f0 0%, #ffffff 100%);
          }
          .header {
            display: flex;
            align-items: center;
            gap: 3mm;
            border-bottom: 1px solid #1a5f2a;
            padding-bottom: 2mm;
            margin-bottom: 2mm;
          }
          .logo {
            width: 12mm;
            height: 12mm;
            object-fit: contain;
          }
          .hospital-name {
            font-size: 10pt;
            font-weight: bold;
            color: #1a5f2a;
          }
          .hospital-name-urdu {
            font-size: 9pt;
            color: #1a5f2a;
            direction: rtl;
          }
          .mr-number {
            background: #1a5f2a;
            color: white;
            padding: 2mm 4mm;
            font-size: 14pt;
            font-weight: bold;
            text-align: center;
            border-radius: 2mm;
            margin: 2mm 0;
            font-family: 'Courier New', monospace;
          }
          .patient-info {
            font-size: 8pt;
            line-height: 1.4;
          }
          .patient-name {
            font-size: 10pt;
            font-weight: bold;
            margin-bottom: 1mm;
          }
          .info-row {
            display: flex;
            gap: 3mm;
          }
          .label {
            color: #666;
            min-width: 15mm;
          }
          .footer {
            font-size: 6pt;
            color: #888;
            text-align: center;
            margin-top: 2mm;
            border-top: 1px dashed #ccc;
            padding-top: 1mm;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <img src="/logo.png" class="logo" onerror="this.style.display='none'" />
            <div>
              <div class="hospital-name">NORTH KARACHI HOSPITAL</div>
              <div class="hospital-name-urdu">نارتھ کراچی ہسپتال</div>
            </div>
          </div>

          <div class="mr-number">${patient.mrNumber}</div>

          <div class="patient-info">
            <div class="patient-name">${patient.name}</div>
            <div class="info-row">
              <span class="label">Age/Gender:</span>
              <span>${patient.age} years / ${patient.gender}</span>
            </div>
            <div class="info-row">
              <span class="label">Contact:</span>
              <span>${patient.contact}</span>
            </div>
            ${patient.bloodGroup ? `
            <div class="info-row">
              <span class="label">Blood:</span>
              <span>${patient.bloodGroup}</span>
            </div>
            ` : ''}
          </div>

          <div class="footer">
            Keep this card safe. Present at every visit. | یہ کارڈ محفوظ رکھیں
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(cardContent);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    }
  };

  // Print handler functions for patient file forms
  const handlePrintForm = useReactToPrint({
    contentRef: coverSheetRef,
    documentTitle: 'Patient-File-Cover-Sheet',
    onAfterPrint: () => toast.success('File Cover Sheet printed successfully'),
  });

  const handlePrintVisitNotes = useReactToPrint({
    contentRef: visitNotesRef,
    documentTitle: 'Visit-Notes-Template',
    onAfterPrint: () => toast.success('Visit Notes printed successfully'),
  });

  const handlePrintVitalsChart = useReactToPrint({
    contentRef: vitalsChartRef,
    documentTitle: 'Vitals-Chart-Template',
    onAfterPrint: () => toast.success('Vitals Chart printed successfully'),
  });

  const handlePrintDiagnosisRecord = useReactToPrint({
    contentRef: diagnosisRecordRef,
    documentTitle: 'Diagnosis-Record-Template',
    onAfterPrint: () => toast.success('Diagnosis Record printed successfully'),
  });

  const handlePrintMedicationChart = useReactToPrint({
    contentRef: medicationChartRef,
    documentTitle: 'Medication-Chart-Template',
    onAfterPrint: () => toast.success('Medication Chart printed successfully'),
  });

  const handlePrintAllergiesConditions = useReactToPrint({
    contentRef: allergiesConditionsRef,
    documentTitle: 'Allergies-Conditions-Template',
    onAfterPrint: () => toast.success('Allergies & Conditions printed successfully'),
  });

  const handlePrintPrescriptionPad = useReactToPrint({
    contentRef: prescriptionPadRef,
    documentTitle: 'Prescription-Pad-Template',
    onAfterPrint: () => toast.success('Prescription Pad printed successfully'),
  });

  const handlePrintFollowupChecklist = useReactToPrint({
    contentRef: followupChecklistRef,
    documentTitle: 'Followup-Checklist-Template',
    onAfterPrint: () => toast.success('Follow-up Checklist printed successfully'),
  });

  // Print all forms at once
  const handlePrintAllForms = () => {
    toast.info('Printing all patient file forms...');
    setTimeout(() => handlePrintForm(), 100);
    setTimeout(() => handlePrintAllergiesConditions(), 1000);
    setTimeout(() => handlePrintVisitNotes(), 2000);
    setTimeout(() => handlePrintVitalsChart(), 3000);
    setTimeout(() => handlePrintDiagnosisRecord(), 4000);
    setTimeout(() => handlePrintMedicationChart(), 5000);
    setTimeout(() => handlePrintPrescriptionPad(), 6000);
    setTimeout(() => handlePrintFollowupChecklist(), 7000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Patient Registration
            </div>
            <Button onClick={() => {
              setShowRegisterForm(!showRegisterForm);
              setEditingPatient(null);
              setNewPatient({
                name: '',
                age: 0,
                dateOfBirth: '',
                cnicNumber: '',
                gender: 'Male',
                contact: '',
                problem: '',
                department: 'General Medicine',
                emergencyContact: '',
                address: '',
                bloodGroup: '',
                maritalStatus: 'Single'
              });
            }}>
              <UserPlus className="h-4 w-4 mr-2" />
              Register New Patient
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Success Card - Shows after new patient registration */}
          {newlyRegisteredPatient && (
            <div className="mb-6 p-4 border-2 border-green-500 rounded-lg bg-green-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-green-500 text-white p-2 rounded-full">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-green-700">Patient Registered Successfully!</h3>
                    <p className="text-sm text-green-600">MR Card is ready to print</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNewlyRegisteredPatient(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="bg-white p-4 rounded-lg border border-green-200 mb-3">
                <div className="flex items-center gap-4">
                  <div className="bg-green-700 text-white px-4 py-2 rounded font-mono font-bold text-lg">
                    {newlyRegisteredPatient.mrNumber}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{newlyRegisteredPatient.name}</p>
                    <p className="text-sm text-gray-600">
                      {newlyRegisteredPatient.age} years • {newlyRegisteredPatient.gender} • {newlyRegisteredPatient.contact}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => printMRCard(newlyRegisteredPatient)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Print MR Card
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    onPatientSelect(newlyRegisteredPatient);
                    setNewlyRegisteredPatient(null);
                  }}
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  Continue to OPD
                </Button>
              </div>

              <p className="text-xs text-green-600 mt-2">
                Give this MR card to the patient. They will use it for all future visits.
              </p>

              {/* Patient File Forms Section */}
              <div className="mt-4 pt-4 border-t border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-teal-600" />
                    <h4 className="font-semibold text-teal-700">Patient File Forms (Manual Documentation)</h4>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPrintForms(!showPrintForms)}
                  >
                    {showPrintForms ? 'Hide Forms' : 'Show Forms'}
                  </Button>
                </div>

                {showPrintForms && (
                  <div className="bg-white p-4 rounded-lg border border-teal-200">
                    <p className="text-xs text-gray-600 mb-3">
                      Print blank forms for manual clinical documentation in the physical patient file.
                    </p>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePrintForm}
                        className="text-teal-600 border-teal-600 hover:bg-teal-50"
                      >
                        <Printer className="h-3 w-3 mr-2" />
                        File Cover Sheet
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePrintAllergiesConditions}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <Printer className="h-3 w-3 mr-2" />
                        Allergies & Conditions
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePrintVisitNotes}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        <Printer className="h-3 w-3 mr-2" />
                        Visit Notes
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePrintVitalsChart}
                        className="text-purple-600 border-purple-600 hover:bg-purple-50"
                      >
                        <Printer className="h-3 w-3 mr-2" />
                        Vitals Chart
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePrintDiagnosisRecord}
                        className="text-orange-600 border-orange-600 hover:bg-orange-50"
                      >
                        <Printer className="h-3 w-3 mr-2" />
                        Diagnosis Record
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePrintMedicationChart}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <Printer className="h-3 w-3 mr-2" />
                        Medication Chart
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePrintPrescriptionPad}
                        className="text-indigo-600 border-indigo-600 hover:bg-indigo-50"
                      >
                        <Printer className="h-3 w-3 mr-2" />
                        Prescription Pad
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePrintFollowupChecklist}
                        className="text-pink-600 border-pink-600 hover:bg-pink-50"
                      >
                        <Printer className="h-3 w-3 mr-2" />
                        Follow-up Checklist
                      </Button>
                    </div>

                    <Button
                      onClick={handlePrintAllForms}
                      className="w-full bg-teal-600 hover:bg-teal-700"
                    >
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Print All Forms (Complete File Set)
                    </Button>

                    <p className="text-xs text-teal-600 mt-2">
                      Print all forms and assemble in a physical file folder with digital receipts stapled as they are generated during visits.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {showRegisterForm && (
            <form onSubmit={handleRegisterOrUpdate} className="space-y-4 mb-6 p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">
                  {editingPatient ? 'Edit Patient' : 'New Patient Registration'}
                </h3>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setShowRegisterForm(false);
                    setEditingPatient(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patientName">Full Name *</Label>
                  <Input
                    id="patientName"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min="0"
                    max="150"
                    value={newPatient.age || ''}
                    onChange={(e) => setNewPatient({ ...newPatient, age: parseInt(e.target.value) || 0 })}
                    placeholder="e.g., 25"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cnicNumber">CNIC Number</Label>
                  <Input
                    id="cnicNumber"
                    value={newPatient.cnicNumber}
                    onChange={(e) => setNewPatient({ ...newPatient, cnicNumber: e.target.value })}
                    placeholder="12345-6789012-3"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={newPatient.gender} onValueChange={(value) => setNewPatient({ ...newPatient, gender: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact">Contact Number *</Label>
                  <Input
                    id="contact"
                    value={newPatient.contact}
                    onChange={(e) => setNewPatient({ ...newPatient, contact: e.target.value })}
                    placeholder="0300-1234567"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    value={newPatient.emergencyContact}
                    onChange={(e) => setNewPatient({ ...newPatient, emergencyContact: e.target.value })}
                    placeholder="0300-7654321"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="careOf">Care Of (Guardian/Relative)</Label>
                  <Input
                    id="careOf"
                    value={newPatient.careOf}
                    onChange={(e) => setNewPatient({ ...newPatient, careOf: e.target.value })}
                    placeholder="e.g., Father, Husband, Mother"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  <Select value={newPatient.bloodGroup} onValueChange={(value) => setNewPatient({ ...newPatient, bloodGroup: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      {bloodGroups.map((group) => (
                        <SelectItem key={group} value={group}>{group}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="maritalStatus">Marital Status</Label>
                  <Select value={newPatient.maritalStatus} onValueChange={(value) => setNewPatient({ ...newPatient, maritalStatus: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Married">Married</SelectItem>
                      <SelectItem value="Divorced">Divorced</SelectItem>
                      <SelectItem value="Widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select value={newPatient.department} onValueChange={(value) => setNewPatient({ ...newPatient, department: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="problem">Chief Complaint</Label>
                  <Input
                    id="problem"
                    value={newPatient.problem}
                    onChange={(e) => setNewPatient({ ...newPatient, problem: e.target.value })}
                    placeholder="e.g., Fever, Headache"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={newPatient.address}
                  onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                  placeholder="Full address"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingPatient ? 'Update Patient' : 'Register Patient'}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowRegisterForm(false);
                  setEditingPatient(null);
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search by MR number, name, contact, or CNIC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchPatients()}
            />
            <Button onClick={handleSearchPatients}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button variant="outline" onClick={loadPatients}>
              <Plus className="h-4 w-4 mr-2" />
              Show All
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading patients...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {patients.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No patients found</p>
                  <p className="text-sm mt-2">Register a new patient to get started</p>
                </div>
              ) : (
                patients.map((patient) => (
                  <Card key={patient.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => onPatientSelect(patient)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {patient.mrNumber && (
                            <Badge variant="outline" className="text-blue-700 border-blue-700 font-mono">
                              {patient.mrNumber}
                            </Badge>
                          )}
                          <h3 className="font-semibold text-lg">{patient.name}</h3>
                          <Badge>{patient.department}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                          <p><strong>Age:</strong> {patient.age} years • {patient.gender}</p>
                          <p><strong>Contact:</strong> {patient.contact}</p>
                          {patient.careOf && (
                            <p><strong>Care Of:</strong> {patient.careOf}</p>
                          )}
                          {patient.cnicNumber && (
                            <p><strong>CNIC:</strong> {patient.cnicNumber}</p>
                          )}
                          {patient.bloodGroup && (
                            <p><strong>Blood Group:</strong> {patient.bloodGroup}</p>
                          )}
                          {patient.emergencyContact && (
                            <p><strong>Emergency:</strong> {patient.emergencyContact}</p>
                          )}
                          <p><strong>Problem:</strong> {patient.problem}</p>
                        </div>
                        {patient.address && (
                          <p className="text-xs text-gray-500 mt-2">
                            <strong>Address:</strong> {patient.address}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            printMRCard(patient);
                          }}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          Print MR Card
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleEdit(patient, e)}
                            className="hover:bg-blue-50"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleDelete(patient.id, patient.name, e)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden components for printing patient file forms */}
      {newlyRegisteredPatient && (
        <div style={{ display: 'none' }}>
          <FileCoverSheet
            ref={coverSheetRef}
            patientData={{
              mr_number: newlyRegisteredPatient.mrNumber!,
              name: newlyRegisteredPatient.name,
              age: newlyRegisteredPatient.age,
              gender: newlyRegisteredPatient.gender,
              contact: newlyRegisteredPatient.contact,
              cnic_number: newlyRegisteredPatient.cnicNumber,
              blood_group: newlyRegisteredPatient.bloodGroup,
              address: newlyRegisteredPatient.address,
              emergency_contact: newlyRegisteredPatient.emergencyContact,
              created_at: newlyRegisteredPatient.registrationDate!
            }}
          />
          <VisitNotesTemplate
            ref={visitNotesRef}
            patientData={{
              mr_number: newlyRegisteredPatient.mrNumber!,
              name: newlyRegisteredPatient.name
            }}
          />
          <VitalsChartTemplate
            ref={vitalsChartRef}
            patientData={{
              mr_number: newlyRegisteredPatient.mrNumber!,
              name: newlyRegisteredPatient.name
            }}
          />
          <DiagnosisRecordTemplate
            ref={diagnosisRecordRef}
            patientData={{
              mr_number: newlyRegisteredPatient.mrNumber!,
              name: newlyRegisteredPatient.name
            }}
          />
          <MedicationChartTemplate
            ref={medicationChartRef}
            patientData={{
              mr_number: newlyRegisteredPatient.mrNumber!,
              name: newlyRegisteredPatient.name
            }}
          />
          <AllergiesConditionsTemplate
            ref={allergiesConditionsRef}
            patientData={{
              mr_number: newlyRegisteredPatient.mrNumber!,
              name: newlyRegisteredPatient.name,
              blood_group: newlyRegisteredPatient.bloodGroup
            }}
          />
          <PrescriptionPadTemplate
            ref={prescriptionPadRef}
            patientData={{
              mr_number: newlyRegisteredPatient.mrNumber!,
              name: newlyRegisteredPatient.name,
              age: newlyRegisteredPatient.age,
              gender: newlyRegisteredPatient.gender
            }}
          />
          <FollowupChecklistTemplate
            ref={followupChecklistRef}
            patientData={{
              mr_number: newlyRegisteredPatient.mrNumber!,
              name: newlyRegisteredPatient.name
            }}
          />
        </div>
      )}
    </div>
  );
}
