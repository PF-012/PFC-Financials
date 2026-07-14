const fs = require('fs');
let layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');
layout = layout.replace(
  "<span>{item.label.split(' (')[0]} <span className=\"text-xs text-gray-400 ml-1\">(Alt+{index + 1})</span></span>",
  "<span>{item.label}</span>"
);
fs.writeFileSync('src/components/Layout.tsx', layout);
