import React, { forwardRef } from 'react';
import Letterhead from './Letterhead';

interface PregnancyHistory {
  dateOfBirth: string;
  durationOfPregnancy: string;
  deliveryPlace: string;
  deliveryMethod: string;
  pregnancyComplications?: string;
  labourComplications?: string;
  puerPriumComplications?: string;
  aliveOrStillBorn: string;
  childSex: string;
  childWeight?: string;
  presentHealthy?: string;
}

interface InvestigationData {
  hb?: string;
  hbDate?: string;
  rbs?: string;
  rbsDate?: string;
  udr?: string;
  udrDate?: string;
  hbsAg?: string;
  hbsAgDate?: string;
  antiHCV?: string;
}

interface MaternityProfileData {
  patientName: string;
  age?: number;
  bloodGroup?: string;
  husbandsBloodGroup?: string;
  para?: string;
  aliveChildren?: number;
  stillBorn?: number;
  lmp?: string;
  edd?: string;
  heart?: string;
  lungs?: string;
  abortion?: string;
  lastDelivery?: string;
  height?: string;
  breasts?: string;
  thyroid?: string;
  lymphNodes?: string;
  tt1?: boolean;
  tt2?: boolean;
  address?: string;
  specialFeatures?: string;
  investigation?: InvestigationData;
  pregnancyHistory?: PregnancyHistory[];
}

interface MaternityProfileTemplateProps {
  data: MaternityProfileData;
}

