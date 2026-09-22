import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ConcessionariasView } from './components/ConcessionariasView';
import { ProvedoresView } from './components/ProvedoresView';
import { ResumoMetricsView } from './components/ResumoMetricsView';
import { initialUsinas, initialProvedores } from './data/initialData';
import { UsinaConcessionaria, ProvedorInternet, SyncConfig, ActiveTab } from './types';
import { parseUsinasCsv, parseProvedoresCsv, formatGoogleSheetsExportUrl } from './utils/csvParser';
import { getProvedorMasterInfo } from './utils/provedoresMasterData';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('concessionarias');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUsinaFilter, setSelectedUsinaFilter] = useState<string>('TODAS');

  // Data storage versioning (upgraded to v5 for Concessionárias Locais: Medidores, Cód. Cliente, UG, Ponto de Referência)
  const USINAS_VERSION = 'v138_gdsun_data_v5_concessionarias_ref';
  const PROVEDORES_VERSION = 'v138_gdsun_data_v5_concessionarias_ref';
  const USINAS_STORAGE_KEY = 'gdsun_usinas_v5';
  const PROVEDORES_STORAGE_KEY = 'gdsun_provedores_v5';

  // Clean legacy cache from previous versions if present
  useEffect(() => {
    try {
      localStorage.removeItem('gdsun_usinas');
      localStorage.removeItem('gdsun_provedores');
      localStorage.removeItem('gdsun_usinas_version');
      localStorage.removeItem('gdsun_provedores_version');
      localStorage.removeItem('gdsun_usinas_v2');
      localStorage.removeItem('gdsun_provedores_v2');
      localStorage.removeItem('gdsun_usinas_version_v2');
      localStorage.removeItem('gdsun_provedores_version_v2');
      localStorage.removeItem('gdsun_usinas_v3');
      localStorage.removeItem('gdsun_provedores_v3');
      localStorage.removeItem('gdsun_usinas_version_v3');
      localStorage.removeItem('gdsun_provedores_version_v3');
      localStorage.removeItem('gdsun_usinas_v4');
      localStorage.removeItem('gdsun_provedores_v4');
      localStorage.removeItem('gdsun_usinas_version_v4');
      localStorage.removeItem('gdsun_provedores_version_v4');
    } catch {
      // ignore
    }
  }, []);

  // Local storage loaded state with fallbacks to prompt's initial data
  const [usinas, setUsinas] = useState<UsinaConcessionaria[]>(() => {
    try {
      const savedVersion = localStorage.getItem('gdsun_usinas_version_v5');
      const saved = localStorage.getItem(USINAS_STORAGE_KEY);
      if (saved && savedVersion === USINAS_VERSION) {
        return JSON.parse(saved);
      }
      localStorage.setItem('gdsun_usinas_version_v5', USINAS_VERSION);
      localStorage.setItem(USINAS_STORAGE_KEY, JSON.stringify(initialUsinas));
      return initialUsinas;
    } catch {
      return initialUsinas;
    }
  });

  const [provedores, setProvedores] = useState<ProvedorInternet[]>(() => {
    try {
      const savedVersion = localStorage.getItem('gdsun_provedores_version_v5');
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
            const isApodi = p.usinaNome.toLowerCase().includes('apodi');
            return {
              ...p,
              razaoSocial: isApodi
                ? 'GDPAR SN PARTICIPACOES EM PROJETOS SOLARES S/A'
                : p.razaoSocial && p.razaoSocial !== 'Pendente'
                ? p.razaoSocial
                : master.razaoSocial,
              cnpj: isApodi
                ? '34.366.520/0029-35'
                : p.cnpj && p.cnpj !== 'Pendente'
                ? p.cnpj
                : master.cnpj,
              tipoConexao: p.tipoConexao || master.tipoConexao || 'Fibra',
            };
          });
      }
      localStorage.setItem('gdsun_provedores_version_v5', PROVEDORES_VERSION);
      localStorage.setItem(PROVEDORES_STORAGE_KEY, JSON.stringify(initialProvedores));
      return initialProvedores;
    } catch {
      return initialProvedores;
    }
  });

  const DEFAULT_USINAS_URL = 'https://docs.google.com/spreadsheets/d/11yEqEVQveKB-lEKLyT45gCe6FduZL9AKU16uhVlOAW0/edit?gid=0#gid=0';
  const DEFAULT_PROVEDORES_URL = 'https://docs.google.com/spreadsheets/d/11yEqEVQveKB-lEKLyT45gCe6FduZL9AKU16uhVlOAW0/edit?gid=350548087#gid=350548087';

  const [syncConfig, setSyncConfig] = useState<SyncConfig>(() => {
    try {
      const saved = localStorage.getItem('gdsun_sync_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          sheetsUrlUsinas: parsed.sheetsUrlUsinas || DEFAULT_USINAS_URL,
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

  // Ensure title is always set
  useEffect(() => {
    document.title = 'GDSUN Gestão de Usinas';
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(USINAS_STORAGE_KEY, JSON.stringify(usinas));
  }, [usinas]);

  useEffect(() => {
    localStorage.setItem(PROVEDORES_STORAGE_KEY, JSON.stringify(provedores));
  }, [provedores]);

  useEffect(() => {
    localStorage.setItem('gdsun_sync_config', JSON.stringify(syncConfig));
  }, [syncConfig]);

  // Sync execution from Google Sheets
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
      // Sync Usinas if URL provided
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

      // Sync Provedores if URL provided
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

  // Auto-sync Interval Timer & Initial Sync
  useEffect(() => {
    // Perform initial sync on mount if URLs configured
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

  // Handle manual paste / import
  const handleImportCsvText = (text: string, targetTab: 'usinas' | 'provedores') => {
    if (targetTab === 'usinas') {
      const parsed = parseUsinasCsv(text);
      if (parsed.length > 0) {
        setUsinas(parsed);
        try {
          localStorage.setItem(USINAS_STORAGE_KEY, JSON.stringify(parsed));
        } catch {
          // ignore
        }
      }
    } else {
      setProvedores((prev) => {
        const parsed = parseProvedoresCsv(text, prev, usinas);
        if (parsed.length > 0) {
          try {
            localStorage.setItem(PROVEDORES_STORAGE_KEY, JSON.stringify(parsed));
          } catch {
            // ignore
          }
          return parsed;
        }
        return prev;
      });
    }
  };

  // Reset to prompt initial dataset
  const handleResetToDefaults = () => {
    setUsinas(initialUsinas);
    setProvedores(initialProvedores);
    localStorage.removeItem(USINAS_STORAGE_KEY);
    localStorage.removeItem(PROVEDORES_STORAGE_KEY);
    localStorage.removeItem('gdsun_usinas');
    localStorage.removeItem('gdsun_provedores');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased selection:bg-amber-500 selection:text-white">
      
      {/* Top Header Navigation */}
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

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'concessionarias' && (
          <ConcessionariasView 
            usinas={usinas} 
            searchQuery={searchQuery}
            selectedUsinaFilter={selectedUsinaFilter}
            setSelectedUsinaFilter={setSelectedUsinaFilter}
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

      {/* Bottom Footer */}
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
