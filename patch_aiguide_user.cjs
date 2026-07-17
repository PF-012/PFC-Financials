const fs = require('fs');
let code = fs.readFileSync('src/pages/AIGuide.tsx', 'utf8');

if (!code.includes("useAuth")) {
  code = code.replace(
    "import { Send, Bot, User, Loader2, Paperclip, X, Image as ImageIcon, Trash2 } from 'lucide-react';",
    "import { Send, Bot, User as UserIcon, Loader2, Paperclip, X, Image as ImageIcon, Trash2 } from 'lucide-react';\nimport { useAuth } from '../context/AuthContext';"
  );
  // Also rename User from lucide-react to UserIcon to avoid conflict with AuthContext User if it gets imported, but we just use useAuth
  code = code.replace(/<User className=/g, "<UserIcon className=");
}

fs.writeFileSync('src/pages/AIGuide.tsx', code);
console.log("Patched imports");