const MaternityProfileTemplate = forwardRef<HTMLDivElement, MaternityProfileTemplateProps>(
  ({ data }, ref) => {
    return (
      <div ref={ref} className="bg-white p-6 max-w-5xl mx-auto">
        <style>
          {`
            @media print {
              @page {
                size: A4;
                margin: 10mm;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print {
                display: none !important;
              }
            }

            .profile-box {
              border: 2px solid #333;
              border-radius: 8px;
              padding: 12px;
            }

            .profile-field {
              display: flex;
              align-items: baseline;
              margin-bottom: 6px;
              font-size: 12px;
            }

            .profile-label {
              font-weight: 600;
              min-width: 120px;
            }

            .profile-value {
              border-bottom: 1px solid #666;
              flex: 1;
              padding-bottom: 2px;
            }
          `}
        </style>

        {/* Letterhead */}
        <Letterhead showUrdu={false} variant="compact" />

        {/* Patient Profile Section */}
        <div className="profile-box mb-4">
          <div className="bg-gray-800 text-white text-center py-2 -mx-3 -mt-3 mb-3 rounded-t">
            <h3 className="font-bold text-lg">Patient Profile</h3>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <div className="profile-field">
              <span className="profile-label">Age:</span>
              <span className="profile-value">{data.age || '____'}</span>
              <span className="profile-label ml-4">Blood Group:</span>
              <span className="profile-value">{data.bloodGroup || '____'}</span>
            </div>

            <div className="profile-field">
              <span className="profile-label">Husband's Blood Group:</span>
              <span className="profile-value">{data.husbandsBloodGroup || '____'}</span>
            </div>

            <div className="profile-field">
              <span className="profile-label">Para:</span>
              <span className="profile-value">{data.para || '____'}</span>
              <span className="profile-label ml-4">Alive Children:</span>
              <span className="profile-value">{data.aliveChildren || '____'}</span>
            </div>

            <div className="profile-field">
              <span className="profile-label">Still Born:</span>
              <span className="profile-value">{data.stillBorn || '____'}</span>
            </div>

            <div className="profile-field">
              <span className="profile-label">L.M.P:</span>
              <span className="profile-value">{data.lmp || '____'}</span>
              <span className="profile-label ml-4">E.D.D:</span>
              <span className="profile-value">{data.edd || '____'}</span>
            </div>

            <div className="profile-field">
              <span className="profile-label">Heart:</span>
              <span className="profile-value">{data.heart || '____'}</span>
            </div>

            <div className="profile-field">
              <span className="profile-label">Lungs:</span>
              <span className="profile-value">{data.lungs || '____'}</span>
              <span className="profile-label ml-4">Abortion:</span>
              <span className="profile-value">{data.abortion || '____'}</span>
            </div>

            <div className="profile-field">
              <span className="profile-label">Last delivery:</span>
              <span className="profile-value">{data.lastDelivery || '____'}</span>
            </div>

            <div className="profile-field">
              <span className="profile-label">Height:</span>
              <span className="profile-value">{data.height || '____'}</span>
              <span className="profile-label ml-4">Breasts:</span>
              <span className="profile-value">{data.breasts || '____'}</span>
            </div>

            <div className="profile-field">
              <span className="profile-label">Thyroid:</span>
              <span className="profile-value">{data.thyroid || '____'}</span>
              <span className="profile-label ml-4">Lymph nodes:</span>
              <span className="profile-value">{data.lymphNodes || '____'}</span>
            </div>

            <div className="profile-field col-span-2">
              <span className="profile-label">T.T.1:</span>
              <span className="w-6 h-6 border border-gray-600 inline-block mx-2">
                {data.tt1 && '✓'}
              </span>
              <span className="profile-label ml-8">T.T.2:</span>
              <span className="w-6 h-6 border border-gray-600 inline-block mx-2">
                {data.tt2 && '✓'}
              </span>
            </div>

            <div className="profile-field col-span-2">
              <span className="profile-label">Address:</span>
              <span className="profile-value">{data.address || '____________________________________'}</span>
            </div>
          </div>
        </div>

        {/* Special Features and Investigation */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="profile-box">
            <h4 className="font-bold mb-2 text-sm">Special Features or Risk Factors:</h4>
            <div className="min-h-[80px] text-sm">
              {data.specialFeatures || ''}
            </div>
          </div>

          <div className="profile-box">
            <h4 className="font-bold mb-2 text-sm">Investigation:</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold w-16">Hb:</span>
                <span className="border-b border-dotted flex-1">{data.investigation?.hb || '____'}</span>
                <span className="w-12">date:</span>
                <span className="border-b border-dotted w-20">{data.investigation?.hbDate || '____'}</span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold w-16">RBS:</span>
                <span className="border-b border-dotted flex-1">{data.investigation?.rbs || '____'}</span>
                <span className="w-12">date:</span>
                <span className="border-b border-dotted w-20">{data.investigation?.rbsDate || '____'}</span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold w-16">UDR:</span>
                <span className="border-b border-dotted flex-1">{data.investigation?.udr || '____'}</span>
                <span className="w-12">date:</span>
                <span className="border-b border-dotted w-20">{data.investigation?.udrDate || '____'}</span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold w-16">Hbs Ag:</span>
                <span className="border-b border-dotted flex-1">{data.investigation?.hbsAg || '____'}</span>
                <span className="w-12">date:</span>
                <span className="border-b border-dotted w-20">{data.investigation?.hbsAgDate || '____'}</span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold w-16">Anti HCV:</span>
                <span className="border-b border-dotted flex-1">{data.investigation?.antiHCV || '____'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pregnancy History Table */}
        <div className="profile-box">
          <div className="bg-gray-800 text-white text-center py-2 -mx-3 -mt-3 mb-3">
            <h3 className="font-bold">History of Previous Pregnancy / Pregnancies (if any)</h3>
          </div>

          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-400 px-2 py-1">Date<br/>of<br/>Birth</th>
                <th className="border border-gray-400 px-2 py-1">Duration<br/>of<br/>Pregnancy</th>
                <th className="border border-gray-400 px-2 py-1" colSpan={2}>DELIVERY</th>
                <th className="border border-gray-400 px-2 py-1" colSpan={4}>COMPLICATIONS</th>
                <th className="border border-gray-400 px-2 py-1" colSpan={3}>CHILDREN</th>
                <th className="border border-gray-400 px-2 py-1">Present Healthy<br/>Cause &<br/>Age of Death</th>
              </tr>
              <tr className="bg-gray-100 text-xs">
                <th className="border border-gray-400"></th>
                <th className="border border-gray-400"></th>
                <th className="border border-gray-400 px-1">Place</th>
                <th className="border border-gray-400 px-1">Method</th>
                <th className="border border-gray-400 px-1">Pregnancy</th>
                <th className="border border-gray-400 px-1">Labour</th>
                <th className="border border-gray-400 px-1">Puer<br/>Prium</th>
                <th className="border border-gray-400 px-1">Alive or<br/>Still Born</th>
                <th className="border border-gray-400 px-1">Sex</th>
                <th className="border border-gray-400 px-1">Weight</th>
                <th className="border border-gray-400 px-1"></th>
              </tr>
            </thead>
            <tbody>
              {data.pregnancyHistory && data.pregnancyHistory.length > 0 ? (
                data.pregnancyHistory.map((pregnancy, index) => (
                  <tr key={index}>
                    <td className="border border-gray-400 px-1 py-2 text-center">{pregnancy.dateOfBirth}</td>
                    <td className="border border-gray-400 px-1 py-2 text-center">{pregnancy.durationOfPregnancy}</td>
                    <td className="border border-gray-400 px-1 py-2 text-center">{pregnancy.deliveryPlace}</td>
                    <td className="border border-gray-400 px-1 py-2 text-center">{pregnancy.deliveryMethod}</td>
                    <td className="border border-gray-400 px-1 py-2 text-center">{pregnancy.pregnancyComplications}</td>
                    <td className="border border-gray-400 px-1 py-2 text-center">{pregnancy.labourComplications}</td>
                    <td className="border border-gray-400 px-1 py-2 text-center">{pregnancy.puerPriumComplications}</td>
                    <td className="border border-gray-400 px-1 py-2 text-center">{pregnancy.aliveOrStillBorn}</td>
                    <td className="border border-gray-400 px-1 py-2 text-center">{pregnancy.childSex}</td>
                    <td className="border border-gray-400 px-1 py-2 text-center">{pregnancy.childWeight}</td>
                    <td className="border border-gray-400 px-1 py-2 text-center">{pregnancy.presentHealthy}</td>
                  </tr>
                ))
              ) : (
                // Empty rows for manual filling
                [...Array(5)].map((_, index) => (
                  <tr key={index}>
                    <td className="border border-gray-400 px-1 py-3">&nbsp;</td>
                    <td className="border border-gray-400 px-1 py-3">&nbsp;</td>
                    <td className="border border-gray-400 px-1 py-3">&nbsp;</td>
                    <td className="border border-gray-400 px-1 py-3">&nbsp;</td>
                    <td className="border border-gray-400 px-1 py-3">&nbsp;</td>
                    <td className="border border-gray-400 px-1 py-3">&nbsp;</td>
                    <td className="border border-gray-400 px-1 py-3">&nbsp;</td>
                    <td className="border border-gray-400 px-1 py-3">&nbsp;</td>
                    <td className="border border-gray-400 px-1 py-3">&nbsp;</td>
                    <td className="border border-gray-400 px-1 py-3">&nbsp;</td>
                    <td className="border border-gray-400 px-1 py-3">&nbsp;</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Document Generated: {new Date().toLocaleString('en-GB')}</p>
          <p className="mt-1">Patient Name: {data.patientName}</p>
        </div>
      </div>
    );
  }
);

MaternityProfileTemplate.displayName = 'MaternityProfileTemplate';

export default MaternityProfileTemplate;
