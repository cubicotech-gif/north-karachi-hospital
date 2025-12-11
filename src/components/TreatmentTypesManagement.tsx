import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Activity, Plus, Edit, Trash2, X, Search } from 'lucide-react';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';

interface TreatmentType {
  id: string;
  name: string;
  category: string;
  description: string;
  default_price: number;
  process_details: string;
  duration: string;
  requirements: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  'Maternity',
  'Surgical',
  'Medical',
  'Emergency',
  'Preventive',
  'Diagnostic',
  'Therapeutic',
  'Other'
];

export default function TreatmentTypesManagement() {
  const [treatmentTypes, setTreatmentTypes] = useState<TreatmentType[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<TreatmentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<TreatmentType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');

  const [formData, setFormData] = useState({
    name: '',
    category: 'Medical',
    description: '',
    default_price: 0,
    process_details: '',
    duration: '',
    requirements: '',
    active: true
  });

  useEffect(() => {
    loadTreatmentTypes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [treatmentTypes, searchQuery, filterCategory, filterActive]);

  const loadTreatmentTypes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await db.treatmentTypes.getAll();

      if (error) {
        console.error('Error loading treatment types:', error);
        toast.error('Failed to load treatment types');
        return;
      }

      setTreatmentTypes(data || []);
    } catch (error) {
      console.error('Failed to load treatment types:', error);
      toast.error('Failed to load treatment types');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...treatmentTypes];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.name.toLowerCase().includes(query) ||
          t.category?.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category === filterCategory);
    }

    // Active filter
    if (filterActive === 'active') {
      filtered = filtered.filter(t => t.active);
    } else if (filterActive === 'inactive') {
      filtered = filtered.filter(t => !t.active);
    }

    setFilteredTypes(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    try {
      const treatmentData = {
        name: formData.name,
        category: formData.category,
        description: formData.description || null,
        default_price: formData.default_price,
        process_details: formData.process_details || null,
        duration: formData.duration || null,
        requirements: formData.requirements || null,
        active: formData.active
      };

      if (editingType) {
        // Update existing treatment type
        const { data, error } = await db.treatmentTypes.update(editingType.id, treatmentData);

        if (error) {
          console.error('Error updating treatment type:', error);
          toast.error('Failed to update treatment type');
          setIsLoading(false);
          return;
        }

        setTreatmentTypes(treatmentTypes.map(t => t.id === editingType.id ? data : t));
        toast.success('Treatment type updated successfully!');
      } else {
        // Create new treatment type
        const { data, error } = await db.treatmentTypes.create(treatmentData);

        if (error) {
          console.error('Error creating treatment type:', error);
          toast.error('Failed to create treatment type');
          setIsLoading(false);
          return;
        }

        setTreatmentTypes([data, ...treatmentTypes]);
        toast.success('Treatment type created successfully!');
      }

      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error saving treatment type:', error);
      toast.error('Failed to save treatment type');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (type: TreatmentType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      category: type.category,
      description: type.description || '',
      default_price: type.default_price,
      process_details: type.process_details || '',
      duration: type.duration || '',
      requirements: type.requirements || '',
      active: type.active
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await db.treatmentTypes.delete(id);

      if (error) {
        console.error('Error deleting treatment type:', error);
        toast.error('Failed to delete treatment type');
        return;
      }

      setTreatmentTypes(treatmentTypes.filter(t => t.id !== id));
      toast.success('Treatment type deleted successfully!');
    } catch (error) {
      console.error('Error deleting treatment type:', error);
      toast.error('Failed to delete treatment type');
    }
  };

  const handleToggleActive = async (type: TreatmentType) => {
    try {
      const { data, error } = await db.treatmentTypes.update(type.id, {
        active: !type.active
      });

      if (error) {
        console.error('Error updating treatment type:', error);
        toast.error('Failed to update status');
        return;
      }

      setTreatmentTypes(treatmentTypes.map(t => t.id === type.id ? data : t));
      toast.success(`Treatment type ${data.active ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error updating treatment type:', error);
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Medical',
      description: '',
      default_price: 0,
      process_details: '',
      duration: '',
      requirements: '',
      active: true
    });
    setEditingType(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Treatment Types Management
            </div>
            <Button onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              {showForm ? 'Hide Form' : 'Add Treatment Type'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add/Edit Form */}
          {showForm && (
            <Card className="mb-6 bg-gray-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">
                    {editingType ? 'Edit Treatment Type' : 'Add New Treatment Type'}
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetForm}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Treatment Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Normal Delivery"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="default_price">Default Price (Rs)</Label>
                      <Input
                        id="default_price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.default_price || ''}
                        onChange={(e) => setFormData({ ...formData, default_price: parseFloat(e.target.value) || 0 })}
                        placeholder="e.g., 5000"
                      />
                    </div>

                    <div>
                      <Label htmlFor="duration">Expected Duration</Label>
                      <Input
                        id="duration"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="e.g., 30 minutes, 2 hours"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the treatment"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="process_details">Process Details</Label>
                    <Textarea
                      id="process_details"
                      value={formData.process_details}
                      onChange={(e) => setFormData({ ...formData, process_details: e.target.value })}
                      placeholder="Detailed process and steps for this treatment"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="requirements">Requirements</Label>
                    <Textarea
                      id="requirements"
                      value={formData.requirements}
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                      placeholder="Required preparations, documents, or conditions"
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                    />
                    <Label htmlFor="active">Active (Available for selection)</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Saving...' : editingType ? 'Update Treatment Type' : 'Create Treatment Type'}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Search by name, category, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterActive} onValueChange={setFilterActive}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <p>Showing {filteredTypes.length} of {treatmentTypes.length} treatment types</p>
            </div>
          </div>

          {/* Treatment Types List */}
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading treatment types...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTypes.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <Activity className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No treatment types found</p>
                  <p className="text-sm mt-2">
                    {searchQuery || filterCategory !== 'all' || filterActive !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Add a new treatment type to get started'
                    }
                  </p>
                </div>
              ) : (
                filteredTypes.map((type) => (
                  <Card key={type.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{type.name}</h3>
                          <Badge variant="outline">{type.category}</Badge>
                          <Badge className={type.active ? 'bg-green-500' : 'bg-gray-500'}>
                            {type.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                          <p><strong>Price:</strong> Rs. {type.default_price.toLocaleString()}</p>
                          {type.duration && <p><strong>Duration:</strong> {type.duration}</p>}
                          {type.description && (
                            <p className="col-span-2"><strong>Description:</strong> {type.description}</p>
                          )}
                          {type.process_details && (
                            <p className="col-span-2"><strong>Process:</strong> {type.process_details}</p>
                          )}
                          {type.requirements && (
                            <p className="col-span-2"><strong>Requirements:</strong> {type.requirements}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(type)}
                        >
                          {type.active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(type)}
                          className="hover:bg-blue-50"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(type.id, type.name)}
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
