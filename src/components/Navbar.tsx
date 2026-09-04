import React, { useMemo } from 'react';
import { ActiveTab, SyncConfig, UsinaConcessionaria } from '../types';
import { GdsunLogo } from './GdsunLogo';
import { 
  Zap,
  Wifi, 
  BarChart3, 
  Search, 
  Building2
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedUsinaFilter: string;
  setSelectedUsinaFilter: (usina: string) => void;
  syncConfig: SyncConfig;
  onRefreshNow: () => void;
  usinas: UsinaConcessionaria[];
  usinaCount: number;
  provedorCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  selectedUsinaFilter,
  setSelectedUsinaFilter,
  syncConfig,
  onRefreshNow,
  usinas,
  usinaCount,
  provedorCount,
}) => {
  // Extract unique Usina names sorted alphabetically
  const uniqueUsinas = useMemo(() => {
    const list = Array.from(new Set(usinas.map((u) => u.usina).filter(Boolean)));
    return ['TODAS', ...list.sort()];
  }, [usinas]);

  // Map of usina name to its sigla for filter dropdown
  const usinaSiglaMap = useMemo(() => {
    const map = new Map<string, string>();
    usinas.forEach((u) => {
      if (u.usina) {
        const sigla = u.siglaAntiga || u.siglaNova || '';
        if (sigla) map.set(u.usina, sigla);
      }
    });
    return map;
  }, [usinas]);

  return (
    <header className="bg-white border-b border-slate-200 text-slate-900 sticky top-0 z-40 shadow-sm">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3.5 gap-3 border-b border-slate-100">
          
          {/* Brand & App Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-slate-50 border border-slate-200 p-1.5 rounded-xl shadow-xs shrink-0 flex items-center justify-center">
              <GdsunLogo className="h-10 w-12" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                GDSUN Gestão de Usinas
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Concessionárias Locais • Provedores de Internet • Mapeamento de Endereços
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs and Filters Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between py-2.5 gap-3">
          
          {/* Main Navigation Tabs */}
          <nav className="flex space-x-1.5 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
            <button
              onClick={() => setActiveTab('concessionarias')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'concessionarias'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Concessionárias Locais</span>
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                activeTab === 'concessionarias' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {usinaCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('provedores')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'provedores'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Wifi className="w-4 h-4" />
              <span>Provedores de Internet</span>
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                activeTab === 'provedores' ? 'bg-sky-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {provedorCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('resumo')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === 'resumo'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Resumo Operacional</span>
            </button>
          </nav>

          {/* Filters Area: Dedicated Usina Filter & General Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            
            {/* Dedicated Usina Selector Dropdown */}
            <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1.5">
              <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
              <label className="text-xs font-bold text-amber-900 shrink-0">Usina:</label>
              <select
                value={selectedUsinaFilter}
                onChange={(e) => setSelectedUsinaFilter(e.target.value)}
                className="bg-transparent text-slate-900 text-xs font-semibold focus:outline-none cursor-pointer max-w-[180px] sm:max-w-[220px] truncate"
              >
                {uniqueUsinas.map((u) => {
                  const sigla = usinaSiglaMap.get(u);
                  const label = u === 'TODAS' ? '✨ Todas as Usinas' : (sigla ? `${u} (${sigla})` : u);
                  return (
                    <option key={u} value={u} className="bg-white text-slate-900">
                      {label}
                    </option>
                  );
                })}
              </select>
              {selectedUsinaFilter !== 'TODAS' && (
                <button
                  onClick={() => setSelectedUsinaFilter('TODAS')}
                  className="text-amber-700 hover:text-amber-900 font-bold text-xs px-1"
                  title="Limpar seleção de Usina"
                >
                  ✕
                </button>
              )}
            </div>

            {/* General Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar usina, CNPJ, razão, 0800..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-7 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
