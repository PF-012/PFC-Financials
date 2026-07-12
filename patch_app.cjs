const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /import Settings from '\.\/pages\/Settings';/,
  "import Settings from './pages/Settings';\nimport GoldenRules from './pages/GoldenRules';"
);

content = content.replace(
  /<Route path="\/" element=\{<Dashboard \/>\} \/>/,
  "<Route path=\"/rules\" element={<GoldenRules />} />\n                <Route path=\"/\" element={<Dashboard />} />"
);

fs.writeFileSync('src/App.tsx', content);
