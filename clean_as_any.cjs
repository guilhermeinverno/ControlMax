const fs = require('fs');

function replaceFile(path, from, to) {
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(from, to);
  fs.writeFileSync(path, code);
}

replaceFile('src/screens/components/AIVoiceAssistant.tsx', /\(val as any\)/g, '(val as Record<string, unknown>)');
replaceFile('src/screens/DeviceList.tsx', /\(ts as any\)/g, '(ts as Record<string, unknown>)');
replaceFile('src/screens/Finance.tsx', /\(field as any\)/g, '(field as Record<string, unknown>)');
replaceFile('src/screens/Statistics.tsx', /\(ts as any\)/g, '(ts as Record<string, unknown>)');
replaceFile('src/App.tsx', /errorInfo: null as any/g, 'errorInfo: null as unknown');
replaceFile('src/App.tsx', /\(this as any\)\.setState/g, 'this.setState');
replaceFile('src/App.tsx', /\(this as any\)\.props/g, 'this.props');

