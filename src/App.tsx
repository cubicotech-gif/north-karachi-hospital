import React, { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  FileCheck,
  CreditCard,
  Calendar,
  ClipboardList,
  Receipt,
  FolderOpen,
  LayoutDashboard,
  UserPlus,
  Clipboard,
  Baby
} from 'lucide-react';
import { Patient } from '@/lib/hospitalData';
import { useAuth } from '@/lib/useAuth';
import { db } from '@/lib/supabase';
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
import NewbornBabyModule from '@/components/NewbornBabyModule';

const queryClient = new QueryClient();

type ModuleType = 'dashboard' | 'patients' | 'allpatients' | 'newborns' | 'opd' | 'treatment' | 'treatmenttypes' | 'admission' | 'discharge' | 'lab' | 'doctors' | 'users' | 'departments' | 'labtests' | 'rooms' | 'queue' | 'appointments' | 'reports' | 'billing' | 'settings' | 'documents' | 'portfolio' | 'consent';

// Hospital Logo Component
const HospitalLogo = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-20 w-20'
  };

  return (
    <img
      src="/logo.png"
      alt="North Karachi Hospital"
      className={`${sizes[size]} object-contain`}
      onError={(e) => {
        // Fallback to icon if logo fails to load
        e.currentTarget.style.display = 'none';
        e.currentTarget.nextElementSibling?.classList.remove('hidden');
      }}
    />
  );
};

const LoginScreen = ({ onLogin }: { onLogin: (username: string, password: string) => Promise<boolean> }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    const success = await onLogin(username.trim(), password.trim());

    if (success) {
      toast.success('Login successful! Welcome to North Karachi Hospital');
    } else {
      toast.error('Invalid username or password');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Hospital Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-4 rounded-full shadow-lg border-4 border-teal-100">
              <img
                src="/logo.png"
                alt="North Karachi Hospital"
                className="h-20 w-20 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <Hospital className="h-20 w-20 text-teal-400 hidden" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-teal-500">North Karachi Hospital</h1>
          <p className="text-lg text-teal-400 font-medium" style={{ direction: 'rtl' }}>نارتھ کراچی ہسپتال</p>
          <p className="text-gray-500 text-sm mt-2">Hospital Management System</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center bg-gradient-to-r from-teal-400 to-teal-500 text-white rounded-t-lg">
            <CardTitle className="text-xl">Staff Login</CardTitle>
            <p className="text-teal-100 text-sm">Enter your credentials to access the system</p>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-gray-700">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  disabled={isLoading}
                  autoFocus
                  className="mt-1 border-gray-300 focus:border-teal-400 focus:ring-teal-400"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className="mt-1 border-gray-300 focus:border-teal-400 focus:ring-teal-400"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-teal-400 hover:bg-teal-500 text-white py-5 text-lg"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
              <div className="text-center text-sm text-gray-500 mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">Demo Credentials:</p>
                <p className="font-mono text-xs mt-1">
                  Username: <strong>admin</strong> | Password: <strong>password123</strong>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-gray-400 text-xs mt-6">
          C-122, Sector 11-B, North Karachi | Ph: 36989080
        </p>
      </div>
    </div>
  );
};

