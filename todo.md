# Hospital Management System - Development Plan

## Core Files to Create:
1. **src/components/PatientRegistration.tsx** - Patient registration form with search functionality
2. **src/components/OPDTokenSystem.tsx** - OPD token generation with doctor selection and billing
3. **src/components/AdmissionModule.tsx** - Patient admission management with bed allocation
4. **src/components/LabManagement.tsx** - Lab order creation and test management
5. **src/components/DoctorManagement.tsx** - Doctor profiles with commission tracking
6. **src/components/UserRoles.tsx** - Role-based access control and account setup
7. **src/lib/hospitalData.ts** - Mock data for doctors, tests, rooms, and patients
8. **src/App.tsx** - Main application with navigation and role-based routing

## Key Features:
- Patient search and registration
- OPD token generation with printable receipts
- Admission management with bed tracking
- Lab order system with billing
- Doctor commission calculations
- Role-based access (Admin, Doctor, Nurse, Receptionist)
- Digital payment recording
- Printable forms and receipts

## Data Structure:
- Patients: ID, name, age, gender, contact, medical history
- Doctors: ID, name, department, OPD fee, commission rate
- Admissions: Patient ID, room, bed, doctor, admission type
- Lab Orders: Patient ID, tests, status, results
- Billing: Payments, receipts, commission tracking