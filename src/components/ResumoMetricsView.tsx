import React, { useMemo } from 'react';
import { UsinaConcessionaria, ProvedorInternet } from '../types';
import { 
  Building2, 
  Wifi, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  MapPin, 
  Radio, 
  Zap
} from 'lucide-react';

interface ResumoMetricsViewProps {
  usinas: UsinaConcessionaria[];
  provedores: ProvedorInternet[];
}

export const ResumoMetricsView: React.FC<ResumoMetricsViewProps> = ({ usinas, provedores }) => {
  // Compute metrics
  const metrics = useMemo(() => {
    const totalUsinas = usinas.length;
    const totalProvedores = provedores.length;

    // Concessionarias set
    const concessionariasSet = new Set(usinas.map((u) => u.concessionaria).filter(Boolean));
    
    // Status breakdown
    let okCount = 0;
    let atencaoCount = 0;
    let criticoCount = 0;

    provedores.forEach((p) => {
      const st = p.status?.toUpperCase() || 'OK';
      if (st.includes('CRÍ') || st.includes('CRIT')) criticoCount++;
      else if (st.includes('ATEN')) atencaoCount++;
      else okCount++;
    });

    // Connection Type breakdown
    const tipoMap: Record<string, number> = {};
    provedores.forEach((p) => {
      const t = p.tipoConexao || 'Fibra';
      tipoMap[t] = (tipoMap[t] || 0) + 1;
    });

    // UF Breakdown
    const ufMap: Record<string, number> = {};
    usinas.forEach((u) => {
      if (u.uf) ufMap[u.uf] = (ufMap[u.uf] || 0) + 1;
    });

    return {
      totalUsinas,
      totalProvedores,
      concessionariasCount: concessionariasSet.size,
      okCount,
      atencaoCount,
      criticoCount,
      tipoMap,
      ufMap,
    };
  }, [usinas, provedores]);

  return (
    <div className="space-y-6">
      
      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Usinas */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Total Usinas Solar</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">{metrics.totalUsinas}</div>
            <span className="text-xs text-amber-800 font-bold mt-1 inline-block">
              {metrics.concessionariasCount} Concessionárias Ativas
            </span>
          </div>
          <div className="bg-amber-100 p-3.5 rounded-2xl border border-amber-300 text-amber-800">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        {/* Total Provedores */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Provedores de Internet</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">{metrics.totalProvedores}</div>
            <span className="text-xs text-sky-800 font-bold mt-1 inline-block">
              Links Rádio, Fibra & Satélite
            </span>
          </div>
          <div className="bg-sky-100 p-3.5 rounded-2xl border border-sky-300 text-sky-800">
            <Wifi className="w-6 h-6" />
          </div>
        </div>

        {/* Status Operacional OK */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Status OK</span>
            <div className="text-3xl font-extrabold text-emerald-700 mt-1">{metrics.okCount}</div>
            <span className="text-xs text-slate-600 font-medium mt-1 inline-block">
              {Math.round((metrics.okCount / (metrics.totalProvedores || 1)) * 100)}% da rede operacional
            </span>
          </div>
          <div className="bg-emerald-100 p-3.5 rounded-2xl border border-emerald-300 text-emerald-800">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Status Crítico / Atenção */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Atenção / Crítico</span>
            <div className="text-3xl font-extrabold text-rose-700 mt-1">
              {metrics.criticoCount + metrics.atencaoCount}
            </div>
            <span className="text-xs text-rose-800 font-bold mt-1 inline-block">
              {metrics.criticoCount} Críticos • {metrics.atencaoCount} Atenção
            </span>
          </div>
          <div className="bg-rose-100 p-3.5 rounded-2xl border border-rose-300 text-rose-800">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Connection Type Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Radio className="w-5 h-5 text-sky-600" />
            <h3 className="font-extrabold text-slate-900 text-sm">Distribuição por Tipo de Conexão</h3>
          </div>

          <div className="space-y-3">
            {Object.entries(metrics.tipoMap).map(([tipo, countVal]) => {
              const count = Number(countVal);
              const percentage = Math.round((count / (metrics.totalProvedores || 1)) * 100);
              return (
                <div key={tipo} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-700 font-semibold">
                    <span>{tipo}</span>
                    <span className="text-sky-800 font-bold">{count} usinas ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                    <div
                      className="bg-gradient-to-r from-sky-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* States Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <MapPin className="w-5 h-5 text-amber-600" />
            <h3 className="font-extrabold text-slate-900 text-sm">Usinas por Estado (UF)</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(metrics.ufMap)
              .sort((a, b) => Number(b[1]) - Number(a[1]))
              .map(([uf, countVal]) => {
                const count = Number(countVal);
                return (
                  <div key={uf} className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 text-center shadow-2xs">
                    <span className="text-lg font-extrabold text-amber-900 block">{uf}</span>
                    <span className="text-xs text-amber-800 font-bold">{count} Usina{count > 1 ? 's' : ''}</span>
                  </div>
                );
              })}
          </div>
        </div>

      </div>
    </div>
  );
};
