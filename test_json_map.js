const fs = require('fs');
let content = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');
const lines = content.split('\n');
console.log(lines.length);
for (let i = 200; i < lines.length; i++) {
    if (lines[i].includes('data = rawData.map(')) {
        console.log('Found at line ' + i);
        console.log(lines[i]);
    }
}
