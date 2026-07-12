const fs = require('fs');
async function main() {
  const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  const firebaseApp = await import('firebase/app');
  const firestore = await import('firebase/firestore');
  const { initializeApp } = firebaseApp;
  const { getFirestore, collection, getDocs } = firestore;
  
  const app = initializeApp(config);
  const db = getFirestore(app, config.firestoreDatabaseId);
  
  const lSnap = await getDocs(collection(db, 'ledgers'));
  const ledgers = lSnap.docs.map(d => ({id: d.id, ...d.data()}));
  
  ledgers.forEach(l => {
      if (['Current Assets', 'Sundry Debtors', 'Cash-in-Hand', 'Bank Accounts'].includes(l.group)) {
          console.log(`Current Asset: ${l.name} (${l.group})`);
      }
  });
}
main().then(() => setTimeout(() => process.exit(0), 1000)).catch(console.error);
