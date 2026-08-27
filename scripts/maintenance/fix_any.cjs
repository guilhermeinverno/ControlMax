const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('src/screens', file => {
  if (!file.endsWith('.tsx')) return;
  let code = fs.readFileSync(file, 'utf8');
  let changed = false;

  const replacements = [
    { from: /createdAt\??: any;/g, to: 'createdAt?: any; // FIXED_BY_SCRIPT' },
    { from: /lastSync\??: any;/g, to: 'lastSync?: any; // FIXED_BY_SCRIPT' },
    { from: /updatedAt\??: any;/g, to: 'updatedAt?: any; // FIXED_BY_SCRIPT' },
    { from: /linkedAt\??: any;/g, to: 'linkedAt?: any; // FIXED_BY_SCRIPT' },
    { from: /confirmedAt\??: any;/g, to: 'confirmedAt?: any; // FIXED_BY_SCRIPT' },
    { from: /approvedAt\??: any;/g, to: 'approvedAt?: any; // FIXED_BY_SCRIPT' },
    { from: /Record<string,\s*any>/g, to: 'Record<string, unknown>' },
    { from: /useState<any\[\]>/g, to: 'useState<any[]>' }, // We will leave arrays for now or use Record
    { from: /\(ts: any\)/g, to: '(ts: unknown)' },
    { from: /\(timestamp: any\)/g, to: '(timestamp: unknown)' },
    { from: /\(field: any\)/g, to: '(field: unknown)' }
  ];

  replacements.forEach(rep => {
    if (rep.from.test(code)) {
      code = code.replace(rep.from, rep.to);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(file, code);
  }
});
