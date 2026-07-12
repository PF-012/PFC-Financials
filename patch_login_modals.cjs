const fs = require('fs');
let content = fs.readFileSync('src/pages/Login.tsx', 'utf8');

// Add import for LegalModals
content = content.replace(
  /import Logo from '\.\.\/components\/Logo';/,
  "import Logo from '../components/Logo';\nimport { PrivacyModal, TermsModal } from '../components/LegalModals';"
);

const newText = `
               <div className="text-xs text-center text-gray-500 mt-6 space-y-1">
                 <p className="font-medium text-gray-700">The Database is Owned by Proper Finance Consultancy</p>
                 <p className="font-medium text-gray-700">All Rights Reserved</p>
               </div>
               
               <div className="flex justify-center gap-6 pt-4 mt-4 border-t border-gray-200 text-xs">
                  <button onClick={() => setShowPolicies(true)} className="text-gray-500 hover:text-blue-600 hover:underline transition-colors">Privacy Policy</button>
                  <button onClick={() => setShowTerms(true)} className="text-gray-500 hover:text-blue-600 hover:underline transition-colors">Terms and Conditions</button>
               </div>

               <PrivacyModal isOpen={showPolicies} onClose={() => setShowPolicies(false)} />
               <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
`;

content = content.replace(
  /<div className="text-xs text-center text-gray-500 mt-4 space-y-4">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*}/g,
  newText + "            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n}"
);

fs.writeFileSync('src/pages/Login.tsx', content);
