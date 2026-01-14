import React, { useEffect, useState } from 'react';
import { PageItem, LayoutSettings, UploadedFile } from '../types';
import { generateFinalPdf } from '../services/pdfService';
import { Download, CheckCircle, RefreshCcw, Loader2 } from 'lucide-react';

interface Step4Props {
  pages: PageItem[];
  files: Record<string, UploadedFile>;
  layout: LayoutSettings;
  onReset: () => void;
}

export const Step4_Download: React.FC<Step4Props> = ({ pages, files, layout, onReset }) => {
  const [status, setStatus] = useState<'processing' | 'ready' | 'error'>('processing');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    const process = async () => {
      try {
        const pdfBytes = await generateFinalPdf(pages, files, layout);
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setStatus('ready');
      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    };

    // Small timeout to allow UI to render "Processing" state before thread locks
    setTimeout(() => {
        process();
    }, 500);

    return () => {
        if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  return (
    <div className="w-full max-w-2xl mx-auto text-center animate-fade-in pt-12">
      
      {status === 'processing' && (
        <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-6" />
            <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">Processing PDF...</h2>
            <p className="text-gray-500">Applying filters and organizing layout.</p>
        </div>
      )}

      {status === 'ready' && (
        <div className="flex flex-col items-center animate-slide-up">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center mb-8">
                <CheckCircle size={48} />
            </div>
            <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Your PDF is Ready!</h2>
            <p className="text-gray-500 mb-12 max-w-md">The document has been processed entirely on your device. No data was sent to any server.</p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <a 
                    href={downloadUrl!} 
                    download="PDFbhai-Export.pdf"
                    className="flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                    <Download size={24} />
                    Download PDF
                </a>
                
                <button 
                    onClick={onReset}
                    className="flex items-center justify-center gap-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all"
                >
                    <RefreshCcw size={20} />
                    Start Over
                </button>
            </div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center text-red-600">
             <h2 className="text-2xl font-bold mb-2">Something went wrong.</h2>
             <button onClick={onReset} className="mt-4 underline">Try Again</button>
        </div>
      )}
    </div>
  );
};