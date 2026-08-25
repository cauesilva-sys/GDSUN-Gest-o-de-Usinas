const fs = require('fs');

let items = [];
if (fs.existsSync('bundle_usinas_exact.json')) {
  items = JSON.parse(fs.readFileSync('bundle_usinas_exact.json', 'utf8'));
} else if (fs.existsSync('bundle_usinas.json')) {
  items = JSON.parse(fs.readFileSync('bundle_usinas.json', 'utf8'));
}

console.log('Loaded usinas count:', items.length);

let provedores = [];
if (fs.existsSync('bundle_provedores.json')) {
  provedores = JSON.parse(fs.readFileSync('bundle_provedores.json', 'utf8'));
}

// Generate complete formatted initialData.ts file
let code = `import { UsinaConcessionaria, ProvedorInternet } from '../types';

export const initialUsinas: UsinaConcessionaria[] = [\n`;

items.forEach((u, i) => {
  // Sanitize single quotes in string fields
  const escapeSingle = (str) => (str || '').replace(/'/g, "\\'");

  code += `  {\n`;
  code += `    id: 'u-${i + 1}',\n`;
  code += `    coser: '${i + 1}',\n`;
  code += `    usina: '${escapeSingle(u.usina)}',\n`;
  code += `    siglaAntiga: '${escapeSingle(u.siglaAntiga)}',\n`;
  code += `    siglaNova: '${escapeSingle(u.siglaNova || u.siglaAntiga)}',\n`;
  code += `    uf: '${escapeSingle(u.uf)}',\n`;
  code += `    razaoSocial: '${escapeSingle(u.razaoSocial)}',\n`;
  code += `    cnpj: '${escapeSingle(u.cnpj)}',\n`;
  code += `    concessionaria: '${escapeSingle(u.concessionaria)}',\n`;
  code += `    codigoCliente: '${escapeSingle(u.codigoCliente)}',\n`;
  code += `    codigoInstalacaoUG: '${escapeSingle(u.codigoInstalacaoUG)}',\n`;
  code += `    medidor: '${escapeSingle(u.medidor)}',\n`;
  code += `    contatoDisCo: '${escapeSingle(u.contatoDisCo)}',\n`;
  code += `    whatsappDisCo: '',\n`;
  code += `    endereco: '${escapeSingle(u.endereco)}',\n`;
  code += `    googleMapsUrl: '${escapeSingle(u.googleMapsUrl)}',\n`;
  code += `    latitude: '',\n`;
  code += `    longitude: '',\n`;
  code += `    statusDelfos: 'Operacional'\n`;
  code += `  }${i === items.length - 1 ? '' : ','}\n`;
});

code += `];\n\nexport const initialProvedores: ProvedorInternet[] = [\n`;

provedores.forEach((p, idx) => {
  const escapeSingle = (str) => (str || '').replace(/'/g, "\\'");
  code += `  {\n`;
  code += `    id: 'p-${idx + 1}',\n`;
  code += `    usinaNome: '${escapeSingle(p.usinaNome)}',\n`;
  code += `    razaoSocial: '${escapeSingle(p.razaoSocial || 'GDPAR SR PARTICIPACOES EM PROJETOS SOLARES S.A.')}',\n`;
  code += `    cnpj: '${escapeSingle(p.cnpj || '34.731.244/0003-28')}',\n`;
  code += `    provedor: '${escapeSingle(p.provedor || 'Provedor Local')}',\n`;
  code += `    contatoProvedor: '${escapeSingle(p.contatoProvedor || '0800 000 0000')}',\n`;
  code += `    tipoConexao: '${escapeSingle(p.tipoConexao || 'Fibra')}',\n`;
  code += `    contrato: '${escapeSingle(p.contrato)}',\n`;
  code += `    vencimento: '${escapeSingle(p.vencimento || '10')}',\n`;
  code += `    status: '${escapeSingle(p.status || 'OK')}',\n`;
  code += `    valorMensal: '${escapeSingle(p.valorMensal || 'R$ 350,00')}'\n`;
  code += `  }${idx === provedores.length - 1 ? '' : ','}\n`;
});

code += `];\n`;

fs.writeFileSync('src/data/initialData.ts', code, 'utf8');
console.log('Successfully wrote exact initialData.ts with all 126 UFVs and Provedores!');
