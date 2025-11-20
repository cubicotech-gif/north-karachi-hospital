import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Stethoscope, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/lib/useAuth';
import { formatCurrency } from '@/lib/hospitalData';

interface Doctor {
  id: string;
  name: string;
  department: string;
  specialization: string;
  opd_fee: number;
  available: boolean;
}

interface Patient {
  id: string;
  name: string;
  contact: string;
  age: number;
}

interface OPDToken {
  id: string;
  token_number: number;
  patient_id: string;
  doctor_id: string;
  date: string;
  status: 'waiting' | 'in-consultation' | 'completed' | 'cancelled';
  fee: number;
  payment_status: string;
  created_at?: string;
}

interface QueueItem {
  token: OPDToken;
  patient: Patient | null;
  doctor: Doctor | null;
}

export default function DoctorQueueSystem() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tokens, setTokens] = useState<OPDToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [doctorsRes, patientsRes, tokensRes] = await Promise.all([
        db.doctors.getAll(),
        db.patients.getAll(),
        db.opdTokens.getAll()
      ]);

      if (doctorsRes.error) throw doctorsRes.error;
      if (patientsRes.error) throw patientsRes.error;
      if (tokensRes.error) throw tokensRes.error;

      setDoctors(doctorsRes.data || []);
      setPatients(patientsRes.data || []);

      // Filter today's tokens
      const today = new Date().toISOString().split('T')[0];
      const todayTokens = (tokensRes.data || []).filter(
        (token: OPDToken) => token.date === today
      );
      setTokens(todayTokens);

      // If doctor role, auto-select their own queue
      if (user?.role === 'Doctor' && doctorsRes.data) {
        const myDoctor = doctorsRes.data.find((d: Doctor) =>
          d.name.toLowerCase().includes(user.fullName.toLowerCase())
        );
        if (myDoctor) {
          setSelectedDoctorId(myDoctor.id);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load queue data');
    } finally {
      setLoading(false);
    }
  };

  const updateTokenStatus = async (tokenId: string, status: OPDToken['status']) => {
    try {
      const { error } = await db.opdTokens.update(tokenId, { status });
      if (error) throw error;

      setTokens(tokens.map(t => t.id === tokenId ? { ...t, status } : t));
      toast.success(`Token status updated to ${status}`);
    } catch (error) {
      console.error('Error updating token status:', error);
      toast.error('Failed to update token status');
    }
  };

  const getDoctorQueue = (doctorId: string): QueueItem[] => {
    return tokens
      .filter(token => token.doctor_id === doctorId)
      .sort((a, b) => a.token_number - b.token_number)
      .map(token => ({
        token,
        patient: patients.find(p => p.id === token.patient_id) || null,
        doctor: doctors.find(d => d.id === doctorId) || null
      }));
  };

  const getDoctorStats = (doctorId: string) => {
    const queue = getDoctorQueue(doctorId);
    return {
      total: queue.length,
      waiting: queue.filter(q => q.token.status === 'waiting').length,
      inConsultation: queue.filter(q => q.token.status === 'in-consultation').length,
      completed: queue.filter(q => q.token.status === 'completed').length,
      cancelled: queue.filter(q => q.token.status === 'cancelled').length
    };
  };

  const getStatusColor = (status: OPDToken['status']) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-consultation':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderDoctorOverview = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">All Doctors Queue Overview</h3>
        <Button onClick={fetchAllData} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {doctors.map(doctor => {
          const stats = getDoctorStats(doctor.id);
          return (
            <Card
              key={doctor.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${!doctor.available ? 'opacity-60' : ''}`}
              onClick={() => setSelectedDoctorId(doctor.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-base">{doctor.name}</h4>
                    <p className="text-xs text-gray-600">{doctor.specialization}</p>
                    <p className="text-xs text-gray-500">{doctor.department}</p>
                  </div>
                  <Badge variant={doctor.available ? 'default' : 'secondary'}>
                    {doctor.available ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-2xl font-bold text-gray-700">{stats.total}</p>
                    <p className="text-xs text-gray-600">Total</p>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded">
                    <p className="text-2xl font-bold text-yellow-700">{stats.waiting}</p>
                    <p className="text-xs text-gray-600">Waiting</p>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <p className="text-2xl font-bold text-blue-700">{stats.inConsultation}</p>
                    <p className="text-xs text-gray-600">In Consultation</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
                    <p className="text-xs text-gray-600">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderDoctorQueue = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    const queue = getDoctorQueue(doctorId);
    const stats = getDoctorStats(doctorId);

    if (!doctor) return null;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Queue for Dr. {doctor.name}</h3>
            <p className="text-sm text-gray-600">{doctor.specialization} - {doctor.department}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setSelectedDoctorId(null)} variant="outline" size="sm">
              Back to Overview
            </Button>
            <Button onClick={fetchAllData} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-700">{stats.total}</p>
                <p className="text-xs text-gray-600">Total Patients</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.waiting}</p>
                <p className="text-xs text-gray-600">Waiting</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.inConsultation}</p>
                <p className="text-xs text-gray-600">In Consultation</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                <p className="text-xs text-gray-600">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                <p className="text-xs text-gray-600">Cancelled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queue List */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="waiting">Waiting ({stats.waiting})</TabsTrigger>
            <TabsTrigger value="in-consultation">Consulting ({stats.inConsultation})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
          </TabsList>

          {['all', 'waiting', 'in-consultation', 'completed'].map(status => (
            <TabsContent key={status} value={status} className="space-y-2">
              {queue
                .filter(item => status === 'all' || item.token.status === status)
                .map(item => (
                  <Card key={item.token.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-2xl font-bold text-blue-600">
                                {item.token.token_number}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Token</p>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{item.patient?.name || 'Unknown Patient'}</h4>
                              <Badge className={getStatusColor(item.token.status)}>
                                {item.token.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>Contact: {item.patient?.contact || 'N/A'}</p>
                              <p>Age: {item.patient?.age || 'N/A'} years</p>
                              <p>Fee: {formatCurrency(item.token.fee)}</p>
                              <p className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(item.token.created_at || item.token.date).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {item.token.status === 'waiting' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateTokenStatus(item.token.id, 'in-consultation')}
                                className="w-32"
                              >
                                Start Consultation
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateTokenStatus(item.token.id, 'cancelled')}
                                className="w-32"
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {item.token.status === 'in-consultation' && (
                            <Button
                              size="sm"
                              onClick={() => updateTokenStatus(item.token.id, 'completed')}
                              className="w-32"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Complete
                            </Button>
                          )}
                          {item.token.status === 'completed' && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Done
                            </Badge>
                          )}
                          {item.token.status === 'cancelled' && (
                            <Badge className="bg-red-100 text-red-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              Cancelled
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              {queue.filter(item => status === 'all' || item.token.status === status).length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    No patients in this category
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Doctor Queue System
            <Badge variant="outline" className="ml-2">
              Today: {new Date().toLocaleDateString()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDoctorId ? renderDoctorQueue(selectedDoctorId) : renderDoctorOverview()}
        </CardContent>
      </Card>
    </div>
  );
}
