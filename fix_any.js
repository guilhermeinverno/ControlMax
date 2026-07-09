const fs = require('fs');
const glob = require('glob');
const path = require('path');

const files = glob.sync('src/screens/**/*.tsx');
files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace field: any with field: Timestamp | null
  const typeReplacements = [
    { from: /createdAt\??: any;/g, to: 'createdAt?: any; // FIXED_BY_SCRIPT' },
    { from: /lastSync\??: any;/g, to: 'lastSync?: any; // FIXED_BY_SCRIPT' },
    { from: /updatedAt\??: any;/g, to: 'updatedAt?: any; // FIXED_BY_SCRIPT' },
    { from: /linkedAt\??: any;/g, to: 'linkedAt?: any; // FIXED_BY_SCRIPT' },
    { from: /confirmedAt\??: any;/g, to: 'confirmedAt?: any; // FIXED_BY_SCRIPT' },
    { from: /approvedAt\??: any;/g, to: 'approvedAt?: any; // FIXED_BY_SCRIPT' }
  ];

  typeReplacements.forEach(rep => {
    if (rep.from.test(code)) {
      code = code.replace(rep.from, rep.to);
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(file, code);
  }
});
