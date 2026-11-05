import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ConcessionariasView } from './components/ConcessionariasView';
import { ProvedoresView } from './components/ProvedoresView';
import { ResumoMetricsView } from './components/ResumoMetricsView';
import { initialUsinas, initialProvedores } from './data/initialData';
import { UsinaConcessionaria, ProvedorInternet, SyncConfig, ActiveTab } from './types';
import Papa from 'papaparse';

// Sanitização robusta para Usinas
function sanitizarUsina(row: any, idx: number): UsinaConcessionaria {
  // Lê tanto por array posicional quanto por chave de objeto
  const isArr = Array.isArray(row);
  const nome = String((isArr ? row[1] : (row.nome || row.usina || row['Usina'])) || `Usina ${idx + 1}`).trim();

  return {
    id: String((isArr ? row[0] : row.id) || `usina_${idx + 1}`),
    nome: nome,
    usina: nome,
    usinaNome: nome,
    sigla: String((isArr ? row[3] || row[2] : (row['Sigla Nova'] || row['Sigla Antiga'] || row.sigla)) || '').trim(),
    siglaAntiga: String((isArr ? row[2] : row['Sigla Antiga']) || '').trim(),
    siglaNova: String((isArr ? row[3] : row['Sigla Nova']) || '').trim(),
    uf: String((isArr ? row[4] : row['UF']) || '').trim(),
    concessionaria: String((isArr ? row[5] : (row['Concessionária (DisCo)'] || row.concessionaria)) || 'Não informada').trim(),
    codigoCliente: String((isArr ? row[6] : row['Código Cliente']) || 'N/A').trim(),
    instalacaoAntiga: String((isArr ? row[7] : row['Código Instalação Antiga (UG)']) || 'N/A').trim(),
    codigoInstalacaoAntigaUG: String((isArr ? row[7] : row['Código Instalação Antiga (UG)']) || 'N/A').trim(),
    instalacaoNova: String((isArr ? row[8] : row['Código Instalação Nova']) || 'N/A').trim(),
    codigoInstalacaoNovaUG: String((isArr ? row[8] : row['Código Instalação Nova']) || 'N/A').trim(),
    medidor: String((isArr ? row[9] : row['Medidor']) || 'N/A').trim(),
    razaoSocial: String((isArr ? row[10] : row['Razão Social Cliente']) || 'N/A').trim(),
    razaoSocialCliente: String((isArr ? row[10] : row['Razão Social Cliente']) || 'N/A').trim(),
    cnpj: String((isArr ? row[11] : row['CNPJ Cliente']) || 'N/A').trim(),
    cnpjCliente: String((isArr ? row[11] : row['CNPJ Cliente']) || 'N/A').trim(),
    endereco: 'Endereço não informado',
    pontoReferencia: '',
    nomeAgente: 'Clientes Corporativos',
    nomeAgenteRelacionamento: 'Clientes Corporativos',
    emailAgente: '',
    emailAgenteRelacionamento: '',
    telefoneAgente: '',
    status: 'Ativa'
  } as UsinaConcessionaria;
}

// Sanitização robusta para Provedores por Posição de Coluna (A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7)
function sanitizarProvedorPosicional(row: any[], idx: number): ProvedorInternet {
  return {
    id: String(row[0] || `p-${idx + 1}`).trim(),
    usina: String(row[1] || `Usina ${idx + 1}`).trim(),
    usinaNome: String(row[1] || `Usina ${idx + 1}`).trim(),
    razaoSocial: String(row[2] || 'Não informada').trim(),
    cnpj: String(row[3] || 'Não informado').trim(),
    provedor: String(row[4] || 'A Definir').trim(),
    contatoProvedor: String(row[5] || '-').trim(),
    tipoConexao: String(row[6] || 'Fibra').trim(),
    endereco: String(row[7] || 'Endereço não informado').trim(),
    enderecoUsina: String(row[7] || 'Endereço não informado').trim(),
    sitePortal: '',
    login: '',
    senha: '',
    contrato: ''
  } as ProvedorInternet;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('provedores');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUsinaFilter, setSelectedUsinaFilter] = useState<string>('TODAS');

  const USINAS_GID = '1570514093';
  const PROVEDORES_GID = '1710018109'; 

  // Força nova chave de cache para limpar dados desatualizados
  const USINAS_STORAGE_KEY = 'gdsun_usinas_clean_v60';
  const PROVEDORES_STORAGE_KEY = 'gdsun_provedores_clean_v60';

  const [usinas, setUsinas] = useState<UsinaConcessionaria[]>(() => {
    try {
      const saved = localStorage.getItem(USINAS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return (initialUsinas || []).map((u, i) => sanitizarUsina(u, i));
  });

  const [provedores, setProvedores] = useState<ProvedorInternet[]>(() => {
    try {
      const saved = localStorage.getItem(PROVEDORES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return (
