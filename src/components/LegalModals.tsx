import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export const PrivacyModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Privacy Policy">
    <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
      <div className="mb-6">
        <p className="text-gray-800 font-medium text-base mb-2">Effective Date: {new Date().toLocaleDateString()}</p>
        <p>Proper Finance Consultancy ("PFC") respects your privacy and is deeply committed to protecting your personal, corporate, and financial data. This Privacy Policy governs your use of the PFC Financials platform and outlines how we handle, process, and secure your information.</p>
      </div>

      <section className="space-y-3">
        <h3 className="text-gray-900 font-semibold text-base">1. Universal Access & Strict Identity Binding</h3>
        <p>This software is available for use by the public using their own personal or corporate Google (Gmail) credentials. It is <strong>not</strong> limited solely to PFC personnel. However, your access is strictly tied to your authenticated Google ID. We employ rigorous multi-tenant data isolation techniques to ensure that your workspace is entirely sandboxed.</p>
        <p>You can exclusively view, manage, and process data associated with your specific authenticated account. Under no circumstances can any user view, access, modify, or infer the existence of accounts, ledgers, vouchers, or financial reports belonging to another user.</p>
      </section>

      <section className="space-y-3">
        <h3 className="text-gray-900 font-semibold text-base">2. Authentication & Data Collection</h3>
        <p>We utilize industry-standard Google OAuth 2.0 for secure login and identity verification. We never request, process, or store your passwords. Your identity is verified securely by Google.</p>
        <p>We collect the financial entries you voluntarily input into the system (such as ledgers, vouchers, and inventory items) strictly for the purpose of generating your financial reports (Profit & Loss, Balance Sheet, Cash Flow, etc.).</p>
      </section>

      <section className="space-y-3">
        <h3 className="text-gray-900 font-semibold text-base">3. Data Storage, Encryption & Security</h3>
        <p>Your financial data is stored in world-class, heavily fortified cloud infrastructure. We implement bank-grade encryption both at rest (using AES-256) and in transit (using TLS 1.3). We maintain stringent 24/7 monitoring to detect, deter, and prevent unauthorized access or suspicious activities.</p>
      </section>

      <section className="space-y-3">
        <h3 className="text-gray-900 font-semibold text-base">4. Zero Data Sharing Policy</h3>
        <p>Your financial privacy is absolute. We do not sell, rent, lease, or share your financial data with third-party marketers, advertisers, or data brokers. Your financial health and transactional data remain strictly confidential and are used solely for providing the accounting services within the platform.</p>
      </section>

      <section className="space-y-3">
        <h3 className="text-gray-900 font-semibold text-base">5. User Responsibilities & Data Retention</h3>
        <p>You are solely responsible for maintaining the confidentiality of your Google account and the devices you use to access the platform. Always sign out when using a shared or public device. We retain your financial data for as long as your account is active or as needed to provide you with our services, comply with our legal obligations, resolve disputes, and enforce our agreements.</p>
      </section>

      <section className="space-y-3">
        <h3 className="text-gray-900 font-semibold text-base">6. Addendums & Policy Updates</h3>
        <p>We reserve the right to modify, amend, or update this Privacy Policy at any time. Significant changes will be communicated through the platform. Your continued use of PFC Financials following any such modifications constitutes your acknowledgement and acceptance of the updated policy.</p>
      </section>
    </div>
  </Modal>
);

export const TermsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Terms and Conditions">
    <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
      <div className="mb-6">
        <p>By accessing, authenticating into, or using the PFC Financials application, you acknowledge that you have read, understood, and agree to be bound by these strict Terms and Conditions.</p>
      </div>

      <section className="space-y-3">
        <h3 className="text-gray-900 font-semibold text-base">1. Authorized & Lawful Use</h3>
        <p>You agree to use this software exclusively for lawful financial accounting, bookkeeping, and reporting purposes. You are strictly prohibited from using the software to facilitate illegal activities, money laundering, tax evasion, or fraudulent financial reporting. Any such activity will result in immediate termination of your account and reporting to relevant authorities.</p>
      </section>

      <section className="space-y-3">
        <h3 className="text-red-600 font-bold text-base flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          2. Strict Security Warning & Penalties
        </h3>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 space-y-2">
          <p className="font-medium">Any unauthorized access, misconduct, tampering, reverse engineering, or attempt to breach the system's security architecture is strictly prohibited.</p>
          <p>Any such malicious activities will be immediately flagged and reported to cyber-crime authorities and relevant law enforcement agencies without prior notice.</p>
          <p className="font-bold underline">Violators will be subject to a strict, non-negotiable penalty of ₹50,000 and may face severe civil lawsuits and criminal prosecution under applicable IT and cyber-security laws.</p>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-gray-900 font-semibold text-base">3. Service Availability & Disclaimer</h3>
        <p>While we strive for a 99.9% uptime, the service is provided on an "AS IS" and "AS AVAILABLE" basis. Proper Finance Consultancy shall not be held liable for any disruptions, server downtimes, data loss, or financial inaccuracies resulting from the use of this software or third-party service failures.</p>
      </section>

      <section className="space-y-3">
        <h3 className="text-gray-900 font-semibold text-base">4. Intellectual Property</h3>
        <p>The database architecture, proprietary algorithms, UI/UX design, and underlying codebase are the exclusive intellectual property of Proper Finance Consultancy. All Rights Reserved. You are granted a limited, non-exclusive, non-transferable license to use the software for its intended purpose.</p>
      </section>
    </div>
  </Modal>
);
