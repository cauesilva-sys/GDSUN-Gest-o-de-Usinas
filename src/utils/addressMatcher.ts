import { UsinaConcessionaria } from '../types';

/**
 * Normalizes an usina name by removing numerical prefixes (001-, 103-),
 * state suffixes (-SP, -BA, -CE), Roman numerals (I, II, III, UFV 01),
 * parentheses with extra info, and special chars for soft matching.
 */
export function normalizeUsinaName(rawName: string): string {
  if (!rawName) return '';

  return rawName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/^\d+[\s-–]*/, '') // remove leading numbers like "001-", "103 - "
    .replace(/\s*-\s*[a-z]{2}\b/gi, '') // remove state sufixes like "-sp", "-ba"
    .replace(/\b(ufv|\d+|i|ii|iii|iv|v|vi|vii|viii|ix|x)\b/g, '') // remove UFV or numerals
    .replace(/\(.*\)/g, '') // remove contents in parentheses
    .replace(/[^a-z0-9\s]/g, ' ') // remove special characters
    .replace(/\s+/g, ' ') // trim extra spaces
    .trim();
}

export interface MatchResult {
  endereco: string;
  uf: string;
  googleMapsUrl?: string;
  usinaMatchedName?: string;
}

/**
 * Finds the corresponding address from the list of Usinas (Informações Gerais)
 */
export function findAddressForProvedorUsina(
  provedorUsinaName: string,
  usinasList: UsinaConcessionaria[]
): MatchResult {
  const normTarget = normalizeUsinaName(provedorUsinaName);

  if (!normTarget || usinasList.length === 0) {
    return { endereco: 'Endereço não localizado', uf: '-' };
  }

  // 1. Direct match on normalized name
  let bestMatch: UsinaConcessionaria | undefined = usinasList.find((u) => {
    const normU = normalizeUsinaName(u.usina);
    return normU === normTarget || normU.includes(normTarget) || normTarget.includes(normU);
  });

  // 2. Keyword tokens match
  if (!bestMatch) {
    const targetTokens = normTarget.split(' ').filter((t) => t.length > 2);
    
    let maxScore = 0;
    for (const u of usinasList) {
      const uNorm = normalizeUsinaName(u.usina);
      const uTokens = uNorm.split(' ').filter((t) => t.length > 2);
      
      let matchedCount = 0;
      for (const token of targetTokens) {
        if (uTokens.some((ut) => ut.includes(token) || token.includes(ut))) {
          matchedCount++;
        }
      }

      if (matchedCount > maxScore) {
        maxScore = matchedCount;
        bestMatch = u;
      }
    }
  }

  if (bestMatch && bestMatch.endereco) {
    return {
      endereco: bestMatch.endereco,
      uf: bestMatch.uf,
      googleMapsUrl: bestMatch.googleMapsUrl,
      usinaMatchedName: bestMatch.usina,
    };
  }

  return {
    endereco: 'Endereço pendente de cadastro na base',
    uf: '-',
  };
}
