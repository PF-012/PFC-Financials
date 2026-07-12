const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

content = content.replace(
  /const navItems = \[/,
  "const navItems = [\n    { icon: <BookOpen className=\"w-5 h-5\" />, label: 'Golden Rules', to: '/rules' },"
);

// We should also replace the BookOpen import if it's already used in another item, wait Layout already imports BookOpen, maybe we should use a different icon like 'GraduationCap' or 'HelpCircle' or 'Lightbulb'
fs.writeFileSync('src/components/Layout.tsx', content);
