import Papa from 'papaparse';
import { UsinaConcessionaria, ProvedorInternet } from '../types';
import { getProvedorMasterInfo } from './provedoresMasterData';

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
      normalizedRow['email'] ||
      normalizedRow['emaildisco'] ||
      '';

    const nomeAgente =
      normalizedRow['nomedoagente'] ||
      normalizedRow['agentederelacionamento'] ||
      normalizedRow['agente'] ||
      normalizedRow['gestor'] ||
      normalizedRow['responsavel'] ||
      normalizedRow['nomegestor'] ||
      '';

    const telAgente =
      normalizedRow['telefoneagente'] ||
      normalizedRow['whatsappagente'] ||
      normalizedRow['celularagente'] ||
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
      nomeAgenteRelacionamento: nomeAgente || undefined,
      emailAgenteRelacionamento: gestoresEmail && gestoresEmail !== '#N/A' ? gestoresEmail : undefined,
      telefoneAgenteRelacionamento: telAgente || undefined,
      endereco: normalizedRow['enderecodafatura'] || normalizedRow['enderecofatura'] || normalizedRow['endereco'] || normalizedRow['localizacao'] || normalizedRow['logradouro'] || '',
      pontoReferencia: normalizedRow['pontodereferencia'] || normalizedRow['pontoreferencia'] || normalizedRow['referencia'] || normalizedRow['pontodereferenciadausina'] || '',
      googleMapsUrl: normalizedRow['localizacaogooglemaps'] || normalizedRow['maps'] || normalizedRow['googlemaps'] || normalizedRow['linkmaps'] || '',
      latitude: normalizedRow['latitude'] || normalizedRow['lat'] || '',
      longitude: normalizedRow['longitude'] || normalizedRow['long'] || normalizedRow['lng'] || '',
      statusDelfos: normalizedRow['statusdelfos'] || normalizedRow['status'] || normalizedRow['situacao'] || 'Operacional',
    });
  });

  return parsedUsinas;
}

export interface ReclamacoesImportResult {
  updatedUsinas: UsinaConcessionaria[];
  matchedCount: number;
  unmatchedRows: number;
  matchedDetails: {
    usina: string;
    concessionaria: string;
    email?: string;
    agente?: string;
    razaoSocial?: string;
    cnpj?: string;
  }[];
}

/**
 * Parses and merges spreadsheet data (CSV or Excel) with the current list of Usinas.
 * Updates Razão Social, CNPJ, relationship agent emails, names, and contacts for respective UFVs.
 */
