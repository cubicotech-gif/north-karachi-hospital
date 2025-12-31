import React, { forwardRef, useEffect, useState } from 'react';
import { db } from '@/lib/supabase';

interface HospitalInfo {
  hospital_name: string;
  address: string;
  city: string;
  phone: string;
  phone2: string;
}

interface BirthCertificateData {
  serialNumber: string;
  date: string;
  babyGender: 'Male' | 'Female';
  weightKg: number;
  weightGrams: number;
  motherName: string;
  fatherName: string;  // W/o (Wife of)
  address: string;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  birthTime?: string;
  attendingObstetrician: string;
}

interface BirthCertificateTemplateProps {
  data: BirthCertificateData;
}

const BirthCertificateTemplate = forwardRef<HTMLDivElement, BirthCertificateTemplateProps>(
  ({ data }, ref) => {
    const [hospitalInfo, setHospitalInfo] = useState<HospitalInfo | null>(null);

    useEffect(() => {
      loadHospitalInfo();
    }, []);

    const loadHospitalInfo = async () => {
      try {
        const { data: settings, error } = await db.hospitalSettings.get();
        if (!error && settings) {
          setHospitalInfo(settings);
        }
      } catch (error) {
        console.error('Error loading hospital info:', error);
      }
    };

    // Format the birth month name
    const getMonthName = (month: string) => {
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthNum = parseInt(month, 10);
      return months[monthNum - 1] || month;
    };

    return (
      <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto">
        <style>
          {`
            @media print {
              @page {
                size: A4;
                margin: 15mm;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print {
                display: none !important;
              }
            }

            .birth-cert-field {
              border-bottom: 1px solid #333;
              min-width: 150px;
              display: inline-block;
              padding: 0 8px;
              text-align: center;
            }

            .birth-cert-checkbox {
              width: 18px;
              height: 18px;
              border: 2px solid #333;
              display: inline-block;
              margin: 0 4px;
              text-align: center;
              line-height: 14px;
              font-weight: bold;
            }

            .birth-cert-title {
              font-family: 'Times New Roman', serif;
              font-style: italic;
              font-size: 28px;
              color: #1e40af;
            }
          `}
        </style>

        {/* Hospital Header */}
        <div className="text-center mb-6 border-b-2 border-blue-800 pb-4">
          <h1 className="text-xl font-bold text-blue-800">
            {hospitalInfo?.hospital_name || 'NORTH KARACHI HOSPITAL'}
          </h1>
          <p className="text-sm text-gray-700">
            {hospitalInfo?.address || '122-C, Sector 11-B North Karachi Township'}, {hospitalInfo?.city || 'Karachi'}
          </p>
          <p className="text-sm text-gray-700">
            {hospitalInfo?.phone || '021-36989080'} Cell: {hospitalInfo?.phone2 || '03362609360'}
          </p>
        </div>

        {/* Serial Number and Date Row */}
        <div className="flex justify-between items-start mb-6">
          <div className="text-sm">
            <p>
              <span className="font-semibold">No.</span>
              <span className="birth-cert-field ml-2 min-w-[80px]">{data.serialNumber}</span>
            </p>
            <p className="mt-1 text-xs text-gray-600">Series D</p>
          </div>

          <div className="text-right">
            <p className="text-sm">
              <span className="font-semibold">Date :</span>
              <span className="birth-cert-field ml-2">{data.date}</span>
            </p>
          </div>
        </div>

        {/* Birth Certificate Title */}
        <div className="text-center mb-8">
          <h2 className="birth-cert-title">Birth Certificate</h2>
        </div>

        {/* Certificate Content */}
        <div className="text-base leading-loose space-y-4">
          {/* Baby Gender Row */}
          <p className="flex items-center flex-wrap gap-2">
            <span className="italic">This is to certify that</span>
            <span className="font-semibold ml-4">BABY</span>
            <span className="birth-cert-checkbox">{data.babyGender === 'Female' ? '✓' : ''}</span>
            <span>GIRL</span>
            <span className="birth-cert-checkbox ml-4">{data.babyGender === 'Male' ? '✓' : ''}</span>
            <span>BOY</span>
          </p>

          {/* Weight Row */}
          <p className="flex items-center flex-wrap gap-2">
            <span className="italic">Wt</span>
            <span className="birth-cert-field min-w-[60px]">{data.weightKg || ''}</span>
            <span>Kg</span>
            <span className="birth-cert-field min-w-[80px]">{data.weightGrams || ''}</span>
            <span>Grams</span>
          </p>

          {/* Born to Row */}
          <p className="flex items-center flex-wrap gap-2">
            <span className="italic">was born to</span>
            <span className="birth-cert-field flex-1 min-w-[200px]">{data.motherName}</span>
            <span className="ml-4">W/o</span>
            <span className="birth-cert-field flex-1 min-w-[200px]">{data.fatherName}</span>
          </p>

          {/* Address Row */}
          <p className="flex items-center flex-wrap gap-2">
            <span className="italic">Address</span>
            <span className="birth-cert-field flex-1">{data.address}</span>
          </p>

          {/* Hospital Statement */}
          <p className="italic">in this hospital</p>

          {/* Date of Birth Row */}
          <p className="flex items-center flex-wrap gap-2">
            <span className="italic">the</span>
            <span className="birth-cert-field min-w-[60px]">{data.birthDay}</span>
            <span className="italic">day of</span>
            <span className="birth-cert-field min-w-[120px]">{getMonthName(data.birthMonth)}</span>
            <span className="birth-cert-field min-w-[80px]">{data.birthYear}</span>
            {data.birthTime && (
              <>
                <span className="italic ml-4">at</span>
                <span className="birth-cert-field min-w-[80px]">{data.birthTime}</span>
              </>
            )}
          </p>
        </div>

        {/* Attending Obstetrician Section */}
        <div className="mt-16 flex justify-end">
          <div className="text-right">
            <div className="border-t-2 border-gray-600 pt-2 min-w-[280px]">
              <p className="font-semibold text-sm">Attending Obstetrician</p>
              <div className="mt-6">
                <p className="text-sm">Name</p>
                <p className="birth-cert-field min-w-[250px] mt-1 font-semibold">
                  {data.attendingObstetrician}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 pt-4 border-t border-gray-300 text-xs text-gray-500 text-center">
          <p>This is an official birth certificate issued by {hospitalInfo?.hospital_name || 'North Karachi Hospital'}</p>
          <p className="mt-1">Document Generated: {new Date().toLocaleString('en-GB')}</p>
        </div>
      </div>
    );
  }
);

BirthCertificateTemplate.displayName = 'BirthCertificateTemplate';

export default BirthCertificateTemplate;
