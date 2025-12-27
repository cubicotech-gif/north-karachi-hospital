import React, { forwardRef } from 'react';

interface ConsentFormProps {
  consentType: 'treatment' | 'admission' | 'lab' | 'opd';
  patientName: string;
  patientAge?: string | number;
  patientGender?: string;
  patientContact?: string;
  procedureName?: string;
  doctorName?: string;
  date?: string;
}

const ConsentFormTemplate = forwardRef<HTMLDivElement, ConsentFormProps>((props, ref) => {
  const {
    consentType,
    patientName,
    patientAge,
    patientGender,
    patientContact,
    procedureName,
    doctorName,
    date = new Date().toLocaleDateString('en-PK'),
  } = props;

  const getConsentTitle = () => {
    switch (consentType) {
      case 'treatment':
        return 'TREATMENT CONSENT FORM';
      case 'opd':
        return 'OPD CONSULTATION CONSENT FORM';
      case 'lab':
        return 'LABORATORY TESTING CONSENT FORM';
      case 'admission':
        return 'HOSPITAL ADMISSION CONSENT FORM';
      default:
        return 'CONSENT FORM';
    }
  };

  const getConsentText = () => {
    switch (consentType) {
      case 'treatment':
        return `I, the undersigned, hereby give my consent for the treatment procedure: "${procedureName || 'Medical Treatment'}" to be performed on the patient named above.

I understand that:
• The nature and purpose of this treatment has been explained to me
• All risks, benefits, and possible complications have been discussed
• Alternative treatment options have been explained
• I have had the opportunity to ask questions and received satisfactory answers
• I understand that no guarantee has been made about the results
• The treating physician will use their professional judgment during the procedure

I voluntarily consent to this treatment and authorize the medical staff to proceed.`;

      case 'opd':
        return `I, the undersigned, hereby give my consent for OPD consultation and examination${doctorName ? ` with Dr. ${doctorName}` : ''}.

I understand that:
• The doctor will examine and assess the patient's medical condition
• Diagnostic tests or procedures may be recommended
• Treatment or medication may be prescribed based on the diagnosis
• I have the right to ask questions about the examination and treatment
• All medical information will be kept confidential
• I may be required to follow-up as advised by the doctor

I voluntarily consent to this consultation and authorize the medical examination.`;

      case 'lab':
        return `I, the undersigned, hereby give my consent for laboratory testing and specimen collection from the patient named above.

I understand that:
• Laboratory tests have been ordered by the attending physician
• Specimen collection (blood, urine, or other samples) will be performed
• Test results will be shared with the ordering physician
• Results will be used for diagnosis and treatment planning
• Sample collection may cause minor discomfort
• All test results will be kept confidential

I voluntarily consent to these laboratory tests and specimen collection.`;

      case 'admission':
        return `I, the undersigned, hereby give my consent for admission of the patient named above to North Karachi Hospital.

I understand that:
• The patient requires hospitalization for medical care
• Hospital rules and regulations must be followed
• Medical procedures and treatments may be performed as necessary
• Visitors must follow hospital visiting hours and policies
• I am responsible for hospital charges and fees
• I will inform staff of any changes in the patient's condition
• I have the right to discharge the patient against medical advice

I voluntarily consent to this hospital admission and agree to the terms stated above.`;

      default:
        return 'I give my consent for the medical procedure to be performed.';
    }
  };

  return (
    <div ref={ref} style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '8mm', paddingTop: '76mm' }}>
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
            }
          }
        `}
      </style>

      {/* Pre-printed letterhead space - content starts 5 inches from top */}

      {/* Consent Title */}
      <div style={{
        padding: '10px',
        backgroundColor: '#007B8A',
        color: 'white',
        fontSize: '18px',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        {getConsentTitle()}
      </div>

      {/* Date */}
      <div style={{ textAlign: 'right', marginBottom: '20px', fontSize: '14px' }}>
        <strong>Date:</strong> {date}
      </div>

      {/* Patient Information */}
      <div style={{
        border: '2px solid #007B8A',
        padding: '20px',
        marginBottom: '30px',
        backgroundColor: '#E8F7FC'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '15px',
          color: '#007B8A',
          borderBottom: '2px solid #007B8A',
          paddingBottom: '8px'
        }}>
          PATIENT INFORMATION
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
          <div><strong>Patient Name:</strong> {patientName}</div>
          {patientAge && <div><strong>Age:</strong> {patientAge} years</div>}
          {patientGender && <div><strong>Gender:</strong> {patientGender}</div>}
          {patientContact && <div><strong>Contact:</strong> {patientContact}</div>}
        </div>
        {procedureName && (
          <div style={{ marginTop: '12px', fontSize: '14px' }}>
            <strong>Procedure/Service:</strong> {procedureName}
          </div>
        )}
        {doctorName && (
          <div style={{ marginTop: '12px', fontSize: '14px' }}>
            <strong>Doctor:</strong> Dr. {doctorName}
          </div>
        )}
      </div>

      {/* Consent Statement */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '15px',
          color: '#333'
        }}>
          CONSENT STATEMENT
        </h3>
        <div style={{
          fontSize: '13px',
          lineHeight: '1.8',
          textAlign: 'justify',
          whiteSpace: 'pre-line'
        }}>
          {getConsentText()}
        </div>
      </div>

      {/* Checkboxes */}
      <div style={{
        border: '1px solid #ddd',
        padding: '15px',
        marginBottom: '30px',
        backgroundColor: '#f9f9f9'
      }}>
        <div style={{ marginBottom: '10px', fontSize: '13px' }}>
          <span style={{
            display: 'inline-block',
            width: '20px',
            height: '20px',
            border: '2px solid #333',
            marginRight: '10px',
            verticalAlign: 'middle'
          }}></span>
          I have read and understood the above consent statement
        </div>
        <div style={{ fontSize: '13px' }}>
          <span style={{
            display: 'inline-block',
            width: '20px',
            height: '20px',
            border: '2px solid #333',
            marginRight: '10px',
            verticalAlign: 'middle'
          }}></span>
          I understand the risks, benefits, and alternatives explained to me
        </div>
      </div>

      {/* Signatures */}
      <div style={{ marginTop: '50px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          {/* Patient/Guardian Signature */}
          <div>
            <div style={{
              borderBottom: '2px solid #333',
              marginBottom: '10px',
              height: '60px'
            }}></div>
            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>Patient / Guardian Signature</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Name: _______________________
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Relationship: _________________
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              CNIC: ________________________
            </div>
          </div>

          {/* Witness Signature */}
          <div>
            <div style={{
              borderBottom: '2px solid #333',
              marginBottom: '10px',
              height: '60px'
            }}></div>
            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>Witness Signature</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Name: _______________________
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Designation: _________________
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Date: ________________________
            </div>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div style={{
        marginTop: '40px',
        padding: '15px',
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
        fontSize: '11px',
        color: '#666',
        textAlign: 'center'
      }}>
        <strong>Note:</strong> This consent form is a legal document. Please read it carefully before signing.
        <br />
        If you have any questions, please ask the medical staff before signing.
      </div>
    </div>
  );
});

ConsentFormTemplate.displayName = 'ConsentFormTemplate';

export default ConsentFormTemplate;
