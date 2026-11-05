import Papa from 'papaparse';
import { UsinaConcessionaria, ProvedorInternet } from '../types';
import { getProvedorMasterInfo } from './provedoresMasterData';

/**
 * Normaliza as chaves do cabeçalho CSV
 */
function normalizeKey(key: string): string {
  if (!key) return '';
  return key
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Converte o CSV para a lista de Usinas com tolerância a cabeçalhos e índices de colunas
 */
export function parseUsinasCsv(csvText: string): UsinaConcessionaria[] {
  // 1. Leitura com cabeçalhos de objetos
  const resultObj = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
  });

  // 2. Leitura bruta por matriz de colunas (para fallback posicional)
  const resultRaw = Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: 'greedy',
  });

  const parsedUsinas: UsinaConcessionaria[] = [];
  const rawRows = resultRaw.data || [];

  resultObj.data.forEach((row, index) => {
    // Linha crua correspondente (index + 1 salta a linha do cabeçalho)
    const rawCols = rawRows[index + 1] || [];

    const norm: Record<string, string> = {};
    Object.keys(row || {}).forEach((k) => {
      if (k) {
        norm[normalizeKey(k)] = row[k] ? String(row[k]).trim() : '';
      }
    });

    // Função para pesquisar por múltiplas alternativas de cabeçalho normalizado
    const getVal = (...keys: string[]): string => {
      for (const k of keys) {
        const found = Object.keys(norm).find((nk) => nk.includes(k));
        if (found && norm[found] !== undefined && norm[found] !== '') {
          return norm[found];
        }
      }
      return '';
    };

    // Leitura dos campos: tenta pelos nomes do cabeçalho; se falhar, usa a posição exata da folha
    // Colunas da folha: A=0 (COSER), B=1 (Usina), C=2 (Sigla Antiga), D=3 (Sigla Nova), E=4 (UF), F=5 (Concessionária),
    // G=6 (Cód. Cliente), H=7 (Inst. Antiga), I=8 (Inst. Nova), J=9 (Medidor), K=10 (Razão Social), L=11 (CNPJ)
    const nomeUsina = getVal('usina', 'nome') || rawCols[1] || `Usina ${index + 1}`;
    if (!nomeUsina || nomeUsina.toLowerCase() === 'usina') return;

    const sigla = getVal('siglanova', 'siglaantiga', 'sigla') || rawCols[3] || rawCols[2] || '';
    const uf = getVal('uf', 'estado') || rawCols[4] || '';
    const concessionaria = getVal('concessionaria', 'disco', 'distribuidora') || rawCols[5] || 'Não informada';
    const codigoCliente = getVal('codigocliente', 'codcliente', 'cliente') || rawCols[6] || 'N/A';
    const instalacaoAntiga = getVal('instalacaoantiga', 'antiga', 'ug') || rawCols[7] || 'N/A';
    const instalacaoNova = getVal('instalacaonova', 'nova') || rawCols[8] || 'N/A';
    const medidor = getVal('medidor') || rawCols[9] || 'N/A';
    const razaoSocial = getVal('razaosocial', 'titular', 'razao') || rawCols[10] || 'N/A';
    const cnpj = getVal('cnpj') || rawCols[11] || 'N/A';

    parsedUsinas.push({
      id: `usina_${index + 1}`,
      nome: nomeUsina,
      usinaNome: nomeUsina,
      sigla: sigla,
      uf: uf,
      concessionaria: concessionaria,
      codigoCliente: codigoCliente,
      instalacaoAntiga: instalacaoAntiga,
      instalacaoNova: instalacaoNova,
      medidor: medidor,
      razaoSocial: razaoSocial,
      cnpj: cnpj,
    } as unknown as UsinaConcessionaria);
  });

  return parsedUsinas;
}

/**
 * Converte o CSV para Provedores de Internet
 */
export function parseProvedoresCsv(
  csvText: string,
  prevProvedores: ProvedorInternet[],
  usinas: UsinaConcessionaria[]
): ProvedorInternet[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
  });

  if (!result.data || result.data.length === 0) return prevProvedores;

  return result.data.map((row, index) => {
    const norm: Record<string, string> = {};
    Object.keys(row || {}).forEach((k) => {
      if (k) norm[normalizeKey(k)] = row[k] ? String(row[k]).trim() : '';
    });

    const nome = norm['usina'] || norm['nome'] || `Usina ${index + 1}`;
    const master = getProvedorMasterInfo(nome);

    return {
      id: `provedor_${index + 1}`,
      usinaNome: nome,
      provedor: norm['provedor'] || master.provedorPadrao || 'Provedor Local',
      tipoConexao: norm['tipoconexao'] || master.tipoConexao || 'Fibra',
      contatoProvedor: norm['contatoprovedor'] || norm['contato'] || 'Pendente',
      razaoSocial: norm['razaosocial'] || master.razaoSocial || 'Pendente',
      cnpj: norm['cnpj'] || master.cnpj || 'Pendente',
    } as unknown as ProvedorInternet;
  });
}

/**
 * Formata o URL de exportação direta do Google Sheets para formato CSV
 */
export function formatGoogleSheetsExportUrl(url: string): string {
  if (!url) return '';
  const matchId = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!matchId) return url;
  const sheetId = matchId[1];

  let gid = '0';
  const matchGid = url.match(/gid=([0-9]+)/);
  if (matchGid) {
    gid = matchGid[1];
  }

  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

/**
 * Mescla dados de Reclamações Distribuidoras caso aplicável
 */
export function mergeReclamacoesDistribuidorasCsv(csvText: string, currentUsinas: UsinaConcessionaria[]) {
  return {
    matchedCount: 0,
    unmatchedRows: 0,
    updatedUsinas: currentUsinas,
  };
}
