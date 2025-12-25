import React, { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  FileText,
  Bed,
  TestTube,
  Stethoscope,
  Settings,
  Hospital,
  User,
  LogOut,
  Building,
  Beaker,
  DoorOpen,
  TrendingUp,
  Activity,
  UserCog,
  FileCheck
} from 'lucide-react';
import { Patient } from '@/lib/hospitalData';
import { useAuth } from '@/lib/useAuth';
import { toast } from 'sonner';
import PatientRegistration from '@/components/PatientRegistration';
import PatientProfile from '@/components/PatientProfile';
import TreatmentManagement from '@/components/TreatmentManagement';
import TreatmentTypesManagement from '@/components/TreatmentTypesManagement';
import OPDTokenSystem from '@/components/OPDTokenSystem';
import AdmissionModule from '@/components/AdmissionModule';
import LabManagement from '@/components/LabManagement';
import DoctorManagement from '@/components/DoctorManagement';
import UserRoles from '@/components/UserRoles';
import DepartmentManagement from '@/components/DepartmentManagement';
import LabTestManagement from '@/components/LabTestManagement';
import RoomManagement from '@/components/RoomManagement';
import DischargeModule from '@/components/DischargeModule';
import DoctorQueueSystem from '@/components/DoctorQueueSystem';
import AppointmentScheduling from '@/components/AppointmentScheduling';
import ReportsAnalytics from '@/components/ReportsAnalytics';
import BillingInvoices from '@/components/BillingInvoices';
import HospitalSettings from '@/components/HospitalSettings';
import DocumentsManagement from '@/components/DocumentsManagement';
import PatientDocumentPortfolio from '@/components/PatientDocumentPortfolio';
import ConsentDocumentsCenter from '@/components/ConsentDocumentsCenter';

const queryClient = new QueryClient();

type ModuleType = 'dashboard' | 'patients' | 'allpatients' | 'opd' | 'treatment' | 'treatmenttypes' | 'admission' | 'discharge' | 'lab' | 'doctors' | 'users' | 'departments' | 'labtests' | 'rooms' | 'queue' | 'appointments' | 'reports' | 'billing' | 'settings' | 'documents' | 'portfolio' | 'consent';

