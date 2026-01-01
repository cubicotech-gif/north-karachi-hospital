import React, { forwardRef } from 'react';
import Letterhead from './Letterhead';
import { formatCurrency } from '@/lib/hospitalData';

interface BillingItem {
  description: string;
  amount: number;
}

interface DischargeBillingData {
  receiptNumber: string;
  dischargeNumber: string;
  patientName: string;
  mrNumber: string;
  age?: number;
  gender?: string;
  contact?: string;
  guardianName?: string;
  admissionDate: string;
  dischargeDate: string;
  totalDays: number;
  roomNumber: string;
  roomType: string;
  doctorName: string;

  // Billing breakdown
  roomCharges: number;
  treatmentCharges: number;
  labCharges: number;
  nicuCharges: number;
  medicalCharges: number;
  medicineCharges: number;
  otherCharges: number;

  // Discount
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountAmount: number;

  // Totals
  subtotal: number;
  totalCharges: number;
  depositPaid: number;
  additionalPayment: number;
  totalPaid: number;
  balanceDue: number;
  refundAmount: number;

  // Payment info
  paymentMethod?: string;
  paymentStatus: string;

  // For babies
  isNewborn?: boolean;
  motherName?: string;

  // Itemized lists (optional)
  treatmentItems?: BillingItem[];
  labItems?: BillingItem[];
  nicuItems?: BillingItem[];
}

interface DischargeBillingReceiptProps {
  data: DischargeBillingData;
}

