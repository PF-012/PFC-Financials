const fs = require('fs');
let content = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

const importReplacement = `import { Download, Upload, Loader2, FileJson, FileCode, Trash2, UploadCloud, FileScan } from 'lucide-react';`;
content = content.replace(/import { Download, Upload, Loader2, FileJson, FileCode, Trash2 } from 'lucide-react';/, importReplacement);

const newFunction = `
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ total: 0, current: 0, success: 0, failed: 0 });

  const handleBulkUploadBills = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user || !activeCompany) return;
    
    setBulkUploading(true);
    setBulkProgress({ total: files.length, current: 0, success: 0, failed: 0 });
    
    try {
      // Pre-fetch ledgers to match or create
      const ledgersSnap = await getDocs(query(collection(db, 'ledgers'), where('companyId', '==', activeCompany.id)));
      const ledgers = ledgersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      
      let newLedgersCount = 0;
      let newVouchersCount = 0;
      let failedCount = 0;

      for (let i = 0; i < files.length; i++) {
         const file = files[i];
         try {
            const base64Data = await new Promise<string>((resolve, reject) => {
               const reader = new FileReader();
               reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
               reader.onerror = reject;
               reader.readAsDataURL(file);
            });
            
            const res = await fetch('/api/parse-invoice', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fileBase64: base64Data, mimeType: file.type })
            });
            
            if (!res.ok) throw new Error('Failed to parse bill ' + file.name);
            const data = await res.json();
            const parsed = data.invoice;
            
            let foundPartyId = '';
            if (parsed.partyName) {
               const existing = ledgers.find(l => l.name.toLowerCase() === parsed.partyName.toLowerCase());
               if (existing) {
                 foundPartyId = existing.id;
               } else {
                 const newLedgerRef = doc(collection(db, 'ledgers'));
                 const newLedger = {
                    name: parsed.partyName,
                    group: parsed.partyGroup || 'Sundry Creditors',
                    userId: user.uid,
                    companyId: activeCompany.id,
                    openingBalance: 0
                 };
                 await writeBatch(db).set(newLedgerRef, newLedger).commit();
                 ledgers.push({ id: newLedgerRef.id, ...newLedger });
                 foundPartyId = newLedgerRef.id;
                 newLedgersCount++;
               }
            }
            
            let foundAccountId = '';
            if (parsed.type === 'Purchase') {
               foundAccountId = ledgers.find(l => l.group === 'Purchase Accounts')?.id || '';
            } else if (parsed.type === 'Sales') {
               foundAccountId = ledgers.find(l => l.group === 'Sales Accounts')?.id || '';
            } else if (parsed.type === 'Payment' || parsed.type === 'Receipt') {
               const isBank = parsed.paymentMode && ['UPI', 'Card', 'Bank'].includes(parsed.paymentMode);
               if (isBank) {
                   foundAccountId = ledgers.find(l => l.group === 'Bank Accounts')?.id || '';
               }
               if (!foundAccountId) {
                   foundAccountId = ledgers.find(l => ['Bank Accounts', 'Cash-in-Hand'].includes(l.group))?.id || '';
               }
            }
            
            const newVoucherRef = doc(collection(db, 'vouchers'));
            await writeBatch(db).set(newVoucherRef, {
               type: parsed.type || 'Purchase',
               date: parsed.date || new Date().toISOString().split('T')[0],
               number: parsed.number || '',
               partyId: foundPartyId,
               accountId: foundAccountId,
               totalAmount: parsed.totalAmount || 0,
               cgstAmount: parsed.cgstAmount || 0,
               sgstAmount: parsed.sgstAmount || 0,
               igstAmount: parsed.igstAmount || 0,
               itemName: parsed.itemName || '',
               narration: 'Auto-imported from ' + file.name,
               companyId: activeCompany.id,
               userId: user.uid,
               createdAt: new Date().toISOString()
            }).commit();
            
            newVouchersCount++;
            setBulkProgress(p => ({ ...p, current: i + 1, success: p.success + 1 }));
         } catch (err) {
            console.error(err);
            failedCount++;
            setBulkProgress(p => ({ ...p, current: i + 1, failed: p.failed + 1 }));
         }
      }
      
      setMessage(\`Successfully auto-created \${newVouchersCount} vouchers and \${newLedgersCount} new ledgers. \${failedCount > 0 ? failedCount + ' failed.' : ''}\`);
    } catch (err: any) {
      console.error(err);
      setMessage('Error during bulk import: ' + err.message);
    } finally {
      setBulkUploading(false);
      e.target.value = '';
    }
  };
`;

content = content.replace(
  'const handleImportFolder = async (e: any) => {',
  newFunction + '\n  const handleImportFolder = async (e: any) => {'
);

const newUI = `
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50 md:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                 <FileScan className="w-4 h-4 text-gray-700" />
                 <h3 className="text-sm font-medium text-gray-900">Bulk Upload Bills/Invoices (Auto Create)</h3>
              </div>
              <p className="text-xs text-gray-500 mb-2">Select multiple images or PDFs. The system will extract details and automatically create ledgers and vouchers.</p>
              
              {bulkUploading ? (
                 <div className="mt-2 space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: \`\${(bulkProgress.current / bulkProgress.total) * 100}%\` }}></div>
                    </div>
                    <p className="text-xs text-gray-600">Processing {bulkProgress.current} of {bulkProgress.total} files... ({bulkProgress.success} succeeded, {bulkProgress.failed} failed)</p>
                 </div>
              ) : (
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  multiple
                  onChange={handleBulkUploadBills}
                  disabled={loading || bulkUploading}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100 w-full disabled:opacity-50"
                 />
              )}
            </div>
`;

content = content.replace(
  '<div className="border border-gray-200 rounded-md p-4 bg-gray-50">',
  newUI + '\n            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">'
);

fs.writeFileSync('src/pages/ImportExport.tsx', content);
