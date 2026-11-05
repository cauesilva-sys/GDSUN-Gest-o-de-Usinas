import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ConcessionariasView } from './components/ConcessionariasView';
import { ProvedoresView } from './components/ProvedoresView';
import { ResumoMetricsView } from './components/ResumoMetricsView';
import { initialUsinas, initialProvedores } from './data/initialData';
import { UsinaConcessionaria, ProvedorInternet, SyncConfig, ActiveTab } from './types';

// Parser CSV nativo embutido (sem dependência externa)
function parseCsvLinhas(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let insideQuote = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (insideQuote && next === '"') {
        cur += '"';
        i++;
      } else {
        insideQuote = !insideQuote;
      }
    } else if (c === ',' && !insideQuote) {
      row.push(cur.trim());
      cur = '';
    } else if ((c === '\r' || c === '\n') && !insideQuote) {
      if (c === '\r' && next === '\n') i++;
      row.push(cur.trim());
      if (row.some((cell) => cell.length > 0)) {
        lines.push(row);
      }
      row = [];
      cur = '';
    } else {
      cur += c;
    }
  }

  if (cur.length > 0 || row.length > 0) {
    row.push(cur.trim());
    if (row.some((cell) => cell.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

// Sanitização de Usinas: mapeamento apenas do e-mail da Coluna O (índice 14) e endereço da Coluna R (índice 17)
function sanitizarUsina(row: any, idx: number): UsinaConcessionaria {
  const isArr = Array.isArray(row);
  const nome = String((isArr ? row[1] : (row.nome || row.usina || row['Usina'])) || `Usina ${idx + 1}`).trim();

  // Coluna O (índice 14): apenas o e-mail do agente
  const emailCol = isArr 
    ? (row[14] || '') 
    : (row['E-mail Agente Relacionamento'] || row['emailAgente'] || row['emailAgenteRelacionamento'] || '');
  const emailFinal = String(emailCol).trim();

  // Coluna R (índice 17): Endereço da Usina
  const enderecoCol = isArr 
    ? (row[17] || '') 
    : (row['Endereço'] || row['Endereco'] || row['ENDEREÇO'] || row['Endereço da Usina'] || '');
  const enderecoFinal = String(enderecoCol).trim() !== '' 
    ? String(enderecoCol).trim() 
    : 'Endereço não informado';

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
    endereco: enderecoFinal,
    pontoReferencia: '',
    nomeAgente: 'Clientes Corporativos',
    nomeAgenteRelacionamento: 'Clientes Corporativos',
    emailAgente: emailFinal,
    emailAgenteRelacionamento: emailFinal,
    telefoneAgente: '',
    status: 'Ativa'
  } as UsinaConcessionaria;
}

// Sanitização de Provedores
function sanitizarProvedor(row: any[], idx: number): ProvedorInternet {
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
  const [activeTab, setActiveTab] = useState<ActiveTab>('concessionarias');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUsinaFilter, setSelectedUsinaFilter] = useState<string>('TODAS');

  const USINAS_GID = '1570514093';
  const PROVEDORES_GID = '1710018109'; 

  // Chave de armazenamento atualizada para puxar o e-mail da coluna O limpo
  const USINAS_STORAGE_KEY = 'gdsun_usinas_v73_apenas_email_colO';
  const PROVEDORES_STORAGE_KEY = 'gdsun_provedores_v73_apenas_email_colO';

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
    return (initialProvedores || []);
  });

  const [syncConfig, setSyncConfig] = useState<SyncConfig>({
    sheetsUrlUsinas: '',
    sheetsUrlProvedores: '',
    autoSyncEnabled: true,
    syncIntervalMinutes: 5,
    lastSyncTime: '',
    syncStatus: 'idle',
  });

  useEffect(() => {
    document.title = 'GDSUN Gestão de Usinas';
  }, []);

  const performSyncNow = useCallback(async () => {
    setSyncConfig((prev) => ({ ...prev, syncStatus: 'syncing' }));

    try {
      // 1. Download direto Usinas (gid=1570514093)
      const gvizUsinas = `https://docs.google.com/spreadsheets/d/1BrlpPTiB1yEkODIvTBpBWKM0h_SMJcywuwH7VWLiTXk/gviz/tq?tqx=out:csv&gid=${USINAS_GID}&t=${Date.now()}`;
      const resU = await fetch(gvizUsinas);
      if (resU.ok) {
        const csvU = await resU.text();
        const parsedU = parseCsvLinhas(csvU);
        if (parsedU.length > 1) {
          const listU = parsedU
            .slice(1)
            .filter((r) => r[1] && r[1].trim() !== '')
            .map((item, idx) => sanitizarUsina(item, idx));
          if (listU.length > 0) {
            setUsinas(listU);
            try { localStorage.setItem(USINAS_STORAGE_KEY, JSON.stringify(listU)); } catch {}
          }
        }
      }

      // 2. Download direto Provedores (gid=1710018109)
      const gvizProvedores = `https://docs.google.com/spreadsheets/d/1BrlpPTiB1yEkODIvTBpBWKM0h_SMJcywuwH7VWLiTXk/gviz/tq?tqx=out:csv&gid=${PROVEDORES_GID}&t=${Date.now()}`;
      const resP = await fetch(gvizProvedores);
      if (resP.ok) {
        const csvP = await resP.text();
        const parsedP = parseCsvLinhas(csvP);
        if (parsedP.length > 1) {
          const listP = parsedP
            .slice(1)
            .filter((r) => r[1] && r[1].trim() !== '')
            .map((item, idx) => sanitizarProvedor(item, idx));
          if (listP.length > 0) {
            setProvedores(listP);
            try { localStorage.setItem(PROVEDORES_STORAGE_KEY, JSON.stringify(listP)); } catch {}
          }
        }
      }

      setSyncConfig((prev) => ({
        ...prev,
        syncStatus: 'success',
        lastSyncTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      }));
    } catch (err) {
      console.error('Falha ao sincronizar:', err);
      setSyncConfig((prev) => ({ ...prev, syncStatus: 'error' }));
    }
  }, [PROVEDORES_GID, USINAS_GID]);

  useEffect(() => {
    performSyncNow();
  }, [performSyncNow]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased selection:bg-amber-500 selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedUsinaFilter={selectedUsinaFilter}
        setSelectedUsinaFilter={setSelectedUsinaFilter}
        syncConfig={syncConfig}
        onRefreshNow={performSyncNow}
        usinas={usinas}
        usinaCount={usinas.length}
        provedorCount={provedores.length}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'concessionarias' && (
          <ConcessionariasView 
            usinas={usinas} 
            searchQuery={searchQuery}
            selectedUsinaFilter={selectedUsinaFilter}
            setSelectedUsinaFilter={setSelectedUsinaFilter}
          />
        )}

        {activeTab === 'provedores' && (
          <ProvedoresView 
            provedores={provedores} 
            usinas={usinas} 
            searchQuery={searchQuery}
            selectedUsinaFilter={selectedUsinaFilter}
            setSelectedUsinaFilter={setSelectedUsinaFilter}
          />
        )}

        {activeTab === 'resumo' && (
          <ResumoMetricsView usinas={usinas} provedores={provedores} />
        )}
      </main>
    </div>
  );
}
