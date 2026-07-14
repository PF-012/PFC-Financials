import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { LogOut, Activity, Building, BookOpen, LayoutDashboard, Lightbulb, Database, FileSpreadsheet, Menu, Printer, CalendarDays, Settings, Star, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Navigate, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import PrintModal from './PrintModal';
import Logo from './Logo';
import PremiumModal from './PremiumModal';

export default function Layout() {
  const { user, logOut } = useAuth();
  const { activeCompany, financialYear, setFinancialYear, availableYears } = useAppContext();
  const location = useLocation();
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        if (activeCompany?.isBanned && user?.email !== 'mndl.yuvi@gmail.com') {
          alert("Your account has been banned. Please contact support.");
          return;
        }
        setShowPrintModal(true);
      }
      if (e.altKey) {
        switch(e.key) {
          case '1': e.preventDefault(); navigate('/'); break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  if (!user) {
    return <Navigate to="/login" />;
  }

  const navItems = [
    { icon: <Lightbulb className="w-5 h-5" />, label: 'Golden Rules', to: '/rules' },
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', to: '/' },
    { icon: <BookOpen className="w-5 h-5" />, label: 'Ledgers', to: '/ledgers' },
    { icon: <CalendarDays className="w-5 h-5" />, label: 'Day Book', to: '/daybook' },
    { icon: <Activity className="w-5 h-5" />, label: 'Vouchers', to: '/vouchers' },
    { icon: <FileSpreadsheet className="w-5 h-5" />, label: 'Reports', to: '/reports' },
    { icon: <Database className="w-5 h-5" />, label: 'Data & Sync', to: '/data' },
    { icon: <Building className="w-5 h-5" />, label: 'Companies', to: '/companies' },
    { icon: <Settings className="w-5 h-5" />, label: 'Settings', to: '/settings' }
  ];

  if (user?.email === 'mndl.yuvi@gmail.com') {
    navItems.push({ icon: <ShieldCheck className="w-5 h-5" />, label: 'Admin', to: '/admin' });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
       {/* Sidebar */}
       <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex shrink-0">
          <div className="h-16 flex items-center px-6 border-b border-blue-800 bg-blue-900">
             <div className="flex items-center gap-3 text-white"><span className="text-xl font-semibold tracking-wide">PFC Financials</span></div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item, index) => {
               const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
               return (
                  <Link 
                     key={item.to} 
                     to={item.to}
                     className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                        active 
                        ? 'bg-blue-50 text-blue-900 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                     }`}
                  >
                     {item.icon}
                     <span>{item.label}</span>
                  </Link>
               )
            })}
          </nav>

          <div className="p-4 border-t border-gray-200">
             <button onClick={() => setShowSignOutConfirm(true)} className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors">
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
             </button>
          </div>
       </aside>

       {/* Main Content */}
       <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 bg-blue-900 border-b border-blue-800 flex items-center justify-between px-4 sm:px-6 shrink-0">
             <div className="flex items-center gap-4">
                <button className="md:hidden text-blue-200 hover:text-white">
                  <Menu className="w-6 h-6" />
                </button>
                {activeCompany ? (
                   <div>
                      <span className="text-xs text-blue-200 font-medium">Active Company</span>
                      <h2 className="text-sm font-semibold text-white">{activeCompany.name}</h2>
                   </div>
                ) : (
                   <span className="text-sm text-yellow-300 font-medium">No company selected</span>
                )}
             </div>
             
             <div className="flex items-center gap-3">
                <select
                  value={financialYear.start}
                  onChange={(e) => {
                     const fy = availableYears.find(y => y.start === e.target.value);
                     if (fy) setFinancialYear(fy);
                  }}
                  className="bg-blue-800 text-white text-xs px-2 py-1.5 rounded border border-blue-700 outline-none hover:bg-blue-700 transition-colors"
                >
                  {availableYears.map(y => (
                    <option key={y.start} value={y.start}>{y.label}</option>
                  ))}
                </select>
                
                {(!activeCompany?.license || activeCompany.license.type === 'free' || (activeCompany.license.type === 'monthly' && activeCompany.license.validUntil && new Date(activeCompany.license.validUntil) < new Date())) && (
                  <button 
                    onClick={() => setShowPremiumModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold rounded-full hover:from-amber-600 hover:to-orange-600 transition-colors shadow-sm"
                    title="Upgrade to Premium"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="hidden sm:inline">Premium</span>
                  </button>
                )}

                <button 
                  onClick={() => {
                    if (activeCompany?.isBanned && user.email !== 'mndl.yuvi@gmail.com') {
                      alert("Your account has been banned. Please contact support.");
                      return;
                    }
                    setShowPrintModal(true);
                  }}
                  className="text-blue-200 hover:text-white p-2"
                  title="Print / Export (Ctrl+P)"
                >
                  <Printer className="w-5 h-5" />
                </button>
                
                <div className="relative">
                  <div 
                    className="relative w-8 h-8 rounded-full bg-blue-800 border border-blue-700 text-white flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-blue-700 transition-colors"
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    title="Profile"
                  >
                     {user.email?.[0].toUpperCase()}
                     {!activeCompany?.isBanned && activeCompany?.license && activeCompany.license.type !== 'free' && (!activeCompany.license.validUntil || new Date(activeCompany.license.validUntil) >= new Date()) && (
                       <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm" title="Verified Premium">
                         <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 fill-amber-50" />
                       </div>
                     )}
                  </div>
                  
                  {showProfileMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                         <div className="p-4 border-b border-gray-100 bg-gray-50">
                           <p className="text-sm text-gray-900 font-medium truncate">{user.email}</p>
                         </div>
                         <div className="p-4 border-b border-gray-100">
                            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                               License Status
                            </p>
                            {(() => {
                               if (activeCompany?.isBanned) {
                                  return (
                                     <div>
                                        <p className="text-sm font-medium text-red-600">Account Banned</p>
                                        <p className="text-xs text-red-500 mt-1">Please contact support.</p>
                                     </div>
                                  )
                               }
                               if (!activeCompany?.license || activeCompany.license.type === 'free') {
                                  return (
                                     <div>
                                        <p className="text-sm font-medium text-gray-700">Free Plan</p>
                                        <button onClick={() => { setShowProfileMenu(false); setShowPremiumModal(true); }} className="mt-2 text-xs font-medium text-amber-600 hover:text-amber-700">Upgrade to Premium</button>
                                     </div>
                                  )
                               }
                               
                               const actDate = activeCompany.license.activatedAt ? new Date(activeCompany.license.activatedAt) : (
                                   activeCompany.license.type === 'monthly' && activeCompany.license.validUntil 
                                       ? new Date(new Date(activeCompany.license.validUntil).getTime() - 30 * 24 * 60 * 60 * 1000)
                                       : null
                               );
                               const dateString = actDate ? `(${actDate.getDate()} ${actDate.toLocaleString('default', { month: 'long' })}, ${actDate.getFullYear()})` : '';

                               if (activeCompany.license.type === 'monthly') {
                                  const daysLeft = activeCompany.license.validUntil ? Math.ceil((new Date(activeCompany.license.validUntil).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;
                                  
                                  if (daysLeft <= 0) {
                                     return (
                                        <div>
                                           <p className="text-sm font-medium text-red-600">Expired</p>
                                           <button onClick={() => { setShowProfileMenu(false); setShowPremiumModal(true); }} className="mt-2 w-full text-center text-xs font-medium bg-amber-500 text-white px-3 py-1.5 rounded hover:bg-amber-600">Renew Plan</button>
                                        </div>
                                     )
                                  }
                                  return (
                                     <div>
                                        <p className="text-sm font-medium text-gray-700">Premium (Monthly) <span className="text-xs text-gray-500 font-normal">{dateString}</span></p>
                                        <p className={`text-sm ${daysLeft <= 5 ? 'text-red-500 font-medium' : 'text-green-600'}`}>
                                           {daysLeft} days remaining
                                        </p>
                                        {daysLeft <= 5 && (
                                           <button onClick={() => { setShowProfileMenu(false); setShowPremiumModal(true); }} className="mt-3 w-full text-center text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded shadow-sm hover:from-amber-600 hover:to-orange-600">
                                              Renew Now
                                           </button>
                                        )}
                                     </div>
                                  )
                               }
                               return (
                                  <div>
                                     <p className="text-sm font-medium text-gray-700">Permanent License <span className="text-xs text-gray-500 font-normal">{dateString}</span></p>
                                  </div>
                               );
                            })()}
                         </div>
                         <button 
                           onClick={() => { setShowProfileMenu(false); setShowSignOutConfirm(true); }}
                           className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium"
                         >
                           <LogOut className="w-4 h-4" />
                           Sign Out
                         </button>
                      </div>
                    </>
                  )}
                </div>
             </div>
          </header>

          <main id="printable-area" className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">

            <div className="hidden print:flex items-center gap-4 mb-8 pb-4 border-b border-gray-200">
               <Logo className="w-16 h-16" />
               <div>
                 <h1 className="text-2xl font-bold tracking-wide text-[#1a237e]">PFC Financials</h1>
                 <p className="text-sm text-gray-500">All-In-One Accounting Software</p>
               </div>
            </div>

             <Outlet />
          </main>
       </div>
       <PrintModal isOpen={showPrintModal} onClose={() => setShowPrintModal(false)} />
       
       {showSignOutConfirm && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden zoom-in-95 animate-in duration-200">
             <div className="p-6">
               <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign Out</h3>
               <p className="text-sm text-gray-600">Are you sure you want to sign out of PFC Financials?</p>
             </div>
             <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
               <button 
                 onClick={() => setShowSignOutConfirm(false)}
                 className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
               >
                 Cancel
               </button>
               <button 
                 onClick={() => {
                   setShowSignOutConfirm(false);
                   logOut();
                 }}
                 className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
               >
                 Yes, Sign Out
               </button>
             </div>
           </div>
         </div>
       )}
       
       <PremiumModal 
         isOpen={showPremiumModal} 
         onClose={() => setShowPremiumModal(false)} 
         activeCompany={activeCompany} 
       />
    </div>
  );
}
