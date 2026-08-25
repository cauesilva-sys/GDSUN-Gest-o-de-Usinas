const fs = require('fs');
const bundle = fs.readFileSync('dist/assets/index-Byt-cslX.js', 'utf8');

const uMatch = bundle.match(/os=\[(\{id:"u-1"[^\]]+\})\]/);
if (uMatch) {
  console.log('Found usinas array in bundle!');
  const uArrStr = '[' + uMatch[1] + ']';
  try {
    const usinas = eval(uArrStr);
    console.log('Extracted usinas count:', usinas.length);
    fs.writeFileSync('bundle_usinas.json', JSON.stringify(usinas, null, 2));
  } catch (e) {
    console.error('Error evaluating usinas:', e.message);
  }
} else {
  console.log('uMatch not found with exact regex');
}

const pMatch = bundle.match(/cs=\[(\{id:"p-1"[^\]]+\})\]/);
if (pMatch) {
  console.log('Found provedores array in bundle!');
  const pArrStr = '[' + pMatch[1] + ']';
  try {
    const provedores = eval(pArrStr);
    console.log('Extracted provedores count:', provedores.length);
    fs.writeFileSync('bundle_provedores.json', JSON.stringify(provedores, null, 2));
  } catch (e) {
    console.error('Error evaluating provedores:', e.message);
  }
} else {
  console.log('pMatch not found with exact regex');
}
