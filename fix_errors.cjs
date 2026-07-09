const fs = require('fs');

function replaceFile(path, from, to) {
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(from, to);
  fs.writeFileSync(path, code);
}

replaceFile('src/screens/BCApprovals.tsx', /const dateObj = new Timestamp\(timestamp\.seconds\, timestamp\.nanoseconds \|\| 0\)\.toDate\(\);/, 'const dateObj = new Timestamp((timestamp as any).seconds, (timestamp as any).nanoseconds || 0).toDate();');

replaceFile('src/screens/NewExpense.tsx', /const dateObj = new Timestamp\(timestamp\.seconds\, timestamp\.nanoseconds \|\| 0\)\.toDate\(\);/, 'const dateObj = new Timestamp((timestamp as any).seconds, (timestamp as any).nanoseconds || 0).toDate();');

replaceFile('src/screens/NewIncome.tsx', /const dateObj = new Timestamp\(timestamp\.seconds\, timestamp\.nanoseconds \|\| 0\)\.toDate\(\);/, 'const dateObj = new Timestamp((timestamp as any).seconds, (timestamp as any).nanoseconds || 0).toDate();');

// For error.message:
const filesToFixError = [
  'src/screens/BoxSummary.tsx',
  'src/screens/CreditRequests.tsx',
  'src/screens/Insurance.tsx',
  'src/screens/OpenBox.tsx',
];

filesToFixError.forEach(f => {
  let code = fs.readFileSync(f, 'utf8');
  code = code.replace(/err\.message/g, '(err instanceof Error ? err.message : String(err))');
  code = code.replace(/error\.message/g, '(error instanceof Error ? error.message : String(error))');
  fs.writeFileSync(f, code);
});

// Finance.tsx
let fin = fs.readFileSync('src/screens/Finance.tsx', 'utf8');
fin = fin.replace(/typeof field\.toDate === 'function'/g, 'typeof field === "object" && field !== null && "toDate" in field && typeof (field as any).toDate === "function"');
fin = fin.replace(/field\.toDate\(\)/g, '(field as any).toDate()');
fin = fin.replace(/field\.seconds/g, '(field as any).seconds');
fin = fin.replace(/field\.nanoseconds/g, '(field as any).nanoseconds');
fin = fin.replace(/new Date\(field\)/g, 'new Date(field as any)');
fs.writeFileSync('src/screens/Finance.tsx', fin);

// Statistics.tsx
let stat = fs.readFileSync('src/screens/Statistics.tsx', 'utf8');
stat = stat.replace(/typeof ts\.toDate === 'function'/g, 'typeof ts === "object" && ts !== null && "toDate" in ts && typeof (ts as any).toDate === "function"');
stat = stat.replace(/ts\.toDate\(\)/g, '(ts as any).toDate()');
stat = stat.replace(/ts \* 1000/g, '(ts as number) * 1000');
stat = stat.replace(/new Date\(ts\)/g, 'new Date(ts as any)');
fs.writeFileSync('src/screens/Statistics.tsx', stat);
