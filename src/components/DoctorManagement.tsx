import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Stethoscope, Plus, TrendingUp, Users, DollarSign } from 'lucide-react';
import { Doctor, mockDoctors, generateId, formatCurrency } from '@/lib/hospitalData';
import { toast } from 'sonner';

export default function DoctorManagement() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDoctor, setNewDoctor] = useState<Partial<Doctor>>({
    name: '',
    department: '',
    opdFee: 0,
    commissionType: 'percentage',
    commissionRate: 0,
    specialization: '',
    available: true
  });

  const departments = [
    'General Medicine',
    'Pediatrics',
    'Orthopedics',
    'Gynecology',
    'Cardiology',
    'Dermatology',
    'ENT',
    'Ophthalmology',
    'Neurology',
    'Psychiatry'
  ];

  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDoctor.name || !newDoctor.department || !newDoctor.opdFee) {
      toast.error('Please fill in all required fields');
      return;
    }

    const doctor: Doctor = {
      id: generateId(),
      name: newDoctor.name,
      department: newDoctor.department,
      opdFee: newDoctor.opdFee,
      commissionType: newDoctor.commissionType as 'percentage' | 'fixed',
      commissionRate: newDoctor.commissionRate || 0,
      specialization: newDoctor.specialization || '',
      available: true
    };

    mockDoctors.push(doctor);
    toast.success('Doctor added successfully!');
    
    // Reset form
    setNewDoctor({
      name: '',
      department: '',
      opdFee: 0,
      commissionType: 'percentage',
      commissionRate: 0,
      specialization: '',
      available: true
    });
    setShowAddForm(false);
  };

  const toggleDoctorAvailability = (doctorId: string) => {
    const doctor = mockDoctors.find(d => d.id === doctorId);
    if (doctor) {
      doctor.available = !doctor.available;
      toast.success(`Dr. ${doctor.name} marked as ${doctor.available ? 'available' : 'unavailable'}`);
    }
  };

  // Mock data for commission calculations
  const calculateDailyStats = (doctor: Doctor) => {
    const dailyPatients = Math.floor(Math.random() * 15) + 5; // 5-20 patients
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Doctor Management
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Doctor
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <form onSubmit={handleAddDoctor} className="space-y-4 mb-6 p-4 border rounded-lg bg-gray-50">
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
                  <Label htmlFor="department">Department *</Label>
                  <Select value={newDoctor.department} onValueChange={(value) => setNewDoctor({ ...newDoctor, department: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    value={newDoctor.specialization}
                    onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
                    placeholder="e.g., Internal Medicine"
                  />
                </div>
                <div>
                  <Label htmlFor="opdFee">OPD Fee *</Label>
                  <Input
                    id="opdFee"
                    type="number"
                    value={newDoctor.opdFee}
                    onChange={(e) => setNewDoctor({ ...newDoctor, opdFee: parseInt(e.target.value) })}
                    placeholder="500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

              <div className="flex gap-2">
                <Button type="submit">Add Doctor</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockDoctors.map((doctor) => {
              const stats = calculateDailyStats(doctor);
              return (
                <Card key={doctor.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">Dr. {doctor.name}</h3>
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
                  </div>

                  <Separator className="my-3" />

                  <div className="space-y-2 text-sm">
                    <h4 className="font-medium text-gray-700">Today's Stats:</h4>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Patients:
                      </span>
                      <span className="font-medium">{stats.patients}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Collection:
                      </span>
                      <span className="font-medium">{formatCurrency(stats.totalCollection)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Commission:
                      </span>
                      <span className="font-medium text-green-600">{formatCurrency(stats.commission)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hospital Share:</span>
                      <span className="font-medium text-blue-600">{formatCurrency(stats.hospitalShare)}</span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-3"
                    onClick={() => toggleDoctorAvailability(doctor.id)}
                  >
                    Mark {doctor.available ? 'Unavailable' : 'Available'}
                  </Button>
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
              const totalStats = mockDoctors.reduce((acc, doctor) => {
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