const fs = require('fs');
let code = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

const regex = /useEffect\(\(\) => \{[\s\S]*?\}, \[user, activeCompany\]\);/g;

const replacement = `useEffect(() => {
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
  }, [user]);`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/context/AppContext.tsx', code);
