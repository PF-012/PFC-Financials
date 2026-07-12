const fs = require('fs');
let content = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

const parseCode = `
            const res = await fetch('/api/parse-invoice', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fileBase64: base64Data, mimeType: file.type })
            });
            
            if (!res.ok) {
               let errMsg = 'Failed to parse bill ' + file.name;
               try { const errData = await res.json(); errMsg = errData.error || errMsg; } catch(e) {}
               throw new Error(errMsg);
            }
            let data;
            try { data = await res.json(); } catch(e) { throw new Error('Invalid JSON response from server'); }
`;

content = content.replace(
  /const res = await fetch\('\/api\/parse-invoice'[\s\S]*?const data = await res\.json\(\);/,
  parseCode.trim()
);

fs.writeFileSync('src/pages/ImportExport.tsx', content);
