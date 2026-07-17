const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const importTarget = `const Admin = React.lazy(() => import('./pages/Admin'));`;
const importInsert = `const AIGuide = React.lazy(() => import('./pages/AIGuide'));\n`;

const routeTarget = `<Route path="admin" element={<Admin />} />`;
const routeInsert = `<Route path="ai-guide" element={<AIGuide />} />\n              `;

if (!code.includes('AIGuide')) {
    code = code.replace(importTarget, importTarget + '\n' + importInsert);
    code = code.replace(routeTarget, routeTarget + '\n              ' + routeInsert);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched App.tsx");
} else {
    console.log("App.tsx already patched");
}
