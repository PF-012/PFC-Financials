const fs = require('fs');
async function main() {
  const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  const firebaseApp = await import('firebase/app');
  const firestore = await import('firebase/firestore');
  const { initializeApp } = firebaseApp;
  const { getFirestore, collection, getDocs, doc, deleteDoc } = firestore;
  
  const app = initializeApp(config);
  const db = getFirestore(app, config.firestoreDatabaseId);
  const vSnap = await getDocs(collection(db, 'vouchers'));
  
  const vouchers = vSnap.docs.map(d => ({id: d.id, ...d.data()}));
  
  const autoReceipts = vouchers.filter(v => v.type === 'Receipt' && v.narration && v.narration.includes('Auto Receipt for Sales Voucher No:'));
  
  const groups = {};
  autoReceipts.forEach(v => {
    const match = v.narration.match(/Auto Receipt for Sales Voucher No: (\d+)/);
    if (match) {
      const num = match[1];
      if (!groups[num]) groups[num] = [];
      groups[num].push(v);
    }
  });
  
  let deleted = 0;
  for (const num in groups) {
    if (groups[num].length > 1) {
       console.log(`Sales Voucher No: ${num} has ${groups[num].length} Auto Receipts.`);
       groups[num].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
       // keep the first one, delete the rest
       for (let i = 1; i < groups[num].length; i++) {
         console.log(`  Deleting duplicate: ${groups[num][i].id} (${groups[num][i].createdAt}) for ${groups[num][i].accountId}`);
         await deleteDoc(doc(db, 'vouchers', groups[num][i].id));
         deleted++;
       }
    }
  }
  console.log(`Deleted ${deleted} duplicate auto receipts.`);
}
main().then(() => setTimeout(() => process.exit(0), 1000)).catch(console.error);
