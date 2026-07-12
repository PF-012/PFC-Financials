const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /<Route index element=\{<Dashboard \/>\} \/>/,
  "<Route index element={<Dashboard />} />\n              <Route path=\"rules\" element={<GoldenRules />} />"
);

fs.writeFileSync('src/App.tsx', content);
