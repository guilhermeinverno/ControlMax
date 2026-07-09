const fs = require('fs');
let code = fs.readFileSync('src/screens/components/AIVoiceAssistant.tsx', 'utf8');

code = code.replace(/function parseToDate\(val: Record<string, unknown>\): Date \| null {/g, 'function parseToDate(val: unknown): Date | null {');
code = code.replace(/const data = doc\.data\(\) as Record<string, unknown>;/g, 'const data = doc.data() as Record<string, unknown>;');
code = code.replace(/\(window as Record<string, unknown>\)\.webkitAudioContext/g, '(window as unknown as { webkitAudioContext: any }).webkitAudioContext');

// For reduce
code = code.replace(/col: Record<string, unknown>\) => sum \+ \(col\.amount \|\| 0\)/g, 'col: Record<string, unknown>) => sum + ((col.amount as number) || 0)');
code = code.replace(/s: Record<string, unknown>\) => sum \+ \(s\.totalAmount \|\| s\.amount \|\| 0\)/g, 's: Record<string, unknown>) => sum + ((s.totalAmount as number) || (s.amount as number) || 0)');

fs.writeFileSync('src/screens/components/AIVoiceAssistant.tsx', code);
