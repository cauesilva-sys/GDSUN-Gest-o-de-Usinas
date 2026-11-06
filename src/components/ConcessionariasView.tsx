import React, { useState, useMemo } from 'react';
import { UsinaConcessionaria } from '../types';
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

  // MAPEAMENTO CORRETO DOS CAMPOS INVERTIDOS DO BANCO DE DADOS
  const resolveCampos = (u: any) => {
    // 1. RAZÃO SOCIAL & CNPJ
    // No initialData: u.razaoSocial contém o nome da empresa ("CLARO SA"), e u.cnpj contém o CNPJ formatado
    const razaoSocial = u.razaoSocial || u.razaoSocialCliente || 'Pendente';
    const cnpj = u.cnpj || u.cnpjCliente || 'Pendente';

    // 2. CONCESSIONÁRIA & CONTATO DA CONCESSIONÁRIA (Coluna G)
    const concessionaria = u.concessionaria || u.disco || 'Não informada';
    
    // O campo u.contatoDisCo do initialData guarda o telefone/contato da concessionária (ex: 0800 770 4140)
    // Se contiver e-mail misturado (ex: grandesclientes@edp.com.br / 0800...), separamos:
    let contatoConcessionaria = '';
    let emailGestor = u.emailAgenteRelacionamento || '';
    let telGestor = u.telefoneAgenteRelacionamento || u.whatsappDisCo || '';
    let nomeGestor = u.nomeAgenteRelacionamento || '';

    const rawContato = String(u.contatoDisCo || '').trim();
    if (rawContato.includes('@')) {
      const parts = rawContato.split('/');
      const emailPart = parts.find(p => p.includes('@'));
      const telPart = parts.find(p => !p.includes('@'));
      if (emailPart) emailGestor = emailPart.trim();
      if (telPart) contatoConcessionaria = telPart.trim();
    } else {
      contatoConcessionaria = rawContato;
    }

    // 3. AGENTE / GESTOR DE RELACIONAMENTO (Colunas P e Q)
    // Se o nome do gestor não foi preenchido, define o valor padrão
    if (!nomeGestor || nomeGestor === 'Clientes Corporativos') {
      nomeGestor = emailGestor ? 'Gestor de Relacionamento' : '';
    }

    // 4. DADOS CADASTRAIS DA USINA (UG)
    // Cód. Cliente (Coluna H): no initialData foi parar em u.codigoCliente
    const codCliente = u.codigoCliente && u.codigoCliente !== 'N/A' ? u.codigoCliente : 'N/A';

    // Instalação Antiga UG (Coluna I): no initialData foi parar em u.codigoInstalacaoAntigaUG
    const instAntiga = u.codigoInstalacaoAntigaUG && u.codigoInstalacaoAntigaUG !== 'N/A' 
      ? u.codigoInstalacaoAntigaUG 
      : 'N/A';

    // Instalação Nova UG (Coluna J): no initialData foi parar em u.codigoInstalacaoNovaUG ou u.codigoInstalacaoUG
    const instNova = u.codigoInstalacaoNovaUG && u.codigoInstalacaoNovaUG !== 'N/A'
      ? u.codigoInstalacaoNovaUG
      : (u.codigoInstalacaoUG && u.codigoInstalacaoUG !== 'N/A' ? u.codigoInstalacaoUG : 'N/A');

    // Medidor (Coluna K): no initialData o número do medidor foi parar na propriedade u.medidor
    const medidor = u.medidor && u.medidor !== 'N/A' ? u.medidor : 'N/A';

    // 5. ENDEREÇO (Coluna R) & PONTO DE REFERÊNCIA (Coluna S)
    const endereco = u.endereco || 'Endereço não informado';
    const pontoReferencia = u.pontoReferencia && u.pontoReferencia.trim() !== '' && u.pontoReferencia.toUpperCase() !== 'N/A'
      ? u.pontoReferencia
      : '';

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
      pontoReferencia
    };
  };

  const filteredUsinas = useMemo(() => {
    if (!Array.isArray(usinas)) return [];
    const query = String(searchQuery || '').toLowerCase().trim();

    return usinas.filter((item) => {
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
    const set = new Set<string>();
    (usinas || []).forEach((u) => {
      const nome = String(u.usina || u.nome || '').trim();
      if (nome) set.add(nome);
    });
    return ['TODAS', ...Array.from(set).sort()];
  }, [usinas]);

  const uniqueRazoes = useMemo(() => {
    const set = new Set<string>();
    (usinas || []).forEach((u) => {
      const r = u.razaoSocial || u.razaoSocialCliente;
      if (r) set.add(r);
    });
    return ['TODAS', ...Array.from(set).sort()];
  }, [usinas]);

  const ufs = useMemo(() => {
    const set = new Set<string>();
    (usinas || []).forEach((u) => {
      if (u.uf) set.add(u.uf);
    });
    return ['TODAS', ...Array.from(set).sort()];
  }, [usinas]);

  const disCos = useMemo(() => {
    const set = new Set<string>();
    (usinas || []).forEach((u) => {
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

    const updated = usinas.map((u) => {
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
              <option key={d} value={d}>{d === 'TODAS' ? 'Todas Concessionárias' : d}</
