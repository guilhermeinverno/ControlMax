const fs = require('fs');

function replaceFile(path, from, to) {
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(from, to);
  fs.writeFileSync(path, code);
}

// App.tsx
replaceFile('src/App.tsx', /this\.setState/g, '(this as React.Component).setState');
replaceFile('src/App.tsx', /this\.props/g, '(this as React.Component).props');
replaceFile('src/App.tsx', /\(this as React\.Component as React\.Component\)/g, '(this as React.Component)'); // just in case

// Finance.tsx
let fin = fs.readFileSync('src/screens/Finance.tsx', 'utf8');
fin = fin.replace(/\(field as Record<string, unknown>\)\.toDate\(\)/g, '(field as { toDate: () => Date }).toDate()');
fin = fin.replace(/\(field as Record<string, unknown>\)\.nanoseconds/g, '(field as { nanoseconds?: number }).nanoseconds');
fin = fin.replace(/new Date\(field as Record<string, unknown>\)/g, 'new Date(field as string | number)');
fs.writeFileSync('src/screens/Finance.tsx', fin);

// Statistics.tsx
let stat = fs.readFileSync('src/screens/Statistics.tsx', 'utf8');
stat = stat.replace(/\(ts as Record<string, unknown>\)\.toDate\(\)/g, '(ts as { toDate: () => Date }).toDate()');
stat = stat.replace(/new Date\(ts as Record<string, unknown>\)/g, 'new Date(ts as string | number)');
fs.writeFileSync('src/screens/Statistics.tsx', stat);

// AIVoiceAssistant.tsx
let ai = fs.readFileSync('src/screens/components/AIVoiceAssistant.tsx', 'utf8');
ai = ai.replace(/\(val as Record<string, unknown>\)\.toDate\(\)/g, '(val as { toDate: () => Date }).toDate()');
ai = ai.replace(/\(val as Record<string, unknown>\)\.seconds \* 1000/g, '(val as { seconds: number }).seconds * 1000');
ai = ai.replace(/\(val as Record<string, unknown>\)\._seconds \* 1000/g, '(val as { _seconds: number })._seconds * 1000');
fs.writeFileSync('src/screens/components/AIVoiceAssistant.tsx', ai);

