import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ConcessionariasView } from './components/ConcessionariasView';
import { ProvedoresView } from './components/ProvedoresView';
import { ResumoMetricsView } from './components/ResumoMetricsView';
import { initialUsinas, initialProvedores } from './data/initialData';
import { UsinaConcessionaria, ProvedorInternet, SyncConfig, ActiveTab } from './types';
import { parseUsinasCsv } from './utils/csvParser';
import Papa from 'papaparse';

// Sanitização robusta para usinas
function sanitizarUsina(u: any, idx: number): UsinaConcessionaria {
  const nome = String(u.nome || u.usina || u.usinaNome || `Usina ${idx + 1}`);
  return {
    id: String(u.id || `usina_${idx + 1}`),
    nome: nome,
    usina: nome,
    usinaNome: nome,
    sigla: String(u.sigla || u.siglaNova || u.siglaAntiga || ''),
    siglaAntiga: String(u.siglaAntiga || u.sigla || ''),
    siglaNova: String(u.siglaNova || u.sigla || ''),
    uf: String(u.uf || ''),
    concessionaria: String(u.concessionaria || u.disco || 'Não informada'),
    codigoCliente: String(u.codigoCliente || 'N/A'),
    instalacaoAntiga: String(u.instalacaoAntiga || u.codigoInstalacaoAntigaUG || 'N/A'),
    codigoInstalacaoAntigaUG: String(u.codigoInstalacaoAntigaUG || u.instalacaoAntiga || 'N/A'),
    instalacaoNova: String(u.instalacaoNova || u.codigoInstalacaoNovaUG || 'N/A'),
    codigoInstalacaoNovaUG: String(u.codigoInstalacaoNovaUG || u.instalacaoNova || 'N/A'),
    medidor: String(u.medidor || 'N/A'),
    razaoSocial: String(u.razaoSocial || u.razaoSocialCliente || 'N/A'),
    razaoSocialCliente: String(u.razaoSocialCliente || u.razaoSocial || 'N/A'),
    cnpj: String(u.cnpj || u.cnpjCliente || 'N/A'),
    cnpjCliente: String(u.cnpjCliente || u.cnpj || 'N/A'),
    endereco: String(u.endereco || 'Endereço não informado'),
    pontoReferencia: String(u.pontoReferencia || ''),
    nomeAgente: String(u.nomeAgente || 'Clientes Corporativos'),
    nomeAgenteRelacionamento: String(u.nomeAgenteRelacionamento || u.nomeAgente || 'Clientes Corporativos'),
    emailAgente: String(u.emailAgente || u.emailAgenteRelacionamento || ''),
    emailAgenteRelacionamento: String(u.emailAgenteRelacionamento || u.emailAgente || ''),
    telefoneAgente: String(u.telefoneAgente || ''),
    status: String(u.status || 'Ativa'),
    ...u
  } as UsinaConcessionaria;
}

// Sanitização dos Provedores lendo a estrutura real da planilha (incluindo Endereço da Usina)
function sanitizarProvedor(p: any, idx: number): ProvedorInternet {
  return {
    id: String(p['ID'] || p.id || `p-${idx + 1}`).trim(),
    usina: String(p['Usina'] || p.usina || `Usina ${idx + 1}`).trim(),
    razaoSocial: String(p['Razão Social'] || p.razaoSocial || 'N/A').trim(),
    cnpj: String(p['CNPJ'] || p.cnpj || 'N/A').trim(),
    provedor: String(p['Provedor'] || p.provedor || 'A Definir').trim(),
    contatoProvedor: String(p['Contato Provedor'] || p.contatoProvedor || '-').trim(),
    tipoConexao: String(p['Tipo de Conexão'] || p['Tipo de Conexã'] || p['Tipo de Conex'] || p.tipoConexao || 'Fibra').trim(),
    endereco: String(p['Endereço da Usina'] || p['Endereco da Usina'] || p.endereco || 'Endereço não informado').trim(),
    sitePortal: '',
    login: '',
    senha: '',
    contrato: ''
  } as ProvedorInternet;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('concessionarias');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUsinaFilter, setSelectedUsinaFilter] = useState<string>('TODAS');

  // GID exato da aba Provedores da sua planilha
  const PROVEDORES_GID = '1710018109'; 
  const USINAS_GID = '1570514093';

  // Chaves de armazenamento incrementadas para invalidar caches anteriores
  const USINAS_STORAGE_KEY = 'gdsun_usinas_csv_direct_v45';
  const PROVEDORES_STORAGE_KEY = 'gdsun_provedores_csv_direct_v45';

  const [usinas, setUsinas] = useState<UsinaConcessionaria[]>(() => {
    try {
      const saved = localStorage.getItem(USINAS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, idx) => sanitizarUsina(item, idx));
        }
      }
    } catch {}
    return (initialUsinas || []).map((
