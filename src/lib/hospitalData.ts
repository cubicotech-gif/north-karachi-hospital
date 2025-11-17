export interface Patient {
  id: string;
  name: string;
  age: number;
  dateOfBirth: string;
  cnicNumber: string;
  gender: 'Male' | 'Female' | 'Other';
  contact: string;
  problem: string;
  department: string;
  registrationDate: string;
  medicalHistory?: string;
  emergencyContact?: string;
  address?: string;
  bloodGroup?: string;
  maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
}

export interface Doctor {
  id: string;
  name: string;
  cnicNumber: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  contact: string;
  email: string;
  address: string;
  department: string;
  opdFee: number;
  commissionType: 'percentage' | 'fixed';
  commissionRate: number;
  specialization: string;
  qualification: string;
  experience: number;
  joiningDate: string;
  available: boolean;
  consultationHours: string;
  roomNumber?: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  headOfDepartment?: string;
  location: string;
  contactExtension: string;
  active: boolean;
  createdDate: string;
}

export interface LabTest {
  id: string;
  name: string;
  price: number;
  department: string;
  normalRange?: string;
  description?: string;
  sampleType: string;
  reportTime: string;
  active: boolean;
}

export interface Room {
  id: string;
  roomNumber: string;
  type: 'General' | 'Private' | 'ICU' | 'Emergency';
  bedCount: number;
  occupiedBeds: number;
  pricePerDay: number;
  department: string;
  active: boolean;
}

export interface OPDToken {
  id: string;
  tokenNumber: number;
  patientId: string;
  doctorId: string;
  date: string;
  status: 'waiting' | 'in-progress' | 'completed';
  fee: number;
  paymentStatus: 'paid' | 'pending';
}

export interface Admission {
  id: string;
  patientId: string;
  doctorId: string;
  roomId: string;
  bedNumber: number;
  admissionDate: string;
  admissionType: 'OPD' | 'Direct' | 'Emergency';
  deposit: number;
  status: 'active' | 'discharged';
  notes: string;
}

export interface LabOrder {
  id: string;
  patientId: string;
  doctorId?: string;
  tests: string[];
  totalAmount: number;
  status: 'pending' | 'in-progress' | 'completed';
  orderDate: string;
  results?: { [testId: string]: string };
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'Admin' | 'Doctor' | 'Nurse' | 'Receptionist' | 'Lab Technician' | 'Pharmacist';
  email: string;
  contact: string;
  cnicNumber: string;
  active: boolean;
  createdDate: string;
  permissions: string[];
}

// Mock Data
export const mockDepartments: Department[] = [
  {
    id: '1',
    name: 'General Medicine',
    description: 'General medical consultation and treatment',
    headOfDepartment: 'Dr. Rajesh Kumar',
    location: 'Ground Floor, Block A',
    contactExtension: '101',
    active: true,
    createdDate: '2024-01-01'
  },
  {
    id: '2',
    name: 'Pediatrics',
    description: 'Child healthcare and treatment',
    headOfDepartment: 'Dr. Priya Sharma',
    location: 'First Floor, Block B',
    contactExtension: '102',
    active: true,
    createdDate: '2024-01-01'
  },
  {
    id: '3',
    name: 'Orthopedics',
    description: 'Bone and joint treatment',
    headOfDepartment: 'Dr. Amit Singh',
    location: 'Second Floor, Block A',
    contactExtension: '103',
    active: true,
    createdDate: '2024-01-01'
  },
  {
    id: '4',
    name: 'Gynecology',
    description: 'Women health and maternity care',
    headOfDepartment: 'Dr. Sunita Verma',
    location: 'First Floor, Block C',
    contactExtension: '104',
    active: true,
    createdDate: '2024-01-01'
  },
  {
    id: '5',
    name: 'Cardiology',
    description: 'Heart and cardiovascular treatment',
    location: 'Third Floor, Block A',
    contactExtension: '105',
    active: true,
    createdDate: '2024-01-01'
  }
];

