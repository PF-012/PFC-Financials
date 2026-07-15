const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace synchronous imports with lazy imports
const components = ['Login', 'Dashboard', 'Companies', 'Ledgers', 'Vouchers', 'Reports', 'ImportExport', 'DayBook', 'Settings', 'GoldenRules', 'Admin'];

components.forEach(comp => {
  const regex = new RegExp(`import ${comp} from '\\./pages/${comp}';\\n?`, 'g');
  code = code.replace(regex, `const ${comp} = React.lazy(() => import('./pages/${comp}'));\n`);
});

// Add Suspense around Routes
code = code.replace(/<Routes>/, '<React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div></div>}>\n          <Routes>');
code = code.replace(/<\/Routes>/, '</Routes>\n          </React.Suspense>');

fs.writeFileSync('src/App.tsx', code);
