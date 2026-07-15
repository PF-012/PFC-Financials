const fs = require('fs');
let code = fs.readFileSync('src/pages/Reports.tsx', 'utf8');

code = code.replace(
  /<span className="text-red-600">Net Loss<\/span>/g,
  '<span className="text-gray-700">Net Profit / (Loss)</span>'
);

code = code.replace(
  /<span className="text-gray-900">Gross Loss c\/o<\/span>/g,
  '<span className="text-gray-700">Gross Profit / (Loss) c/o</span>'
);

code = code.replace(
  /<span>Gross Loss b\/f<\/span>/g,
  '<span>Gross Profit / (Loss) b/f</span>'
);

fs.writeFileSync('src/pages/Reports.tsx', code);
