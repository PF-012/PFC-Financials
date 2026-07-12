const fs = require('fs');
let content = fs.readFileSync('src/pages/Login.tsx', 'utf8');

const newText = `
            <div className="text-xs text-center text-gray-500 mt-4 space-y-4">
               <p className="font-medium text-gray-700">The Database is Owned by Proper Finance Consultancy and All Rights Reserved</p>
               <p>Your session is protected with industry-standard Google OAuth 2.0.</p>
               
               <div className="pt-4 border-t border-gray-200 text-[10px] sm:text-xs text-gray-500 space-y-2 text-justify">
                 <p className="font-semibold text-gray-700 mb-1">Privacy Policy & Terms and Conditions</p>
                 <p>This software is strictly for authorized personnel of Proper Finance Consultancy. We employ bank-grade encryption and stringent monitoring to protect sensitive financial data.</p>
                 <p className="text-red-600 font-medium">Strict Security Warning: Any unauthorized access, misconduct, tampering, or attempt to breach the system will be immediately reported to cyber-crime authorities. Violators will be subject to a strict penalty of ₹50,000 and may face severe legal consequences under applicable laws.</p>
               </div>
            </div>
`;

content = content.replace(
  /<div className="text-xs text-center text-gray-500 mt-4 space-y-2">\s*<p>Your session is protected with industry-standard Google OAuth 2\.0\.<\/p>\s*<\/div>/g,
  newText
);

fs.writeFileSync('src/pages/Login.tsx', content);
