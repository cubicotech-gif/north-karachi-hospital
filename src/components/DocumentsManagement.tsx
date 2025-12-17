import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Upload,
  Trash2,
  Eye,
  Download,
  FileCheck,
  Receipt,
  TestTube,
  ClipboardList,
  Pill,
  FileImage,
  Award,
  File,
  Settings,
  Link as LinkIcon,
} from 'lucide-react';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';

interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  active: boolean;
}

interface DocumentTemplate {
  id: string;
  category_id: string;
  name: string;
  description: string;
  file_url: string;
  file_type: string;
  file_size: number;
  thumbnail_url: string;
  is_default: boolean;
  active: boolean;
  created_at: string;
}

interface TemplateMapping {
  id: string;
  template_id: string;
  module_name: string;
  document_type: string;
  is_active: boolean;
}

const iconMap: { [key: string]: React.ReactNode } = {
  Receipt: <Receipt className="h-5 w-5" />,
  FileCheck: <FileCheck className="h-5 w-5" />,
  FileText: <FileText className="h-5 w-5" />,
  TestTube: <TestTube className="h-5 w-5" />,
  ClipboardList: <ClipboardList className="h-5 w-5" />,
  Pill: <Pill className="h-5 w-5" />,
  FileImage: <FileImage className="h-5 w-5" />,
  Award: <Award className="h-5 w-5" />,
  File: <File className="h-5 w-5" />,
};

const moduleOptions = [
  { value: 'billing', label: 'Billing & Invoices' },
  { value: 'admission', label: 'Patient Admission' },
  { value: 'discharge', label: 'Patient Discharge' },
  { value: 'lab', label: 'Lab Management' },
  { value: 'treatment', label: 'Treatment Management' },
  { value: 'opd', label: 'OPD' },
  { value: 'pharmacy', label: 'Pharmacy' },
];

const documentTypeOptions = [
  { value: 'receipt', label: 'Receipt' },
  { value: 'consent_form', label: 'Consent Form' },
  { value: 'discharge_summary', label: 'Discharge Summary' },
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'admission_form', label: 'Admission Form' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'other', label: 'Other' },
];

