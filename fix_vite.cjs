const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');

const regex = /server: \{/g;
const replacement = `build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
            ui: ['lucide-react', 'recharts', 'motion'],
            utils: ['jspdf', 'xlsx', 'papaparse']
          }
        }
      }
    },
    server: {`;

code = code.replace(regex, replacement);
fs.writeFileSync('vite.config.ts', code);
