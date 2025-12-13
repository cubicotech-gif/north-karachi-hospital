import React, { forwardRef } from 'react';
import Letterhead from './Letterhead';

interface TestResult {
  testName: string;
  result: string;
  unit?: string;
  normalRange?: string;
  flag?: 'Normal' | 'High' | 'Low' | 'Critical';
}

interface LabReportData {
  reportNumber: string;
  patientName: string;
  age?: number;
  gender?: string;
  mrNumber?: string;
  referredBy?: string;
  sampleCollectionDate: string;
  reportDate: string;
  testCategory?: string;
  tests: TestResult[];
  technologistName?: string;
  pathologistName?: string;
  notes?: string;
}

interface LabReportTemplateProps {
  data: LabReportData;
}

const LabReportTemplate = forwardRef<HTMLDivElement, LabReportTemplateProps>(
  ({ data }, ref) => {
    const getFlagColor = (flag?: string) => {
      switch (flag) {
        case 'High':
        case 'Critical':
          return 'text-red-600 font-bold';
        case 'Low':
          return 'text-orange-600 font-bold';
        case 'Normal':
        default:
          return 'text-green-600';
      }
    };

    const getFlagSymbol = (flag?: string) => {
      switch (flag) {
        case 'High':
          return '↑';
        case 'Low':
          return '↓';
        case 'Critical':
          return '⚠';
        default:
          return '';
      }
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

            .lab-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }

            .lab-table th {
              background-color: #1e40af;
              color: white;
              padding: 10px;
              text-align: left;
              font-weight: 600;
              font-size: 13px;
            }

            .lab-table td {
              padding: 10px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 13px;
            }

            .lab-table tr:nth-child(even) {
              background-color: #f9fafb;
            }

            .lab-table tr:hover {
              background-color: #f3f4f6;
            }
          `}
        </style>

        {/* Letterhead */}
        <Letterhead showUrdu={false} variant="full" />

        {/* Document Title */}
        <div className="text-center mb-6 pb-4 border-b-2 border-blue-600">
          <h2 className="text-2xl font-bold text-blue-800">LABORATORY REPORT</h2>
          <p className="text-sm text-gray-600 mt-1">Report No: {data.reportNumber}</p>
        </div>

        {/* Patient Information */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div className="space-y-2">
            <div className="flex">
              <span className="font-semibold w-32">Patient Name:</span>
              <span>{data.patientName}</span>
            </div>
            <div className="flex">
              <span className="font-semibold w-32">Age/Gender:</span>
              <span>{data.age || '__'} years / {data.gender || '__'}</span>
            </div>
            <div className="flex">
              <span className="font-semibold w-32">MR Number:</span>
              <span>{data.mrNumber || 'N/A'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex">
              <span className="font-semibold w-32">Referred By:</span>
              <span>{data.referredBy || 'Self'}</span>
            </div>
            <div className="flex">
              <span className="font-semibold w-32">Sample Date:</span>
              <span>{new Date(data.sampleCollectionDate).toLocaleDateString('en-GB')}</span>
            </div>
            <div className="flex">
              <span className="font-semibold w-32">Report Date:</span>
              <span>{new Date(data.reportDate).toLocaleDateString('en-GB')}</span>
            </div>
          </div>
        </div>

        {/* Test Category */}
        {data.testCategory && (
          <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-600">
            <p className="font-bold text-blue-800">Test Category: {data.testCategory}</p>
          </div>
        )}

        {/* Test Results Table */}
        <table className="lab-table">
          <thead>
            <tr>
              <th style={{ width: '35%' }}>Test Name</th>
              <th style={{ width: '20%' }}>Result</th>
              <th style={{ width: '10%' }}>Unit</th>
              <th style={{ width: '25%' }}>Normal Range</th>
              <th style={{ width: '10%' }}>Flag</th>
            </tr>
          </thead>
          <tbody>
            {data.tests.map((test, index) => (
              <tr key={index}>
                <td className="font-semibold">{test.testName}</td>
                <td className={`font-bold ${getFlagColor(test.flag)}`}>
                  {test.result}
                </td>
                <td className="text-gray-600">{test.unit || '-'}</td>
                <td className="text-gray-600">{test.normalRange || '-'}</td>
                <td className={`text-center ${getFlagColor(test.flag)}`}>
                  {getFlagSymbol(test.flag)} {test.flag || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Legend */}
        <div className="mb-6 p-3 bg-gray-50 border border-gray-300 rounded">
          <p className="font-semibold text-xs mb-2">Legend:</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-red-600 font-bold">↑ High</span> - Above normal range
            </div>
            <div>
              <span className="text-orange-600 font-bold">↓ Low</span> - Below normal range
            </div>
            <div>
              <span className="text-red-600 font-bold">⚠ Critical</span> - Requires immediate attention
            </div>
          </div>
        </div>

        {/* Notes */}
        {data.notes && (
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
            <p className="font-semibold text-sm mb-2">Notes:</p>
            <p className="text-sm whitespace-pre-line">{data.notes}</p>
          </div>
        )}

        {/* Important Notice */}
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-xs text-red-800">
            <strong>Important:</strong> This report should be correlated clinically. Abnormal results should be discussed with your physician.
            Lab results are only one part of a larger picture that includes your medical history and current health.
          </p>
        </div>

        {/* Signatures */}
        <div className="mt-12 pt-6 border-t-2 border-gray-800">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm mb-2 text-gray-600">Performed by:</p>
              <div className="h-16 border-b-2 border-gray-400"></div>
              <p className="text-sm mt-2 font-semibold">{data.technologistName || '___________________'}</p>
              <p className="text-xs text-gray-500">Medical Technologist</p>
            </div>

            <div className="text-right">
              <p className="text-sm mb-2 text-gray-600">Verified by:</p>
              <div className="h-16 border-b-2 border-gray-600"></div>
              <p className="text-sm mt-2 font-semibold">{data.pathologistName || '___________________'}</p>
              <p className="text-xs text-gray-500">Consultant Pathologist</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500 text-center">
          <p>Report Generated: {new Date().toLocaleString('en-GB')}</p>
          <p className="mt-1 font-semibold">This is a computer-generated report. Keep it confidential and discuss with your doctor.</p>
        </div>
      </div>
    );
  }
);

LabReportTemplate.displayName = 'LabReportTemplate';

export default LabReportTemplate;
