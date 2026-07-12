const fs = require('fs');
let content = fs.readFileSync('src/pages/Login.tsx', 'utf8');

content = content.replace("import { PrivacyModal, TermsModal } from '../components/LegalModals';import { PrivacyModal, TermsModal } from '../components/LegalModals';", "import { PrivacyModal, TermsModal } from '../components/LegalModals';");

content = content.replace('<p className="font-medium text-gray-700">and All Rights Reserved</p>', '<p className="font-medium text-gray-700">All Rights Reserved</p>');

fs.writeFileSync('src/pages/Login.tsx', content);
