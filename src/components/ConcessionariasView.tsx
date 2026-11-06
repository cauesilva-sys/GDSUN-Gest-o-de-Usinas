import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
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
  User, 
  Mail, 
  ExternalLink,
  Loader2,
  RefreshCw
} from 'lucide-react';

const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/1BrlpPTiB1yEkODIvTBpBWKM0h_SMJcywuwH7VWLiTXk/export?format=csv&gid=1570514093";

interface ConcessionariasViewProps {
  usinas?: UsinaConcessionaria[];
  searchQuery: string;
  selectedUsinaFilter: string;
  setSelectedUsinaFilter: (usina: string) => void;
  onUpdateUsinas?: (updated: UsinaConcessionaria[]) => void;
}

export const ConcessionariasView: React.FC<ConcessionariasViewProps> = ({ 
  searchQuery = '',
  selectedUsinaFilter = 'TODAS',
  setSelectedUsinaFilter,
}) => {
  const [usinas, setUsinas] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedUf, setSelectedUf] = useState<string>('TODAS');
  const [selectedDisCo, setSelectedDisCo] = useState<string>('TODAS');
  const [selectedRazaoFilter, setSelectedRazaoFilter] = useState<string>('TODAS');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const carregarGoogleSheets = async () => {
    setLoading(true);
    try {
      // Adiciona timestamp para não pegar cache do navegador ao atualizar no Google Sheets
      const res = await fetch(`${GOOGLE_SHEETS_CSV_URL}&t=${Date.now()}`);
      const csvText = await res.text();

      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data as string[][];
          if (!rows || rows.length < 2) {
            setLoading(false);
            return;
          }

          // Pula a linha 0 (cabeçalho) e mapeia pelas colunas
          const dadosMapeados = rows.slice(1).map((row, idx) => {
            const rawContato = String(row[6] || '').trim(); // Coluna G
            let contatoConc = '';
            let emailGestor = String(row[15] || '').trim();  // Coluna P
            let telGestor = String(row[16] || '').trim();    // Coluna Q

            // Trata caso email/telefone estejam na coluna G
            if (rawContato.includes('@')) {
              const parts = rawContato.split('/');
              const emailPart = parts.find(p => p.includes('@'));
              const telPart = parts.find(p => !p.includes('@'));
              if (emailPart && !emailGestor) emailGestor = emailPart.trim();
              if (telPart && !contatoConc) contatoConc = telPart.trim();
            } else {
              contatoConc = rawContato;
            }

            return {
              id: `usina_${idx + 1}`,
              coser: String(row[0] || idx + 1).trim(),
              usina: String(row[1] || '').trim(),
              siglaAntiga: String(row[2] || '').trim(),
              siglaNova: String(row[3] || '').trim(),
              uf: String(row[4] || '').trim(),
              concessionaria: String(row[5] || 'Não informada').trim(),
              contatoConcessionaria: contatoConc,
              codigoCliente: String(row[7] || 'N/A').trim(),                  // Coluna H
              codigoInstalacaoAntigaUG: String(row[8] || 'N/A').trim(),       // Coluna I
              codigoInstalacaoNovaUG: String(row[9] || 'N/A').trim(),         // Coluna J
              medidor: String(row[10] || 'N/A').trim(),                       // Coluna K
              razaoSocial: String(row[11] || 'Pendente').trim(),              // Coluna L
              cnpj: String(row[12] || 'Pendente').trim(),                     // Coluna M
              emailGestor: emailGestor,                                       // Coluna P
              telGestor: telGestor,                                           // Coluna Q
              nomeGestor: emailGestor ? 'Gestor de Relacionamento' : '',
              endereco: String(row[17] || 'Endereço não informado').trim(),   // Coluna R
              pontoReferencia: String(row[18] || '').trim(),                  // Coluna S
              googleMapsUrl: String(row[19] || '').trim()
            };
          });

          setUsinas(dadosMapeados);
          setLoading(false);
        },
        error: (err) => {
          console.error("Erro ao converter CSV:", err);
          setLoading(false);
        }
      });
    } catch (err) {
      console.error("Erro ao buscar dados do Google Sheets:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarGoogleSheets();
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtros dinâmicos
  const filteredUsinas = useMemo(() => {
    const query = String(searchQuery || '').toLowerCase().trim();

    return usinas.filter((item) => {
      const matchUsina = selectedUsinaFilter === 'TODAS' || item.usina === selectedUsinaFilter;
      const matchUf = selectedUf === 'TODAS' || item.uf === selectedUf;
      const matchDisCo = selectedDisCo === 'TODAS' || item.concessionaria === selectedDisCo;
      const matchRazao = selectedRazaoFilter === 'TODAS' || item.razaoSocial === selectedRazaoFilter;

      if (!matchUsina || !matchUf || !matchDisCo || !matchRazao) return false;
      if (!query) return true;

      return (
        item.usina.toLowerCase().includes(query) ||
        item.razaoSocial.toLowerCase().includes(query) ||
        item.cnpj.includes(query) ||
        item.codigoCliente.toLowerCase().includes(query) ||
        item.codigoInstalacaoNovaUG.toLowerCase().includes(query) ||
        item.medidor.toLowerCase().includes(query) ||
        item.endereco.toLowerCase().includes(query) ||
        item.emailGestor.toLowerCase().includes(query)
      );
    });
  }, [usinas, searchQuery, selectedUsinaFilter, selectedUf, selectedDisCo, selectedRazaoFilter]);

  const uniqueUsinas = useMemo(() => {
    const set = new Set<string>();
    usinas.forEach((u) => { if (u.usina) set.add(u.usina); });
    return ['TODAS', ...Array.from(set).sort()];
  }, [usinas]);

  const uniqueRazoes = useMemo(() => {
    const set = new Set<string>();
    usinas.forEach((u) => { if (u.razaoSocial && u.razaoSocial !== 'Pendente') set.add(u.razaoSocial); });
    return ['TODAS', ...Array.from(set).sort()];
  }, [usinas]);

  const ufs = useMemo(() => {
    const set = new Set<string>();
    usinas.forEach((u) => { if (u.uf) set.add(u.uf); });
    return ['TODAS', ...Array.from(set).sort()];
  }, [usinas]);

  const disCos = useMemo(() => {
    const set = new Set<string>();
    usinas.forEach((u) => { if (u.concessionaria) set.add(u.concessionaria); });
    return ['TODAS', ...Array.from(set).sort()];
  }, [usinas]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
        <span className="text-sm font-bold text-slate-700">Carregando dados da planilha do Google Sheets...</span>
      </div>
    );
  }

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

          <button
            onClick={carregarGoogleSheets}
            className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
            title="Recarregar dados da planilha"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Atualizar</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600 font-medium">
            Exibindo <strong className="text-slate-900">{filteredUsinas.length}</strong> de {usinas.length} usinas
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
        {filteredUsinas.map((d) => {
          const cardKey = d.id;
          const siglaExibida = d.siglaNova || d.siglaAntiga || '';

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
                        {d.uf || 'UF'}
                      </span>
                      <h4 className="font-extrabold text-slate-900 group-hover:text-amber-700 transition-colors text-sm">
                        {d.usina}
                      </h4>
                    </div>
                    {siglaExibida && (
                      <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                        Sigla: <span className="font-mono font-bold text-slate-700">{siglaExibida}</span>
                      </div>
                    )}
                  </div>
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

                    {/* Email do Gestor (Coluna P) */}
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
                        <span className="font-bold text-slate-900">{d.codigoCliente}</span>
                      </div>
                      {/* Instalação Antiga (Coluna I) */}
                      <div className="flex justify-between items-center bg-white px-2.5 py-1 rounded-md border border-slate-200/80">
                        <span className="text-slate-500 font-sans text-[10px] uppercase font-bold">INSTALAÇÃO ANTIGA (UG):</span>
                        <span className="font-bold text-slate-800">{d.codigoInstalacaoAntigaUG}</span>
                      </div>
                      {/* Instalação Nova (Coluna J) */}
                      <div className="flex justify-between items-center bg-amber-50 px-2.5 py-1 rounded-md border border-amber-300">
                        <div className="flex items-center gap-1">
                          <span className="text-amber-900 font-sans text-[10px] uppercase font-bold">INSTALAÇÃO NOVA (UG):</span>
                          <span className="text-[8px] bg-amber-600 text-white font-extrabold px-1 rounded uppercase">Nova</span>
                        </div>
                        <span className="font-extrabold text-amber-950">{d.codigoInstalacaoNovaUG}</span>
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
                    
                    {d.pontoReferencia && d.pontoReferencia !== 'N/A' && (
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

              {d.googleMapsUrl && d.googleMapsUrl.startsWith('http') && (
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
    </div>
  );
};
