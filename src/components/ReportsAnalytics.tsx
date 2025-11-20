import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Users, DollarSign, Bed, TestTube, Calendar, TrendingUp,
  Activity, Stethoscope, Building, FileText, Clock
} from 'lucide-react';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/hospitalData';

interface Stats {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  totalRevenue: number;
  todayPatients: number;
  todayAppointments: number;
  todayRevenue: number;
  activeAdmissions: number;
  totalBeds: number;
  occupiedBeds: number;
  pendingLabTests: number;
  completedLabTests: number;
}

interface DoctorStats {
  id: string;
  name: string;
  department: string;
  totalPatients: number;
  totalRevenue: number;
  todayPatients: number;
}

interface DepartmentStats {
  name: string;
  patientCount: number;
  revenue: number;
}

export default function ReportsAnalytics() {
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    todayPatients: 0,
    todayAppointments: 0,
    todayRevenue: 0,
    activeAdmissions: 0,
    totalBeds: 0,
    occupiedBeds: 0,
    pendingLabTests: 0,
    completedLabTests: 0
  });

  const [doctorStats, setDoctorStats] = useState<DoctorStats[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch all data in parallel
      const [
        patientsRes,
        doctorsRes,
        opdTokensRes,
        appointmentsRes,
        admissionsRes,
        roomsRes,
        labOrdersRes,
        departmentsRes
      ] = await Promise.all([
        db.patients.getAll(),
        db.doctors.getAll(),
        db.opdTokens.getAll(),
        db.appointments?.getAll() || Promise.resolve({ data: [], error: null }),
        db.admissions.getAll(),
        db.rooms.getAll(),
        db.labOrders.getAll(),
        db.departments.getAll()
      ]);

      if (patientsRes.error) throw patientsRes.error;
      if (doctorsRes.error) throw doctorsRes.error;
      if (opdTokensRes.error) throw opdTokensRes.error;
      if (admissionsRes.error) throw admissionsRes.error;
      if (roomsRes.error) throw roomsRes.error;
      if (labOrdersRes.error) throw labOrdersRes.error;
      if (departmentsRes.error) throw departmentsRes.error;

      const patients = patientsRes.data || [];
      const doctors = doctorsRes.data || [];
      const opdTokens = opdTokensRes.data || [];
      const appointments = appointmentsRes.data || [];
      const admissions = admissionsRes.data || [];
      const rooms = roomsRes.data || [];
      const labOrders = labOrdersRes.data || [];
      const departments = departmentsRes.data || [];

      // Calculate overall stats
      const todayTokens = opdTokens.filter((t: any) => t.date === today);
      const todayAppointments = appointments.filter((a: any) => a.appointment_date === today);

      const totalRevenue = opdTokens.reduce((sum: number, t: any) =>
        t.payment_status === 'paid' ? sum + (t.fee || 0) : sum, 0
      );

      const todayRevenue = todayTokens.reduce((sum: number, t: any) =>
        t.payment_status === 'paid' ? sum + (t.fee || 0) : sum, 0
      );

      const activeAdmissions = admissions.filter((a: any) => a.status === 'active').length;
      const totalBeds = rooms.reduce((sum: number, r: any) => sum + r.bed_count, 0);
      const occupiedBeds = rooms.reduce((sum: number, r: any) => sum + r.occupied_beds, 0);

      const pendingLabTests = labOrders.filter((l: any) => l.status === 'pending').length;
      const completedLabTests = labOrders.filter((l: any) => l.status === 'completed').length;

      setStats({
        totalPatients: patients.length,
        totalDoctors: doctors.length,
        totalAppointments: appointments.length,
        totalRevenue,
        todayPatients: todayTokens.length,
        todayAppointments: todayAppointments.length,
        todayRevenue,
        activeAdmissions,
        totalBeds,
        occupiedBeds,
        pendingLabTests,
        completedLabTests
      });

      // Calculate doctor-wise stats
      const doctorStatsMap = new Map<string, DoctorStats>();
      doctors.forEach((doctor: any) => {
        const doctorTokens = opdTokens.filter((t: any) => t.doctor_id === doctor.id);
        const todayDoctorTokens = todayTokens.filter((t: any) => t.doctor_id === doctor.id);
        const doctorRevenue = doctorTokens.reduce((sum: number, t: any) =>
          t.payment_status === 'paid' ? sum + (t.fee || 0) : sum, 0
        );

        doctorStatsMap.set(doctor.id, {
          id: doctor.id,
          name: doctor.name,
          department: doctor.department,
          totalPatients: doctorTokens.length,
          totalRevenue: doctorRevenue,
          todayPatients: todayDoctorTokens.length
        });
      });
      setDoctorStats(Array.from(doctorStatsMap.values()));

      // Calculate department-wise stats
      const deptStatsMap = new Map<string, DepartmentStats>();
      departments.forEach((dept: any) => {
        const deptDoctors = doctors.filter((d: any) => d.department === dept.name);
        const deptDoctorIds = deptDoctors.map((d: any) => d.id);
        const deptTokens = opdTokens.filter((t: any) => deptDoctorIds.includes(t.doctor_id));
        const deptRevenue = deptTokens.reduce((sum: number, t: any) =>
          t.payment_status === 'paid' ? sum + (t.fee || 0) : sum, 0
        );

        deptStatsMap.set(dept.name, {
          name: dept.name,
          patientCount: deptTokens.length,
          revenue: deptRevenue
        });
      });
      setDepartmentStats(Array.from(deptStatsMap.values()));

    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const occupancyPercentage = stats.totalBeds > 0
    ? ((stats.occupiedBeds / stats.totalBeds) * 100).toFixed(1)
    : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Activity className="h-8 w-8 mx-auto mb-4 animate-pulse text-blue-600" />
          <p className="text-gray-600">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Reports & Analytics Dashboard
            <Badge variant="outline" className="ml-2">
              {new Date().toLocaleDateString()}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Today's Stats */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Today's Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Patients</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.todayPatients}</p>
                </div>
                <Users className="h-10 w-10 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Appointments</p>
                  <p className="text-3xl font-bold text-green-600">{stats.todayAppointments}</p>
                </div>
                <Calendar className="h-10 w-10 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Revenue</p>
                  <p className="text-3xl font-bold text-yellow-600">{formatCurrency(stats.todayRevenue)}</p>
                </div>
                <DollarSign className="h-10 w-10 text-yellow-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Admissions</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.activeAdmissions}</p>
                </div>
                <Bed className="h-10 w-10 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Overall Stats */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Overall Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Patients</p>
                  <p className="text-2xl font-bold">{stats.totalPatients}</p>
                </div>
                <Users className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Doctors</p>
                  <p className="text-2xl font-bold">{stats.totalDoctors}</p>
                </div>
                <Stethoscope className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Appointments</p>
                  <p className="text-2xl font-bold">{stats.totalAppointments}</p>
                </div>
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Beds</p>
                  <p className="text-2xl font-bold">{stats.totalBeds}</p>
                </div>
                <Bed className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Occupied Beds</p>
                  <p className="text-2xl font-bold">{stats.occupiedBeds}</p>
                  <p className="text-xs text-gray-500">{occupancyPercentage}% occupancy</p>
                </div>
                <Bed className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Lab Tests</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingLabTests}</p>
                </div>
                <TestTube className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed Tests</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completedLabTests}</p>
                </div>
                <TestTube className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Reports */}
      <Tabs defaultValue="doctors" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="doctors">Doctor Performance</TabsTrigger>
          <TabsTrigger value="departments">Department Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="doctors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Doctor-wise Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {doctorStats
                  .sort((a, b) => b.totalRevenue - a.totalRevenue)
                  .map(doctor => (
                    <Card key={doctor.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">Dr. {doctor.name}</h4>
                            <p className="text-sm text-gray-600">{doctor.department}</p>
                          </div>
                          <div className="grid grid-cols-3 gap-6 text-center">
                            <div>
                              <p className="text-2xl font-bold text-blue-600">{doctor.totalPatients}</p>
                              <p className="text-xs text-gray-600">Total Patients</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-600">{doctor.todayPatients}</p>
                              <p className="text-xs text-gray-600">Today</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(doctor.totalRevenue)}</p>
                              <p className="text-xs text-gray-600">Revenue</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                {doctorStats.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No doctor statistics available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Department-wise Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {departmentStats
                  .sort((a, b) => b.revenue - a.revenue)
                  .map(dept => (
                    <Card key={dept.name}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{dept.name}</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-6 text-center">
                            <div>
                              <p className="text-2xl font-bold text-blue-600">{dept.patientCount}</p>
                              <p className="text-xs text-gray-600">Patients Treated</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-600">{formatCurrency(dept.revenue)}</p>
                              <p className="text-xs text-gray-600">Revenue Generated</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                {departmentStats.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No department statistics available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
