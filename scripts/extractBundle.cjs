const fs = require('fs');
const bundle = fs.readFileSync('dist/assets/index-Byt-cslX.js', 'utf8');

// Find all occurrences of objects with coser or usina
let startPos = bundle.indexOf('coser:"1"');
if (startPos === -1) {
  startPos = bundle.indexOf('coser:');
}
console.log('startPos:', startPos);

// Let's find array boundaries [...] containing coser:"1"
let arrayStart = bundle.lastIndexOf('[', startPos);
let arrayEnd = bundle.indexOf('];', startPos);

console.log('arrayStart:', arrayStart, 'arrayEnd:', arrayEnd);
if (arrayStart !== -1 && arrayEnd !== -1) {
  const arrayStr = bundle.slice(arrayStart, arrayEnd + 1);
  console.log('Array length in bundle:', arrayStr.length);
  fs.writeFileSync('extracted_usinas_bundle.json', arrayStr);
}

// Search for provedores in bundle
let provPos = bundle.indexOf('usinaNome:');
console.log('provPos:', provPos);
if (provPos !== -1) {
  let pStart = bundle.lastIndexOf('[', provPos);
  let pEnd = bundle.indexOf('];', provPos);
  console.log('pStart:', pStart, 'pEnd:', pEnd);
  if (pStart !== -1 && pEnd !== -1) {
    const pStr = bundle.slice(pStart, pEnd + 1);
    console.log('Provedores array length in bundle:', pStr.length);
    fs.writeFileSync('extracted_provedores_bundle.json', pStr);
  }
}
