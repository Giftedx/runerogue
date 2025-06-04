import * as fs from 'fs';
import * as path from 'path';

// Recursively scan directory structure
function scanDir(dir: string): any {
  const entries = fs.readdirSync(dir);
  const tree: Record<string, any> = {};
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    if (fs.statSync(fullPath).isDirectory()) {
      tree[entry] = scanDir(fullPath);
    } else {
      tree[entry] = null;
    }
  }
  return tree;
}

const root = path.resolve(__dirname, '..');
const structure = scanDir(root);
console.log(JSON.stringify(structure, null, 2));
