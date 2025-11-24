import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Calendar, FileText, Bed, TestTube, Activity, Clock, Printer, Eye } from 'lucide-react';
import { Patient, formatCurrency } from '@/lib/hospitalData';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';

interface PatientProfileProps {
  selectedPatient: Patient | null;
}

export default function PatientProfile({ selectedPatient }: PatientProfileProps) {
  const [history, setHistory] = useState<any>({
    opdTokens: { data: [], error: null },
    admissions: { data: [], error: null },
    labOrders: { data: [], error: null },
    treatments: { data: [], error: null },
    appointments: { data: [], error: null }
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (selectedPatient) {
      loadPatientHistory();
    }
  }, [selectedPatient]);

  const loadPatientHistory = async () => {
    if (!selectedPatient) return;

    setLoading(true);
    try {
      const historyData = await db.patientHistory.getByPatientId(selectedPatient.id);
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading patient history:', error);
      toast.error('Failed to load patient history');
    } finally {
      setLoading(false);
    }
  };

  // Combine all activities into a timeline
  const getTimeline = () => {
    const timeline: any[] = [];

    // Add OPD tokens
    history.opdTokens?.data?.forEach((opd: any) => {
      timeline.push({
        type: 'OPD',
        date: opd.date,
        created_at: opd.created_at,
        data: opd,
        icon: FileText,
        color: 'blue'
      });
    });

    // Add admissions
    history.admissions?.data?.forEach((admission: any) => {
      timeline.push({
        type: 'Admission',
        date: admission.admission_date,
        created_at: admission.created_at,
        data: admission,
        icon: Bed,
        color: 'purple'
      });
    });

    // Add lab orders
    history.labOrders?.data?.forEach((lab: any) => {
      timeline.push({
        type: 'Lab',
        date: lab.order_date,
        created_at: lab.created_at,
        data: lab,
        icon: TestTube,
        color: 'green'
      });
    });

    // Add treatments
    history.treatments?.data?.forEach((treatment: any) => {
      timeline.push({
        type: 'Treatment',
        date: treatment.date,
        created_at: treatment.created_at,
        data: treatment,
        icon: Activity,
        color: 'red'
      });
    });

    // Add appointments
    history.appointments?.data?.forEach((appointment: any) => {
      timeline.push({
        type: 'Appointment',
        date: appointment.appointment_date,
        created_at: appointment.created_at,
        data: appointment,
        icon: Calendar,
        color: 'yellow'
      });
    });

    // Sort by date (most recent first)
    return timeline.sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime());
  };

  const printProfile = () => {
    if (!selectedPatient) return;

    const timeline = getTimeline();

    const printContent = `
      <html>
        <head>
          <title>Patient Profile - ${selectedPatient.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 3px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
            .hospital-name { font-size: 24px; font-weight: bold; color: #333; }
            .patient-info { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 8px; }
            .info-row { margin: 5px 0; }
            .label { font-weight: bold; display: inline-block; width: 150px; }
            .section { margin: 30px 0; }
            .section-title { font-size: 18px; font-weight: bold; border-bottom: 2px solid #ccc; padding-bottom: 5px; margin-bottom: 15px; }
            .activity { border-left: 3px solid #3498db; padding-left: 15px; margin-bottom: 20px; }
            .activity-header { font-weight: bold; font-size: 16px; margin-bottom: 5px; }
            .activity-detail { margin: 3px 0; font-size: 14px; color: #666; }
            .footer { border-top: 1px solid #ccc; padding-top: 10px; margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="hospital-name">North Karachi Hospital</div>
              <div style="color: #666; margin-top: 5px;">Patient Profile Report</div>
            </div>

            <div class="patient-info">
              <h2 style="margin-top: 0;">Patient Information</h2>
              <div class="info-row"><span class="label">MR Number:</span> ${selectedPatient.mrNumber || 'N/A'}</div>
              <div class="info-row"><span class="label">Name:</span> ${selectedPatient.name}</div>
              <div class="info-row"><span class="label">Age:</span> ${selectedPatient.age} years</div>
              <div class="info-row"><span class="label">Gender:</span> ${selectedPatient.gender}</div>
              <div class="info-row"><span class="label">Contact:</span> ${selectedPatient.contact}</div>
              ${selectedPatient.careOf ? `<div class="info-row"><span class="label">Care Of:</span> ${selectedPatient.careOf}</div>` : ''}
              ${selectedPatient.bloodGroup ? `<div class="info-row"><span class="label">Blood Group:</span> ${selectedPatient.bloodGroup}</div>` : ''}
              ${selectedPatient.cnicNumber ? `<div class="info-row"><span class="label">CNIC:</span> ${selectedPatient.cnicNumber}</div>` : ''}
              <div class="info-row"><span class="label">Department:</span> ${selectedPatient.department}</div>
              ${selectedPatient.address ? `<div class="info-row"><span class="label">Address:</span> ${selectedPatient.address}</div>` : ''}
              <div class="info-row"><span class="label">Registration Date:</span> ${new Date(selectedPatient.registrationDate).toLocaleDateString('en-PK')}</div>
            </div>

            <div class="section">
              <div class="section-title">Medical History Timeline</div>
              ${timeline.length === 0 ? '<p>No medical history recorded</p>' : timeline.map((item) => `
                <div class="activity">
                  <div class="activity-header">${item.type} - ${new Date(item.date).toLocaleDateString('en-PK')}</div>
                  ${item.type === 'OPD' ? `
                    <div class="activity-detail">Doctor: ${item.data.doctors?.name || 'N/A'}</div>
                    <div class="activity-detail">Fee: ${formatCurrency(item.data.fee || 0)}</div>
                    <div class="activity-detail">Payment Status: ${item.data.payment_status}</div>
                  ` : ''}
                  ${item.type === 'Admission' ? `
                    <div class="activity-detail">Doctor: ${item.data.doctors?.name || 'N/A'}</div>
                    <div class="activity-detail">Room: ${item.data.rooms?.room_number || 'N/A'} (${item.data.rooms?.type || 'N/A'})</div>
                    <div class="activity-detail">Type: ${item.data.admission_type}</div>
                    <div class="activity-detail">Deposit: ${formatCurrency(item.data.deposit || 0)}</div>
                    <div class="activity-detail">Status: ${item.data.status}</div>
                  ` : ''}
                  ${item.type === 'Lab' ? `
                    <div class="activity-detail">Tests: ${item.data.tests?.join(', ') || 'N/A'}</div>
                    <div class="activity-detail">Amount: ${formatCurrency(item.data.total_amount || 0)}</div>
                    <div class="activity-detail">Status: ${item.data.status}</div>
                  ` : ''}
                  ${item.type === 'Treatment' ? `
                    <div class="activity-detail">Treatment: ${item.data.treatment_name}</div>
                    <div class="activity-detail">Type: ${item.data.treatment_type}</div>
                    <div class="activity-detail">Doctor: ${item.data.doctors?.name || 'N/A'}</div>
                    <div class="activity-detail">Price: ${formatCurrency(item.data.price || 0)}</div>
                    <div class="activity-detail">Payment: ${item.data.payment_status}</div>
                  ` : ''}
                  ${item.type === 'Appointment' ? `
                    <div class="activity-detail">Time: ${item.data.appointment_time}</div>
                    <div class="activity-detail">Doctor: ${item.data.doctors?.name || 'N/A'}</div>
                    <div class="activity-detail">Status: ${item.data.status}</div>
                  ` : ''}
                </div>
              `).join('')}
            </div>

            <div class="footer">
              <p>Printed on: ${new Date().toLocaleString('en-PK')}</p>
              <p>North Karachi Hospital - Quality Healthcare Services</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  if (!selectedPatient) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-gray-600">
            <User className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>Please select a patient to view their profile</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const timeline = getTimeline();
  const totalSpent = timeline.reduce((sum, item) => {
    if (item.type === 'OPD') return sum + (item.data.fee || 0);
    if (item.type === 'Admission') return sum + (item.data.deposit || 0);
    if (item.type === 'Lab') return sum + (item.data.total_amount || 0);
    if (item.type === 'Treatment') return sum + (item.data.price || 0);
    return sum;
  }, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Profile
            </div>
            <Button onClick={printProfile}>
              <Printer className="h-4 w-4 mr-2" />
              Print Profile
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Patient Information */}
          <div className="bg-blue-50 p-6 rounded-lg mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  {selectedPatient.mrNumber && (
                    <Badge variant="outline" className="text-blue-700 border-blue-700 font-mono text-lg px-3 py-1">
                      {selectedPatient.mrNumber}
                    </Badge>
                  )}
                  <h2 className="text-2xl font-bold">{selectedPatient.name}</h2>
                  <Badge className="text-base">{selectedPatient.department}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-600">Age</p>
                    <p className="font-semibold">{selectedPatient.age} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="font-semibold">{selectedPatient.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Contact</p>
                    <p className="font-semibold">{selectedPatient.contact}</p>
                  </div>
                  {selectedPatient.careOf && (
                    <div>
                      <p className="text-sm text-gray-600">Care Of</p>
                      <p className="font-semibold">{selectedPatient.careOf}</p>
                    </div>
                  )}
                  {selectedPatient.bloodGroup && (
                    <div>
                      <p className="text-sm text-gray-600">Blood Group</p>
                      <p className="font-semibold">{selectedPatient.bloodGroup}</p>
                    </div>
                  )}
                  {selectedPatient.emergencyContact && (
                    <div>
                      <p className="text-sm text-gray-600">Emergency Contact</p>
                      <p className="font-semibold">{selectedPatient.emergencyContact}</p>
                    </div>
                  )}
                  {selectedPatient.cnicNumber && (
                    <div>
                      <p className="text-sm text-gray-600">CNIC</p>
                      <p className="font-semibold">{selectedPatient.cnicNumber}</p>
                    </div>
                  )}
                  {selectedPatient.maritalStatus && (
                    <div>
                      <p className="text-sm text-gray-600">Marital Status</p>
                      <p className="font-semibold">{selectedPatient.maritalStatus}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Registration Date</p>
                    <p className="font-semibold">{new Date(selectedPatient.registrationDate).toLocaleDateString('en-PK')}</p>
                  </div>
                </div>

                {selectedPatient.address && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-semibold">{selectedPatient.address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">OPD Visits</p>
                  <p className="text-2xl font-bold">{history.opdTokens?.data?.length || 0}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Admissions</p>
                  <p className="text-2xl font-bold">{history.admissions?.data?.length || 0}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600">Treatments</p>
                  <p className="text-2xl font-bold">{history.treatments?.data?.length || 0}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <TestTube className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Lab Tests</p>
                  <p className="text-2xl font-bold">{history.labOrders?.data?.length || 0}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-4 mb-6 bg-gradient-to-r from-green-50 to-blue-50">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Amount Spent</p>
              <p className="text-3xl font-bold text-green-700">{formatCurrency(totalSpent)}</p>
            </div>
          </Card>

          <Separator className="my-6" />

          {/* Tabs for different sections */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Timeline</TabsTrigger>
              <TabsTrigger value="opd">OPD ({history.opdTokens?.data?.length || 0})</TabsTrigger>
              <TabsTrigger value="admissions">Admissions ({history.admissions?.data?.length || 0})</TabsTrigger>
              <TabsTrigger value="treatments">Treatments ({history.treatments?.data?.length || 0})</TabsTrigger>
              <TabsTrigger value="labs">Labs ({history.labOrders?.data?.length || 0})</TabsTrigger>
            </TabsList>

            {/* Timeline Tab */}
            <TabsContent value="overview">
              <div className="space-y-4 mt-4">
                {timeline.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No medical history recorded</p>
                  </div>
                ) : (
                  timeline.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <Card key={index} className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg bg-${item.color}-100`}>
                            <Icon className={`h-5 w-5 text-${item.color}-600`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{item.type}</h4>
                              <p className="text-sm text-gray-600">{new Date(item.date).toLocaleDateString('en-PK')}</p>
                            </div>
                            {item.type === 'OPD' && (
                              <div className="text-sm text-gray-600 space-y-1">
                                <p><strong>Doctor:</strong> {item.data.doctors?.name || 'N/A'}</p>
                                <p><strong>Fee:</strong> {formatCurrency(item.data.fee || 0)}</p>
                                <p><strong>Payment:</strong> <Badge className={item.data.payment_status === 'paid' ? 'bg-green-500' : 'bg-red-500'}>{item.data.payment_status}</Badge></p>
                              </div>
                            )}
                            {item.type === 'Admission' && (
                              <div className="text-sm text-gray-600 space-y-1">
                                <p><strong>Doctor:</strong> {item.data.doctors?.name || 'N/A'}</p>
                                <p><strong>Room:</strong> {item.data.rooms?.room_number} ({item.data.rooms?.type})</p>
                                <p><strong>Type:</strong> {item.data.admission_type}</p>
                                <p><strong>Deposit:</strong> {formatCurrency(item.data.deposit || 0)}</p>
                                <p><strong>Status:</strong> <Badge>{item.data.status}</Badge></p>
                              </div>
                            )}
                            {item.type === 'Lab' && (
                              <div className="text-sm text-gray-600 space-y-1">
                                <p><strong>Tests:</strong> {item.data.tests?.join(', ')}</p>
                                <p><strong>Amount:</strong> {formatCurrency(item.data.total_amount || 0)}</p>
                                <p><strong>Status:</strong> <Badge>{item.data.status}</Badge></p>
                              </div>
                            )}
                            {item.type === 'Treatment' && (
                              <div className="text-sm text-gray-600 space-y-1">
                                <p><strong>Treatment:</strong> {item.data.treatment_name}</p>
                                <p><strong>Type:</strong> {item.data.treatment_type}</p>
                                {item.data.doctors?.name && <p><strong>Doctor:</strong> {item.data.doctors.name}</p>}
                                <p><strong>Price:</strong> {formatCurrency(item.data.price || 0)}</p>
                                <p><strong>Payment:</strong> <Badge className={item.data.payment_status === 'paid' ? 'bg-green-500' : 'bg-red-500'}>{item.data.payment_status}</Badge></p>
                              </div>
                            )}
                            {item.type === 'Appointment' && (
                              <div className="text-sm text-gray-600 space-y-1">
                                <p><strong>Time:</strong> {item.data.appointment_time}</p>
                                <p><strong>Doctor:</strong> {item.data.doctors?.name || 'N/A'}</p>
                                <p><strong>Status:</strong> <Badge>{item.data.status}</Badge></p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>

            {/* OPD Tab */}
            <TabsContent value="opd">
              <div className="space-y-3 mt-4">
                {history.opdTokens?.data?.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No OPD visits recorded</p>
                  </div>
                ) : (
                  history.opdTokens?.data?.map((opd: any) => (
                    <Card key={opd.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">Token #{opd.token_number}</p>
                          <p className="text-sm text-gray-600">Doctor: {opd.doctors?.name || 'N/A'}</p>
                          <p className="text-sm text-gray-600">Fee: {formatCurrency(opd.fee || 0)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">{new Date(opd.date).toLocaleDateString('en-PK')}</p>
                          <Badge className={opd.payment_status === 'paid' ? 'bg-green-500' : 'bg-red-500'}>{opd.payment_status}</Badge>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Admissions Tab */}
            <TabsContent value="admissions">
              <div className="space-y-3 mt-4">
                {history.admissions?.data?.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <Bed className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No admissions recorded</p>
                  </div>
                ) : (
                  history.admissions?.data?.map((admission: any) => (
                    <Card key={admission.id} className="p-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold">{admission.rooms?.room_number} - {admission.rooms?.type}</p>
                          <Badge>{admission.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">Doctor: {admission.doctors?.name || 'N/A'}</p>
                        <p className="text-sm text-gray-600">Type: {admission.admission_type}</p>
                        <p className="text-sm text-gray-600">Deposit: {formatCurrency(admission.deposit || 0)}</p>
                        <p className="text-sm text-gray-600">Date: {new Date(admission.admission_date).toLocaleDateString('en-PK')}</p>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Treatments Tab */}
            <TabsContent value="treatments">
              <div className="space-y-3 mt-4">
                {history.treatments?.data?.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <Activity className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No treatments recorded</p>
                  </div>
                ) : (
                  history.treatments?.data?.map((treatment: any) => (
                    <Card key={treatment.id} className="p-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold">{treatment.treatment_name}</p>
                          <Badge className={treatment.payment_status === 'paid' ? 'bg-green-500' : 'bg-red-500'}>
                            {treatment.payment_status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">Type: {treatment.treatment_type}</p>
                        {treatment.doctors?.name && <p className="text-sm text-gray-600">Doctor: {treatment.doctors.name}</p>}
                        <p className="text-sm text-gray-600">Price: {formatCurrency(treatment.price || 0)}</p>
                        <p className="text-sm text-gray-600">Date: {new Date(treatment.date).toLocaleDateString('en-PK')}</p>
                        {treatment.description && <p className="text-sm text-gray-600 mt-2">Description: {treatment.description}</p>}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Labs Tab */}
            <TabsContent value="labs">
              <div className="space-y-3 mt-4">
                {history.labOrders?.data?.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <TestTube className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No lab orders recorded</p>
                  </div>
                ) : (
                  history.labOrders?.data?.map((lab: any) => (
                    <Card key={lab.id} className="p-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold">Lab Order</p>
                          <Badge>{lab.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">Tests: {lab.tests?.join(', ')}</p>
                        <p className="text-sm text-gray-600">Amount: {formatCurrency(lab.total_amount || 0)}</p>
                        <p className="text-sm text-gray-600">Date: {new Date(lab.order_date).toLocaleDateString('en-PK')}</p>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
