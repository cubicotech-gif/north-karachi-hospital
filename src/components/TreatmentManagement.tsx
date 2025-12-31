import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Activity, Printer, Trash2, Plus, UserCheck, CreditCard, Percent, DollarSign } from 'lucide-react';
import { Patient, formatCurrency } from '@/lib/hospitalData';
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

interface TreatmentType {
  id: string;
  name: string;
  category: string;
  description: string;
  default_price: number;
  process_details: string;
  duration: string;
  requirements: string;
  active: boolean;
}

export default function TreatmentManagement({ selectedPatient }: TreatmentManagementProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [treatmentTypes, setTreatmentTypes] = useState<TreatmentType[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedTreatmentType, setSelectedTreatmentType] = useState<TreatmentType | null>(null);
  const [treatmentName, setTreatmentName] = useState<string>('');
  const [price, setPrice] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'partial'>('pending');
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [referredBy, setReferredBy] = useState<string>('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Calculate discounted price
  const calculateDiscountedPrice = (originalPrice: number): { discountAmount: number; finalPrice: number } => {
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (originalPrice * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }
    discountAmount = Math.min(discountAmount, originalPrice);
    const finalPrice = originalPrice - discountAmount;
    return { discountAmount, finalPrice };
  };

  useEffect(() => {
    fetchDoctors();
    fetchTreatmentTypes();
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

  const fetchTreatmentTypes = async () => {
    try {
      const { data, error } = await db.treatmentTypes.getActive();
      if (error) {
        console.error('Error fetching treatment types:', error);
        toast.error('Failed to load treatment types');
        return;
      }
      setTreatmentTypes(data || []);
    } catch (error) {
      console.error('Error fetching treatment types:', error);
      toast.error('Failed to load treatment types');
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

  const handleTreatmentTypeChange = (treatmentTypeId: string) => {
    const selectedType = treatmentTypes.find(t => t.id === treatmentTypeId);
    if (selectedType) {
      setSelectedTreatmentType(selectedType);
      setTreatmentName(selectedType.name);
      setPrice(selectedType.default_price);
      setDescription(selectedType.description || '');
    }
  };

  const handleAddTreatment = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient first');
      return;
    }

    if (!selectedTreatmentType) {
      toast.error('Please select a treatment type');
      return;
    }

    setLoading(true);

    try {
      const { finalPrice, discountAmount } = calculateDiscountedPrice(price);
      const treatmentData = {
        patient_id: selectedPatient.id,
        doctor_id: selectedDoctor || null,
        treatment_type: selectedTreatmentType.name,
        treatment_name: treatmentName,
        description: description || null,
        price: finalPrice, // Store final discounted price
        original_price: price,
        discount_type: discountValue > 0 ? discountType : null,
        discount_value: discountValue > 0 ? discountValue : null,
        discount_amount: discountValue > 0 ? discountAmount : null,
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
      setSelectedTreatmentType(null);
      setTreatmentName('');
      setSelectedDoctor('');
      setPrice(0);
      setPaymentStatus('pending');
      setDescription('');
      setNotes('');
      setDiscountType('percentage');
      setDiscountValue(0);
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

  const recordPaymentForTreatment = async (treatmentId: string) => {
    setLoading(true);
    try {
      const { error } = await db.treatments.update(treatmentId, {
        payment_status: 'paid'
      });

      if (error) {
        console.error('Error recording payment:', error);
        toast.error('Failed to record payment');
        setLoading(false);
        return;
      }

      toast.success('Payment recorded successfully!');

      // Refresh treatments list
      fetchTreatments();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const printTreatmentReceipt = (treatment: any) => {
    if (!selectedPatient || !treatment) {
      toast.error('Missing treatment details');
      return;
    }

    const doctor = doctors.find(d => d.id === treatment.doctor_id);

    const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Treatment Receipt - ${selectedPatient.name}</title>
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
          .status-badge { display: inline-block; padding: 5px 15px; border-radius: 15px; font-weight: bold; }
          .status-paid { background: #d4edda; color: #155724; }
          .status-pending { background: #f8d7da; color: #721c24; }
          .status-partial { background: #fff3cd; color: #856404; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>NORTH KARACHI HOSPITAL</h1>
          <p>C-122, Sector 11-B, North Karachi Township, Karachi</p>
          <p>Ph: 36989080</p>
        </div>

        <div class="receipt-title">TREATMENT RECEIPT</div>

        <div class="info-section">
          <div class="info-box">
            <p><strong>Receipt No:</strong> TRT-${treatment.id.slice(-8).toUpperCase()}</p>
            <p><strong>Date:</strong> ${new Date(treatment.date).toLocaleDateString('en-GB')}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
          </div>
          <div class="info-box">
            <p><strong>Patient:</strong> ${selectedPatient.name}</p>
            ${selectedPatient.mrNumber ? `<p style="color: #1565c0; font-weight: bold;"><strong>MR#:</strong> ${selectedPatient.mrNumber}</p>` : ''}
            <p><strong>Age/Gender:</strong> ${selectedPatient.age} yrs / ${selectedPatient.gender}</p>
            ${referredBy ? `<p style="color: #d97706; font-weight: bold;"><strong>Referred By:</strong> ${referredBy}</p>` : ''}
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
                <strong>${treatment.treatment_type}</strong> - ${treatment.treatment_name}
                ${treatment.description ? `<br><span style="font-size: 13px; color: #666;">${treatment.description}</span>` : ''}
                ${doctor ? `<br><span style="font-size: 13px; color: #666;">Doctor: Dr. ${doctor.name}</span>` : ''}
              </td>
              <td style="text-align: right;">${formatCurrency(treatment.original_price || treatment.price)}</td>
            </tr>
            ${treatment.discount_amount && treatment.discount_amount > 0 ? `
            <tr style="color: green;">
              <td style="text-align: right;">
                <strong>Discount (${treatment.discount_type === 'percentage' ? treatment.discount_value + '%' : 'Fixed'}) / رعایت:</strong>
              </td>
              <td style="text-align: right;">-${formatCurrency(treatment.discount_amount)}</td>
            </tr>
            ` : ''}
            <tr class="total-row">
              <td style="text-align: right;"><strong>TOTAL:</strong></td>
              <td style="text-align: right;"><strong>${formatCurrency(treatment.price)}</strong></td>
            </tr>
            ${treatment.discount_amount && treatment.discount_amount > 0 ? `
            <tr>
              <td colspan="2" style="text-align: right; color: green; font-size: 12px;">
                You saved ${formatCurrency(treatment.discount_amount)}!
              </td>
            </tr>
            ` : ''}
          </tbody>
        </table>

        <div style="text-align: center; margin: 20px 0;">
          <span class="status-badge status-${treatment.payment_status}">
            ${treatment.payment_status === 'paid' ? 'PAID' : treatment.payment_status === 'partial' ? 'PARTIAL PAYMENT' : 'PAYMENT PENDING'}
          </span>
        </div>

        <div class="footer">
          <p>Thank you for choosing North Karachi Hospital</p>
          <p>This is a computer generated receipt</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.print();
      toast.success('Treatment receipt printed successfully');
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
                    <Label htmlFor="treatmentType">Treatment Type</Label>
                    <Select
                      value={selectedTreatmentType?.id || ''}
                      onValueChange={handleTreatmentTypeChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select treatment type" />
                      </SelectTrigger>
                      <SelectContent>
                        {treatmentTypes.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500">
                            No treatment types available. Please add them in Treatment Types Management.
                          </div>
                        ) : (
                          treatmentTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name} - Rs. {type.default_price.toLocaleString()}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="treatmentName">Treatment Name</Label>
                    <Input
                      id="treatmentName"
                      value={treatmentName}
                      onChange={(e) => setTreatmentName(e.target.value)}
                      placeholder="e.g., Normal Delivery"
                    />
                  </div>
                </div>

                {/* Treatment Details Info */}
                {selectedTreatmentType && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                    <h4 className="font-semibold text-blue-900 mb-2">Treatment Information:</h4>
                    {selectedTreatmentType.category && (
                      <p className="text-gray-700"><strong>Category:</strong> {selectedTreatmentType.category}</p>
                    )}
                    {selectedTreatmentType.duration && (
                      <p className="text-gray-700"><strong>Duration:</strong> {selectedTreatmentType.duration}</p>
                    )}
                    {selectedTreatmentType.process_details && (
                      <p className="text-gray-700 mt-1"><strong>Process:</strong> {selectedTreatmentType.process_details}</p>
                    )}
                    {selectedTreatmentType.requirements && (
                      <p className="text-gray-700 mt-1"><strong>Requirements:</strong> {selectedTreatmentType.requirements}</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="price">Price (Rs)</Label>
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
                    <Label htmlFor="paymentStatus">Payment Status</Label>
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

                {/* Referred By Field */}
                <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <Label htmlFor="referredByTrt" className="flex items-center gap-2 mb-2">
                    <UserCheck className="h-4 w-4 text-amber-600" />
                    Referred By / حوالہ دہندہ
                  </Label>
                  <Input
                    id="referredByTrt"
                    value={referredBy}
                    onChange={(e) => setReferredBy(e.target.value)}
                    placeholder="Enter referral name (Doctor, Clinic, Hospital, Person)"
                    className="bg-white"
                  />
                  <p className="text-xs text-amber-600 mt-1">Optional - Enter if patient was referred by someone</p>
                </div>

                {/* Discount Section */}
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <Label className="flex items-center gap-2 mb-3">
                    <Percent className="h-4 w-4 text-green-600" />
                    Discount / رعایت
                  </Label>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-xs text-gray-600 mb-1 block">Type</Label>
                      <Select value={discountType} onValueChange={(val: 'percentage' | 'fixed') => setDiscountType(val)}>
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">
                            <span className="flex items-center gap-1"><Percent className="h-3 w-3" /> Percentage (%)</span>
                          </SelectItem>
                          <SelectItem value="fixed">
                            <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> Fixed Amount (Rs.)</span>
                          </SelectItem>
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
                        max={discountType === 'percentage' ? 100 : price}
                        value={discountValue || ''}
                        onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                        placeholder={discountType === 'percentage' ? 'e.g. 10' : 'e.g. 500'}
                        className="bg-white"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-green-600 mt-2">Optional - Apply discount if applicable</p>
                </div>

                {/* Price Summary with Discount */}
                {price > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                    <h4 className="font-semibold mb-2">Price Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Original Price:</span>
                        <span className={discountValue > 0 ? 'line-through text-gray-400' : 'font-semibold'}>
                          {formatCurrency(price)}
                        </span>
                      </div>
                      {discountValue > 0 && (
                        <>
                          <div className="flex justify-between text-green-600">
                            <span>Discount ({discountType === 'percentage' ? `${discountValue}%` : 'Fixed'}):</span>
                            <span>-{formatCurrency(calculateDiscountedPrice(price).discountAmount)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-lg border-t pt-1">
                            <span>Final Price:</span>
                            <span className="text-green-600">{formatCurrency(calculateDiscountedPrice(price).finalPrice)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

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
                          {treatment.payment_status !== 'paid' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => recordPaymentForTreatment(treatment.id)}
                              disabled={loading}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CreditCard className="h-3 w-3 mr-1" />
                              Record Payment
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => printTreatmentReceipt(treatment)}
                          >
                            <Printer className="h-3 w-3 mr-1" />
                            Receipt
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
