import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ConcessionariasView } from './components/ConcessionariasView';
import { ProvedoresView } from './components/ProvedoresView';
import { SyncConfigModal } from './components/SyncConfigModal';
import { ResumoMetricsView } from './components/ResumoMetricsView';
import { initialUsinas, initialProvedores } from './data/initialData';
import { UsinaConcessionaria, ProvedorInternet, SyncConfig, ActiveTab } from './types';
import { parseUsinasCsv, parseProvedoresCsv, formatGoogleSheetsExportUrl } from './utils/csvParser';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('concessionarias');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUsinaFilter, setSelectedUsinaFilter] = useState<string>('TODAS');

  const USINAS_VERSION = 'v128_caracara_ufvs';

  // Local storage loaded state with fallbacks to prompt's initial data
  const [usinas, setUsinas] = useState<UsinaConcessionaria[]>(() => {
    try {
      const savedVersion = localStorage.getItem('gdsun_usinas_version');
      const saved = localStorage.getItem('gdsun_usinas');
      if (saved && savedVersion === USINAS_VERSION) {
        return JSON.parse(saved);
      }
      localStorage.setItem('gdsun_usinas_version', USINAS_VERSION);
      localStorage.setItem('gdsun_usinas', JSON.stringify(initialUsinas));
      return initialUsinas;
    } catch {
      return initialUsinas;
    }
  });

  const PROVEDORES_VERSION = 'v127_cnpjs_provedores';

  const [provedores, setProvedores] = useState<ProvedorInternet[]>(() => {
    try {
      const savedVersion = localStorage.getItem('gdsun_provedores_version');
      const saved = localStorage.getItem('gdsun_provedores');
      if (saved && savedVersion === PROVEDORES_VERSION) {
        return JSON.parse(saved);
      }
      localStorage.setItem('gdsun_provedores_version', PROVEDORES_VERSION);
      localStorage.setItem('gdsun_provedores', JSON.stringify(initialProvedores));
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

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('gdsun_usinas', JSON.stringify(usinas));
  }, [usinas]);

  useEffect(() => {
    localStorage.setItem('gdsun_provedores', JSON.stringify(provedores));
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
            const parsed = parseProvedoresCsv(text);
            if (parsed.length > 0) {
              setProvedores(parsed);
            }
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
      }
    } else {
      const parsed = parseProvedoresCsv(text);
      if (parsed.length > 0) {
        setProvedores(parsed);
      }
    }
  };

  // Reset to prompt initial dataset
  const handleResetToDefaults = () => {
    setUsinas(initialUsinas);
    setProvedores(initialProvedores);
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

        {activeTab === 'sync' && (
          <SyncConfigModal
            syncConfig={syncConfig}
            setSyncConfig={setSyncConfig}
            onSyncNow={performSyncNow}
            onImportCsvText={handleImportCsvText}
            onResetToDefaults={handleResetToDefaults}
          />
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
