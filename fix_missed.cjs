const fs = require('fs');

function replaceFile(path, from, to) {
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(from, to);
  fs.writeFileSync(path, code);
}

replaceFile('src/screens/PlatformManagement.tsx', /field: keyof PlatformSettings, value: any/g, 'field: keyof PlatformSettings, value: unknown');
replaceFile('src/screens/CompanyList.tsx', /params\?: any/g, 'params?: Record<string, unknown>');
replaceFile('src/screens/CompanyList.tsx', /u: any/g, 'u: { active?: boolean; id?: string }');
replaceFile('src/screens/CompanyList.tsx', /unit: any/g, 'unit: { id: string; name: string }');
replaceFile('src/screens/Summary.tsx', /snapshot: any/g, 'snapshot: unknown');
replaceFile('src/screens/Summary.tsx', /doc: any/g, 'doc: { data: () => Record<string, unknown> }');
replaceFile('src/screens/NewIncome.tsx', /u: any/g, 'u: { id: string; name: string }');
replaceFile('src/screens/NewIncome.tsx', /docPayload: any/g, 'docPayload: Record<string, unknown>');
replaceFile('src/routes/AppRoutes.tsx', /Component: React\.ComponentType<any>/g, 'Component: React.ComponentType<Record<string, unknown>>');

