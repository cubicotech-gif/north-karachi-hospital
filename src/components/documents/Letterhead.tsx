import React, { useEffect, useState } from 'react';
import { db } from '@/lib/supabase';

interface LetterheadProps {
  showUrdu?: boolean;
  variant?: 'full' | 'compact';
}

interface HospitalInfo {
  hospital_name: string;
  hospital_name_urdu: string;
  address: string;
  address_urdu: string;
  city: string;
  phone: string;
  phone2: string;
  email: string;
  website: string;
  registration_number: string;
  ntn_number: string;
  logo_url: string;
  letterhead_color: string;
}

export default function Letterhead({ showUrdu = true, variant = 'full' }: LetterheadProps) {
  const [hospitalInfo, setHospitalInfo] = useState<HospitalInfo | null>(null);

  useEffect(() => {
    loadHospitalInfo();
  }, []);

  const loadHospitalInfo = async () => {
    try {
      const { data, error } = await db.hospitalSettings.get();
      if (!error && data) {
        setHospitalInfo(data);
      }
    } catch (error) {
      console.error('Error loading hospital info:', error);
    }
  };

  if (!hospitalInfo) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-500">Loading hospital information...</p>
      </div>
    );
  }

  const borderColor = hospitalInfo.letterhead_color || '#2563eb';

  if (variant === 'compact') {
    return (
      <div className="mb-4 pb-3 border-b-2" style={{ borderBottomColor: borderColor }}>
        <div className="flex items-center justify-between">
          {hospitalInfo.logo_url && (
            <img
              src={hospitalInfo.logo_url}
              alt="Hospital Logo"
              className="h-12 object-contain"
            />
          )}
          <div className={`${hospitalInfo.logo_url ? 'text-right' : 'text-center'} flex-1`}>
            <h1 className="text-xl font-bold" style={{ color: borderColor }}>
              {hospitalInfo.hospital_name}
            </h1>
            <p className="text-xs text-gray-600">{hospitalInfo.phone}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 pb-4 border-b-4" style={{ borderBottomColor: borderColor }}>
      <div className="flex items-start gap-4">
        {hospitalInfo.logo_url && (
          <div className="flex-shrink-0">
            <img
              src={hospitalInfo.logo_url}
              alt="Hospital Logo"
              className="h-20 w-20 object-contain"
            />
          </div>
        )}

        <div className="flex-1 text-center">
          <h1 className="text-3xl font-bold mb-1" style={{ color: borderColor }}>
            {hospitalInfo.hospital_name}
          </h1>

          {showUrdu && hospitalInfo.hospital_name_urdu && (
            <p className="text-xl font-semibold mb-2 text-gray-700" dir="rtl">
              {hospitalInfo.hospital_name_urdu}
            </p>
          )}

          <div className="text-sm text-gray-700 space-y-1">
            <p className="font-medium">{hospitalInfo.address}, {hospitalInfo.city}</p>

            {showUrdu && hospitalInfo.address_urdu && (
              <p className="font-medium" dir="rtl">{hospitalInfo.address_urdu}</p>
            )}

            <div className="flex items-center justify-center gap-4 flex-wrap">
              {hospitalInfo.phone && (
                <p>
                  <span className="font-semibold">Phone:</span> {hospitalInfo.phone}
                  {hospitalInfo.phone2 && `, ${hospitalInfo.phone2}`}
                </p>
              )}

              {hospitalInfo.email && (
                <p>
                  <span className="font-semibold">Email:</span> {hospitalInfo.email}
                </p>
              )}

              {hospitalInfo.website && (
                <p>
                  <span className="font-semibold">Web:</span> {hospitalInfo.website}
                </p>
              )}
            </div>

            {hospitalInfo.registration_number && (
              <p className="text-xs">
                <span className="font-semibold">Reg #:</span> {hospitalInfo.registration_number}
                {hospitalInfo.ntn_number && (
                  <span className="ml-3">
                    <span className="font-semibold">NTN:</span> {hospitalInfo.ntn_number}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {hospitalInfo.logo_url && (
          <div className="flex-shrink-0 w-20"></div>
        )}
      </div>
    </div>
  );
}
