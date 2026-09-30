import fs from 'fs';
import { initialUsinas, initialProvedores } from '../src/data/initialData';

const exact = JSON.parse(fs.readFileSync('bundle_usinas_exact.json', 'utf8'));

function normalize(s: string) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

// Fix known anomalies in bundle_usinas_exact
function fixExactItem(u: any) {
  const item = { ...u };
  const name = item.usina?.toLowerCase() || '';

  if (name.includes('araçuaí') || name.includes('aracuai')) {
    item.razaoSocial = 'CLARO NXT TELECOMUNICACOES S A';
    item.cnpj = '66.970.252/0001-04';
  } else if (name.includes('pindamonhangaba')) {
    item.cnpj = '61.585.865/1250-19';
  } else if (name.includes('estância') || name.includes('estancia')) {
    item.razaoSocial = 'CONSORCIO RZ SP IV';
    item.cnpj = '41.668.273/0001-96';
  } else if (name.includes('epitacio')) {
    item.razaoSocial = 'TIM S.A.';
    item.cnpj = '02.421.421/0001-11';
  } else if (name.includes('são joão do rio do peixe ii') || name.includes('sao joao do rio do peixe ii')) {
    item.razaoSocial = 'CLARO SA';
    item.cnpj = '40.432.544/0081-21';
    item.concessionaria = 'Energisa PB';
    item.codigoCliente = '523952419';
    item.codigoInstalacaoUG = 'W9013797081';
    item.medidor = 'W9013797081';
    item.contatoDisCo = '0800 083 0196';
  } else if (name.includes('luis eduardo magalhães i (magalu)') || name.includes('luis eduardo magalhaes i (magalu)')) {
    item.razaoSocial = 'MAGAZINE LUIZA S.A.';
    item.cnpj = '47.960.950/0001-21';
    item.concessionaria = 'Coelba';
    item.codigoCliente = '7079980433';
    item.codigoInstalacaoUG = '80232438';
    item.medidor = '1230430930';
    item.contatoDisCo = '0800 284 8080';
  } else if (name.includes('luis eduardo magalhães ii (magalu)') || name.includes('luis eduardo magalhaes ii (magalu)')) {
    item.razaoSocial = 'MAGAZINE LUIZA S.A.';
    item.cnpj = '47.960.950/0001-21';
  } else if (name.includes('luis eduardo magalhães iii (raízen)') || name.includes('luis eduardo magalhaes iii (raizen)')) {
    item.razaoSocial = 'RAÍZEN ENERGIA S.A.';
    item.cnpj = '41.668.273/0001-96';
  }

  return item;
}

const fixedExact = exact.map(fixExactItem);

const exactByName = new Map<string, any>();
fixedExact.forEach((u: any, idx: number) => {
  exactByName.set(normalize(u.usina), u);
  exactByName.set(String(idx + 1), u);
});

const updatedUsinas = initialUsinas.map((u, i) => {
  const ex = exactByName.get(normalize(u.usina)) || exactByName.get(String(i + 1));
  if (ex) {
    return {
      ...u,
      razaoSocial: ex.razaoSocial || u.razaoSocial,
      cnpj: ex.cnpj || u.cnpj,
      // If concessionaria or codigos were missing or fixed
      concessionaria: ex.concessionaria || u.concessionaria,
      codigoCliente: u.codigoCliente || ex.codigoCliente || '',
      codigoInstalacaoUG: u.codigoInstalacaoUG || ex.codigoInstalacaoUG || '',
      medidor: u.medidor || ex.medidor || '',
    };
  }
  return u;
});

console.log('Sample updated:');
for (let i = 0; i < 10; i++) {
  console.log(`${i + 1}: ${updatedUsinas[i].usina} -> Razao: ${updatedUsinas[i].razaoSocial} | CNPJ: ${updatedUsinas[i].cnpj}`);
}

// Generate new initialData.ts content
const fileContent = `import { UsinaConcessionaria, ProvedorInternet } from '../types';

export const initialUsinas: UsinaConcessionaria[] = ${JSON.stringify(updatedUsinas, null, 2)};

export const initialProvedores: ProvedorInternet[] = ${JSON.stringify(initialProvedores, null, 2)};
`;

fs.writeFileSync('src/data/initialData.ts', fileContent, 'utf8');
console.log('Successfully updated src/data/initialData.ts!');
