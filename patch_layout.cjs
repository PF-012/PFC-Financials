const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

const importTarget = `import { LogOut, Activity, Building, BookOpen, LayoutDashboard, Lightbulb, Database, FileSpreadsheet, Menu, Printer, CalendarDays, Settings, Star, ShieldCheck, CheckCircle2 } from 'lucide-react';`;
const importInsert = `import { LogOut, Activity, Building, BookOpen, LayoutDashboard, Lightbulb, Database, FileSpreadsheet, Menu, Printer, CalendarDays, Settings, Star, ShieldCheck, CheckCircle2, MessageSquareText } from 'lucide-react';`;

const navTarget = `{ icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', to: '/' },`;
const navInsert = `{ icon: <MessageSquareText className="w-5 h-5" />, label: 'AI Guide', to: '/ai-guide' },\n    `;

if (code.includes(importTarget)) {
    code = code.replace(importTarget, importInsert);
}
if (!code.includes('AI Guide')) {
    code = code.replace(navTarget, navTarget + '\n    ' + navInsert);
    fs.writeFileSync('src/components/Layout.tsx', code);
    console.log("Patched Layout.tsx");
} else {
    console.log("Layout.tsx already patched");
}