export function mergeReclamacoesDistribuidorasCsv(
  csvText: string,
  currentUsinas: UsinaConcessionaria[]
): ReclamacoesImportResult {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
  });

  const updatedMap = new Map<string, UsinaConcessionaria>();
  currentUsinas.forEach((u) => {
    updatedMap.set(u.id, { ...u });
  });

  const matchedDetails: ReclamacoesImportResult['matchedDetails'] = [];
  let unmatchedRows = 0;

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

  result.data.forEach((row) => {
    const normalizedRow: Record<string, string> = {};
    const rawValues: string[] = [];

    Object.keys(row).forEach((k) => {
      if (k) {
        const val = row[k] ? String(row[k]).trim() : '';
        normalizedRow[normalizeKey(k)] = val;
        if (val) rawValues.push(val);
      }
    });

    // 1. Find Razão Social
    const razaoFound =
      normalizedRow['razaosocial'] ||
      normalizedRow['razaosocialcliente'] ||
      normalizedRow['razaosocialempresa'] ||
      normalizedRow['empresa'] ||
      normalizedRow['titular'] ||
      normalizedRow['cliente'] ||
      normalizedRow['razao'] ||
      '';

    // 2. Find CNPJ
    const cnpjFound =
      normalizedRow['cnpj'] ||
      normalizedRow['cnpjcliente'] ||
      normalizedRow['cnpjdaempresa'] ||
      normalizedRow['cpfcnpj'] ||
      normalizedRow['cnpjcpf'] ||
      '';

    // 3. Find Email
    let emailFound =
      normalizedRow['emaildoagentederelacionamento'] ||
      normalizedRow['emailagente'] ||
      normalizedRow['emaildoagente'] ||
      normalizedRow['emailgestores'] ||
      normalizedRow['emailrelacionamento'] ||
      normalizedRow['emaildisco'] ||
      normalizedRow['email'] ||
      normalizedRow['correio'] ||
      normalizedRow['contatoemail'] ||
      '';

    if (!emailFound) {
      // Scan all text in row for email regex
      for (const val of rawValues) {
        const matches = val.match(emailRegex);
        if (matches && matches.length > 0) {
          emailFound = matches[0];
          break;
        }
      }
    }

    if (emailFound === '#N/A' || emailFound.toLowerCase() === 'pendente') {
      emailFound = '';
    }

    // 4. Find Agent Name
    const agentName =
      normalizedRow['agentederelacionamento'] ||
      normalizedRow['agente'] ||
      normalizedRow['nomedoagente'] ||
      normalizedRow['gestor'] ||
      normalizedRow['responsavel'] ||
      normalizedRow['contatorelacionamento'] ||
      '';

    // 5. Find phone / whatsapp
    const phone =
      normalizedRow['telefone'] ||
      normalizedRow['whatsapp'] ||
      normalizedRow['celular'] ||
      normalizedRow['contato'] ||
      '';

    // If row contains no relevant information at all, skip
    if (!razaoFound && !cnpjFound && !emailFound && !agentName && !phone) {
      unmatchedRows++;
      return;
    }

    // 6. Find identifiers for Usina / DisCo
    const rawUsina =
      normalizedRow['usina'] ||
      normalizedRow['nomeusina'] ||
      normalizedRow['ufv'] ||
      normalizedRow['nomedaufv'] ||
      normalizedRow['planta'] ||
      normalizedRow['nomedaplanta'] ||
      normalizedRow['ativo'] ||
      '';

    const rawCoser =
      normalizedRow['coser'] ||
      normalizedRow['num'] ||
      normalizedRow['item'] ||
      '';

    const rawSigla =
      normalizedRow['sigla'] ||
      normalizedRow['siglaufv'] ||
      normalizedRow['siglaantiga'] ||
      normalizedRow['siglanova'] ||
      '';

    const rawInstalacao =
      normalizedRow['instalacao'] ||
      normalizedRow['codigoinstalacao'] ||
      normalizedRow['codigodainstalacaoug'] ||
      normalizedRow['ug'] ||
      normalizedRow['uc'] ||
      '';

    const rawDisco =
      normalizedRow['disco'] ||
      normalizedRow['concessionaria'] ||
      normalizedRow['distribuidora'] ||
      '';

    // Target usinas to match
    const matchedUsinas: UsinaConcessionaria[] = [];

    // Strategy A: Match by exact or partial Instalacao UG
    if (rawInstalacao) {
      const cleanInst = rawInstalacao.replace(/\D/g, '');
      if (cleanInst.length >= 4) {
        for (const u of updatedMap.values()) {
          const uClean = (u.codigoInstalacaoUG || '').replace(/\D/g, '');
          if (uClean && (uClean.includes(cleanInst) || cleanInst.includes(uClean))) {
            matchedUsinas.push(u);
          }
        }
      }
    }

    // Strategy B: Match by COSER number
    if (matchedUsinas.length === 0 && rawCoser) {
      const coserNum = rawCoser.trim();
      for (const u of updatedMap.values()) {
        if (u.coser === coserNum || u.id === `u-${coserNum}`) {
          matchedUsinas.push(u);
          break;
        }
      }
    }

    // Strategy C: Match by Sigla
    if (matchedUsinas.length === 0 && rawSigla) {
      const s = rawSigla.toUpperCase().trim();
      for (const u of updatedMap.values()) {
        if (
          (u.siglaNova && u.siglaNova.toUpperCase().trim() === s) ||
          (u.siglaAntiga && u.siglaAntiga.toUpperCase().trim() === s)
        ) {
          matchedUsinas.push(u);
        }
      }
    }

    // Strategy D: Match by Usina Name
    if (matchedUsinas.length === 0 && rawUsina) {
      const cleanTarget = rawUsina.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      for (const u of updatedMap.values()) {
        const cleanU = u.usina.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        if (cleanU === cleanTarget || cleanU.includes(cleanTarget) || cleanTarget.includes(cleanU)) {
          matchedUsinas.push(u);
        }
      }
    }

    // Strategy E: Match by Concessionária (if only concessionária given)
    if (matchedUsinas.length === 0 && rawDisco && !rawUsina && !rawSigla && !rawInstalacao) {
      const cleanDisco = rawDisco.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      for (const u of updatedMap.values()) {
        const uDisco = (u.concessionaria || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        if (uDisco && (uDisco.includes(cleanDisco) || cleanDisco.includes(uDisco))) {
          matchedUsinas.push(u);
        }
      }
    }

    if (matchedUsinas.length === 0) {
      unmatchedRows++;
      return;
    }

    // Apply updates to matched usinas
    matchedUsinas.forEach((u) => {
      if (razaoFound) u.razaoSocial = razaoFound;
      if (cnpjFound) u.cnpj = cnpjFound;

      if (emailFound) {
        u.emailAgenteRelacionamento = emailFound;
        const currentContato = u.contatoDisCo || '';
        if (!currentContato.toLowerCase().includes(emailFound.toLowerCase())) {
          u.contatoDisCo = currentContato ? `${emailFound} / ${currentContato}` : emailFound;
        }
      }

      if (agentName) u.nomeAgenteRelacionamento = agentName;
      if (phone && !u.whatsappDisCo) u.whatsappDisCo = phone;

      updatedMap.set(u.id, u);

      matchedDetails.push({
        usina: u.usina,
        concessionaria: u.concessionaria,
        email: emailFound || undefined,
        agente: agentName || undefined,
        razaoSocial: razaoFound || undefined,
        cnpj: cnpjFound || undefined,
      });
    });
  });

  return {
    updatedUsinas: Array.from(updatedMap.values()),
    matchedCount: matchedDetails.length,
    unmatchedRows,
    matchedDetails,
  };
}

