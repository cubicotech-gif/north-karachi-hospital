import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Trash2, XCircle, FileText, Clock, User, Stethoscope,
  RefreshCw, AlertTriangle, RotateCcw, Search, Calendar,
  Activity, TestTube, Bed, CalendarDays
} from 'lucide-react';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/hospitalData';

interface DeletedRecord {
  id: string;
  token_number?: number;
  patient_id: string;
  doctor_id?: string;
  date?: string;
  status: string;
  fee?: number;
  payment_status?: string;
  is_deleted: boolean;
  deleted_at?: string;
  deleted_by?: string;
  deletion_reason?: string;
  is_cancelled: boolean;
  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  patients?: { name: string; mr_number: string };
  doctors?: { name: string };
}

interface AuditLogEntry {
  id: string;
  action: string;
  table_name: string;
  record_id: string;
  record_data: any;
  reason?: string;
  performed_by?: string;
  created_at: string;
}

export default function DeletedCancelledRecords() {
  const [opdDeleted, setOpdDeleted] = useState<DeletedRecord[]>([]);
  const [opdCancelled, setOpdCancelled] = useState<DeletedRecord[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('opd-deleted');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAllRecords();
  }, []);

  const fetchAllRecords = async () => {
    setLoading(true);
    try {
      // Fetch deleted OPD tokens
      const { data: deletedTokens, error: deletedError } = await db.opdTokensExtended?.getDeleted() || { data: [], error: null };

      // Fetch cancelled OPD tokens
      const { data: cancelledTokens, error: cancelledError } = await db.opdTokensExtended?.getCancelled() || { data: [], error: null };

      // Fetch audit log
      const { data: auditData, error: auditError } = await db.auditLog?.getAll() || { data: [], error: null };

      if (deletedError) console.error('Error fetching deleted tokens:', deletedError);
      if (cancelledError) console.error('Error fetching cancelled tokens:', cancelledError);
      if (auditError) console.error('Error fetching audit log:', auditError);

      setOpdDeleted(deletedTokens || []);
      setOpdCancelled(cancelledTokens || []);
      setAuditLog(auditData || []);

    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  // Restore a deleted OPD token
  const restoreOpdToken = async (tokenId: string) => {
    try {
      const { error } = await db.opdTokensExtended?.restore(tokenId);

      if (error) {
        console.error('Error restoring token:', error);
        toast.error('Failed to restore token');
        return;
      }

      toast.success('Token restored successfully');
      fetchAllRecords();
    } catch (error) {
      console.error('Error restoring token:', error);
      toast.error('Failed to restore token');
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-PK');
  };

  const filteredOpdDeleted = opdDeleted.filter(record => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      record.patients?.name?.toLowerCase().includes(query) ||
      record.patients?.mr_number?.toLowerCase().includes(query) ||
      record.doctors?.name?.toLowerCase().includes(query) ||
      record.token_number?.toString().includes(query)
    );
  });

  const filteredOpdCancelled = opdCancelled.filter(record => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      record.patients?.name?.toLowerCase().includes(query) ||
      record.patients?.mr_number?.toLowerCase().includes(query) ||
      record.doctors?.name?.toLowerCase().includes(query) ||
      record.token_number?.toString().includes(query)
    );
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Activity className="h-8 w-8 mx-auto mb-4 animate-pulse text-red-600" />
          <p className="text-gray-600">Loading deleted/cancelled records...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Deleted & Cancelled Records
              <Badge variant="destructive" className="ml-2">
                {opdDeleted.length + opdCancelled.length} Records
              </Badge>
            </div>
            <Button onClick={fetchAllRecords} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="sr-only">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by patient name, MR number, doctor, or token number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">Deleted OPD Tokens</p>
                <p className="text-3xl font-bold text-red-700">{opdDeleted.length}</p>
              </div>
              <Trash2 className="h-10 w-10 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600">Cancelled OPD Tokens</p>
                <p className="text-3xl font-bold text-yellow-700">{opdCancelled.length}</p>
              </div>
              <XCircle className="h-10 w-10 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Audit Log Entries</p>
                <p className="text-3xl font-bold text-gray-700">{auditLog.length}</p>
              </div>
              <FileText className="h-10 w-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Total Records</p>
                <p className="text-3xl font-bold text-blue-700">{opdDeleted.length + opdCancelled.length}</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="opd-deleted" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Deleted OPD ({opdDeleted.length})
          </TabsTrigger>
          <TabsTrigger value="opd-cancelled" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Cancelled OPD ({opdCancelled.length})
          </TabsTrigger>
          <TabsTrigger value="audit-log" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Audit Log ({auditLog.length})
          </TabsTrigger>
          <TabsTrigger value="all-modules" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            All Modules
          </TabsTrigger>
        </TabsList>

        {/* Deleted OPD Tokens Tab */}
        <TabsContent value="opd-deleted" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Deleted OPD Tokens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredOpdDeleted.length === 0 ? (
                  <div className="text-center py-12">
                    <Trash2 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No deleted OPD tokens found</p>
                  </div>
                ) : (
                  filteredOpdDeleted.map((record) => (
                    <Card key={record.id} className="p-4 bg-red-50 border-red-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="destructive">DELETED</Badge>
                            <Badge variant="outline">Token #{record.token_number}</Badge>
                            <span className="text-sm text-gray-600">
                              {record.date ? new Date(record.date).toLocaleDateString('en-PK') : 'N/A'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <p className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <strong>Patient:</strong> {record.patients?.name || 'Unknown'}
                              </p>
                              <p><strong>MR#:</strong> {record.patients?.mr_number || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="flex items-center gap-1">
                                <Stethoscope className="h-3 w-3" />
                                <strong>Doctor:</strong> Dr. {record.doctors?.name || 'Unknown'}
                              </p>
                              <p><strong>Fee:</strong> {formatCurrency(record.fee || 0)}</p>
                            </div>
                          </div>

                          <div className="bg-red-100 rounded p-3 text-sm">
                            <div className="flex items-center gap-2 text-red-700 mb-1">
                              <Clock className="h-3 w-3" />
                              <strong>Deleted:</strong> {formatDateTime(record.deleted_at)}
                            </div>
                            <p><strong>Deleted By:</strong> {record.deleted_by || 'Unknown'}</p>
                            {record.deletion_reason && (
                              <p className="mt-1">
                                <strong>Reason:</strong> {record.deletion_reason}
                              </p>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => restoreOpdToken(record.id)}
                          className="ml-4"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cancelled OPD Tokens Tab */}
        <TabsContent value="opd-cancelled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <XCircle className="h-5 w-5" />
                Cancelled OPD Tokens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredOpdCancelled.length === 0 ? (
                  <div className="text-center py-12">
                    <XCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No cancelled OPD tokens found</p>
                  </div>
                ) : (
                  filteredOpdCancelled.map((record) => (
                    <Card key={record.id} className="p-4 bg-yellow-50 border-yellow-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-yellow-500">CANCELLED</Badge>
                            <Badge variant="outline">Token #{record.token_number}</Badge>
                            <span className="text-sm text-gray-600">
                              {record.date ? new Date(record.date).toLocaleDateString('en-PK') : 'N/A'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <p className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <strong>Patient:</strong> {record.patients?.name || 'Unknown'}
                              </p>
                              <p><strong>MR#:</strong> {record.patients?.mr_number || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="flex items-center gap-1">
                                <Stethoscope className="h-3 w-3" />
                                <strong>Doctor:</strong> Dr. {record.doctors?.name || 'Unknown'}
                              </p>
                              <p><strong>Fee:</strong> {formatCurrency(record.fee || 0)}</p>
                            </div>
                          </div>

                          <div className="bg-yellow-100 rounded p-3 text-sm">
                            <div className="flex items-center gap-2 text-yellow-700 mb-1">
                              <Clock className="h-3 w-3" />
                              <strong>Cancelled:</strong> {formatDateTime(record.cancelled_at)}
                            </div>
                            <p><strong>Cancelled By:</strong> {record.cancelled_by || 'Unknown'}</p>
                            {record.cancellation_reason && (
                              <p className="mt-1">
                                <strong>Reason:</strong> {record.cancellation_reason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit-log" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                System Audit Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {auditLog.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No audit log entries found</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Audit log will record deletions and cancellations
                    </p>
                  </div>
                ) : (
                  auditLog.map((entry) => (
                    <Card key={entry.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={entry.action === 'delete' ? 'destructive' : 'secondary'}>
                              {entry.action.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{entry.table_name}</Badge>
                            <span className="text-sm text-gray-600">
                              {formatDateTime(entry.created_at)}
                            </span>
                          </div>

                          <div className="text-sm">
                            <p><strong>Record ID:</strong> {entry.record_id}</p>
                            {entry.performed_by && (
                              <p><strong>Performed By:</strong> {entry.performed_by}</p>
                            )}
                            {entry.reason && (
                              <p><strong>Reason:</strong> {entry.reason}</p>
                            )}
                          </div>

                          {entry.record_data && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-sm text-blue-600">
                                View Record Data
                              </summary>
                              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                {JSON.stringify(entry.record_data, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Modules Tab */}
        <TabsContent value="all-modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                All Modules Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* OPD Tokens */}
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">OPD Tokens</h4>
                      <p className="text-sm text-gray-600">Outpatient Department</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-red-50 rounded">
                      <p className="text-red-600 font-semibold">{opdDeleted.length}</p>
                      <p className="text-xs text-gray-600">Deleted</p>
                    </div>
                    <div className="p-2 bg-yellow-50 rounded">
                      <p className="text-yellow-600 font-semibold">{opdCancelled.length}</p>
                      <p className="text-xs text-gray-600">Cancelled</p>
                    </div>
                  </div>
                </Card>

                {/* Admissions */}
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Bed className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Admissions</h4>
                      <p className="text-sm text-gray-600">Inpatient Department</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-red-50 rounded">
                      <p className="text-red-600 font-semibold">0</p>
                      <p className="text-xs text-gray-600">Deleted</p>
                    </div>
                    <div className="p-2 bg-yellow-50 rounded">
                      <p className="text-yellow-600 font-semibold">0</p>
                      <p className="text-xs text-gray-600">Cancelled</p>
                    </div>
                  </div>
                </Card>

                {/* Lab Orders */}
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TestTube className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Lab Orders</h4>
                      <p className="text-sm text-gray-600">Laboratory Tests</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-red-50 rounded">
                      <p className="text-red-600 font-semibold">0</p>
                      <p className="text-xs text-gray-600">Deleted</p>
                    </div>
                    <div className="p-2 bg-yellow-50 rounded">
                      <p className="text-yellow-600 font-semibold">0</p>
                      <p className="text-xs text-gray-600">Cancelled</p>
                    </div>
                  </div>
                </Card>

                {/* Appointments */}
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <CalendarDays className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">Appointments</h4>
                      <p className="text-sm text-gray-600">Scheduled Visits</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-red-50 rounded">
                      <p className="text-red-600 font-semibold">0</p>
                      <p className="text-xs text-gray-600">Deleted</p>
                    </div>
                    <div className="p-2 bg-yellow-50 rounded">
                      <p className="text-yellow-600 font-semibold">0</p>
                      <p className="text-xs text-gray-600">Cancelled</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  Important Information
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>- Deleted records are soft-deleted and can be restored</li>
                  <li>- Cancelled records remain in the system for audit purposes</li>
                  <li>- All deletions and cancellations are logged in the audit trail</li>
                  <li>- Only authorized personnel should restore or permanently delete records</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
