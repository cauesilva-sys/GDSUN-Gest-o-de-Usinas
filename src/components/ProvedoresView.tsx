import React, { useState, useMemo } from 'react';
import { ProvedorInternet, UsinaConcessionaria } from '../types';
import { findAddressForProvedorUsina } from '../utils/addressMatcher';
import { parseContacts } from '../utils/whatsapp';
import { exportProvedoresToExcel } from '../utils/excelExporter';
import { 
  Wifi, 
  MapPin, 
  ExternalLink, 
  Building2, 
  FileText, 
  MessageCircle, 
  Copy, 
  Check, 
  Filter, 
  Radio, 
  Globe, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  LayoutGrid,
  ListFilter,
  FileSpreadsheet
} from 'lucide-react';

interface ProvedoresViewProps {
  provedores: ProvedorInternet[];
  usinas: UsinaConcessionaria[];
  searchQuery: string;
  selectedUsinaFilter: string;
  setSelectedUsinaFilter: (usina: string) => void;
}

export const ProvedoresView: React.FC<ProvedoresViewProps> = ({ 
  provedores, 
  usinas, 
  searchQuery,
  selectedUsinaFilter,
  setSelectedUsinaFilter
}) => {
  const [selectedTipo, setSelectedTipo] = useState<string>('TODOS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // List of unique Usinas across provedores for filter dropdown
  const uniqueUsinasProvedores = useMemo(() => {
    const set = new Set<string>();
    provedores.forEach((p) => {
      if (p.usinaNome) set.add(p.usinaNome);
    });
    return ['TODAS', ...Array.from(set).sort()];
  }, [provedores]);

  // Map usina names to sigla for Provedores filter and headers
  const usinaSiglaMap = useMemo(() => {
    const map = new Map<string, string>();
    usinas.forEach((u) => {
      if (u.usina) {
        const sigla = u.siglaAntiga || u.siglaNova || '';
        if (sigla) {
          map.set(u.usina.toLowerCase(), sigla);
        }
      }
    });
    return map;
  }, [usinas]);

  // Connection types dropdown
  const tiposConexao = useMemo(() => {
    const set = new Set<string>();
    provedores.forEach((p) => {
      if (p.tipoConexao) set.add(p.tipoConexao);
    });
    return ['TODOS', ...Array.from(set).sort()];
  }, [provedores]);

  // Enrich provedores with auto-matched addresses from Informações Gerais
  const enrichedProvedores = useMemo(() => {
    return provedores.map((p) => {
      const match = findAddressForProvedorUsina(p.usinaNome, usinas);
      return {
        ...p,
        enderecoUsina: match.endereco,
        ufUsina: match.uf,
        googleMapsUrl: match.googleMapsUrl,
        usinaMatchedName: match.usinaMatchedName
      };
    });
  }, [provedores, usinas]);

  // Filtered provedores
  const filteredProvedores = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return enrichedProvedores.filter((item) => {
      const matchUsina = selectedUsinaFilter === 'TODAS' || 
        item.usinaNome.toLowerCase().includes(selectedUsinaFilter.toLowerCase()) ||
        (item.usinaMatchedName && item.usinaMatchedName.toLowerCase() === selectedUsinaFilter.toLowerCase());

      const matchTipo = selectedTipo === 'TODOS' || item.tipoConexao === selectedTipo;
      const matchStatus = selectedStatus === 'TODOS' || item.status === selectedStatus;

      if (!matchUsina || !matchTipo || !matchStatus) return false;

      if (!query) return true;

      return (
        item.usinaNome.toLowerCase().includes(query) ||
        item.provedor.toLowerCase().includes(query) ||
        item.razaoSocial.toLowerCase().includes(query) ||
        item.cnpj.toLowerCase().includes(query) ||
        item.contatoProvedor.toLowerCase().includes(query) ||
        (item.enderecoUsina && item.enderecoUsina.toLowerCase().includes(query))
      );
    });
  }, [enrichedProvedores, searchQuery, selectedUsinaFilter, selectedTipo, selectedStatus]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'OK':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" /> OK
          </span>
        );
      case 'ATENÇÃO':
      case 'ATENCAO':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
            <AlertTriangle className="w-3 h-3 text-amber-700" /> ATENÇÃO
          </span>
        );
      case 'CRÍTICO':
      case 'CRITICO':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
            <XCircle className="w-3 h-3 text-rose-700" /> CRÍTICO
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 border border-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
            {status || 'OK'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Filter Bar - Light Theme */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-sky-600" />
            <span>Filtros Provedores:</span>
          </div>

          {/* DEDICATED USINA FILTER FOR PROVEDORES */}
          <div className="flex items-center space-x-1.5 bg-sky-50 border border-sky-300 rounded-xl px-2.5 py-1.5">
            <Building2 className="w-3.5 h-3.5 text-sky-700 shrink-0" />
            <label className="text-xs font-bold text-sky-900">Apenas Usina:</label>
            <select
              value={selectedUsinaFilter}
              onChange={(e) => setSelectedUsinaFilter(e.target.value)}
              className="bg-transparent text-sky-950 font-semibold text-xs focus:outline-none cursor-pointer max-w-[220px]"
            >
              {uniqueUsinasProvedores.map((u) => {
                const sigla = usinaSiglaMap.get(u.toLowerCase());
                const label = u === 'TODAS' ? 'Todas as Usinas' : (sigla ? `${u} (${sigla})` : u);
                return (
                  <option key={u} value={u} className="bg-white text-slate-900">
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Tipo de Conexão Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <label className="text-xs font-semibold text-slate-600">Tipo Conexão:</label>
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="bg-transparent text-slate-800 text-xs font-medium focus:outline-none cursor-pointer"
            >
              {tiposConexao.map((t) => (
                <option key={t} value={t} className="bg-white text-slate-900">
                  {t === 'TODOS' ? 'Todos os Tipos' : t}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <label className="text-xs font-semibold text-slate-600">Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-slate-800 text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="OK">OK</option>
              <option value="ATENÇÃO">ATENÇÃO</option>
              <option value="CRÍTICO">CRÍTICO</option>
            </select>
          </div>

          {(selectedUsinaFilter !== 'TODAS' || selectedTipo !== 'TODOS' || selectedStatus !== 'TODOS') && (
            <button
              onClick={() => {
                setSelectedUsinaFilter('TODAS');
                setSelectedTipo('TODOS');
                setSelectedStatus('TODOS');
              }}
              className="text-xs font-bold text-sky-700 hover:text-sky-900 bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-200 transition-colors"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        {/* Counter and View Mode Toggle & Export */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 border-t md:border-t-0 border-slate-200 pt-3 md:pt-0">
          <span className="text-xs text-slate-600 font-medium">
            Exibindo <strong className="text-sky-700 font-bold">{filteredProvedores.length}</strong> de {provedores.length} provedores
          </span>

          <button
            onClick={() => exportProvedoresToExcel(filteredProvedores, usinas)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all hover:shadow cursor-pointer active:scale-95"
            title="Baixar lista de Provedores em Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Baixar Excel Provedores</span>
          </button>

          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                viewMode === 'table' ? 'bg-white text-sky-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Tabela</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                viewMode === 'grid' ? 'bg-white text-sky-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table / Grid View */}
      {filteredProvedores.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-xs">
          <Wifi className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Nenhum provedor de internet encontrado</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Tente mudar a busca ou a seleção no filtro de Usinas / Provedores.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View - Light Theme */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-100/80 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Usina</th>
                  <th className="py-3.5 px-4">Provedor & Conexão</th>
                  <th className="py-3.5 px-4">Contato Provedor (Col. C)</th>
                  <th className="py-3.5 px-4">Razão Social & CNPJ</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Endereço da Usina (Mapeado)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredProvedores.map((p) => {
                  const contacts = parseContacts(p.contatoProvedor);

                  return (
                    <tr key={p.id} className="hover:bg-sky-50/40 transition-colors group">
                      
                      {/* Usina */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-extrabold text-slate-900 group-hover:text-sky-700 transition-colors text-xs">
                          {p.usinaNome}{usinaSiglaMap.get(p.usinaNome.toLowerCase()) ? ` (${usinaSiglaMap.get(p.usinaNome.toLowerCase())})` : ''}
                        </div>
                        {p.ufUsina && p.ufUsina !== '-' && (
                          <span className="inline-block mt-1 bg-sky-100 text-sky-800 border border-sky-300 text-[10px] font-extrabold px-1.5 py-0.2 rounded-md">
                            {p.ufUsina}
                          </span>
                        )}
                      </td>

                      {/* Nome do Provedor & Tipo */}
                      <td className="py-4 px-4 align-top space-y-1">
                        <div className="font-bold text-sky-900 text-xs flex items-center gap-1.5">
                          <Wifi className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span>{p.provedor || 'Provedor Local'}</span>
                        </div>
                        <div className="inline-flex items-center gap-1 text-[10px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                          <Radio className="w-2.5 h-2.5 text-sky-600" />
                          <span>{p.tipoConexao || 'Fibra'}</span>
                        </div>
                      </td>

                      {/* Contato Provedor (Botão WhatsApp direto) */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1.5">
                          {contacts.length > 0 ? (
                            contacts.map((c, idx) => (
                              <div key={idx} className="flex flex-col gap-1">
                                {c.type === 'whatsapp' || c.url?.includes('wa.me') ? (
                                  <a
                                    href={c.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs transition-all hover:scale-105 w-fit"
                                    title="Clique para chamar no WhatsApp imediatamente"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5 fill-current shrink-0" />
                                    <span>Chamar no WhatsApp ({c.label})</span>
                                  </a>
                                ) : (
                                  <a
                                    href={c.url || '#'}
                                    className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-2.5 py-1 rounded-lg border border-slate-200 transition-colors w-fit"
                                  >
                                    <span>{c.label}</span>
                                  </a>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-slate-400 italic text-xs">Sem contato cadastrado</div>
                          )}
                        </div>
                      </td>

                      {/* Razao Social & CNPJ */}
                      <td className="py-4 px-4 align-top space-y-1.5 max-w-xs">
                        <div className="font-bold text-slate-900 text-[11px] leading-tight">
                          {p.razaoSocial || 'Pendente'}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[11px] text-sky-900 font-extrabold flex items-center gap-1 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                            <FileText className="w-3 h-3 text-sky-600 shrink-0" />
                            <span>CNPJ: {p.cnpj || 'Pendente'}</span>
                          </span>
                          {p.cnpj && (
                            <button
                              onClick={() => copyToClipboard(p.cnpj, `cnpj-${p.id}`)}
                              title="Copiar apenas o CNPJ"
                              className="inline-flex items-center gap-0.5 text-[10px] text-slate-600 hover:text-sky-700 font-semibold px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              {copiedId === `cnpj-${p.id}` ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700 font-bold">Copiado</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-slate-400" />
                                  <span>Copiar CNPJ</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 align-top">
                        <div>{getStatusBadge(p.status)}</div>
                      </td>

                      {/* Endereço Puxado da Planilha Informações Gerais */}
                      <td className="py-4 px-4 align-top space-y-1 max-w-xs">
                        <div className="text-slate-700 text-[11px] leading-snug line-clamp-2 font-medium" title={p.enderecoUsina}>
                          {p.enderecoUsina || 'Endereço vinculado pendente'}
                        </div>
                        {p.googleMapsUrl && (
                          <a
                            href={p.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-sky-700 font-bold hover:text-sky-900 hover:underline"
                          >
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>Ver no Maps</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Cards View - Light Theme */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProvedores.map((p) => {
            const contacts = parseContacts(p.contatoProvedor);

            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200 hover:border-sky-400 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-sky-700 transition-colors">
                        {p.usinaNome}{usinaSiglaMap.get(p.usinaNome.toLowerCase()) ? ` (${usinaSiglaMap.get(p.usinaNome.toLowerCase())})` : ''}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-bold text-sky-800 text-xs flex items-center gap-1">
                          <Wifi className="w-3.5 h-3.5 text-sky-600" />
                          {p.provedor || 'Provedor'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] text-slate-500 font-semibold">{p.tipoConexao}</span>
                      </div>
                    </div>

                    <div>{getStatusBadge(p.status)}</div>
                  </div>

                  {/* Card Body */}
                  <div className="pt-3 space-y-3 text-xs">
                    
                    {/* WhatsApp Action Area */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Contato Direto do Provedor</span>
                      </div>

                      {contacts.length > 0 ? (
                        contacts.map((c, idx) => (
                          <a
                            key={idx}
                            href={c.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all shadow-xs"
                          >
                            <MessageCircle className="w-4 h-4 fill-current" />
                            <span>Chamar no WhatsApp ({c.label})</span>
                          </a>
                        ))
                      ) : (
                        <div className="text-slate-400 italic text-xs">Sem número de contato</div>
                      )}
                    </div>

                    {/* Razao Social & CNPJ */}
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                        Razão Social & CNPJ
                      </div>
                      <div className="font-bold text-slate-900 text-xs">
                        {p.razaoSocial || 'Pendente'}
                      </div>
                      <div className="flex items-center justify-between gap-1 pt-0.5">
                        <span className="font-mono text-[11px] text-sky-900 font-extrabold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          CNPJ: {p.cnpj || 'Pendente'}
                        </span>
                        {p.cnpj && (
                          <button
                            onClick={() => copyToClipboard(p.cnpj, `cnpj-card-${p.id}`)}
                            title="Copiar CNPJ"
                            className="inline-flex items-center gap-1 text-[10px] text-slate-600 hover:text-sky-700 font-semibold px-2 py-0.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                          >
                            {copiedId === `cnpj-card-${p.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700 font-bold">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-400" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Endereço Puxado Automaticamente */}
                    <div className="space-y-1 pt-1 border-t border-slate-100">
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-sky-600" />
                          <span>Endereço (Info Gerais)</span>
                        </span>
                        {p.ufUsina && p.ufUsina !== '-' && (
                          <span className="text-sky-800 font-extrabold">{p.ufUsina}</span>
                        )}
                      </div>
                      <p className="text-slate-700 text-xs leading-relaxed font-medium">
                        {p.enderecoUsina || 'Endereço em processamento'}
                      </p>
                    </div>

                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end text-xs">
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `Usina: ${p.usinaNome}\nProvedor: ${p.provedor}\nContato: ${p.contatoProvedor}\nRazão Social: ${p.razaoSocial}\nCNPJ: ${p.cnpj}\nEndereço: ${p.enderecoUsina}`,
                        `prov-${p.id}`
                      )
                    }
                    className="flex items-center gap-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors font-medium"
                  >
                    {copiedId === `prov-${p.id}` ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-500" />
                        <span>Copiar Dados</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
