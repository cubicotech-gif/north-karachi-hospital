import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Users, Shield, UserPlus, Settings } from 'lucide-react';
import { generateId } from '@/lib/hospitalData';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'Admin' | 'Doctor' | 'Nurse' | 'Receptionist';
  email: string;
  active: boolean;
  createdDate: string;
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
  ]
};

export default function UserRoles() {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      username: 'admin',
      fullName: 'System Administrator',
      role: 'Admin',
      email: 'admin@hospital.com',
      active: true,
      createdDate: '2024-01-01',
      permissions: rolePermissions.Admin
    },
    {
      id: '2',
      username: 'reception1',
      fullName: 'Priya Sharma',
      role: 'Receptionist',
      email: 'priya@hospital.com',
      active: true,
      createdDate: '2024-01-05',
      permissions: rolePermissions.Receptionist
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
    username: '',
    fullName: '',
    role: 'Receptionist',
    email: '',
    active: true
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.username || !newUser.fullName || !newUser.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if username already exists
    if (users.some(user => user.username === newUser.username)) {
      toast.error('Username already exists');
      return;
    }

    const user: User = {
      id: generateId(),
      username: newUser.username,
      fullName: newUser.fullName,
      role: newUser.role as 'Admin' | 'Doctor' | 'Nurse' | 'Receptionist',
      email: newUser.email,
      active: true,
      createdDate: new Date().toISOString().split('T')[0],
      permissions: rolePermissions[newUser.role as keyof typeof rolePermissions] || []
    };

    setUsers([...users, user]);
    toast.success('User created successfully!');
    
    // Reset form
    setNewUser({
      username: '',
      fullName: '',
      role: 'Receptionist',
      email: '',
      active: true
    });
    setShowAddForm(false);
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, active: !user.active }
        : user
    ));
    const user = users.find(u => u.id === userId);
    if (user) {
      toast.success(`${user.fullName} ${!user.active ? 'activated' : 'deactivated'}`);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-800';
      case 'Doctor': return 'bg-blue-100 text-blue-800';
      case 'Nurse': return 'bg-green-100 text-green-800';
      case 'Receptionist': return 'bg-yellow-100 text-yellow-800';
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
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
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
                  <Label htmlFor="role">Role *</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Doctor">Doctor</SelectItem>
                      <SelectItem value="Nurse">Nurse</SelectItem>
                      <SelectItem value="Receptionist">Receptionist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Create User</Button>
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
                      <h3 className="font-semibold">{user.fullName}</h3>
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
                      <p><strong>Created:</strong> {new Date(user.createdDate).toLocaleDateString()}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}