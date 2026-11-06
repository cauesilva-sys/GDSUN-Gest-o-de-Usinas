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
  MessageSquareCode,
  Sparkles,
  FileSpreadsheet,
  Navigation,
  Upload,
  Pencil,
  X,
  CheckCircle2,
  User,
  AtSign,
  Mail
} from 'lucide-react';

interface ConcessionariasViewProps {
  usinas: UsinaConcessionaria[];
  searchQuery: string;
  selectedUsinaFilter: string;
  setSelectedUsinaFilter: (usina: string) => void;
  onUpdateUsinas?: (updated: UsinaConcessionaria[]) => void;
}

export const ConcessionariasView: React.FC<ConcessionariasViewProps> = ({ 
  usinas = [], 
  searchQuery = '',
  selectedUsinaFilter = 'TODAS',
  setSelectedUsinaFilter,
  onUpdateUsinas
}) => {
  const [selectedUf, setSelectedUf] = useState<string>('TODAS');
  const [selectedDisCo, setSelectedDisCo] = useState<string>('TODAS');
  const [selectedRazaoFilter, setSelectedRazaoFilter] = useState<string>('TODAS');
  const [selectedEmailFilter, setSelectedEmailFilter] = useState<'TODOS' | 'COM_EMAIL' | 'SEM_EMAIL'>('TODOS');
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
  const [editRazaoSocialCliente, setEditRazaoSocialCliente] = useState<string>('');
  const [editCnpjCliente, setEditCnpjCliente] = useState<string>('');
  const [editCodigoCliente, setEditCodigoCliente] = useState<string>('');
  const [editCodigoInstalacaoAntigaUG, setEditCodigoInstalacaoAntigaUG] = useState<string>('');
  const [editCodigoInstalacaoNovaUG, setEditCodigoInstalacaoNovaUG] = useState<string>('');
  const [editCodigoInstalacaoUG, setEditCodigoInstalacaoUG] = useState<string>('');
  const [editMedidor, setEditMedidor] = useState<string>('');
  const [editAgentName, setEditAgentName] = useState<string>('');
  const [editAgentEmail, setEditAgentEmail] = useState<string>('');
  const [editAgentPhone, setEditAgentPhone] = useState<string>('');
  const [editContatoConcessionaria, setEditContatoConcessionaria] = useState<string>('');
  const [editEndereco, setEditEndereco] = useState<string>('');
  const [editPontoReferencia, setEditPontoReferencia] = useState<string>('');

  // Count usinas with agent email
  const usinasWithEmailCount = useMemo(() => {
    return (usinas || []).filter((u) => {
      if (!u) return false;
      const email = String(u.emailAgenteRelacionamento || (u as any).emailAgente || '').trim();
      return email !== '';
    }).length;
  }, [usinas]);

  // List of unique Usinas for filter dropdown
  const uniqueUsinas = useMemo(() => {
    const set = new Set<string>();
    (usinas || []).forEach((u) => {
      const nome = String(u.usina || u.nome || (u as any).usinaNome || '').trim();
      if (nome) set.add(nome);
    });
    return ['TODAS', ...Array.from(set).sort()];
  }, [usinas]);

  // List of unique Razões Sociais / Clientes
  const uniqueRazoes = useMemo(() => {
    const set = new Set<string>();
    (usinas || []).forEach((u) => {
      const val = String(u.razaoSocialCliente || u.razaoSocial || '').trim();
      if (val && val !== 'Pendente' && val !== 'N/A') {
        set.add(val);
      }
    });
    return ['TODAS', ...Array.from(set).sort()];
  }, [usinas]);

  // Map of usina name to its sigla for filter dropdown
  const usinaSiglaMap = useMemo(() => {
    const map = new Map<string, string>();
    (usinas || []).forEach((u) => {
      const nome = String(u.usina || u.nome || (u as any).usinaNome || '').trim();
      if (nome) {
        const sigla = String(u.siglaAntiga || u.siglaNova || u.sigla || '').trim();
        if (sigla) map.set(nome, sigla);
      }
    });
    return map;
  }, [usinas]);

  // List of UFs for filter dropdown
  const ufs = useMemo(() => {
    const set = new Set<string>();
    (usinas || []).forEach((u) => {
      const uf = String(u.uf || '').trim();
      if (uf) set.add(uf);
    });
    return ['TODAS', ...Array.from(set).sort()];
  }, [usinas]);

  // List of Concessionarias (DisCo) for filter dropdown
  const disCos = useMemo(() => {
    const set = new Set<string>();
    (usinas || []).forEach((u) => {
      const conc = String(u.concessionaria || (u as any).disco || (u as any).distribuidora || '').trim();
      if (conc && conc !== 'Não informada') set.add(conc);
    });
    return ['TODAS', ...Array.from(set).sort()];
  }, [usinas]);

  // Filter usinas
  const filteredUsinas = useMemo(() => {
    if (!Array.isArray(usinas)) return [];
    const query = String(searchQuery || '').toLowerCase().trim();
    const queryDigits = query.replace(/\D/g, '');

    return usinas.filter((item) => {
      if (!item) return false;

      const usinaNome = String(item.usina || item.nome || (item as any).usinaNome || '').trim();
      const usinaUf = String(item.uf || '').trim();
      const usinaConcessionaria = String(item.concessionaria || (item as any).disco || (item as any).distribuidora || '').trim();
      const itemRazao = String(item.razaoSocialCliente || item.razaoSocial || '').trim();

      const matchUsina = selectedUsinaFilter === 'TODAS' || 
        usinaNome === selectedUsinaFilter ||
        String(item.id || '') === selectedUsinaFilter ||
        usinaNome.toLowerCase() === selectedUsinaFilter.toLowerCase().trim();

      const matchUf = selectedUf === 'TODAS' || usinaUf === selectedUf;
      const matchDisCo = selectedDisCo === 'TODAS' || usinaConcessionaria === selectedDisCo;
      const matchRazao = selectedRazaoFilter === 'TODAS' || itemRazao === selectedRazaoFilter;

      // Email filter
      const emailAgente = String(item.emailAgenteRelacionamento || (item as any).emailAgente || '').trim();
      const hasEmail = Boolean(emailAgente !== '');

      if (selectedEmailFilter === 'COM_EMAIL' && !hasEmail) return false;
      if (selectedEmailFilter === 'SEM_EMAIL' && hasEmail) return false;

      if (!matchUsina || !matchUf || !matchDisCo || !matchRazao) return false;

      if (!query) return true;

      const cnpjStr = String(item.cnpj || '');
      const cnpjClienteStr = String(item.cnpjCliente || '');
      const cnpjDigits = cnpjStr.replace(/\D/g, '');
      const cnpjClienteDigits = cnpjClienteStr.replace(/\D/g, '');

      const matchCnpj = cnpjStr.toLowerCase().includes(query) || 
        cnpjClienteStr.toLowerCase().includes(query) ||
        (queryDigits.length >= 4 && (cnpjDigits.includes(queryDigits) || cnpjClienteDigits.includes(queryDigits)));

      const siglaAntiga = String(item.siglaAntiga || item.sigla || '').toLowerCase();
      const siglaNova = String(item.siglaNova || item.sigla || '').toLowerCase();
      const codInstNova = String(item.codigoInstalacaoNovaUG || '').toLowerCase();
      const codInstAntiga = String(item.codigoInstalacaoAntigaUG || '').toLowerCase();
      const codInstUG = String(item.codigoInstalacaoUG || '').toLowerCase();
      const medidor = String(item.medidor || '').toLowerCase();
      const codCliente = String(item.codigoCliente || '').toLowerCase();
      const pontoRef = String(item.pontoReferencia || '').toLowerCase();
      const nomeAgente = String(item.nomeAgenteRelacionamento || (item as any).nomeAgente || '').toLowerCase();
      const endereco = String(item.endereco || '').toLowerCase();
      const contatoDisCoStr = String(item.contatoDisCo || (item as any).contatoConcessionaria || '').toLowerCase();

      return (
        usinaNome.toLowerCase().includes(query) ||
        siglaAntiga.includes(query) ||
        siglaNova.includes(query) ||
        usinaConcessionaria.toLowerCase().includes(query) ||
        itemRazao.toLowerCase().includes(query) ||
        matchCnpj ||
        codInstNova.includes(query) ||
        codInstAntiga.includes(query) ||
        codInstUG.includes(query) ||
        medidor.includes(query) ||
        codCliente.includes(query) ||
        pontoRef.includes(query) ||
        nomeAgente.includes(query) ||
        emailAgente.toLowerCase().includes(query) ||
        contatoDisCoStr.includes(query) ||
        endereco.includes(query)
      );
    });
  }, [usinas, searchQuery, selectedUsinaFilter, selectedUf, selectedDisCo, selectedRazaoFilter, selectedEmailFilter]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatFichaUsina = (u: UsinaConcessionaria): string => {
    const nome = u.usina || u.nome || (u as any).usinaNome || 'Usina';
    const sigla = u.siglaNova || u.siglaAntiga || u.sigla || '';
    const contatoConcessionaria = u.contatoDisCo || (u as any).contatoConcessionaria || 'N/A';
    const emailAgente = u.emailAgenteRelacionamento || (u as any).emailAgente || 'Não cadastrado';
    const telAgente = u.telefoneAgenteRelacionamento || u.whatsappDisCo || (u as any).contatoGestor || 'N/A';

    const lines = [
      `USINA: ${nome}${sigla ? ` (${sigla})` : ''} - ${u.uf || ''}`,
      `CONCESSIONÁRIA: ${u.concessionaria || (u as any).disco || 'Não informada'}`,
      `CONTATO CONCESSIONÁRIA: ${contatoConcessionaria}`,
      '',
      `RAZÃO SOCIAL & CNPJ`,
      `Razão Social Cliente: ${u.razaoSocialCliente || u.razaoSocial || 'Pendente'}`,
      `CNPJ Cliente: ${u.cnpjCliente || u.cnpj || 'Pendente'}`,
      '',
      `DADOS CADASTRAIS (UG & MEDIÇÃO)`,
      `Código do Cliente: ${u.codigoCliente && u.codigoCliente !== 'N/A' ? u.codigoCliente : 'N/A'}`,
      `Código da Instalação Antiga (UG): ${u.codigoInstalacaoAntigaUG && u.codigoInstalacaoAntigaUG !== 'N/A' ? u.codigoInstalacaoAntigaUG : (u.codigoInstalacaoUG || 'N/A')}`,
      `Código da Instalação Nova (UG): ${u.codigoInstalacaoNovaUG && u.codigoInstalacaoNovaUG !== 'N/A' ? u.codigoInstalacaoNovaUG : 'N/A'}`,
      `Medidor: ${u.medidor || 'N/A'}`,
      '',
      `AGENTE / GESTOR DE RELACIONAMENTO`,
      `Gestor: ${u.nomeAgenteRelacionamento || (u as any).nomeAgente || 'Não especificado'}`,
      `E-mail: ${emailAgente}`,
      `Contato / Tel: ${telAgente}`,
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

  const openEditModal = (u: UsinaConcessionaria) => {
    setEditingUsina(u);
    setEditRazaoSocial(u.razaoSocial || '');
    setEditCnpj(u.cnpj || '');
    setEditRazaoSocialCliente(u.razaoSocialCliente || u.razaoSocial || '');
    setEditCnpjCliente(u.cnpjCliente || u.cnpj || '');
    setEditCodigoCliente(u.codigoCliente && u.codigoCliente !== 'N/A' ? u.codigoCliente : '');
    setEditCodigoInstalacaoAntigaUG(u.codigoInstalacaoAntigaUG && u.codigoInstalacaoAntigaUG !== 'N/A' ? u.codigoInstalacaoAntigaUG : (u.codigoInstalacaoUG || ''));
    setEditCodigoInstalacaoNovaUG(u.codigoInstalacaoNovaUG && u.codigoInstalacaoNovaUG !== 'N/A' ? u.codigoInstalacaoNovaUG : '');
    setEditCodigoInstalacaoUG(u.codigoInstalacaoUG && u.codigoInstalacaoUG !== 'N/A' ? u.codigoInstalacaoUG : '');
    setEditMedidor(u.medidor && u.medidor !== 'N/A' ? u.medidor : '');
    setEditAgentName(u.nomeAgenteRelacionamento || (u as any).nomeAgente || '');
    setEditAgentEmail(u.emailAgenteRelacionamento || (u as any).emailAgente || '');
    setEditAgentPhone(u.telefoneAgenteRelacionamento || u.whatsappDisCo || (u as any).contatoGestor || '');
    setEditContatoConcessionaria(u.contatoDisCo || (u as any).contatoConcessionaria || '');
    setEditEndereco(u.endereco || '');
    setEditPontoReferencia(u.pontoReferencia || '');
  };

  const handleSaveSingleUsina = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUsina || !onUpdateUsinas) return;

    const updated = usinas.map((u) => {
      if (u.id === editingUsina.id) {
        const novaUG = editCodigoInstalacaoNovaUG.trim();
        const antigaUG = editCodigoInstalacaoAntigaUG.trim();

        return {
          ...u,
          razaoSocial: editRazaoSocial.trim() || u.razaoSocial,
          cnpj: editCnpj.trim() || u.cnpj,
          razaoSocialCliente: editRazaoSocialCliente.trim() || editRazaoSocial.trim() || u.razaoSocialCliente,
          cnpjCliente: editCnpjCliente.trim() || editCnpj.trim() || u.cnpjCliente,
          codigoCliente: editCodigoCliente.trim() || u.codigoCliente,
          codigoInstalacaoAntigaUG: antigaUG || u.codigoInstalacaoAntigaUG,
          codigoInstalacaoNovaUG: novaUG || u.codigoInstalacaoNovaUG,
          codigoInstalacaoUG: novaUG || antigaUG || u.codigoInstalacaoUG,
          medidor: editMedidor.trim() || u.medidor,
          nomeAgenteRelacionamento: editAgentName.trim() || undefined,
          emailAgenteRelacionamento: editAgentEmail.trim() || undefined,
          whatsappDisCo: editAgentPhone.trim() || u.whatsappDisCo,
          telefoneAgenteRelacionamento: editAgentPhone.trim() || undefined,
          contatoDisCo: editContatoConcessionaria.trim() || u.contatoDisCo,
          endereco: editEndereco.trim() || u.endereco,
          pontoReferencia: editPontoReferencia.trim() || u.pontoReferencia
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

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
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

          {/* Razão Social Filter */}
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
              <option value="SEM_EMAIL" className="bg-white text-slate-900">Sem E-mail {Math.max(0, (usinas?.length || 0) - usinasWithEmailCount)}</option>
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

        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 border-t md:border-t-0 border-slate-200 pt-3 md:pt-0">
          <span className="text-xs text-slate-600 font-medium">
            Exibindo <strong className="text-slate-900 font-bold">{filteredUsinas.length}</strong> de {usinas?.length || 0} usinas
          </span>

          <button
            onClick={() => exportUsinasToExcel(filteredUsinas)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all hover:shadow cursor-pointer active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Baixar Excel Usinas</span>
          </button>
        </div>
      </div>

      {/* Grid de Cartões */}
      {filteredUsinas.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-xs">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Nenhuma usina encontrada</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Tente mudar a busca ou a seleção nos filtros de Usina, Cliente/Razão Social, Concessionária ou E-mail.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUsinas.map((u, idx) => {
            const usinaTitulo = u.usina || u.nome || (u as any).usinaNome || `Usina ${idx + 1}`;
            const siglaExibida = u.siglaNova || u.siglaAntiga || u.sigla || '';
            const cardKey = u.id || `card_${idx}`;

            // Contato da concessionária (Coluna G)
            const contatoConcessionaria = u.contatoDisCo || (u as any).contatoConcessionaria || '';

            // Dados do Agente / Gestor (Colunas P e Q)
            const nomeGestor = u.nomeAgenteRelacionamento || (u as any).nomeAgente || 'Gestor de Relacionamento';
            const emailGestor = u.emailAgenteRelacionamento || (u as any).emailAgente || '';
            const contatoGestor = u.telefoneAgenteRelacionamento || u.whatsappDisCo || (u as any).contatoGestor || '';

            // Dados Cadastrais (Colunas H, I, J, K)
            const codCliente = u.codigoCliente && u.codigoCliente !== 'N/A' ? u.codigoCliente : 'N/A';
            const instAntiga = u.codigoInstalacaoAntigaUG && u.codigoInstalacaoAntigaUG !== 'N/A' ? u.codigoInstalacaoAntigaUG : (u.codigoInstalacaoUG || 'N/A');
            const instNova = u.codigoInstalacaoNovaUG && u.codigoInstalacaoNovaUG !== 'N/A' ? u.codigoInstalacaoNovaUG : 'N/A';
            const medidor = u.medidor && u.medidor !== 'N/A' ? u.medidor : 'N/A';

            return (
              <div 
                key={cardKey}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 hover:border-amber-300 group"
              >
                <div>
                  {/* Topo do Card: UF, Nome, Sigla e Ações */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                          {u.uf || 'UF'}
                        </span>
                        <h4 className="font-extrabold text-slate-900 group-hover:text-amber-700 transition-colors text-sm">
                          {usinaTitulo}
                        </h4>
                      </div>
                      {siglaExibida && (
                        <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                          Sigla: <span className="font-mono font-bold text-slate-700">{siglaExibida}</span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => copyToClipboard(formatFichaUsina(u), `card-${cardKey}`)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
                      title="Copiar Ficha Completa da Usina"
                    >
                      {copiedId === `card-${cardKey}` ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="pt-3 space-y-3">
                    {/* 1. Razão Social & CNPJ */}
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
                            title="Editar dados da usina"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 text-xs leading-snug">
                        {u.razaoSocialCliente || u.razaoSocial || 'Pendente'}
                      </div>
                      <div className="flex items-center justify-between font-mono text-[11px] text-amber-900 font-extrabold pt-0.5">
                        <span>CNPJ: {u.cnpjCliente || u.cnpj || 'Pendente'}</span>
                        {(u.cnpjCliente || u.cnpj) && (
                          <button
                            onClick={() => copyToClipboard(String(u.cnpjCliente || u.cnpj || ''), `card-cnpj-${cardKey}`)}
                            className="text-amber-800 hover:text-amber-950 cursor-pointer"
                            title="Copiar CNPJ"
                          >
                            {copiedId === `card-cnpj-${cardKey}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 2. Concessionária + Contato na linha de baixo (Coluna G) */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-semibold">Concessionária:</span>
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-amber-600" />
                          <span>{u.concessionaria || (u as any).disco || (u as any).distribuidora || 'Não informada'}</span>
                        </span>
                      </div>
                      {contatoConcessionaria && (
                        <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/60 font-mono">
                          <span className="text-slate-400 font-sans text-[10px] uppercase font-semibold">Contato Concessionária:</span>
                          <span className="font-bold text-slate-800">{contatoConcessionaria}</span>
                        </div>
                      )}
                    </div>

                    {/* 3. Agente de Relacionamento (Nome, Email [Col P] e Contato [Col Q]) */}
                    <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-sky-800 flex items-center gap-1">
                          <User className="w-3 h-3 text-sky-600" />
                          <span>Agente de Relacionamento</span>
                        </span>
                      </div>

                      <div className="font-bold text-slate-900 text-xs">
                        {nomeGestor}
                      </div>

                      {/* E-mail do Gestor (Coluna P) */}
                      {emailGestor ? (
                        <div className="flex items-center justify-between gap-1 bg-white p-2 rounded-lg border border-sky-200">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Mail className="w-3 h-3 text-sky-600 shrink-0" />
                            <span className="font-mono text-xs font-bold text-sky-950 truncate select-all">
                              {emailGestor}
                            </span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(emailGestor, `card-email-${cardKey}`)}
                            className="text-sky-700 hover:text-sky-950 p-1 rounded hover:bg-sky-50 transition-colors shrink-0 cursor-pointer"
                            title="Copiar e-mail"
                          >
                            {copiedId === `card-email-${cardKey}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-[11px]">
                          E-mail do gestor não informado
                        </div>
                      )}

                      {/* Contato do Gestor (Coluna Q) */}
                      {contatoGestor ? (
                        <div className="flex items-center justify-between gap-1 bg-white p-2 rounded-lg border border-sky-200">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="font-mono text-xs font-bold text-slate-800 truncate select-all">
                              {contatoGestor}
                            </span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(contatoGestor, `card-tel-${cardKey}`)}
                            className="text-slate-600 hover:text-slate-950 p-1 rounded hover:bg-slate-50 transition-colors shrink-0 cursor-pointer"
                            title="Copiar telefone/contato"
                          >
                            {copiedId === `card-tel-${cardKey}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-[11px]">
                          Contato do gestor não informado
                        </div>
                      )}
                    </div>

                    {/* 4. Dados Cadastrais da Usina (UG) */}
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 space-y-1.5">
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Hash className="w-3 h-3 text-amber-600" />
                          <span>Dados Cadastrais da Usina (UG)</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-1 text-[11px] font-mono pt-0.5">
                        {/* Coluna H */}
                        <div className="flex justify-between items-center bg-white px-2.5 py-1 rounded-md border border-slate-200/80">
                          <span className="text-slate-500 font-sans text-[10px] uppercase font-bold">Cód. Cliente:</span>
                          <span className="font-bold text-slate-900">{codCliente}</span>
                        </div>
                        {/* Coluna I */}
                        <div className="flex justify-between items-center bg-white px-2.5 py-1 rounded-md border border-slate-200/80">
                          <span className="text-slate-500 font-sans text-[10px] uppercase font-bold">Instalação Antiga (UG):</span>
                          <span className="font-bold text-slate-800">{instAntiga}</span>
                        </div>
                        {/* Coluna J */}
                        <div className="flex justify-between items-center bg-amber-50 px-2.5 py-1 rounded-md border border-amber-300 shadow-2xs">
                          <div className="flex items-center gap-1">
                            <span className="text-amber-900 font-sans text-[10px] uppercase font-bold">Instalação Nova (UG):</span>
                            <span className="text-[8px] bg-amber-600 text-white font-extrabold px-1 py-0.2 rounded uppercase">Nova</span>
                          </div>
                          <span className="font-extrabold text-amber-950">{instNova}</span>
                        </div>
                        {/* Coluna K */}
                        <div className="flex justify-between items-center bg-amber-50/50 px-2.5 py-1 rounded-md border border-amber-200/80">
                          <span className="text-amber-800 font-sans text-[10px] uppercase font-bold">Medidor:</span>
                          <span className="font-extrabold text-amber-900">{medidor}</span>
                        </div>
                      </div>
                    </div>

                    {/* 5. Endereço da Usina (Coluna R) + Ponto de Referência (Coluna S) */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-sky-600" />
                        <span>Endereço da Usina</span>
                      </div>
                      <p className="text-slate-700 text-xs leading-relaxed font-medium">
                        {u.endereco || 'Endereço não informado'}
                      </p>
                      
                      {/* Ponto de Referência embaixo do endereço */}
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

      {/* Modal de Edição */}
      {editingUsina && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Editar Dados da Usina
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
              <div className="font-bold text-slate-900">{editingUsina.usina || editingUsina.nome}</div>
              <div className="text-slate-500 font-semibold">{editingUsina.concessionaria} • {editingUsina.uf}</div>
            </div>

            <form onSubmit={handleSaveSingleUsina} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block text-xs">
                  Razão Social Cliente / Titular:
                </label>
                <input
                  type="text"
                  value={editRazaoSocialCliente}
                  onChange={(e) => {
                    setEditRazaoSocialCliente(e.target.value);
                    setEditRazaoSocial(e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block text-xs">
                  CNPJ Cliente (Formato: 00.000.000/0000-00):
                </label>
                <input
                  type="text"
                  value={editCnpjCliente}
                  onChange={(e) => {
                    setEditCnpjCliente(e.target.value);
                    setEditCnpj(e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block text-xs">
                  Contato Concessionária (Coluna G):
                </label>
                <input
                  type="text"
                  value={editContatoConcessionaria}
                  onChange={(e) => setEditContatoConcessionaria(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block text-[11px]">
                    Código do Cliente (Col H):
                  </label>
                  <input
                    type="text"
                    value={editCodigoCliente}
                    onChange={(e) => setEditCodigoCliente(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block text-[11px]">
                    Medidor (Col K):
                  </label>
                  <input
                    type="text"
                    value={editMedidor}
                    onChange={(e) => setEditMedidor(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block text-[11px]">
                    Instalação Antiga UG (Col I):
                  </label>
                  <input
                    type="text"
                    value={editCodigoInstalacaoAntigaUG}
                    onChange={(e) => setEditCodigoInstalacaoAntigaUG(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-amber-900 block text-[11px]">
                    Instalação Nova UG (Col J):
                  </label>
                  <input
                    type="text"
                    value={editCodigoInstalacaoNovaUG}
                    onChange={(e) => setEditCodigoInstalacaoNovaUG(e.target.value)}
                    className="w-full bg-amber-50 border border-amber-300 rounded-lg px-2.5 py-1.5 text-amber-950 font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  Nome do Gestor de Relacionamento:
                </label>
                <input
                  type="text"
                  value={editAgentName}
                  onChange={(e) => setEditAgentName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  E-mail do Gestor (Coluna P):
                </label>
                <input
                  type="email"
                  value={editAgentEmail}
                  onChange={(e) => setEditAgentEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  Contato / Telefone do Gestor (Coluna Q):
                </label>
                <input
                  type="text"
                  value={editAgentPhone}
                  onChange={(e) => setEditAgentPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  Endereço da Usina (Coluna R):
                </label>
                <input
                  type="text"
                  value={editEndereco}
                  onChange={(e) => setEditEndereco(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  Ponto de Referência (Coluna S):
                </label>
                <input
                  type="text"
                  value={editPontoReferencia}
                  onChange={(e) => setEditPontoReferencia(e.target.value)}
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
