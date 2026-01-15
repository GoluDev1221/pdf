
import React, { useState } from 'react';
import { X, ShieldCheck, HelpCircle, FileText } from 'lucide-react';

type ModalType = 'terms' | 'privacy' | 'faq' | null;

export const LegalFooter: React.FC = () => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const closeModal = () => setActiveModal(null);

  const Modal: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={closeModal}>
      <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-900">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={closeModal} className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg text-gray-500">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto text-sm leading-relaxed text-gray-600 dark:text-gray-300 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <footer className="w-full border-t border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-black/50 backdrop-blur-md mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-xs text-gray-500">
          © {new Date().getFullYear()} PDFbhai. Free & Local.
        </div>
        <div className="flex gap-6 text-xs font-medium text-gray-600 dark:text-gray-400">
          <button onClick={() => setActiveModal('privacy')} className="hover:text-indigo-600 flex items-center gap-1 transition-colors">
            <ShieldCheck size={14} /> Privacy Policy
          </button>
          <button onClick={() => setActiveModal('terms')} className="hover:text-indigo-600 flex items-center gap-1 transition-colors">
            <FileText size={14} /> Terms of Service
          </button>
          <button onClick={() => setActiveModal('faq')} className="hover:text-indigo-600 flex items-center gap-1 transition-colors">
            <HelpCircle size={14} /> FAQ
          </button>
        </div>
      </div>

      {activeModal === 'privacy' && (
        <Modal title="Privacy Policy">
          <p><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</p>
          <p>At PDFbhai, privacy is our core philosophy. We are a <strong>client-side only</strong> application.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>No Data Collection:</strong> We do not collect, store, or transmit your files. All PDF processing happens locally within your web browser using WebAssembly technologies.</li>
            <li><strong>No Server Uploads:</strong> Your documents never leave your device. They are not uploaded to any cloud server or database owned by us.</li>
            <li><strong>Analytics:</strong> We use privacy-preserving analytics (Cloudflare) to count visitors. This does not track individual behavior or collect personal data.</li>
            <li><strong>Local Storage:</strong> We may use your browser's local storage to save your preferences (like theme or layout settings), but never your file content.</li>
          </ul>
        </Modal>
      )}

      {activeModal === 'terms' && (
        <Modal title="Terms of Service">
          <p>By using PDFbhai, you agree to the following terms:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>License:</strong> PDFbhai is a free tool provided "as-is". You are free to use it for personal or commercial purposes.</li>
            <li><strong>Liability:</strong> Since all processing happens on your device, PDFbhai is not responsible for any data loss, file corruption, or issues resulting from the use of this tool. Always keep backups of your original documents.</li>
            <li><strong>Prohibited Use:</strong> You may not reverse engineer the application or use it for any illegal activities.</li>
            <li><strong>Changes:</strong> We reserve the right to modify the tool or these terms at any time without notice.</li>
          </ul>
        </Modal>
      )}

      {activeModal === 'faq' && (
        <Modal title="Frequently Asked Questions">
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-1">Is it really free?</h4>
              <p>Yes, PDFbhai is 100% free to use. There are no hidden paywalls.</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-1">Are my files safe?</h4>
              <p>Yes. Unlike other tools, we don't upload your files to a server. Everything stays on your laptop or phone. You can even turn off your internet after loading the page and it will still work!</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-1">Why does it look like Notion?</h4>
              <p>We love clean design. We wanted a tool that feels calm and organized, just like your notes.</p>
            </div>
          </div>
        </Modal>
      )}
    </footer>
  );
};
