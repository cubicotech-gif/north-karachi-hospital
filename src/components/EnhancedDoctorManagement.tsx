import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Stethoscope, Plus, TrendingUp, Users, DollarSign, Edit, Trash2, Calendar, MapPin, Phone, Mail, CreditCard } from 'lucide-react';
import { Doctor, mockDoctors, mockDepartments, generateId, formatCurrency, validateCNIC, formatCNIC, calculateAge } from '@/lib/hospitalData';
import { toast } from 'sonner';

export default function EnhancedDoctorManagement() {
  const [doctors, setDoctors] = useState<Doctor[]>(mockDoctors);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string>('All');
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
    joiningDate: '',
    available: true,
    consultationHours: '',
    roomNumber: ''
  });

  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDoctor.name || !newDoctor.cnicNumber || !newDoctor.contact || !newDoctor.department || !newDoctor.opdFee) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!validateCNIC(newDoctor.cnicNumber)) {
      toast.error('Please enter a valid CNIC number');
      return;
    }

    // Check if CNIC already exists
    if (doctors.some(doctor => doctor.cnicNumber === newDoctor.cnicNumber)) {
      toast.error('A doctor with this CNIC already exists');
      return;
    }

    const doctor: Doctor = {
      id: generateId(),
      name: newDoctor.name,
      cnicNumber: newDoctor.cnicNumber,
      dateOfBirth: newDoctor.dateOfBirth || '',
      gender: newDoctor.gender as 'Male' | 'Female' | 'Other',
      contact: newDoctor.contact,
      email: newDoctor.email || '',
      address: newDoctor.address || '',
      department: newDoctor.department,
      opdFee: newDoctor.opdFee,
      commissionType: newDoctor.commissionType as 'percentage' | 'fixed',
      commissionRate: newDoctor.commissionRate || 0,
      specialization: newDoctor.specialization || '',
      qualification: newDoctor.qualification || '',
      experience: newDoctor.experience || 0,
      joiningDate: newDoctor.joiningDate || new Date().toISOString().split('T')[0],
      available: true,
      consultationHours: newDoctor.consultationHours || '',
      roomNumber: newDoctor.roomNumber || ''
    };

    setDoctors([...doctors, doctor]);
    toast.success('Doctor added successfully!');
    resetForm();
  };

  const handleEditDoctor = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setNewDoctor(doctor);
    setShowAddForm(true);
  };

  const handleUpdateDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingDoctor || !newDoctor.name || !newDoctor.cnicNumber || !newDoctor.contact || !newDoctor.department || !newDoctor.opdFee) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!validateCNIC(newDoctor.cnicNumber)) {
      toast.error('Please enter a valid CNIC number');
      return;
    }

    const updatedDoctors = doctors.map(doctor => 
      doctor.id === editingDoctor.id 
        ? { ...doctor, ...newDoctor }
        : doctor
    );

    setDoctors(updatedDoctors);
    toast.success('Doctor updated successfully!');
    resetForm();
  };

  const resetForm = () => {
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
      joiningDate: '',
      available: true,
      consultationHours: '',
      roomNumber: ''
    });
    setShowAddForm(false);
    setEditingDoctor(null);
  };

  const toggleDoctorAvailability = (doctorId: string) => {
    const updatedDoctors = doctors.map(doctor => 
      doctor.id === doctorId 
        ? { ...doctor, available: !doctor.available }
        : doctor
    );
    
    setDoctors(updatedDoctors);
    const doctor = doctors.find(d => d.id === doctorId);
    if (doctor) {
      toast.success(`Dr. ${doctor.name} marked as ${!doctor.available ? 'available' : 'unavailable'}`);
    }
  };

  const deleteDoctor = (doctorId: string) => {
    const updatedDoctors = doctors.filter(doctor => doctor.id !== doctorId);
    setDoctors(updatedDoctors);
    toast.success('Doctor deleted successfully!');
  };

  const handleCNICChange = (cnic: string) => {
    const formatted = formatCNIC(cnic);
    setNewDoctor({ ...newDoctor, cnicNumber: formatted });
  };

  // Mock data for commission calculations
  const calculateDailyStats = (doctor: Doctor) => {
    const dailyPatients = Math.floor(Math.random() * 15) + 5;
    const totalCollection = dailyPatients * doctor.opdFee;
    const commission = doctor.commissionType === 'percentage' 
      ? (totalCollection * doctor.commissionRate) / 100
      : dailyPatients * doctor.commissionRate;
    const hospitalShare = totalCollection - commission;

    return {
      patients: dailyPatients,
      totalCollection,
      commission,
      hospitalShare
    };
  };

  const filteredDoctors = filterDepartment === 'All' 
    ? doctors 
    : doctors.filter(doctor => doctor.department === filterDepartment);

  const activeDepartments = mockDepartments.filter(dept => dept.active);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Enhanced Doctor Management
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Doctor
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <form onSubmit={editingDoctor ? handleUpdateDoctor : handleAddDoctor} className="space-y-6 mb-6 p-6 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold">
                {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
              </h3>
              
              {/* Personal Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700 border-b pb-2">Personal Information</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="doctorName">Full Name *</Label>
                    <Input
                      id="doctorName"
                      value={newDoctor.name}
                      onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                      placeholder="Dr. John Doe"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cnic">CNIC Number *</Label>
                    <Input
                      id="cnic"
                      value={newDoctor.cnicNumber}
                      onChange={(e) => handleCNICChange(e.target.value)}
                      placeholder="12345-6789012-3"
                      maxLength={15}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
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
                    <Select value={newDoctor.gender} onValueChange={(value) => setNewDoctor({ ...newDoctor, gender: value })}>
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
                  <div>
                    <Label htmlFor="joiningDate">Joining Date</Label>
                    <Input
                      id="joiningDate"
                      type="date"
                      value={newDoctor.joiningDate}
                      onChange={(e) => setNewDoctor({ ...newDoctor, joiningDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newDoctor.email}
                      onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                      placeholder="doctor@hospital.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={newDoctor.address}
                    onChange={(e) => setNewDoctor({ ...newDoctor, address: e.target.value })}
                    placeholder="Complete address..."
                    rows={2}
                  />
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700 border-b pb-2">Professional Information</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department">Department *</Label>
                    <Select value={newDoctor.department} onValueChange={(value) => setNewDoctor({ ...newDoctor, department: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeDepartments.map((dept) => (
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
                    <Label htmlFor="experience">Experience (Years)</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={newDoctor.experience}
                      onChange={(e) => setNewDoctor({ ...newDoctor, experience: parseInt(e.target.value) })}
                      placeholder="5"
                    />
                  </div>
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
                    <Label htmlFor="roomNumber">Room Number</Label>
                    <Input
                      id="roomNumber"
                      value={newDoctor.roomNumber}
                      onChange={(e) => setNewDoctor({ ...newDoctor, roomNumber: e.target.value })}
                      placeholder="R-101"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700 border-b pb-2">Financial Information</h4>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="opdFee">OPD Fee (₹) *</Label>
                    <Input
                      id="opdFee"
                      type="number"
                      value={newDoctor.opdFee}
                      onChange={(e) => setNewDoctor({ ...newDoctor, opdFee: parseInt(e.target.value) })}
                      placeholder="500"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="commissionType">Commission Type</Label>
                    <Select value={newDoctor.commissionType} onValueChange={(value) => setNewDoctor({ ...newDoctor, commissionType: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="commissionRate">
                      Commission {newDoctor.commissionType === 'percentage' ? 'Percentage' : 'Amount'}
                    </Label>
                    <Input
                      id="commissionRate"
                      type="number"
                      value={newDoctor.commissionRate}
                      onChange={(e) => setNewDoctor({ ...newDoctor, commissionRate: parseInt(e.target.value) })}
                      placeholder={newDoctor.commissionType === 'percentage' ? '30' : '200'}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingDoctor ? 'Update Doctor' : 'Add Doctor'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Filter */}
          <div className="mb-4">
            <Label htmlFor="departmentFilter">Filter by Department</Label>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Departments</SelectItem>
                {activeDepartments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Doctors List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredDoctors.map((doctor) => {
              const stats = calculateDailyStats(doctor);
              return (
                <Card key={doctor.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{doctor.name}</h3>
                        <Badge variant={doctor.available ? 'default' : 'secondary'}>
                          {doctor.available ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{doctor.department}</p>
                      <p className="text-xs text-gray-500">{doctor.specialization}</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <CreditCard className="h-3 w-3 text-gray-500" />
                          <span className="text-xs text-gray-600">CNIC: {doctor.cnicNumber}</span>
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                          <Phone className="h-3 w-3 text-gray-500" />
                          <span className="text-xs text-gray-600">{doctor.contact}</span>
                        </div>
                        {doctor.email && (
                          <div className="flex items-center gap-1 mb-1">
                            <Mail className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-600">{doctor.email}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        {doctor.roomNumber && (
                          <div className="flex items-center gap-1 mb-1">
                            <MapPin className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-600">Room: {doctor.roomNumber}</span>
                          </div>
                        )}
                        {doctor.consultationHours && (
                          <div className="flex items-center gap-1 mb-1">
                            <Calendar className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-600">{doctor.consultationHours}</span>
                          </div>
                        )}
                        <div className="text-xs text-gray-600">
                          Experience: {doctor.experience} years
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
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
                      </div>
                      <div>
                        <div className="text-xs text-gray-600 mb-2">Today's Stats:</div>
                        <div className="flex justify-between text-xs">
                          <span>Patients:</span>
                          <span className="font-medium">{stats.patients}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Collection:</span>
                          <span className="font-medium text-green-600">{formatCurrency(stats.totalCollection)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={doctor.available}
                        onCheckedChange={() => toggleDoctorAvailability(doctor.id)}
                        size="sm"
                      />
                      <span className="text-xs">{doctor.available ? 'Available' : 'Unavailable'}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditDoctor(doctor)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteDoctor(doctor.id)}
                        className="text-red-600 hover:text-red-700"
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Daily Revenue Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(() => {
              const totalStats = filteredDoctors.reduce((acc, doctor) => {
                const stats = calculateDailyStats(doctor);
                return {
                  totalPatients: acc.totalPatients + stats.patients,
                  totalCollection: acc.totalCollection + stats.totalCollection,
                  totalCommission: acc.totalCommission + stats.commission,
                  hospitalRevenue: acc.hospitalRevenue + stats.hospitalShare
                };
              }, { totalPatients: 0, totalCollection: 0, totalCommission: 0, hospitalRevenue: 0 });

              return (
                <>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold text-blue-600">{totalStats.totalPatients}</p>
                    <p className="text-sm text-gray-600">Total Patients</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalStats.totalCollection)}</p>
                    <p className="text-sm text-gray-600">Total Collection</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                    <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalStats.totalCommission)}</p>
                    <p className="text-sm text-gray-600">Doctor Commission</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalStats.hospitalRevenue)}</p>
                    <p className="text-sm text-gray-600">Hospital Revenue</p>
                  </div>
                </>
              );
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}