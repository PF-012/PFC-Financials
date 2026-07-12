const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkDir(dir) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath);
        } else if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
            let content = fs.readFileSync(dirPath, 'utf8');
            let originalContent = content;
            
            // Replace import { ... } from 'firebase/firestore'; with import { ... } from '../lib/firebase';
            // Need to figure out the correct relative path to lib/firebase.
            const relativePath = path.relative(path.dirname(dirPath), path.join(srcDir, 'lib', 'firebase'));
            let importPath = relativePath.startsWith('.') ? relativePath : './' + relativePath;
            // remove .ts
            importPath = importPath.replace(/\.ts$/, '');

            content = content.replace(/from\s+['"]firebase\/firestore['"]/g, `from '${importPath}'`);
            // we also need to remove import { db } from '../lib/firebase' if we are importing from the same file to avoid duplicates, 
            // but actually multiple imports from the same file are fine in typescript.
            
            if (content !== originalContent) {
                fs.writeFileSync(dirPath, content);
                console.log(`Updated ${dirPath}`);
            }
        }
    });
}

walkDir(srcDir);
