import * as XLSX from 'xlsx';
import { UsinaConcessionaria, ProvedorInternet } from '../types';
import { findAddressForProvedorUsina } from './addressMatcher';
import { getProvedorMasterInfo } from './provedoresMasterData';

export function exportUsinasToExcel(usinas: UsinaConcessionaria[], filename = 'Concessionarias_e_Usinas.xlsx') {
  const data = usinas.map((u) => ({
    'COSER': u.coser || '',
    'Usina': u.usina,
    'Sigla Antiga': u.siglaAntiga || '',
    'Sigla Nova': u.siglaNova || '',
    'UF': u.uf,
    'Razão Social': u.razaoSocial,
    'CNPJ': u.cnpj,
    'Concessionária (DisCo)': u.concessionaria,
    'Código Cliente': u.codigoCliente,
    'Código Instalação UG': u.codigoInstalacaoUG,
    'Medidor': u.medidor,
    'Contato DisCo / Responsáveis': u.contatoDisCo,
    'Endereço': u.endereco,
    'Google Maps URL': u.googleMapsUrl || '',
    'Status Delfos': u.statusDelfos || 'Operacional'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 10 },
    { wch: 30 },
    { wch: 14 },
    { wch: 14 },
    { wch: 6 },
    { wch: 45 },
    { wch: 20 },
    { wch: 25 },
    { wch: 18 },
    { wch: 22 },
    { wch: 16 },
    { wch: 45 },
    { wch: 60 },
    { wch: 45 },
    { wch: 15 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Concessionarias e Usinas');
  XLSX.writeFile(workbook, filename);
}

export function exportProvedoresToExcel(provedores: ProvedorInternet[], usinas: UsinaConcessionaria[], filename = 'Provedores_de_Internet.xlsx') {
  const data = provedores.map((p) => {
    const addr = findAddressForProvedorUsina(p.usinaNome, usinas);
    const masterInfo = getProvedorMasterInfo(p.usinaNome, usinas);
    const resolvedRazaoSocial =
      p.razaoSocial && p.razaoSocial.trim() !== '' && p.razaoSocial.toLowerCase() !== 'pendente'
        ? p.razaoSocial
        : masterInfo.razaoSocial || 'Pendente';
    const resolvedCnpj =
      p.cnpj && p.cnpj.trim() !== '' && p.cnpj.toLowerCase() !== 'pendente'
        ? p.cnpj
        : masterInfo.cnpj || 'Pendente';

    return {
      'ID': p.id,
      'Usina': p.usinaNome,
      'Razão Social': resolvedRazaoSocial,
      'CNPJ': resolvedCnpj,
      'Provedor': p.provedor,
      'Contato Provedor': p.contatoProvedor,
      'Tipo de Conexão': p.tipoConexao || masterInfo.tipoConexao || 'Fibra',
      'Contrato': p.contrato || '',
      'Dia Vencimento': p.vencimento,
      'Valor Mensal': p.valorMensal,
      'Status': p.status,
      'Endereço da Usina': addr ? addr.endereco : ''
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 32 },
    { wch: 45 },
    { wch: 20 },
    { wch: 30 },
    { wch: 35 },
    { wch: 15 },
    { wch: 25 },
    { wch: 14 },
    { wch: 15 },
    { wch: 12 },
    { wch: 60 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Provedores de Internet');
  XLSX.writeFile(workbook, filename);
}
