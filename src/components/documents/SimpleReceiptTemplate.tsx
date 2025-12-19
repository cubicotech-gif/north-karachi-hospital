import React, { forwardRef } from 'react';

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
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  amountPaid?: number;
  balanceDue?: number;
}

interface ReceiptTemplateProps {
  data: ReceiptData;
}

const SimpleReceiptTemplate = forwardRef<HTMLDivElement, ReceiptTemplateProps>(
  ({ data }, ref) => {
    return (
      <div ref={ref} style={{ padding: '40px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '4px solid #e74c3c', paddingBottom: '20px', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', margin: '0 0 10px 0' }}>
            NORTH KARACHI HOSPITAL
          </h1>
          <p style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>
            C-122, Sector 11-B, North Karachi Township, Karachi
          </p>
          <p style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>
            Ph: 36989080
          </p>
          <div style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: '#e74c3c',
            color: 'white',
            fontSize: '20px',
            fontWeight: 'bold'
          }}>
            RECEIPT / رسید
          </div>
        </div>

        {/* Receipt Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px', fontSize: '14px' }}>
          <div>
            <strong>Receipt No:</strong> {data.receiptNumber}
          </div>
          <div style={{ textAlign: 'right' }}>
            <strong>Date:</strong> {new Date(data.date).toLocaleDateString('en-GB')}
          </div>
        </div>

        {/* Patient Information */}
        <div style={{
          border: '2px solid #e74c3c',
          padding: '20px',
          marginBottom: '30px',
          backgroundColor: '#fff5f5'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '15px',
            color: '#e74c3c',
            borderBottom: '2px solid #e74c3c',
            paddingBottom: '8px'
          }}>
            PATIENT INFORMATION
          </h3>
          <div style={{ fontSize: '14px' }}>
            <div style={{ marginBottom: '10px' }}><strong>Patient Name:</strong> {data.patientName}</div>
            {data.patientContact && <div style={{ marginBottom: '10px' }}><strong>Contact:</strong> {data.patientContact}</div>}
            {data.patientCnic && <div style={{ marginBottom: '10px' }}><strong>CNIC:</strong> {data.patientCnic}</div>}
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ border: '2px solid #ddd', padding: '12px', textAlign: 'left' }}>Description</th>
              <th style={{ border: '2px solid #ddd', padding: '12px', textAlign: 'right', width: '150px' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index}>
                <td style={{ border: '2px solid #ddd', padding: '12px', whiteSpace: 'pre-line' }}>
                  {item.description}
                </td>
                <td style={{ border: '2px solid #ddd', padding: '12px', textAlign: 'right' }}>
                  Rs. {item.amount.toLocaleString()}
                </td>
              </tr>
            ))}
            <tr style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold', fontSize: '16px' }}>
              <td style={{ border: '2px solid #ddd', padding: '15px', textAlign: 'right' }}>
                TOTAL:
              </td>
              <td style={{ border: '2px solid #ddd', padding: '15px', textAlign: 'right' }}>
                Rs. {data.total.toLocaleString()}
              </td>
            </tr>

            {data.amountPaid !== undefined && data.amountPaid < data.total && (
              <>
                <tr>
                  <td style={{ border: '2px solid #ddd', padding: '12px', textAlign: 'right' }}>
                    Amount Paid:
                  </td>
                  <td style={{ border: '2px solid #ddd', padding: '12px', textAlign: 'right' }}>
                    Rs. {data.amountPaid.toLocaleString()}
                  </td>
                </tr>
                <tr style={{ backgroundColor: '#fff3cd' }}>
                  <td style={{ border: '2px solid #ddd', padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                    Balance Due:
                  </td>
                  <td style={{ border: '2px solid #ddd', padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#dc3545' }}>
                    Rs. {(data.balanceDue || 0).toLocaleString()}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>

        {/* Payment Status */}
        <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <strong>Payment Status:</strong>{' '}
          <span style={{
            display: 'inline-block',
            padding: '8px 16px',
            borderRadius: '4px',
            fontWeight: 'bold',
            marginLeft: '10px',
            backgroundColor: data.paymentStatus === 'paid' ? '#d4edda' :
                           data.paymentStatus === 'partial' ? '#fff3cd' : '#f8d7da',
            color: data.paymentStatus === 'paid' ? '#155724' :
                   data.paymentStatus === 'partial' ? '#856404' : '#721c24'
          }}>
            {data.paymentStatus.toUpperCase()}
          </span>
        </div>

        {/* Signatures */}
        <div style={{ marginTop: '80px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            <div>
              <div style={{ borderBottom: '2px solid #333', marginBottom: '10px', height: '50px' }}></div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>Patient Signature</div>
            </div>
            <div>
              <div style={{ borderBottom: '2px solid #333', marginBottom: '10px', height: '50px' }}></div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>Authorized Signature</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '1px solid #ddd',
          textAlign: 'center',
          fontSize: '11px',
          color: '#666'
        }}>
          <p>Thank you for choosing North Karachi Hospital</p>
          <p style={{ marginTop: '5px' }}>Printed on: {new Date().toLocaleString('en-GB')}</p>
        </div>
      </div>
    );
  }
);

SimpleReceiptTemplate.displayName = 'SimpleReceiptTemplate';

export default SimpleReceiptTemplate;
