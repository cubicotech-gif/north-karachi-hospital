import React, { forwardRef, useState, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Printer } from 'lucide-react';

interface BirthCertificateData {
  serialNumber?: string;
  date?: string;
  babyGender?: 'Male' | 'Female';
  weightKg?: number;
  weightGrams?: number;
  motherName?: string;
  fatherName?: string;
  address?: string;
  birthDay?: string;
  birthMonth?: string;
  birthYear?: string;
  birthTime?: string;
  attendingObstetrician?: string;
}

interface BirthCertificateTemplateProps {
  data?: BirthCertificateData;
}

export interface BirthCertificateRef {
  print: () => void;
}

const BirthCertificateTemplate = forwardRef<HTMLDivElement, BirthCertificateTemplateProps>(
  ({ data }, ref) => {
    // Editable form fields - start empty for manual input
    const [formData, setFormData] = useState({
      serialNumber: '',
      date: '',
      babyGender: '' as '' | 'Male' | 'Female',
      weightKg: '',
      weightGrams: '',
      motherName: '',
      fatherName: '',
      address: '',
      birthDay: '',
      birthMonth: '',
      birthYear: '',
      birthTime: '',
      attendingObstetrician: '',
    });

    const handleInputChange = (field: string, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePrint = () => {
      window.print();
    };

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
      <div className="bg-white">
        <style>
          {`
            @media print {
              @page {
                size: A4;
                margin: 0;
              }

              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                margin: 0;
                padding: 0;
              }

              .no-print {
                display: none !important;
              }

              .print-container {
                padding-top: 2in !important;
                padding-bottom: 1in !important;
                padding-left: 0.75in !important;
                padding-right: 0.75in !important;
                min-height: 100vh;
                box-sizing: border-box;
              }

              .birth-input {
                border: none !important;
                border-bottom: 1px solid #000 !important;
                background: transparent !important;
                box-shadow: none !important;
                outline: none !important;
                padding: 2px 8px !important;
                font-size: 14px !important;
                height: auto !important;
                min-height: 24px !important;
              }

              .birth-input:focus {
                outline: none !important;
                box-shadow: none !important;
              }

              .gender-box {
                width: 20px;
                height: 20px;
                border: 2px solid #000;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                margin: 0 4px;
                font-weight: bold;
              }
            }

            @media screen {
              .print-container {
                padding: 2in 0.75in 1in 0.75in;
                max-width: 8.5in;
                margin: 0 auto;
                min-height: calc(11in - 3in);
                background: #fff;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
              }
            }

            .birth-input {
              border: none;
              border-bottom: 1px solid #333;
              background: transparent;
              padding: 2px 8px;
              font-size: 14px;
              text-align: center;
              min-width: 80px;
              outline: none;
            }

            .birth-input:focus {
              border-bottom: 2px solid #2563eb;
              outline: none;
            }

            .birth-input::placeholder {
              color: #999;
              font-style: italic;
            }

            .gender-box {
              width: 20px;
              height: 20px;
              border: 2px solid #333;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              margin: 0 4px;
              font-weight: bold;
              cursor: pointer;
              transition: all 0.2s;
            }

            .gender-box:hover {
              background: #f0f0f0;
            }

            .gender-box.selected {
              background: #2563eb;
              color: white;
              border-color: #2563eb;
            }

            .field-row {
              display: flex;
              align-items: center;
              flex-wrap: wrap;
              gap: 8px;
              margin-bottom: 20px;
              line-height: 2;
            }

            .field-label {
              font-style: italic;
              color: #333;
            }
          `}
        </style>

        {/* Print Button - Hidden when printing */}
        <div className="no-print p-4 bg-gray-100 border-b flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Fill in all fields below, then click Print
          </p>
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print Certificate
          </Button>
        </div>

        {/* Certificate Content - Centered for pre-printed template */}
        <div ref={ref} className="print-container">
          {/* Serial Number and Date Row */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-2">
              <span className="font-semibold">No.</span>
              <input
                type="text"
                className="birth-input w-24"
                placeholder="Serial #"
                value={formData.serialNumber}
                onChange={(e) => handleInputChange('serialNumber', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Date:</span>
              <input
                type="text"
                className="birth-input w-32"
                placeholder="DD/MM/YYYY"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
              />
            </div>
          </div>

          {/* Certificate Body */}
          <div className="space-y-6 text-base">
            {/* Baby Gender Row */}
            <div className="field-row">
              <span className="field-label">This is to certify that</span>
              <span className="font-semibold ml-2">BABY</span>
              <div
                className={`gender-box ${formData.babyGender === 'Female' ? 'selected' : ''}`}
                onClick={() => handleInputChange('babyGender', 'Female')}
              >
                {formData.babyGender === 'Female' ? '✓' : ''}
              </div>
              <span>GIRL</span>
              <div
                className={`gender-box ml-2 ${formData.babyGender === 'Male' ? 'selected' : ''}`}
                onClick={() => handleInputChange('babyGender', 'Male')}
              >
                {formData.babyGender === 'Male' ? '✓' : ''}
              </div>
              <span>BOY</span>
            </div>

            {/* Weight Row */}
            <div className="field-row">
              <span className="field-label">Wt</span>
              <input
                type="text"
                className="birth-input w-16"
                placeholder="Kg"
                value={formData.weightKg}
                onChange={(e) => handleInputChange('weightKg', e.target.value)}
              />
              <span>Kg</span>
              <input
                type="text"
                className="birth-input w-20"
                placeholder="Grams"
                value={formData.weightGrams}
                onChange={(e) => handleInputChange('weightGrams', e.target.value)}
              />
              <span>Grams</span>
            </div>

            {/* Mother Name Row */}
            <div className="field-row">
              <span className="field-label">was born to</span>
              <input
                type="text"
                className="birth-input flex-1 min-w-[200px]"
                placeholder="Mother's Name"
                value={formData.motherName}
                onChange={(e) => handleInputChange('motherName', e.target.value)}
              />
            </div>

            {/* Father Name Row */}
            <div className="field-row">
              <span className="field-label">W/o</span>
              <input
                type="text"
                className="birth-input flex-1 min-w-[200px]"
                placeholder="Father's Name"
                value={formData.fatherName}
                onChange={(e) => handleInputChange('fatherName', e.target.value)}
              />
            </div>

            {/* Address Row */}
            <div className="field-row">
              <span className="field-label">Address</span>
              <input
                type="text"
                className="birth-input flex-1"
                placeholder="Complete Address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </div>

            {/* Hospital Statement */}
            <div className="field-row">
              <span className="field-label">in this hospital</span>
            </div>

            {/* Date of Birth Row */}
            <div className="field-row">
              <span className="field-label">the</span>
              <input
                type="text"
                className="birth-input w-16"
                placeholder="Day"
                value={formData.birthDay}
                onChange={(e) => handleInputChange('birthDay', e.target.value)}
              />
              <span className="field-label">day of</span>
              <select
                className="birth-input w-32 cursor-pointer"
                value={formData.birthMonth}
                onChange={(e) => handleInputChange('birthMonth', e.target.value)}
              >
                <option value="">Month</option>
                {months.map((month, index) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
              <input
                type="text"
                className="birth-input w-20"
                placeholder="Year"
                value={formData.birthYear}
                onChange={(e) => handleInputChange('birthYear', e.target.value)}
              />
            </div>

            {/* Time Row */}
            <div className="field-row">
              <span className="field-label">at</span>
              <input
                type="text"
                className="birth-input w-28"
                placeholder="Time (e.g. 10:30 AM)"
                value={formData.birthTime}
                onChange={(e) => handleInputChange('birthTime', e.target.value)}
              />
            </div>
          </div>

          {/* Attending Obstetrician Section */}
          <div className="mt-16 flex justify-end">
            <div className="text-right">
              <div className="border-t-2 border-gray-600 pt-2 min-w-[280px]">
                <p className="font-semibold text-sm">Attending Obstetrician</p>
                <div className="mt-4">
                  <input
                    type="text"
                    className="birth-input w-full text-center"
                    placeholder="Doctor's Name"
                    value={formData.attendingObstetrician}
                    onChange={(e) => handleInputChange('attendingObstetrician', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

BirthCertificateTemplate.displayName = 'BirthCertificateTemplate';

export default BirthCertificateTemplate;
