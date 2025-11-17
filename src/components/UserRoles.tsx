import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Users, Shield, UserPlus, Settings } from 'lucide-react';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  full_name: string;
  role: 'Admin' | 'Doctor' | 'Nurse' | 'Receptionist' | 'Lab Technician' | 'Pharmacist';
  email: string;
  contact: string;
  cnic_number: string;
  password: string;
  active: boolean;
  created_date: string;
  permissions: string[];
}

const rolePermissions = {
  Admin: [
    'Patient Registration',
    'OPD Management',
    'Admission Management',
    'Lab Management',
    'Doctor Management',
    'User Management',
    'Reports & Analytics',
    'System Settings',
    'Billing & Payments'
  ],
  Doctor: [
    'View Patient Records',
    'Update Medical Records',
    'Prescribe Medications',
    'Order Lab Tests',
    'Discharge Patients',
    'View Reports'
  ],
  Nurse: [
    'Patient Registration',
    'View Patient Records',
    'Update Vital Signs',
    'Medication Administration',
    'Lab Sample Collection',
    'Patient Care Notes'
  ],
  Receptionist: [
    'Patient Registration',
    'OPD Token Generation',
    'Appointment Scheduling',
    'Billing & Payments',
    'Lab Order Creation',
    'Print Reports'
  ],
  'Lab Technician': [
    'Lab Test Management',
    'Lab Order Processing',
    'Result Entry',
    'Report Generation',
    'Sample Collection'
  ],
  Pharmacist: [
    'Medicine Dispensing',
    'Inventory Management',
    'Prescription Verification',
    'Stock Management'
  ]
};

export default function UserRoles() {
  const [users, setUsers] = useState<User[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
    username: '',
    full_name: '',
    role: 'Receptionist',
    email: '',
    contact: '',
    cnic_number: '',
    password: '',
    active: true
  });

  // Fetch users from database
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await db.users.getAll();
      if (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
        return;
      }
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.username || !newUser.full_name || !newUser.email || !newUser.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (newUser.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    // Check if username already exists
    if (users.some(user => user.username === newUser.username)) {
      toast.error('Username already exists');
      return;
    }

    setLoading(true);
    try {
      const userData = {
        username: newUser.username,
        full_name: newUser.full_name,
        role: newUser.role as string,
        email: newUser.email,
        contact: newUser.contact || '',
        cnic_number: newUser.cnic_number || '',
        password: newUser.password,
        active: true,
        created_date: new Date().toISOString().split('T')[0],
        permissions: rolePermissions[newUser.role as keyof typeof rolePermissions] || []
      };

      const { data, error } = await db.users.create(userData);
      
      if (error) {
        console.error('Error creating user:', error);
        toast.error('Failed to create user');
        setLoading(false);
        return;
      }

      setUsers([...users, data]);
      toast.success('User created successfully!');
      
      // Reset form
      setNewUser({
        username: '',
        full_name: '',
        role: 'Receptionist',
        email: '',
        contact: '',
        cnic_number: '',
        password: '',
        active: true
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    try {
      const { error } = await db.users.update(userId, { active: !user.active });
      
      if (error) {
        console.error('Error updating user status:', error);
        toast.error('Failed to update user status');
        return;
      }

      const updatedUsers = users.map(u => 
        u.id === userId ? { ...u, active: !u.active } : u
      );
      setUsers(updatedUsers);
      toast.success(`${user.full_name} ${!user.active ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-800';
      case 'Doctor': return 'bg-blue-100 text-blue-800';
      case 'Nurse': return 'bg-green-100 text-green-800';
      case 'Receptionist': return 'bg-yellow-100 text-yellow-800';
      case 'Lab Technician': return 'bg-purple-100 text-purple-800';
      case 'Pharmacist': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <form onSubmit={handleAddUser} className="space-y-4 mb-6 p-4 border rounded-lg bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="john_doe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="john@hospital.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Min 6 characters"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Doctor">Doctor</SelectItem>
                      <SelectItem value="Nurse">Nurse</SelectItem>
                      <SelectItem value="Receptionist">Receptionist</SelectItem>
                      <SelectItem value="Lab Technician">Lab Technician</SelectItem>
                      <SelectItem value="Pharmacist">Pharmacist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact">Contact</Label>
                  <Input
                    id="contact"
                    value={newUser.contact}
                    onChange={(e) => setNewUser({ ...newUser, contact: e.target.value })}
                    placeholder="0300-1234567"
                  />
                </div>
                <div>
                  <Label htmlFor="cnic">CNIC Number</Label>
                  <Input
                    id="cnic"
                    value={newUser.cnic_number}
                    onChange={(e) => setNewUser({ ...newUser, cnic_number: e.target.value })}
                    placeholder="12345-6789012-3"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create User'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{user.full_name}</h3>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role}
                      </Badge>
                      <Badge variant={user.active ? 'default' : 'secondary'}>
                        {user.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      <p><strong>Username:</strong> {user.username}</p>
                      <p><strong>Email:</strong> {user.email}</p>
                      {user.contact && <p><strong>Contact:</strong> {user.contact}</p>}
                      {user.cnic_number && <p><strong>CNIC:</strong> {user.cnic_number}</p>}
                      <p><strong>Created:</strong> {new Date(user.created_date).toLocaleDateString()}</p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Permissions:</h4>
                      <div className="flex flex-wrap gap-1">
                        {user.permissions.map((permission, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${user.id}`} className="text-sm">
                        {user.active ? 'Active' : 'Inactive'}
                      </Label>
                      <Switch
                        id={`active-${user.id}`}
                        checked={user.active}
                        onCheckedChange={() => toggleUserStatus(user.id)}
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Permissions Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(rolePermissions).map(([role, permissions]) => (
              <Card key={role} className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Badge className={getRoleBadgeColor(role)}>
                    {role}
                  </Badge>
                </h3>
                <ul className="space-y-1 text-sm">
                  {permissions.map((permission, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      {permission}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Access Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-red-600">Admin Access:</h4>
              <p>Full system access including user management, system settings, and all hospital operations. Use with caution.</p>
            </div>
            <div>
              <h4 className="font-medium text-blue-600">Doctor Access:</h4>
              <p>Medical records, prescriptions, lab orders, and patient care. Cannot manage system users or settings.</p>
            </div>
            <div>
              <h4 className="font-medium text-green-600">Nurse Access:</h4>
              <p>Patient care, vital signs, medication administration, and lab sample collection. Limited billing access.</p>
            </div>
            <div>
              <h4 className="font-medium text-yellow-600">Receptionist Access:</h4>
              <p>Patient registration, OPD tokens, appointments, billing, and basic lab orders. No medical record editing.</p>
            </div>
            <div>
              <h4 className="font-medium text-purple-600">Lab Technician Access:</h4>
              <p>Lab test management, order processing, result entry, and report generation.</p>
            </div>
            <div>
              <h4 className="font-medium text-pink-600">Pharmacist Access:</h4>
              <p>Medicine dispensing, inventory management, and prescription verification.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
