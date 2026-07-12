const fs = require('fs');
async function main() {
  const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  const firebaseApp = await import('firebase/app');
  const firestore = await import('firebase/firestore');
  const { initializeApp } = firebaseApp;
  const { getFirestore, collection, getDocs } = firestore;
  
  const app = initializeApp(config);
  const db = getFirestore(app, config.firestoreDatabaseId);
  
  const vSnap = await getDocs(collection(db, 'vouchers'));
  const vouchers = vSnap.docs.map(d => ({id: d.id, ...d.data()}));
  
  const lSnap = await getDocs(collection(db, 'ledgers'));
  const ledgers = lSnap.docs.reduce((acc, d) => ({...acc, [d.id]: d.data().name}), {});
  
  vouchers.forEach(v => {
      let narration = (v.narration || '').toLowerCase();
      let accName = (ledgers[v.accountId] || '').toLowerCase();
      let partyName = (ledgers[v.partyId] || '').toLowerCase();
      if (narration.includes('recharge') || accName.includes('recharge') || partyName.includes('recharge')) {
          console.log(v.id, v.date, v.type, v.totalAmount, ledgers[v.accountId], ledgers[v.partyId], v.narration);
      }
  });
}
main().then(() => setTimeout(() => process.exit(0), 1000)).catch(console.error);
