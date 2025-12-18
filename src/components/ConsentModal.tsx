import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { FileText, AlertTriangle, CheckCircle, Printer } from 'lucide-react';
import { toast } from 'sonner';

interface ConsentModalProps {
  isOpen: boolean;
  consentType: 'treatment' | 'admission' | 'lab' | 'opd';
  patientName: string;
  procedureName?: string;
  onAccept: () => void;
  onDecline: () => void;
}

export default function ConsentModal({
  isOpen,
  consentType,
  patientName,
  procedureName,
  onAccept,
  onDecline
}: ConsentModalProps) {
  const [hasReadConsent, setHasReadConsent] = useState(false);
  const [hasUnderstoodRisks, setHasUnderstoodRisks] = useState(false);

  const consentText = {
    treatment: `I, ${patientName}, hereby consent to undergo ${procedureName || 'medical treatment'} as recommended by the attending physician. I understand that:

    • The procedure/treatment has been explained to me
    • There are risks and benefits associated with this treatment
    • I have been given the opportunity to ask questions
    • Alternative treatments have been discussed
    • I voluntarily consent to this treatment

    I authorize the medical staff of North Karachi Hospital to perform the necessary treatment.`,

    admission: `I, ${patientName}, hereby consent to admission to North Karachi Hospital. I agree to:

    • Follow hospital rules and regulations
    • Pay all charges as per hospital tariff
    • Allow medical staff to perform necessary procedures
    • Visiting hours: 10:00 AM - 12:00 PM & 4:00 PM - 7:00 PM
    • Hospital is not responsible for personal belongings

    I understand the deposit is refundable upon discharge after adjusting dues.`,

    lab: `I, ${patientName}, consent to laboratory testing as ordered by my physician. I understand that:

    • Blood samples or specimens will be collected
    • Test results will be shared with my referring doctor
    • Some tests may require fasting or special preparation
    • Results will be available within 24-48 hours

    I authorize the collection of samples and performance of ordered tests.`,

    opd: `I, ${patientName}, consent to outpatient consultation and treatment. I understand that:

    • I will be examined by a qualified physician
    • My medical information will be kept confidential
    • I am responsible for OPD consultation fees
    • I may be referred for additional tests or procedures

    I voluntarily seek medical consultation at North Karachi Hospital.`
  };

  if (!isOpen) return null;

  const handleAccept = () => {
    if (!hasReadConsent || !hasUnderstoodRisks) {
      toast.error('Please confirm you have read and understood the consent');
      return;
    }
    onAccept();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-6 w-6" />
            Patient Consent Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Patient or guardian must read and accept this consent before proceeding.
            </p>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto">
            <h3 className="font-semibold mb-2 text-lg">
              {consentType === 'treatment' && 'Treatment Consent Form'}
              {consentType === 'admission' && 'Admission Consent Form'}
              {consentType === 'lab' && 'Laboratory Test Consent'}
              {consentType === 'opd' && 'OPD Consultation Consent'}
            </h3>
            <pre className="whitespace-pre-wrap text-sm font-sans">
              {consentText[consentType]}
            </pre>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="read-consent"
                checked={hasReadConsent}
                onCheckedChange={(checked) => setHasReadConsent(checked as boolean)}
              />
              <label
                htmlFor="read-consent"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I confirm that I have read and understood the above consent form
              </label>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="understand-risks"
                checked={hasUnderstoodRisks}
                onCheckedChange={(checked) => setHasUnderstoodRisks(checked as boolean)}
              />
              <label
                htmlFor="understand-risks"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I understand the risks, benefits, and alternatives, and I voluntarily consent
              </label>
            </div>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button
              onClick={handleAccept}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={!hasReadConsent || !hasUnderstoodRisks}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept & Continue
            </Button>
            <Button
              onClick={onDecline}
              variant="outline"
              className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
            >
              Decline
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            By accepting, you acknowledge that you have read and agreed to the consent terms above
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