export const mockDoctors: Doctor[] = [
  {
    id: '1',
    name: 'Dr. Rajesh Kumar',
    cnicNumber: '12345-6789012-3',
    dateOfBirth: '1975-05-15',
    gender: 'Male',
    contact: '0300-1234567',
    email: 'rajesh.kumar@hospital.com',
    address: 'House 123, Street 45, Lahore',
    department: 'General Medicine',
    opdFee: 500,
    commissionType: 'percentage',
    commissionRate: 30,
    specialization: 'Internal Medicine',
    qualification: 'MBBS, MD Internal Medicine',
    experience: 15,
    joiningDate: '2020-01-15',
    available: true,
    consultationHours: '9:00 AM - 1:00 PM',
    roomNumber: 'R-101'
  },
  {
    id: '2',
    name: 'Dr. Priya Sharma',
    cnicNumber: '12345-6789012-4',
    dateOfBirth: '1980-08-22',
    gender: 'Female',
    contact: '0300-2345678',
    email: 'priya.sharma@hospital.com',
    address: 'House 456, Street 78, Karachi',
    department: 'Pediatrics',
    opdFee: 600,
    commissionType: 'percentage',
    commissionRate: 35,
    specialization: 'Child Care',
    qualification: 'MBBS, DCH',
    experience: 12,
    joiningDate: '2021-03-10',
    available: true,
    consultationHours: '10:00 AM - 2:00 PM',
    roomNumber: 'R-201'
  },
  {
    id: '3',
    name: 'Dr. Amit Singh',
    cnicNumber: '12345-6789012-5',
    dateOfBirth: '1978-12-03',
    gender: 'Male',
    contact: '0300-3456789',
    email: 'amit.singh@hospital.com',
    address: 'House 789, Street 12, Islamabad',
    department: 'Orthopedics',
    opdFee: 800,
    commissionType: 'fixed',
    commissionRate: 200,
    specialization: 'Bone & Joint',
    qualification: 'MBBS, MS Orthopedics',
    experience: 18,
    joiningDate: '2019-06-20',
    available: true,
    consultationHours: '2:00 PM - 6:00 PM',
    roomNumber: 'R-301'
  },
  {
    id: '4',
    name: 'Dr. Sunita Verma',
    cnicNumber: '12345-6789012-6',
    dateOfBirth: '1982-04-18',
    gender: 'Female',
    contact: '0300-4567890',
    email: 'sunita.verma@hospital.com',
    address: 'House 321, Street 65, Lahore',
    department: 'Gynecology',
    opdFee: 700,
    commissionType: 'percentage',
    commissionRate: 40,
    specialization: 'Women Health',
    qualification: 'MBBS, FCPS Gynecology',
    experience: 10,
    joiningDate: '2022-01-05',
    available: true,
    consultationHours: '9:00 AM - 12:00 PM',
    roomNumber: 'R-401'
  }
];

export const mockLabTests: LabTest[] = [
  { 
    id: '1', 
    name: 'Complete Blood Count (CBC)', 
    price: 300, 
    department: 'Pathology',
    normalRange: 'WBC: 4-11, RBC: 4.5-5.5',
    description: 'Complete blood cell analysis',
    sampleType: 'Blood',
    reportTime: '2-4 hours',
    active: true
  },
  { 
    id: '2', 
    name: 'Blood Sugar (Fasting)', 
    price: 150, 
    department: 'Pathology',
    normalRange: '70-100 mg/dL',
    description: 'Fasting glucose level',
    sampleType: 'Blood',
    reportTime: '1-2 hours',
    active: true
  },
  { 
    id: '3', 
    name: 'Lipid Profile', 
    price: 500, 
    department: 'Pathology',
    normalRange: 'Total Cholesterol < 200 mg/dL',
    description: 'Cholesterol and lipid analysis',
    sampleType: 'Blood',
    reportTime: '4-6 hours',
    active: true
  },
  { 
    id: '4', 
    name: 'Liver Function Test', 
    price: 600, 
    department: 'Pathology',
    normalRange: 'ALT: 7-56 U/L, AST: 10-40 U/L',
    description: 'Liver enzyme analysis',
    sampleType: 'Blood',
    reportTime: '4-6 hours',
    active: true
  },
  { 
    id: '5', 
    name: 'Kidney Function Test', 
    price: 550, 
    department: 'Pathology',
    normalRange: 'Creatinine: 0.6-1.2 mg/dL',
    description: 'Kidney function assessment',
    sampleType: 'Blood',
    reportTime: '4-6 hours',
    active: true
  },
  { 
    id: '6', 
    name: 'Thyroid Profile', 
    price: 800, 
    department: 'Pathology',
    normalRange: 'TSH: 0.4-4.0 mIU/L',
    description: 'Thyroid hormone analysis',
    sampleType: 'Blood',
    reportTime: '6-8 hours',
    active: true
  },
  { 
    id: '7', 
    name: 'X-Ray Chest', 
    price: 400, 
    department: 'Radiology',
    description: 'Chest X-ray imaging',
    sampleType: 'Imaging',
    reportTime: '30 minutes',
    active: true
  },
  { 
    id: '8', 
    name: 'ECG', 
    price: 200, 
    department: 'Cardiology',
    description: 'Electrocardiogram',
    sampleType: 'Cardiac Test',
    reportTime: '15 minutes',
    active: true
  },
  { 
    id: '9', 
    name: 'Ultrasound Abdomen', 
    price: 1000, 
    department: 'Radiology',
    description: 'Abdominal ultrasound',
    sampleType: 'Imaging',
    reportTime: '30 minutes',
    active: true
  },
  { 
    id: '10', 
    name: 'Urine Analysis', 
    price: 100, 
    department: 'Pathology',
    normalRange: 'Specific Gravity: 1.003-1.030',
    description: 'Complete urine examination',
    sampleType: 'Urine',
    reportTime: '1-2 hours',
    active: true
  }
];

