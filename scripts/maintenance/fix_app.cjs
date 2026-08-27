const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/\(this as React\.Component\)\.setState/g, '(this as React.Component<{ children: ReactNode }, { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }>).setState');
code = code.replace(/\(this as React\.Component\)\.props/g, '(this as React.Component<{ children: ReactNode }, { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }>).props');

fs.writeFileSync('src/App.tsx', code);