const LoginScreen = ({ onLogin }: { onLogin: (username: string, password: string) => Promise<boolean> }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    const success = await onLogin(username.trim(), password.trim());

    if (success) {
      toast.success('Login successful!');
    } else {
      toast.error('Invalid username or password');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Hospital className="h-16 w-16 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Hospital Management System</CardTitle>
          <p className="text-gray-600 text-sm">Please login to continue</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                disabled={isLoading}
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
            <div className="text-center text-sm text-gray-600 mt-4">
              <p>Demo credentials:</p>
              <p className="font-mono text-xs">
                Username: <strong>admin</strong> | Password: <strong>password123</strong>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const App = () => {
  const { user, loading, login, logout, hasPermission } = useAuth();
  const [currentModule, setCurrentModule] = useState<ModuleType>('dashboard');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const allModules = [
    { id: 'dashboard' as ModuleType, name: 'Dashboard', icon: Hospital },
    { id: 'patients' as ModuleType, name: 'Patient Registration', icon: Users },
    { id: 'allpatients' as ModuleType, name: 'All Patients', icon: UserCog },
    { id: 'opd' as ModuleType, name: 'OPD Tokens', icon: FileText },
    { id: 'treatment' as ModuleType, name: 'Treatment', icon: Activity },
    { id: 'treatmenttypes' as ModuleType, name: 'Treatment Types', icon: Settings },
    { id: 'appointments' as ModuleType, name: 'Appointments', icon: FileText },
    { id: 'queue' as ModuleType, name: 'Doctor Queue', icon: Users },
    { id: 'admission' as ModuleType, name: 'Admissions', icon: Bed },
    { id: 'discharge' as ModuleType, name: 'Discharge', icon: DoorOpen },
    { id: 'lab' as ModuleType, name: 'Lab Orders', icon: TestTube },
    { id: 'billing' as ModuleType, name: 'Billing & Invoices', icon: FileText },
    { id: 'documents' as ModuleType, name: 'Documents & Paperwork', icon: FileText },
    { id: 'portfolio' as ModuleType, name: 'Patient Document Portfolio', icon: User },
    { id: 'consent' as ModuleType, name: 'Consent & Documents', icon: FileCheck },
    { id: 'doctors' as ModuleType, name: 'Doctor Management', icon: Stethoscope },
    { id: 'rooms' as ModuleType, name: 'Room Management', icon: Building },
    { id: 'departments' as ModuleType, name: 'Department Management', icon: Building },
    { id: 'labtests' as ModuleType, name: 'Lab Test Management', icon: Beaker },
    { id: 'reports' as ModuleType, name: 'Reports & Analytics', icon: TrendingUp },
    { id: 'users' as ModuleType, name: 'User Management', icon: UserCog },
    { id: 'settings' as ModuleType, name: 'Hospital Settings', icon: Settings },
  ];

  // ✅ FILTER MODULES BASED ON USER PERMISSIONS
  const modules = allModules.filter(module => hasPermission(module.id));

  // ✅ REDIRECT IF USER TRIES TO ACCESS UNAUTHORIZED MODULE
  useEffect(() => {
    if (user && !hasPermission(currentModule)) {
      setCurrentModule('dashboard');
      toast.error('You do not have permission to access that module');
    }
  }, [currentModule, user, hasPermission]);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    if (currentModule === 'patients' && hasPermission('opd')) {
      setCurrentModule('opd');
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hospital className="h-6 w-6" />
            Hospital Management System Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Patients</p>
                  <p className="text-2xl font-bold text-blue-600">--</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </Card>
            
            <Card className="p-4 bg-green-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">OPD Tokens</p>
                  <p className="text-2xl font-bold text-green-600">--</p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </Card>
            
            <Card className="p-4 bg-yellow-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Admissions</p>
                  <p className="text-2xl font-bold text-yellow-600">--</p>
                </div>
                <Bed className="h-8 w-8 text-yellow-600" />
              </div>
            </Card>
            
            <Card className="p-4 bg-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Lab Tests</p>
                  <p className="text-2xl font-bold text-purple-600">--</p>
                </div>
                <TestTube className="h-8 w-8 text-purple-600" />
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {modules.slice(1).map((module) => {
              const Icon = module.icon;
              return (
                <Button
                  key={module.id}
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setCurrentModule(module.id)}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-xs text-center">{module.name}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>✅ Connected to Supabase Database</p>
            <p>✅ All modules operational</p>
            <p>✅ Real-time data synchronization active</p>
            <p>🔐 Role: <strong>{user?.role}</strong></p>
            <p>👤 User: <strong>{user?.fullName}</strong></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCurrentModule = () => {
    // ✅ CHECK PERMISSION BEFORE RENDERING MODULE
    if (!hasPermission(currentModule)) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600 text-lg mb-2">⛔ Access Denied</p>
            <p className="text-gray-600">You do not have permission to access this module.</p>
            <p className="text-sm text-gray-500 mt-2">Contact your administrator for access.</p>
            <Button onClick={() => setCurrentModule('dashboard')} className="mt-4">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      );
    }

    switch (currentModule) {
      case 'dashboard':
        return renderDashboard();
      case 'patients':
        return (
          <PatientRegistration
            onPatientSelect={handlePatientSelect}
            onNewPatient={handlePatientSelect}
          />
        );
      case 'allpatients':
        return <PatientProfile selectedPatient={selectedPatient} />;
      case 'opd':
        return <OPDTokenSystem selectedPatient={selectedPatient} />;
      case 'treatment':
        return <TreatmentManagement selectedPatient={selectedPatient} />;
      case 'treatmenttypes':
        return <TreatmentTypesManagement />;
      case 'appointments':
        return <AppointmentScheduling />;
      case 'queue':
        return <DoctorQueueSystem />;
      case 'admission':
        return <AdmissionModule selectedPatient={selectedPatient} />;
      case 'discharge':
        return <DischargeModule />;
      case 'lab':
        return <LabManagement selectedPatient={selectedPatient} />;
      case 'billing':
        return <BillingInvoices />;
      case 'doctors':
        return <DoctorManagement />;
      case 'rooms':
        return <RoomManagement />;
      case 'departments':
        return <DepartmentManagement />;
      case 'labtests':
        return <LabTestManagement />;
      case 'reports':
        return <ReportsAnalytics />;
      case 'users':
        return <UserRoles />;
      case 'documents':
        return <DocumentsManagement />;
      case 'portfolio':
        return <PatientDocumentPortfolio selectedPatient={selectedPatient} />;
      case 'consent':
        return <ConsentDocumentsCenter />;
      case 'settings':
        return <HospitalSettings />;
      default:
        return renderDashboard();
    }
  };

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Hospital className="h-12 w-12 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!user) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <LoginScreen onLogin={login} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center gap-3">
                  <Hospital className="h-8 w-8 text-blue-600" />
                  <h1 className="text-xl font-bold text-gray-900">
                    Hospital Management System
                  </h1>
                </div>
                
                <div className="flex items-center gap-4">
                  {selectedPatient && (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">
                        {selectedPatient.name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Selected
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-medium">{user.fullName}</p>
                      <p className="text-xs text-gray-500">{user.role}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={logout}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex gap-6">
              {/* Sidebar */}
              <div className="w-64 space-y-2">
                {modules.map((module) => {
                  const Icon = module.icon;
                  return (
                    <Button
                      key={module.id}
                      variant={currentModule === module.id ? 'default' : 'ghost'}
                      className="w-full justify-start text-sm"
                      onClick={() => setCurrentModule(module.id)}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      {module.name}
                    </Button>
                  );
                })}
              </div>

              {/* Main Content */}
              <div className="flex-1">
                {renderCurrentModule()}
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
