import Papa from 'papaparse';
import { UsinaConcessionaria, ProvedorInternet } from '../types';
import { getProvedorMasterInfo } from './provedoresMasterData';

function normalizeKey(key: string): string {
  if (!key) return '';
  return String(key)
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export function parseUsinasCsv(csvText: string): UsinaConcessionaria[] {
  try {
    const resultRaw = Papa.parse<string[]>(csvText, {
      header: false,
      skipEmptyLines: 'greedy',
    });

    const rawRows = resultRaw.data || [];
    if (rawRows.length < 2) return [];

    const headers = (rawRows[0] || []).map((h) => normalizeKey(String(h || '')));
    const usinas: UsinaConcessionaria[] = [];

    for (let i = 1; i < rawRows.length; i++) {
      const cols = rawRows[i];
      if (!cols || cols.length < 2 || !cols[1]) continue;

      const getVal = (colIdx: number, ...searchTerms: string[]): string => {
        for (const term of searchTerms) {
          const foundIdx = headers.findIndex((h) => h.includes(term));
          if (foundIdx !== -1 && cols[foundIdx] !== undefined && String(cols[foundIdx]).trim() !== '') {
            return String(cols[foundIdx]).trim();
          }
        }
        return cols[colIdx] ? String(cols[colIdx]).trim() : '';
      };

      const nomeUsina = getVal(1, 'usina', 'nome') || `Usina ${i}`;
      if (nomeUsina.toLowerCase() === 'usina') continue;

      const sigla = getVal(3, 'siglanova', 'siglaantiga', 'sigla') || cols[2] || '';
      const uf = getVal(4, 'uf', 'estado') || '';
      const concessionaria = getVal(5, 'concessionaria', 'disco', 'distribuidora') || 'Não informada';
      const codigoCliente = getVal(6, 'codigocliente', 'codcliente', 'cliente') || 'N/A';
      const instalacaoAntiga = getVal(7, 'instalacaoantiga', 'antiga', 'ug') || 'N/A';
      const instalacaoNova = getVal(8, 'instalacaonova', 'nova') || 'N/A';
      const medidor = getVal(9, 'medidor') || 'N/A';
      const razaoSocial = getVal(10, 'razaosocial', 'titular', 'razao') || 'N/A';
      const cnpj = getVal(11, 'cnpj') || 'N/A';

      // Preenche com valores seguros em texto para nunca disparar Cannot read properties of undefined
      const usinaItem: any = {
        id: `usina_${i}`,
        nome: String(nomeUsina || ''),
        usinaNome: String(nomeUsina || ''),
        sigla: String(sigla || ''),
        siglaAntiga: String(cols[2] || sigla || ''),
        siglaNova: String(sigla || ''),
        uf: String(uf || ''),
        concessionaria: String(concessionaria || 'Não informada'),
        disco: String(concessionaria || 'Não informada'),
        distribuidora: String(concessionaria || 'Não informada'),
        codigoCliente: String(codigoCliente || 'N/A'),
        instalacaoAntiga: String(instalacaoAntiga || 'N/A'),
        instalacaoNova: String(instalacaoNova || 'N/A'),
        medidor: String(medidor || 'N/A'),
        razaoSocial: String(razaoSocial || 'N/A'),
        cnpj: String(cnpj || 'N/A'),
        endereco: 'Endereço não informado',
        pontoReferencia: '',
        nomeAgente: 'Clientes Corporativos',
        emailAgente: '',
        telefoneAgente: '',
        status: 'Ativa',
        tipoConexao: 'Fibra',
        provedor: 'Pendente',
      };

      usinas.push(usinaItem as UsinaConcessionaria);
    }

    return usinas;
  } catch (err) {
    console.error('Erro no parser de usinas:', err);
    return [];
  }
}

export function parseProvedoresCsv(
  csvText: string,
  prevProvedores: ProvedorInternet[],
  usinas: UsinaConcessionaria[]
): ProvedorInternet[] {
  try {
    const result = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: 'greedy',
    });

    if (!result.data || result.data.length === 0) return prevProvedores || [];

    return result.data.map((row, index) => {
      const norm: Record<string, string> = {};
      Object.keys(row || {}).forEach((k) => {
        if (k) norm[normalizeKey(k)] = row[k] ? String(row[k]).trim() : '';
      });

      const nome = norm['usina'] || norm['nome'] || `Usina ${index + 1}`;
      const master = getProvedorMasterInfo ? getProvedorMasterInfo(nome) : {} as any;

      return {
        id: `provedor_${index + 1}`,
        usinaNome: String(nome || ''),
        provedor: String(norm['provedor'] || master?.provedorPadrao || 'Provedor Local'),
        tipoConexao: String(norm['tipoconexao'] || master?.tipoConexao || 'Fibra'),
        contatoProvedor: String(norm['contatoprovedor'] || norm['contato'] || 'Pendente'),
        razaoSocial: String(norm['razaosocial'] || master?.razaoSocial || 'Pendente'),
        cnpj: String(norm['cnpj'] || master?.cnpj || 'Pendente'),
      } as unknown as ProvedorInternet;
    });
  } catch (err) {
    console.error('Erro no parser de provedores:', err);
    return prevProvedores || [];
  }
}

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

export function mergeReclamacoesDistribuidorasCsv(csvText: string, currentUsinas: UsinaConcessionaria[]) {
  return {
    matchedCount: 0,
    unmatchedRows: 0,
    updatedUsinas: currentUsinas,
  };
}
