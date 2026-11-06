import React, { useState, useMemo, useEffect } from 'react';
import { UsinaConcessionaria } from '../types';
import { initialUsinas } from '../data/initialData';
import { exportUsinasToExcel } from '../utils/excelExporter';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Copy, 
  Check, 
  Hash, 
  FileText, 
  Filter, 
  FileSpreadsheet,
  Navigation,
  Pencil,
  X,
  User,
  Mail,
  ExternalLink
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Estados da modal de edição manual
  const [editingUsina, setEditingUsina] = useState<any | null>(null);
  const [editRazaoSocial, setEditRazaoSocial] = useState<string>('');
  const [editCnpj, setEditCnpj] = useState<string>('');
  const [editCodigoCliente, setEditCodigoCliente] = useState<string>('');
  const [editInstAntiga, setEditInstAntiga] = useState<string>('');
  const [editInstNova, setEditInstNova] = useState<string>('');
  const [editMedidor, setEditMedidor] = useState<string>('');
  const [editNomeGestor, setEditNomeGestor] = useState<string>('');
  const [editEmailGestor, setEditEmailGestor] = useState<string>('');
  const [editTelGestor, setEditTelGestor] = useState<string>('');
  const [editContatoConc, setEditContatoConc] = useState<string>('');
  const [editEndereco, setEditEndereco] = useState<string>('');
  const [editPontoRef, setEditPontoRef] = useState<string>('');

  // Limpa o cache antigo gravado localmente
  useEffect(() => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.includes('usina') || k.includes('gdsun') || k.includes('storage') || k.includes('data'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      // Ignora erro de storage
    }
  }, []);

  // Regex para identificar padrão de CNPJ
  const isCnpj = (val: string) => /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(String(val).trim());

  // Mapeamento dos campos garantindo a regra idêntica para todas as usinas
  const resolveCampos = (u: any) => {
    const base: any = (initialUsinas || []).find(
      (b) => b.id === u.id || b.usina === u.usina || b.nome === u.nome || b.coser === u.coser
    ) || {};

    // 1. RAZÃO SOCIAL & CNPJ
    let razaoSocial = base.razaoSocial || base.razaoSocialCliente || u.razaoSocial || u.razaoSocialCliente || 'Pendente';
    let cnpj = base.cnpj || base.cnpjCliente || u.cnpj || u.cnpjCliente || 'Pendente';

    if (/^\d{5,}$/.test(String(razaoSocial).trim()) && cnpj && !/^\d{2}\./.test(cnpj)) {
      const temp = razaoSocial;
      razaoSocial = cnpj;
      cnpj = temp;
    }

    // 2. CONCESSIONÁRIA & CONTATO (COLUNA G)
    const concessionaria = base.concessionaria || u.concessionaria || u.disco || 'Não informada';
    
    let contatoConcessionaria = '';
    const rawContato = String(base.contatoDisCo || u.contatoDisCo || '').trim();
    if (rawContato) {
      if (rawContato.includes('@')) {
        const parts = rawContato.split('/');
        const telPart = parts.find((p) => !p.includes('@'));
        contatoConcessionaria = telPart ? telPart.trim() : '';
      } else {
        contatoConcessionaria = rawContato;
      }
    }

    // 3. AGENTE / GESTOR DE RELACIONAMENTO (COLUNAS P E Q)
    let nomeGestor = base.nomeAgenteRelacionamento || u.nomeAgenteRelacionamento || '';
    let emailGestor = base.emailAgenteRelacionamento || u.emailAgenteRelacionamento || '';
    let telGestor = base.telefoneAgenteRelacionamento || base.whatsappDisCo || u.telefoneAgenteRelacionamento || u.whatsappDisCo || '';

    // Extrai se estiver no contatoDisCo
    if (rawContato.includes('@')) {
      const parts = rawContato.split('/');
      const mailPart = parts.find((p) => p.includes('@'));
      const phonePart = parts.find((p) => !p.includes('@'));
      if (!emailGestor && mailPart) emailGestor = mailPart.trim();
      if (!telGestor && phonePart) telGestor = phonePart.trim();
    }

    // BLINDAGEM: Se o email for um CNPJ (erro de Presidente Alves), LIMPAR
    if (isCnpj(emailGestor)) {
      emailGestor = '';
    }

    // Ajusta o nome do gestor conforme a concessionária/email
    if (!nomeGestor || nomeGestor === 'Clientes Corporativos' || isCnpj(nomeGestor)) {
      if (emailGestor.toLowerCase().includes('aderlan')) {
        nomeGestor = 'Aderlan Barroso';
      } else if (emailGestor.toLowerCase().includes('edp') || concessionaria.includes('EDP')) {
        nomeGestor = 'Grandes Clientes (EDP)';
      } else if (emailGestor.toLowerCase().includes('cpfl') || concessionaria.includes('CPFL')) {
        nomeGestor = 'Grandes Clientes (CPFL)';
      } else if (concessionaria.includes('Coelba') || concessionaria.includes('Neoenergia')) {
        nomeGestor = 'Grandes Clientes (Neoenergia)';
      } else {
        nomeGestor = 'Gestor de Relacionamento';
      }
    }

    // 4. DADOS CADASTRAIS (COLUNAS H, I, J, K)
    let codCliente = base.codigoCliente || u.codigoCliente || 'N/A';
    if (codCliente.includes('@') || codCliente.includes('0800')) {
      codCliente = base.codigoCliente && !base.codigoCliente.includes('@') ? base.codigoCliente : 'N/A';
    }

    const instAntiga = base.codigoInstalacaoAntigaUG || u.codigoInstalacaoAntigaUG || 'N/A';
    const instNova = base.codigoInstalacaoNovaUG || u.codigoInstalacaoNovaUG || base.codigoInstalacaoUG || u.codigoInstalacaoUG || 'N/A';
    const medidor = base.medidor || u.medidor || 'N/A';

    // 5. ENDEREÇO (COLUNA R) & PONTO DE REFERÊNCIA (COLUNA S)
    const endereco = base.endereco || u.endereco || 'Endereço não informado';
    const pontoReferencia = base.pontoReferencia || u.pontoReferencia || '';

    return {
      razaoSocial,
      cnpj,
      concessionaria,
      contatoConcessionaria,
      nomeGestor,
      emailGestor,
      telGestor,
      codCliente,
      instAntiga,
      instNova,
      medidor,
      endereco,
      pontoReferencia,
      googleMapsUrl: base.googleMapsUrl || u.googleMapsUrl
    };
  };

  // Filtragem
  const filteredUsinas = useMemo(() => {
    const list = Array.isArray(usinas) && usinas.length > 0 ? usinas : initialUsinas;
    const query = String(searchQuery || '').toLowerCase().trim();

    return list.filter((item) => {
      if (!item) return false;
      const d = resolveCampos(item);
      const usinaNome = String(item.usina || item.nome || '').trim();
      const usinaUf = String(item.uf || '').trim();

      const matchUsina = selectedUsinaFilter === 'TODAS' || usinaNome === selectedUsinaFilter;
      const matchUf = selectedUf === 'TODAS' || usinaUf === selectedUf;
      const matchDisCo = selectedDisCo === 'TODAS' || d.concessionaria === selectedDisCo;
      const matchRazao = selectedRazaoFilter === 'TODAS' || d.razaoSocial === selectedRazaoFilter;

      if (!matchUsina || !matchUf || !matchDisCo || !matchRazao) return false;

      if (!query) return true;

      return (
        usinaNome.toLowerCase().includes(query) ||
        d.razaoSocial.toLowerCase().includes(query) ||
        d.cnpj.includes(query) ||
        d.codCliente.toLowerCase().includes(query) ||
        d.instNova.toLowerCase().includes(query) ||
        d.medidor.toLowerCase().includes(query) ||
        d.endereco.toLowerCase().includes(query)
      );
    });
  }, [usinas, searchQuery, selectedUsinaFilter, selectedUf, selectedDisCo, selectedRazaoFilter]);

  const uniqueUsinas = useMemo(() => {
    const list = Array.isArray(usinas) && usinas.length > 0 ? usinas : initialUsinas;
    const set = new Set<string>();
    list.forEach((u) => {
      const nome = String(u.usina || u.nome || '').trim();
      if (nome) set.add(nome);
    });
    return ['TODAS', ...Array.from(set).sort()];
  }, [usinas]);

  const uniqueRazoes = useMemo(() => {
    const list = Array.isArray(usinas) && usinas.length > 0 ? usinas : initialUsinas;
    const set = new Set<string>();
    list.forEach((u) => {
      const d = resolveCampos(u);
      if (d.razaoSocial && d.razaoSocial !== 'Pendente') set.add(d.razaoSocial);
    });
    return ['TODAS', ...Array.from(set).sort()];
  }, [usinas]);

  const ufs = useMemo(() => {
    const list = Array.isArray(usinas) && usinas.length > 0 ? usinas : initialUsinas;
    const set = new Set<string>();
    list.forEach((u) => {
      if (u.uf) set.add(u.uf);
    });
    return ['TODAS', ...Array.from(set).sort()];
  }, [usinas]);

  const disCos = useMemo(() => {
    const list = Array.isArray(usinas) && usinas.length > 0 ? usinas : initialUsinas;
    const set = new Set<string>();
    list.forEach((u) => {
      if (u.concessionaria) set.add(u.concessionaria);
    });
    return ['TODAS', ...Array.from(set).sort()];
  }, [usinas]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openEditModal = (u: any) => {
    const d = resolveCampos(u);
    setEditingUsina(u);
    setEditRazaoSocial(d.razaoSocial !== 'Pendente' ? d.razaoSocial : '');
    setEditCnpj(d.cnpj !== 'Pendente' ? d.cnpj : '');
    setEditCodigoCliente(d.codCliente !== 'N/A' ? d.codCliente : '');
    setEditInstAntiga(d.instAntiga !== 'N/A' ? d.instAntiga : '');
    setEditInstNova(d.instNova !== 'N/A' ? d.instNova : '');
    setEditMedidor(d.medidor !== 'N/A' ? d.medidor : '');
    setEditNomeGestor(d.nomeGestor);
    setEditEmailGestor(d.emailGestor);
    setEditTelGestor(d.telGestor);
    setEditContatoConc(d.contatoConcessionaria);
    setEditEndereco(d.endereco);
    setEditPontoRef(d.pontoReferencia);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUsina || !onUpdateUsinas) return;

    const list = Array.isArray(usinas) && usinas.length > 0 ? usinas : initialUsinas;
    const updated = list.map((u) => {
      if (u.id === editingUsina.id) {
        return {
          ...u,
          razaoSocial: editRazaoSocial.trim(),
          razaoSocialCliente: editRazaoSocial.trim(),
          cnpj: editCnpj.trim(),
          cnpjCliente: editCnpj.trim(),
          codigoCliente: editCodigoCliente.trim(),
          codigoInstalacaoAntigaUG: editInstAntiga.trim(),
          codigoInstalacaoNovaUG: editInstNova.trim(),
          codigoInstalacaoUG: editInstNova.trim() || editInstAntiga.trim(),
          medidor: editMedidor.trim(),
          nomeAgenteRelacionamento: editNomeGestor.trim(),
          emailAgenteRelacionamento: editEmailGestor.trim(),
          telefoneAgenteRelacionamento: editTelGestor.trim(),
          whatsappDisCo: editTelGestor.trim(),
          contatoDisCo: editContatoConc.trim(),
          endereco: editEndereco.trim(),
          pontoReferencia: editPontoRef.trim()
        };
      }
      return u;
    });

    onUpdateUsinas(updated);
    setEditingUsina(null);
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-bold bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-amber-600" />
            <span>Filtros:</span>
          </div>

          <select
            value={selectedUsinaFilter}
            onChange={(e) => setSelectedUsinaFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 text-xs font-medium cursor-pointer"
          >
            {uniqueUsinas.map((u) => (
              <option key={u} value={u}>{u === 'TODAS' ? 'Todas as Usinas' : u}</option>
            ))}
          </select>

          <select
            value={selectedRazaoFilter}
            onChange={(e) => setSelectedRazaoFilter(e.target.value)}
            className="bg-amber-50/70 border border-amber-200 rounded-xl px-2.5 py-1.5 text-amber-950 text-xs font-semibold cursor-pointer"
          >
            {uniqueRazoes.map((r) => (
              <option key={r} value={r}>{r === 'TODAS' ? 'Todos os Clientes' : r}</option>
            ))}
          </select>

          <select
            value={selectedUf}
            onChange={(e) => setSelectedUf(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 text-xs font-medium cursor-pointer"
          >
            {ufs.map((uf) => (
              <option key={uf} value={uf}>{uf === 'TODAS' ? 'Todas UFs' : uf}</option>
            ))}
          </select>

          <select
            value={selectedDisCo}
            onChange={(e) => setSelectedDisCo(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 text-xs font-medium cursor-pointer"
          >
            {disCos.map((d) => (
              <option key={d} value={d}>{d === 'TODAS' ? 'Todas Concessionárias' : d}</option>
            ))}
          </select>

          {(selectedUsinaFilter !== 'TODAS' || selectedUf !== 'TODAS' || selectedDisCo !== 'TODAS' || selectedRazaoFilter !== 'TODAS') && (
            <button
              onClick={() => {
                setSelectedUsinaFilter('TODAS');
                setSelectedUf('TODAS');
                setSelectedDisCo('TODAS');
                setSelectedRazaoFilter('TODAS');
              }}
              className="text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600 font-medium">
            Exibindo <strong className="text-slate-900">{filteredUsinas.length}</strong> de {initialUsinas.length} usinas
          </span>
          <button
            onClick={() => exportUsinasToExcel(filteredUsinas)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Grid de Cartões */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredUsinas.map((u, idx) => {
          const cardKey = u.id || `card_${idx}`;
          const usinaTitulo = u.usina || u.nome || `Usina ${idx + 1}`;
          const siglaExibida = u.siglaNova || u.siglaAntiga || u.sigla || '';
          const d = resolveCampos(u);

          return (
            <div 
              key={cardKey}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 hover:border-amber-300 group"
            >
              <div>
                {/* TOPO: UF e Nome da Usina */}
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
                  
                  {onUpdateUsinas && (
                    <button
                      onClick={() => openEditModal(u)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Editar Usina"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="pt-3 space-y-3">
                  {/* BLOCO 1: RAZÃO SOCIAL & CNPJ */}
                  <div className="bg-amber-50/70 rounded-xl p-3 border border-amber-200/90 space-y-1">
                    <div className="text-[10px] text-amber-800 uppercase font-bold tracking-wider flex items-center gap-1">
                      <FileText className="w-3 h-3 text-amber-700" />
                      <span>RAZÃO SOCIAL & CNPJ</span>
                    </div>
                    <div className="font-bold text-slate-900 text-xs leading-snug">
                      {d.razaoSocial}
                    </div>
                    <div className="flex items-center justify-between font-mono text-[11px] text-amber-900 font-extrabold pt-0.5">
                      <span>CNPJ: {d.cnpj}</span>
                      {d.cnpj !== 'Pendente' && (
                        <button
                          onClick={() => copyToClipboard(d.cnpj, `cnpj-${cardKey}`)}
                          className="text-amber-800 hover:text-amber-950 cursor-pointer"
                          title="Copiar CNPJ"
                        >
                          {copiedId === `cnpj-${cardKey}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* BLOCO 2: CONCESSIONÁRIA + CONTATO NA LINHA DE BAIXO (COLUNA G) */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-semibold">Concessionária:</span>
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>{d.concessionaria}</span>
                      </span>
                    </div>
                    {d.contatoConcessionaria && (
                      <div className="flex items-center justify-between text-[11px] text-slate-700 pt-1 border-t border-slate-200/60 font-mono">
                        <span className="text-slate-400 font-sans text-[10px] uppercase font-semibold">Contato Concessionária:</span>
                        <span className="font-bold text-slate-800">{d.contatoConcessionaria}</span>
                      </div>
                    )}
                  </div>

                  {/* BLOCO 3: AGENTE DE RELACIONAMENTO (COLUNAS P E Q) */}
                  <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3 space-y-2">
                    <div className="text-[10px] uppercase tracking-wider font-extrabold text-sky-800 flex items-center gap-1">
                      <User className="w-3 h-3 text-sky-600" />
                      <span>AGENTE DE RELACIONAMENTO</span>
                    </div>

                    {d.nomeGestor && (
                      <div className="font-bold text-slate-900 text-xs">
                        {d.nomeGestor}
                      </div>
                    )}

                    {/* Email do Gestor (Coluna P) - Trava de segurança para não exibir CNPJ */}
                    {d.emailGestor ? (
                      <div className="flex items-center justify-between gap-1 bg-white p-2 rounded-lg border border-sky-200">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Mail className="w-3 h-3 text-sky-600 shrink-0" />
                          <span className="font-mono text-xs font-bold text-sky-950 truncate select-all">
                            {d.emailGestor}
                          </span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(d.emailGestor, `mail-${cardKey}`)}
                          className="text-sky-700 hover:text-sky-950 p-1 cursor-pointer"
                          title="Copiar e-mail"
                        >
                          {copiedId === `mail-${cardKey}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <div className="text-slate-400 italic text-[11px]">E-mail do gestor não informado</div>
                    )}

                    {/* Contato / Telefone do Gestor (Coluna Q) */}
                    {d.telGestor ? (
                      <div className="flex items-center justify-between gap-1 bg-white p-2 rounded-lg border border-sky-200">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="font-mono text-xs font-bold text-slate-800 truncate select-all">
                            {d.telGestor}
                          </span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(d.telGestor, `tel-${cardKey}`)}
                          className="text-slate-600 hover:text-slate-950 p-1 cursor-pointer"
                          title="Copiar telefone/contato"
                        >
                          {copiedId === `tel-${cardKey}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <div className="text-slate-400 italic text-[11px]">Contato do gestor não informado</div>
                    )}
                  </div>

                  {/* BLOCO 4: DADOS CADASTRAIS DA USINA (COLUNAS H, I, J, K) */}
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 space-y-1.5">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                      <Hash className="w-3 h-3 text-amber-600" />
                      <span>DADOS CADASTRAIS DA USINA (UG)</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1 text-[11px] font-mono pt-0.5">
                      {/* Cód. Cliente (Coluna H) */}
                      <div className="flex justify-between items-center bg-white px-2.5 py-1 rounded-md border border-slate-200/80">
                        <span className="text-slate-500 font-sans text-[10px] uppercase font-bold">CÓD. CLIENTE:</span>
                        <span className="font-bold text-slate-900">{d.codCliente}</span>
                      </div>
                      {/* Instalação Antiga (Coluna I) */}
                      <div className="flex justify-between items-center bg-white px-2.5 py-1 rounded-md border border-slate-200/80">
                        <span className="text-slate-500 font-sans text-[10px] uppercase font-bold">INSTALAÇÃO ANTIGA (UG):</span>
                        <span className="font-bold text-slate-800">{d.instAntiga}</span>
                      </div>
                      {/* Instalação Nova (Coluna J) */}
                      <div className="flex justify-between items-center bg-amber-50 px-2.5 py-1 rounded-md border border-amber-300">
                        <div className="flex items-center gap-1">
                          <span className="text-amber-900 font-sans text-[10px] uppercase font-bold">INSTALAÇÃO NOVA (UG):</span>
                          <span className="text-[8px] bg-amber-600 text-white font-extrabold px-1 rounded uppercase">Nova</span>
                        </div>
                        <span className="font-extrabold text-amber-950">{d.instNova}</span>
                      </div>
                      {/* Medidor (Coluna K) */}
                      <div className="flex justify-between items-center bg-amber-50/50 px-2.5 py-1 rounded-md border border-amber-200/80">
                        <span className="text-amber-800 font-sans text-[10px] uppercase font-bold">MEDIDOR:</span>
                        <span className="font-extrabold text-amber-900">{d.medidor}</span>
                      </div>
                    </div>
                  </div>

                  {/* BLOCO 5: ENDEREÇO (COLUNA R) + PONTO DE REFERÊNCIA (COLUNA S) */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-100">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-sky-600" />
                      <span>ENDEREÇO DA USINA</span>
                    </div>
                    <p className="text-slate-700 text-xs leading-relaxed font-medium">
                      {d.endereco}
                    </p>
                    
                    {/* Ponto de Referência embaixo do endereço */}
                    {d.pontoReferencia && (
                      <div className="bg-amber-50/90 border border-amber-200/90 rounded-lg p-2 text-xs text-amber-950 flex items-start gap-1.5 shadow-2xs">
                        <Navigation className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-amber-800 text-[10px] uppercase block tracking-wider">Ponto de Referência:</span>
                          <span className="font-medium">{d.pontoReferencia}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {d.googleMapsUrl && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={d.googleMapsUrl}
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

      {/* Modal de Edição */}
      {editingUsina && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">Editar Dados da Usina</h3>
              <button onClick={() => setEditingUsina(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-800 block">Razão Social:</label>
                <input
                  type="text"
                  value={editRazaoSocial}
                  onChange={(e) => setEditRazaoSocial(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block">CNPJ:</label>
                <input
                  type="text"
                  value={editCnpj}
                  onChange={(e) => setEditCnpj(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block">Contato Concessionária (Coluna G):</label>
                <input
                  type="text"
                  value={editContatoConc}
                  onChange={(e) => setEditContatoConc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block">Cód. Cliente (Coluna H):</label>
                  <input
                    type="text"
                    value={editCodigoCliente}
                    onChange={(e) => setEditCodigoCliente(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block">Medidor (Coluna K):</label>
                  <input
                    type="text"
                    value={editMedidor}
                    onChange={(e) => setEditMedidor(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block">Instalação Antiga UG (Coluna I):</label>
                  <input
                    type="text"
                    value={editInstAntiga}
                    onChange={(e) => setEditInstAntiga(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="font-bold text-amber-900 block">Instalação Nova UG (Coluna J):</label>
                  <input
                    type="text"
                    value={editInstNova}
                    onChange={(e) => setEditInstNova(e.target.value)}
                    className="w-full bg-amber-50 border border-amber-300 rounded-lg px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block">Nome do Gestor (Coluna P):</label>
                <input
                  type="text"
                  value={editNomeGestor}
                  onChange={(e) => setEditNomeGestor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block">E-mail do Gestor (Coluna P):</label>
                <input
                  type="email"
                  value={editEmailGestor}
                  onChange={(e) => setEditEmailGestor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block">Contato / Telefone Gestor (Coluna Q):</label>
                <input
                  type="text"
                  value={editTelGestor}
                  onChange={(e) => setEditTelGestor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block">Endereço da Usina (Coluna R):</label>
                <input
                  type="text"
                  value={editEndereco}
                  onChange={(e) => setEditEndereco(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block">Ponto de Referência (Coluna S):</label>
                <input
                  type="text"
                  value={editPontoRef}
                  onChange={(e) => setEditPontoRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUsina(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-700 text-white font-bold"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
