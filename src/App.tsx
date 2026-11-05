import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ConcessionariasView } from './components/ConcessionariasView';
import { ProvedoresView } from './components/ProvedoresView';
import { ResumoMetricsView } from './components/ResumoMetricsView';
import { initialUsinas, initialProvedores } from './data/initialData';
import { UsinaConcessionaria, ProvedorInternet, SyncConfig, ActiveTab } from './types';
import { 
  parseUsinasCsv, 
  parseProvedoresCsv, 
  formatGoogleSheetsExportUrl,
  mergeReclamacoesDistribuidorasCsv 
} from './utils/csvParser';
import { getProvedorMasterInfo } from './utils/provedoresMasterData';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('concessionarias');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUsinaFilter, setSelectedUsinaFilter] = useState<string>('TODAS');

  // URL do seu Google Apps Script para salvar alterações
  const APPS_SCRIPT_WEBAPP_URL = 'https://script.google.com/a/macros/gdsun.com.br/s/AKfycbzEZOcLjHoS_tP-PiRGWyF0C_Pz1K78vviHI21ds8FUYWjbJ7KYMuay7wBNLU1ZyAeD/exec';

  // URLs oficiais da sua planilha Google Sheets
  const DEFAULT_USINAS_URL = 'https://docs.google.com/spreadsheets/d/1BrlpPTiB1yEkODIvTBpBWKM0h_SMJcywuwH7VWLiTXk/edit?gid=1570514093#gid=1570514093';
  const DEFAULT_PROVEDORES_URL = 'https://docs.google.com/spreadsheets/d/11yEqEVQveKB-lEKLyT45gCe6FduZL9AKU16uhVlOAW0/edit?gid=350548087#gid=350548087';

  const USINAS_VERSION = 'v152_gdsun_sheets_sync';
  const PROVEDORES_VERSION = 'v146_gdsun_data_v11_ituverava_peixe_cadastrais';
  const USINAS_STORAGE_KEY = 'gdsun_usinas_v16';
  const PROVEDORES_STORAGE_KEY = 'gdsun_provedores_v11';

  // Limpeza de caches antigos
  useEffect(() => {
    try {
      localStorage.removeItem('gdsun_usinas_v15');
      localStorage.removeItem('gdsun_usinas_version_v15');
    } catch {
      // ignore
    }
  }, []);

  const [usinas, setUsinas] = useState<UsinaConcessionaria[]>(() => {
    try {
      const savedVersion = localStorage.getItem('gdsun_usinas_version_v16');
      const saved = localStorage.getItem(USINAS_STORAGE_KEY);
      if (saved && savedVersion === USINAS_VERSION) {
        return JSON.parse(saved);
      }
      localStorage.setItem('gdsun_usinas_version_v16', USINAS_VERSION);
      localStorage.setItem(USINAS_STORAGE_KEY, JSON.stringify(initialUsinas));
      return initialUsinas;
    } catch {
      return initialUsinas;
    }
  });

  const [provedores, setProvedores] = useState<ProvedorInternet[]>(() => {
    try {
      const savedVersion = localStorage.getItem('gdsun_provedores_version_v11');
      const saved = localStorage.getItem(PROVEDORES_STORAGE_KEY);
      if (saved && savedVersion === PROVEDORES_VERSION) {
        const list = JSON.parse(saved) as ProvedorInternet[];
        return list
          .filter(
            (p) =>
              !(
                p.usinaNome.toLowerCase().includes('ibotirama') &&
                p.provedor.toLowerCase().includes('embratel')
              )
          )
          .map((p) => {
            const master = getProvedorMasterInfo(p.usinaNome);
            const isItuverava = p.usinaNome.toLowerCase().includes('ituverava');
            return {
              ...p,
              razaoSocial: master.razaoSocial || (p.razaoSocial && p.razaoSocial !== 'Pendente' ? p.razaoSocial : 'Pendente'),
              cnpj: master.cnpj || (p.cnpj && p.cnpj !== 'Pendente' ? p.cnpj : 'Pendente'),
              provedor: isItuverava ? 'Starlink' : (p.provedor || master.provedorPadrao || 'Provedor Local'),
              contatoProvedor: isItuverava ? 'SEM PORTAL' : p.contatoProvedor,
              tipoConexao: isItuverava ? 'Satélite' : (p.tipoConexao || master.tipoConexao || 'Fibra'),
            };
          });
      }
      localStorage.setItem('gdsun_provedores_version_v11', PROVEDORES_VERSION);
      localStorage.setItem(PROVEDORES_STORAGE_KEY, JSON.stringify(initialProvedores));
      return initialProvedores;
    } catch {
      return initialProvedores;
    }
  });

  const [syncConfig, setSyncConfig] = useState<SyncConfig>(() => {
    try {
      const saved = localStorage.getItem('gdsun_sync_config_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          sheetsUrlUsinas: DEFAULT_USINAS_URL,
          sheetsUrlProvedores: parsed.sheetsUrlProvedores || DEFAULT_PROVEDORES_URL
        };
      }
      return {
        sheetsUrlUsinas: DEFAULT_USINAS_URL,
        sheetsUrlProvedores: DEFAULT_PROVEDORES_URL,
        autoSyncEnabled: true,
        syncIntervalMinutes: 5,
        lastSyncTime: '',
        syncStatus: 'idle',
      };
    } catch {
      return {
        sheetsUrlUsinas: DEFAULT_USINAS_URL,
        sheetsUrlProvedores: DEFAULT_PROVEDORES_URL,
        autoSyncEnabled: true,
        syncIntervalMinutes: 5,
        lastSyncTime: '',
        syncStatus: 'idle',
      };
    }
  });

  useEffect(() => {
    document.title = 'GDSUN Gestão de Usinas';
  }, []);

  useEffect(() => {
    localStorage.setItem(USINAS_STORAGE_KEY, JSON.stringify(usinas));
  }, [usinas]);

  useEffect(() => {
    localStorage.setItem(PROVEDORES_STORAGE_KEY, JSON.stringify(provedores));
  }, [provedores]);

  useEffect(() => {
    localStorage.setItem('gdsun_sync_config_v2', JSON.stringify(syncConfig));
  }, [syncConfig]);

  // Sincronização via Leitura do Google Sheets
  const performSyncNow = useCallback(async () => {
    if (!syncConfig.sheetsUrlUsinas && !syncConfig.sheetsUrlProvedores) {
      setSyncConfig((prev) => ({
        ...prev,
        syncStatus: 'idle',
        lastSyncTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      }));
      return;
    }

    setSyncConfig((prev) => ({ ...prev, syncStatus: 'syncing' }));

    try {
      if (syncConfig.sheetsUrlUsinas) {
        const url = formatGoogleSheetsExportUrl(syncConfig.sheetsUrlUsinas);
        const res = await fetch(url);
        if (res.ok) {
          const text = await res.text();
          if (!text.includes('<!DOCTYPE html>') && !text.includes('<html')) {
            const parsed = parseUsinasCsv(text);
            if (parsed.length > 0) {
              setUsinas(parsed);
            }
          }
        }
      }

      if (syncConfig.sheetsUrlProvedores) {
        const url = formatGoogleSheetsExportUrl(syncConfig.sheetsUrlProvedores);
        const res = await fetch(url);
        if (res.ok) {
          const text = await res.text();
          if (!text.includes('<!DOCTYPE html>') && !text.includes('<html')) {
            setProvedores((prevProvedores) => {
              const parsed = parseProvedoresCsv(text, prevProvedores, usinas);
              if (parsed.length > 0) {
                try {
                  localStorage.setItem(PROVEDORES_STORAGE_KEY, JSON.stringify(parsed));
                } catch {
                  // ignore
                }
                return parsed;
              }
              return prevProvedores;
            });
          }
        }
      }

      const nowStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setSyncConfig((prev) => ({
        ...prev,
        syncStatus: 'success',
        lastSyncTime: nowStr,
        errorMessage: undefined,
      }));
    } catch (err) {
      console.error('Error syncing from Google Sheets:', err);
      setSyncConfig((prev) => ({
        ...prev,
        syncStatus: 'error',
        errorMessage: 'Falha ao buscar planilha. Verifique se o link está público.',
      }));
    }
  }, [syncConfig.sheetsUrlUsinas, syncConfig.sheetsUrlProvedores]);

  useEffect(() => {
    if (syncConfig.sheetsUrlUsinas || syncConfig.sheetsUrlProvedores) {
      performSyncNow();
    }

    if (!syncConfig.autoSyncEnabled) return;

    const intervalMs = (syncConfig.syncIntervalMinutes || 1) * 60 * 1000;
    const timer = setInterval(() => {
      performSyncNow();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [syncConfig.autoSyncEnabled, syncConfig.syncIntervalMinutes, performSyncNow]);

  // Função disparada ao salvar alterações no modal de usinas
  const handleUpdateUsinas = async (updatedList: UsinaConcessionaria[]) => {
    // 1. Atualiza a tela imediatamente
    setUsinas(updatedList);
    try {
      localStorage.setItem(USINAS_STORAGE_KEY, JSON.stringify(updatedList));
    } catch {
      // ignore
    }

    // 2. Localiza qual usina foi alterada comparando com o estado anterior
    const itemModificado = updatedList.find((novaUsina, index) => {
      const usinaAntiga = usinas[index];
      if (!usinaAntiga) return false;
      return (
        novaUsina.razaoSocial !== usinaAntiga.razaoSocial ||
        novaUsina.cnpj !== usinaAntiga.cnpj ||
        novaUsina.codigoCliente !== usinaAntiga.codigoCliente ||
        novaUsina.instalacaoAntiga !== usinaAntiga.instalacaoAntiga ||
        novaUsina.instalacaoNova !== usinaAntiga.instalacaoNova ||
        novaUsina.medidor !== usinaAntiga.medidor
      );
    });

    if (!itemModificado) return;

    // Encontra o índice correspondente na planilha (adiciona 2 para cabeçalho)
    const indexNaLista = updatedList.findIndex(
      (u) => (u.id && u.id === itemModificado.id) || u.nome === itemModificado.nome
    );
    const rowIndex = indexNaLista !== -1 ? indexNaLista + 2 : 2;

    try {
      // Envia os dados para a URL do seu Google Apps Script
      await fetch(APPS_SCRIPT_WEBAPP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          _rowIndex: rowIndex,
          razaoSocial: itemModificado.razaoSocial || '',
          cnpj: itemModificado.cnpj || '',
          codigoCliente: itemModificado.codigoCliente || '',
          instalacaoAntiga: itemModificado.instalacaoAntiga || '',
          instalacaoNova: itemModificado.instalacaoNova || '',
          medidor: itemModificado.medidor || ''
        })
      });
      console.log('Dados sincronizados com o Google Sheets na linha:', rowIndex);
    } catch (err) {
      console.error('Erro ao enviar dados para a planilha:', err);
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

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 space-y-1 shadow-inner">
        <p className="font-semibold text-slate-700">
          GDSUN • Sistema de Gestão de Usinas e Provedores de Internet
        </p>
        <p className="text-slate-500">
          Sincronização com Google Sheets e Mapeamento Inteligente de Endereços
        </p>
      </footer>
    </div>
  );
}