const DischargeBillingReceipt = forwardRef<HTMLDivElement, DischargeBillingReceiptProps>(
  ({ data }, ref) => {
    return (
      <div ref={ref} className="bg-white p-4 mx-auto" style={{ maxWidth: '210mm', fontSize: '10px' }}>
        <style>
          {`
            @media print {
              @page {
                size: A4;
                margin: 5mm;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            .billing-table {
              width: 100%;
              border-collapse: collapse;
            }
            .billing-table th,
            .billing-table td {
              border: 1px solid #e5e7eb;
              padding: 4px 8px;
              text-align: left;
              font-size: 9px;
            }
            .billing-table th {
              background-color: #007B8A;
              color: white;
              font-weight: bold;
            }
            .billing-table tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .amount-col {
              text-align: right !important;
              font-family: monospace;
            }
          `}
        </style>

        {/* Letterhead */}
        <Letterhead showUrdu={true} variant="compact" />

        {/* Document Title */}
        <div className="text-center mb-3 mt-2">
          <h2 className="text-lg font-bold text-gray-800 border-b-2 border-gray-800 inline-block pb-1">
            DISCHARGE BILLING RECEIPT / رسید
          </h2>
        </div>

        {/* Receipt Info */}
        <div className="flex justify-between mb-3 text-xs">
          <div>
            <p><strong>Receipt No:</strong> {data.receiptNumber}</p>
            <p><strong>Discharge No:</strong> {data.dischargeNumber}</p>
          </div>
          <div className="text-right">
            <p><strong>Date:</strong> {new Date(data.dischargeDate).toLocaleDateString('en-GB')}</p>
            <p><strong>Time:</strong> {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        {/* Patient Information */}
        <div className="border border-gray-800 p-2 mb-3">
          <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-xs">
            <div>
              <strong>Patient Name:</strong> {data.patientName}
              {data.isNewborn && <span className="ml-2 px-1 bg-pink-100 text-pink-700 text-xs rounded">Baby</span>}
            </div>
            <div>
              <strong>MR Number:</strong> <span className="font-mono">{data.mrNumber}</span>
            </div>
            <div>
              <strong>Age/Gender:</strong> {data.age || '__'} years / {data.gender || '__'}
            </div>
            <div>
              <strong>Contact:</strong> {data.contact || 'N/A'}
            </div>
            {data.guardianName && (
              <div>
                <strong>Guardian:</strong> {data.guardianName}
              </div>
            )}
            {data.isNewborn && data.motherName && (
              <div>
                <strong>Mother:</strong> {data.motherName}
              </div>
            )}
            <div>
              <strong>Admission:</strong> {new Date(data.admissionDate).toLocaleDateString('en-GB')}
            </div>
            <div>
              <strong>Discharge:</strong> {new Date(data.dischargeDate).toLocaleDateString('en-GB')}
            </div>
            <div>
              <strong>Stay Duration:</strong> {data.totalDays} day(s)
            </div>
            <div>
              <strong>Room:</strong> {data.roomNumber} ({data.roomType})
            </div>
            <div className="col-span-2">
              <strong>Consultant:</strong> Dr. {data.doctorName}
            </div>
          </div>
        </div>

        {/* Billing Table */}
        <table className="billing-table mb-3">
          <thead>
            <tr>
              <th style={{ width: '60%' }}>Description</th>
              <th style={{ width: '40%' }} className="amount-col">Amount (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            {/* Room Charges */}
            <tr>
              <td>
                <strong>Room Charges</strong>
                <br />
                <span className="text-gray-500">{data.roomType} × {data.totalDays} day(s)</span>
              </td>
              <td className="amount-col font-medium">{formatCurrency(data.roomCharges)}</td>
            </tr>

            {/* Treatment Charges */}
            {data.treatmentCharges > 0 && (
              <tr>
                <td>
                  <strong>Treatment Charges</strong>
                  {data.treatmentItems && data.treatmentItems.length > 0 && (
                    <div className="text-gray-500 pl-2 mt-1">
                      {data.treatmentItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>• {item.description}</span>
                          <span>{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td className="amount-col font-medium">{formatCurrency(data.treatmentCharges)}</td>
              </tr>
            )}

            {/* Lab Charges */}
            {data.labCharges > 0 && (
              <tr>
                <td>
                  <strong>Laboratory Charges</strong>
                  {data.labItems && data.labItems.length > 0 && (
                    <div className="text-gray-500 pl-2 mt-1">
                      {data.labItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>• {item.description}</span>
                          <span>{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td className="amount-col font-medium">{formatCurrency(data.labCharges)}</td>
              </tr>
            )}

            {/* NICU Charges */}
            {data.nicuCharges > 0 && (
              <tr>
                <td>
                  <strong>NICU Charges</strong>
                  {data.nicuItems && data.nicuItems.length > 0 && (
                    <div className="text-gray-500 pl-2 mt-1">
                      {data.nicuItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>• {item.description}</span>
                          <span>{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td className="amount-col font-medium">{formatCurrency(data.nicuCharges)}</td>
              </tr>
            )}

            {/* Medical Charges */}
            {data.medicalCharges > 0 && (
              <tr>
                <td><strong>Medical Charges</strong></td>
                <td className="amount-col font-medium">{formatCurrency(data.medicalCharges)}</td>
              </tr>
            )}

            {/* Medicine Charges */}
            {data.medicineCharges > 0 && (
              <tr>
                <td><strong>Medicine Charges</strong></td>
                <td className="amount-col font-medium">{formatCurrency(data.medicineCharges)}</td>
              </tr>
            )}

            {/* Other Charges */}
            {data.otherCharges > 0 && (
              <tr>
                <td><strong>Other Charges</strong></td>
                <td className="amount-col font-medium">{formatCurrency(data.otherCharges)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="border border-gray-800 p-3 mb-3">
          <div className="space-y-1 text-sm">
            {/* Subtotal */}
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono">{formatCurrency(data.subtotal)}</span>
            </div>

            {/* Discount */}
            {data.discountAmount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>
                  Discount / رعایت
                  {data.discountType === 'percentage' && data.discountValue
                    ? ` (${data.discountValue}%)`
                    : ''}
                  :
                </span>
                <span className="font-mono">-{formatCurrency(data.discountAmount)}</span>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between font-bold text-base border-t pt-1 mt-1">
              <span>Total Amount / کل رقم:</span>
              <span className="font-mono">{formatCurrency(data.totalCharges)}</span>
            </div>

            <div className="border-t pt-2 mt-2 space-y-1">
              {/* Deposit */}
              <div className="flex justify-between text-blue-700">
                <span>Advance Deposit Paid / پیشگی:</span>
                <span className="font-mono">{formatCurrency(data.depositPaid)}</span>
              </div>

              {/* Additional Payment */}
              {data.additionalPayment > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Additional Payment:</span>
                  <span className="font-mono">{formatCurrency(data.additionalPayment)}</span>
                </div>
              )}

              {/* Total Paid */}
              <div className="flex justify-between font-medium">
                <span>Total Paid:</span>
                <span className="font-mono">{formatCurrency(data.totalPaid)}</span>
              </div>
            </div>

            {/* Balance or Refund */}
            {data.balanceDue > 0 ? (
              <div className="flex justify-between font-bold text-lg text-red-600 border-t-2 border-red-300 pt-2 mt-2">
                <span>BALANCE DUE / واجب الادا:</span>
                <span className="font-mono">{formatCurrency(data.balanceDue)}</span>
              </div>
            ) : data.refundAmount > 0 ? (
              <div className="flex justify-between font-bold text-lg text-green-600 border-t-2 border-green-300 pt-2 mt-2">
                <span>REFUND AMOUNT / واپسی:</span>
                <span className="font-mono">{formatCurrency(data.refundAmount)}</span>
              </div>
            ) : (
              <div className="flex justify-between font-bold text-lg text-green-600 border-t-2 border-green-300 pt-2 mt-2">
                <span>FULLY PAID / مکمل ادائیگی:</span>
                <span className="font-mono">✓</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Method */}
        {data.paymentMethod && (
          <div className="text-sm mb-3">
            <span className="font-medium">Payment Method:</span> {data.paymentMethod}
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-3 border-t border-gray-400">
          <div className="text-center">
            <div className="h-10 border-b border-gray-400"></div>
            <p className="text-xs mt-1 text-gray-600">Patient/Guardian</p>
          </div>
          <div className="text-center">
            <div className="h-10 border-b border-gray-400"></div>
            <p className="text-xs mt-1 text-gray-600">Cashier</p>
          </div>
          <div className="text-center">
            <div className="h-10 border-b border-gray-400"></div>
            <p className="text-xs mt-1 text-gray-600">Authorized Signature</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-2 border-t border-gray-300 text-xs text-gray-500">
          <p className="text-center">
            This is a computer-generated receipt. Keep for your records.
          </p>
          <p className="text-center mt-1">
            Generated: {new Date().toLocaleString('en-GB')}
          </p>
        </div>
      </div>
    );
  }
);

DischargeBillingReceipt.displayName = 'DischargeBillingReceipt';

export default DischargeBillingReceipt;
