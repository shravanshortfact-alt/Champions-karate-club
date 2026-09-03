const fs = require('fs');
const path = require('path');

const openNextDir = path.join(__dirname, '..', '.open-next');

// 8-byte minimal valid WebAssembly binary header (\0asm\1\0\0\0)
const minimalWasm = Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);

function stubDirectory(dir) {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      stubDirectory(fullPath);
    } else {
      if (fullPath.includes('@prisma') && file.endsWith('.wasm')) {
        console.log(`Stubbing unneeded runtime template ${fullPath} with minimal 8-byte wasm`);
        fs.writeFileSync(fullPath, minimalWasm);
      } else if (file.endsWith('.node') || file.includes('.node.tmp')) {
        console.log(`Removing unneeded .node binary ${fullPath}`);
        fs.unlinkSync(fullPath);
      }
    }
  }
}

stubDirectory(openNextDir);
console.log('Prisma WASM stubbing complete!');
