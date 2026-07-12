const fs = require('fs');
let content = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

const uiReplacement = `
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Transactions (Vouchers)</h3>
              <p className="text-xs text-gray-500 mb-2">Supports .json, .xml, .csv, and Excel files.</p>
              
              <div className="mb-4 flex items-center">
                <input 
                  type="checkbox" 
                  id="useAIAssist" 
                  checked={useAIAssist}
                  onChange={(e) => setUseAIAssist(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="useAIAssist" className="ml-2 block text-sm text-gray-700">
                  Use Smart AI Import (High Accuracy, slower)
                </label>
              </div>

              <input 
                type="file" 
                accept=".json,.xml,.csv,.xlsx,.xls"
                onChange={(e) => handleImportData(e, 'vouchers')}
`;

content = content.replace(
  /<div className="border border-gray-200 rounded-md p-4 bg-gray-50">\s*<h3 className="text-sm font-medium text-gray-900 mb-2">Transactions \(Vouchers\)<\/h3>\s*<p className="text-xs text-gray-500 mb-2">Supports \.json, \.xml, \.csv, and Excel files\.<\/p>\s*<input \s*type="file" \s*accept="\.json,\.xml,\.csv,\.xlsx,\.xls"\s*onChange=\{\(e\) => handleImportData\(e, 'vouchers'\)\}/,
  uiReplacement.trim()
);

fs.writeFileSync('src/pages/ImportExport.tsx', content);