const App = () => {
  const { user, loading, login, logout, hasPermission } = useAuth();
  const [currentModule, setCurrentModule] = useState<ModuleType>('dashboard');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Module categories for organized sidebar
  const moduleCategories = [
    {
      name: 'Main',
      modules: [
        { id: 'dashboard' as ModuleType, name: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      name: 'Patient Services',
      modules: [
        { id: 'patients' as ModuleType, name: 'Registration', icon: UserPlus },
        { id: 'allpatients' as ModuleType, name: 'Patient Files', icon: FolderOpen },
        { id: 'newborns' as ModuleType, name: 'Newborn Babies', icon: Baby },
        { id: 'opd' as ModuleType, name: 'OPD Tokens', icon: Clipboard },
        { id: 'appointments' as ModuleType, name: 'Appointments', icon: Calendar },
        { id: 'queue' as ModuleType, name: 'Doctor Queue', icon: Users },
      ]
    },
    {
      name: 'Clinical',
      modules: [
        { id: 'treatment' as ModuleType, name: 'Treatments', icon: Activity },
        { id: 'admission' as ModuleType, name: 'Admissions', icon: Bed },
        { id: 'discharge' as ModuleType, name: 'Discharge', icon: DoorOpen },
        { id: 'lab' as ModuleType, name: 'Laboratory', icon: TestTube },
      ]
    },
    {
      name: 'Documents',
      modules: [
        { id: 'consent' as ModuleType, name: 'Consent Forms', icon: FileCheck },
        { id: 'portfolio' as ModuleType, name: 'Document Portfolio', icon: FileText },
        { id: 'billing' as ModuleType, name: 'Billing', icon: Receipt },
      ]
    },
    {
      name: 'Administration',
      modules: [
        { id: 'doctors' as ModuleType, name: 'Doctors', icon: Stethoscope },
        { id: 'rooms' as ModuleType, name: 'Rooms', icon: Building },
        { id: 'departments' as ModuleType, name: 'Departments', icon: Building },
        { id: 'labtests' as ModuleType, name: 'Lab Tests', icon: Beaker },
        { id: 'treatmenttypes' as ModuleType, name: 'Treatment Types', icon: ClipboardList },
      ]
    },
    {
      name: 'System',
      modules: [
        { id: 'reports' as ModuleType, name: 'Reports', icon: TrendingUp },
        { id: 'users' as ModuleType, name: 'Users', icon: UserCog },
        { id: 'settings' as ModuleType, name: 'Settings', icon: Settings },
      ]
    }
  ];

  // Flatten and filter modules based on permissions
  const allModules = moduleCategories.flatMap(cat => cat.modules);
  const getFilteredCategory = (category: typeof moduleCategories[0]) => ({
    ...category,
    modules: category.modules.filter(m => hasPermission(m.id))
  });

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
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-teal-400 to-teal-500 text-white border-0">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Welcome to North Karachi Hospital</h2>
              <p className="text-teal-100 mt-1">Hospital Management System Dashboard</p>
              <p className="text-sm text-teal-100 mt-2">
                Logged in as: <strong>{user?.fullName}</strong> ({user?.role})
              </p>
            </div>
            <div className="hidden md:block">
              <img
                src="/logo.png"
                alt="NKH"
                className="h-20 w-20 object-contain opacity-90"
                onError={(e) => e.currentTarget.style.display = 'none'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Today's Patients</p>
                <p className="text-3xl font-bold text-gray-900">--</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-300 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">OPD Tokens</p>
                <p className="text-3xl font-bold text-gray-900">--</p>
              </div>
              <div className="p-3 bg-teal-100 rounded-full">
                <FileText className="h-6 w-6 text-teal-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Admissions</p>
                <p className="text-3xl font-bold text-gray-900">--</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <Bed className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Lab Tests</p>
                <p className="text-3xl font-bold text-gray-900">--</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TestTube className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { id: 'patients', name: 'New Patient', icon: UserPlus, color: 'teal' },
              { id: 'opd', name: 'OPD Token', icon: Clipboard, color: 'blue' },
              { id: 'allpatients', name: 'Find Patient', icon: FolderOpen, color: 'indigo' },
              { id: 'lab', name: 'Lab Order', icon: TestTube, color: 'purple' },
              { id: 'admission', name: 'Admission', icon: Bed, color: 'amber' },
              { id: 'consent', name: 'Consent Form', icon: FileCheck, color: 'teal' },
            ].filter(item => hasPermission(item.id as ModuleType)).map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant="outline"
                  className={`h-24 flex flex-col gap-2 hover:bg-${item.color}-50 hover:border-${item.color}-300 transition-colors`}
                  onClick={() => setCurrentModule(item.id as ModuleType)}
                >
                  <Icon className={`h-8 w-8 text-${item.color}-600`} />
                  <span className="text-xs font-medium">{item.name}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Database Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>All Modules Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Real-time Sync</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Print Services Ready</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCurrentModule = () => {
    if (!hasPermission(currentModule)) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <User className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-red-600 text-lg font-semibold mb-2">Access Denied</p>
            <p className="text-gray-600">You do not have permission to access this module.</p>
            <p className="text-sm text-gray-500 mt-2">Contact your administrator for access.</p>
            <Button onClick={() => setCurrentModule('dashboard')} className="mt-4 bg-teal-400 hover:bg-teal-500">
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
      case 'newborns':
        return (
          <NewbornBabyModule
            onNavigateToPatient={(patientId) => {
              // Load patient by ID and navigate to patient files
              db.patients.getById(patientId).then(({ data }) => {
                if (data) {
                  setSelectedPatient(data as Patient);
                  setCurrentModule('allpatients');
                }
              });
            }}
          />
        );
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
        return <ConsentDocumentsCenter selectedPatient={selectedPatient} />;
      case 'settings':
        return <HospitalSettings />;
      default:
        return renderDashboard();
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <img
            src="/logo.png"
            alt="NKH"
            className="h-16 w-16 mx-auto mb-4 animate-pulse"
            onError={(e) => e.currentTarget.style.display = 'none'}
          />
          <Hospital className="h-16 w-16 mx-auto mb-4 text-teal-400 animate-pulse hidden" />
          <p className="text-teal-500 font-medium">Loading North Karachi Hospital...</p>
        </div>
      </div>
    );
  }

  // Login Screen
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
        <div className="min-h-screen bg-gray-100">
          {/* Professional Header */}
          <header className="bg-gradient-to-r from-teal-500 to-teal-400 text-white shadow-lg">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                {/* Logo and Title */}
                <div className="flex items-center gap-4">
                  <div className="bg-white p-1.5 rounded-lg">
                    <img
                      src="/logo.png"
                      alt="NKH"
                      className="h-10 w-10 object-contain"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">North Karachi Hospital</h1>
                    <p className="text-xs text-teal-100">Hospital Management System</p>
                  </div>
                </div>

                {/* Selected Patient & User Info */}
                <div className="flex items-center gap-4">
                  {selectedPatient && (
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                      <User className="h-4 w-4" />
                      <div>
                        <span className="text-sm font-medium">{selectedPatient.name}</span>
                        {selectedPatient.mrNumber && (
                          <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded font-mono">
                            {selectedPatient.mrNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pl-4 border-l border-white/20">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium">{user.fullName}</p>
                      <p className="text-xs text-teal-100">{user.role}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={logout}
                      className="text-white hover:bg-white/20"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="flex">
            {/* Professional Sidebar */}
            <aside className="w-64 bg-white shadow-lg min-h-[calc(100vh-4rem)] border-r">
              <div className="p-4">
                {moduleCategories.map((category) => {
                  const filteredCategory = getFilteredCategory(category);
                  if (filteredCategory.modules.length === 0) return null;

                  return (
                    <div key={category.name} className="mb-4">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                        {category.name}
                      </h3>
                      <div className="space-y-1">
                        {filteredCategory.modules.map((module) => {
                          const Icon = module.icon;
                          const isActive = currentModule === module.id;
                          return (
                            <Button
                              key={module.id}
                              variant="ghost"
                              className={`w-full justify-start text-sm font-medium transition-colors ${
                                isActive
                                  ? 'bg-teal-50 text-teal-500 hover:bg-teal-100'
                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                              }`}
                              onClick={() => setCurrentModule(module.id)}
                            >
                              <Icon className={`h-4 w-4 mr-3 ${isActive ? 'text-teal-400' : 'text-gray-400'}`} />
                              {module.name}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sidebar Footer */}
              <div className="absolute bottom-0 w-64 p-4 border-t bg-gray-50">
                <div className="text-center text-xs text-gray-400">
                  <p className="font-medium text-gray-500">North Karachi Hospital</p>
                  <p>C-122, Sector 11-B</p>
                  <p>Ph: 36989080</p>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-auto">
              {renderCurrentModule()}
            </main>
          </div>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
