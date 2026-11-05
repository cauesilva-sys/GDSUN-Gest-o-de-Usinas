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
  AtSign
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

  // Count usinas with agent email
  const usinasWithEmailCount = useMemo(() => {
    return (usinas || []).filter((u) => {
      if (!u) return false;
      const email = String(u.emailAgenteRelacionamento || (u as any).emailAgente || '').trim();
      if (email !== '') return true;
      const contacts = parseContacts(String(u.contatoDisCo || ''));
      return contacts.some((c) => c.type === 'email');
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
    (usinas || []
