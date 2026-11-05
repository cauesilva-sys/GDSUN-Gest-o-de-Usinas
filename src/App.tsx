import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ConcessionariasView } from './components/ConcessionariasView';
import { ProvedoresView } from './components/ProvedoresView';
import { ResumoMetricsView } from './components/ResumoMetricsView';
import { initialUsinas, initialProvedores } from './data/initialData';
import { UsinaConcessionaria, ProvedorInternet, SyncConfig, ActiveTab } from './types';
import { parseUsinasCsv, parseProvedoresCsv } from './utils/csvParser';

// Função para garantir que nenhum campo de usina chegue como undefined
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

// Função para garantir que nenhum campo de provedor chegue como undefined
function sanitizarProvedor(p: any, idx: number): ProvedorInternet {
  return {
    id: String(p.id || `p-${idx + 1}`),
    usina: String(p.usina || p.usinaNome || `Usina ${idx + 1}`),
    razaoSocial: String(p.razaoSocial || 'N/A'),
    cnpj: String(p.cnpj || 'N/A'),
    provedor: String(p.provedor || 'A Definir'),
    contatoProvedor: String(p.contatoProvedor || '-'),
    sitePortal: String(p.sitePortal || ''),
    login: String(p.login || ''),
    senha: String(p.senha || ''),
    tipoConexao: String(p.tipoConexao || 'Fibra'),
    contrato: String(p.contrato || ''),
    ...p
  } as ProvedorInternet;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('concessionarias');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUsinaFilter, setSelectedUsinaFilter] = useState<string>('TODAS');

  const APPS_SCRIPT_WEBAPP_URL = 'https://script.google.com/a/macros/gdsun.com.br/s/AKfycbzEZOcLjHoS_tP-PiRGWyF0C_Pz1K78vviHI21ds8FUYWjbJ7KYMuay7wBNLU1ZyAeD/exec';
  const DEFAULT_USINAS_URL = 'https://docs.google.com/spreadsheets/d/1BrlpPTiB1yEkODIvTBpBWKM0h_SMJcywuwH7VWLiTXk/edit?gid=1570514093#gid=1570514093';
  const DEFAULT_PROVEDORES_URL = 'https://docs.google.com/spreadsheets/d/1BrlpPTiB1yEkODIvTBpBWKM0h_SMJcywuwH7VWLiTXk/edit?gid=350548087#gid=350548087';

  const USINAS_STORAGE_KEY = 'gdsun_usinas_csv_direct_v32';
  const PROVEDORES_STORAGE_KEY = 'gdsun_provedores_csv_direct_v32';

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
    return (initialUsinas || []).map((u, i) => sanitizarUsina(u, i));
  });

  const [provedores, setProvedores] = useState<ProvedorInternet[]>(() => {
    try {
      const saved = localStorage.getItem(PROVEDORES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, idx) => sanitizarProvedor(item, idx));
        }
      }
    } catch {}
    return (initialProvedores || []).map((p, i) => sanitizarProvedor(p, i));
  });

  const [syncConfig, setSyncConfig] = useState<SyncConfig>({
    sheetsUrlUsinas: DEFAULT_USINAS_URL,
    sheetsUrlProvedores: DEFAULT_PROVEDORES_URL,
    autoSyncEnabled: true,
    syncIntervalMinutes: 5,
    lastSyncTime: '',
    syncStatus: 'idle',
  });

  useEffect(() => {
    document.title = 'GDSUN Gestão de Usinas';
  }, []);

  // Sincronização direta de Usinas e Provedores via CSV (sem restrições de CORS)
  const performSyncNow = useCallback(async () => {
    setSyncConfig((prev) => ({ ...prev, syncStatus: 'syncing' }));

    try {
      // 1. Sincronizar Usinas (gid=1570514093)
      const csvUsinasUrl = 'https://docs.google.com/spreadsheets/d/1BrlpPTiB1yEkODIvTBpBWKM0h_SMJcywuwH7VWLiTXk/export?format=csv&gid=1570514093';
      const resUsinas = await fetch(csvUsinasUrl);
      if (resUsinas.ok) {
        const textUsinas = await resUsinas.text();
        if (!textUsinas.includes('<!DOCTYPE html>') && !textUsinas.includes('<html')) {
          const parsed = parseUsinasCsv(textUsinas);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const sanitizadas = parsed.map((item, idx) => sanitizarUsina(item, idx));
            setUsinas(sanitizadas);
            try {
              localStorage.setItem(USINAS_STORAGE_KEY, JSON.stringify(sanitizadas));
            } catch {}
          }
        }
      }

      // 2. Sincronizar Provedores (gid=350548087)
      const csvProvedoresUrl = 'https://docs.google.com/spreadsheets/d/1BrlpPTiB1yEkODIvTBpBWKM0h_SMJcywuwH7VWLiTXk/export?format=csv&gid=350548087';
      const resProvedores = await fetch(csvProvedoresUrl);
      if (resProvedores.ok) {
        const textProvedores = await resProvedores.text();
        if (!textProvedores.includes('<!DOCTYPE html>') && !textProvedores.includes('<html')) {
          const parsedProv = parseProvedoresCsv(textProvedores);
          if (Array.isArray(parsedProv) && parsedProv.length > 0) {
            const sanitizados = parsedProv.map((item, idx) => sanitizarProvedor(item, idx));
            setProvedores(sanitizados);
            try {
              localStorage.setItem(PROVEDORES_STORAGE_KEY, JSON.stringify(sanitizados));
            } catch {}
          }
        }
      }

      setSyncConfig((prev) => ({
        ...prev,
        syncStatus: 'success',
        lastSyncTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      }));
    } catch (err) {
      console.error('Falha ao sincronizar dados do Google Sheets:', err);
      setSyncConfig((prev) => ({ ...prev, syncStatus: 'error' }));
    }
  }, []);

  useEffect(() => {
    performSyncNow();
  }, [performSyncNow]);

  const handleUpdateUsinas = async (updatedList: UsinaConcessionaria[]) => {
    const limpas = updatedList.map((u, i) => sanitizarUsina(u, i));
    setUsinas(limpas);
    try {
      localStorage.setItem(USINAS_STORAGE_KEY, JSON.stringify(limpas));
    } catch {}

    const itemModificado = limpas[0];
    if (!itemModificado) return;

    try {
      await fetch(APPS_SCRIPT_WEBAPP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          _rowIndex: (itemModificado as any)._rowIndex || 2,
          razaoSocial: itemModificado.razaoSocial || itemModificado.razaoSocialCliente || '',
          cnpj: itemModificado.cnpj || itemModificado.cnpjCliente || '',
          codigoCliente: itemModificado.codigoCliente || '',
          instalacaoAntiga: itemModificado.instalacaoAntiga || itemModificado.codigoInstalacaoAntigaUG || '',
          instalacaoNova: itemModificado.instalacaoNova || itemModificado.codigoInstalacaoNovaUG || '',
          medidor: itemModificado.medidor || ''
        })
      });
    } catch (e) {
      console.error('Erro ao enviar dados para o Apps Script:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased selection:bg-amber-500 selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedUsinaFilter={selectedUsinaFilter}
        setSelectedUsinaFilter={setSelectedUsinaFilter}
        syncConfig={syncConfig}
        onRefreshNow={performSyncNow}
        usinas={usinas}
        usinaCount={usinas.length}
        provedorCount={provedores.length}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'concessionarias' && (
          <ConcessionariasView 
            usinas={usinas} 
            searchQuery={searchQuery}
            selectedUsinaFilter={selectedUsinaFilter}
            setSelectedUsinaFilter={setSelectedUsinaFilter}
            onUpdateUsinas={handleUpdateUsinas}
          />
        )}

        {activeTab === 'provedores' && (
          <ProvedoresView 
            provedores={provedores} 
            usinas={usinas} 
            searchQuery={searchQuery}
            selectedUsinaFilter={selectedUsinaFilter}
            setSelectedUsinaFilter={setSelectedUsinaFilter}
          />
        )}

        {activeTab === 'resumo' && (
          <ResumoMetricsView usinas={usinas} provedores={provedores} />
        )}
      </main>
    </div>
  );
}
