const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('c:/Users/admin/Desktop/KARATE KING ADMISSION FORM WEBSITE/karate-club/src');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // fix .then(data => to .then((data: any) =>
  content = content.replace(/\.then\(\s*data\s*=>/g, '.then((data: any) =>');
  
  // fix const data = await res.json() to const data: any = await res.json()
  content = content.replace(/const\s+data\s*=\s*await/g, 'const data: any = await');
  
  // fix let data = await res.json() to let data: any = await res.json()
  content = content.replace(/let\s+data\s*=\s*await/g, 'let data: any = await');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log("Fixed", file);
  }
}
