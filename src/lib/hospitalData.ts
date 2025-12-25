// ✅ SIMPLIFIED INTERFACES - Using snake_case to match database exactly
// No more confusion between database and code!

export interface Patient {
  id: string;
  mr_number?: string; // Medical Record Number - auto-generated
  name: string;
  age: number;
  date_of_birth?: string; // Optional now, using age field instead
  cnic_number: string;
  gender: 'Male' | 'Female' | 'Other';
  contact: string;
  care_of?: string; // Care of (guardian/responsible person)
  problem: string;
  department: string;
  registration_date: string;
  medical_history?: string;
  emergency_contact?: string;
  address?: string;
  blood_group?: string;
  marital_status?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  created_at?: string;
}

export interface Doctor {
  id: string;
  name: string;
  cnic_number: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  contact: string;
  email: string;
  address: string;
  department: string;
  opd_fee: number;
  commission_type: 'percentage' | 'fixed';
  commission_rate: number;
  specialization: string;
  qualification: string;
  experience: number;
  joining_date: string;
  available: boolean;
  consultation_hours: string;
  room_number?: string;
  created_at?: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  head_of_department?: string;
  location: string;
  contact_extension: string;
  active: boolean;
  created_date: string;
  created_at?: string;
}

export interface LabTest {
  id: string;
  name: string;
  price: number;
  department: string;
  normal_range?: string;
  description?: string;
  sample_type: string;
  report_time: string;
  active: boolean;
  created_at?: string;
}

export interface Room {
  id: string;
  room_number: string;
  type: 'General' | 'Private' | 'ICU' | 'Emergency';
  bed_count: number;
  occupied_beds: number;
  price_per_day: number;
  department: string;
  active: boolean;
  created_at?: string;
}

export interface OPDToken {
  id: string;
  token_number: number;
  patient_id: string;
  doctor_id: string;
  date: string;
  status: 'waiting' | 'in-progress' | 'completed';
  fee: number;
  payment_status: 'paid' | 'pending';
  created_at?: string;
}

export interface Admission {
  id: string;
  patient_id: string;
  doctor_id: string;
  room_id: string;
  bed_number: number;
  admission_date: string;
  admission_type: 'OPD' | 'Direct' | 'Emergency';
  deposit: number;
  status: 'active' | 'discharged';
  notes: string;
  created_at?: string;
}

export interface LabOrder {
  id: string;
  patient_id: string;
  doctor_id?: string;
  tests: string[];
  total_amount: number;
  status: 'pending' | 'in-progress' | 'completed';
  order_date: string;
  results?: { [testId: string]: string };
  created_at?: string;
}

export interface Treatment {
  id: string;
  patient_id: string;
  doctor_id?: string;
  treatment_type: string; // 'Dressing', 'Operation', 'Normal Delivery', 'Seizure', etc.
  treatment_name: string;
  description?: string;
  price: number;
  payment_status: 'paid' | 'pending' | 'partial';
  date: string;
  notes?: string;
  created_at?: string;
}

export interface TreatmentType {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  active: boolean;
  created_at?: string;
}

export interface User {
  id: string;
  username: string;
  full_name: string;
  role: 'Admin' | 'Doctor' | 'Nurse' | 'Receptionist' | 'Lab Technician' | 'Pharmacist';
  email: string;
  contact: string;
  cnic_number: string;
  active: boolean;
  created_date: string;
  permissions: string[];
  password?: string;
  created_at?: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  created_at?: string;
}

// Utility functions
export const generateTokenNumber = (): number => {
  return Math.floor(Math.random() * 1000) + 1;
};

export const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'Rs 0';
  }
  return `Rs ${amount.toLocaleString('en-PK')}`;
};

export const formatDate = (date: string | undefined | null): string => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString('en-IN');
  } catch {
    return 'N/A';
  }
};

export const calculateAge = (dateOfBirth: string | undefined | null): number => {
  if (!dateOfBirth) return 0;

  try {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  } catch {
    return 0;
  }
};

export const validateCNIC = (cnic: string): boolean => {
  if (!cnic) return false;
  const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
  return cnicRegex.test(cnic);
};

export const formatCNIC = (cnic: string): string => {
  if (!cnic) return '';
  const cleaned = cnic.replace(/\D/g, '');
  if (cleaned.length === 13) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12)}`;
  }
  return cnic;
};

// Generate MR Number: NKH-YYYYMMDD-XXXX format
export const generateMRNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `NKH-${year}${month}${day}-${random}`;
};
