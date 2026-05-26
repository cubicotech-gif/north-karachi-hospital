import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Stethoscope, Plus, TrendingUp, Users, DollarSign, Edit, Trash2, X } from 'lucide-react';
import { Doctor, formatCurrency, validateCNIC, formatCNIC, calculateAge } from '@/lib/hospitalData';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';

interface Department {
  id: string;
  name: string;
  active: boolean;
}

export default function EnhancedDoctorManagement() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [newDoctor, setNewDoctor] = useState<Partial<Doctor>>({
    name: '',
    cnicNumber: '',
    dateOfBirth: '',
    gender: 'Male',
    contact: '',
    email: '',
    address: '',
    department: '',
    opdFee: 0,
    commissionType: 'percentage',
    commissionRate: 0,
    specialization: '',
    qualification: '',
    experience: 0,
    consultationHours: '',
    roomNumber: '',
    available: true,
    referralShareRate: 0,
    referralRecipientType: 'none',
    referralRecipientDoctorId: '',
    referralRecipientName: ''
  });

  useEffect(() => {
    loadDoctors();
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const { data, error } = await db.departments.getAll();
      if (error) {
        console.error('Error loading departments:', error);
        return;
      }
      // Filter only active departments
      const activeDepartments = (data || []).filter((dept: Department) => dept.active);
      setDepartments(activeDepartments);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const loadDoctors = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await db.doctors.getAll();
      
      if (error) {
        console.error('Error loading doctors:', error);
        toast.error('Failed to load doctors');
        return;
      }

      // Convert snake_case to camelCase
      const doctorsData = data?.map((d: any) => ({
        id: d.id,
        name: d.name,
        cnicNumber: d.cnic_number,
        dateOfBirth: d.date_of_birth,
        gender: d.gender,
        contact: d.contact,
        email: d.email,
        address: d.address,
        department: d.department,
        opdFee: d.opd_fee,
        commissionType: d.commission_type,
        commissionRate: d.commission_rate,
        specialization: d.specialization,
        qualification: d.qualification,
        experience: d.experience,
        joiningDate: d.joining_date,
        available: d.available,
        consultationHours: d.consultation_hours,
        roomNumber: d.room_number,
        referralShareRate: d.referral_share_rate,
        referralRecipientDoctorId: d.referral_recipient_doctor_id,
        referralRecipientName: d.referral_recipient_name
      })) || [];

      setDoctors(doctorsData);
    } catch (error) {
      console.error('Failed to load doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setNewDoctor({
      name: doctor.name,
      cnicNumber: doctor.cnicNumber,
      dateOfBirth: doctor.dateOfBirth,
      gender: doctor.gender,
      contact: doctor.contact,
      email: doctor.email,
      address: doctor.address,
      department: doctor.department,
      opdFee: doctor.opdFee,
      commissionType: doctor.commissionType,
      commissionRate: doctor.commissionRate,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experience: doctor.experience,
      consultationHours: doctor.consultationHours,
      roomNumber: doctor.roomNumber,
      available: doctor.available,
      referralShareRate: doctor.referralShareRate || 0,
      referralRecipientDoctorId: doctor.referralRecipientDoctorId || '',
      referralRecipientName: doctor.referralRecipientName || '',
      referralRecipientType: doctor.referralRecipientDoctorId
        ? 'doctor'
        : (doctor.referralRecipientName ? 'external' : 'none')
    });
    setShowAddForm(true);
  };

  const handleDelete = async (doctorId: string, doctorName: string) => {
    if (!confirm(`Are you sure you want to delete ${doctorName}?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await db.doctors.delete(doctorId);
      
      if (error) {
        console.error('Error deleting doctor:', error);
        toast.error('Failed to delete doctor');
        return;
      }

      setDoctors(doctors.filter(d => d.id !== doctorId));
      toast.success(`Dr. ${doctorName} deleted successfully!`);
    } catch (error) {
      console.error('Failed to delete doctor:', error);
      toast.error('Failed to delete doctor');
    }
  };

  const handleAddOrUpdateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate only essential fields - Name and Contact only
    if (!newDoctor.name?.trim()) {
      toast.error('Doctor name is required');
      return;
    }

    if (!newDoctor.contact?.trim()) {
      toast.error('Contact number is required');
      return;
    }

    if (newDoctor.cnicNumber && !validateCNIC(newDoctor.cnicNumber)) {
      toast.error('Invalid CNIC format. Use: 12345-6789012-3');
      return;
    }

    // Convert to snake_case for database
    // IMPORTANT: Send null for empty fields, not undefined
    const doctorData: any = {
      name: newDoctor.name,
      cnic_number: newDoctor.cnicNumber ? formatCNIC(newDoctor.cnicNumber) : null,
      date_of_birth: newDoctor.dateOfBirth || null,
      gender: newDoctor.gender || null,
      contact: newDoctor.contact,
      email: newDoctor.email || null,
      address: newDoctor.address || null,
      department: newDoctor.department || null,
      opd_fee: newDoctor.opdFee || null,
      commission_type: newDoctor.commissionType || null,
      commission_rate: newDoctor.commissionRate || null,
      specialization: newDoctor.specialization || null,
      qualification: newDoctor.qualification || null,
      experience: newDoctor.experience || null,
      consultation_hours: newDoctor.consultationHours || null,
      room_number: newDoctor.roomNumber || null,
      available: newDoctor.available !== undefined ? newDoctor.available : true
    };

    // Only write the referral columns when a referral is being set or cleared.
    // This keeps saving a normal doctor working even if the referral migration
    // has not been applied yet (the columns simply are not touched).
    const referralConfigured = !!newDoctor.referralRecipientType && newDoctor.referralRecipientType !== 'none';
    const referralWasSet = !!(editingDoctor && (editingDoctor.referralRecipientDoctorId || editingDoctor.referralRecipientName));
    if (referralConfigured || referralWasSet) {
      doctorData.referral_share_rate = referralConfigured ? (newDoctor.referralShareRate || null) : null;
      doctorData.referral_recipient_doctor_id = newDoctor.referralRecipientType === 'doctor'
        ? (newDoctor.referralRecipientDoctorId || null)
        : null;
      doctorData.referral_recipient_name = newDoctor.referralRecipientType === 'doctor'
        ? (doctors.find(d => d.id === newDoctor.referralRecipientDoctorId)?.name || null)
        : (newDoctor.referralRecipientType === 'external' ? (newDoctor.referralRecipientName || null) : null);
    }

    try {
      if (editingDoctor) {
        // UPDATE existing doctor
        const { data, error } = await db.doctors.update(editingDoctor.id, doctorData);
        
        if (error) {
          console.error('Error updating doctor:', error);
          toast.error('Failed to update doctor');
          return;
        }

        // Convert back to camelCase
        const updatedDoctor: Doctor = {
          id: data.id,
          name: data.name,
          cnicNumber: data.cnic_number,
          dateOfBirth: data.date_of_birth,
          gender: data.gender,
          contact: data.contact,
          email: data.email,
          address: data.address,
          department: data.department,
          opdFee: data.opd_fee,
          commissionType: data.commission_type,
          commissionRate: data.commission_rate,
          specialization: data.specialization,
          qualification: data.qualification,
          experience: data.experience,
          joiningDate: data.joining_date,
          available: data.available,
          consultationHours: data.consultation_hours,
          roomNumber: data.room_number,
          referralShareRate: data.referral_share_rate,
          referralRecipientDoctorId: data.referral_recipient_doctor_id,
          referralRecipientName: data.referral_recipient_name
        };

        setDoctors(doctors.map(d => d.id === editingDoctor.id ? updatedDoctor : d));
        toast.success('Doctor updated successfully!');
        setEditingDoctor(null);
      } else {
        // CREATE new doctor
        const dataWithDate = {
          ...doctorData,
          joining_date: new Date().toISOString().split('T')[0]
        };

        const { data, error } = await db.doctors.create(dataWithDate);
        
        if (error) {
          console.error('Error creating doctor:', error);
          toast.error('Failed to add doctor');
          return;
        }

        const createdDoctor: Doctor = {
          id: data.id,
          name: data.name,
          cnicNumber: data.cnic_number,
          dateOfBirth: data.date_of_birth,
          gender: data.gender,
          contact: data.contact,
          email: data.email,
          address: data.address,
          department: data.department,
          opdFee: data.opd_fee,
          commissionType: data.commission_type,
          commissionRate: data.commission_rate,
          specialization: data.specialization,
          qualification: data.qualification,
          experience: data.experience,
          joiningDate: data.joining_date,
          available: data.available,
          consultationHours: data.consultation_hours,
          roomNumber: data.room_number,
          referralShareRate: data.referral_share_rate,
          referralRecipientDoctorId: data.referral_recipient_doctor_id,
          referralRecipientName: data.referral_recipient_name
        };

        setDoctors([createdDoctor, ...doctors]);
        toast.success('Doctor added successfully!');
      }
      
      // Reset form
      setNewDoctor({
        name: '',
        cnicNumber: '',
        dateOfBirth: '',
        gender: 'Male',
        contact: '',
        email: '',
        address: '',
        department: '',
        opdFee: 0,
        commissionType: 'percentage',
        commissionRate: 0,
        specialization: '',
        qualification: '',
        experience: 0,
        consultationHours: '',
        roomNumber: '',
        available: true,
        referralShareRate: 0,
        referralRecipientType: 'none',
        referralRecipientDoctorId: '',
        referralRecipientName: ''
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to save doctor:', error);
      toast.error('Failed to save doctor');
    }
  };

  const toggleDoctorAvailability = async (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    if (!doctor) return;

    try {
      const { error } = await db.doctors.update(doctorId, {
        available: !doctor.available
      });

      if (error) {
        console.error('Error updating availability:', error);
        toast.error('Failed to update availability');
        return;
      }

      setDoctors(doctors.map(d => 
        d.id === doctorId ? { ...d, available: !d.available } : d
      ));
      
      toast.success(`Dr. ${doctor.name} marked as ${!doctor.available ? 'available' : 'unavailable'}`);
    } catch (error) {
      console.error('Failed to update availability:', error);
      toast.error('Failed to update availability');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Doctor Management
            </div>
            <Button onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingDoctor(null);
              setNewDoctor({
                name: '',
                cnicNumber: '',
                dateOfBirth: '',
                gender: 'Male',
                contact: '',
                email: '',
                address: '',
                department: '',
                opdFee: 0,
                commissionType: 'percentage',
                commissionRate: 0,
                specialization: '',
                qualification: '',
                experience: 0,
                consultationHours: '',
                roomNumber: '',
                available: true,
                referralShareRate: 0,
                referralRecipientType: 'none',
                referralRecipientDoctorId: '',
                referralRecipientName: ''
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Doctor
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <form onSubmit={handleAddOrUpdateDoctor} className="space-y-4 mb-6 p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">
                  {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
                </h3>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingDoctor(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="doctorName">Doctor Name *</Label>
                  <Input
                    id="doctorName"
                    value={newDoctor.name}
                    onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                    placeholder="Dr. John Doe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact">Contact Number *</Label>
                  <Input
                    id="contact"
                    value={newDoctor.contact}
                    onChange={(e) => setNewDoctor({ ...newDoctor, contact: e.target.value })}
                    placeholder="0300-1234567"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newDoctor.email}
                    onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                    placeholder="doctor@hospital.com"
                  />
                </div>
                <div>
                  <Label htmlFor="cnicNumber">CNIC Number</Label>
                  <Input
                    id="cnicNumber"
                    value={newDoctor.cnicNumber}
                    onChange={(e) => setNewDoctor({ ...newDoctor, cnicNumber: e.target.value })}
                    placeholder="12345-6789012-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={newDoctor.dateOfBirth}
                    onChange={(e) => setNewDoctor({ ...newDoctor, dateOfBirth: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={newDoctor.gender} onValueChange={(value) => setNewDoctor({ ...newDoctor, gender: value as any })}>
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
                  <Label htmlFor="department">Department</Label>
                  <Select value={newDoctor.department} onValueChange={(value) => setNewDoctor({ ...newDoctor, department: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    value={newDoctor.specialization}
                    onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
                    placeholder="e.g., Internal Medicine"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="qualification">Qualification</Label>
                  <Input
                    id="qualification"
                    value={newDoctor.qualification}
                    onChange={(e) => setNewDoctor({ ...newDoctor, qualification: e.target.value })}
                    placeholder="e.g., MBBS, MD"
                  />
                </div>
                <div>
                  <Label htmlFor="experience">Experience (years)</Label>
                  <Input
                    id="experience"
                    type="number"
                    value={newDoctor.experience}
                    onChange={(e) => setNewDoctor({ ...newDoctor, experience: parseInt(e.target.value) || 0 })}
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="opdFee">OPD Fee</Label>
                  <Input
                    id="opdFee"
                    type="number"
                    value={newDoctor.opdFee}
                    onChange={(e) => setNewDoctor({ ...newDoctor, opdFee: parseInt(e.target.value) || 0 })}
                    placeholder="500"
                  />
                </div>
                <div>
                  <Label htmlFor="roomNumber">Room Number</Label>
                  <Input
                    id="roomNumber"
                    value={newDoctor.roomNumber}
                    onChange={(e) => setNewDoctor({ ...newDoctor, roomNumber: e.target.value })}
                    placeholder="R-101"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="commissionType">Commission Type</Label>
                  <Select value={newDoctor.commissionType} onValueChange={(value) => setNewDoctor({ ...newDoctor, commissionType: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="commissionRate">
                    Commission {newDoctor.commissionType === 'percentage' ? 'Percentage (%)' : 'Amount (Rs)'}
                  </Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newDoctor.commissionRate}
                    onChange={(e) => setNewDoctor({ ...newDoctor, commissionRate: parseFloat(e.target.value) || 0 })}
                    placeholder={newDoctor.commissionType === 'percentage' ? '30' : '200'}
                  />
                </div>
              </div>

              <div className="border rounded-md p-4 bg-gray-50 space-y-4">
                <Label className="font-semibold">Referral Share (optional)</Label>
                <p className="text-xs text-gray-500">
                  Route part of this doctor's patient revenue to another party. It is taken from the hospital share; the doctor's own commission is unaffected.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="referralRecipientType">Referral To</Label>
                    <Select
                      value={newDoctor.referralRecipientType || 'none'}
                      onValueChange={(value) => setNewDoctor({ ...newDoctor, referralRecipientType: value as any })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No referral</SelectItem>
                        <SelectItem value="doctor">Existing doctor</SelectItem>
                        <SelectItem value="external">External party</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newDoctor.referralRecipientType && newDoctor.referralRecipientType !== 'none' && (
                    <div>
                      <Label htmlFor="referralShareRate">Referral Share (%)</Label>
                      <Input
                        id="referralShareRate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newDoctor.referralShareRate}
                        onChange={(e) => setNewDoctor({ ...newDoctor, referralShareRate: parseFloat(e.target.value) || 0 })}
                        placeholder="10"
                      />
                    </div>
                  )}
                </div>
                {newDoctor.referralRecipientType === 'doctor' && (
                  <div>
                    <Label htmlFor="referralRecipientDoctorId">Recipient Doctor</Label>
                    <Select
                      value={newDoctor.referralRecipientDoctorId || ''}
                      onValueChange={(value) => setNewDoctor({ ...newDoctor, referralRecipientDoctorId: value })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select a doctor" /></SelectTrigger>
                      <SelectContent>
                        {doctors
                          .filter(d => d.id !== editingDoctor?.id)
                          .map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {newDoctor.referralRecipientType === 'external' && (
                  <div>
                    <Label htmlFor="referralRecipientName">Recipient Name</Label>
                    <Input
                      id="referralRecipientName"
                      value={newDoctor.referralRecipientName || ''}
                      onChange={(e) => setNewDoctor({ ...newDoctor, referralRecipientName: e.target.value })}
                      placeholder="e.g. Dr. Mansoor (external)"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="consultationHours">Consultation Hours</Label>
                  <Input
                    id="consultationHours"
                    value={newDoctor.consultationHours}
                    onChange={(e) => setNewDoctor({ ...newDoctor, consultationHours: e.target.value })}
                    placeholder="9:00 AM - 1:00 PM"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={newDoctor.address}
                    onChange={(e) => setNewDoctor({ ...newDoctor, address: e.target.value })}
                    placeholder="House 123, Street 45..."
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingDoctor ? 'Update Doctor' : 'Add Doctor'}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowAddForm(false);
                  setEditingDoctor(null);
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading doctors...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctors.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-600">
                  <Stethoscope className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No doctors found</p>
                  <p className="text-sm mt-2">Add a doctor to get started</p>
                </div>
              ) : (
                doctors.map((doctor) => (
                  <Card key={doctor.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold">{doctor.name}</h3>
                        <p className="text-sm text-gray-600">{doctor.department}</p>
                        <p className="text-xs text-gray-500">{doctor.specialization}</p>
                      </div>
                      <Badge variant={doctor.available ? 'default' : 'secondary'}>
                        {doctor.available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>

                    <Separator className="my-3" />

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>OPD Fee:</span>
                        <span className="font-medium">{formatCurrency(doctor.opdFee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Commission:</span>
                        <span className="font-medium">
                          {doctor.commissionType === 'percentage' 
                            ? `${doctor.commissionRate}%` 
                            : formatCurrency(doctor.commissionRate)}
                        </span>
                      </div>
                      {doctor.qualification && (
                        <div className="flex justify-between">
                          <span>Qualification:</span>
                          <span className="font-medium text-xs">{doctor.qualification}</span>
                        </div>
                      )}
                      {doctor.experience > 0 && (
                        <div className="flex justify-between">
                          <span>Experience:</span>
                          <span className="font-medium">{doctor.experience} years</span>
                        </div>
                      )}
                      {doctor.roomNumber && (
                        <div className="flex justify-between">
                          <span>Room:</span>
                          <span className="font-medium">{doctor.roomNumber}</span>
                        </div>
                      )}
                      {doctor.consultationHours && (
                        <div className="text-xs text-gray-500 mt-2">
                          Hours: {doctor.consultationHours}
                        </div>
                      )}
                    </div>

                    <Separator className="my-3" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`available-${doctor.id}`} className="text-xs">
                          {doctor.available ? 'Active' : 'Inactive'}
                        </Label>
                        <Switch
                          id={`available-${doctor.id}`}
                          checked={doctor.available}
                          onCheckedChange={() => toggleDoctorAvailability(doctor.id)}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleEdit(doctor)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(doctor.id, doctor.name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Doctor Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{doctors.length}</p>
              <p className="text-sm text-gray-600">Total Doctors</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {doctors.filter(d => d.available).length}
              </p>
              <p className="text-sm text-gray-600">Available</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">
                {new Set(doctors.map(d => d.department)).size}
              </p>
              <p className="text-sm text-gray-600">Departments</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {doctors.reduce((sum, d) => sum + d.experience, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Experience</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
