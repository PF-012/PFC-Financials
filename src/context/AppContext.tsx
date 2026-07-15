import React, { createContext, useContext, useState, useEffect } from 'react';
import { Company } from '../types';
import { collection, query, where, onSnapshot } from '../lib/firebase';
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
    const q = query(collection(db, 'companies'), where('userId', '==', user.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
      setCompanies(comps);
      
      setActiveCompany(prevActive => {
        if (comps.length > 0 && !prevActive) {
          return comps[0];
        } else if (comps.length === 0) {
          return null;
        } else if (prevActive && !comps.find(c => c.id === prevActive.id)) {
          return comps[0] || null;
        }
        return prevActive;
      });
      
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <AppContext.Provider value={{ companies, activeCompany, setActiveCompany, loading, financialYear, setFinancialYear, availableYears }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
