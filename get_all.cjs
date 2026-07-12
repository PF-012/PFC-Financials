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
  
  console.log("All Ledgers:");
  ledgers.forEach(l => console.log(l.id, l.name, l.group, l.openingBalance));

  const vSnap = await getDocs(collection(db, 'vouchers'));
  const vouchers = vSnap.docs.map(d => ({id: d.id, ...d.data()}));
  
  console.log("\nAll Vouchers:");
  vouchers.forEach(v => console.log(v.id, v.type, v.date, v.totalAmount, v.narration, v.accountId, v.partyId));
  process.exit(0);
}
main().catch(console.error);
