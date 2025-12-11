import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Building, Plus, MapPin, Phone, User, Edit, Trash2 } from 'lucide-react';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';

interface Department {
  id: string;
  name: string;
  description: string;
  head_of_department?: string;
  location: string;
  contact_extension: string;
  active: boolean;
  created_date: string;
}

interface Doctor {
  id: string;
  name: string;
  department: string;
}

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(false);
  const [newDepartment, setNewDepartment] = useState<Partial<Department>>({
    name: '',
    description: '',
    location: '',
    contact_extension: '',
    active: true
  });

  // Fetch departments and doctors from database
  useEffect(() => {
    fetchDepartments();
    fetchDoctors();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await db.departments.getAll();
      if (error) {
        console.error('Error fetching departments:', error);
        toast.error('Failed to load departments');
        return;
      }
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data, error } = await db.doctors.getAll();
      if (error) {
        console.error('Error fetching doctors:', error);
        return;
      }
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if department name already exists
    if (departments.some(dept => dept.name.toLowerCase() === newDepartment.name?.toLowerCase())) {
      toast.error('Department with this name already exists');
      return;
    }

    setLoading(true);
    try {
      const deptData = {
        name: newDepartment.name,
        description: newDepartment.description,
        location: newDepartment.location,
        contact_extension: newDepartment.contact_extension || '',
        active: true,
        created_date: new Date().toISOString().split('T')[0]
      };

      const { data, error } = await db.departments.create(deptData);
      
      if (error) {
        console.error('Error creating department:', error);
        toast.error('Failed to add department');
        setLoading(false);
        return;
      }

      setDepartments([...departments, data]);
      toast.success('Department added successfully!');
      
      // Reset form
      setNewDepartment({
        name: '',
        description: '',
        location: '',
        contact_extension: '',
        active: true
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creating department:', error);
      toast.error('Failed to add department');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setNewDepartment(department);
    setShowAddForm(true);
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingDepartment) {
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        name: newDepartment.name,
        description: newDepartment.description,
        location: newDepartment.location,
        contact_extension: newDepartment.contact_extension || '',
        head_of_department: newDepartment.head_of_department,
        active: newDepartment.active
      };

      const { data, error } = await db.departments.update(editingDepartment.id, updateData);
      
      if (error) {
        console.error('Error updating department:', error);
        toast.error('Failed to update department');
        setLoading(false);
        return;
      }

      const updatedDepartments = departments.map(dept => 
        dept.id === editingDepartment.id ? data : dept
      );
      setDepartments(updatedDepartments);
      toast.success('Department updated successfully!');
      
      // Reset form
      setNewDepartment({
        name: '',
        description: '',
        location: '',
        contact_extension: '',
        active: true
      });
      setShowAddForm(false);
      setEditingDepartment(null);
    } catch (error) {
      console.error('Error updating department:', error);
      toast.error('Failed to update department');
    } finally {
      setLoading(false);
    }
  };

  const toggleDepartmentStatus = async (departmentId: string) => {
    const department = departments.find(d => d.id === departmentId);
    if (!department) return;

    try {
      const { error } = await db.departments.update(departmentId, { active: !department.active });
      
      if (error) {
        console.error('Error updating department status:', error);
        toast.error('Failed to update department status');
        return;
      }

      const updatedDepartments = departments.map(dept => 
        dept.id === departmentId ? { ...dept, active: !dept.active } : dept
      );
      setDepartments(updatedDepartments);
      toast.success(`${department.name} ${!department.active ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error updating department status:', error);
      toast.error('Failed to update department status');
    }
  };

  const deleteDepartment = async (departmentId: string) => {
    const department = departments.find(d => d.id === departmentId);
    if (!department) return;

    // Check if any doctors are assigned to this department
    const assignedDoctors = doctors.filter(doctor => doctor.department === department.name);

    if (assignedDoctors.length > 0) {
      toast.error(`Cannot delete department. ${assignedDoctors.length} doctor(s) are assigned to this department.`);
      return;
    }

    try {
      const { error } = await db.departments.delete(departmentId);
      
      if (error) {
        console.error('Error deleting department:', error);
        toast.error('Failed to delete department');
        return;
      }

      const updatedDepartments = departments.filter(dept => dept.id !== departmentId);
      setDepartments(updatedDepartments);
      toast.success('Department deleted successfully!');
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error('Failed to delete department');
    }
  };

  const getDoctorCount = (departmentName: string) => {
    return doctors.filter(doctor => doctor.department === departmentName).length;
  };

  const getHeadOfDepartment = (departmentName: string) => {
    const hod = doctors.find(doctor => 
      doctor.department === departmentName && doctor.name.includes('Dr.')
    );
    return hod?.name || 'Not Assigned';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Department Management
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <form onSubmit={editingDepartment ? handleUpdateDepartment : handleAddDepartment} className="space-y-4 mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold">
                {editingDepartment ? 'Edit Department' : 'Add New Department'}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="departmentName">Department Name</Label>
                  <Input
                    id="departmentName"
                    value={newDepartment.name}
                    onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                    placeholder="e.g., Cardiology"
                  />
                </div>
                <div>
                  <Label htmlFor="contactExtension">Contact Extension</Label>
                  <Input
                    id="contactExtension"
                    value={newDepartment.contact_extension}
                    onChange={(e) => setNewDepartment({ ...newDepartment, contact_extension: e.target.value })}
                    placeholder="e.g., 101"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newDepartment.location}
                  onChange={(e) => setNewDepartment({ ...newDepartment, location: e.target.value })}
                  placeholder="e.g., Ground Floor, Block A"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                  placeholder="Brief description of the department services..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : (editingDepartment ? 'Update Department' : 'Add Department')}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingDepartment(null);
                    setNewDepartment({
                      name: '',
                      description: '',
                      location: '',
                      contact_extension: '',
                      active: true
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map((department) => (
              <Card key={department.id} className={`p-4 ${!department.active ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{department.name}</h3>
                      <Badge variant={department.active ? 'default' : 'secondary'}>
                        {department.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{department.description}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{department.location}</span>
                  </div>
                  
                  {department.contact_extension && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>Ext: {department.contact_extension}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>HOD: {getHeadOfDepartment(department.name)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span>Doctors: {getDoctorCount(department.name)}</span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Created: {new Date(department.created_date).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${department.id}`} className="text-sm">
                      {department.active ? 'Active' : 'Inactive'}
                    </Label>
                    <Switch
                      id={`active-${department.id}`}
                      checked={department.active}
                      onCheckedChange={() => toggleDepartmentStatus(department.id)}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditDepartment(department)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteDepartment(department.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
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
          <CardTitle>Department Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{departments.length}</p>
              <p className="text-sm text-gray-600">Total Departments</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {departments.filter(d => d.active).length}
              </p>
              <p className="text-sm text-gray-600">Active Departments</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{doctors.length}</p>
              <p className="text-sm text-gray-600">Total Doctors</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {departments.filter(d => d.contact_extension).length}
              </p>
              <p className="text-sm text-gray-600">With Extensions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
