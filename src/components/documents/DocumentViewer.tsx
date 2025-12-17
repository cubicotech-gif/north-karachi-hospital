import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Printer, Eye } from 'lucide-react';
import { db } from '@/lib/supabase';
import { toast } from 'sonner';

interface DocumentViewerProps {
  moduleName: string; // 'billing', 'treatment', 'admission', etc.
  documentType: string; // 'receipt', 'consent_form', 'admission_form', etc.
  title?: string;
  showByDefault?: boolean;
}

interface Template {
  template_id: string;
  template_name: string;
  file_url: string;
  file_type: string;
}

export default function DocumentViewer({
  moduleName,
  documentType,
  title = 'Document Template',
  showByDefault = true,
}: DocumentViewerProps) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplate();
  }, [moduleName, documentType]);

  const fetchTemplate = async () => {
    setLoading(true);
    try {
      const { data, error } = await db.documentMappings.getModuleTemplate(
        moduleName,
        documentType
      );

      if (error) {
        console.error('Error fetching template:', error);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        setTemplate(data[0]);
      } else {
        // No template mapped for this module/type
        setTemplate(null);
      }
    } catch (error) {
      console.error('Error loading template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!template) return;

    // Open file in new tab for download
    window.open(template.file_url, '_blank');
    toast.success('Opening document for download...');
  };

  const handlePrint = () => {
    if (!template) return;

    // Open in new window and trigger print
    const printWindow = window.open(template.file_url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
      toast.success('Opening document for printing...');
    }
  };

  const handleView = () => {
    if (!template) return;
    window.open(template.file_url, '_blank');
  };

  // Don't show anything if loading or no template
  if (loading) {
    return null;
  }

  if (!template) {
    return null; // Silently hide if no template is mapped
  }

  if (!showByDefault) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-5 w-5 text-blue-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{template.template_name}</p>
              <p className="text-xs text-gray-600">
                {template.file_type.split('/')[1]?.toUpperCase()} Document
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleView}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
            <Button
              onClick={handlePrint}
              variant="default"
              size="sm"
              className="flex-1"
            >
              <Printer className="h-3 w-3 mr-1" />
              Print
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-2">
            Template uploaded via Documents Module
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
