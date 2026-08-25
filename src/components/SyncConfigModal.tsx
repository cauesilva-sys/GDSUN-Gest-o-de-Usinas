import React, { useState } from 'react';
import { SyncConfig } from '../types';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  Upload, 
  Link2, 
  Sparkles, 
  HelpCircle,
  RotateCcw
} from 'lucide-react';

interface SyncConfigModalProps {
  syncConfig: SyncConfig;
  setSyncConfig: React.Dispatch<React.SetStateAction<SyncConfig>>;
  onSyncNow: () => void;
  onImportCsvText: (text: string, targetTab: 'usinas' | 'provedores') => void;
  onResetToDefaults: () => void;
}

export const SyncConfigModal: React.FC<SyncConfigModalProps> = ({
  syncConfig,
  setSyncConfig,
  onSyncNow,
  onImportCsvText,
  onResetToDefaults,
}) => {
  const [pastedCsv, setPastedCsv] = useState<string>('');
  const [pasteTarget, setPasteTarget] = useState<'usinas' | 'provedores'>('usinas');
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [importedMessage, setImportedMessage] = useState<string | null>(null);

  const handleSaveUrls = (e: React.FormEvent) => {
    e.preventDefault();
    onSyncNow();
  };

  const handlePasteSubmit = () => {
    if (!pastedCsv.trim()) return;
    onImportCsvText(pastedCsv, pasteTarget);
    setPastedCsv('');
    setImportedMessage(`Dados de ${pasteTarget === 'usinas' ? 'Usinas/Concessionárias' : 'Provedores'} importados com sucesso!`);
    setTimeout(() => setImportedMessage(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header Banner - Light Mode Purple Accent */}
      <div className="bg-gradient-to-r from-purple-50 via-white to-indigo-50 border border-purple-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-6 h-6 text-purple-700" />
              <h2 className="text-xl font-extrabold text-purple-950">Sincronização com Google Sheets</h2>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl font-medium leading-relaxed">
              Conecte suas planilhas do Google Sheets para que qualquer alteração feita no Sheets seja refletida automaticamente neste painel em tempo real.
            </p>
          </div>

          <button
            onClick={() => setShowGuide(!showGuide)}
            className="inline-flex items-center gap-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold px-3.5 py-2 rounded-xl border border-purple-300 transition-all shrink-0"
          >
            <HelpCircle className="w-4 h-4 text-purple-700" />
            <span>{showGuide ? 'Ocultar Guia' : 'Como publicar no Google Sheets?'}</span>
          </button>
        </div>

        {/* Step-by-Step Instructions */}
        {showGuide && (
          <div className="mt-4 pt-4 border-t border-purple-200 bg-white/80 rounded-xl p-4 text-xs text-slate-700 space-y-2">
            <h4 className="font-extrabold text-purple-900 text-sm">Passo a Passo para obter a URL do Google Sheets:</h4>
            <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-slate-700 font-medium">
              <li>No seu Google Sheets, vá no menu principal: <strong>Arquivo → Compartilhar → Publicar na Web</strong>.</li>
              <li>Selecione a aba desejada (ex: <em>Informações Gerais</em> ou <em>Provedores</em>).</li>
              <li>No tipo de exportação, troque de <em>"Página da Web"</em> para <strong>"Valores Separados por Vírgula (.csv)"</strong>.</li>
              <li>Clique em <strong>Publicar</strong> e copie o link gerado.</li>
              <li>Cole o link no campo correspondente abaixo e ative a atualização automática!</li>
            </ol>
          </div>
        )}
      </div>

      {/* Main Settings Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Box 1: Google Sheets Links & Interval */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Link2 className="w-5 h-5 text-purple-600" />
            <h3 className="font-extrabold text-slate-900 text-sm">Links de Sincronização Automática</h3>
          </div>

          <form onSubmit={handleSaveUrls} className="space-y-4 text-xs">
            
            {/* Sheet URL Usinas */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">
                URL CSV: Informações Gerais (Usinas & Concessionárias)
              </label>
              <input
                type="url"
                value={syncConfig.sheetsUrlUsinas || ''}
                onChange={(e) =>
                  setSyncConfig((prev) => ({ ...prev, sheetsUrlUsinas: e.target.value }))
                }
                placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white"
              />
            </div>

            {/* Sheet URL Provedores */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 block">
                URL CSV: Provedores de Internet
              </label>
              <input
                type="url"
                value={syncConfig.sheetsUrlProvedores || ''}
                onChange={(e) =>
                  setSyncConfig((prev) => ({ ...prev, sheetsUrlProvedores: e.target.value }))
                }
                placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white"
              />
            </div>

            {/* Auto Sync Toggle & Timer */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncConfig.autoSyncEnabled}
                    onChange={(e) =>
                      setSyncConfig((prev) => ({ ...prev, autoSyncEnabled: e.target.checked }))
                    }
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Ativar Sincronização Automática</span>
                </label>
              </div>

              {syncConfig.autoSyncEnabled && (
                <div className="flex items-center justify-between bg-purple-50/60 p-3 rounded-xl border border-purple-200">
                  <span className="text-purple-900 font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-700" />
                    Frequência de Atualização:
                  </span>
                  <select
                    value={syncConfig.syncIntervalMinutes}
                    onChange={(e) =>
                      setSyncConfig((prev) => ({
                        ...prev,
                        syncIntervalMinutes: parseFloat(e.target.value),
                      }))
                    }
                    className="bg-white border border-purple-300 text-purple-950 font-bold text-xs rounded-lg px-2.5 py-1 focus:outline-none"
                  >
                    <option value={0.5}>A cada 30 segundos</option>
                    <option value={1}>A cada 1 minuto</option>
                    <option value={5}>A cada 5 minutos</option>
                    <option value={15}>A cada 15 minutos</option>
                  </select>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncConfig.syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                <span>Salvar & Sincronizar Agora</span>
              </button>
            </div>

          </form>
        </div>

        {/* Box 2: Manual Import / Reset to Default Prompt Data */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Upload className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-slate-900 text-sm">Importação Manual / Colar CSV</h3>
            </div>

            {importedMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{importedMessage}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="flex items-center space-x-3">
                <span className="text-slate-700 font-bold">Destino:</span>
                <label className="flex items-center space-x-1 cursor-pointer text-slate-800 font-semibold">
                  <input
                    type="radio"
                    name="target"
                    checked={pasteTarget === 'usinas'}
                    onChange={() => setPasteTarget('usinas')}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span>Informações Gerais</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer text-slate-800 font-semibold">
                  <input
                    type="radio"
                    name="target"
                    checked={pasteTarget === 'provedores'}
                    onChange={() => setPasteTarget('provedores')}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span>Provedores Internet</span>
                </label>
              </div>

              <textarea
                rows={5}
                value={pastedCsv}
                onChange={(e) => setPastedCsv(e.target.value)}
                placeholder="Cole o conteúdo CSV copiado do seu Excel ou Google Sheets aqui..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 placeholder-slate-400 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white"
              />

              <button
                onClick={handlePasteSubmit}
                disabled={!pastedCsv.trim()}
                className="w-full bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-bold py-2 px-4 rounded-xl border border-slate-300 transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Processar & Carregar Dados</span>
              </button>
            </div>
          </div>

          {/* Reset to initial dataset button */}
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                if (confirm('Deseja restaurar a base de dados padrão fornecida no seu arquivo original?')) {
                  onResetToDefaults();
                  setImportedMessage('Base restaurada para o padrão inicial fornecido com sucesso!');
                  setTimeout(() => setImportedMessage(null), 4000);
                }
              }}
              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-800 hover:text-rose-950 text-xs font-bold py-2 px-3 rounded-xl border border-rose-200 transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Base de Dados Padrão (2026)</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
