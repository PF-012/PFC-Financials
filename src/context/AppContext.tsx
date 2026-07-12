import React, { createContext, useContext, useState, useEffect } from 'react';
import { Company } from '../types';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { FinancialYear, getFinancialYearDates, generateAvailableYears } from '../utils';

interface AppContextType {
  companies: Company[];
  activeCompany: Company | null;
  setActiveCompany: (company: Company) => void;
  loading: boolean;
  financialYear: FinancialYear;
  setFinancialYear: (fy: FinancialYear) => void;
  availableYears: FinancialYear[];
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [financialYear, setFinancialYear] = useState<FinancialYear>(getFinancialYearDates());
  const availableYears = generateAvailableYears();

  useEffect(() => {
    if (!user) {
      setCompanies([]);
      setActiveCompany(null);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'companies'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
      setCompanies(comps);
      
      // If we have companies but no active one, set the first one
      if (comps.length > 0 && !activeCompany) {
        setActiveCompany(comps[0]);
      } else if (comps.length === 0) {
        setActiveCompany(null);
      } else if (activeCompany && !comps.find(c => c.id === activeCompany.id)) {
        setActiveCompany(comps[0] || null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, activeCompany]);

  return (
    <AppContext.Provider value={{ companies, activeCompany, setActiveCompany, loading, financialYear, setFinancialYear, availableYears }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
