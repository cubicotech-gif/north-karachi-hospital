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
  password?: string;
  active: boolean;
  created_date: string;
  permissions: string[];
}

// Real module permissions that match the actual system
const rolePermissions = {
  Admin: [
    'Patient Registration', 'OPD Token System', 'Admission Management', 'Discharge Management',
    'Lab Management', 'Treatment Management', 'Lab Test Management', 'Treatment Types Management',
    'Room Management', 'Department Management', 'Doctor Management', 'User Management',
    'Reports & Analytics', 'Billing & Invoices', 'Appointment Scheduling', 'Doctor Queue System',
    'Documents Management', 'Document Portfolio', 'Consent Forms', 'Settings Management'
  ],
  Doctor: [
    'Patient Registration', 'OPD Token System', 'Admission Management', 'Discharge Management',
    'Lab Management', 'Treatment Management', 'Doctor Queue System', 'Reports & Analytics',
    'Document Portfolio', 'Consent Forms'
  ],
  Nurse: [
    'Patient Registration', 'OPD Token System', 'Admission Management', 'Discharge Management',
    'Lab Management', 'Treatment Management', 'Doctor Queue System', 'Document Portfolio', 'Consent Forms'
  ],
  Receptionist: [
    // All patient-facing modules except management/admin modules
    'Patient Registration', 'OPD Token System', 'Admission Management', 'Discharge Management',
    'Lab Management', 'Treatment Management', 'Appointment Scheduling', 'Billing & Invoices',
    'Doctor Queue System', 'Documents Management', 'Document Portfolio', 'Consent Forms'
  ],
  'Lab Technician': [
    'Lab Management', 'Patient Registration', 'Document Portfolio'
  ]
};

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
        ? Array.from(new Set([...currentPermissions, permission]))
        : currentPermissions.filter(p => p !== permission)
    });
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate essential fields
    if (!formData.username?.trim()) {
      toast.error('Username is required');
      return;
    }

    if (!formData.email?.trim()) {
      toast.error('Email is required');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      toast.error('Password is required (minimum 6 characters)');
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
    setFormData({ ...user, password: '' }); 
    setShowForm(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) {
      return;
    }

    // Validate essential fields
    if (!formData.email?.trim()) {
      toast.error('Email is required');
      return;
    }

    // Validate password if provided
    if (formData.password && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Prepare update data
      const { id, username, ...updateData } = formData;
      
      // ✅ FIX: Include password in update if provided
      const dataToUpdate: any = {
        full_name: updateData.full_name,
        email: updateData.email,
        contact: updateData.contact,
        cnic_number: updateData.cnic_number,
        role: updateData.role,
        active: updateData.active,
        permissions: updateData.permissions
      };

      // Add password to update if user entered a new one
      if (formData.password && formData.password.trim() !== '') {
        dataToUpdate.password = formData.password;
      }

      const { data, error } = await db.users.update(editingUser.id, dataToUpdate);
      if (error) throw error;

      // Update local state
      const updatedUsers = users.map(u => u.id === editingUser.id ? { ...data, password: undefined } : u);
      setUsers(updatedUsers);
      
      if (formData.password) {
        toast.success('User and password updated successfully!');
      } else {
        toast.success('User updated successfully!');
      }
      
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

      setUsers(users.map(u => u.id === userId ? { ...u, active: !u.active } : u));
      toast.success(`User ${!user.active ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error toggling user status:', error);
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
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
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
                  disabled={!!editingUser}
                  required
                />
              </div>
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
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
                <Label htmlFor="password">
                  Password {editingUser ? '(Leave blank to keep current)' : ''}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? 'Enter new password to change' : 'Min 6 characters'}
                  minLength={6}
                />
                {editingUser && (
                  <p className="text-xs text-gray-500 mt-1">
                    ✅ Enter a new password to change it, or leave blank to keep the current password
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="role">Role</Label>
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
            <div className="mt-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Custom Permissions
              </h4>
              <p className="text-xs text-gray-600 mb-3">
                Default permissions are set based on role. You can customize them here.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm max-h-48 overflow-y-auto">
                {allPermissions.map((permission) => (
                  <div key={permission} className="flex items-center space-x-2">
                    <Checkbox
                      id={permission}
                      checked={formData.permissions?.includes(permission) || false}
                      onCheckedChange={(checked) => onPermissionToggle(permission, checked as boolean)}
                    />
                    <Label htmlFor={permission} className="font-normal cursor-pointer text-xs">
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
            {users.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No users found. Create your first user!</p>
            ) : (
              users.map((user) => (
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
                        <h4 className="font-medium mb-2 text-sm">Permissions:</h4>
                        <div className="flex flex-wrap gap-1">
                          {user.permissions && user.permissions.length > 0 ? (
                            user.permissions.map((permission, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {permission}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">No permissions set</span>
                          )}
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
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Default Role Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(rolePermissions).map(([role, permissions]) => (
              <Card key={role} className="p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge className={getRoleBadgeColor(role)}>{role}</Badge>
                </h4>
                <ul className="text-sm space-y-1">
                  {permissions.map((permission, index) => (
                    <li key={index} className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-green-600" />
                      {permission}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
