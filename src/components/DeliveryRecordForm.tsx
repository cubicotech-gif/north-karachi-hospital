import React, { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { db } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Baby, Printer, Plus, UserPlus, Building2, AlertCircle } from 'lucide-react';
import BirthCertificateTemplate from './documents/BirthCertificateTemplate';

interface Patient {
  id: string;
  mr_number: string;
  name: string;
  age?: number;
  gender: string;
  contact?: string;
  address?: string;
  care_of?: string;
}

interface Doctor {
  id: string;
  name: string;
  specialization?: string;
}

interface Admission {
  id: string;
  patient_id: string;
  doctor_id?: string;
  admission_date: string;
  reason?: string;
}

interface BabyData {
  gender: 'Male' | 'Female';
  weightKg: string;
  weightGrams: string;
  apgarScore1Min: string;
  apgarScore5Min: string;
  condition: string;
  babyCry: string;
  notes: string;
}

interface DeliveryRecordFormProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  admission?: Admission;
  onSuccess: () => void;
}

const DeliveryRecordForm: React.FC<DeliveryRecordFormProps> = ({
  isOpen,
  onClose,
  patient,
  admission,
  onSuccess,
}) => {
  const birthCertificateRef = useRef<HTMLDivElement>(null);

  // Delivery details
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryTime, setDeliveryTime] = useState(
    new Date().toTimeString().slice(0, 5)
  );
  const [deliveryType, setDeliveryType] = useState<string>('Normal');
  const [deliveringDoctorId, setDeliveringDoctorId] = useState<string>('');
  const [complications, setComplications] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Multiple births support
  const [isMultipleBirth, setIsMultipleBirth] = useState(false);
  const [totalBabies, setTotalBabies] = useState(1);

  // Baby data array (for multiple births)
  const [babies, setBabies] = useState<BabyData[]>([
    {
      gender: 'Male',
      weightKg: '',
      weightGrams: '',
      apgarScore1Min: '',
      apgarScore5Min: '',
      condition: 'Healthy',
      babyCry: 'Immediate',
      notes: '',
    },
  ]);

  // UI state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdRecords, setCreatedRecords] = useState<any[]>([]);
  const [showBirthCertificate, setShowBirthCertificate] = useState(false);
  const [selectedBabyForCertificate, setSelectedBabyForCertificate] = useState<number>(0);
  const [birthCertificateData, setBirthCertificateData] = useState<any>(null);

  // Load doctors on mount
  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    const { data, error } = await db.doctors.getAll();
    if (!error && data) {
      setDoctors(data);
    }
  };

  // Handle multiple births toggle
  useEffect(() => {
    if (isMultipleBirth) {
      // Ensure we have at least 2 babies for multiple birth
      if (babies.length < 2) {
        setBabies([
          ...babies,
          {
            gender: 'Male',
            weightKg: '',
            weightGrams: '',
            apgarScore1Min: '',
            apgarScore5Min: '',
            condition: 'Healthy',
            babyCry: 'Immediate',
            notes: '',
          },
        ]);
        setTotalBabies(2);
      }
    } else {
      // Single birth - keep only first baby
      setBabies([babies[0]]);
      setTotalBabies(1);
    }
  }, [isMultipleBirth]);

  // Add another baby (for triplets, etc.)
  const addBaby = () => {
    setBabies([
      ...babies,
      {
        gender: 'Male',
        weightKg: '',
        weightGrams: '',
        apgarScore1Min: '',
        apgarScore5Min: '',
        condition: 'Healthy',
        babyCry: 'Immediate',
        notes: '',
      },
    ]);
    setTotalBabies(totalBabies + 1);
  };

  // Remove a baby
  const removeBaby = (index: number) => {
    if (babies.length > 1) {
      const newBabies = babies.filter((_, i) => i !== index);
      setBabies(newBabies);
      setTotalBabies(newBabies.length);
    }
  };

  // Update baby data
  const updateBaby = (index: number, field: keyof BabyData, value: string) => {
    const newBabies = [...babies];
    newBabies[index] = { ...newBabies[index], [field]: value };
    setBabies(newBabies);
  };

  // Calculate weight in grams from kg
  const calculateWeightGrams = (kg: string): string => {
    const kgNum = parseFloat(kg);
    if (!isNaN(kgNum)) {
      return Math.round(kgNum * 1000).toString();
    }
    return '';
  };

  // Handle form submission
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    const records: any[] = [];

    try {
      for (let i = 0; i < babies.length; i++) {
        const baby = babies[i];

        // 1. Generate MR number for baby (bypass database trigger by providing mr_number)
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const babyMrNumber = `MR-${dateStr}-${randomNum}`;

        // 2. Create baby as new patient
        const babyName = `Baby of ${patient.name} ${babies.length > 1 ? `(${i + 1})` : ''}`.trim();
        const { data: babyPatient, error: babyError } = await db.patients.create({
          mr_number: babyMrNumber,
          name: babyName,
          age: 0,
          gender: baby.gender,
          contact: patient.contact,
          address: patient.address,
          care_of: patient.name,
          medical_history: `Born on ${deliveryDate} at ${deliveryTime}. Weight: ${baby.weightKg}kg (${baby.weightGrams}g). APGAR: ${baby.apgarScore1Min}/${baby.apgarScore5Min}. Condition: ${baby.condition}. Mother MR: ${patient.mr_number}`,
        });

        if (babyError) {
          throw new Error(`Failed to create baby patient record: ${babyError.message}`);
        }

        // 3. Generate birth certificate number
        const birthCertNumber = `${dateStr}-${randomNum}`;

        // 3. Create delivery record
        const { data: deliveryRecord, error: deliveryError } = await db.deliveryRecords.create({
          admission_id: admission?.id || null,
          mother_patient_id: patient.id,
          delivery_date: deliveryDate,
          delivery_time: deliveryTime,
          delivery_type: deliveryType,
          baby_gender: baby.gender,
          baby_weight_kg: parseFloat(baby.weightKg) || null,
          baby_weight_grams: parseInt(baby.weightGrams) || null,
          apgar_score_1min: parseInt(baby.apgarScore1Min) || null,
          apgar_score_5min: parseInt(baby.apgarScore5Min) || null,
          baby_condition: baby.condition,
          baby_cry: baby.babyCry,
          baby_patient_id: babyPatient?.id,
          birth_certificate_number: birthCertNumber,
          delivering_doctor_id: deliveringDoctorId || null,
          complications: complications || null,
          notes: baby.notes || deliveryNotes,
          multiple_birth: isMultipleBirth,
          birth_order: i + 1,
          total_babies: totalBabies,
        });

        if (deliveryError) {
          throw new Error(`Failed to create delivery record: ${deliveryError.message}`);
        }

        records.push({
          deliveryRecord,
          babyPatient,
          birthCertNumber,
        });
      }

      setCreatedRecords(records);
      onSuccess();

      // Show success and option to print birth certificates
      if (records.length === 1) {
        // Single birth - automatically show certificate
        prepareBirthCertificate(0, records);
        setShowBirthCertificate(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save delivery record');
    } finally {
      setLoading(false);
    }
  };

  // Prepare birth certificate data
  const prepareBirthCertificate = (babyIndex: number, records?: any[]) => {
    const recordsToUse = records || createdRecords;
    const record = recordsToUse[babyIndex];
    if (!record) return;

    const dateObj = new Date(deliveryDate);
    const certData = {
      serialNumber: record.birthCertNumber,
      date: new Date().toLocaleDateString('en-GB'),
      babyGender: babies[babyIndex].gender,
      weightKg: parseFloat(babies[babyIndex].weightKg) || 0,
      weightGrams: parseInt(babies[babyIndex].weightGrams) || 0,
      motherName: patient.name,
      fatherName: patient.care_of || '',
      address: patient.address || '',
      birthDay: dateObj.getDate().toString(),
      birthMonth: (dateObj.getMonth() + 1).toString(),
      birthYear: dateObj.getFullYear().toString(),
      birthTime: deliveryTime,
      attendingObstetrician: doctors.find(d => d.id === deliveringDoctorId)?.name || '',
    };

    setBirthCertificateData(certData);
    setSelectedBabyForCertificate(babyIndex);
  };

  // Print birth certificate
  const handlePrintBirthCertificate = useReactToPrint({
    contentRef: birthCertificateRef,
    documentTitle: `Birth_Certificate_${birthCertificateData?.serialNumber || ''}`,
  });

  // Print certificate for specific baby
  const printCertificateForBaby = (index: number) => {
    prepareBirthCertificate(index);
    setShowBirthCertificate(true);
  };

  const selectedDoctor = doctors.find(d => d.id === deliveringDoctorId);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Baby className="h-5 w-5 text-pink-500" />
              Record Delivery - {patient.name}
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {createdRecords.length > 0 ? (
            // Success view - show created records
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">
                  Delivery Recorded Successfully!
                </h3>
                <p className="text-sm text-green-700">
                  {createdRecords.length} baby record(s) created.
                </p>
              </div>

              <div className="space-y-3">
                {createdRecords.map((record, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>
                          Baby {createdRecords.length > 1 ? `#${index + 1}` : ''} - {babies[index]?.gender}
                        </span>
                        <Badge variant={babies[index]?.condition === 'Healthy' ? 'default' : 'destructive'}>
                          {babies[index]?.condition}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        MR: {record.babyPatient?.mr_number} | Birth Certificate: {record.birthCertNumber}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => printCertificateForBaby(index)}
                        >
                          <Printer className="h-4 w-4 mr-1" />
                          Print Birth Certificate
                        </Button>
                        {babies[index]?.condition !== 'Healthy' && (
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-orange-500 hover:bg-orange-600"
                          >
                            <Building2 className="h-4 w-4 mr-1" />
                            Admit to NICU
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <DialogFooter>
                <Button onClick={onClose}>Close</Button>
              </DialogFooter>
            </div>
          ) : (
            // Form view
            <div className="space-y-6">
              {/* Delivery Details Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Delivery Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Delivery Date</Label>
                      <Input
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Delivery Time</Label>
                      <Input
                        type="time"
                        value={deliveryTime}
                        onChange={(e) => setDeliveryTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Delivery Type</Label>
                      <Select value={deliveryType} onValueChange={setDeliveryType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Normal">Normal Delivery</SelectItem>
                          <SelectItem value="C-Section">C-Section</SelectItem>
                          <SelectItem value="Assisted">Assisted Delivery</SelectItem>
                          <SelectItem value="Vacuum">Vacuum Extraction</SelectItem>
                          <SelectItem value="Forceps">Forceps Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Attending Obstetrician</Label>
                      <Select value={deliveringDoctorId} onValueChange={setDeliveringDoctorId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              {doctor.name} {doctor.specialization && `(${doctor.specialization})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <Checkbox
                        id="multiple-birth"
                        checked={isMultipleBirth}
                        onCheckedChange={(checked) => setIsMultipleBirth(checked as boolean)}
                      />
                      <Label htmlFor="multiple-birth" className="cursor-pointer">
                        Multiple Birth (Twins/Triplets)
                      </Label>
                    </div>
                  </div>

                  <div>
                    <Label>Complications (if any)</Label>
                    <Textarea
                      value={complications}
                      onChange={(e) => setComplications(e.target.value)}
                      placeholder="Enter any complications during delivery..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Baby Details Section(s) */}
              {babies.map((baby, index) => (
                <Card key={index} className="border-pink-200">
                  <CardHeader className="pb-3 bg-pink-50 rounded-t-lg">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Baby className="h-4 w-4 text-pink-500" />
                        Baby {babies.length > 1 ? `#${index + 1}` : ''} Details
                      </span>
                      {babies.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => removeBaby(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <Label>Gender</Label>
                        <Select
                          value={baby.gender}
                          onValueChange={(val) => updateBaby(index, 'gender', val)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male (Boy)</SelectItem>
                            <SelectItem value="Female">Female (Girl)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Weight (Kg)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          value={baby.weightKg}
                          onChange={(e) => {
                            updateBaby(index, 'weightKg', e.target.value);
                            updateBaby(index, 'weightGrams', calculateWeightGrams(e.target.value));
                          }}
                          placeholder="e.g., 3.25"
                        />
                      </div>
                      <div>
                        <Label>Weight (Grams)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="10000"
                          value={baby.weightGrams}
                          onChange={(e) => updateBaby(index, 'weightGrams', e.target.value)}
                          placeholder="e.g., 3250"
                        />
                      </div>
                      <div>
                        <Label>Baby Cry</Label>
                        <Select
                          value={baby.babyCry}
                          onValueChange={(val) => updateBaby(index, 'babyCry', val)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Immediate">Immediate</SelectItem>
                            <SelectItem value="Delayed">Delayed</SelectItem>
                            <SelectItem value="Weak">Weak</SelectItem>
                            <SelectItem value="None">None (Resuscitation needed)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <Label>APGAR Score (1 min)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={baby.apgarScore1Min}
                          onChange={(e) => updateBaby(index, 'apgarScore1Min', e.target.value)}
                          placeholder="0-10"
                        />
                      </div>
                      <div>
                        <Label>APGAR Score (5 min)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={baby.apgarScore5Min}
                          onChange={(e) => updateBaby(index, 'apgarScore5Min', e.target.value)}
                          placeholder="0-10"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Baby Condition</Label>
                        <Select
                          value={baby.condition}
                          onValueChange={(val) => updateBaby(index, 'condition', val)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Healthy">Healthy</SelectItem>
                            <SelectItem value="Requires Observation">Requires Observation</SelectItem>
                            <SelectItem value="Requires NICU">Requires NICU</SelectItem>
                            <SelectItem value="Critical">Critical</SelectItem>
                            <SelectItem value="Stillborn">Stillborn</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {baby.condition !== 'Healthy' && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700">
                        <AlertCircle className="h-4 w-4 inline mr-2" />
                        Baby will be automatically registered for NICU admission after saving.
                      </div>
                    )}

                    <div>
                      <Label>Additional Notes</Label>
                      <Textarea
                        value={baby.notes}
                        onChange={(e) => updateBaby(index, 'notes', e.target.value)}
                        placeholder="Any additional notes about the baby..."
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add More Baby Button */}
              {isMultipleBirth && (
                <Button
                  variant="outline"
                  onClick={addBaby}
                  className="w-full border-dashed"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Baby
                </Button>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? (
                    'Saving...'
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Save Delivery Record
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Birth Certificate Print Dialog */}
      <Dialog open={showBirthCertificate} onOpenChange={setShowBirthCertificate}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Birth Certificate Preview</DialogTitle>
          </DialogHeader>

          {birthCertificateData && (
            <div className="border rounded-lg overflow-hidden">
              <BirthCertificateTemplate ref={birthCertificateRef} data={birthCertificateData} />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBirthCertificate(false)}>
              Close
            </Button>
            <Button onClick={() => handlePrintBirthCertificate()}>
              <Printer className="h-4 w-4 mr-2" />
              Print Certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DeliveryRecordForm;
