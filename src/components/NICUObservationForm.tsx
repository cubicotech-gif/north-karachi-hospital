import React, { useState, useEffect } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Clock, Thermometer, Heart, Wind, Droplets, Plus, StopCircle, AlertCircle } from 'lucide-react';

interface Patient {
  id: string;
  mr_number: string;
  name: string;
}

interface Doctor {
  id: string;
  name: string;
  specialization?: string;
}

interface Admission {
  id: string;
  patient_id: string;
}

interface NICUObservation {
  id: string;
  baby_patient_id: string;
  admission_id?: string;
  observation_date: string;
  start_time: string;
  end_time?: string;
  temperature?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  weight_grams?: number;
  feeding_type?: string;
  feeding_amount_ml?: number;
  care_provided?: string;
  medications?: string;
  procedures?: string;
  condition?: string;
  hours_charged?: number;
  hourly_rate?: number;
  total_charge?: number;
  payment_status?: string;
  notes?: string;
  doctors?: { name: string };
}

interface NICUObservationFormProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient; // Baby patient
  admission?: Admission;
  onSuccess: () => void;
}

const NICUObservationForm: React.FC<NICUObservationFormProps> = ({
  isOpen,
  onClose,
  patient,
  admission,
  onSuccess,
}) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [observations, setObservations] = useState<NICUObservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewObservation, setShowNewObservation] = useState(false);
  const [hourlyRate, setHourlyRate] = useState<number>(500); // Default NICU hourly rate

  // Form state for new observation
  const [formData, setFormData] = useState({
    temperature: '',
    heartRate: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    weightGrams: '',
    feedingType: 'Breast',
    feedingAmountMl: '',
    careProvided: '',
    medications: '',
    procedures: '',
    condition: 'Stable',
    doctorId: '',
    notes: '',
  });

  // Load data on mount
  useEffect(() => {
    if (isOpen) {
      loadDoctors();
      loadObservations();
      loadHourlyRate();
    }
  }, [isOpen, patient.id]);

  const loadDoctors = async () => {
    const { data, error } = await db.doctors.getAll();
    if (!error && data) {
      setDoctors(data);
    }
  };

  const loadObservations = async () => {
    const { data, error } = await db.nicuObservations.getByBabyPatientId(patient.id);
    if (!error && data) {
      setObservations(data);
    }
  };

  const loadHourlyRate = async () => {
    // Try to get NICU room's hourly rate
    const { data: rooms } = await db.rooms.getAll();
    if (rooms) {
      const nicuRoom = rooms.find((r: any) => r.type === 'NICU');
      if (nicuRoom?.price_per_hour) {
        setHourlyRate(nicuRoom.price_per_hour);
      }
    }
  };

  // Calculate charges for an observation
  const calculateCharges = (startTime: string, endTime?: string): { hours: number; total: number } => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.ceil(diffMs / (1000 * 60 * 60)); // Round up to nearest hour
    return {
      hours: Math.max(1, hours), // Minimum 1 hour
      total: Math.max(1, hours) * hourlyRate,
    };
  };

  // Start new observation
  const handleStartObservation = async () => {
    setLoading(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const { data, error: createError } = await db.nicuObservations.create({
        baby_patient_id: patient.id,
        admission_id: admission?.id || null,
        observation_date: now.split('T')[0],
        start_time: now,
        temperature: parseFloat(formData.temperature) || null,
        heart_rate: parseInt(formData.heartRate) || null,
        respiratory_rate: parseInt(formData.respiratoryRate) || null,
        oxygen_saturation: parseInt(formData.oxygenSaturation) || null,
        weight_grams: parseInt(formData.weightGrams) || null,
        feeding_type: formData.feedingType || null,
        feeding_amount_ml: parseInt(formData.feedingAmountMl) || null,
        care_provided: formData.careProvided || null,
        medications: formData.medications || null,
        procedures: formData.procedures || null,
        condition: formData.condition,
        hourly_rate: hourlyRate,
        doctor_id: formData.doctorId || null,
        notes: formData.notes || null,
        payment_status: 'pending',
      });

      if (createError) throw new Error(createError.message);

      // Reset form
      setFormData({
        temperature: '',
        heartRate: '',
        respiratoryRate: '',
        oxygenSaturation: '',
        weightGrams: '',
        feedingType: 'Breast',
        feedingAmountMl: '',
        careProvided: '',
        medications: '',
        procedures: '',
        condition: 'Stable',
        doctorId: '',
        notes: '',
      });
      setShowNewObservation(false);
      loadObservations();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to start observation');
    } finally {
      setLoading(false);
    }
  };

  // End observation
  const handleEndObservation = async (observation: NICUObservation) => {
    setLoading(true);
    setError(null);

    try {
      const endTime = new Date().toISOString();
      const { hours, total } = calculateCharges(observation.start_time, endTime);

      const { error: updateError } = await db.nicuObservations.endObservation(
        observation.id,
        endTime,
        hours,
        total
      );

      if (updateError) throw new Error(updateError.message);

      loadObservations();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to end observation');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total NICU charges
  const totalCharges = observations.reduce((sum, obs) => {
    if (obs.end_time) {
      return sum + (obs.total_charge || 0);
    } else {
      const { total } = calculateCharges(obs.start_time);
      return sum + total;
    }
  }, 0);

  // Get active (ongoing) observations
  const activeObservations = observations.filter((obs) => !obs.end_time);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            NICU Observations - {patient.name}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Summary Card */}
        <Card className="bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total NICU Time</p>
                <p className="text-2xl font-bold">
                  {observations.reduce((sum, obs) => {
                    const { hours } = calculateCharges(obs.start_time, obs.end_time);
                    return sum + hours;
                  }, 0)}{' '}
                  hours
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Observations</p>
                <p className="text-2xl font-bold text-orange-600">{activeObservations.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Hourly Rate</p>
                <p className="text-2xl font-bold">Rs. {hourlyRate.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Charges</p>
                <p className="text-2xl font-bold text-green-600">
                  Rs. {totalCharges.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Observations Alert */}
        {activeObservations.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Active Observations ({activeObservations.length})
            </h4>
            {activeObservations.map((obs) => {
              const { hours, total } = calculateCharges(obs.start_time);
              return (
                <div
                  key={obs.id}
                  className="flex items-center justify-between bg-white rounded p-3 mb-2"
                >
                  <div>
                    <p className="font-medium">
                      Started: {new Date(obs.start_time).toLocaleString('en-GB')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Duration: {hours} hour(s) | Running Total: Rs. {total.toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleEndObservation(obs)}
                    disabled={loading}
                  >
                    <StopCircle className="h-4 w-4 mr-1" />
                    End Observation
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* New Observation Form */}
        {showNewObservation ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">New NICU Observation</CardTitle>
              <CardDescription>Record vitals and start hourly billing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label className="flex items-center gap-1">
                    <Thermometer className="h-3 w-3" /> Temperature (°C)
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    placeholder="36.5"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-1">
                    <Heart className="h-3 w-3" /> Heart Rate (bpm)
                  </Label>
                  <Input
                    type="number"
                    value={formData.heartRate}
                    onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                    placeholder="140"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-1">
                    <Wind className="h-3 w-3" /> Respiratory Rate
                  </Label>
                  <Input
                    type="number"
                    value={formData.respiratoryRate}
                    onChange={(e) => setFormData({ ...formData, respiratoryRate: e.target.value })}
                    placeholder="40"
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-1">
                    <Droplets className="h-3 w-3" /> O2 Saturation (%)
                  </Label>
                  <Input
                    type="number"
                    value={formData.oxygenSaturation}
                    onChange={(e) => setFormData({ ...formData, oxygenSaturation: e.target.value })}
                    placeholder="98"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Weight (grams)</Label>
                  <Input
                    type="number"
                    value={formData.weightGrams}
                    onChange={(e) => setFormData({ ...formData, weightGrams: e.target.value })}
                    placeholder="3000"
                  />
                </div>
                <div>
                  <Label>Feeding Type</Label>
                  <Select
                    value={formData.feedingType}
                    onValueChange={(val) => setFormData({ ...formData, feedingType: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Breast">Breast Milk</SelectItem>
                      <SelectItem value="Formula">Formula</SelectItem>
                      <SelectItem value="IV">IV Fluids</SelectItem>
                      <SelectItem value="NG Tube">NG Tube</SelectItem>
                      <SelectItem value="NPO">NPO (Nothing by mouth)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Feeding Amount (ml)</Label>
                  <Input
                    type="number"
                    value={formData.feedingAmountMl}
                    onChange={(e) => setFormData({ ...formData, feedingAmountMl: e.target.value })}
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label>Condition</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(val) => setFormData({ ...formData, condition: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Stable">Stable</SelectItem>
                      <SelectItem value="Improving">Improving</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                      <SelectItem value="Ready for Discharge">Ready for Discharge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Care Provided</Label>
                  <Textarea
                    value={formData.careProvided}
                    onChange={(e) => setFormData({ ...formData, careProvided: e.target.value })}
                    placeholder="e.g., Incubator care, phototherapy, monitoring..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Medications</Label>
                  <Textarea
                    value={formData.medications}
                    onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                    placeholder="e.g., Vitamin K, antibiotics..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Attending Doctor</Label>
                  <Select
                    value={formData.doctorId}
                    onValueChange={(val) => setFormData({ ...formData, doctorId: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewObservation(false)}>
                  Cancel
                </Button>
                <Button onClick={handleStartObservation} disabled={loading}>
                  {loading ? 'Starting...' : 'Start Observation'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button onClick={() => setShowNewObservation(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Start New Observation
          </Button>
        )}

        {/* Observation History */}
        {observations.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Observation History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Vitals</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Charges</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {observations.map((obs) => {
                    const { hours, total } = calculateCharges(obs.start_time, obs.end_time);
                    return (
                      <TableRow key={obs.id}>
                        <TableCell className="text-sm">
                          {new Date(obs.start_time).toLocaleString('en-GB', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </TableCell>
                        <TableCell>{hours} hr(s)</TableCell>
                        <TableCell className="text-xs">
                          {obs.temperature && `T: ${obs.temperature}°C`}
                          {obs.heart_rate && ` | HR: ${obs.heart_rate}`}
                          {obs.oxygen_saturation && ` | SpO2: ${obs.oxygen_saturation}%`}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              obs.condition === 'Stable' || obs.condition === 'Improving'
                                ? 'default'
                                : 'destructive'
                            }
                          >
                            {obs.condition}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          Rs. {(obs.end_time ? obs.total_charge : total)?.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {obs.end_time ? (
                            <Badge variant="outline">Completed</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NICUObservationForm;
