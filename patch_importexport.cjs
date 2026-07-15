const fs = require('fs');
let code = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

const regex = /if \(type === 'vouchers' && useAI\) \{[\s\S]*?\} else \{/;

const replacement = `if (useAI) {
      const chunks = [];
      const chunkSize = type === 'vouchers' ? 15 : 30;
      for(let i=0; i<data.length; i+=chunkSize) chunks.push(data.slice(i, i+chunkSize));
      
      const endpoint = type === 'vouchers' ? '/api/map-imported-vouchers' : '/api/map-imported-ledgers';
      
      for(const chunk of chunks) {
         const res = await fetch(endpoint, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ rawData: chunk })
         });
         if (!res.ok) {
           let errData;
           try { errData = await res.json(); } catch(e) { throw new Error('AI Mapping failed: Server returned an invalid response (status ' + res.status + ')'); }
           throw new Error(errData.error || 'AI Mapping failed');
         }
         const resData = await res.json();
         if (type === 'vouchers') {
             mappedData.push(...resData.mappedVouchers);
         } else {
             mappedData.push(...resData.mappedLedgers);
         }
      }
    } else {`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/pages/ImportExport.tsx', code);