/**
 * Parses raw CSV content for Provedores de Internet
 */
export function parseProvedoresCsv(
  csvText: string,
  existingProvedores?: ProvedorInternet[],
  usinasList?: UsinaConcessionaria[]
): ProvedorInternet[] {
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

    const provedorNomeCandidate =
      normalizedRow['provedor'] ||
      normalizedRow['nomeprovedor'] ||
      '';

    // Regra solicitada: Em Ibotirama, manter apenas ATInfo Telecom (excluir o da imagem: Embratel)
    if (
      usinaNome.toLowerCase().includes('ibotirama') &&
      provedorNomeCandidate.toLowerCase().includes('embratel')
    ) {
      return; // Ignora o registro da Embratel de Ibotirama
    }

    // Fallback info from Master Dictionary or Usinas Gerais
    const masterInfo = getProvedorMasterInfo(usinaNome, usinasList);

    // Existing fallback if updating in place
    const existing = existingProvedores?.find(
      (ep) => ep.usinaNome.toLowerCase() === usinaNome.toLowerCase() || ep.id === `p-${index + 1}`
    );

    // Razão Social resolution
    let razaoSocial =
      normalizedRow['razaosocial'] ||
      normalizedRow['razaosocialcliente'] ||
      normalizedRow['razao'] ||
      '';
    if (!razaoSocial || razaoSocial.toLowerCase() === 'pendente' || usinaNome.toLowerCase().includes('apodi')) {
      razaoSocial = masterInfo.razaoSocial || existing?.razaoSocial || '';
    }

    // CNPJ resolution
    let cnpj =
      normalizedRow['cnpj'] ||
      normalizedRow['cnpjcliente'] ||
      normalizedRow['cnpjempresa'] ||
      '';
    if (!cnpj || cnpj.toLowerCase() === 'pendente' || usinaNome.toLowerCase().includes('apodi')) {
      cnpj = masterInfo.cnpj || existing?.cnpj || '';
    }

    // Fallback: check if login field contains a valid 14-digit CNPJ
    if ((!cnpj || cnpj === 'Pendente') && normalizedRow['login']) {
      const cleanDigits = normalizedRow['login'].replace(/\D/g, '');
      if (cleanDigits.length === 14) {
        cnpj = cleanDigits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
      }
    }

    const provedorNome =
      normalizedRow['provedor'] ||
      normalizedRow['nomeprovedor'] ||
      masterInfo.provedorPadrao ||
      existing?.provedor ||
      '';

    const contato =
      normalizedRow['contatoprovedor'] ||
      normalizedRow['contato'] ||
      normalizedRow['telefone'] ||
      existing?.contatoProvedor ||
      '-';

    const tipoConexao =
      normalizedRow['tipo'] ||
      normalizedRow['tipoconexao'] ||
      masterInfo.tipoConexao ||
      existing?.tipoConexao ||
      'Fibra';

    parsedProvedores.push({
      id: existing?.id || `p-${index + 1}`,
      usinaNome,
      razaoSocial,
      cnpj,
      provedor: provedorNome,
      contatoProvedor: contato,
      tipoConexao,
      site: normalizedRow['site'] || normalizedRow['portal'] || existing?.site || '',
      login: normalizedRow['login'] || normalizedRow['usuario'] || existing?.login || '',
      senha: normalizedRow['senha'] || normalizedRow['password'] || existing?.senha || '',
      contrato: normalizedRow['contrato'] || existing?.contrato || '',
      vencimento: normalizedRow['vencimento'] || existing?.vencimento || '10',
      status: normalizedRow['status'] || existing?.status || 'OK',
      valorMensal: normalizedRow['valormensal'] || normalizedRow['valor'] || existing?.valorMensal || 'R$ 0,00',
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
