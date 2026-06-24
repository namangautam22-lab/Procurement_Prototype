// Compiles app.jsx and inlines the result into index.html.
// Replaces the <script id="app-script">...</script> block specifically
// so we don't accidentally eat other scripts.
// Usage: node build.js
const Babel = require('/tmp/node_modules/@babel/standalone');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const jsx = fs.readFileSync(path.join(root, 'app.jsx'), 'utf8');

const out = Babel.transform(jsx, { presets: [['react', { runtime: 'classic' }]] });
if (/\bimport\s/.test(out.code) || /\bexport\s/.test(out.code)) {
  console.error('compiled output has import/export — abort');
  process.exit(1);
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const re = /<script id="app-script">[\s\S]*?<\/script>/;
if (!re.test(html)) {
  console.error('marker <script id="app-script"> not found in index.html');
  process.exit(1);
}
const newScript = '<script id="app-script">\n' + out.code + '\n</script>';
const newHtml = html.replace(re, newScript);

fs.writeFileSync(path.join(root, 'index.html'), newHtml);
console.log('OK · compiled', out.code.length, 'chars · index.html updated');
