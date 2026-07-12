const fs = require('fs');
let content = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

// Reduce chunk size to 15 and fix error handling
content = content.replace(
  /for\(let i=0; i<data\.length; i\+=50\) chunks\.push\(data\.slice\(i, i\+50\)\);/,
  "for(let i=0; i<data.length; i+=15) chunks.push(data.slice(i, i+15));"
);

const fetchCode = `
         const res = await fetch('/api/map-imported-vouchers', {
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
`;

content = content.replace(
  /const res = await fetch\('\/api\/map-imported-vouchers'[\s\S]*?const resData = await res\.json\(\);/,
  fetchCode.trim()
);

fs.writeFileSync('src/pages/ImportExport.tsx', content);
