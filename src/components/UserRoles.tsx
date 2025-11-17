import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Users, Shield, UserPlus, Settings, Check, X } from 'lucide-react';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

interface User {
  id: string;
  username: string;
  full_name: string;
  role: 'Admin' | 'Doctor' | 'Nurse' | 'Receptionist' | 'Lab Technician' | 'Pharmacist';
  email: string;
  contact: string;
  cnic_number: string;
  password?: string; // Optional for fetching/editing
  active: boolean;
  created_date: string;
  permissions: string[];
}

const rolePermissions = {
  Admin: [
    'Patient Registration', 'OPD Management', 'Admission Management', 'Lab Management',
    'Doctor Management', 'User Management', 'Reports & Analytics', 'System Settings',
    'Billing & Payments'
  ],
  Doctor: [
    'View Patient Records', 'Update Medical Records', 'Prescribe Medications', 
    'Order Lab Tests', 'Discharge Patients', 'View Reports'
  ],
  Nurse: [
    'Patient Registration', 'View Patient Records', 'Update Vital Signs', 
    'Medication Administration', 'Lab Sample Collection', 'Patient Care Notes'
  ],
  Receptionist: [
    'Patient Registration', 'OPD Token Generation', 'Appointment Scheduling', 
    'Billing & Payments', 'Lab Order Creation', 'Print Reports'
  ],
  'Lab Technician': [
    'Lab Test Management', 'Lab Order Processing', 'Result Entry', 
    'Report Generation', 'Sample Collection'
  ],
  Pharmacist: [
    'Medicine Dispensing', 'Inventory Management', 'Prescription Verification', 
    'Stock Management'
  ]
};

// Compile a list of all unique permissions across all roles for the customization form
const allPermissions = Array.from(new Set(Object.values(rolePermissions).flat()));

export default function UserRoles() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({
    username: '',
    full_name: '',
    role: 'Receptionist',
    email: '',
    contact: '',
    cnic_number: '',
    password: '',
    active: true,
    permissions: rolePermissions.Receptionist
  });

  // --- Data Fetching ---
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

  // --- Form Handling ---

  const resetForm = () => {
    setFormData({
      username: '', full_name: '', role: 'Receptionist', email: '', contact: '',
      cnic_number: '', password: '', active: true, permissions: rolePermissions.Receptionist
    });
    setEditingUser(null);
    setShowForm(false);
  };

  const onRoleChange = (role: string) => {
    const newRole = role as keyof typeof rolePermissions;
    setFormData({
      ...formData,
      role: newRole,
      permissions: rolePermissions[newRole] || []
    });
  };

  const onPermissionToggle = (permission: string, checked: boolean) => {
    const currentPermissions = formData.permissions || [];
    setFormData({
      ...formData,
      permissions: checked
        ? Array.from(new Set([...currentPermissions, permission])) // Add
        : currentPermissions.filter(p => p !== permission) // Remove
    });
  };

  // --- CRUD Operations ---

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.full_name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (users.some(user => user.username === formData.username)) {
      toast.error('Username already exists');
      return;
    }

    setLoading(true);
    try {
      const userData = {
        ...formData,
        created_date: new Date().toISOString().split('T')[0],
        // Ensure permissions are sent, falling back to role defaults if accidentally cleared
        permissions: formData.permissions || rolePermissions[formData.role as keyof typeof rolePermissions]
      };
      const { data, error } = await db.users.create(userData);
      if (error) throw error;

      setUsers([...users, data]);
      toast.success('User created successfully!');
      resetForm();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    // Copy existing user data to form data for editing
    setFormData({ ...user, password: '' }); 
    setShowForm(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !formData.full_name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Prepare data for update: remove id and password (since password is handled separately)
      const { id, username, password, ...updateData } = formData;
      
      // Update the user's non-auth details in the public 'users' table
      const { data, error } = await db.users.update(editingUser.id, updateData);
      if (error) throw error;
      
      // NOTE: Password change must be implemented here using a dedicated Supabase Auth API call.
      // For now, we will skip it to keep this function focused on the 'users' table update.
      if (password) {
          // This block would contain a server-side API call for password reset
          toast.warning('Password field submitted, but password change feature is not yet fully implemented.');
      }

      // Update the local state
      const updatedUsers = users.map(u => u.id === editingUser.id ? data : u);
      setUsers(updatedUsers);
      toast.success('User updated successfully!');
      resetForm();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    try {
      const { error } = await db.users.update(userId, { active: !user.active });
      if (error) throw error;

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
      {/* Edit/Add User Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User Details' : 'Add New User'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editingUser ? handleUpdateUser : handleAddUser} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="john_doe"
                  required
                  disabled={!!editingUser} // Cannot change username on edit
                />
              </div>
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
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
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@hospital.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password {editingUser ? '(New Password)' : '*'}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? 'Leave blank to keep current' : 'Min 6 characters'}
                  required={!editingUser}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={onRoleChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(rolePermissions).map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="contact">Contact</Label>
                <Input
                  id="contact"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="0300-1234567"
                />
              </div>
              <div>
                <Label htmlFor="cnic">CNIC Number</Label>
                <Input
                  id="cnic"
                  value={formData.cnic_number}
                  onChange={(e) => setFormData({ ...formData, cnic_number: e.target.value })}
                  placeholder="12345-6789012-3"
                />
              </div>
            </div>

            {/* Custom Permissions Section */}
            <div className="mt-4 p-4 border rounded-lg bg-white">
              <h4 className="font-semibold mb-3">Custom Permissions</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm max-h-48 overflow-y-auto">
                {allPermissions.map((permission) => (
                  <div key={permission} className="flex items-center space-x-2">
                    <Checkbox
                      id={permission}
                      checked={formData.permissions?.includes(permission) || false}
                      onCheckedChange={(checked) => onPermissionToggle(permission, checked as boolean)}
                    />
                    <Label htmlFor={permission} className="font-normal cursor-pointer">
                      {permission}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (editingUser ? 'Updating...' : 'Creating...') : (editingUser ? 'Update User' : 'Create User')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Main User List Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </div>
            <Button onClick={() => setShowForm(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => startEdit(user)}
                    >
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

      {/* Role Permissions and System Access Cards remain the same */}
      <Card>...</Card>
      <Card>...</Card>
    </div>
  );
}
