import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Plus, UserPlus } from 'lucide-react';
import { Patient, validateCNIC, formatCNIC, calculateAge } from '@/lib/hospitalData';
import { db, toSnakeCase, toCamelCase } from '@/lib/supabase';
import { toast } from 'sonner';

interface PatientRegistrationProps {
  onPatientSelect: (patient: Patient) => void;
  onNewPatient: (patient: Patient) => void;
}

export default function PatientRegistration({ onPatientSelect, onNewPatient }: PatientRegistrationProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newPatient, setNewPatient] = useState<Partial<Patient>>({
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

  // Load patients on component mount
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

      // Convert snake_case from database to camelCase for TypeScript
      const patientsData = data?.map((p: any) => ({
        id: p.id,
        name: p.name,
        age: p.age,
        dateOfBirth: p.date_of_birth,
        cnicNumber: p.cnic_number,
        gender: p.gender,
        contact: p.contact,
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

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPatient.name || !newPatient.contact || !newPatient.dateOfBirth) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate CNIC if provided
    if (newPatient.cnicNumber && !validateCNIC(newPatient.cnicNumber)) {
      toast.error('Invalid CNIC format. Use: 12345-6789012-3');
      return;
    }

    // Calculate age from date of birth
    const age = calculateAge(newPatient.dateOfBirth!);

    // Prepare data for database (convert to snake_case)
    const patientData = {
      name: newPatient.name,
      age: age,
      date_of_birth: newPatient.dateOfBirth,
      cnic_number: newPatient.cnicNumber ? formatCNIC(newPatient.cnicNumber) : null,
      gender: newPatient.gender,
      contact: newPatient.contact,
      problem: newPatient.problem || 'General Checkup',
      department: newPatient.department,
      emergency_contact: newPatient.emergencyContact,
      address: newPatient.address,
      blood_group: newPatient.bloodGroup,
      marital_status: newPatient.maritalStatus,
      registration_date: new Date().toISOString().split('T')[0]
    };

    try {
      const { data, error } = await db.patients.create(patientData);
      
      if (error) {
        console.error('Error creating patient:', error);
        toast.error('Failed to register patient');
        return;
      }

      // Convert back to camelCase
      const createdPatient: Patient = {
        id: data.id,
        name: data.name,
        age: data.age,
        dateOfBirth: data.date_of_birth,
        cnicNumber: data.cnic_number,
        gender: data.gender,
        contact: data.contact,
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
      toast.success('Patient registered successfully!');
      onNewPatient(createdPatient);
      
      // Reset form
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
      setShowRegisterForm(false);
    } catch (error) {
      console.error('Failed to register patient:', error);
      toast.error('Failed to register patient');
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
        name: p.name,
        age: p.age,
        dateOfBirth: p.date_of_birth,
        cnicNumber: p.cnic_number,
        gender: p.gender,
        contact: p.contact,
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Patient Registration
            </div>
            <Button onClick={() => setShowRegisterForm(!showRegisterForm)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Register New Patient
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showRegisterForm && (
            <form onSubmit={handleRegisterPatient} className="space-y-4 mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold">New Patient Registration</h3>
              
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
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={newPatient.dateOfBirth}
                    onChange={(e) => setNewPatient({ ...newPatient, dateOfBirth: e.target.value })}
                    required
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
                  <Label htmlFor="gender">Gender *</Label>
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
                  <Label htmlFor="department">Department *</Label>
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
                <Button type="submit">Register Patient</Button>
                <Button type="button" variant="outline" onClick={() => setShowRegisterForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search by name, contact, or CNIC..."
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
                </div>
              ) : (
                patients.map((patient) => (
                  <Card key={patient.id} className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => onPatientSelect(patient)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{patient.name}</h3>
                        <p className="text-sm text-gray-600">
                          {patient.age} years • {patient.gender} • {patient.contact}
                        </p>
                        {patient.cnicNumber && (
                          <p className="text-xs text-gray-500">CNIC: {patient.cnicNumber}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge>{patient.department}</Badge>
                        {patient.bloodGroup && (
                          <p className="text-sm text-gray-600 mt-1">{patient.bloodGroup}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
