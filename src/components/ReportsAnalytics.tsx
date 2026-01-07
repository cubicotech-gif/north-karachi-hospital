import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Users, DollarSign, Bed, TestTube, Calendar, TrendingUp,
  Activity, Stethoscope, Building, FileText, Clock, Printer,
  Receipt, CreditCard, Calculator, FileSpreadsheet, Download,
  PlusCircle, CheckCircle, AlertCircle, RefreshCw, ChevronDown, ChevronUp
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
  totalDoctorCommission: number;
  hospitalShare: number;
}

interface DoctorStats {
  id: string;
  name: string;
  department: string;
  totalPatients: number;
  totalRevenue: number;
  todayPatients: number;
  commissionType: string;
  commissionRate: number;
  commissionAmount: number;
}

interface DepartmentStats {
  name: string;
  patientCount: number;
  revenue: number;
}

interface OPDTokenWithDetails {
  id: string;
  token_number: number;
  patient_id: string;
  doctor_id: string;
  date: string;
  status: string;
  fee: number;
  payment_status: string;
  patient_name?: string;
  patient_mr?: string;
  doctor_name?: string;
  doctor_department?: string;
}

interface Voucher {
  id: string;
  voucher_number: string;
  voucher_type: string;
  doctor_id: string;
  amount: number;
  description: string;
  period_start: string;
  period_end: string;
  patient_count: number;
  total_opd_revenue: number;
  commission_rate: number;
  commission_type: string;
  status: string;
  created_at: string;
  doctors?: { name: string };
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
    completedLabTests: 0,
    totalDoctorCommission: 0,
    hospitalShare: 0
  });

  const [doctorStats, setDoctorStats] = useState<DoctorStats[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [opdTokens, setOpdTokens] = useState<OPDTokenWithDetails[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);

  // Date filters
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterMode, setFilterMode] = useState<'today' | 'week' | 'month' | 'custom'>('today');

  // Voucher creation
  const [showVoucherForm, setShowVoucherForm] = useState(false);
  const [selectedDoctorForVoucher, setSelectedDoctorForVoucher] = useState<string>('');
  const [voucherStartDate, setVoucherStartDate] = useState<string>('');
  const [voucherEndDate, setVoucherEndDate] = useState<string>('');
  const [voucherLoading, setVoucherLoading] = useState(false);

  // Raw data for calculations
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);

  // Expandable doctor list state
  const [expandedDoctorId, setExpandedDoctorId] = useState<string | null>(null);

  useEffect(() => {
    updateDateRange(filterMode);
  }, [filterMode]);

  useEffect(() => {
    fetchAllStats();
  }, [startDate, endDate]);

  const updateDateRange = (mode: string) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (mode) {
      case 'today':
        start = today;
        end = today;
        break;
      case 'week':
        start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        end = today;
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;
      case 'custom':
        return; // Don't update dates for custom mode
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

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
        departmentsRes,
        vouchersRes
      ] = await Promise.all([
        db.patients.getAll(),
        db.doctors.getAll(),
        db.opdTokens.getAll(),
        db.appointments?.getAll() || Promise.resolve({ data: [], error: null }),
        db.admissions.getAll(),
        db.rooms.getAll(),
        db.labOrders.getAll(),
        db.departments.getAll(),
        db.vouchers?.getAll() || Promise.resolve({ data: [], error: null })
      ]);

      if (patientsRes.error) throw patientsRes.error;
      if (doctorsRes.error) throw doctorsRes.error;
      if (opdTokensRes.error) throw opdTokensRes.error;
      if (admissionsRes.error) throw admissionsRes.error;
      if (roomsRes.error) throw roomsRes.error;
      if (labOrdersRes.error) throw labOrdersRes.error;
      if (departmentsRes.error) throw departmentsRes.error;

      const patientsData = patientsRes.data || [];
      const doctorsData = doctorsRes.data || [];
      const allOpdTokens = opdTokensRes.data || [];
      const appointments = appointmentsRes.data || [];
      const admissions = admissionsRes.data || [];
      const rooms = roomsRes.data || [];
      const labOrders = labOrdersRes.data || [];
      const departments = departmentsRes.data || [];
      const vouchersData = vouchersRes.data || [];

      setDoctors(doctorsData);
      setPatients(patientsData);
      setVouchers(vouchersData);

      // Filter tokens by date range (exclude deleted/cancelled)
      const filteredTokens = allOpdTokens.filter((t: any) => {
        const tokenDate = t.date;
        const isInRange = tokenDate >= startDate && tokenDate <= endDate;
        const isNotDeleted = !t.is_deleted;
        const isNotCancelled = !t.is_cancelled;
        return isInRange && isNotDeleted && isNotCancelled;
      });

      // Today's tokens
      const todayTokens = allOpdTokens.filter((t: any) => {
        return t.date === today && !t.is_deleted && !t.is_cancelled;
      });

      const todayAppointments = appointments.filter((a: any) => a.appointment_date === today);

      // Calculate revenues
      const totalRevenue = filteredTokens.reduce((sum: number, t: any) =>
        t.payment_status === 'paid' ? sum + (t.fee || 0) : sum, 0
      );

      const todayRevenue = todayTokens.reduce((sum: number, t: any) =>
        t.payment_status === 'paid' ? sum + (t.fee || 0) : sum, 0
      );

      // Calculate doctor commissions
      let totalDoctorCommission = 0;
      const doctorStatsMap = new Map<string, DoctorStats>();

      doctorsData.forEach((doctor: any) => {
        const doctorTokens = filteredTokens.filter((t: any) => t.doctor_id === doctor.id);
        const paidDoctorTokens = doctorTokens.filter((t: any) => t.payment_status === 'paid');
        const doctorRevenue = paidDoctorTokens.reduce((sum: number, t: any) => sum + (t.fee || 0), 0);

        // Calculate commission based on type
        let commissionAmount = 0;
        const commissionType = doctor.commission_type || 'percentage';
        const commissionRate = doctor.commission_rate || 0;

        if (commissionType === 'percentage') {
          commissionAmount = (doctorRevenue * commissionRate) / 100;
        } else if (commissionType === 'fixed') {
          commissionAmount = paidDoctorTokens.length * commissionRate;
        }

        totalDoctorCommission += commissionAmount;

        const todayDoctorTokens = todayTokens.filter((t: any) => t.doctor_id === doctor.id);

        doctorStatsMap.set(doctor.id, {
          id: doctor.id,
          name: doctor.name,
          department: doctor.department,
          totalPatients: doctorTokens.length,
          totalRevenue: doctorRevenue,
          todayPatients: todayDoctorTokens.length,
          commissionType,
          commissionRate,
          commissionAmount
        });
      });

      const hospitalShare = totalRevenue - totalDoctorCommission;

      // Prepare OPD tokens with details
      const opdTokensWithDetails: OPDTokenWithDetails[] = filteredTokens.map((token: any) => {
        const patient = patientsData.find((p: any) => p.id === token.patient_id);
        const doctor = doctorsData.find((d: any) => d.id === token.doctor_id);
        return {
          ...token,
          patient_name: patient?.name || 'Unknown',
          patient_mr: patient?.mr_number || 'N/A',
          doctor_name: doctor?.name || 'Unknown',
          doctor_department: doctor?.department || 'N/A'
        };
      });

      setOpdTokens(opdTokensWithDetails);

      const activeAdmissions = admissions.filter((a: any) => a.status === 'active').length;
      const totalBeds = rooms.reduce((sum: number, r: any) => sum + r.bed_count, 0);
      const occupiedBeds = rooms.reduce((sum: number, r: any) => sum + r.occupied_beds, 0);

      const pendingLabTests = labOrders.filter((l: any) => l.status === 'pending').length;
      const completedLabTests = labOrders.filter((l: any) => l.status === 'completed').length;

      setStats({
        totalPatients: patientsData.length,
        totalDoctors: doctorsData.length,
        totalAppointments: appointments.length,
        totalRevenue,
        todayPatients: todayTokens.length,
        todayAppointments: todayAppointments.length,
        todayRevenue,
        activeAdmissions,
        totalBeds,
        occupiedBeds,
        pendingLabTests,
        completedLabTests,
        totalDoctorCommission,
        hospitalShare
      });

      setDoctorStats(Array.from(doctorStatsMap.values()));

      // Calculate department-wise stats
      const deptStatsMap = new Map<string, DepartmentStats>();
      departments.forEach((dept: any) => {
        const deptDoctors = doctorsData.filter((d: any) => d.department === dept.name);
        const deptDoctorIds = deptDoctors.map((d: any) => d.id);
        const deptTokens = filteredTokens.filter((t: any) => deptDoctorIds.includes(t.doctor_id));
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

  // Generate voucher number manually
  const generateVoucherNumber = () => {
    const prefix = 'VDC';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}${random}`;
  };

  // Create voucher for doctor
  const createVoucherForDoctor = async (doctor: DoctorStats) => {
    setVoucherLoading(true);
    try {
      const voucherNumber = generateVoucherNumber();
      const voucherData = {
        voucher_number: voucherNumber,
        voucher_type: 'doctor_commission',
        doctor_id: doctor.id,
        amount: doctor.commissionAmount,
        description: `Commission payment for Dr. ${doctor.name} from ${startDate} to ${endDate}`,
        period_start: startDate,
        period_end: endDate,
        patient_count: doctor.totalPatients,
        total_opd_revenue: doctor.totalRevenue,
        commission_rate: doctor.commissionRate,
        commission_type: doctor.commissionType,
        status: 'pending',
        created_by: localStorage.getItem('currentUser') || 'system'
      };

      const { data, error } = await db.vouchers.create(voucherData);

      if (error) {
        console.error('Error creating voucher:', error);
        toast.error('Failed to create voucher. Please ensure the database migration has been run.');
        return;
      }

      toast.success(`Voucher created for Dr. ${doctor.name}`);
      fetchAllStats(); // Refresh to get new voucher
    } catch (error) {
      console.error('Error creating voucher:', error);
      toast.error('Failed to create voucher');
    } finally {
      setVoucherLoading(false);
    }
  };

  // Create vouchers for all doctors
  const createVouchersForAllDoctors = async () => {
    setVoucherLoading(true);
    try {
      const doctorsWithCommission = doctorStats.filter(d => d.commissionAmount > 0);
      let successCount = 0;

      for (const doctor of doctorsWithCommission) {
        const voucherNumber = generateVoucherNumber();
        const voucherData = {
          voucher_number: voucherNumber,
          voucher_type: 'doctor_commission',
          doctor_id: doctor.id,
          amount: doctor.commissionAmount,
          description: `Commission payment for Dr. ${doctor.name} from ${startDate} to ${endDate}`,
          period_start: startDate,
          period_end: endDate,
          patient_count: doctor.totalPatients,
          total_opd_revenue: doctor.totalRevenue,
          commission_rate: doctor.commissionRate,
          commission_type: doctor.commissionType,
          status: 'pending',
          created_by: localStorage.getItem('currentUser') || 'system'
        };

        const { error } = await db.vouchers.create(voucherData);
        if (!error) successCount++;
      }

      if (successCount > 0) {
        toast.success(`Created vouchers for ${successCount} doctors`);
      } else {
        toast.error('Failed to create vouchers. Please ensure the database migration has been run.');
      }
      fetchAllStats();
    } catch (error) {
      console.error('Error creating vouchers:', error);
      toast.error('Failed to create vouchers');
    } finally {
      setVoucherLoading(false);
    }
  };

  // Mark voucher as paid
  const markVoucherPaid = async (voucherId: string, paymentMethod: string) => {
    try {
      const { error } = await db.vouchers.update(voucherId, {
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
        payment_method: paymentMethod
      });

      if (error) {
        toast.error('Failed to update voucher');
        return;
      }

      toast.success('Voucher marked as paid');
      fetchAllStats();
    } catch (error) {
      console.error('Error updating voucher:', error);
      toast.error('Failed to update voucher');
    }
  };

  // Print voucher
  const printVoucher = (voucher: Voucher) => {
    const doctorName = voucher.doctors?.name || 'Unknown Doctor';

    const printContent = `
      <html>
        <head>
          <title>Voucher - ${voucher.voucher_number}</title>
          <style>
            @page {
              size: A4;
              margin: 2in 1in 1in 1in;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Arial', sans-serif;
              padding: 20px;
              font-size: 14px;
            }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
            .hospital-name { font-size: 24px; font-weight: bold; }
            .hospital-urdu { font-size: 18px; }
            .address { font-size: 12px; margin-top: 5px; color: #555; }
            .voucher-title {
              background: #000;
              color: white;
              padding: 10px 20px;
              font-size: 18px;
              font-weight: bold;
              text-align: center;
              margin: 20px 0;
            }
            .voucher-number { font-size: 16px; font-weight: bold; margin-bottom: 15px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
            .info-item { padding: 10px; background: #f5f5f5; border-radius: 5px; }
            .info-label { font-size: 12px; color: #666; }
            .info-value { font-size: 16px; font-weight: bold; margin-top: 5px; }
            .amount-box {
              text-align: center;
              padding: 20px;
              background: #000;
              color: white;
              margin: 20px 0;
              border-radius: 5px;
            }
            .amount { font-size: 32px; font-weight: bold; }
            .amount-label { font-size: 14px; margin-top: 5px; }
            .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .details-table th, .details-table td {
              border: 1px solid #ccc;
              padding: 10px;
              text-align: left;
            }
            .details-table th { background: #f0f0f0; }
            .signature-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 50px;
              margin-top: 50px;
              padding-top: 20px;
            }
            .signature-box { text-align: center; }
            .signature-line { border-top: 1px solid #000; margin-top: 50px; padding-top: 10px; }
            .footer { text-align: center; font-size: 11px; color: #666; margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px; }
            .status-badge {
              display: inline-block;
              padding: 5px 15px;
              border-radius: 20px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-pending { background: #ffc107; color: #000; }
            .status-paid { background: #28a745; color: #fff; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="hospital-name">North Karachi Hospital</div>
            <div class="hospital-urdu">نارتھ کراچی ہسپتال</div>
            <div class="address">C-122, Sector 11-B, North Karachi, Karachi | Phone: 36989080</div>
          </div>

          <div class="voucher-title">PAYMENT VOUCHER / ادائیگی واؤچر</div>

          <div class="voucher-number">Voucher No: ${voucher.voucher_number}</div>

          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Pay To / ادائیگی برائے:</div>
              <div class="info-value">Dr. ${doctorName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Voucher Date / تاریخ:</div>
              <div class="info-value">${new Date(voucher.created_at).toLocaleDateString('en-PK')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Period From / مدت شروع:</div>
              <div class="info-value">${new Date(voucher.period_start).toLocaleDateString('en-PK')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Period To / مدت ختم:</div>
              <div class="info-value">${new Date(voucher.period_end).toLocaleDateString('en-PK')}</div>
            </div>
          </div>

          <table class="details-table">
            <thead>
              <tr>
                <th>Description / تفصیل</th>
                <th style="text-align: right;">Amount / رقم</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Patients / کل مریض</td>
                <td style="text-align: right;">${voucher.patient_count}</td>
              </tr>
              <tr>
                <td>Total OPD Revenue / کل او پی ڈی آمدنی</td>
                <td style="text-align: right;">${formatCurrency(voucher.total_opd_revenue)}</td>
              </tr>
              <tr>
                <td>Commission Rate / کمیشن کی شرح</td>
                <td style="text-align: right;">${voucher.commission_type === 'percentage' ? voucher.commission_rate + '%' : formatCurrency(voucher.commission_rate) + '/patient'}</td>
              </tr>
              <tr style="font-weight: bold; font-size: 16px;">
                <td>Commission Amount / کمیشن کی رقم</td>
                <td style="text-align: right;">${formatCurrency(voucher.amount)}</td>
              </tr>
            </tbody>
          </table>

          <div class="amount-box">
            <div class="amount">${formatCurrency(voucher.amount)}</div>
            <div class="amount-label">Total Payable Amount / کل قابل ادائیگی رقم</div>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <span class="status-badge ${voucher.status === 'paid' ? 'status-paid' : 'status-pending'}">
              ${voucher.status === 'paid' ? 'PAID / ادا شدہ' : 'PENDING / زیر التواء'}
            </span>
          </div>

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">Prepared By / تیار کنندہ</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">Approved By / منظور کنندہ</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">Received By / وصول کنندہ</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">Accountant / محاسب</div>
            </div>
          </div>

          <div class="footer">
            This is a computer generated voucher | یہ کمپیوٹر سے تیار کردہ واؤچر ہے<br>
            Printed on: ${new Date().toLocaleString('en-PK')}
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Print patient receipt
  const printPatientReceipt = (token: OPDTokenWithDetails) => {
    const printContent = `
      <html>
        <head>
          <title>OPD Receipt</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 2in 0.5in 1in 0.5in;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Arial', sans-serif;
              width: 80mm;
              padding: 3mm;
              font-size: 10px;
            }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 2mm; margin-bottom: 2mm; }
            .hospital-name { font-size: 13px; font-weight: bold; }
            .hospital-urdu { font-size: 11px; }
            .address { font-size: 8px; margin-top: 1mm; }
            .receipt-title { background: #000; color: white; padding: 2mm; text-align: center; font-size: 12px; font-weight: bold; margin: 2mm 0; }
            .token-box { text-align: center; padding: 3mm; background: #f0f0f0; margin: 2mm 0; }
            .token-number { font-size: 28px; font-weight: bold; }
            .info-row { display: flex; justify-content: space-between; font-size: 9px; margin: 1mm 0; }
            .divider { border-top: 1px dashed #000; margin: 2mm 0; }
            .total-row { display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; padding: 2mm; background: #f0f0f0; }
            .status { text-align: center; padding: 2mm; margin: 2mm 0; font-weight: bold; }
            .status.paid { background: #000; color: white; }
            .status.pending { border: 2px solid #000; }
            .footer { text-align: center; font-size: 8px; margin-top: 2mm; padding-top: 2mm; border-top: 1px dashed #000; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="hospital-name">North Karachi Hospital</div>
            <div class="hospital-urdu">نارتھ کراچی ہسپتال</div>
            <div class="address">C-122, Sector 11-B, North Karachi | 36989080</div>
          </div>

          <div class="receipt-title">OPD RECEIPT / او پی ڈی رسید</div>

          <div class="token-box">
            <div style="font-size: 9px;">Token Number / ٹوکن نمبر</div>
            <div class="token-number">${token.token_number}</div>
          </div>

          <div class="info-row">
            <span>Date / تاریخ:</span>
            <span>${new Date(token.date).toLocaleDateString('en-PK')}</span>
          </div>

          <div class="divider"></div>

          <div style="font-size: 9px; margin: 2mm 0;">
            <div><strong>Patient / مریض:</strong> ${token.patient_name}</div>
            <div><strong>MR#:</strong> ${token.patient_mr}</div>
          </div>

          <div class="divider"></div>

          <div style="font-size: 9px; margin: 2mm 0;">
            <div><strong>Doctor / ڈاکٹر:</strong> Dr. ${token.doctor_name}</div>
            <div><strong>Department / شعبہ:</strong> ${token.doctor_department}</div>
          </div>

          <div class="divider"></div>

          <div class="total-row">
            <span>OPD Fee / فیس:</span>
            <span>${formatCurrency(token.fee)}</span>
          </div>

          <div class="status ${token.payment_status === 'paid' ? 'paid' : 'pending'}">
            ${token.payment_status === 'paid' ? '✓ PAID / ادا شدہ' : '✗ PENDING / زیر التواء'}
          </div>

          <div class="footer">
            Thank you / شکریہ<br>
            ${new Date().toLocaleString('en-PK')}
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Print summary report
  const printSummaryReport = () => {
    const printContent = `
      <html>
        <head>
          <title>Revenue Report - ${startDate} to ${endDate}</title>
          <style>
            @page {
              size: A4;
              margin: 2in 1in 1in 1in;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Arial', sans-serif;
              padding: 20px;
              font-size: 12px;
            }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
            .hospital-name { font-size: 22px; font-weight: bold; }
            .hospital-urdu { font-size: 16px; }
            .report-title {
              background: #000;
              color: white;
              padding: 10px;
              font-size: 16px;
              font-weight: bold;
              text-align: center;
              margin: 15px 0;
            }
            .period { text-align: center; font-size: 14px; margin-bottom: 15px; }
            .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
            .summary-item { padding: 15px; background: #f5f5f5; border-radius: 5px; text-align: center; }
            .summary-value { font-size: 20px; font-weight: bold; }
            .summary-label { font-size: 11px; color: #666; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 11px; }
            th { background: #f0f0f0; font-weight: bold; }
            .text-right { text-align: right; }
            .total-row { font-weight: bold; background: #e0e0e0; }
            .footer { text-align: center; font-size: 10px; color: #666; margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="hospital-name">North Karachi Hospital</div>
            <div class="hospital-urdu">نارتھ کراچی ہسپتال</div>
          </div>

          <div class="report-title">REVENUE SUMMARY REPORT / آمدنی کی رپورٹ</div>

          <div class="period">
            Period: ${new Date(startDate).toLocaleDateString('en-PK')} to ${new Date(endDate).toLocaleDateString('en-PK')}
          </div>

          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">${stats.todayPatients}</div>
              <div class="summary-label">Total Patients</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${formatCurrency(stats.totalRevenue)}</div>
              <div class="summary-label">Total Revenue</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${formatCurrency(stats.hospitalShare)}</div>
              <div class="summary-label">Hospital Share</div>
            </div>
          </div>

          <h3 style="margin: 15px 0 10px 0;">Doctor-wise Revenue & Commission</h3>
          <table>
            <thead>
              <tr>
                <th>Doctor Name</th>
                <th>Department</th>
                <th class="text-right">Patients</th>
                <th class="text-right">Revenue</th>
                <th class="text-right">Commission Rate</th>
                <th class="text-right">Commission</th>
              </tr>
            </thead>
            <tbody>
              ${doctorStats.filter(d => d.totalPatients > 0).map(doctor => `
                <tr>
                  <td>Dr. ${doctor.name}</td>
                  <td>${doctor.department}</td>
                  <td class="text-right">${doctor.totalPatients}</td>
                  <td class="text-right">${formatCurrency(doctor.totalRevenue)}</td>
                  <td class="text-right">${doctor.commissionType === 'percentage' ? doctor.commissionRate + '%' : formatCurrency(doctor.commissionRate)}</td>
                  <td class="text-right">${formatCurrency(doctor.commissionAmount)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3">TOTAL</td>
                <td class="text-right">${formatCurrency(stats.totalRevenue)}</td>
                <td></td>
                <td class="text-right">${formatCurrency(stats.totalDoctorCommission)}</td>
              </tr>
            </tbody>
          </table>

          <div class="summary-grid" style="margin-top: 20px;">
            <div class="summary-item" style="background: #d4edda;">
              <div class="summary-value">${formatCurrency(stats.totalRevenue)}</div>
              <div class="summary-label">Total Revenue / کل آمدنی</div>
            </div>
            <div class="summary-item" style="background: #fff3cd;">
              <div class="summary-value">${formatCurrency(stats.totalDoctorCommission)}</div>
              <div class="summary-label">Doctor Commission / ڈاکٹر کمیشن</div>
            </div>
            <div class="summary-item" style="background: #cce5ff;">
              <div class="summary-value">${formatCurrency(stats.hospitalShare)}</div>
              <div class="summary-label">Hospital Share / ہسپتال حصہ</div>
            </div>
          </div>

          <div class="footer">
            Generated on: ${new Date().toLocaleString('en-PK')} | This is a computer generated report
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Get tokens for a specific doctor
  const getDoctorTokens = (doctorId: string) => {
    return opdTokens.filter(token => token.doctor_id === doctorId);
  };

  // Toggle doctor expansion
  const toggleDoctorExpansion = (doctorId: string) => {
    setExpandedDoctorId(expandedDoctorId === doctorId ? null : doctorId);
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
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Reports & Analytics Dashboard
              <Badge variant="outline" className="ml-2">
                {new Date().toLocaleDateString()}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => fetchAllStats()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={printSummaryReport} variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Date Filters */}
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label>Filter Period</Label>
              <Select value={filterMode} onValueChange={(v: any) => setFilterMode(v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {filterMode === 'custom' && (
              <>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
            <Badge variant="secondary" className="py-2">
              {startDate === endDate ? startDate : `${startDate} to ${endDate}`}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Total Patients</p>
                <p className="text-3xl font-bold text-blue-700">{opdTokens.length}</p>
              </div>
              <Users className="h-10 w-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Total Revenue</p>
                <p className="text-3xl font-bold text-green-700">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-10 w-10 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600">Doctor Commission</p>
                <p className="text-3xl font-bold text-yellow-700">{formatCurrency(stats.totalDoctorCommission)}</p>
              </div>
              <Stethoscope className="h-10 w-10 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Hospital Share</p>
                <p className="text-3xl font-bold text-purple-700">{formatCurrency(stats.hospitalShare)}</p>
              </div>
              <Building className="h-10 w-10 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="patients" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="patients">Patient List</TabsTrigger>
          <TabsTrigger value="doctors">Doctor Commission</TabsTrigger>
          <TabsTrigger value="vouchers">Vouchers</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        {/* Patient List Tab */}
        <TabsContent value="patients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Patient List ({opdTokens.length} records)
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {opdTokens.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No records found for selected period</p>
                ) : (
                  opdTokens.map((token) => (
                    <Card key={token.id} className={`p-4 ${token.payment_status === 'paid' ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">Token #{token.token_number}</Badge>
                            <Badge className={token.payment_status === 'paid' ? 'bg-green-500' : 'bg-red-500'}>
                              {token.payment_status.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-gray-600">{new Date(token.date).toLocaleDateString('en-PK')}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p><strong>Patient:</strong> {token.patient_name}</p>
                              <p><strong>MR#:</strong> {token.patient_mr}</p>
                            </div>
                            <div>
                              <p><strong>Doctor:</strong> Dr. {token.doctor_name}</p>
                              <p><strong>Fee:</strong> {formatCurrency(token.fee)}</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => printPatientReceipt(token)}
                        >
                          <Printer className="h-4 w-4 mr-1" />
                          Print
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Doctor Commission Tab */}
        <TabsContent value="doctors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Doctor Commission Summary
                </div>
                <Button
                  onClick={createVouchersForAllDoctors}
                  disabled={voucherLoading || doctorStats.filter(d => d.commissionAmount > 0).length === 0}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create All Vouchers
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">Click on a doctor to view their patient list</p>
              <div className="space-y-3">
                {doctorStats
                  .sort((a, b) => b.totalRevenue - a.totalRevenue)
                  .map(doctor => {
                    const isExpanded = expandedDoctorId === doctor.id;
                    const doctorTokens = isExpanded ? getDoctorTokens(doctor.id) : [];

                    return (
                      <Card key={doctor.id} className="overflow-hidden">
                        {/* Doctor Summary Row - Clickable */}
                        <div
                          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => toggleDoctorExpansion(doctor.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 flex items-center gap-3">
                              <div className={`p-1 rounded transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-lg">Dr. {doctor.name}</h4>
                                <p className="text-sm text-gray-600">{doctor.department}</p>
                                <div className="flex gap-4 mt-2 text-sm">
                                  <span className="text-blue-600">
                                    <strong>Patients:</strong> {doctor.totalPatients}
                                  </span>
                                  <span className="text-green-600">
                                    <strong>Revenue:</strong> {formatCurrency(doctor.totalRevenue)}
                                  </span>
                                  <span className="text-gray-600">
                                    <strong>Rate:</strong> {doctor.commissionType === 'percentage' ? `${doctor.commissionRate}%` : `${formatCurrency(doctor.commissionRate)}/patient`}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right" onClick={(e) => e.stopPropagation()}>
                              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(doctor.commissionAmount)}</p>
                              <p className="text-xs text-gray-500">Commission</p>
                              {doctor.commissionAmount > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-2"
                                  onClick={() => createVoucherForDoctor(doctor)}
                                  disabled={voucherLoading}
                                >
                                  <Receipt className="h-3 w-3 mr-1" />
                                  Create Voucher
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expandable Patient List */}
                        {isExpanded && (
                          <div className="border-t bg-gray-50 p-4">
                            <h5 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Patients Consulted ({doctorTokens.length})
                            </h5>
                            {doctorTokens.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-4">No patients found for this period</p>
                            ) : (
                              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {doctorTokens.map((token, idx) => (
                                  <div
                                    key={token.id}
                                    className={`flex items-center justify-between p-3 rounded-lg ${
                                      token.payment_status === 'paid' ? 'bg-green-50' : 'bg-red-50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm font-mono text-gray-500">#{idx + 1}</span>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="text-xs">Token #{token.token_number}</Badge>
                                          <span className="font-medium">{token.patient_name}</span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          MR#: {token.patient_mr} | {new Date(token.date).toLocaleDateString('en-PK')}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="text-right">
                                        <p className="font-semibold">{formatCurrency(token.fee)}</p>
                                        <Badge className={`text-xs ${token.payment_status === 'paid' ? 'bg-green-500' : 'bg-red-500'}`}>
                                          {token.payment_status.toUpperCase()}
                                        </Badge>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          printPatientReceipt(token);
                                        }}
                                      >
                                        <Printer className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                {doctorStats.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No doctor data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vouchers Tab */}
        <TabsContent value="vouchers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Payment Vouchers ({vouchers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {vouchers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No vouchers created yet</p>
                ) : (
                  vouchers.map((voucher) => (
                    <Card key={voucher.id} className={`p-4 ${voucher.status === 'paid' ? 'bg-green-50' : 'bg-yellow-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{voucher.voucher_number}</Badge>
                            <Badge className={voucher.status === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}>
                              {voucher.status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="font-semibold">Dr. {voucher.doctors?.name || 'Unknown'}</p>
                          <div className="text-sm text-gray-600">
                            <p>Period: {new Date(voucher.period_start).toLocaleDateString()} - {new Date(voucher.period_end).toLocaleDateString()}</p>
                            <p>Patients: {voucher.patient_count} | Revenue: {formatCurrency(voucher.total_opd_revenue)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">{formatCurrency(voucher.amount)}</p>
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => printVoucher(voucher)}
                            >
                              <Printer className="h-3 w-3 mr-1" />
                              Print
                            </Button>
                            {voucher.status !== 'paid' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => markVoucherPaid(voucher.id, 'cash')}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Mark Paid
                              </Button>
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

        {/* Departments Tab */}
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
                              <p className="text-xs text-gray-600">Patients</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-600">{formatCurrency(dept.revenue)}</p>
                              <p className="text-xs text-gray-600">Revenue</p>
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

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
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
                    <p className="text-sm text-gray-600">Active Admissions</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.activeAdmissions}</p>
                  </div>
                  <Bed className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Bed Occupancy</p>
                    <p className="text-2xl font-bold">{stats.occupiedBeds}/{stats.totalBeds}</p>
                    <p className="text-xs text-gray-500">{occupancyPercentage}%</p>
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

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Today's Patients</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.todayPatients}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Today's Revenue</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.todayRevenue)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
