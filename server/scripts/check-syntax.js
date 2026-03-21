import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, '..');
const roots = ['config', 'routes', 'services', 'scripts', 'server.js'];

function collectJsFiles(targetPath) {
  const fullPath = path.join(serverRoot, targetPath);
  const stats = fs.statSync(fullPath);

  if (stats.isFile()) {
    return fullPath.endsWith('.js') ? [fullPath] : [];
  }

  return fs.readdirSync(fullPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(fullPath, entry.name);

    if (entry.isDirectory()) {
      return collectJsFiles(path.relative(serverRoot, entryPath));
    }

    return entry.name.endsWith('.js') ? [entryPath] : [];
  });
}

const files = roots.flatMap(collectJsFiles);

for (const file of files) {
  execFileSync(process.execPath, ['--check', file], {
    stdio: 'inherit',
  });
}

console.log(`Checked ${files.length} server files.`);
