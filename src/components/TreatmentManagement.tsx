import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Activity, Printer, Trash2, Plus } from 'lucide-react';
import { Patient, Treatment, formatCurrency } from '@/lib/hospitalData';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';

interface Doctor {
  id: string;
  name: string;
  department: string;
  specialization: string;
}

interface TreatmentManagementProps {
  selectedPatient: Patient | null;
}

// Common treatment types for maternity hospital
const TREATMENT_TYPES = [
  'Normal Delivery',
  'C-Section Operation',
  'Dressing',
  'Seizure Care',
  'IV Therapy',
  'Post-Natal Care',
  'Pre-Natal Checkup',
  'Vaccination',
  'Minor Surgery',
  'Emergency Care',
  'Other'
];

// Default prices for common treatments
const DEFAULT_PRICES: { [key: string]: number } = {
  'Normal Delivery': 15000,
  'C-Section Operation': 50000,
  'Dressing': 500,
  'Seizure Care': 3000,
  'IV Therapy': 1500,
  'Post-Natal Care': 2000,
  'Pre-Natal Checkup': 1000,
  'Vaccination': 800,
  'Minor Surgery': 10000,
  'Emergency Care': 5000,
  'Other': 0
};

export default function TreatmentManagement({ selectedPatient }: TreatmentManagementProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [treatmentType, setTreatmentType] = useState<string>('');
  const [treatmentName, setTreatmentName] = useState<string>('');
  const [price, setPrice] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'partial'>('pending');
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchDoctors();
    if (selectedPatient) {
      fetchTreatments();
    }
  }, [selectedPatient]);

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

  const fetchTreatments = async () => {
    if (!selectedPatient) return;

    try {
      const { data, error } = await db.treatments.getByPatientId(selectedPatient.id);
      if (error) {
        console.error('Error fetching treatments:', error);
        return;
      }
      setTreatments(data || []);
    } catch (error) {
      console.error('Error fetching treatments:', error);
    }
  };

  const handleTreatmentTypeChange = (type: string) => {
    setTreatmentType(type);
    setTreatmentName(type);
    setPrice(DEFAULT_PRICES[type] || 0);
  };

  const handleAddTreatment = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient first');
      return;
    }

    if (!treatmentType || !treatmentName || price <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const treatmentData = {
        patient_id: selectedPatient.id,
        doctor_id: selectedDoctor || null,
        treatment_type: treatmentType,
        treatment_name: treatmentName,
        description: description || null,
        price: price,
        payment_status: paymentStatus,
        date: new Date().toISOString().split('T')[0],
        notes: notes || null
      };

      const { data, error } = await db.treatments.create(treatmentData);

      if (error) {
        console.error('Error creating treatment:', error);
        toast.error('Failed to add treatment');
        setLoading(false);
        return;
      }

      toast.success('Treatment added successfully!');
      fetchTreatments();

      // Reset form
      setTreatmentType('');
      setTreatmentName('');
      setSelectedDoctor('');
      setPrice(0);
      setPaymentStatus('pending');
      setDescription('');
      setNotes('');
      setShowForm(false);
    } catch (error) {
      console.error('Error creating treatment:', error);
      toast.error('Failed to add treatment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTreatment = async (treatmentId: string) => {
    if (!confirm('Are you sure you want to delete this treatment record?')) {
      return;
    }

    try {
      const { error } = await db.treatments.delete(treatmentId);

      if (error) {
        console.error('Error deleting treatment:', error);
        toast.error('Failed to delete treatment');
        return;
      }

      toast.success('Treatment deleted successfully');
      fetchTreatments();
    } catch (error) {
      console.error('Error deleting treatment:', error);
      toast.error('Failed to delete treatment');
    }
  };

  const printTreatmentReceipt = (treatment: any) => {
    const doctor = doctors.find(d => d.id === treatment.doctor_id);

    const printContent = `
      <html>
        <head>
          <title>Treatment Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; border: 2px solid #333; padding: 20px; }
            .header { text-align: center; border-bottom: 3px solid #27ae60; padding-bottom: 15px; margin-bottom: 20px; }
            .hospital-name { font-size: 24px; font-weight: bold; color: #333; }
            .subtitle { color: #666; font-size: 14px; margin-top: 5px; }
            .section { margin: 20px 0; }
            .label { font-weight: bold; color: #333; display: inline-block; width: 150px; }
            .value { display: inline-block; }
            .price-box { background: #27ae60; color: white; padding: 15px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .price { font-size: 32px; font-weight: bold; }
            .footer { border-top: 1px solid #ccc; padding-top: 10px; margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="hospital-name">North Karachi Hospital</div>
              <div class="subtitle">Treatment Receipt</div>
            </div>

            <div class="section">
              <div><span class="label">Receipt Date:</span><span class="value">${new Date().toLocaleDateString('en-PK')}</span></div>
              <div><span class="label">Treatment Date:</span><span class="value">${new Date(treatment.date).toLocaleDateString('en-PK')}</span></div>
            </div>

            <div class="section">
              <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">Patient Information</h3>
              <div><span class="label">MR Number:</span><span class="value">${selectedPatient?.mrNumber || 'N/A'}</span></div>
              <div><span class="label">Patient Name:</span><span class="value">${selectedPatient?.name}</span></div>
              <div><span class="label">Age/Gender:</span><span class="value">${selectedPatient?.age} years / ${selectedPatient?.gender}</span></div>
              <div><span class="label">Contact:</span><span class="value">${selectedPatient?.contact}</span></div>
            </div>

            <div class="section">
              <h3 style="border-bottom: 1px solid #ccc; padding-bottom: 5px;">Treatment Details</h3>
              <div><span class="label">Treatment Type:</span><span class="value">${treatment.treatment_type}</span></div>
              <div><span class="label">Treatment Name:</span><span class="value">${treatment.treatment_name}</span></div>
              ${doctor ? `<div><span class="label">Doctor:</span><span class="value">${doctor.name}</span></div>` : ''}
              ${treatment.description ? `<div><span class="label">Description:</span><span class="value">${treatment.description}</span></div>` : ''}
              ${treatment.notes ? `<div><span class="label">Notes:</span><span class="value">${treatment.notes}</span></div>` : ''}
            </div>

            <div class="price-box">
              <div style="font-size: 14px; margin-bottom: 5px;">Total Amount</div>
              <div class="price">${formatCurrency(treatment.price)}</div>
              <div style="font-size: 14px; margin-top: 5px;">Payment Status: ${treatment.payment_status.toUpperCase()}</div>
            </div>

            <div class="footer">
              <p>This is a computer-generated receipt</p>
              <p>North Karachi Hospital - Quality Healthcare Services</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  if (!selectedPatient) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-gray-600">
            <Activity className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>Please select a patient from Patient Registration to add treatments</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Treatment Management
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-2" />
              {showForm ? 'Hide Form' : 'Add Treatment'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Patient Info Banner */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {selectedPatient.mrNumber && (
                    <Badge variant="outline" className="text-blue-700 border-blue-700 font-mono">
                      {selectedPatient.mrNumber}
                    </Badge>
                  )}
                  <h3 className="font-semibold text-lg">{selectedPatient.name}</h3>
                  <Badge>{selectedPatient.department}</Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Age: {selectedPatient.age} • Gender: {selectedPatient.gender} • Contact: {selectedPatient.contact}
                </p>
              </div>
            </div>
          </div>

          {/* Add Treatment Form */}
          {showForm && (
            <Card className="mb-6 bg-gray-50">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Add New Treatment</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="treatmentType">Treatment Type *</Label>
                    <Select value={treatmentType} onValueChange={handleTreatmentTypeChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select treatment type" />
                      </SelectTrigger>
                      <SelectContent>
                        {TREATMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="treatmentName">Treatment Name *</Label>
                    <Input
                      id="treatmentName"
                      value={treatmentName}
                      onChange={(e) => setTreatmentName(e.target.value)}
                      placeholder="e.g., Normal Delivery"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="price">Price (Rs) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      value={price || ''}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                      placeholder="Enter price"
                    />
                  </div>

                  <div>
                    <Label htmlFor="doctor">Doctor (Optional)</Label>
                    <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            {doctor.name} - {doctor.department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="paymentStatus">Payment Status *</Label>
                    <Select value={paymentStatus} onValueChange={(value: any) => setPaymentStatus(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Treatment description"
                    rows={2}
                  />
                </div>

                <div className="mt-4">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddTreatment} disabled={loading}>
                    {loading ? 'Adding...' : 'Add Treatment'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator className="my-6" />

          {/* Treatment History */}
          <div>
            <h3 className="font-semibold mb-4">Treatment History</h3>
            {treatments.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <Activity className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No treatments recorded for this patient</p>
              </div>
            ) : (
              <div className="space-y-3">
                {treatments.map((treatment) => {
                  const doctor = doctors.find(d => d.id === treatment.doctor_id);
                  return (
                    <Card key={treatment.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{treatment.treatment_type}</Badge>
                            <Badge
                              className={
                                treatment.payment_status === 'paid' ? 'bg-green-500' :
                                treatment.payment_status === 'partial' ? 'bg-yellow-500' :
                                'bg-red-500'
                              }
                            >
                              {treatment.payment_status}
                            </Badge>
                          </div>
                          <h4 className="font-semibold">{treatment.treatment_name}</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
                            <p><strong>Date:</strong> {new Date(treatment.date).toLocaleDateString('en-PK')}</p>
                            <p><strong>Price:</strong> {formatCurrency(treatment.price)}</p>
                            {doctor && <p><strong>Doctor:</strong> {doctor.name}</p>}
                            {treatment.description && (
                              <p className="col-span-2"><strong>Description:</strong> {treatment.description}</p>
                            )}
                            {treatment.notes && (
                              <p className="col-span-2"><strong>Notes:</strong> {treatment.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => printTreatmentReceipt(treatment)}
                          >
                            <Printer className="h-3 w-3 mr-1" />
                            Print
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTreatment(treatment.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
