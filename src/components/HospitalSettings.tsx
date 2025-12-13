import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Building2, FileText, Palette, Save, Upload } from 'lucide-react';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';

interface HospitalSettingsData {
  id?: string;
  hospital_name: string;
  hospital_name_urdu: string;
  address: string;
  address_urdu: string;
  city: string;
  phone: string;
  phone2: string;
  email: string;
  website: string;
  registration_number: string;
  ntn_number: string;
  license_number: string;
  logo_url: string;
  letterhead_color: string;
  receipt_prefix: string;
  invoice_prefix: string;
  admission_prefix: string;
  discharge_prefix: string;
  prescription_prefix: string;
  print_footer: string;
  print_footer_urdu: string;
}

export default function HospitalSettings() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<HospitalSettingsData>({
    hospital_name: 'North Karachi Hospital',
    hospital_name_urdu: 'نارتھ کراچی ہسپتال',
    address: 'Block A, North Karachi',
    address_urdu: '',
    city: 'Karachi',
    phone: '',
    phone2: '',
    email: '',
    website: '',
    registration_number: '',
    ntn_number: '',
    license_number: '',
    logo_url: '',
    letterhead_color: '#2563eb',
    receipt_prefix: 'RCP',
    invoice_prefix: 'INV',
    admission_prefix: 'ADM',
    discharge_prefix: 'DSC',
    prescription_prefix: 'PRX',
    print_footer: 'Thank you for choosing our services',
    print_footer_urdu: 'ہماری خدمات کا انتخاب کرنے کا شکریہ'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await db.hospitalSettings.get();

      if (error) {
        console.error('Error loading settings:', error);
        toast.error('Failed to load hospital settings');
        return;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load hospital settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data, error } = await db.hospitalSettings.update(settings);

      if (error) {
        console.error('Error saving settings:', error);
        toast.error('Failed to save hospital settings');
        return;
      }

      toast.success('Hospital settings saved successfully!');
      setSettings(data);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save hospital settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, just show the file name
      // In production, upload to Supabase Storage
      toast.info(`Logo file selected: ${file.name}. Upload functionality coming soon!`);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Hospital Settings & Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">
                <Building2 className="h-4 w-4 mr-2" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="branding">
                <Palette className="h-4 w-4 mr-2" />
                Branding
              </TabsTrigger>
              <TabsTrigger value="documents">
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="legal">Legal & Registration</TabsTrigger>
            </TabsList>

            {/* BASIC INFORMATION */}
            <TabsContent value="basic" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hospital_name">Hospital Name (English)</Label>
                  <Input
                    id="hospital_name"
                    value={settings.hospital_name}
                    onChange={(e) => setSettings({ ...settings, hospital_name: e.target.value })}
                    placeholder="North Karachi Hospital"
                  />
                </div>

                <div>
                  <Label htmlFor="hospital_name_urdu">Hospital Name (Urdu)</Label>
                  <Input
                    id="hospital_name_urdu"
                    value={settings.hospital_name_urdu}
                    onChange={(e) => setSettings({ ...settings, hospital_name_urdu: e.target.value })}
                    placeholder="نارتھ کراچی ہسپتال"
                    dir="rtl"
                    className="text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="address">Address (English)</Label>
                  <Textarea
                    id="address"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    placeholder="Block A, North Karachi"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="address_urdu">Address (Urdu)</Label>
                  <Textarea
                    id="address_urdu"
                    value={settings.address_urdu}
                    onChange={(e) => setSettings({ ...settings, address_urdu: e.target.value })}
                    placeholder="بلاک اے، نارتھ کراچی"
                    rows={2}
                    dir="rtl"
                    className="text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={settings.city}
                    onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                    placeholder="Karachi"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    placeholder="info@northkarachihospital.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    placeholder="+92-21-XXXXXXX"
                  />
                </div>

                <div>
                  <Label htmlFor="phone2">Additional Phone</Label>
                  <Input
                    id="phone2"
                    value={settings.phone2}
                    onChange={(e) => setSettings({ ...settings, phone2: e.target.value })}
                    placeholder="+92-XXX-XXXXXXX"
                  />
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={settings.website}
                    onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                    placeholder="www.example.com"
                  />
                </div>
              </div>
            </TabsContent>

            {/* BRANDING */}
            <TabsContent value="branding" className="space-y-4 mt-6">
              <div>
                <Label htmlFor="logo">Hospital Logo</Label>
                <div className="flex items-center gap-4 mt-2">
                  {settings.logo_url && (
                    <div className="w-32 h-32 border rounded-lg flex items-center justify-center bg-gray-50">
                      <img src={settings.logo_url} alt="Hospital Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="mb-2"
                    />
                    <p className="text-sm text-gray-600">Recommended: PNG or SVG, 500x500px minimum</p>
                    <p className="text-sm text-gray-500 mt-1">Or paste logo URL:</p>
                    <Input
                      value={settings.logo_url}
                      onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label htmlFor="letterhead_color">Letterhead Color</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Input
                    id="letterhead_color"
                    type="color"
                    value={settings.letterhead_color}
                    onChange={(e) => setSettings({ ...settings, letterhead_color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={settings.letterhead_color}
                    onChange={(e) => setSettings({ ...settings, letterhead_color: e.target.value })}
                    placeholder="#2563eb"
                    className="flex-1"
                  />
                  <div
                    className="w-32 h-10 rounded border"
                    style={{ backgroundColor: settings.letterhead_color }}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="print_footer">Print Footer (English)</Label>
                  <Textarea
                    id="print_footer"
                    value={settings.print_footer}
                    onChange={(e) => setSettings({ ...settings, print_footer: e.target.value })}
                    placeholder="Thank you for choosing our services"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="print_footer_urdu">Print Footer (Urdu)</Label>
                  <Textarea
                    id="print_footer_urdu"
                    value={settings.print_footer_urdu}
                    onChange={(e) => setSettings({ ...settings, print_footer_urdu: e.target.value })}
                    placeholder="ہماری خدمات کا انتخاب کرنے کا شکریہ"
                    rows={2}
                    dir="rtl"
                    className="text-right"
                  />
                </div>
              </div>
            </TabsContent>

            {/* DOCUMENT SETTINGS */}
            <TabsContent value="documents" className="space-y-4 mt-6">
              <p className="text-sm text-gray-600 mb-4">
                Configure document number prefixes for automatic numbering (e.g., RCP-000123)
              </p>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="receipt_prefix">Receipt Prefix</Label>
                  <Input
                    id="receipt_prefix"
                    value={settings.receipt_prefix}
                    onChange={(e) => setSettings({ ...settings, receipt_prefix: e.target.value.toUpperCase() })}
                    placeholder="RCP"
                    maxLength={10}
                  />
                  <p className="text-xs text-gray-500 mt-1">Example: RCP-000123</p>
                </div>

                <div>
                  <Label htmlFor="invoice_prefix">Invoice Prefix</Label>
                  <Input
                    id="invoice_prefix"
                    value={settings.invoice_prefix}
                    onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value.toUpperCase() })}
                    placeholder="INV"
                    maxLength={10}
                  />
                  <p className="text-xs text-gray-500 mt-1">Example: INV-000123</p>
                </div>

                <div>
                  <Label htmlFor="admission_prefix">Admission Prefix</Label>
                  <Input
                    id="admission_prefix"
                    value={settings.admission_prefix}
                    onChange={(e) => setSettings({ ...settings, admission_prefix: e.target.value.toUpperCase() })}
                    placeholder="ADM"
                    maxLength={10}
                  />
                  <p className="text-xs text-gray-500 mt-1">Example: ADM-000123</p>
                </div>

                <div>
                  <Label htmlFor="discharge_prefix">Discharge Prefix</Label>
                  <Input
                    id="discharge_prefix"
                    value={settings.discharge_prefix}
                    onChange={(e) => setSettings({ ...settings, discharge_prefix: e.target.value.toUpperCase() })}
                    placeholder="DSC"
                    maxLength={10}
                  />
                  <p className="text-xs text-gray-500 mt-1">Example: DSC-000123</p>
                </div>

                <div>
                  <Label htmlFor="prescription_prefix">Prescription Prefix</Label>
                  <Input
                    id="prescription_prefix"
                    value={settings.prescription_prefix}
                    onChange={(e) => setSettings({ ...settings, prescription_prefix: e.target.value.toUpperCase() })}
                    placeholder="PRX"
                    maxLength={10}
                  />
                  <p className="text-xs text-gray-500 mt-1">Example: PRX-000123</p>
                </div>
              </div>
            </TabsContent>

            {/* LEGAL & REGISTRATION */}
            <TabsContent value="legal" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="registration_number">Hospital Registration Number</Label>
                  <Input
                    id="registration_number"
                    value={settings.registration_number}
                    onChange={(e) => setSettings({ ...settings, registration_number: e.target.value })}
                    placeholder="REG-12345"
                  />
                </div>

                <div>
                  <Label htmlFor="ntn_number">NTN Number</Label>
                  <Input
                    id="ntn_number"
                    value={settings.ntn_number}
                    onChange={(e) => setSettings({ ...settings, ntn_number: e.target.value })}
                    placeholder="1234567-8"
                  />
                </div>

                <div>
                  <Label htmlFor="license_number">Medical License Number</Label>
                  <Input
                    id="license_number"
                    value={settings.license_number}
                    onChange={(e) => setSettings({ ...settings, license_number: e.target.value })}
                    placeholder="LIC-XXXXX"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> These legal details will appear on official documents, receipts, and discharge summaries.
                  Make sure they are accurate and up-to-date.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <Separator className="my-6" />

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading} size="lg">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
