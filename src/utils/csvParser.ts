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

export interface ReclamacoesImportResult {
  totalRows: number;
  matchedCount: number;
  unmatchedCount: number;
  updatedUsinas: UsinaConcessionaria[];
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
        // Tenta pelo índice exato da coluna
        if (cols[colIdx] !== undefined && String(cols[colIdx]).trim() !== '') {
          return String(cols[colIdx]).trim();
        }
        // Fallback por termo do cabeçalho
        for (const term of searchTerms) {
          const norm = normalizeKey(term);
          const foundIdx = headers.findIndex((h) => h.includes(norm));
          if (foundIdx !== -1 && cols[foundIdx] !== undefined && String(cols[foundIdx]).trim() !== '') {
            return String(cols[foundIdx]).trim();
          }
        }
        return '';
      };

      // Mapeamento das colunas da folha de cálculo
      const uf = getVal(0, 'uf', 'estado');
      const usina = getVal(1, 'usina', 'nome da usina', 'nome');
      const sigla = getVal(2, 'sigla', 'sigla antiga', 'sigla nova');
      const concessionaria = getVal(3, 'concessionaria', 'disco', 'distribuidora');
      const razaoSocialCliente = getVal(4, 'razao social', 'titular', 'cliente');
      const cnpjCliente = getVal(5, 'cnpj');

      // Colunas especificadas
      const contatoDisCo = getVal(6, 'contato concessionaria', 'telefone concessionaria'); // Coluna G (índice 6)
      const codigoCliente = getVal(7, 'cod cliente', 'codigo cliente');                    // Coluna H (índice 7)
      const instalacaoAntiga = getVal(8, 'instalacao antiga', 'ug antiga');                // Coluna I (índice 8)
      const instalacaoNova = getVal(9, 'instalacao nova', 'ug nova');                      // Coluna J (índice 9)
      const medidor = getVal(10, 'medidor');                                               // Coluna K (índice 10)
      const emailAgente = getVal(15, 'email gestor', 'email agente');                       // Coluna P (índice 15)
      const telAgente = getVal(16, 'contato gestor', 'telefone gestor');                   // Coluna Q (índice 16)
      const endereco = getVal(17, 'endereco', 'logradouro');                                // Coluna R (índice 17)
      const pontoReferencia = getVal(18, 'ponto de referencia', 'referencia');             // Coluna S (índice 18)

      usinas.push({
        id: `usina_${i}`,
        uf,
        usina,
        nome: usina,
        sigla,
        siglaAntiga: sigla,
        siglaNova: sigla,
        concessionaria,
        razaoSocial: razaoSocialCliente,
        razaoSocialCliente,
        cnpj: cnpjCliente,
        cnpjCliente,
        contatoDisCo,
        codigoCliente,
        codigoInstalacaoAntigaUG: instalacaoAntiga,
        codigoInstalacaoNovaUG: instalacaoNova,
        codigoInstalacaoUG: instalacaoNova || instalacaoAntiga,
        medidor,
        emailAgenteRelacionamento: emailAgente,
        telefoneAgenteRelacionamento: telAgente,
        whatsappDisCo: telAgente,
        endereco,
        pontoReferencia,
      } as UsinaConcessionaria);
    }

    return usinas;
  } catch (error) {
    console.error('Erro ao converter CSV de usinas:', error);
    return [];
  }
}

export function mergeReclamacoesDistribuidorasCsv(
  csvText: string,
  currentUsinas: UsinaConcessionaria[]
): ReclamacoesImportResult {
  const parsed = parseUsinasCsv(csvText);
  if (parsed.length === 0) {
    return {
      totalRows: 0,
      matchedCount: 0,
      unmatchedCount: 0,
      updatedUsinas: currentUsinas,
    };
  }

  let matched = 0;
  const updated = currentUsinas.map((u) => {
    const match = parsed.find(
      (p) =>
        (p.usina && u.usina && normalizeKey(p.usina) === normalizeKey(u.usina)) ||
        (p.siglaNova && u.siglaNova && normalizeKey(p.siglaNova) === normalizeKey(u.siglaNova)) ||
        (p.siglaAntiga && u.siglaAntiga && normalizeKey(p.siglaAntiga) === normalizeKey(u.siglaAntiga))
    );

    if (match) {
      matched++;
      return {
        ...u,
        contatoDisCo: match.contatoDisCo || u.contatoDisCo,
        codigoCliente: match.codigoCliente || u.codigoCliente,
        codigoInstalacaoAntigaUG: match.codigoInstalacaoAntigaUG || u.codigoInstalacaoAntigaUG,
        codigoInstalacaoNovaUG: match.codigoInstalacaoNovaUG || u.codigoInstalacaoNovaUG,
        medidor: match.medidor || u.medidor,
        emailAgenteRelacionamento: match.emailAgenteRelacionamento || u.emailAgenteRelacionamento,
        telefoneAgenteRelacionamento: match.telefoneAgenteRelacionamento || u.telefoneAgenteRelacionamento,
        whatsappDisCo: match.whatsappDisCo || u.whatsappDisCo,
        endereco: match.endereco || u.endereco,
        pontoReferencia: match.pontoReferencia || u.pontoReferencia,
      };
    }
    return u;
  });

  return {
    totalRows: parsed.length,
    matchedCount: matched,
    unmatchedCount: parsed.length - matched,
    updatedUsinas: updated,
  };
}