export default function DocumentsManagement() {
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [mappings, setMappings] = useState<TemplateMapping[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    category_id: '',
    file: null as File | null,
  });

  // Mapping form state
  const [mappingForm, setMappingForm] = useState({
    template_id: '',
    module_name: '',
    document_type: '',
  });

  useEffect(() => {
    fetchCategories();
    fetchTemplates();
    fetchMappings();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await db.supabase
        .from('document_categories')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load document categories');
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await db.supabase
        .from('document_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    }
  };

  const fetchMappings = async () => {
    try {
      const { data, error } = await db.supabase
        .from('document_template_mappings')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setMappings(data || []);
    } catch (error) {
      console.error('Error fetching mappings:', error);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadForm.file || !uploadForm.name || !uploadForm.category_id) {
      toast.error('Please fill all required fields');
      return;
    }

    setUploadLoading(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = uploadForm.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { data: uploadData, error: uploadError } = await db.supabase.storage
        .from('hospital-documents')
        .upload(filePath, uploadForm.file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload file. Please ensure storage bucket exists.');
        setUploadLoading(false);
        return;
      }

      // Get public URL
      const { data: urlData } = db.supabase.storage
        .from('hospital-documents')
        .getPublicUrl(filePath);

      // Save template metadata to database
      const { data: templateData, error: templateError } = await db.supabase
        .from('document_templates')
        .insert({
          name: uploadForm.name,
          description: uploadForm.description,
          category_id: uploadForm.category_id,
          file_url: urlData.publicUrl,
          file_type: uploadForm.file.type,
          file_size: uploadForm.file.size,
          active: true,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      toast.success('Document template uploaded successfully!');

      // Reset form
      setUploadForm({
        name: '',
        description: '',
        category_id: '',
        file: null,
      });

      // Refresh templates
      fetchTemplates();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleCreateMapping = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mappingForm.template_id || !mappingForm.module_name || !mappingForm.document_type) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      const { error } = await db.supabase
        .from('document_template_mappings')
        .insert({
          template_id: mappingForm.template_id,
          module_name: mappingForm.module_name,
          document_type: mappingForm.document_type,
          is_active: true,
        });

      if (error) throw error;

      toast.success('Template linked to module successfully!');

      // Reset form
      setMappingForm({
        template_id: '',
        module_name: '',
        document_type: '',
      });

      fetchMappings();
    } catch (error) {
      console.error('Error creating mapping:', error);
      toast.error('Failed to link template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const { error } = await db.supabase
        .from('document_templates')
        .update({ active: false })
        .eq('id', templateId);

      if (error) throw error;

      toast.success('Template deleted successfully');
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleDeleteMapping = async (mappingId: string) => {
    try {
      const { error } = await db.supabase
        .from('document_template_mappings')
        .delete()
        .eq('id', mappingId);

      if (error) throw error;

      toast.success('Mapping removed successfully');
      fetchMappings();
    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast.error('Failed to remove mapping');
    }
  };

  const getTemplatesByCategory = (categoryId: string) => {
    return templates.filter(t => t.category_id === categoryId && t.active);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    return template?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Documents & Paperwork Management
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Upload and manage all hospital documents, templates, and paperwork. Connect templates to specific modules for automated document generation.
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload Documents</TabsTrigger>
          <TabsTrigger value="templates">View Templates</TabsTrigger>
          <TabsTrigger value="mappings">Module Connections</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        {/* Upload Documents Tab */}
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload New Document Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <Label htmlFor="templateName">Template Name *</Label>
                  <Input
                    id="templateName"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                    placeholder="e.g., Receipt Template - Urdu/English"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Document Category *</Label>
                  <Select
                    value={uploadForm.category_id}
                    onValueChange={(value) => setUploadForm({ ...uploadForm, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    placeholder="Brief description of this template..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="file">Upload File (PDF, Image, Word) *</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                    required
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Supported formats: PDF, PNG, JPG, DOC, DOCX (Max 10MB)
                  </p>
                </div>

                <Button type="submit" disabled={uploadLoading} className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadLoading ? 'Uploading...' : 'Upload Template'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* View Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>All Document Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {categories.map((category) => {
                  const categoryTemplates = getTemplatesByCategory(category.id);
                  if (categoryTemplates.length === 0) return null;

                  return (
                    <div key={category.id}>
                      <div className="flex items-center gap-2 mb-3">
                        {iconMap[category.icon]}
                        <h3 className="text-lg font-semibold">{category.name}</h3>
                        <Badge variant="outline">{categoryTemplates.length}</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryTemplates.map((template) => (
                          <Card key={template.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-medium">{template.name}</h4>
                                  {template.is_default && (
                                    <Badge variant="default" className="text-xs">Default</Badge>
                                  )}
                                </div>

                                {template.description && (
                                  <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                                )}

                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>{template.file_type.split('/')[1]?.toUpperCase()}</span>
                                  <span>•</span>
                                  <span>{(template.file_size / 1024).toFixed(1)} KB</span>
                                </div>

                                <div className="flex gap-2 pt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(template.file_url, '_blank')}
                                    className="flex-1"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteTemplate(template.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      <Separator className="mt-4" />
                    </div>
                  );
                })}

                {templates.filter(t => t.active).length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No templates uploaded yet</p>
                    <p className="text-sm">Upload your first template to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Module Connections Tab */}
        <TabsContent value="mappings">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" />
                  Link Template to Module
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateMapping} className="space-y-4">
                  <div>
                    <Label htmlFor="template">Select Template *</Label>
                    <Select
                      value={mappingForm.template_id}
                      onValueChange={(value) => setMappingForm({ ...mappingForm, template_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.filter(t => t.active).map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name} ({getCategoryName(template.category_id)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="module">Module *</Label>
                    <Select
                      value={mappingForm.module_name}
                      onValueChange={(value) => setMappingForm({ ...mappingForm, module_name: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select module..." />
                      </SelectTrigger>
                      <SelectContent>
                        {moduleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="docType">Document Type *</Label>
                    <Select
                      value={mappingForm.document_type}
                      onValueChange={(value) => setMappingForm({ ...mappingForm, document_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" className="w-full">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Create Connection
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Module Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mappings.map((mapping) => (
                    <div
                      key={mapping.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{getTemplateName(mapping.template_id)}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Badge variant="outline">{mapping.module_name}</Badge>
                          <span>→</span>
                          <Badge variant="secondary">{mapping.document_type}</Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMapping(mapping.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {mappings.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <LinkIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>No connections created yet</p>
                      <p className="text-sm">Link templates to modules to enable automated document generation</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Document Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <Card key={category.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {iconMap[category.icon]}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{category.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                          <Badge variant="outline" className="mt-2">
                            {getTemplatesByCategory(category.id).length} templates
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
