import React, { forwardRef, useEffect, useState } from 'react';
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

    useEffect(() => {
      // Generate QR Code for receipt verification
      const generateQRCode = async () => {
        try {
          const qrData = `RCP:${data.receiptNumber}|${data.date}|${data.total}`;
          const url = await QRCode.toDataURL(qrData, { width: 80 });
          setQrCodeUrl(url);
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      };

      generateQRCode();
    }, [data.receiptNumber, data.date, data.total]);

    return (
      <div ref={ref} className="bg-white" style={{ width: '80mm', padding: '3mm', fontFamily: 'Arial, sans-serif' }}>
        <style>
          {`
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          `}
        </style>

        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '2mm', marginBottom: '2mm' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>North Karachi Hospital</div>
          <div style={{ fontSize: '11px' }}>نارتھ کراچی ہسپتال</div>
          <div style={{ fontSize: '8px', marginTop: '1mm' }}>C-122, Sector 11-B, North Karachi | 36989080</div>
        </div>

        {/* Receipt Title */}
        <div style={{ background: '#000', color: '#fff', padding: '2mm', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', margin: '2mm 0' }}>
          RECEIPT / رسید
        </div>

        {/* Duplicate Watermark */}
        {data.isDuplicate && (
          <div style={{ textAlign: 'center', padding: '1mm', background: '#f00', color: '#fff', fontSize: '9px', fontWeight: 'bold', marginBottom: '2mm' }}>
            DUPLICATE COPY
          </div>
        )}

        {/* Receipt Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', margin: '1mm 0' }}>
          <span><strong>No:</strong> {data.receiptNumber}</span>
          <span><strong>Date:</strong> {new Date(data.date).toLocaleDateString('en-GB')}</span>
        </div>

        <div style={{ borderTop: '1px dashed #000', margin: '2mm 0' }}></div>

        {/* Patient Information */}
        <div style={{ fontSize: '9px', lineHeight: '1.4', margin: '2mm 0' }}>
          <div><strong>Patient:</strong> {data.patientName}</div>
          {data.patientCnic && <div><strong>CNIC:</strong> {data.patientCnic}</div>}
          {data.patientContact && <div><strong>Contact:</strong> {data.patientContact}</div>}
        </div>

        <div style={{ borderTop: '1px dashed #000', margin: '2mm 0' }}></div>

        {/* Items */}
        <div style={{ fontSize: '9px' }}>
          {data.items.map((item, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '1mm 0', borderBottom: '1px dotted #ccc' }}>
              <span style={{ flex: 1 }}>{item.description}</span>
              <span>Rs. {item.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* Total Section */}
        <div style={{ margin: '2mm 0', padding: '2mm', background: '#f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold' }}>
            <span>TOTAL / کل:</span>
            <span>Rs. {data.total.toLocaleString()}</span>
          </div>
        </div>

        {/* Balance Due */}
        {data.amountPaid !== undefined && data.amountPaid < data.total && (
          <div style={{ fontSize: '9px', margin: '1mm 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Paid:</span>
              <span>Rs. {data.amountPaid.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#c00' }}>
              <span>Balance:</span>
              <span>Rs. {(data.balanceDue || 0).toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Payment Status */}
        <div style={{
          textAlign: 'center',
          padding: '2mm',
          marginTop: '2mm',
          fontWeight: 'bold',
          fontSize: '11px',
          background: data.paymentStatus === 'paid' ? '#000' : 'transparent',
          color: data.paymentStatus === 'paid' ? '#fff' : '#000',
          border: data.paymentStatus !== 'paid' ? '2px solid #000' : 'none'
        }}>
          {data.paymentStatus === 'paid' ? '✓ PAID / ادا شدہ' :
           data.paymentStatus === 'partial' ? '◐ PARTIAL / جزوی' :
           '✗ UNPAID / غیر ادا شدہ'}
        </div>

        {/* Notes */}
        {data.notes && (
          <div style={{ fontSize: '8px', margin: '2mm 0', padding: '1mm', background: '#f5f5f5' }}>
            <strong>Note:</strong> {data.notes}
          </div>
        )}

        {/* QR Code */}
        {qrCodeUrl && (
          <div style={{ textAlign: 'center', margin: '2mm 0' }}>
            <img src={qrCodeUrl} alt="QR" style={{ width: '60px', height: '60px' }} />
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '8px', marginTop: '3mm', paddingTop: '2mm', borderTop: '1px dashed #000' }}>
          Thank you / شکریہ<br/>
          {new Date().toLocaleString('en-GB')}
          {data.isDuplicate && <div style={{ fontWeight: 'bold', marginTop: '1mm' }}>DUPLICATE</div>}
        </div>
      </div>
    );
  }
);

ReceiptTemplate.displayName = 'ReceiptTemplate';

export default ReceiptTemplate;
