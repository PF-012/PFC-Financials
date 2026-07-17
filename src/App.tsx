import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Companies = React.lazy(() => import('./pages/Companies'));
const Ledgers = React.lazy(() => import('./pages/Ledgers'));
const Vouchers = React.lazy(() => import('./pages/Vouchers'));
const Reports = React.lazy(() => import('./pages/Reports'));
const ImportExport = React.lazy(() => import('./pages/ImportExport'));
const DayBook = React.lazy(() => import('./pages/DayBook'));
const Settings = React.lazy(() => import('./pages/Settings'));
const GoldenRules = React.lazy(() => import('./pages/GoldenRules'));
const Admin = React.lazy(() => import('./pages/Admin'));
const AIGuide = React.lazy(() => import('./pages/AIGuide'));

import SplashScreen from './components/SplashScreen';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Software Protected</h2>
        <p className="text-gray-600 mb-6 text-sm">
          A potential bug was caught and prevented from crashing the system. 
          <br/><br/>
          <span className="font-mono bg-gray-100 p-1 rounded text-xs text-red-800 break-all">{error.message}</span><pre className="mt-4 text-left text-xs bg-gray-200 p-2 overflow-auto max-h-40">{error.stack}</pre>
        </p>
        <button
          onClick={resetErrorBoundary}
          className="inline-flex items-center px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900"
        >
          <RefreshCcw className="h-4 w-4 mr-2" />
          Reload Application
        </button>
      </div>
    </div>
  );
}

function App() {

  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (

    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div></div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="rules" element={<GoldenRules />} />
              <Route path="companies" element={<Companies />} />
              <Route path="ledgers" element={<Ledgers />} />
              <Route path="daybook" element={<DayBook />} />
              <Route path="vouchers" element={<Vouchers />} />
              <Route path="reports" element={<Reports />} />
              <Route path="data" element={<ImportExport />} />
              <Route path="settings" element={<Settings />} />
              <Route path="admin" element={<Admin />} />
              <Route path="ai-guide" element={<AIGuide />} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
          </React.Suspense>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
