import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ConcessionariasView } from './components/ConcessionariasView';
import { ProvedoresView } from './components/ProvedoresView';
import { ResumoMetricsView } from './components/ResumoMetricsView';
import { initialUsinas, initialProvedores } from './data/initialData';
import { UsinaConcessionaria, ProvedorInternet, SyncConfig, ActiveTab } from './types';

// Função para garantir que nenhum campo chegue como undefined ou quebre o site
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

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('concessionarias');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUsinaFilter, setSelectedUsinaFilter] = useState<string>('TODAS');

  // URL do Google Apps Script para leitura e gravação direta
  const APPS_SCRIPT_WEBAPP_URL = 'https://script.google.com/a/macros/gdsun.com.br/s/AKfycbzEZOcLjHoS_tP-PiRGWyF0C_Pz1K78vviHI21ds8FUYWjbJ7KYMuay7wBNLU1ZyAeD/exec';
  const DEFAULT_USINAS_URL = 'https://docs.google.com/spreadsheets/d/1BrlpPTiB1yEkODIvTBpBWKM0h_SMJcywuwH7VWLiTXk/edit?gid=1570514093#gid=1570514093';
  const DEFAULT_PROVEDORES_URL = 'https://docs.google.com/spreadsheets/d/11yEqEVQveKB-lEKLyT45gCe6FduZL9AKU16uhVlOAW0/edit?gid=350548087#gid=350548087';

  const USINAS_STORAGE_KEY = 'gdsun_usinas_direct_v25';
  const PROVEDORES_STORAGE_KEY = 'gdsun_provedores_direct_v25';

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

  const [provedores, setProvedores] = useState<ProvedorInternet[]>(() => initialProvedores || []);

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

  // Sincronização direta via JSON da API do Apps Script
  const performSyncNow = useCallback(async () => {
    setSyncConfig((prev) => ({ ...prev, syncStatus: 'syncing' }));

    try {
      const res = await fetch(APPS_SCRIPT_WEBAPP_URL);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const usinasFormatadas = data.map((item: any, idx: number) => {
            const nomeUsina = item['Usina'] || item.nome || item.usinaNome || `Usina ${idx + 1}`;
            return sanitizarUsina({
              id: `usina_${idx + 1}`,
              _rowIndex: item._rowIndex || idx + 2,
              nome: nomeUsina,
              usina: nomeUsina,
              usinaNome: nomeUsina,
              sigla: item['Sigla Nova'] || item['Sigla Antiga'] || item.sigla || '',
              siglaAntiga: item['Sigla Antiga'] || '',
              siglaNova: item['Sigla Nova'] || '',
              uf: item['UF'] || '',
              concessionaria: item['Concessionária (DisCo)'] || item.concessionaria || 'Não informada',
              codigoCliente: item['Código Cliente'] || 'N/A',
              instalacaoAntiga: item['Código Instalação Antiga (UG)'] || 'N/A',
              codigoInstalacaoAntigaUG: item['Código Instalação Antiga (UG)'] || 'N/A',
              instalacaoNova: item['Código Instalação Nova'] || item['Código Instalação Nova (U Medidor'] || 'N/A',
              codigoInstalacaoNovaUG: item['Código Instalação Nova'] || item['Código Instalação Nova (U Medidor'] || 'N/A',
              medidor: item['Medidor'] || 'N/A',
              razaoSocial: item['Razão Social Cliente'] || 'N/A',
              razaoSocialCliente: item['Razão Social Cliente'] || 'N/A',
              cnpj: item['CNPJ Cliente'] || 'N/A',
              cnpjCliente: item['CNPJ Cliente'] || 'N/A',
              endereco: 'Endereço não informado',
              status: 'Ativa'
            }, idx);
          });

          setUsinas(usinasFormatadas);
          try {
            localStorage.setItem(USINAS_STORAGE_KEY, JSON.stringify(usinasFormatadas));
          } catch {}
        }
      }

      setSyncConfig((prev) => ({
        ...prev,
        syncStatus: 'success',
        lastSyncTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      }));
    } catch (err) {
      console.error('Falha ao carregar dados do Apps Script:', err);
      setSyncConfig((prev) => ({ ...prev, syncStatus: 'error' }));
    }
  }, [APPS_SCRIPT_WEBAPP_URL]);

  useEffect(() => {
    performSyncNow();
  }, [performSyncNow]);

  // Função para salvar alterações no Google Sheets
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
