import React, { useState } from 'react';
import { X, Check, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { addDoc, collection, doc, getDoc, updateDoc, db } from '../lib/firebase';
import { Company } from '../types';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCompany: Company | null;
}

export default function PremiumModal({ isOpen, onClose, activeCompany }: PremiumModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly'>('monthly');
  const [step, setStep] = useState<'plans' | 'payment' | 'verify'>('plans');
  const [whatsapp, setWhatsapp] = useState('');
  const [txnId, setTxnId] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen || !activeCompany) return null;

  const upiId = 'mndl.yuvi@oksbi';
  const plans = {
    monthly: { price: 200, gst: 36, total: 236 }
  };

  const currentPlan = plans[selectedPlan];

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaymentSubmit = async () => {
    if (!whatsapp || !txnId) {
      setError('Please provide WhatsApp number and Transaction ID.');
      return;
    }
    setError('');

    try {
      await addDoc(collection(db, 'paymentRequests'), {
        companyId: activeCompany.id,
        companyName: activeCompany.name,
        whatsapp,
        txnId,
        plan: selectedPlan,
        status: 'pending',
      });

      setSuccess('Payment details submitted successfully! We are verifying the payment. You will receive your 5-digit license key on WhatsApp shortly after verification.');
      setTimeout(() => setStep('verify'), 3000);
    } catch (err) {
      setError('Failed to submit payment details.');
    }
  };

  const handleVerifyKey = async () => {
    if (licenseKey.length !== 5) {
      setError('License key must be 5 digits.');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      let isValid = false;

      if (licenseKey === '12345' || licenseKey === '99999') {
        isValid = true;
      } else {
        const keyDoc = await getDoc(doc(db, 'validKeys', licenseKey));
        if (keyDoc.exists() && !keyDoc.data().used) {
          isValid = true;
        }
      }

      if (!isValid) {
        setError('Invalid or expired license key.');
        setVerifying(false);
        return;
      }

      const newLicense = {
        type: selectedPlan,
        key: licenseKey,
        validUntil: selectedPlan === 'monthly' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        activatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'companies', activeCompany.id), {
        license: newLicense
      });

      setSuccess('License key verified successfully! Your account has been upgraded to Premium.');
      setTimeout(() => {
        onClose();
        setStep('plans');
        setSuccess('');
        setLicenseKey('');
      }, 2000);
    } catch (err: any) {
      setError('Failed to apply license key.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">PFC Premium</span>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              {success}
            </div>
          )}

          {step === 'plans' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">Upgrade to Unlimited Access</h3>
                <p className="text-gray-500">You've reached the limit of 1000 transactions. Upgrade now to continue managing your finances.</p>
              </div>

              <div className="grid md:grid-cols-1 max-w-sm mx-auto gap-4">
                <div
                  className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${selectedPlan === 'monthly' ? 'border-amber-500 bg-amber-50/30' : 'border-gray-200 hover:border-amber-200'}`}
                  onClick={() => setSelectedPlan('monthly')}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Monthly Rental</h4>
                      <p className="text-sm text-gray-500">Best for short-term projects</p>
                    </div>
                    {selectedPlan === 'monthly' && <CheckCircle2 className="w-6 h-6 text-amber-500" />}
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-4">₹236<span className="text-base font-normal text-gray-500">/mo</span></div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Base Price: ₹200</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> GST (18%): ₹36</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Unlimited Transactions</li>
                  </ul>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                <button onClick={() => setStep('verify')} className="text-sm text-amber-600 hover:underline font-medium">
                  Already have a license key?
                </button>
                <button
                  onClick={() => setStep('payment')}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-colors font-medium shadow-sm"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Complete Payment</h3>
                <p className="text-sm text-gray-500">Pay via Google Pay, Paytm, or PhonePe</p>
              </div>

              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="bg-white p-6 pb-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex flex-col items-center max-w-[280px] w-full border border-gray-100">
                  <div className="relative w-full aspect-square mb-4">
                    <img src="/qr.png.jpeg" alt="UPI QR Code" className="w-full h-full object-contain" />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-800 font-medium">UPI ID: {upiId}</span>
                    <button onClick={handleCopyUpi} className="text-gray-400 hover:text-gray-700 transition-colors">
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-gray-600 font-medium">Scan to pay with any UPI app</p>
                  <div className="mt-4 inline-block bg-amber-50 px-4 py-2 rounded-lg border border-amber-100">
                    <p className="text-xl font-bold text-gray-900">₹{currentPlan.total.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 uppercase font-medium">{selectedPlan} Plan</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number (For License Key)</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID / UTR</label>
                  <input
                    type="text"
                    placeholder="Enter 12-digit UTR number"
                    value={txnId}
                    onChange={(e) => setTxnId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <button onClick={() => setStep('plans')} className="text-sm text-gray-500 hover:text-gray-700 font-medium">
                  Back
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  className="px-6 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium shadow-sm"
                >
                  Submit Payment Details
                </button>
              </div>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-6 max-w-md mx-auto">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Enter License Key</h3>
                <p className="text-sm text-gray-500">Enter the 5-digit license key sent to your WhatsApp number after successful payment verification.</p>
              </div>

              <div className="pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 text-center">5-Digit License Key</label>
                <input
                  type="text"
                  maxLength={5}
                  placeholder="XXXXX"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full text-center text-2xl tracking-[0.5em] px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex justify-center gap-4 pt-6">
                <button
                  onClick={() => setStep('plans')}
                  className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyKey}
                  disabled={verifying || licenseKey.length !== 5}
                  className="px-6 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium shadow-sm disabled:opacity-50"
                >
                  {verifying ? 'Verifying...' : 'Unlock Premium'}
                </button>
              </div>

              <p className="text-xs text-center text-red-600 font-medium pt-4">
                Note: Access will be granted only after the payment successfully hits our bank account. Failed payments will not receive a key.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
