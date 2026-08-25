export interface UsinaConcessionaria {
  id: string;
  coser?: string;
  statusDelfos?: string;
  usina: string;
  siglaAntiga?: string;
  siglaNova?: string;
  uf: string;
  cluster?: string;
  razaoSocial: string; // Coluna AA
  cnpj: string; // Coluna AB
  razaoSocialCliente?: string;
  cnpjCliente?: string;
  concessionaria: string; // DisCo
  codigoCliente?: string;
  codigoInstalacaoUG: string; // Número da Instalação
  medidor?: string;
  contatoDisCo: string; // Contato Concessionária Local
  whatsappDisCo?: string;
  observacoes?: string;
  enderecoFatura?: string;
  endereco: string; // Endereço da Usina
  googleMapsUrl?: string;
  latitude?: string;
  longitude?: string;
}

export interface ProvedorInternet {
  id: string;
  usinaNome: string; // Nome original na aba de provedores (ex: "001-Presidente Alves-SP")
  razaoSocial: string;
  cnpj: string;
  provedor: string; // Nome do Provedor
  contatoProvedor: string; // Telefone/whatsapp/contato
  tipoConexao: string; // Fibra, Via Rádio, Satélite, etc.
  contrato?: string;
  vencimento?: string;
  status: 'OK' | 'ATENÇÃO' | 'CRÍTICO' | string;
  valorMensal: string;
  // Campos vinculados via correspondência inteligente de usina:
  usinaBaseNormalizada?: string;
  enderecoUsina?: string; // Puxado da planilha de informações gerais
  ufUsina?: string;
  googleMapsUrl?: string;
}

export interface SyncConfig {
  sheetsUrlUsinas?: string;
  sheetsUrlProvedores?: string;
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number; // 0.5, 1, 5, 15, etc.
  lastSyncTime?: string;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
}

export type ActiveTab = 'concessionarias' | 'provedores' | 'sync' | 'resumo';
