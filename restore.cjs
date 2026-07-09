const fs = require('fs');
const content = fs.readFileSync('dist/assets/Forms-tcP5kI45.js', 'utf8');

const regex = /jsxDEV\("([^"]+)",\s*\{([^}]*)\},\s*(?:[^,]+,\s*){2,3}\{fileName:"[^"]+",lineNumber:(\d+),columnNumber:(\d+)\}/g;
let match;
const elements = [];
while ((match = regex.exec(content)) !== null) {
  elements.push({
    tag: match[1],
    props: match[2],
    line: parseInt(match[3]),
    col: parseInt(match[4]),
  });
}
elements.sort((a, b) => a.line - b.line || a.col - b.col);
elements.forEach(e => console.log(`${e.line}:${e.col} <${e.tag}>`));
