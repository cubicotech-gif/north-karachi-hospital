import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import {
  Baby,
  Search,
  User,
  FileText,
  Activity,
  TestTube,
  Heart,
  Calendar,
  Scale,
  Clock,
  Printer,
  ExternalLink,
  RefreshCw,
  Stethoscope,
  AlertCircle,
  UserPlus,
  Building,
  Phone
} from 'lucide-react';
import { db } from '@/lib/supabase';
import NICUObservationForm from './NICUObservationForm';
import BirthCertificateTemplate from './documents/BirthCertificateTemplate';

interface NewbornBaby {
  id: string;
  name: string;
  mr_number: string;
  gender: string;
  age: number;
  contact: string;
  address: string;
  care_of: string;
  father_name?: string;
  medical_history: string;
  mother_patient_id: string;
  patient_type: string;
  is_external_admission?: boolean;
  referral_source?: string;
  referral_notes?: string;
  date_of_birth?: string;
  created_at: string;
  mother?: {
    name: string;
    mr_number: string;
  };
}

interface ExternalNewbornForm {
  name: string;
  gender: string;
  date_of_birth: string;
  weight_kg: string;
  weight_grams: string;
  mother_name: string;
  father_name: string;
  contact: string;
  address: string;
  referral_source: string;
  referral_notes: string;
  medical_history: string;
}

interface DeliveryRecord {
  id: string;
  delivery_date: string;
  delivery_time: string;
  delivery_type: string;
  baby_gender: string;
  baby_weight_kg: number;
  baby_weight_grams: number;
  apgar_score_1min: number;
  apgar_score_5min: number;
  baby_condition: string;
  birth_certificate_number: string;
  delivering_doctor_id: string;
  notes: string;
  mother_patient_id: string;
  baby_patient_id: string;
}

interface NewbornBabyModuleProps {
  onNavigateToPatient?: (patientId: string) => void;
}

const initialExternalForm: ExternalNewbornForm = {
  name: '',
  gender: '',
  date_of_birth: new Date().toISOString().split('T')[0],
  weight_kg: '',
  weight_grams: '',
  mother_name: '',
  father_name: '',
  contact: '',
  address: '',
  referral_source: '',
  referral_notes: '',
  medical_history: ''
};

