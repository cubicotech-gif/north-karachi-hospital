import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Plus, UserPlus, Edit, Trash2, X } from 'lucide-react';
import { Patient, validateCNIC, formatCNIC } from '@/lib/hospitalData';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';

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

    if (!newPatient.name || !newPatient.contact || !newPatient.age || newPatient.age <= 0) {
      toast.error('Please fill in all required fields (Name, Contact, Age)');
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
      problem: newPatient.problem || 'General Checkup',
      department: newPatient.department,
      emergency_contact: newPatient.emergencyContact,
      address: newPatient.address,
      blood_group: newPatient.bloodGroup,
      marital_status: newPatient.maritalStatus,
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
        // CREATE new patient
        const dataWithDate = {
          ...patientData,
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
        toast.success('Patient registered successfully!');
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
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    min="0"
                    max="150"
                    value={newPatient.age || ''}
                    onChange={(e) => setNewPatient({ ...newPatient, age: parseInt(e.target.value) || 0 })}
                    placeholder="e.g., 25"
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
                      <div className="flex gap-2 ml-4">
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
