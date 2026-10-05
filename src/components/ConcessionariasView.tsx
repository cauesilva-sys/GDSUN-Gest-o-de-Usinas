import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { UsinaConcessionaria } from '../types';
import { parseContacts } from '../utils/whatsapp';
import { exportUsinasToExcel } from '../utils/excelExporter';
import { mergeReclamacoesDistribuidorasCsv, ReclamacoesImportResult } from '../utils/csvParser';
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
  FileSpreadsheet,
  Navigation,
  Upload,
  Pencil,
  X,
  CheckCircle2,
  User,
  AtSign,
  ShieldCheck
} from 'lucide-react';

interface ConcessionariasViewProps {
  usinas: UsinaConcessionaria[];
  searchQuery: string;
  selectedUsinaFilter: string;
  setSelectedUsinaFilter: (usina: string) => void;
  onUpdateUsinas?: (updated: UsinaConcessionaria[]) => void;
}

export const ConcessionariasView: React.FC<ConcessionariasViewProps> = ({ 
  usinas, 
  searchQuery,
  selectedUsinaFilter,
  setSelectedUsinaFilter,
  onUpdateUsinas
}) => {
  const [selectedUf, setSelectedUf] = useState<string>('TODAS');
  const [selectedDisCo, setSelectedDisCo] = useState<string>('TODAS');
  const [selectedRazaoFilter, setSelectedRazaoFilter] = useState<string>('TODAS');
  const [selectedEmailFilter, setSelectedEmailFilter] = useState<'TODOS' | 'COM_EMAIL' | 'SEM_EMAIL'>('TODOS');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal states
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importPastedText, setImportPastedText] = useState<string>('');
  const [importResult, setImportResult] = useState<ReclamacoesImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit single usina modal
  const [editingUsina, setEditingUsina] = useState<UsinaConcessionaria | null>(null);
  const [editRazaoSocial, setEditRazaoSocial] = useState<string>('');
  const [editCnpj, setEditCnpj] = useState<string>('');
  const [editAgentName, setEditAgentName] = useState<string>('');
  const [editAgentEmail, setEditAgentEmail] = useState<string>('');
  const [editAgentPhone, setEditAgentPhone] = useState<string>('');

  // Count usinas with agent email
  const usinasWithEmailCount = useMemo(() => {
    return usinas.filter((u) => {
      if (u.emailAgenteRelacionamento && u.emailAgenteRelacionamento.trim() !== '') return true;
      const contacts = parseContacts(u.contatoDisCo);
      return contacts.some((c) => c.type === 'email');
    }).length;
  }, [usinas]);

  // List of unique Usinas for filter dropdown
  const uniqueUsinas = useMemo(() => {
    const set = new Set<string>();
    usinas.forEach((u) => {
      if (u.usina) set.add(u.usina);
    });
    return ['TODAS', ...Array.from(set).sort()];
  }, [usinas]);

  // List of unique Razões Sociais / Clientes
  const uniqueRazoes = useMemo(() => {
    const set = new Set<string>();
    usinas.forEach((u) => {
      if (u.razaoSocial && u.razaoSocial.trim() !== '') {
        set.add(u.razaoSocial.trim());
      }
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

  // Filter usinas by Usina, UF, DisCo, Razão Social, Email Status and search query
  const filteredUsinas = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const queryDigits = query.replace(/\D/g, '');

    return usinas.filter((item) => {
      const matchUsina = selectedUsinaFilter === 'TODAS' || 
        item.usina === selectedUsinaFilter ||
        item.id === selectedUsinaFilter ||
        item.usina.toLowerCase().trim() === selectedUsinaFilter.toLowerCase().trim();
      const matchUf = selectedUf === 'TODAS' || item.uf === selectedUf;
      const matchDisCo = selectedDisCo === 'TODAS' || item.concessionaria === selectedDisCo;
      const matchRazao = selectedRazaoFilter === 'TODAS' || item.razaoSocial === selectedRazaoFilter;

      // Email filter
      const hasEmail = Boolean(
        (item.emailAgenteRelacionamento && item.emailAgenteRelacionamento.trim() !== '') ||
        parseContacts(item.contatoDisCo).some((c) => c.type === 'email')
      );

      if (selectedEmailFilter === 'COM_EMAIL' && !hasEmail) return false;
      if (selectedEmailFilter === 'SEM_EMAIL' && hasEmail) return false;

      if (!matchUsina || !matchUf || !matchDisCo || !matchRazao) return false;

      if (!query) return true;

      const cnpjDigits = (item.cnpj || '').replace(/\D/g, '');
      const matchCnpj = item.cnpj.toLowerCase().includes(query) || (queryDigits.length >= 4 && cnpjDigits.includes(queryDigits));

      return (
        item.usina.toLowerCase().includes(query) ||
        (item.siglaAntiga && item.siglaAntiga.toLowerCase().includes(query)) ||
        (item.siglaNova && item.siglaNova.toLowerCase().includes(query)) ||
        item.concessionaria.toLowerCase().includes(query) ||
        item.razaoSocial.toLowerCase().includes(query) ||
        matchCnpj ||
        item.codigoInstalacaoUG.toLowerCase().includes(query) ||
        (item.medidor && item.medidor.toLowerCase().includes(query)) ||
        item.codigoCliente?.toLowerCase().includes(query) ||
        (item.pontoReferencia && item.pontoReferencia.toLowerCase().includes(query)) ||
        (item.nomeAgenteRelacionamento && item.nomeAgenteRelacionamento.toLowerCase().includes(query)) ||
        (item.emailAgenteRelacionamento && item.emailAgenteRelacionamento.toLowerCase().includes(query)) ||
        item.contatoDisCo.toLowerCase().includes(query) ||
        item.endereco.toLowerCase().includes(query)
      );
    });
  }, [usinas, searchQuery, selectedUsinaFilter, selectedUf, selectedDisCo, selectedRazaoFilter, selectedEmailFilter]);

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
      `RAZÃO SOCIAL & CNPJ`,
      `Razão Social: ${u.razaoSocial || 'Pendente'}`,
      `CNPJ: ${u.cnpj || 'Pendente'}`,
      '',
      `DADOS CADASTRAIS`,
      `INSTALAÇÃO UG: ${u.codigoInstalacaoUG || 'N/A'}`,
      `MEDIDOR: ${u.medidor || 'N/A'}`,
      `CÓD. CLIENTE: ${u.codigoCliente && u.codigoCliente !== 'N/A' ? u.codigoCliente : 'N/A'}`,
      '',
      `AGENTE DE RELACIONAMENTO & CONTATOS`,
      `Agente de Relacionamento: ${u.nomeAgenteRelacionamento || 'Não especificado'}`,
      `E-mail do Agente: ${u.emailAgenteRelacionamento || 'Não cadastrado'}`,
      `Contato / Central DisCo: ${u.contatoDisCo || 'N/A'}${u.whatsappDisCo ? `\nWhatsApp DisCo: ${u.whatsappDisCo}` : ''}`,
      '',
      `ENDEREÇO DA USINA`,
      `Endereço: ${u.endereco || 'Endereço não informado'}`
    ];

    if (u.pontoReferencia && u.pontoReferencia.trim() !== '' && u.pontoReferencia.toUpperCase() !== 'N/A') {
      lines.push(`Ponto de Referência: ${u.pontoReferencia}`);
    }

    if (u.googleMapsUrl) {
      lines.push('', `LOCALIZAÇÃO GOOGLE MAPS`, `${u.googleMapsUrl}`);
    }

    return lines.join('\n');
  };

  // Handle spreadsheet file selected (Excel .xlsx, .xls or .csv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const csvText = XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheet]);
          if (csvText) {
            processSpreadsheetCsv(csvText);
          }
        } catch (err) {
          console.error('Erro ao ler Excel:', err);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          processSpreadsheetCsv(text);
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const processSpreadsheetCsv = (csvText: string) => {
    if (!csvText.trim()) return;
    const res = mergeReclamacoesDistribuidorasCsv(csvText, usinas);
    setImportResult(res);
    if (res.matchedCount > 0 && onUpdateUsinas) {
      onUpdateUsinas(res.updatedUsinas);
    }
  };

  // Open Edit Modal for a single Usina
  const openEditModal = (u: UsinaConcessionaria) => {
    setEditingUsina(u);
    setEditRazaoSocial(u.razaoSocial || '');
    setEditCnpj(u.cnpj || '');
    setEditAgentName(u.nomeAgenteRelacionamento || '');
    
    // Resolve email if not in field but in contatoDisCo
    let emailInitial = u.emailAgenteRelacionamento || '';
    if (!emailInitial) {
      const contacts = parseContacts(u.contatoDisCo);
      const emailContact = contacts.find((c) => c.type === 'email');
      if (emailContact) emailInitial = emailContact.value;
    }
    setEditAgentEmail(emailInitial);
    setEditAgentPhone(u.whatsappDisCo || u.telefoneAgenteRelacionamento || '');
  };

  // Save single usina modifications
  const handleSaveSingleUsina = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUsina || !onUpdateUsinas) return;

    const updated = usinas.map((u) => {
      if (u.id === editingUsina.id) {
        let finalContato = u.contatoDisCo || '';
        const cleanEmail = editAgentEmail.trim();

        if (cleanEmail) {
          if (!finalContato.toLowerCase().includes(cleanEmail.toLowerCase())) {
            finalContato = finalContato ? `${cleanEmail} / ${finalContato}` : cleanEmail;
          }
        }

        return {
          ...u,
          razaoSocial: editRazaoSocial.trim() || u.razaoSocial,
          cnpj: editCnpj.trim() || u.cnpj,
          nomeAgenteRelacionamento: editAgentName.trim() || undefined,
          emailAgenteRelacionamento: cleanEmail || undefined,
          whatsappDisCo: editAgentPhone.trim() || u.whatsappDisCo,
          telefoneAgenteRelacionamento: editAgentPhone.trim() || undefined,
          contatoDisCo: finalContato
        };
      }
      return u;
    });

    onUpdateUsinas(updated);
    setEditingUsina(null);
  };

  return (
    <div className="space-y-6">
      <input
        type="file"
        accept=".xlsx,.xls,.csv,text/csv,text/plain"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Filter and View Mode Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-bold bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-amber-600" />
            <span>Filtros:</span>
          </div>

          {/* Usina Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <label className="text-xs font-semibold text-slate-600">Usina:</label>
            <select
              value={selectedUsinaFilter}
              onChange={(e) => setSelectedUsinaFilter(e.target.value)}
              className="bg-transparent text-slate-800 text-xs font-medium focus:outline-none cursor-pointer max-w-[180px]"
            >
              {uniqueUsinas.map((usinaName) => {
                const sigla = usinaSiglaMap.get(usinaName);
                const display = usinaName === 'TODAS' 
                  ? 'Todas as Usinas' 
                  : sigla ? `${usinaName} (${sigla})` : usinaName;
                return (
                  <option key={usinaName} value={usinaName} className="bg-white text-slate-900">
                    {display}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Razão Social / Cliente Filter */}
          <div className="flex items-center space-x-1.5 bg-amber-50/70 border border-amber-200 rounded-xl px-2.5 py-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <label className="text-xs font-bold text-amber-950">Cliente / Razão Social:</label>
            <select
              value={selectedRazaoFilter}
              onChange={(e) => setSelectedRazaoFilter(e.target.value)}
              className="bg-transparent text-amber-950 text-xs font-semibold focus:outline-none cursor-pointer max-w-[200px]"
            >
              {uniqueRazoes.map((r) => (
                <option key={r} value={r} className="bg-white text-slate-900">
                  {r === 'TODAS' ? 'Todos os Clientes' : r}
                </option>
              ))}
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
              className="bg-transparent text-slate-800 text-xs font-medium focus:outline-none cursor-pointer max-w-[170px]"
            >
              {disCos.map((d) => (
                <option key={d} value={d} className="bg-white text-slate-900">
                  {d === 'TODAS' ? 'Todas Concessionárias' : d}
                </option>
              ))}
            </select>
          </div>

          {/* E-mail Filter */}
          <div className="flex items-center space-x-1.5 bg-sky-50 border border-sky-200 rounded-xl px-2.5 py-1.5">
            <AtSign className="w-3.5 h-3.5 text-sky-700 shrink-0" />
            <label className="text-xs font-bold text-sky-950">E-mail Agente:</label>
            <select
              value={selectedEmailFilter}
              onChange={(e) => setSelectedEmailFilter(e.target.value as any)}
              className="bg-transparent text-sky-950 font-semibold text-xs focus:outline-none cursor-pointer"
            >
              <option value="TODOS" className="bg-white text-slate-900">Todos</option>
              <option value="COM_EMAIL" className="bg-white text-slate-900">Com E-mail ({usinasWithEmailCount})</option>
              <option value="SEM_EMAIL" className="bg-white text-slate-900">Sem E-mail ({usinas.length - usinasWithEmailCount})</option>
            </select>
          </div>

          {(selectedUsinaFilter !== 'TODAS' || selectedUf !== 'TODAS' || selectedDisCo !== 'TODAS' || selectedRazaoFilter !== 'TODAS' || selectedEmailFilter !== 'TODOS') && (
            <button
              onClick={() => {
                setSelectedUsinaFilter('TODAS');
                setSelectedUf('TODAS');
                setSelectedDisCo('TODAS');
                setSelectedRazaoFilter('TODAS');
                setSelectedEmailFilter('TODOS');
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
            title="Baixar lista de Usinas/Concessionárias em Excel (.xlsx) com Razão Social, CNPJ e E-mails"
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
            Tente mudar a busca ou a seleção nos filtros de Usina, Cliente/Razão Social, Concessionária ou E-mail.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-100/80 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Usina / UF</th>
                  <th className="py-3.5 px-4">Razão Social & CNPJ</th>
                  <th className="py-3.5 px-4">Concessionária (DisCo)</th>
                  <th className="py-3.5 px-4">Dados Cadastrais (Instalação, Medidor, Cód. Cliente)</th>
                  <th className="py-3.5 px-4">Agente de Relacionamento (E-mail & Contato)</th>
                  <th className="py-3.5 px-4">Endereço da Usina</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredUsinas.map((u) => {
                  const contacts = parseContacts(u.contatoDisCo);
                  const emailContact = contacts.find((c) => c.type === 'email');
                  const primaryEmail = u.emailAgenteRelacionamento || emailContact?.value || '';

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
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md border border-slate-200 transition-colors cursor-pointer"
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

                      {/* Razão Social & CNPJ */}
                      <td className="py-4 px-4 align-top space-y-1.5 max-w-xs">
                        <div className="font-bold text-slate-900 text-xs leading-snug">
                          {u.razaoSocial || 'Pendente'}
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-amber-900 font-bold bg-amber-50/90 px-2 py-0.5 rounded-md border border-amber-200 w-fit">
                          <FileText className="w-3 h-3 text-amber-700 shrink-0" />
                          <span>CNPJ: {u.cnpj || 'Pendente'}</span>
                          {u.cnpj && (
                            <button
                              onClick={() => copyToClipboard(u.cnpj, `cnpj-${u.id}`)}
                              className="text-slate-400 hover:text-slate-800 ml-1 cursor-pointer"
                              title="Copiar CNPJ"
                            >
                              {copiedId === `cnpj-${u.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                        {onUpdateUsinas && (
                          <button
                            onClick={() => openEditModal(u)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                            title="Editar Razão Social, CNPJ ou Contatos desta usina"
                          >
                            <Pencil className="w-2.5 h-2.5" />
                            <span>Editar Razão / CNPJ</span>
                          </button>
                        )}
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

                      {/* Agente de Relacionamento / E-mail / Contato Local */}
                      <td className="py-4 px-4 align-top space-y-1.5 max-w-xs">
                        
                        {/* Agente Name if available */}
                        {u.nomeAgenteRelacionamento && (
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                            <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>{u.nomeAgenteRelacionamento}</span>
                          </div>
                        )}

                        {/* Dedicated Highlighted Email Badge */}
                        {primaryEmail ? (
                          <div className="bg-sky-50 border border-sky-300/80 rounded-lg p-1.5 text-sky-950 space-y-1 shadow-2xs">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] uppercase tracking-wider font-extrabold text-sky-800 flex items-center gap-1">
                                <Mail className="w-3 h-3 text-sky-600" />
                                <span>E-mail do Agente</span>
                              </span>
                              <div className="flex items-center gap-1">
                                <a
                                  href={`mailto:${primaryEmail}`}
                                  className="text-[10px] font-bold text-sky-700 hover:text-sky-900 bg-white hover:bg-sky-100 px-1.5 py-0.5 rounded border border-sky-200 transition-colors"
                                  title="Enviar e-mail"
                                >
                                  Escrever
                                </a>
                                <button
                                  onClick={() => copyToClipboard(primaryEmail, `email-table-${u.id}`)}
                                  className="text-sky-700 hover:text-sky-950 p-0.5 rounded hover:bg-sky-100 transition-colors cursor-pointer"
                                  title="Copiar e-mail"
                                >
                                  {copiedId === `email-table-${u.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                            <div className="font-mono text-[11px] font-semibold text-slate-900 break-all select-all leading-tight">
                              {primaryEmail}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic flex items-center gap-1">
                            <Mail className="w-3 h-3 opacity-50" />
                            <span>E-mail não cadastrado</span>
                          </div>
                        )}

                        {/* Phone / Whatsapp / Other Contacts */}
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {contacts
                            .filter((c) => c.type !== 'email')
                            .map((c, idx) => (
                              <a
                                key={idx}
                                href={c.url || '#'}
                                target={c.type === 'whatsapp' ? '_blank' : '_self'}
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors ${
                                  c.type === 'whatsapp'
                                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                {c.type === 'whatsapp' && <MessageSquareCode className="w-3 h-3 text-emerald-600 shrink-0" />}
                                {c.type === 'phone' && <Phone className="w-3 h-3 text-slate-500 shrink-0" />}
                                <span>{c.label}</span>
                              </a>
                            ))}
                        </div>

                        {u.whatsappDisCo && (
                          <div className="text-[10px] text-emerald-700 flex items-center gap-1 font-semibold">
                            <MessageSquareCode className="w-3 h-3" />
                            <span>Whats: {u.whatsappDisCo}</span>
                          </div>
                        )}
                      </td>

                      {/* Endereço & Ponto de Referência & Google Maps */}
                      <td className="py-4 px-4 align-top space-y-1.5 max-w-xs">
                        <div className="text-slate-700 text-[11px] leading-snug line-clamp-2 font-medium" title={u.endereco}>
                          {u.endereco || 'Endereço não cadastrado'}
                        </div>
                        {u.pontoReferencia && u.pontoReferencia.trim() !== '' && u.pontoReferencia.toUpperCase() !== 'N/A' && (
                          <div className="bg-amber-50/90 border border-amber-200/90 rounded-md px-2 py-1 text-[11px] text-amber-950 leading-snug flex items-start gap-1.5 shadow-2xs">
                            <Navigation className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-amber-800 text-[10px] uppercase block tracking-wider">Ponto de Referência:</span>
                              <span className="font-medium">{u.pontoReferencia}</span>
                            </div>
                          </div>
                        )}
                        {u.googleMapsUrl && (
                          <a
                            href={u.googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200 transition-colors"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span>Ver no Maps</span>
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
        /* Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUsinas.map((u) => {
            const contacts = parseContacts(u.contatoDisCo);
            const emailContact = contacts.find((c) => c.type === 'email');
            const primaryEmail = u.emailAgenteRelacionamento || emailContact?.value || '';

            return (
              <div 
                key={u.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 hover:border-amber-300 group"
              >
                <div>
                  {/* Card Header: Usina, UF & Copy Ficha */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                          {u.uf}
                        </span>
                        <h4 className="font-extrabold text-slate-900 group-hover:text-amber-700 transition-colors text-sm">
                          {u.usina}
                        </h4>
                      </div>
                      {(u.siglaNova || u.siglaAntiga) && (
                        <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                          Sigla: <span className="font-mono font-bold text-slate-700">{u.siglaNova || u.siglaAntiga}</span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => copyToClipboard(formatFichaUsina(u), `card-${u.id}`)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
                      title="Copiar Ficha Completa da Usina"
                    >
                      {copiedId === `card-${u.id}` ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="pt-3 space-y-3">
                    
                    {/* Razão Social & CNPJ */}
                    <div className="bg-amber-50/70 rounded-xl p-3 border border-amber-200/90 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] text-amber-800 uppercase font-bold tracking-wider flex items-center gap-1">
                          <FileText className="w-3 h-3 text-amber-700" />
                          <span>Razão Social & CNPJ</span>
                        </div>
                        {onUpdateUsinas && (
                          <button
                            onClick={() => openEditModal(u)}
                            className="text-slate-500 hover:text-slate-800 p-0.5 rounded hover:bg-amber-100/80 transition-colors cursor-pointer"
                            title="Editar Razão Social e CNPJ"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 text-xs leading-snug">
                        {u.razaoSocial || 'Pendente'}
                      </div>
                      <div className="flex items-center justify-between font-mono text-[11px] text-amber-900 font-extrabold pt-0.5">
                        <span>CNPJ: {u.cnpj || 'Pendente'}</span>
                        {u.cnpj && (
                          <button
                            onClick={() => copyToClipboard(u.cnpj, `card-cnpj-${u.id}`)}
                            className="text-amber-800 hover:text-amber-950 cursor-pointer"
                            title="Copiar CNPJ"
                          >
                            {copiedId === `card-cnpj-${u.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Concessionária */}
                    <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-500 font-semibold">Concessionária:</span>
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>{u.concessionaria || 'Não informada'}</span>
                      </span>
                    </div>

                    {/* Agente de Relacionamento & E-mail */}
                    <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-sky-800 flex items-center gap-1">
                          <User className="w-3 h-3 text-sky-600" />
                          <span>Agente de Relacionamento</span>
                        </span>
                        {onUpdateUsinas && (
                          <button
                            onClick={() => openEditModal(u)}
                            className="text-slate-400 hover:text-slate-700 p-0.5 rounded hover:bg-sky-100 transition-colors"
                            title="Editar agente e e-mail"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {u.nomeAgenteRelacionamento && (
                        <div className="font-bold text-slate-900 text-xs">
                          {u.nomeAgenteRelacionamento}
                        </div>
                      )}

                      {primaryEmail ? (
                        <div className="flex items-center justify-between gap-1 bg-white p-2 rounded-lg border border-sky-200">
                          <div className="font-mono text-xs font-bold text-sky-950 truncate select-all">
                            {primaryEmail}
                          </div>
                          <button
                            onClick={() => copyToClipboard(primaryEmail, `card-email-${u.id}`)}
                            className="text-sky-700 hover:text-sky-950 p-1 rounded hover:bg-sky-50 transition-colors shrink-0"
                            title="Copiar e-mail"
                          >
                            {copiedId === `card-email-${u.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-xs">
                          E-mail do agente pendente
                        </div>
                      )}

                      {/* Phone contacts */}
                      {contacts.filter(c => c.type !== 'email').length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {contacts.filter(c => c.type !== 'email').map((c, idx) => (
                            <a
                              key={idx}
                              href={c.url || '#'}
                              target={c.type === 'whatsapp' ? '_blank' : '_self'}
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border transition-colors ${
                                c.type === 'whatsapp'
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {c.type === 'whatsapp' && <MessageSquareCode className="w-3 h-3 text-emerald-600 shrink-0" />}
                              {c.type === 'phone' && <Phone className="w-3 h-3 text-slate-500 shrink-0" />}
                              <span>{c.label}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

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

                    {/* Endereço & Ponto de Referência */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-sky-600" />
                        <span>Endereço da Usina</span>
                      </div>
                      <p className="text-slate-700 text-xs leading-relaxed font-medium">
                        {u.endereco || 'Endereço não informado'}
                      </p>
                      {u.pontoReferencia && u.pontoReferencia.trim() !== '' && u.pontoReferencia.toUpperCase() !== 'N/A' && (
                        <div className="bg-amber-50/90 border border-amber-200/90 rounded-lg p-2.5 text-xs text-amber-950 leading-snug flex items-start gap-2 shadow-2xs">
                          <Navigation className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-amber-800 text-[10px] uppercase block tracking-wider mb-0.5">Ponto de Referência:</span>
                            <span className="font-medium">{u.pontoReferencia}</span>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* Card Footer: Google Maps link */}
                {u.googleMapsUrl && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <a
                      href={u.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir no Google Maps</span>
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Import Spreadsheet (Excel .xlsx / .xls or CSV) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Importar / Atualizar Planilha de Usinas
                  </h3>
                  <p className="text-xs text-slate-500">
                    Suporta arquivos Excel (.xlsx, .xls) ou CSV com Razão Social, CNPJ, E-mails e Contatos
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportResult(null);
                  setImportPastedText('');
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success result message */}
            {importResult && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{importResult.matchedCount} Usinas atualizadas com sucesso!</span>
                </div>
                <p className="text-emerald-700">
                  Os dados de Razão Social, CNPJ e contatos foram incorporados e salvos automaticamente.
                </p>
                {importResult.matchedDetails.length > 0 && (
                  <div className="max-h-48 overflow-y-auto bg-white/80 p-2.5 rounded-lg border border-emerald-200 space-y-1.5 font-mono text-[11px]">
                    {importResult.matchedDetails.map((m, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-slate-800 border-b border-slate-100 pb-1">
                        <span className="font-bold text-slate-900">{m.usina} ({m.concessionaria})</span>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {m.razaoSocial && <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-sans font-semibold">{m.razaoSocial}</span>}
                          {m.cnpj && <span className="text-slate-600">{m.cnpj}</span>}
                          {m.email && <span className="text-sky-700 font-semibold">{m.email}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              {/* Option 1: File selector */}
              <div className="border-2 border-dashed border-amber-200 hover:border-amber-400 bg-amber-50/30 rounded-xl p-5 text-center space-y-2 transition-colors">
                <Upload className="w-8 h-8 text-amber-600 mx-auto" />
                <div className="text-xs">
                  <span className="font-bold text-slate-800">Selecione seu arquivo Excel (.xlsx, .xls) ou CSV</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Reconhece automaticamente colunas como <strong>Usina / UFV, Razão Social, CNPJ, E-mail do Agente, Concessionária</strong>.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Escolher Arquivo do Computador</span>
                </button>
              </div>

              {/* Option 2: Paste CSV text */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Ou cole o conteúdo tabular copiado do Excel/Sheets:
                </label>
                <textarea
                  rows={5}
                  value={importPastedText}
                  onChange={(e) => setImportPastedText(e.target.value)}
                  placeholder="Ex: Usina, Razão Social, CNPJ, Concessionária, E-mail Agente..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 placeholder-slate-400 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportResult(null);
                    setImportPastedText('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  disabled={!importPastedText.trim()}
                  onClick={() => processSpreadsheetCsv(importPastedText)}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Processar Texto Colado</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Single Usina (Razão Social, CNPJ, Agente & Email) */}
      {editingUsina && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Editar Razão Social, CNPJ e Contatos da Usina
                </h3>
              </div>
              <button
                onClick={() => setEditingUsina(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
              <div className="font-bold text-slate-900">{editingUsina.usina}</div>
              <div className="text-slate-500 font-semibold">{editingUsina.concessionaria} • {editingUsina.uf}</div>
            </div>

            <form onSubmit={handleSaveSingleUsina} className="space-y-3 text-xs">
              
              {/* Razão Social */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  Razão Social (Titular / Cliente):
                </label>
                <input
                  type="text"
                  value={editRazaoSocial}
                  onChange={(e) => setEditRazaoSocial(e.target.value)}
                  placeholder="Ex: CLARO SA, RAIA DROGASIL SA, MAGAZINE LUIZA SA..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:bg-white"
                />
              </div>

              {/* CNPJ */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  CNPJ do Titular:
                </label>
                <input
                  type="text"
                  value={editCnpj}
                  onChange={(e) => setEditCnpj(e.target.value)}
                  placeholder="Ex: 40.432.544/0001-47 ou 61.585.865/0001-51"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:bg-white"
                />
              </div>

              {/* Nome do Agente */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  Nome do Agente de Relacionamento DisCo:
                </label>
                <input
                  type="text"
                  value={editAgentName}
                  onChange={(e) => setEditAgentName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo (Gestor Contas)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:bg-white"
                />
              </div>

              {/* E-mail do Agente */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  E-mail do Agente de Relacionamento:
                </label>
                <input
                  type="email"
                  value={editAgentEmail}
                  onChange={(e) => setEditAgentEmail(e.target.value)}
                  placeholder="Ex: agente.relacionamento@concessionaria.com.br"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:bg-white"
                />
              </div>

              {/* Telefone / WhatsApp */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  Telefone / WhatsApp DisCo:
                </label>
                <input
                  type="text"
                  value={editAgentPhone}
                  onChange={(e) => setEditAgentPhone(e.target.value)}
                  placeholder="Ex: 0800 000 0000 ou (11) 99999-9999"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUsina(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
