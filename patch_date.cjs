const fs = require('fs');
let code = fs.readFileSync('src/screens/Forms.tsx', 'utf8');
code = code.replace(
  /const formatResponseDate = \(field: unknown\) => \{[^}]+\}/,
  `const formatResponseDate = (field: unknown) => {
    if (!field) return 'Reciente';
    let dateObj: Date;
    if (typeof field === 'object' && field !== null && 'toDate' in field && typeof (field as any).toDate === 'function') {
      dateObj = (field as { toDate: () => Date }).toDate();
    } else if (field instanceof Date) {
      dateObj = field;
    } else if (typeof field === 'object' && field !== null && 'seconds' in field) {
      dateObj = new Timestamp((field as any).seconds, (field as any).nanoseconds || 0).toDate();
    } else {
      dateObj = new Date(field as string | number);
    }
    return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }`
);
fs.writeFileSync('src/screens/Forms.tsx', code);
