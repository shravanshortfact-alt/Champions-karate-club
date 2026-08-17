const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (file === 'page.tsx' || file === 'route.ts') {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes("export const runtime = 'edge';")) {
                content = content.replace(/\nexport const runtime = 'edge';\n/, '');
                content = content.replace(/export const runtime = 'edge';\n/, '');
                fs.writeFileSync(fullPath, content);
                console.log('Removed from:', fullPath);
            }
        }
    }
}

processDir('./src/app');
