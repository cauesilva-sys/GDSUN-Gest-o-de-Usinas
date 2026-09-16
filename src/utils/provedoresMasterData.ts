import type { UsinaConcessionaria } from '../types';

export interface ProvedorMasterInfo {
  usinaNome: string;
  razaoSocial: string;
  cnpj: string;
  provedorPadrao: string;
  tipoConexao: string;
}

/**
 * Mapeamento mestre e definitivo de todas as usinas da aba Provedores de Internet
 * com sua respectiva Razão Social e CNPJ de acordo com a planilha oficial GDSUN.
 */
export const PROVEDORES_MASTER_DATA: ProvedorMasterInfo[] = [
  {
    usinaNome: '001-Presidente Alves-SP',
    razaoSocial: 'GDPAR SR PARTICIPACOES EM PROJETOS SOLARES S.A.',
    cnpj: '34.731.244/0003-28',
    provedorPadrao: 'AONET INTERNET',
    tipoConexao: 'Via Rádio'
  },
  {
    usinaNome: '002-Canas-SP',
    razaoSocial: 'GDPAR SR PARTICIPACOES EM PROJETOS SOLARES S.A.',
    cnpj: '34.731.244/0002-47',
    provedorPadrao: 'VELLOZNET (NetFacil)',
    tipoConexao: 'Via Rádio'
  },
  {
    usinaNome: '003-Bom Jesus da Lapa-BA',
    razaoSocial: 'GDPAR SR PARTICIPACOES EM PROJETOS SOLARES S.A.',
    cnpj: '34.731.244/0014-80',
    provedorPadrao: 'Telecom Provider',
    tipoConexao: 'Via Rádio'
  },
  {
    usinaNome: '004-Oliveira dos Brejinhos-BA',
    razaoSocial: 'GDPAR SR PARTICIPACOES EM PROJETOS SOLARES S.A.',
    cnpj: '34.731.244/0015-61',
    provedorPadrao: 'MB Server LTDA',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '007-Salto de Pirapora-SP',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0014-59',
    provedorPadrao: 'IPNET (ALARES)',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '008-Niquelândia-GO',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0033-11',
    provedorPadrao: 'Embratel (Claro S.A)',
    tipoConexao: 'Satélite'
  },
  {
    usinaNome: '009-Andradina-SP I e II',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0005-68',
    provedorPadrao: 'VERO S.A',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '010-Guarantã-SP',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0004-87',
    provedorPadrao: 'GBNETS (Flip)',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '011-Pirangi III-SP',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0013-78',
    provedorPadrao: 'Turbo NET',
    tipoConexao: 'Via Rádio'
  },
  {
    usinaNome: '012-Tapera I -PE',
    razaoSocial: 'UFV PERNAMBUCO II EQUIPAMENTOS FOTOVOLTAICOS LTDA.',
    cnpj: '34.563.724/0001-65',
    provedorPadrao: 'Ponto NET',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '014-Apodi-RN',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0029-35',
    provedorPadrao: 'Agility',
    tipoConexao: 'Via Rádio'
  },
  {
    usinaNome: '015-São João do Rio do Peixe I-PB',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0030-79',
    provedorPadrao: 'Proxxima',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '016-Taubaté-SP',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0002-15',
    provedorPadrao: 'CSC (Master)',
    tipoConexao: 'Via Rádio'
  },
  {
    usinaNome: '017-São José do Cedro-SC',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0032-30',
    provedorPadrao: 'Oest nets',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '018-Alegrete I-RS',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0020-05',
    provedorPadrao: 'REDE CONESUL',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '019-São Lourenço do Sul-RS',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0015-30',
    provedorPadrao: 'Nettron',
    tipoConexao: 'Via Rádio'
  },
  {
    usinaNome: '020-Guarda Mor I-MG',
    razaoSocial: 'GDPAR SR PARTICIPACOES EM PROJETOS SOLARES S.A.',
    cnpj: '34.731.244/0016-42',
    provedorPadrao: 'Ferraz & Meira (Norte Conexão)',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '021-Guarda Mor II-MG',
    razaoSocial: 'GDPAR SR PARTICIPACOES EM PROJETOS SOLARES S.A.',
    cnpj: '34.731.244/0005-90',
    provedorPadrao: 'Ferraz & Meira (Norte Conexão)',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '022-Guarda Mor III-MG',
    razaoSocial: 'GDPAR SR PARTICIPACOES EM PROJETOS SOLARES S.A.',
    cnpj: '34.731.244/0006-70',
    provedorPadrao: 'Ferraz & Meira (Norte Conexão)',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '023-Ibiá I-MG',
    razaoSocial: 'GDPAR SR PARTICIPACOES EM PROJETOS SOLARES S.A.',
    cnpj: '34.731.244/0007-51',
    provedorPadrao: 'Ferraz & Meira (Norte Conexão)',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '024-Ibiá II-MG',
    razaoSocial: 'GDPAR SR PARTICIPACOES EM PROJETOS SOLARES S.A.',
    cnpj: '34.731.244/0008-32',
    provedorPadrao: 'Ferraz & Meira (Norte Conexão)',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '025-Iraí de Minas I-MG',
    razaoSocial: 'GDPAR SR PARTICIPACOES EM PROJETOS SOLARES S.A.',
    cnpj: '34.731.244/0009-13',
    provedorPadrao: 'Ferraz & Meira (Norte Conexão)',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '026-Iraí de Minas II-MG',
    razaoSocial: 'GDPAR SR PARTICIPACOES EM PROJETOS SOLARES S.A.',
    cnpj: '34.731.244/0010-57',
    provedorPadrao: 'Ferraz & Meira (Norte Conexão)',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '027-Frutal-MG',
    razaoSocial: 'GDPAR SR PARTICIPACOES EM PROJETOS SOLARES S.A.',
    cnpj: '34.731.244/0004-09',
    provedorPadrao: 'Ferraz & Meira (Norte Conexão)',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '028-Nova Ponte-MG',
    razaoSocial: 'GDPAR SR PARTICIPACOES EM PROJETOS SOLARES S.A.',
    cnpj: '34.731.244/0011-38',
    provedorPadrao: 'Ferraz & Meira (Norte Conexão)',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '029-Macaubal I -SP',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0008-00',
    provedorPadrao: 'Isabela Informática (Sicredi)',
    tipoConexao: 'Via Rádio'
  },
  {
    usinaNome: '030-Pirangi I -SP',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0012-97',
    provedorPadrao: 'Turbo NET',
    tipoConexao: 'Via Rádio'
  },
  {
    usinaNome: '031-Ibiá III-MG',
    razaoSocial: 'GDPAR SR PARTICIPACOES EM PROJETOS SOLARES S.A.',
    cnpj: '34.731.244/0012-19',
    provedorPadrao: 'NOVA BANDA LARGA',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '032-Uruguaiana I-RS',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0016-10',
    provedorPadrao: 'GPasi Internet Rural',
    tipoConexao: 'Via Rádio'
  },
  {
    usinaNome: '033-Alegrete II -RS',
    razaoSocial: 'GDPAR SR PARTICIPACOES EM PROJETOS SOLARES S.A.',
    cnpj: '34.731.244/0013-08',
    provedorPadrao: 'REDE CONESUL',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '034-Quaraí-RS',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0017-00',
    provedorPadrao: 'REDE CONESUL',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '035-Uruguaiana II -RS',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0022-69',
    provedorPadrao: 'GPasi Internet Rural',
    tipoConexao: 'Via Rádio'
  },
  {
    usinaNome: '036-Barra do Quaraí-RS',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0019-63',
    provedorPadrao: 'GPasi Internet Rural',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '037-Uruguaiana IV-RS',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0023-40',
    provedorPadrao: 'Tamar(VIP+)',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '038-São Borja I-RS',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0021-88',
    provedorPadrao: 'GERSON TORREL DE BAIL',
    tipoConexao: 'Via Rádio'
  },
  {
    usinaNome: '039-São Borja II-RS',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0018-82',
    provedorPadrao: 'GERSON TORREL DE BAIL',
    tipoConexao: 'Via Rádio'
  },
  {
    usinaNome: '040-Araçuaí-MG',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0031-50',
    provedorPadrao: 'Maxxitel Telecom',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '042-Ibotirama-BA',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0027-73',
    provedorPadrao: 'ATInfo Telecom',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '043-Sítio do Mato - BA',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0026-92',
    provedorPadrao: 'Embratel (Claro S.A)',
    tipoConexao: 'Satélite'
  },
  {
    usinaNome: '044-São Mateus I-ES',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0028-54',
    provedorPadrao: 'SIAT INTERNET',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '045-São Mateus II-ES',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0028-54',
    provedorPadrao: 'SIAT INTERNET',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '046-Cachoeira Paulista-SP',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0009-91',
    provedorPadrao: 'VELLOZNET (NetFacil)',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '047-Pindamonhangaba -SP',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0038-26',
    provedorPadrao: 'Embratel (Claro S.A)',
    tipoConexao: 'Satélite'
  },
  {
    usinaNome: '050-Estância (Fernandópolis)-SP',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0010-25',
    provedorPadrao: 'NavegNet',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '051-Horizonte I -CE',
    razaoSocial: 'UFV GOVERDE CEARÁ ALUGUEL DE INFRAESTRUTURA SPE LTDA',
    cnpj: '34.953.988/0001-25',
    provedorPadrao: 'Jerry Net',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '052-Irece - BA',
    razaoSocial: 'UFV GDPAR-GV BA1 EQUIPAMENTOS FOTOVOLTAICOS LTDA',
    cnpj: '44.300.305/0001-94',
    provedorPadrao: 'Proxxima',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '053-Tapera II e III -PE',
    razaoSocial: 'UFV GOVERDE PERNAMBUCO 2 ALUGUEL DE INFRAESTRUTURA SPE LTDA.',
    cnpj: '36.152.118/0001-82',
    provedorPadrao: 'Ponto NET',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '057-Leopoldo Bulhões',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0025-01',
    provedorPadrao: 'InterTop (Wide Pay)',
    tipoConexao: 'Via Rádio'
  },
  {
    usinaNome: '064-Presidente Epitacio -SP',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0003-04',
    provedorPadrao: 'NOVA PORTONET',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '103-Rio das Pedras -SP',
    razaoSocial: 'UFV GDPAR SP1 EQUIPAMENTOS FOTOVOLTAICOS LTDA',
    cnpj: '43.966.201/0001-50',
    provedorPadrao: 'PORTAL QUÉOPS',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '105 - Barra do Arará - BA',
    razaoSocial: 'UFV GDPAR-GV BA2 EQUIPAMENTOS FOTOVOLTAICOS LTDA',
    cnpj: '44.300.323/0001-76',
    provedorPadrao: 'Meganet --CENCELAR PROVADOR',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '111-Colombia - SP',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0007-20',
    provedorPadrao: 'Flash internet rural',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '112-Neves Paulista - SP',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0011-06',
    provedorPadrao: 'Starlink',
    tipoConexao: 'Satélite'
  },
  {
    usinaNome: '117-Ituverava - SP',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0034-00',
    provedorPadrao: 'Starlink',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '128-São João do Rio do Peixe II -PB',
    razaoSocial: 'UFV GDSUN PB1 EQUIPAMENTOS FOTOVOLTAICOS LTDA',
    cnpj: '45.132.282/0001-19',
    provedorPadrao: 'Hughesnet',
    tipoConexao: 'Satélite'
  },
  {
    usinaNome: '131-Luiz Eduardo Magalhães I',
    razaoSocial: 'UFV GDPAR-GV BA1 EQUIPAMENTOS FOTOVOLTAICOS LTDA',
    cnpj: '44.300.305/0001-94',
    provedorPadrao: 'Embratel (Claro S.A)',
    tipoConexao: 'Satélite'
  },
  {
    usinaNome: '136-Santa Albertina - SP',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0036-64',
    provedorPadrao: 'Azariti telecom',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '147-Brasília - DF',
    razaoSocial: 'UFV GDPAR DF1 EQUIPAMENTOS FOTOVOLTAICOS LTDA',
    cnpj: '44.285.114/0001-09',
    provedorPadrao: 'ALLREDE TELECOM LTDA',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '157-Campestre I e II - CE',
    razaoSocial: 'UFV GDPAR-GV CE1 FOTOVOLTAICOS LTDA',
    cnpj: '44.334.047/0001-67',
    provedorPadrao: 'Fixanet',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '164 - Caracará - CE',
    razaoSocial: 'UFV GOVERDE CEARÁ ALUGUEL DE INFRAESTRUTURA SPE LTDA',
    cnpj: '34.366.520/0030-79',
    provedorPadrao: 'IPLAY! TELECOM',
    tipoConexao: 'Via Rádio'
  },
  {
    usinaNome: '166 - Mãe do Rio - PA',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0037-45',
    provedorPadrao: 'HIGNET (M G S)',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '167 - São Bento do Una - PE',
    razaoSocial: 'UFV GDPAR-GV PE1 EQUIPAMENTOS FOTOVOLTAICOS LTDA',
    cnpj: '45.048.306/0001-56',
    provedorPadrao: 'Ponto Net (EFI S.A)',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '196 - Panorama - SP',
    razaoSocial: 'UFV GDPAR-GV SP3 EQUIPAMENTOS FOTOVOLTAICOS LTDA',
    cnpj: '44.477.837/0001-00',
    provedorPadrao: 'AbcRede Telecom',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '202-Varzea da Palma I',
    razaoSocial: 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A',
    cnpj: '34.366.520/0035-83',
    provedorPadrao: 'HD Net Telecom',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '203 - Varzea da Palma II (Andromeda)',
    razaoSocial: 'ANDROMEDA EQUIPAMENTOS FOTOVOLTAICO S.A',
    cnpj: '22.823.513/0001-35',
    provedorPadrao: 'HD Net Telecom',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '204 - Buritizeiro',
    razaoSocial: 'BURITIZEIRO EQUIPAMENTOS FOTOVOLTAICOS S.A.',
    cnpj: '27.446.447/0001-45',
    provedorPadrao: 'Conectv',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '235 - Luís Eduardo Magalhães II - BA',
    razaoSocial: 'UFV GDPAR-GV BA2 EQUIPAMENTOS FOTOVOLTAICOS LTDA',
    cnpj: '44.300.323/0001-76',
    provedorPadrao: 'G7 NET',
    tipoConexao: 'Fibra'
  },
  {
    usinaNome: '244 - Aliança - PE',
    razaoSocial: 'UFV GDPAR-GV PE1 EQUIPAMENTOS FOTOVOLTAICOS LTDA',
    cnpj: '45.048.306/0001-56',
    provedorPadrao: 'Starlink (Jose Natércio)',
    tipoConexao: 'Satélite'
  }
];

