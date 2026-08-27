import React, { useState, useMemo } from 'react';
import { UsinaConcessionaria } from '../types';
import { parseContacts } from '../utils/whatsapp';
import { exportUsinasToExcel } from '../utils/excelExporter';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Copy, 
  Check, 
  ExternalLink, 
  Hash, 
  FileText, 
  Filter, 
  LayoutGrid, 
  ListFilter, 
  MessageSquareCode,
  Globe,
  Sparkles,
  Mail,
  FileSpreadsheet
} from 'lucide-react';

interface ConcessionariasViewProps {
  usinas: UsinaConcessionaria[];
  searchQuery: string;
  selectedUsinaFilter: string;
  setSelectedUsinaFilter: (usina: string) => void;
}

export const ConcessionariasView: React.FC<ConcessionariasViewProps> = ({ 
  usinas, 
  searchQuery,
  selectedUsinaFilter,
  setSelectedUsinaFilter
}) => {
  const [selectedUf, setSelectedUf] = useState<string>('TODAS');
  const [selectedDisCo, setSelectedDisCo] = useState<string>('TODAS');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // List of unique Usinas for filter dropdown
  const uniqueUsinas = useMemo(() => {
    const set = new Set<string>();
    usinas.forEach((u) => {
      if (u.usina) set.add(u.usina);
    });
    return ['TODAS', ...Array.from(set).sort()];
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

  // List of UFs for filter dropdown
  const ufs = useMemo(() => {
    const set = new Set<string>();
    usinas.forEach((u) => {
      if (u.uf) set.add(u.uf);
    });
    return ['TODAS', ...Array.from(set).sort()];
  }, [usinas]);

  // List of Concessionarias (DisCo) for filter dropdown
  const disCos = useMemo(() => {
    const set = new Set<string>();
    usinas.forEach((u) => {
      if (u.concessionaria) set.add(u.concessionaria);
    });
    return ['TODAS', ...Array.from(set).sort()];
  }, [usinas]);

  // Filter usinas by Usina, UF, DisCo and search query
  const filteredUsinas = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return usinas.filter((item) => {
      const matchUsina = selectedUsinaFilter === 'TODAS' || 
        item.usina === selectedUsinaFilter ||
        item.id === selectedUsinaFilter ||
        item.usina.toLowerCase().trim() === selectedUsinaFilter.toLowerCase().trim();
      const matchUf = selectedUf === 'TODAS' || item.uf === selectedUf;
      const matchDisCo = selectedDisCo === 'TODAS' || item.concessionaria === selectedDisCo;

      if (!matchUsina || !matchUf || !matchDisCo) return false;

      if (!query) return true;

      return (
        item.usina.toLowerCase().includes(query) ||
        (item.siglaAntiga && item.siglaAntiga.toLowerCase().includes(query)) ||
        (item.siglaNova && item.siglaNova.toLowerCase().includes(query)) ||
        item.concessionaria.toLowerCase().includes(query) ||
        item.razaoSocial.toLowerCase().includes(query) ||
        item.cnpj.toLowerCase().includes(query) ||
        item.codigoInstalacaoUG.toLowerCase().includes(query) ||
        (item.medidor && item.medidor.toLowerCase().includes(query)) ||
        item.codigoCliente?.toLowerCase().includes(query) ||
        item.contatoDisCo.toLowerCase().includes(query) ||
        item.endereco.toLowerCase().includes(query)
      );
    });
  }, [usinas, searchQuery, selectedUsinaFilter, selectedUf, selectedDisCo]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatFichaUsina = (u: UsinaConcessionaria): string => {
    const lines = [
      `USINA: ${u.usina}${(u.siglaNova || u.siglaAntiga) ? ` (${u.siglaNova || u.siglaAntiga})` : ''} - ${u.uf}`,
      `CONCESSIONÁRIA: ${u.concessionaria || 'Não informada'}`,
      '',
      `DADOS CADASTRAIS`,
      `INSTALAÇÃO UG: ${u.codigoInstalacaoUG || 'N/A'}`,
      `MEDIDOR: ${u.medidor || 'N/A'}`,
      `CÓD. CLIENTE: ${u.codigoCliente && u.codigoCliente !== 'N/A' ? u.codigoCliente : 'N/A'}`,
      '',
      `RAZÃO SOCIAL & CNPJ`,
      `Razão Social: ${u.razaoSocial || 'Pendente'}`,
      `CNPJ: ${u.cnpj || 'Pendente'}`,
      '',
      `AGENTE DE RELACIONAMENTO / CONTATOS`,
      `Contato: ${u.contatoDisCo || 'N/A'}${u.whatsappDisCo ? `\nWhatsApp DisCo: ${u.whatsappDisCo}` : ''}`,
      '',
      `ENDEREÇO DA USINA`,
      `Endereço: ${u.endereco || 'Endereço não informado'}`
    ];

    if (u.googleMapsUrl) {
      lines.push('', `LOCALIZAÇÃO GOOGLE MAPS`, `${u.googleMapsUrl}`);
    }

    return lines.join('\n');
  };

  return (
    <div className="space-y-6">
      
      {/* Filter Bar - Light Theme */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-amber-600" />
            <span>Filtros da Tabela:</span>
          </div>

          {/* DEDICATED USINA FILTER */}
          <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-300 rounded-xl px-2.5 py-1.5">
            <Building2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <label className="text-xs font-bold text-amber-900">Apenas Usina:</label>
            <select
              value={selectedUsinaFilter}
              onChange={(e) => setSelectedUsinaFilter(e.target.value)}
              className="bg-transparent text-amber-950 font-semibold text-xs focus:outline-none cursor-pointer max-w-[220px]"
            >
              {uniqueUsinas.map((u) => {
                const sigla = usinaSiglaMap.get(u);
                const label = u === 'TODAS' ? 'Todas as Usinas' : (sigla ? `${u} (${sigla})` : u);
                return (
                  <option key={u} value={u} className="bg-white text-slate-900">
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* UF Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <label className="text-xs font-semibold text-slate-600">UF:</label>
            <select
              value={selectedUf}
              onChange={(e) => setSelectedUf(e.target.value)}
              className="bg-transparent text-slate-800 text-xs font-medium focus:outline-none cursor-pointer"
            >
              {ufs.map((uf) => (
                <option key={uf} value={uf} className="bg-white text-slate-900">
                  {uf === 'TODAS' ? 'Todas UFs' : uf}
                </option>
              ))}
            </select>
          </div>

          {/* DisCo Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <label className="text-xs font-semibold text-slate-600">Concessionária:</label>
            <select
              value={selectedDisCo}
              onChange={(e) => setSelectedDisCo(e.target.value)}
              className="bg-transparent text-slate-800 text-xs font-medium focus:outline-none cursor-pointer max-w-[180px]"
            >
              {disCos.map((d) => (
                <option key={d} value={d} className="bg-white text-slate-900">
                  {d === 'TODAS' ? 'Todas Concessionárias' : d}
                </option>
              ))}
            </select>
          </div>

          {(selectedUsinaFilter !== 'TODAS' || selectedUf !== 'TODAS' || selectedDisCo !== 'TODAS') && (
            <button
              onClick={() => {
                setSelectedUsinaFilter('TODAS');
                setSelectedUf('TODAS');
                setSelectedDisCo('TODAS');
              }}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        {/* View Mode Toggle & Counter & Export */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 border-t md:border-t-0 border-slate-200 pt-3 md:pt-0">
          <span className="text-xs text-slate-600 font-medium">
            Exibindo <strong className="text-slate-900 font-bold">{filteredUsinas.length}</strong> de {usinas.length} usinas
          </span>

          <button
            onClick={() => exportUsinasToExcel(filteredUsinas)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all hover:shadow cursor-pointer active:scale-95"
            title="Baixar lista de Usinas/Concessionárias em Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Baixar Excel Usinas</span>
          </button>

          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                viewMode === 'table' ? 'bg-white text-amber-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Visualização em Tabela"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Tabela</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                viewMode === 'grid' ? 'bg-white text-amber-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Visualização em Cards"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Table / Grid */}
      {filteredUsinas.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-xs">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Nenhuma usina encontrada</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Tente mudar a busca ou a seleção no filtro de Usinas / Concessionárias.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View - Light Theme */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-100/80 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Usina / UF</th>
                  <th className="py-3.5 px-4">Concessionária (DisCo)</th>
                  <th className="py-3.5 px-4">Dados Cadastrais (Instalação, Medidor, Cód. Cliente)</th>
                  <th className="py-3.5 px-4">Agente de Relacionamento / Contato</th>
                  <th className="py-3.5 px-4">Razão Social & CNPJ</th>
                  <th className="py-3.5 px-4">Endereço da Usina</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredUsinas.map((u) => {
                  const contacts = parseContacts(u.contatoDisCo);
                  const isCopiedUG = copiedId === `ug-${u.id}`;

                  return (
                    <tr key={u.id} className="hover:bg-amber-50/40 transition-colors group">
                      
                      {/* Usina & UF */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-extrabold text-slate-900 group-hover:text-amber-700 transition-colors text-xs flex items-center gap-1.5">
                          <span>{u.usina}{(u.siglaNova || u.siglaAntiga) ? ` (${u.siglaNova || u.siglaAntiga})` : ''}</span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                            {u.uf}
                          </span>
                          <button
                            onClick={() => copyToClipboard(formatFichaUsina(u), `table-card-${u.id}`)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md border border-slate-200 transition-colors"
                            title="Copiar ficha completa da usina"
                          >
                            {copiedId === `table-card-${u.id}` ? (
                              <>
                                <Check className="w-2.5 h-2.5 text-emerald-600" />
                                <span className="text-emerald-700 font-bold">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-2.5 h-2.5 text-slate-500" />
                                <span>Copiar Ficha</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Concessionária */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{u.concessionaria || 'Não informada'}</span>
                        </div>
                      </td>

                      {/* Dados Cadastrais (Instalação, Medidor, Cód. Cliente) */}
                      <td className="py-4 px-4 align-top space-y-1">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 w-fit">
                          <span className="text-[10px] text-slate-500 font-sans uppercase font-bold">Instalação UG:</span>
                          <span>{u.codigoInstalacaoUG || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 w-fit">
                          <span className="text-[10px] text-amber-700 font-sans uppercase font-bold">Medidor:</span>
                          <span>{u.medidor || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/60 w-fit">
                          <span className="text-[10px] text-slate-500 font-sans uppercase font-bold">Cód. Cliente:</span>
                          <span>{u.codigoCliente && u.codigoCliente !== 'N/A' ? u.codigoCliente : 'N/A'}</span>
                        </div>
                      </td>

                      {/* Agente de Relacionamento / Contato Local */}
                      <td className="py-4 px-4 align-top space-y-1">
                        <div className="text-slate-800 text-xs">
                          {u.contatoDisCo ? (
                            <div className="flex flex-col gap-1">
                              {contacts.map((c, idx) => (
                                <a
                                  key={idx}
                                  href={c.url || '#'}
                                  target={c.type === 'whatsapp' || c.type === 'email' ? '_blank' : '_self'}
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-colors w-fit ${
                                    c.type === 'email'
                                      ? 'bg-sky-50 text-sky-900 border-sky-300 hover:bg-sky-100 font-medium'
                                      : c.type === 'whatsapp'
                                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                                      : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
                                  }`}
                                  title={c.type === 'email' ? 'Enviar e-mail ao agente de relacionamento' : undefined}
                                >
                                  {c.type === 'email' && <Mail className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                                  {c.type === 'whatsapp' && <MessageSquareCode className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                                  {c.type === 'phone' && <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                                  <span>{c.label}</span>
                                </a>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Sem e-mail / contato gravado</span>
                          )}
                        </div>
                        {u.whatsappDisCo && (
                          <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-bold">
                            <MessageSquareCode className="w-3 h-3" />
                            <span>Whats DisCo: {u.whatsappDisCo}</span>
                          </div>
                        )}
                      </td>

                      {/* Razao Social & CNPJ */}
                      <td className="py-4 px-4 align-top space-y-1 max-w-xs">
                        <div className="font-bold text-slate-900 text-[11px] leading-tight">
                          {u.razaoSocial || 'Pendente'}
                        </div>
                        <div className="font-mono text-[11px] text-amber-800 font-bold flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span>CNPJ: {u.cnpj || 'Pendente'}</span>
                        </div>
                      </td>

                      {/* Endereço & Google Maps */}
                      <td className="py-4 px-4 align-top space-y-1 max-w-xs">
                        <div className="text-slate-700 text-[11px] leading-snug line-clamp-2 font-medium" title={u.endereco}>
                          {u.endereco || 'Endereço não cadastrado'}
                        </div>
                        {u.googleMapsUrl && (
                          <a
                            href={u.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-sky-700 font-bold hover:text-sky-900 hover:underline"
                          >
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>Ver no Google Maps</span>
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
          {filteredUsinas.map((u) => {
            const contacts = parseContacts(u.contatoDisCo);

            return (
              <div
                key={u.id}
                className="bg-white border border-slate-200 hover:border-amber-400 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all group"
              >
                <div>
                  {/* Card Header */}
                  <div className="border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs font-extrabold px-2 py-0.5 rounded-md">
                        {u.uf}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-sm group-hover:text-amber-700 transition-colors">
                        {u.usina}{(u.siglaNova || u.siglaAntiga) ? ` (${u.siglaNova || u.siglaAntiga})` : ''}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600 flex items-center gap-1 mt-1 font-semibold">
                      <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{u.concessionaria}</span>
                    </p>
                  </div>

                  {/* Body Fields */}
                  <div className="pt-3 space-y-3 text-xs">
                    
                    {/* Dados Cadastrais */}
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 space-y-1">
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                        <Hash className="w-3 h-3 text-amber-600" />
                        <span>Dados Cadastrais</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1 text-[11px] font-mono pt-0.5">
                        <div className="flex justify-between items-center bg-white px-2 py-1 rounded-md border border-slate-200/80">
                          <span className="text-slate-500 font-sans text-[10px] uppercase font-bold">Instalação UG:</span>
                          <span className="font-bold text-slate-900">{u.codigoInstalacaoUG || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center bg-amber-50/80 px-2 py-1 rounded-md border border-amber-200/80">
                          <span className="text-amber-800 font-sans text-[10px] uppercase font-bold">Medidor:</span>
                          <span className="font-extrabold text-amber-900">{u.medidor || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white px-2 py-1 rounded-md border border-slate-200/80">
                          <span className="text-slate-500 font-sans text-[10px] uppercase font-bold">Cód. Cliente:</span>
                          <span className="font-bold text-slate-800">{u.codigoCliente && u.codigoCliente !== 'N/A' ? u.codigoCliente : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Razao Social & CNPJ */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1">
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                        Razão Social & CNPJ
                      </div>
                      <div className="font-bold text-slate-900 text-xs leading-snug">
                        {u.razaoSocial || 'Pendente'}
                      </div>
                      <div className="font-mono text-[11px] text-amber-800 font-extrabold">
                        CNPJ: {u.cnpj || 'Pendente'}
                      </div>
                    </div>

                    {/* Contatos Local DisCo / Agente de Relacionamento */}
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                        <Mail className="w-3 h-3 text-amber-600" />
                        <span>Agente de Relacionamento / Contatos</span>
                      </div>
                      {contacts.length > 0 ? (
                        <div className="flex flex-col gap-1 pt-0.5">
                          {contacts.map((c, idx) => (
                            <a
                              key={idx}
                              href={c.url || '#'}
                              target={c.type === 'whatsapp' || c.type === 'email' ? '_blank' : '_self'}
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors w-fit ${
                                c.type === 'email'
                                  ? 'bg-sky-50 text-sky-900 border-sky-300 hover:bg-sky-100 font-medium'
                                  : c.type === 'whatsapp'
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              {c.type === 'email' && <Mail className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                              {c.type === 'whatsapp' && <MessageSquareCode className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                              {c.type === 'phone' && <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                              <span>{c.label}</span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-xs">Sem e-mail / contato gravado</div>
                      )}
                    </div>

                    {/* Endereço */}
                    <div className="space-y-1 pt-1 border-t border-slate-100">
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-sky-600" />
                        <span>Endereço da Usina</span>
                      </div>
                      <p className="text-slate-700 text-xs leading-relaxed font-medium">
                        {u.endereco || 'Endereço não informado'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {u.googleMapsUrl ? (
                    <a
                      href={u.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sky-700 hover:text-sky-900 text-xs font-bold"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Abrir no Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400 text-xs">Sem link no Maps</span>
                  )}

                  <button
                    onClick={() => copyToClipboard(formatFichaUsina(u), `card-${u.id}`)}
                    className="flex items-center gap-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors font-medium cursor-pointer active:scale-95"
                  >
                    {copiedId === `card-${u.id}` ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-500" />
                        <span>Copiar Ficha</span>
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
