const fs = require('fs');

// CompanyList.tsx
let company = fs.readFileSync('src/screens/CompanyList.tsx', 'utf8');
company = company.replace(/clientId \? doc\(db, 'customers', params\.clientId\)/g, "clientId ? doc(db, 'customers', String(params.clientId))");
fs.writeFileSync('src/screens/CompanyList.tsx', company);

// Summary.tsx
let summary = fs.readFileSync('src/screens/Summary.tsx', 'utf8');
summary = summary.replace(/const handleSnapshot = \(snapshot: unknown\) => {/g, 'const handleSnapshot = (snapshot: import("firebase/firestore").QuerySnapshot<import("firebase/firestore").DocumentData>) => {');
summary = summary.replace(/doc: \{ data: \(\) => Record<string, unknown> \}/g, 'doc');
fs.writeFileSync('src/screens/Summary.tsx', summary);

