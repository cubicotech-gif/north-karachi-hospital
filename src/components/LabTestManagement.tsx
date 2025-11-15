import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { TestTube, Plus, Edit, Trash2, Clock, Beaker } from 'lucide-react';
import { LabTest, mockLabTests, mockDepartments, generateId, formatCurrency } from '@/lib/hospitalData';
import { toast } from 'sonner';

export default function LabTestManagement() {
  const [labTests, setLabTests] = useState<LabTest[]>(mockLabTests);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTest, setEditingTest] = useState<LabTest | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string>('All');
  const [newTest, setNewTest] = useState<Partial<LabTest>>({
    name: '',
    price: 0,
    department: 'Pathology',
    normalRange: '',
    description: '',
    sampleType: 'Blood',
    reportTime: '2-4 hours',
    active: true
  });

  const sampleTypes = ['Blood', 'Urine', 'Stool', 'Imaging', 'Cardiac Test', 'Biopsy', 'Culture'];
  const reportTimes = ['15 minutes', '30 minutes', '1-2 hours', '2-4 hours', '4-6 hours', '6-8 hours', '24 hours', '2-3 days'];

  const handleAddTest = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTest.name || !newTest.price || !newTest.department) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if test name already exists
    if (labTests.some(test => test.name.toLowerCase() === newTest.name?.toLowerCase())) {
      toast.error('Test with this name already exists');
      return;
    }

    const test: LabTest = {
      id: generateId(),
      name: newTest.name,
      price: newTest.price,
      department: newTest.department,
      normalRange: newTest.normalRange,
      description: newTest.description,
      sampleType: newTest.sampleType || 'Blood',
      reportTime: newTest.reportTime || '2-4 hours',
      active: true
    };

    setLabTests([...labTests, test]);
    toast.success('Lab test added successfully!');
    
    // Reset form
    setNewTest({
      name: '',
      price: 0,
      department: 'Pathology',
      normalRange: '',
      description: '',
      sampleType: 'Blood',
      reportTime: '2-4 hours',
      active: true
    });
    setShowAddForm(false);
  };

  const handleEditTest = (test: LabTest) => {
    setEditingTest(test);
    setNewTest(test);
    setShowAddForm(true);
  };

  const handleUpdateTest = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTest || !newTest.name || !newTest.price || !newTest.department) {
      toast.error('Please fill in all required fields');
      return;
    }

    const updatedTests = labTests.map(test => 
      test.id === editingTest.id 
        ? { ...test, ...newTest }
        : test
    );

    setLabTests(updatedTests);
    toast.success('Lab test updated successfully!');
    
    // Reset form
    setNewTest({
      name: '',
      price: 0,
      department: 'Pathology',
      normalRange: '',
      description: '',
      sampleType: 'Blood',
      reportTime: '2-4 hours',
      active: true
    });
    setShowAddForm(false);
    setEditingTest(null);
  };

  const toggleTestStatus = (testId: string) => {
    const updatedTests = labTests.map(test => 
      test.id === testId 
        ? { ...test, active: !test.active }
        : test
    );
    
    setLabTests(updatedTests);
    const test = labTests.find(t => t.id === testId);
    if (test) {
      toast.success(`${test.name} ${!test.active ? 'activated' : 'deactivated'}`);
    }
  };

  const deleteTest = (testId: string) => {
    const updatedTests = labTests.filter(test => test.id !== testId);
    setLabTests(updatedTests);
    toast.success('Lab test deleted successfully!');
  };

  const filteredTests = filterDepartment === 'All' 
    ? labTests 
    : labTests.filter(test => test.department === filterDepartment);

  const labDepartments = [...new Set(labTests.map(test => test.department))];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Lab Test Management
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Lab Test
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <form onSubmit={editingTest ? handleUpdateTest : handleAddTest} className="space-y-4 mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold">
                {editingTest ? 'Edit Lab Test' : 'Add New Lab Test'}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="testName">Test Name *</Label>
                  <Input
                    id="testName"
                    value={newTest.name}
                    onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                    placeholder="e.g., Complete Blood Count"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newTest.price}
                    onChange={(e) => setNewTest({ ...newTest, price: parseInt(e.target.value) })}
                    placeholder="300"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Select value={newTest.department} onValueChange={(value) => setNewTest({ ...newTest, department: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pathology">Pathology</SelectItem>
                      <SelectItem value="Radiology">Radiology</SelectItem>
                      <SelectItem value="Cardiology">Cardiology</SelectItem>
                      <SelectItem value="Microbiology">Microbiology</SelectItem>
                      <SelectItem value="Biochemistry">Biochemistry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sampleType">Sample Type</Label>
                  <Select value={newTest.sampleType} onValueChange={(value) => setNewTest({ ...newTest, sampleType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sampleTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reportTime">Report Time</Label>
                  <Select value={newTest.reportTime} onValueChange={(value) => setNewTest({ ...newTest, reportTime: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTimes.map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="normalRange">Normal Range</Label>
                  <Input
                    id="normalRange"
                    value={newTest.normalRange}
                    onChange={(e) => setNewTest({ ...newTest, normalRange: e.target.value })}
                    placeholder="e.g., 70-100 mg/dL"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTest.description}
                  onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                  placeholder="Brief description of the test..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingTest ? 'Update Test' : 'Add Test'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingTest(null);
                    setNewTest({
                      name: '',
                      price: 0,
                      department: 'Pathology',
                      normalRange: '',
                      description: '',
                      sampleType: 'Blood',
                      reportTime: '2-4 hours',
                      active: true
                    });
                  }}
                >
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
                {labDepartments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tests List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTests.map((test) => (
              <Card key={test.id} className={`p-4 ${!test.active ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">{test.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {test.department}
                      </Badge>
                      <Badge variant={test.active ? 'default' : 'secondary'} className="text-xs">
                        {test.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-medium">{formatCurrency(test.price)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sample:</span>
                    <span>{test.sampleType}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-600">{test.reportTime}</span>
                  </div>
                  
                  {test.normalRange && (
                    <div className="text-xs text-gray-600">
                      <strong>Normal:</strong> {test.normalRange}
                    </div>
                  )}
                  
                  {test.description && (
                    <div className="text-xs text-gray-600 mt-2">
                      {test.description}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={test.active}
                      onCheckedChange={() => toggleTestStatus(test.id)}
                      size="sm"
                    />
                    <span className="text-xs">{test.active ? 'Active' : 'Inactive'}</span>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditTest(test)}
                      className="h-7 px-2"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteTest(test.id)}
                      className="h-7 px-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
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
            <Beaker className="h-5 w-5" />
            Lab Test Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{labTests.length}</p>
              <p className="text-sm text-gray-600">Total Tests</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {labTests.filter(t => t.active).length}
              </p>
              <p className="text-sm text-gray-600">Active Tests</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{labDepartments.length}</p>
              <p className="text-sm text-gray-600">Departments</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(Math.round(labTests.reduce((sum, test) => sum + test.price, 0) / labTests.length))}
              </p>
              <p className="text-sm text-gray-600">Avg. Price</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}