import React, { forwardRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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

const BirthCertificateTemplate = forwardRef<HTMLDivElement, BirthCertificateTemplateProps>(
  ({ data }, ref) => {
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

    // Inject global print styles when component mounts
    useEffect(() => {
      const styleId = 'birth-certificate-print-styles';

      // Remove existing style if any
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }

      // Create and inject print styles
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @media print {
          /* Hide EVERYTHING on the page */
          body * {
            visibility: hidden !important;
          }

          /* Show only the birth certificate */
          #birth-certificate-print-area,
          #birth-certificate-print-area * {
            visibility: visible !important;
          }

          /* Position the certificate */
          #birth-certificate-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Page settings - no margins, white background */
          @page {
            size: A4;
            margin: 0 !important;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Certificate content area with proper margins */
          .birth-cert-content {
            padding-top: 2in !important;
            padding-bottom: 1in !important;
            padding-left: 0.75in !important;
            padding-right: 0.75in !important;
            background: white !important;
            min-height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
          }

          /* Input field styling for print */
          .birth-cert-input {
            border: none !important;
            border-bottom: 1px solid #000 !important;
            background: transparent !important;
            box-shadow: none !important;
            outline: none !important;
            -webkit-appearance: none !important;
            appearance: none !important;
          }

          /* Hide the no-print elements */
          .birth-cert-no-print {
            display: none !important;
            visibility: hidden !important;
          }

          /* Gender checkbox styling */
          .birth-cert-checkbox {
            border: 2px solid #000 !important;
            background: white !important;
          }

          .birth-cert-checkbox.selected {
            background: white !important;
            color: black !important;
          }
        }
      `;
      document.head.appendChild(style);

      // Cleanup on unmount
      return () => {
        const styleToRemove = document.getElementById(styleId);
        if (styleToRemove) {
          styleToRemove.remove();
        }
      };
    }, []);

    const handlePrint = () => {
      window.print();
    };

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
      <div ref={ref} className="bg-white">
        {/* Print Button - Hidden when printing */}
        <div className="birth-cert-no-print p-4 bg-gray-100 border-b flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Fill in all fields below, then click Print
          </p>
          <Button onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print Certificate
          </Button>
        </div>

        {/* Certificate Content - This is what gets printed */}
        <div id="birth-certificate-print-area" className="bg-white">
          <div className="birth-cert-content" style={{
            padding: '2in 0.75in 1in 0.75in',
            background: 'white',
            maxWidth: '8.5in',
            margin: '0 auto'
          }}>
            {/* Serial Number and Date Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600 }}>No.</span>
                <input
                  type="text"
                  className="birth-cert-input"
                  placeholder="Serial #"
                  value={formData.serialNumber}
                  onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                  style={{
                    border: 'none',
                    borderBottom: '1px solid #333',
                    padding: '4px 8px',
                    fontSize: '14px',
                    textAlign: 'center',
                    width: '100px',
                    outline: 'none',
                    background: 'transparent'
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600 }}>Date:</span>
                <input
                  type="text"
                  className="birth-cert-input"
                  placeholder="DD/MM/YYYY"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  style={{
                    border: 'none',
                    borderBottom: '1px solid #333',
                    padding: '4px 8px',
                    fontSize: '14px',
                    textAlign: 'center',
                    width: '120px',
                    outline: 'none',
                    background: 'transparent'
                  }}
                />
              </div>
            </div>

            {/* Certificate Body */}
            <div style={{ fontSize: '15px', lineHeight: '2.2' }}>
              {/* Baby Gender Row */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontStyle: 'italic' }}>This is to certify that</span>
                <span style={{ fontWeight: 600, marginLeft: '8px' }}>BABY</span>
                <div
                  className={`birth-cert-checkbox ${formData.babyGender === 'Female' ? 'selected' : ''}`}
                  onClick={() => handleInputChange('babyGender', 'Female')}
                  style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #333',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    background: formData.babyGender === 'Female' ? '#2563eb' : 'white',
                    color: formData.babyGender === 'Female' ? 'white' : 'black'
                  }}
                >
                  {formData.babyGender === 'Female' ? '✓' : ''}
                </div>
                <span>GIRL</span>
                <div
                  className={`birth-cert-checkbox ${formData.babyGender === 'Male' ? 'selected' : ''}`}
                  onClick={() => handleInputChange('babyGender', 'Male')}
                  style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #333',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    background: formData.babyGender === 'Male' ? '#2563eb' : 'white',
                    color: formData.babyGender === 'Male' ? 'white' : 'black'
                  }}
                >
                  {formData.babyGender === 'Male' ? '✓' : ''}
                </div>
                <span>BOY</span>
              </div>

              {/* Weight Row */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontStyle: 'italic' }}>Wt</span>
                <input
                  type="text"
                  className="birth-cert-input"
                  placeholder="Kg"
                  value={formData.weightKg}
                  onChange={(e) => handleInputChange('weightKg', e.target.value)}
                  style={{
                    border: 'none',
                    borderBottom: '1px solid #333',
                    padding: '4px 8px',
                    fontSize: '14px',
                    textAlign: 'center',
                    width: '60px',
                    outline: 'none',
                    background: 'transparent'
                  }}
                />
                <span>Kg</span>
                <input
                  type="text"
                  className="birth-cert-input"
                  placeholder="Grams"
                  value={formData.weightGrams}
                  onChange={(e) => handleInputChange('weightGrams', e.target.value)}
                  style={{
                    border: 'none',
                    borderBottom: '1px solid #333',
                    padding: '4px 8px',
                    fontSize: '14px',
                    textAlign: 'center',
                    width: '80px',
                    outline: 'none',
                    background: 'transparent'
                  }}
                />
                <span>Grams</span>
              </div>

              {/* Mother Name Row */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontStyle: 'italic' }}>was born to</span>
                <input
                  type="text"
                  className="birth-cert-input"
                  placeholder="Mother's Name"
                  value={formData.motherName}
                  onChange={(e) => handleInputChange('motherName', e.target.value)}
                  style={{
                    border: 'none',
                    borderBottom: '1px solid #333',
                    padding: '4px 8px',
                    fontSize: '14px',
                    textAlign: 'center',
                    flex: 1,
                    minWidth: '200px',
                    outline: 'none',
                    background: 'transparent'
                  }}
                />
              </div>

              {/* Father Name Row */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontStyle: 'italic' }}>W/o</span>
                <input
                  type="text"
                  className="birth-cert-input"
                  placeholder="Father's Name"
                  value={formData.fatherName}
                  onChange={(e) => handleInputChange('fatherName', e.target.value)}
                  style={{
                    border: 'none',
                    borderBottom: '1px solid #333',
                    padding: '4px 8px',
                    fontSize: '14px',
                    textAlign: 'center',
                    flex: 1,
                    minWidth: '200px',
                    outline: 'none',
                    background: 'transparent'
                  }}
                />
              </div>

              {/* Address Row */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontStyle: 'italic' }}>Address</span>
                <input
                  type="text"
                  className="birth-cert-input"
                  placeholder="Complete Address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  style={{
                    border: 'none',
                    borderBottom: '1px solid #333',
                    padding: '4px 8px',
                    fontSize: '14px',
                    textAlign: 'center',
                    flex: 1,
                    outline: 'none',
                    background: 'transparent'
                  }}
                />
              </div>

              {/* Hospital Statement */}
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontStyle: 'italic' }}>in this hospital</span>
              </div>

              {/* Date of Birth Row */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontStyle: 'italic' }}>the</span>
                <input
                  type="text"
                  className="birth-cert-input"
                  placeholder="Day"
                  value={formData.birthDay}
                  onChange={(e) => handleInputChange('birthDay', e.target.value)}
                  style={{
                    border: 'none',
                    borderBottom: '1px solid #333',
                    padding: '4px 8px',
                    fontSize: '14px',
                    textAlign: 'center',
                    width: '50px',
                    outline: 'none',
                    background: 'transparent'
                  }}
                />
                <span style={{ fontStyle: 'italic' }}>day of</span>
                <select
                  className="birth-cert-input"
                  value={formData.birthMonth}
                  onChange={(e) => handleInputChange('birthMonth', e.target.value)}
                  style={{
                    border: 'none',
                    borderBottom: '1px solid #333',
                    padding: '4px 8px',
                    fontSize: '14px',
                    textAlign: 'center',
                    width: '120px',
                    outline: 'none',
                    background: 'transparent',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Month</option>
                  {months.map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                <input
                  type="text"
                  className="birth-cert-input"
                  placeholder="Year"
                  value={formData.birthYear}
                  onChange={(e) => handleInputChange('birthYear', e.target.value)}
                  style={{
                    border: 'none',
                    borderBottom: '1px solid #333',
                    padding: '4px 8px',
                    fontSize: '14px',
                    textAlign: 'center',
                    width: '70px',
                    outline: 'none',
                    background: 'transparent'
                  }}
                />
              </div>

              {/* Time Row */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontStyle: 'italic' }}>at</span>
                <input
                  type="text"
                  className="birth-cert-input"
                  placeholder="Time (e.g. 10:30 AM)"
                  value={formData.birthTime}
                  onChange={(e) => handleInputChange('birthTime', e.target.value)}
                  style={{
                    border: 'none',
                    borderBottom: '1px solid #333',
                    padding: '4px 8px',
                    fontSize: '14px',
                    textAlign: 'center',
                    width: '140px',
                    outline: 'none',
                    background: 'transparent'
                  }}
                />
              </div>
            </div>

            {/* Attending Obstetrician Section */}
            <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ borderTop: '2px solid #555', paddingTop: '8px', minWidth: '250px' }}>
                  <p style={{ fontWeight: 600, fontSize: '13px', margin: 0 }}>Attending Obstetrician</p>
                  <div style={{ marginTop: '16px' }}>
                    <input
                      type="text"
                      className="birth-cert-input"
                      placeholder="Doctor's Name"
                      value={formData.attendingObstetrician}
                      onChange={(e) => handleInputChange('attendingObstetrician', e.target.value)}
                      style={{
                        border: 'none',
                        borderBottom: '1px solid #333',
                        padding: '4px 8px',
                        fontSize: '14px',
                        textAlign: 'center',
                        width: '100%',
                        outline: 'none',
                        background: 'transparent'
                      }}
                    />
                  </div>
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
