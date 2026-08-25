import Papa from 'papaparse';
import { UsinaConcessionaria, ProvedorInternet } from '../types';

/**
 * Normalizes object key strings from CSV headers
 */
function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Parses raw CSV content for Usinas / Concessionarias
 */
export function parseUsinasCsv(csvText: string): UsinaConcessionaria[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
  });

  const parsedUsinas: UsinaConcessionaria[] = [];

  result.data.forEach((row, index) => {
    // Map normalized keys to object fields
    const normalizedRow: Record<string, string> = {};
    Object.keys(row).forEach((k) => {
      if (k) {
        normalizedRow[normalizeKey(k)] = row[k] ? String(row[k]).trim() : '';
      }
    });

    const usinaName =
      normalizedRow['usina'] ||
      normalizedRow['nomeusina'] ||
      normalizedRow['nomedausina'] ||
      normalizedRow['nome'] ||
      normalizedRow['planta'] ||
      normalizedRow['nomedaplanta'] ||
      normalizedRow['ufv'] ||
      normalizedRow['nomedaufv'] ||
      normalizedRow['empreendimento'] ||
      normalizedRow['ativo'] ||
      normalizedRow['unidade'] ||
      normalizedRow['usinaconcessionaria'] ||
      normalizedRow['usinas'] ||
      (normalizedRow['coser'] ? `Usina COSER ${normalizedRow['coser']}` : '');

    if (!usinaName || usinaName.toLowerCase().startsWith('legenda') || usinaName.toLowerCase().startsWith('total')) return;

    const gestoresEmail =
      normalizedRow['emailgestores'] ||
      normalizedRow['emaildoagentederelacionamento'] ||
      normalizedRow['emailagente'] ||
      normalizedRow['emailgestor'] ||
      normalizedRow['emailrelacionamento'] ||
      '';

    const contatoBase =
      normalizedRow['contatodisco'] ||
      normalizedRow['contato'] ||
      normalizedRow['telefone'] ||
      normalizedRow['contatoconcessionaria'] ||
      '';

    let finalContato = contatoBase;
    if (gestoresEmail && gestoresEmail !== '#N/A') {
      if (contatoBase && !contatoBase.toLowerCase().includes(gestoresEmail.toLowerCase())) {
        finalContato = `${gestoresEmail} / ${contatoBase}`;
      } else {
        finalContato = gestoresEmail;
      }
    }

    const coserVal = normalizedRow['coser'] || normalizedRow['id'] || normalizedRow['num'] || String(index + 1);

    parsedUsinas.push({
      id: `u-imported-${index + 1}`,
      coser: coserVal,
      usina: usinaName,
      siglaAntiga: normalizedRow['siglaufvantiga'] || normalizedRow['siglaantiga'] || normalizedRow['siglaufv'] || normalizedRow['sigla'] || '',
      siglaNova: normalizedRow['siglaufvnova'] || normalizedRow['siglanova'] || '',
      uf: normalizedRow['uf'] || normalizedRow['estado'] || normalizedRow['ufestado'] || '',
      razaoSocial: normalizedRow['razaosocialcliente'] || normalizedRow['razaosocial'] || normalizedRow['razaosocialempresa'] || normalizedRow['empresa'] || normalizedRow['titular'] || '',
      cnpj: normalizedRow['cnpjcliente'] || normalizedRow['cnpj'] || normalizedRow['cnpjdaempresa'] || '',
      concessionaria: normalizedRow['disco'] || normalizedRow['concessionaria'] || normalizedRow['distribuidora'] || normalizedRow['concessionariaenergia'] || '',
      codigoCliente: normalizedRow['codigocliente'] || normalizedRow['codcliente'] || normalizedRow['numcliente'] || normalizedRow['cc'] || normalizedRow['conta'] || '',
      codigoInstalacaoUG: normalizedRow['codigodainstalacaoug'] || normalizedRow['codigoinstalacao'] || normalizedRow['instalacao'] || normalizedRow['uc'] || normalizedRow['codigouc'] || normalizedRow['ug'] || '',
      medidor: normalizedRow['medidor'] || normalizedRow['numeromedidor'] || normalizedRow['nmedidor'] || normalizedRow['nomemedidor'] || normalizedRow['medidordisco'] || normalizedRow['medidorug'] || normalizedRow['nummedidor'] || '',
      contatoDisCo: finalContato,
      whatsappDisCo: normalizedRow['whatsappdisco'] || normalizedRow['whatsapp'] || normalizedRow['whats'] || '',
      endereco: normalizedRow['enderecodafatura'] || normalizedRow['enderecofatura'] || normalizedRow['endereco'] || normalizedRow['localizacao'] || normalizedRow['logradouro'] || '',
      googleMapsUrl: normalizedRow['localizacaogooglemaps'] || normalizedRow['maps'] || normalizedRow['googlemaps'] || normalizedRow['linkmaps'] || '',
      latitude: normalizedRow['latitude'] || normalizedRow['lat'] || '',
      longitude: normalizedRow['longitude'] || normalizedRow['long'] || normalizedRow['lng'] || '',
      statusDelfos: normalizedRow['statusdelfos'] || normalizedRow['status'] || normalizedRow['situacao'] || 'Operacional',
    });
  });

  return parsedUsinas;
}

/**
 * Parses raw CSV content for Provedores de Internet
 */
export function parseProvedoresCsv(csvText: string): ProvedorInternet[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const parsedProvedores: ProvedorInternet[] = [];

  result.data.forEach((row, index) => {
    const normalizedRow: Record<string, string> = {};
    Object.keys(row).forEach((k) => {
      normalizedRow[normalizeKey(k)] = row[k] ? row[k].trim() : '';
    });

    const usinaNome = normalizedRow['usina'] || normalizedRow['nomeusina'] || '';
    if (!usinaNome) return;

    parsedProvedores.push({
      id: `p-imported-${index}`,
      usinaNome,
      razaoSocial: normalizedRow['razaosocial'] || '',
      cnpj: normalizedRow['cnpj'] || '',
      provedor: normalizedRow['provedor'] || normalizedRow['nomeprovedor'] || '',
      contatoProvedor: normalizedRow['contatoprovedor'] || normalizedRow['contato'] || normalizedRow['telefone'] || '',
      tipoConexao: normalizedRow['tipo'] || normalizedRow['tipoconexao'] || 'Fibra',
      contrato: normalizedRow['contrato'] || '',
      vencimento: normalizedRow['vencimento'] || '',
      status: normalizedRow['status'] || 'OK',
      valorMensal: normalizedRow['valormensal'] || normalizedRow['valor'] || 'R$ 0,00',
    });
  });

  return parsedProvedores;
}

/**
 * Converts a Google Sheets URL into a direct CSV download export URL
 */
export function formatGoogleSheetsExportUrl(url: string, gid: string = '0'): string {
  if (!url) return '';
  let cleanUrl = url.trim();

  // If already a published CSV
  if (cleanUrl.includes('pub?output=csv') || cleanUrl.includes('format=csv')) {
    return cleanUrl;
  }

  // Extract sheet ID from standard google sheet URL (e.g. https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=0)
  const matches = cleanUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (matches && matches[1]) {
    const spreadsheetId = matches[1];
    
    // Extract GID if present
    const gidMatch = cleanUrl.match(/gid=([0-9]+)/);
    const actualGid = gidMatch ? gidMatch[1] : gid;

    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${actualGid}`;
  }

  return cleanUrl;
}