/**
 * Normaliza uma string de código numérico de usina (ex: "001", "1", "042", "203")
 */
export function extractUsinaCode(usinaString: string): string {
  if (!usinaString) return '';
  const match = usinaString.trim().match(/^(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    return String(num).padStart(3, '0');
  }
  return '';
}

/**
 * Normaliza texto para correspondência flexível
 */
export function cleanKey(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Obtém com garantia absoluta a Razão Social e o CNPJ de um registro de usina / provedor.
 */
export function getProvedorMasterInfo(
  usinaNome: string,
  usinasList?: UsinaConcessionaria[]
): { razaoSocial: string; cnpj: string; tipoConexao: string; provedorPadrao: string } {
  const code = extractUsinaCode(usinaNome);

  // 1. Busca no mapeamento mestre por código (001, 002, etc.)
  if (code) {
    const matchByCode = PROVEDORES_MASTER_DATA.find(
      (m) => extractUsinaCode(m.usinaNome) === code
    );
    if (matchByCode) {
      return {
        razaoSocial: matchByCode.razaoSocial,
        cnpj: matchByCode.cnpj,
        tipoConexao: matchByCode.tipoConexao,
        provedorPadrao: matchByCode.provedorPadrao
      };
    }
  }

  // 2. Busca no mapeamento mestre por similaridade de nome
  const cleanTarget = cleanKey(usinaNome);
  const matchByName = PROVEDORES_MASTER_DATA.find((m) => {
    const cleanM = cleanKey(m.usinaNome);
    return cleanM === cleanTarget || cleanM.includes(cleanTarget) || cleanTarget.includes(cleanM);
  });
  if (matchByName) {
    return {
      razaoSocial: matchByName.razaoSocial,
      cnpj: matchByName.cnpj,
      tipoConexao: matchByName.tipoConexao,
      provedorPadrao: matchByName.provedorPadrao
    };
  }

  // 3. Fallback na lista de usinas das Informações Gerais
  if (usinasList && usinasList.length > 0) {
    if (code) {
      const matchU = usinasList.find(
        (u) => extractUsinaCode(u.coser || '') === code || extractUsinaCode(u.usina) === code
      );
      if (matchU && (matchU.razaoSocial || matchU.cnpj)) {
        return {
          razaoSocial: matchU.razaoSocial || '',
          cnpj: matchU.cnpj || '',
          tipoConexao: 'Fibra',
          provedorPadrao: ''
        };
      }
    }

    const matchUByName = usinasList.find((u) => {
      const uClean = cleanKey(u.usina);
      return uClean === cleanTarget || uClean.includes(cleanTarget) || cleanTarget.includes(uClean);
    });
    if (matchUByName && (matchUByName.razaoSocial || matchUByName.cnpj)) {
      return {
        razaoSocial: matchUByName.razaoSocial || '',
        cnpj: matchUByName.cnpj || '',
        tipoConexao: 'Fibra',
        provedorPadrao: ''
      };
    }
  }

  return {
    razaoSocial: '',
    cnpj: '',
    tipoConexao: 'Fibra',
    provedorPadrao: ''
  };
}
