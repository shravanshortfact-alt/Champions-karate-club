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
            if (!content.includes('export const runtime')) {
                // Find last import statement
                const lines = content.split('\n');
                let lastImportIdx = -1;
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].trim().startsWith('import ')) {
                        lastImportIdx = i;
                    }
                }
                
                const edgeExport = `\nexport const runtime = 'edge';\n`;
                if (lastImportIdx !== -1) {
                    lines.splice(lastImportIdx + 1, 0, edgeExport);
                } else {
                    lines.unshift(edgeExport);
                }
                
                fs.writeFileSync(fullPath, lines.join('\n'));
                console.log('Added to:', fullPath);
            }
        }
    }
}

processDir('./src/app');
