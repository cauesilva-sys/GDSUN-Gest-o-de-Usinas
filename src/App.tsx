import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ConcessionariasView } from './components/ConcessionariasView';
import { ProvedoresView } from './components/ProvedoresView';
import { ResumoMetricsView } from './components/ResumoMetricsView';
import { initialUsinas, initialProvedores } from './data/initialData';
import { UsinaConcessionaria, ProvedorInternet, SyncConfig, ActiveTab } from './types';
import Papa from 'papaparse';

// Sanitização robusta para usinas
function sanitizarUsina(u: any, idx: number): UsinaConcessionaria {
  const nome = String(u.nome || u.usina || u['Usina'] || `Usina ${idx + 1}`).trim();
  return {
    id: String(u.id || `usina_${idx + 1}`),
    nome: nome,
    usina: nome,
    usinaNome: nome,
    sigla: String(u['Sigla Nova'] || u['Sigla Antiga'] || u.sigla || '').trim(),
    siglaAntiga: String(u['Sigla Antiga'] || u.sigla || '').trim(),
    siglaNova: String(u['Sigla Nova'] || u.sigla || '').trim(),
    uf: String(u['UF'] || u.uf || '').trim(),
    concessionaria: String(u['Concessionária (DisCo)'] || u.concessionaria || 'Não informada').trim(),
    codigoCliente: String(u['Código Cliente'] || u.codigoCliente || 'N/A').trim(),
    instalacaoAntiga: String(u['Código Instalação Antiga (UG)'] || u.instalacaoAntiga || 'N/A').trim(),
    codigoInstalacaoAntigaUG: String(u['Código Instalação Antiga (UG)'] || u.instalacaoAntiga || 'N/A').trim(),
    instalacaoNova: String(u['Código Instalação Nova'] || u.instalacaoNova || 'N/A').trim(),
    codigoInstalacaoNovaUG: String(u['Código Instalação Nova'] || u.instalacaoNova || 'N/A').trim(),
    medidor: String(u['Medidor'] || u.medidor || 'N/A').trim(),
    razaoSocial: String(u['Razão Social Cliente'] || u.razaoSocial || 'N/A').trim(),
    razaoSocialCliente: String(u['Razão Social Cliente'] || u.razaoSocial || 'N/A').trim(),
    cnpj: String(u['CNPJ Cliente'] || u.cnpj || 'N/A').trim(),
    cnpjCliente: String(u['CNPJ Cliente'] || u.cnpj || 'N/A').trim(),
    endereco: 'Endereço não informado',
    pontoReferencia: '',
    nomeAgente: 'Clientes Corporativos',
    nomeAgenteRelacionamento: 'Clientes Corporativos',
    emailAgente: '',
    emailAgenteRelacionamento: '',
    telefoneAgente: '',
    status: 'Ativa'
  } as UsinaConcessionaria;
}

// Sanitização direta das colunas reais da aba Provedores
function sanitizarProvedor(row: any, idx: number): ProvedorInternet {
  return {
    id: String(row['ID'] || `p-${idx + 1}`).trim(),
    usina: String(row['Usina'] || `Usina ${idx + 1}`).trim(),
    razaoSocial: String(row['Razão Social'] || 'N/A').trim(),
    cnpj: String(row['CNPJ'] || 'N/A').trim(),
    provedor: String(row['Provedor'] || 'A Definir').trim(),
    contatoProvedor: String(row['Contato Provedor'] || '-').trim(),
    tipoConexao: String(row['Tipo de Conexão'] || row['Tipo de Conexã'] || 'Fibra').trim(),
    endereco: String(row['Endereço da Usina'] || row['Endereco da Usina'] || 'Endereço não informado').trim(),
    sitePortal: '',
    login: '',
    senha: '',
    contrato: ''
  } as ProvedorInternet;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('provedores');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUsinaFilter, setSelectedUsinaFilter] = useState<string>('TODAS');

  const USINAS_GID = '1570514093';
  const PROVEDORES_GID = '1710018109'; 

  const USINAS_STORAGE_KEY = 'gdsun_usinas_gviz_v50';
  const PROVEDORES_STORAGE_KEY = 'gdsun_provedores_gviz_v50';

  const [usinas, setUsinas] = useState<UsinaConcessionaria[]>(() => {
    try {
      const saved = localStorage.getItem(USINAS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return (initialUsinas || []).map((u, i) => sanitizarUsina(u, i));
  });

  const [provedores, setProvedores] = useState<ProvedorInternet[]>(() => {
    try {
      const saved = localStorage.getItem(PROVEDORES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return (initialProvedores || []).map((p, i) => sanitizarProvedor(p, i));
  });

  const [syncConfig, setSyncConfig] = useState<SyncConfig>({
    sheetsUrlUsinas: '',
    sheetsUrlProvedores: '',
    autoSyncEnabled: true,
    syncIntervalMinutes: 5,
    lastSyncTime: '',
    syncStatus: 'idle',
  });

  useEffect(() => {
    document.title = 'GDSUN Gestão de Usinas';
  }, []);

  // Sincronização via GViz (Garante CORS liberado sem bloqueio do navegador)
  const performSyncNow = useCallback(async () => {
    setSyncConfig((prev) => ({ ...prev, syncStatus: 'syncing' }));

    try {
      // 1. Usinas via GViz
      const gvizUsinas = `https://docs.google.com/spreadsheets/d/1BrlpPTiB1yEkODIvTBpBWKM0h_SMJcywuwH7VWLiTXk/gviz/tq?tqx=out:csv&gid=${USINAS_GID}`;
      const resU = await fetch(gvizUsinas);
      if (resU.ok) {
        const csvU = await resU.text();
        const parsedU = Papa.parse(csvU, { header: true, skipEmptyLines: true }).data;
        if (Array.isArray(parsedU) && parsedU.length > 0) {
          const listU = parsedU
            .filter((r: any) => r['Usina'] && String(r['Usina']).trim() !== '')
            .map((item, idx) => sanitizarUsina(item, idx));
          if (listU.length > 0) {
            setUsinas(listU);
            try { localStorage.setItem(USINAS_STORAGE_KEY, JSON.stringify(listU)); } catch {}
          }
        }
      }

      // 2. Provedores via GViz
      const gvizProvedores = `https://docs.google.com/spreadsheets/d/1BrlpPTiB1yEkODIvTBpBWKM0h_SMJcywuwH7VWLiTXk/gviz/tq?tqx=out:csv&gid=${PROVEDORES_GID}`;
      const resP = await fetch(gvizProvedores);
      if (resP.ok) {
        const csvP = await resP.text();
        const parsedP = Papa.parse(csvP, { header: true, skipEmptyLines: true }).data;
        if (Array.isArray(parsedP) && parsedP.length > 0) {
          const listP = parsedP
            .filter((r: any) => r['Usina'] && String(r['Usina']).trim() !== '')
            .map((item, idx) => sanitizarProvedor(item, idx));
          if (listP.length > 0) {
            setProvedores(listP);
            try { localStorage.setItem(PROVEDORES_STORAGE_KEY, JSON.stringify(listP)); } catch {}
          }
        }
      }

      setSyncConfig((prev) => ({
        ...prev,
        syncStatus: 'success',
        lastSyncTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      }));
    } catch (err) {
      console.error('Falha ao sincronizar:', err);
      setSyncConfig((prev) => ({ ...prev, syncStatus: 'error' }));
    }
  }, [PROVEDORES_GID, USINAS_GID]);

  useEffect(() => {
    performSyncNow();
  }, [performSyncNow]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased selection:bg-amber-500 selection:text-white">
      <Navbar
        activeTab={
