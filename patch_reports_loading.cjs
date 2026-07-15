const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

code = code.replace(/const \[loading, setLoading\] = useState\(true\);/, "const [loading, setLoading] = useState(false);");
code = code.replace(/if \(loading\) return;/, "");

fs.writeFileSync('src/pages/Reports.tsx', code);