export const mockRooms: Room[] = [
  { id: '1', roomNumber: 'G-101', type: 'General', bedCount: 4, occupiedBeds: 2, pricePerDay: 1000, department: 'General Medicine', active: true },
  { id: '2', roomNumber: 'G-102', type: 'General', bedCount: 4, occupiedBeds: 1, pricePerDay: 1000, department: 'General Medicine', active: true },
  { id: '3', roomNumber: 'P-201', type: 'Private', bedCount: 1, occupiedBeds: 0, pricePerDay: 2500, department: 'General Medicine', active: true },
  { id: '4', roomNumber: 'P-202', type: 'Private', bedCount: 1, occupiedBeds: 1, pricePerDay: 2500, department: 'Gynecology', active: true },
  { id: '5', roomNumber: 'ICU-301', type: 'ICU', bedCount: 2, occupiedBeds: 1, pricePerDay: 5000, department: 'Cardiology', active: true },
  { id: '6', roomNumber: 'E-001', type: 'Emergency', bedCount: 6, occupiedBeds: 3, pricePerDay: 1500, department: 'Emergency', active: true }
];

export const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'Ramesh Gupta',
    age: 45,
    dateOfBirth: '1979-03-15',
    cnicNumber: '12345-6789012-1',
    gender: 'Male',
    contact: '9876543210',
    problem: 'Fever and headache',
    department: 'General Medicine',
    registrationDate: '2024-01-15',
    emergencyContact: '9876543211',
    address: 'House 123, Street 45, Lahore',
    bloodGroup: 'B+',
    maritalStatus: 'Married'
  },
  {
    id: '2',
    name: 'Meera Devi',
    age: 32,
    dateOfBirth: '1992-07-22',
    cnicNumber: '12345-6789012-2',
    gender: 'Female',
    contact: '9876543212',
    problem: 'Pregnancy checkup',
    department: 'Gynecology',
    registrationDate: '2024-01-15',
    emergencyContact: '9876543213',
    address: 'House 456, Street 78, Karachi',
    bloodGroup: 'A+',
    maritalStatus: 'Married'
  }
];

// Utility functions
export const generateTokenNumber = (): number => {
  return Math.floor(Math.random() * 1000) + 1;
};

export const generateId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

export const formatCurrency = (amount: number): string => {
  return `Rs${amount.toLocaleString('en-PK')}`;
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-IN');
};

export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export const validateCNIC = (cnic: string): boolean => {
  const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
  return cnicRegex.test(cnic);
};

export const formatCNIC = (cnic: string): string => {
  const cleaned = cnic.replace(/\D/g, '');
  if (cleaned.length === 13) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12)}`;
  }
  return cnic;
};