const NewbornBabyModule: React.FC<NewbornBabyModuleProps> = ({ onNavigateToPatient }) => {
  const [newborns, setNewborns] = useState<NewbornBaby[]>([]);
  const [filteredNewborns, setFilteredNewborns] = useState<NewbornBaby[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBaby, setSelectedBaby] = useState<NewbornBaby | null>(null);
  const [showBabyDetails, setShowBabyDetails] = useState(false);
  const [showNICUForm, setShowNICUForm] = useState(false);
  const [deliveryRecord, setDeliveryRecord] = useState<DeliveryRecord | null>(null);
  const [motherInfo, setMotherInfo] = useState<any>(null);
  const [nicuObservations, setNicuObservations] = useState<any[]>([]);
  const [showBirthCertificate, setShowBirthCertificate] = useState(false);
  const birthCertificateRef = useRef<HTMLDivElement>(null);

  // External Newborn Registration
  const [showExternalForm, setShowExternalForm] = useState(false);
  const [externalForm, setExternalForm] = useState<ExternalNewbornForm>(initialExternalForm);
  const [savingExternal, setSavingExternal] = useState(false);

  useEffect(() => {
    loadNewborns();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredNewborns(newborns);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredNewborns(
        newborns.filter(
          (baby) =>
            baby.name.toLowerCase().includes(query) ||
            baby.mr_number.toLowerCase().includes(query) ||
            baby.mother?.name?.toLowerCase().includes(query) ||
            baby.mother?.mr_number?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, newborns]);

  const loadNewborns = async () => {
    setLoading(true);
    try {
      const { data, error } = await db.babyPatients.getAllNewborns();
      if (error) throw error;
      setNewborns(data || []);
      setFilteredNewborns(data || []);
    } catch (error) {
      console.error('Error loading newborns:', error);
      toast.error('Failed to load newborn babies');
    } finally {
      setLoading(false);
    }
  };

  const loadBabyDetails = async (baby: NewbornBaby) => {
    try {
      // Load delivery record for this baby
      const { data: deliveryData, error: deliveryError } = await db.deliveryRecords.getByBabyPatientId(baby.id);
      if (!deliveryError && deliveryData) {
        setDeliveryRecord(deliveryData);
      }

      // Load mother info
      if (baby.mother_patient_id) {
        const { data: motherData, error: motherError } = await db.patients.getById(baby.mother_patient_id);
        if (!motherError && motherData) {
          setMotherInfo(motherData);
        }
      }

      // Load NICU observations
      const { data: nicuData, error: nicuError } = await db.nicuObservations.getByBabyPatientId(baby.id);
      if (!nicuError) {
        setNicuObservations(nicuData || []);
      }
    } catch (error) {
      console.error('Error loading baby details:', error);
    }
  };

  const handleSelectBaby = async (baby: NewbornBaby) => {
    setSelectedBaby(baby);
    setDeliveryRecord(null);
    setMotherInfo(null);
    setNicuObservations([]);
    await loadBabyDetails(baby);
    setShowBabyDetails(true);
  };

  const handleOpenBabyFile = () => {
    if (selectedBaby && onNavigateToPatient) {
      onNavigateToPatient(selectedBaby.id);
      setShowBabyDetails(false);
    }
  };

  const handleOpenMotherFile = () => {
    if (selectedBaby?.mother_patient_id && onNavigateToPatient) {
      onNavigateToPatient(selectedBaby.mother_patient_id);
      setShowBabyDetails(false);
    }
  };

  const handleNICUAdmit = () => {
    setShowNICUForm(true);
  };

  // Handle External Newborn Registration
  const handleRegisterExternalNewborn = async () => {
    // Validate required fields
    if (!externalForm.gender) {
      toast.error('Please select baby gender');
      return;
    }
    if (!externalForm.mother_name.trim()) {
      toast.error('Mother name is required');
      return;
    }
    if (!externalForm.contact.trim()) {
      toast.error('Contact number is required');
      return;
    }

    setSavingExternal(true);
    try {
      // Generate baby name if not provided
      const babyName = externalForm.name.trim() || `Baby of ${externalForm.mother_name.trim()}`;

      // Build medical history with weight info
      let medicalHistory = externalForm.medical_history || '';
      if (externalForm.weight_kg || externalForm.weight_grams) {
        const weightInfo = `Birth Weight: ${externalForm.weight_kg || '0'}.${externalForm.weight_grams || '0'} kg`;
        medicalHistory = medicalHistory ? `${weightInfo}\n\n${medicalHistory}` : weightInfo;
      }

      const { data, error } = await db.babyPatients.createExternalNewborn({
        name: babyName,
        gender: externalForm.gender,
        contact: externalForm.contact.trim(),
        father_name: externalForm.father_name.trim() || undefined,
        care_of: externalForm.mother_name.trim(), // Mother name goes in care_of
        address: externalForm.address.trim() || undefined,
        referral_source: externalForm.referral_source.trim() || undefined,
        referral_notes: externalForm.referral_notes.trim() || undefined,
        medical_history: medicalHistory || undefined
      });

      if (error) {
        console.error('Error registering external newborn:', error);
        toast.error('Failed to register baby');
        return;
      }

      toast.success(`Baby registered successfully! MR#: ${data.mr_number}`);
      setShowExternalForm(false);
      setExternalForm(initialExternalForm);
      loadNewborns();

      // Optionally open the baby details
      if (data) {
        setSelectedBaby(data);
        setShowBabyDetails(true);
      }
    } catch (error) {
      console.error('Error registering external newborn:', error);
      toast.error('Failed to register baby');
    } finally {
      setSavingExternal(false);
    }
  };

  const handlePrintBirthCertificate = useReactToPrint({
    contentRef: birthCertificateRef,
    documentTitle: `Birth_Certificate_${selectedBaby?.mr_number || 'Baby'}`,
    onAfterPrint: () => {
      toast.success('Birth certificate printed successfully');
    }
  });

  const openBirthCertificate = () => {
    setShowBirthCertificate(true);
    setTimeout(() => {
      handlePrintBirthCertificate();
    }, 500);
  };

  const getBirthCertificateData = () => {
    if (!selectedBaby || !deliveryRecord) return null;

    const birthDate = new Date(deliveryRecord.delivery_date);
    const weightKg = deliveryRecord.baby_weight_kg || 0;
    const weightGrams = deliveryRecord.baby_weight_grams || Math.round((weightKg % 1) * 1000);

    return {
      serialNumber: deliveryRecord.birth_certificate_number || 'N/A',
      date: new Date().toLocaleDateString('en-GB'),
      babyGender: deliveryRecord.baby_gender as 'Male' | 'Female',
      weightKg: Math.floor(weightKg),
      weightGrams: weightGrams,
      motherName: motherInfo?.name || selectedBaby.care_of || '',
      fatherName: motherInfo?.care_of || '',
      address: motherInfo?.address || selectedBaby.address || '',
      birthDay: birthDate.getDate().toString(),
      birthMonth: (birthDate.getMonth() + 1).toString(),
      birthYear: birthDate.getFullYear().toString(),
      birthTime: deliveryRecord.delivery_time || '',
      attendingObstetrician: ''
    };
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const getAgeInDays = (createdAt: string) => {
    const birth = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - birth.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-pink-50 to-blue-50 border-pink-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-pink-100 rounded-full">
                <Baby className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-pink-800">Newborn Baby Module</CardTitle>
                <p className="text-sm text-pink-600">Manage all newborn babies and their records</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowExternalForm(true)}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Register External Baby
              </Button>
              <Button
                onClick={loadNewborns}
                variant="outline"
                size="sm"
                className="border-pink-300 hover:bg-pink-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by baby name, MR number, or mother's name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Card className="border-l-4 border-l-pink-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Newborns</p>
                <p className="text-2xl font-bold text-pink-600">{newborns.length}</p>
              </div>
              <Baby className="h-8 w-8 text-pink-300" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-blue-600">
                  {newborns.filter(b => {
                    const created = new Date(b.created_at);
                    const now = new Date();
                    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Newborn List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-pink-500" />
            Newborn Babies ({filteredNewborns.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-pink-400 mx-auto mb-2" />
              <p className="text-gray-500">Loading newborns...</p>
            </div>
          ) : filteredNewborns.length === 0 ? (
            <div className="text-center py-8">
              <Baby className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">
                {searchQuery ? 'No newborns found matching your search' : 'No newborn babies registered yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNewborns.map((baby) => (
                <Card
                  key={baby.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-pink-300"
                  onClick={() => handleSelectBaby(baby)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-full ${baby.gender === 'Male' ? 'bg-blue-100' : 'bg-pink-100'}`}>
                          <Baby className={`h-4 w-4 ${baby.gender === 'Male' ? 'text-blue-600' : 'text-pink-600'}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{baby.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{baby.mr_number}</p>
                        </div>
                      </div>
                      <Badge variant={baby.gender === 'Male' ? 'default' : 'secondary'} className={baby.gender === 'Male' ? 'bg-blue-500' : 'bg-pink-500'}>
                        {baby.gender}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="h-3 w-3" />
                        <span>Mother: {baby.mother?.name || baby.care_of || 'N/A'}</span>
                      </div>
                      {baby.mother?.mr_number && (
                        <div className="flex items-center gap-2 text-gray-500">
                          <FileText className="h-3 w-3" />
                          <span className="font-mono text-xs">{baby.mother.mr_number}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>Age: {getAgeInDays(baby.created_at)} days</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-3 w-3" />
                        <span>Born: {formatDate(baby.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectBaby(baby);
                        }}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs border-orange-300 text-orange-600 hover:bg-orange-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBaby(baby);
                          loadBabyDetails(baby);
                          setShowNICUForm(true);
                        }}
                      >
                        <Heart className="h-3 w-3 mr-1" />
                        NICU
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Baby Details Dialog */}
      <Dialog open={showBabyDetails} onOpenChange={setShowBabyDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${selectedBaby?.gender === 'Male' ? 'bg-blue-100' : 'bg-pink-100'}`}>
                <Baby className={`h-5 w-5 ${selectedBaby?.gender === 'Male' ? 'text-blue-600' : 'text-pink-600'}`} />
              </div>
              <div>
                <span>{selectedBaby?.name}</span>
                <span className="ml-2 text-sm font-mono text-gray-500">{selectedBaby?.mr_number}</span>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedBaby && (
            <Tabs defaultValue="info" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">Baby Info</TabsTrigger>
                <TabsTrigger value="birth">Birth Details</TabsTrigger>
                <TabsTrigger value="nicu">NICU Records</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-500">Baby Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedBaby.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">MR Number:</span>
                        <span className="font-mono">{selectedBaby.mr_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gender:</span>
                        <Badge variant={selectedBaby.gender === 'Male' ? 'default' : 'secondary'}>
                          {selectedBaby.gender}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Age:</span>
                        <span>{getAgeInDays(selectedBaby.created_at)} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date of Birth:</span>
                        <span>{formatDate(selectedBaby.created_at)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-500">Mother Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{motherInfo?.name || selectedBaby.care_of || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">MR Number:</span>
                        <span className="font-mono">{motherInfo?.mr_number || selectedBaby.mother?.mr_number || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contact:</span>
                        <span>{motherInfo?.contact || selectedBaby.contact || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Address:</span>
                        <span className="text-right text-sm">{motherInfo?.address || selectedBaby.address || 'N/A'}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={handleOpenMotherFile}
                        disabled={!selectedBaby.mother_patient_id}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Mother's File
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {selectedBaby.medical_history && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-500">Medical Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedBaby.medical_history}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="birth" className="mt-4 space-y-4">
                {deliveryRecord ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Heart className="h-5 w-5 text-red-500" />
                        Delivery Record
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Delivery Date</p>
                          <p className="font-medium">{formatDate(deliveryRecord.delivery_date)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Delivery Time</p>
                          <p className="font-medium">{formatTime(deliveryRecord.delivery_time)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Delivery Type</p>
                          <Badge>{deliveryRecord.delivery_type}</Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Weight</p>
                          <p className="font-medium flex items-center gap-1">
                            <Scale className="h-4 w-4" />
                            {deliveryRecord.baby_weight_kg} kg ({deliveryRecord.baby_weight_grams || Math.round((deliveryRecord.baby_weight_kg % 1) * 1000)} g)
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">APGAR Score (1 min)</p>
                          <p className="font-medium">{deliveryRecord.apgar_score_1min || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">APGAR Score (5 min)</p>
                          <p className="font-medium">{deliveryRecord.apgar_score_5min || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Condition at Birth</p>
                          <p className="font-medium">{deliveryRecord.baby_condition || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Birth Certificate No.</p>
                          <p className="font-mono font-medium">{deliveryRecord.birth_certificate_number || 'Not assigned'}</p>
                        </div>
                      </div>

                      {deliveryRecord.notes && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm text-gray-500 mb-1">Notes</p>
                          <p className="text-sm">{deliveryRecord.notes}</p>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t">
                        <Button onClick={openBirthCertificate} className="bg-green-600 hover:bg-green-700">
                          <Printer className="h-4 w-4 mr-2" />
                          Print Birth Certificate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No delivery record found for this baby</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="nicu" className="mt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">NICU Observations</h3>
                  <Button onClick={handleNICUAdmit} className="bg-orange-500 hover:bg-orange-600">
                    <Heart className="h-4 w-4 mr-2" />
                    Add NICU Observation
                  </Button>
                </div>

                {nicuObservations.length > 0 ? (
                  <div className="space-y-3">
                    {nicuObservations.map((obs) => (
                      <Card key={obs.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-medium">{formatDate(obs.observation_date)}</p>
                              <p className="text-sm text-gray-500">
                                {formatTime(obs.start_time)} - {obs.end_time ? formatTime(obs.end_time) : 'Ongoing'}
                              </p>
                            </div>
                            <Badge variant={obs.condition === 'Stable' ? 'default' : 'destructive'}>
                              {obs.condition}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500">Temp:</span>
                              <span className="ml-1 font-medium">{obs.temperature}°C</span>
                            </div>
                            <div>
                              <span className="text-gray-500">HR:</span>
                              <span className="ml-1 font-medium">{obs.heart_rate} bpm</span>
                            </div>
                            <div>
                              <span className="text-gray-500">RR:</span>
                              <span className="ml-1 font-medium">{obs.respiratory_rate}/min</span>
                            </div>
                            <div>
                              <span className="text-gray-500">SpO2:</span>
                              <span className="ml-1 font-medium">{obs.oxygen_saturation}%</span>
                            </div>
                          </div>
                          {obs.hours_charged > 0 && (
                            <div className="mt-2 pt-2 border-t text-sm">
                              <span className="text-gray-500">Charges:</span>
                              <span className="ml-1 font-medium text-green-600">
                                Rs. {obs.total_charge?.toLocaleString()} ({obs.hours_charged} hrs @ Rs. {obs.hourly_rate}/hr)
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Heart className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No NICU observations recorded</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="actions" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                    <p className="text-sm text-gray-500">
                      All charges will be linked to mother's file: <strong>{motherInfo?.name || selectedBaby.care_of}</strong>
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <Button
                        variant="outline"
                        className="h-24 flex flex-col gap-2"
                        onClick={handleOpenBabyFile}
                      >
                        <FileText className="h-8 w-8 text-blue-600" />
                        <span className="text-sm">Open Baby File</span>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-24 flex flex-col gap-2"
                        onClick={handleOpenMotherFile}
                        disabled={!selectedBaby.mother_patient_id}
                      >
                        <User className="h-8 w-8 text-purple-600" />
                        <span className="text-sm">Open Mother File</span>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-24 flex flex-col gap-2 border-orange-300 hover:bg-orange-50"
                        onClick={handleNICUAdmit}
                      >
                        <Heart className="h-8 w-8 text-orange-600" />
                        <span className="text-sm">NICU Observation</span>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-24 flex flex-col gap-2 border-teal-300 hover:bg-teal-50"
                        onClick={() => {
                          toast.info('Navigate to Treatment module with baby selected');
                          // This would typically navigate to treatment module with baby pre-selected
                        }}
                      >
                        <Activity className="h-8 w-8 text-teal-600" />
                        <span className="text-sm">Add Treatment</span>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-24 flex flex-col gap-2 border-purple-300 hover:bg-purple-50"
                        onClick={() => {
                          toast.info('Navigate to Lab module with baby selected');
                          // This would typically navigate to lab module with baby pre-selected
                        }}
                      >
                        <TestTube className="h-8 w-8 text-purple-600" />
                        <span className="text-sm">Order Lab Test</span>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-24 flex flex-col gap-2 border-green-300 hover:bg-green-50"
                        onClick={openBirthCertificate}
                        disabled={!deliveryRecord}
                      >
                        <Printer className="h-8 w-8 text-green-600" />
                        <span className="text-sm">Print Birth Cert</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* NICU Observation Form */}
      {selectedBaby && (
        <NICUObservationForm
          isOpen={showNICUForm}
          onClose={() => setShowNICUForm(false)}
          babyPatient={{
            id: selectedBaby.id,
            name: selectedBaby.name,
            mr_number: selectedBaby.mr_number,
            gender: selectedBaby.gender,
            mother_patient_id: selectedBaby.mother_patient_id
          }}
          onSuccess={() => {
            loadBabyDetails(selectedBaby);
            toast.success('NICU observation saved successfully');
          }}
        />
      )}

      {/* Birth Certificate Template (Hidden for printing) */}
      {showBirthCertificate && selectedBaby && getBirthCertificateData() && (
        <Dialog open={showBirthCertificate} onOpenChange={setShowBirthCertificate}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Birth Certificate</DialogTitle>
            </DialogHeader>
            <BirthCertificateTemplate
              ref={birthCertificateRef}
              data={getBirthCertificateData()!}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowBirthCertificate(false)}>
                Close
              </Button>
              <Button onClick={() => handlePrintBirthCertificate()} className="bg-green-600 hover:bg-green-700">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* External Newborn Registration Dialog */}
      <Dialog open={showExternalForm} onOpenChange={setShowExternalForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-teal-100 rounded-full">
                <UserPlus className="h-5 w-5 text-teal-600" />
              </div>
              Register External Newborn
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              Register a baby born outside the hospital for NICU or other treatment
            </p>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Baby Information */}
            <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
              <h3 className="font-semibold text-pink-800 mb-3 flex items-center gap-2">
                <Baby className="h-4 w-4" />
                Baby Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="babyName">Baby Name (Optional)</Label>
                  <Input
                    id="babyName"
                    value={externalForm.name}
                    onChange={(e) => setExternalForm({ ...externalForm, name: e.target.value })}
                    placeholder="e.g., Baby Ahmed (or leave empty)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Will use "Baby of [Mother]" if empty</p>
                </div>
                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select
                    value={externalForm.gender}
                    onValueChange={(value) => setExternalForm({ ...externalForm, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={externalForm.date_of_birth}
                    onChange={(e) => setExternalForm({ ...externalForm, date_of_birth: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="weightKg">Weight (kg)</Label>
                    <Input
                      id="weightKg"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={externalForm.weight_kg}
                      onChange={(e) => setExternalForm({ ...externalForm, weight_kg: e.target.value })}
                      placeholder="e.g., 2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weightGrams">Grams</Label>
                    <Input
                      id="weightGrams"
                      type="number"
                      min="0"
                      max="999"
                      value={externalForm.weight_grams}
                      onChange={(e) => setExternalForm({ ...externalForm, weight_grams: e.target.value })}
                      placeholder="e.g., 500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Parent Information */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Parent Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="motherName">Mother's Name *</Label>
                  <Input
                    id="motherName"
                    value={externalForm.mother_name}
                    onChange={(e) => setExternalForm({ ...externalForm, mother_name: e.target.value })}
                    placeholder="Enter mother's name"
                  />
                </div>
                <div>
                  <Label htmlFor="fatherName">Father's Name</Label>
                  <Input
                    id="fatherName"
                    value={externalForm.father_name}
                    onChange={(e) => setExternalForm({ ...externalForm, father_name: e.target.value })}
                    placeholder="Enter father's name"
                  />
                </div>
                <div>
                  <Label htmlFor="contact">Contact Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="contact"
                      value={externalForm.contact}
                      onChange={(e) => setExternalForm({ ...externalForm, contact: e.target.value })}
                      placeholder="0300-1234567"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={externalForm.address}
                    onChange={(e) => setExternalForm({ ...externalForm, address: e.target.value })}
                    placeholder="Enter address"
                  />
                </div>
              </div>
            </div>

            {/* Referral Information */}
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                <Building className="h-4 w-4" />
                Referral Information
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="referralSource">Referred From</Label>
                  <Input
                    id="referralSource"
                    value={externalForm.referral_source}
                    onChange={(e) => setExternalForm({ ...externalForm, referral_source: e.target.value })}
                    placeholder="e.g., ABC Hospital, Home Birth, Dr. Ahmed Clinic"
                  />
                </div>
                <div>
                  <Label htmlFor="referralNotes">Reason for Referral / Notes</Label>
                  <Textarea
                    id="referralNotes"
                    value={externalForm.referral_notes}
                    onChange={(e) => setExternalForm({ ...externalForm, referral_notes: e.target.value })}
                    placeholder="e.g., Preterm, jaundice, respiratory distress, low birth weight..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="medicalHistory">Medical History / Prior Treatment</Label>
                  <Textarea
                    id="medicalHistory"
                    value={externalForm.medical_history}
                    onChange={(e) => setExternalForm({ ...externalForm, medical_history: e.target.value })}
                    placeholder="Any previous treatment, complications, medications..."
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Info Note */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
              <p className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 text-blue-500" />
                <span>
                  After registration, you can admit the baby to NICU and add treatments.
                  All charges will be linked to this baby's file.
                </span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowExternalForm(false);
                  setExternalForm(initialExternalForm);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRegisterExternalNewborn}
                disabled={savingExternal}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {savingExternal ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register Baby
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewbornBabyModule;
