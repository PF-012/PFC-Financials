const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

content = content.replace(
  /BookOpen, LayoutDashboard/,
  "BookOpen, LayoutDashboard, Lightbulb"
);

content = content.replace(
  /\{ icon: <BookOpen className="w-5 h-5" \/>, label: 'Golden Rules', to: '\/rules' \},/,
  "{ icon: <Lightbulb className=\"w-5 h-5\" />, label: 'Golden Rules', to: '/rules' },"
);

fs.writeFileSync('src/components/Layout.tsx', content);
