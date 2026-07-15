const fs = require('fs');
let code = fs.readFileSync('src/pages/ImportExport.tsx', 'utf8');

const regexToRemove = /<div className="mb-4 flex items-center">\s*<input\s*type="checkbox"\s*id="useAIAssist"[\s\S]*?<\/div>/;
code = code.replace(regexToRemove, '');

const regexToInsert = /<div className="space-y-4">/;
code = code.replace(regexToInsert, `<div className="space-y-4">
            <div className="mb-4 flex items-center bg-blue-50 p-3 rounded border border-blue-100">
                <input 
                  type="checkbox" 
                  id="useAIAssist" 
                  checked={useAIAssist}
                  onChange={(e) => setUseAIAssist(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="useAIAssist" className="ml-2 block text-sm font-medium text-blue-900">
                  Use Smart AI Mapping (High Accuracy for Custom Formats)
                </label>
            </div>`);

fs.writeFileSync('src/pages/ImportExport.tsx', code);
