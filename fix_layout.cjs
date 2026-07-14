const fs = require('fs');
let layout = fs.readFileSync('src/components/Layout.tsx', 'utf8');
layout = layout.replace(
`      if (e.altKey) {
        switch(e.key) {
          case '1': e.preventDefault(); navigate('/'); break;
          case '2': e.preventDefault(); navigate('/ledgers'); break;
          case '3': e.preventDefault(); navigate('/daybook'); break;
          case '4': e.preventDefault(); navigate('/vouchers'); break;
          case '5': e.preventDefault(); navigate('/reports'); break;
          case '6': e.preventDefault(); navigate('/data'); break;
          case '7': e.preventDefault(); navigate('/companies'); break;
          case '8': e.preventDefault(); navigate('/settings'); break;
        }
      }`,
`      if (e.altKey) {
        switch(e.key) {
          case '1': e.preventDefault(); navigate('/'); break;
        }
      }`
);
fs.writeFileSync('src/components/Layout.tsx', layout);
