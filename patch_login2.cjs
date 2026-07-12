const fs = require('fs');
let content = fs.readFileSync('src/pages/Login.tsx', 'utf8');

content = content.replace(
  /export default function Login\(\) \{/,
  "export default function Login() {\n  const [showPolicies, setShowPolicies] = useState(false);\n  const [showTerms, setShowTerms] = useState(false);"
);

const newText = `
            <div className="text-xs text-center text-gray-500 mt-4 space-y-4">
               <div className="font-medium text-gray-700">
                  <p>The Database is Owned by Proper Finance Consultancy</p>
                  <p>and All Rights Reserved</p>
               </div>
               <p>Your session is protected with industry-standard Google OAuth 2.0.</p>
               
               <div className="flex justify-center gap-4 pt-4 border-t border-gray-200">
                  <button onClick={() => setShowPolicies(!showPolicies)} className="text-blue-600 hover:underline hover:text-blue-800 transition-colors">Privacy Policy</button>
                  <button onClick={() => setShowTerms(!showTerms)} className="text-blue-600 hover:underline hover:text-blue-800 transition-colors">Terms and Conditions</button>
               </div>

               {(showPolicies || showTerms) && (
                 <div className="text-[10px] sm:text-xs text-gray-500 space-y-2 text-justify bg-gray-50 p-3 rounded-md border border-gray-200">
                   {showPolicies && (
                     <>
                       <p className="font-semibold text-gray-700 mb-1">Privacy Policy</p>
                       <p>This software is strictly for authorized personnel of Proper Finance Consultancy. We employ bank-grade encryption and stringent monitoring to protect sensitive financial data.</p>
                     </>
                   )}
                   {showTerms && (
                     <>
                       <p className="font-semibold text-gray-700 mb-1 mt-2">Terms and Conditions</p>
                       <p className="text-red-600 font-medium">Strict Security Warning: Any unauthorized access, misconduct, tampering, or attempt to breach the system will be immediately reported to cyber-crime authorities. Violators will be subject to a strict penalty of ₹50,000 and may face severe legal consequences under applicable laws.</p>
                     </>
                   )}
                 </div>
               )}
            </div>
`;

content = content.replace(
  /<div className="text-xs text-center text-gray-500 mt-4 space-y-4">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*}/g,
  newText + "          </div>\n        </div>\n      </div>\n    </div>\n  );\n}"
);

fs.writeFileSync('src/pages/Login.tsx', content);
