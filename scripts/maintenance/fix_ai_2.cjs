const fs = require('fs');

// AIVoiceAssistant
let code = fs.readFileSync('src/screens/components/AIVoiceAssistant.tsx', 'utf8');

code = code.replace(/function parseToDate\(val: unknown\): Date \| null \{([^}]+)\}/g, `function parseToDate(val: unknown): Date | null {
  if (!val) return null;
  if (typeof val === 'object' && val !== null) {
    if ('toDate' in val && typeof (val as any).toDate === 'function') return (val as any).toDate();
    if ('seconds' in val && typeof (val as any).seconds === 'number') return new Date((val as any).seconds * 1000);
    if ('_seconds' in val && typeof (val as any)._seconds === 'number') return new Date((val as any)._seconds * 1000);
  }
  if (val instanceof Date) return val;
  if (typeof val === 'string' || typeof val === 'number') return new Date(val);
  return null;
}`);

code = code.replace(/const AudioCtxClass = window\.AudioContext \|\| \(window as unknown as \{ webkitAudioContext: unknown \}\)\.webkitAudioContext;/g, 'const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;');

fs.writeFileSync('src/screens/components/AIVoiceAssistant.tsx', code);

// UnitSelectors
let unitCode = fs.readFileSync('src/screens/components/UnitSelectors.tsx', 'utf8');
unitCode = unitCode.replace(/c\.name/g, '(c as { name: string }).name');
unitCode = unitCode.replace(/u\.name/g, '(u as { name: string }).name');
fs.writeFileSync('src/screens/components/UnitSelectors.tsx', unitCode);

