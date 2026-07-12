const fs = require('fs');
let content = fs.readFileSync('src/pages/Vouchers.tsx', 'utf8');

const warningUi = `
          {aiWarning && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>AI Accounting Warning:</strong> {aiWarning}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            {editingId && (
              <button type="button" onClick={() => setDeleteConfirm(editingId)} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                 Delete (Alt+D)
              </button>
            )}
            <button type="submit" disabled={isVerifying} className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 disabled:opacity-50">
               {isVerifying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
               {forceSave ? 'Save Anyway' : 'Save Voucher'}
            </button>
          </div>
`;

content = content.replace(
  /<div className="flex justify-end gap-3 pt-6 border-t border-gray-200">[\s\S]*?<\/button>\s*<\/div>/,
  warningUi.trim()
);

fs.writeFileSync('src/pages/Vouchers.tsx', content);
