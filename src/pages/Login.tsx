import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import Logo from "../components/Logo";
import { PrivacyModal, TermsModal } from "../components/LegalModals";

export default function Login() {
  const [showPolicies, setShowPolicies] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, signIn } = useAuth();

  if (user) {
    return <Navigate to="/" />;
  }

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signIn();
    } catch (err: any) {
      setError(err.message || "Failed to authenticate with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <Logo className="w-24 h-24 drop-shadow-md" />
        </div>
        <h2 className="mt-2 text-center text-3xl font-bold text-gray-900 tracking-tight">
          PFC Financials
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Secure access to your enterprise financial data
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex justify-center items-center gap-3 py-2.5 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 disabled:opacity-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading
                ? "Authenticating securely..."
                : "Sign in securely with Google"}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Enterprise Security Active
                </span>
              </div>
            </div>

            <div className="text-[10px] sm:text-xs text-center text-gray-500 mt-6 space-y-2">
              <p className="font-medium text-gray-700">
                The Database is Owned by Proper Finance Consultancy
              </p>
              <p className="font-medium text-gray-700">All Rights Reserved</p>
            </div>

            <div className="flex justify-center gap-6 pt-4 mt-4 border-t border-gray-200 text-xs">
              <button
                onClick={() => setShowPolicies(true)}
                className="text-gray-500 hover:text-blue-600 transition-colors"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => setShowTerms(true)}
                className="text-gray-500 hover:text-blue-600 transition-colors"
              >
                Terms and Conditions
              </button>
            </div>

            <PrivacyModal
              isOpen={showPolicies}
              onClose={() => setShowPolicies(false)}
            />
            <TermsModal
              isOpen={showTerms}
              onClose={() => setShowTerms(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
