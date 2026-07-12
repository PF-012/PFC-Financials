import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, FileDown, Eye } from 'lucide-react';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';


interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId?: string;
  title?: string;
}

export default function PrintModal({ isOpen, onClose, targetId = 'printable-area', title = 'Document' }: PrintModalProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const printContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      generatePreview();
    } else {
      setPreviewImage(null);
    }
  }, [isOpen]);

  const generatePreview = async () => {
    const element = document.getElementById(targetId);
    if (!element) return;
    
    setLoadingPreview(true);
    element.classList.add('pdf-generating');
    const originalStyles = {
        width: element.style.width,
        height: element.style.height,
        overflow: element.style.overflow
    };
    element.style.width = '1000px'; 
    element.style.height = 'auto';
    element.style.overflow = 'visible';
    
    try {
      const dataUrl = await toPng(element, { quality: 0.8, pixelRatio: 1 });
      setPreviewImage(dataUrl);
    } catch (err) {
      console.error('Error generating preview', err);
    } finally {
        element.style.width = originalStyles.width;
        element.style.height = originalStyles.height;
        element.style.overflow = originalStyles.overflow;
        element.classList.remove('pdf-generating');
        setLoadingPreview(false);
    }
  };

  const handlePrint = () => {
    window.print();
    onClose();
  };

  const handleDownloadPdf = async () => {
    if (!previewImage) return;
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const img = new Image();
      img.src = previewImage;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      const pdfHeight = (img.height * pdfWidth) / img.width;
      pdf.addImage(previewImage, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${title.replace(/s+/g, '_')}_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error('Error generating PDF', err);
    } finally {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <h3 className="text-lg font-medium text-gray-900">Print / Export Options</h3>
          <div className="flex items-center gap-4">
            <button 
              onClick={handlePrint}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" /> Print Document
            </button>
            <button 
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-blue-900 text-white rounded-md text-sm font-medium hover:bg-blue-800 transition-colors flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" /> Download as PDF
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-gray-100 p-8 overflow-y-auto flex justify-center items-start">
          {loadingPreview ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500 mb-4"></div>
              Generating Preview...
            </div>
          ) : previewImage ? (
            <div className="bg-white shadow-md">
               <img src={previewImage} alt="Document Preview" className="max-w-[21cm] w-full object-contain" />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
               Preview not available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
