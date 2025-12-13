import React, { forwardRef, useEffect, useState } from 'react';
import Letterhead from './Letterhead';
import { db } from '@/lib/supabase';
import QRCode from 'qrcode';

interface ReceiptData {
  receiptNumber: string;
  date: string;
  patientName: string;
  patientCnic?: string;
  patientContact?: string;
  items: {
    description: string;
    amount: number;
  }[];
  total: number;
  paymentMethod?: string;
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  amountPaid?: number;
  balanceDue?: number;
  receivedBy?: string;
  notes?: string;
  isDuplicate?: boolean;
}

interface ReceiptTemplateProps {
  data: ReceiptData;
}

const ReceiptTemplate = forwardRef<HTMLDivElement, ReceiptTemplateProps>(
  ({ data }, ref) => {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [footerText, setFooterText] = useState<string>('');
    const [footerUrdu, setFooterUrdu] = useState<string>('');

    useEffect(() => {
      // Generate QR Code for receipt verification
      const generateQRCode = async () => {
        try {
          const qrData = `RCP:${data.receiptNumber}|${data.date}|${data.total}`;
          const url = await QRCode.toDataURL(qrData, { width: 120 });
          setQrCodeUrl(url);
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      };

      // Load footer text from settings
      const loadFooter = async () => {
        try {
          const { data: settings } = await db.hospitalSettings.get();
          if (settings) {
            setFooterText(settings.print_footer || '');
            setFooterUrdu(settings.print_footer_urdu || '');
          }
        } catch (error) {
          console.error('Error loading footer:', error);
        }
      };

      generateQRCode();
      loadFooter();
    }, [data.receiptNumber, data.date, data.total]);

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

              .print-only {
                display: block !important;
              }
            }

            @media screen {
              .print-only {
                display: none;
              }
            }
          `}
        </style>

        {/* Letterhead */}
        <Letterhead showUrdu={true} variant="full" />

        {/* Duplicate Watermark */}
        {data.isDuplicate && (
          <div className="text-center mb-4">
            <span className="inline-block px-4 py-1 bg-red-100 text-red-700 font-bold text-sm rounded border-2 border-red-300">
              DUPLICATE COPY
            </span>
          </div>
        )}

        {/* Receipt Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">RECEIPT / رسید</h2>
        </div>

        {/* Receipt Details */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p><strong>Receipt No:</strong> {data.receiptNumber}</p>
            <p className="text-right" dir="rtl"><strong>رسید نمبر:</strong> {data.receiptNumber}</p>
          </div>
          <div className="text-right">
            <p><strong>Date:</strong> {new Date(data.date).toLocaleDateString('en-GB')}</p>
            <p dir="rtl"><strong>تاریخ:</strong> {new Date(data.date).toLocaleDateString('en-GB')}</p>
          </div>
        </div>

        {/* Patient Information */}
        <div className="border-2 border-gray-300 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-lg mb-3 text-gray-800">Patient Details / مریض کی تفصیلات</h3>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <p><strong>Name:</strong> {data.patientName}</p>
              <p className="text-right" dir="rtl"><strong>نام:</strong> {data.patientName}</p>
            </div>

            {data.patientCnic && (
              <div className="grid grid-cols-2 gap-4">
                <p><strong>CNIC:</strong> {data.patientCnic}</p>
                <p className="text-right" dir="rtl"><strong>شناختی کارڈ:</strong> {data.patientCnic}</p>
              </div>
            )}

            {data.patientContact && (
              <div className="grid grid-cols-2 gap-4">
                <p><strong>Contact:</strong> {data.patientContact}</p>
                <p className="text-right" dir="rtl"><strong>رابطہ:</strong> {data.patientContact}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Details */}
        <div className="mb-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left">Description / تفصیل</th>
                <th className="border border-gray-300 px-4 py-2 text-right w-32">Amount / رقم</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-4 py-2">{item.description}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    Rs. {item.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td className="border border-gray-300 px-4 py-3 text-right">
                  Total / کل رقم:
                </td>
                <td className="border border-gray-300 px-4 py-3 text-right text-lg">
                  Rs. {data.total.toLocaleString()}
                </td>
              </tr>

              {data.amountPaid !== undefined && data.amountPaid < data.total && (
                <>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      Amount Paid / ادا شدہ رقم:
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      Rs. {data.amountPaid.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-yellow-50">
                    <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                      Balance Due / باقی رقم:
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right font-semibold text-red-600">
                      Rs. {(data.balanceDue || 0).toLocaleString()}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Payment Status */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm">
              <strong>Payment Status / ادائیگی کی حیثیت:</strong>{' '}
              <span
                className={`inline-block px-3 py-1 rounded font-semibold ${
                  data.paymentStatus === 'paid'
                    ? 'bg-green-100 text-green-700'
                    : data.paymentStatus === 'partial'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {data.paymentStatus === 'paid' ? 'PAID / ادا شدہ' :
                 data.paymentStatus === 'partial' ? 'PARTIAL / جزوی' :
                 'UNPAID / غیر ادا شدہ'}
              </span>
            </p>

            {data.paymentMethod && (
              <p className="text-sm mt-2">
                <strong>Payment Method:</strong> {data.paymentMethod}
              </p>
            )}
          </div>

          {qrCodeUrl && (
            <div className="text-right">
              <img src={qrCodeUrl} alt="QR Code" className="inline-block h-24 w-24" />
              <p className="text-xs text-gray-500 mt-1">Scan to verify</p>
            </div>
          )}
        </div>

        {/* Notes */}
        {data.notes && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm"><strong>Notes:</strong> {data.notes}</p>
          </div>
        )}

        {/* Signature Section */}
        <div className="mt-12 grid grid-cols-2 gap-8">
          <div>
            <div className="border-t-2 border-gray-400 pt-2">
              <p className="text-sm text-center">Patient Signature / مریض کے دستخط</p>
            </div>
          </div>
          <div>
            <div className="border-t-2 border-gray-400 pt-2">
              <p className="text-sm text-center">
                Authorized Signature / مجاز دستخط
                {data.receivedBy && <span className="block text-xs mt-1">({data.receivedBy})</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        {(footerText || footerUrdu) && (
          <div className="mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-600">
            {footerText && <p>{footerText}</p>}
            {footerUrdu && <p dir="rtl" className="mt-1">{footerUrdu}</p>}
          </div>
        )}

        {/* Print Info */}
        <div className="mt-4 text-xs text-gray-400 text-center">
          <p>Printed on: {new Date().toLocaleString('en-GB')}</p>
          {data.isDuplicate && <p className="font-semibold">This is a duplicate copy</p>}
        </div>
      </div>
    );
  }
);

ReceiptTemplate.displayName = 'ReceiptTemplate';

export default ReceiptTemplate;
