"use client";
import { supabase } from "@/lib/supabase";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, Save, Loader2, Type, Briefcase, MapPin, 
  Calendar, Image as ImageIcon, Search, Check, Shield, Users
} from "lucide-react";

// Conexão com o Supabase

// Função auxiliar para data
const formatarDataParaInput = (dataString) => {
  if (!dataString) return "";
  const d = new Date(dataString);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
};

// ==========================================
// COMPONENTE: CARD DO SEGURANÇA
// ==========================================
const StaffCard = ({ membro, onToggle, onSetorChange }) => (
  <div className={`flex flex-col p-4 mb-2 rounded-sm border transition-colors ${membro.escalado ? 'bg-[#1e293b] border-[#3b82f6]' : 'bg-[#222222] border-[#3a3a3a] hover:bg-[#2a2a2a]'}`}>
    <div className="flex items-center justify-between cursor-pointer" onClick={() => onToggle(membro.id)}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[#333] rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-[#444]">
          {membro.foto ? <img src={membro.foto} alt={membro.nome} className="w-full h-full object-cover" /> : <Shield size={20} className={membro.escalado ? "text-[#3b82f6]" : "text-[#777]"} />}
        </div>
        <div>
          <h3 className={`text-[16px] font-semibold tracking-wide capitalize ${membro.escalado ? 'text-white' : 'text-[#e5e5e5]'}`}>{membro.nome}</h3>
          <p className="text-[#999999] text-[13px] mt-0.5 capitalize flex items-center gap-2">
            {membro.funcao} 
            {membro.classificacao && <span className="text-[#eab308] font-bold text-[11px] uppercase tracking-wider">[{membro.classificacao}]</span>}
          </p>
        </div>
      </div>
      <div className={`w-[24px] h-[24px] rounded-[2px] flex items-center justify-center border ${membro.escalado ? 'bg-[#2563eb] border-[#2563eb]' : 'bg-[#1a1a1a] border-[#555]'}`}>
        {membro.escalado && <Check size={16} className="text-white" strokeWidth={3.5} />}
      </div>
    </div>
    
    {/* Campo de Setor */}
    {membro.escalado && (
      <div className="mt-4 pt-3 border-t border-[#3b82f6]/30 animate-in fade-in slide-in-from-top-2">
        <input 
          type="text" 
          placeholder="Setor de atuação (Ex: Portão A, Gramado)" 
          value={membro.setor}
          onChange={(e) => onSetorChange(membro.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-[#0f172a] border border-[#3b82f6]/50 text-[#e5e5e5] h-[40px] px-3 outline-none text-[14px] rounded-sm placeholder:text-[#64748b] focus:border-[#3b82f6] transition-colors"
        />
      </div>
    )}
  </div>
);

// ==========================================
// PÁGINA PRINCIPAL DE EDIÇÃO (INFO + ESCALA)
// ==========================================
export default function EditarEvento() {
  const router = useRouter();
  const eventoId = useParams().id;

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Estados do Evento
  const [titulo, setTitulo] = useState("");
  const [nomeContratante, setNomeContratante] = useState("");
  const [endereco, setEndereco] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");

  // Estados da Escala
  const [equipe, setEquipe] = useState([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const fetchDadosCompletos = async () => {
      try {
        // 1. Puxa os dados em texto do evento
        const { data: eventoData, error: eventoError } = await supabase.from('eventos').select('*').eq('id', eventoId).single();
        if (eventoError) throw eventoError;

        if (eventoData) {
          setTitulo(eventoData.titulo || "");
          setNomeContratante(eventoData.nome_contratante || "");
          setEndereco(eventoData.endereco_texto || "");
          setFotoUrl(eventoData.foto_local || "");
          setDataInicio(formatarDataParaInput(eventoData.data_inicio));
          setDataFim(formatarDataParaInput(eventoData.data_fim));
        }

        // 2. Puxa todos os seguranças e quem já está escalado
        const { data: perfisData } = await supabase.from('perfis').select('*').neq('role', 'admin');
        const { data: escalasData } = await supabase.from('escalas').select('*').eq('evento_id', eventoId);

        if (perfisData) {
          const equipeFormatada = perfisData.map(p => {
            const escalaExistente = escalasData?.find(e => e.staff_id === p.id);
            return {
              id: p.id,
              nome: p.nome_completo || "Sem nome",
              funcao: p.role === 'staff' ? 'Staff Tático' : p.role,
              foto: p.foto_url || null,
              classificacao: p.classificacao || "",
              escalado: !!escalaExistente, // true se achou no banco
              setor: escalaExistente ? escalaExistente.setor : "",
              escalaId: escalaExistente ? escalaExistente.id : null // Guarda o ID da escala para atualizar depois
            };
          });
          setEquipe(equipeFormatada);
        }

      } catch (error) {
        console.error("Erro ao buscar dados:", error.message);
      } finally {
        setLoading(false);
      }
    };

    if (eventoId) fetchDadosCompletos();
  }, [eventoId]);

  // Controles da Escala
  const toggleStaff = (id) => setEquipe(prev => prev.map(m => m.id === id ? { ...m, escalado: !m.escalado } : m));
  const updateSetor = (id, novoSetor) => setEquipe(prev => prev.map(m => m.id === id ? { ...m, setor: novoSetor } : m));

  const handleSalvarTudo = async (e) => {
    e.preventDefault();
    if (!titulo || !dataInicio) return alert("Preencha título e data de início.");
    setSalvando(true);

    try {
      // 1. Salva as informações de texto
      const { error: updateError } = await supabase
        .from('eventos')
        .update({
          titulo, nome_contratante: nomeContratante, endereco_texto: endereco,
          data_inicio: dataInicio ? new Date(dataInicio).toISOString() : null,
          data_fim: dataFim ? new Date(dataFim).toISOString() : null,
          foto_local: fotoUrl,
        })
        .eq('id', eventoId);
      if (updateError) throw updateError;

      // 2. Sincroniza as Escalas da Equipe
      const selecionados = equipe.filter(e => e.escalado);
      const naoSelecionados = equipe.filter(e => !e.escalado);

      // A. Deleta quem foi desmarcado (mas que tinha ID no banco)
      const idsParaDeletar = naoSelecionados.filter(e => e.escalaId).map(e => e.escalaId);
      if (idsParaDeletar.length > 0) {
        await supabase.from('escalas').delete().in('id', idsParaDeletar);
      }

      // B. Insere gente nova (que foi marcada agora e não tinha ID no banco)
      const novosParaInserir = selecionados.filter(e => !e.escalaId).map(e => ({
        evento_id: eventoId,
        staff_id: e.id,
        setor: e.setor || "Geral"
      }));
      if (novosParaInserir.length > 0) {
        await supabase.from('escalas').insert(novosParaInserir);
      }

      // C. Atualiza o setor de quem já estava e continua marcado
      const mantidosParaAtualizar = selecionados.filter(e => e.escalaId);
      for (const item of mantidosParaAtualizar) {
        await supabase.from('escalas').update({ setor: item.setor || "Geral" }).eq('id', item.escalaId);
      }

      alert("✅ Evento e Equipe atualizados com sucesso!");
      router.push(`/admin/eventos/${eventoId}`);

    } catch (error) {
      console.error("Erro ao salvar:", error.message);
      alert("Erro ao salvar as alterações.");
    } finally {
      setSalvando(false);
    }
  };

  const equipeFiltrada = equipe.filter(m => m.nome.toLowerCase().includes(busca.toLowerCase()));
  const totalEscalados = equipe.filter(m => m.escalado).length;

  if (loading) return <div className="min-h-screen bg-[#171717] flex flex-col items-center justify-center text-[#777]"><Loader2 className="animate-spin mb-4 text-[#2563eb]" size={40} /><p>Preparando painel de edição...</p></div>;

  return (
    <div className="min-h-screen bg-[#171717] font-sans flex flex-col items-center pb-[100px]">
      <div className="w-full max-w-[600px] min-h-screen flex flex-col bg-[#1c1c1c] relative border-x border-[#2a2a2a]">
        
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between p-5 border-b border-[#333333] sticky top-0 bg-[#1c1c1c] z-10 shadow-sm">
          <div className="flex items-center gap-4 text-[#cccccc]">
            <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-sm hover:bg-[#2a2a2a] transition-colors cursor-pointer">
              <ArrowLeft size={24} strokeWidth={1.5} />
            </button>
            <div>
              <h1 className="text-[18px] font-semibold tracking-wide text-[#e5e5e5]">Central de Edição</h1>
              <p className="text-[12px] text-[#2563eb] font-medium uppercase tracking-wider">Ref: {eventoId?.slice(0,8)}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* BLOCO 1: DADOS DO EVENTO */}
          <div className="p-5 md:p-8">
            <h2 className="text-[#e5e5e5] text-[16px] font-bold uppercase tracking-wider mb-5 flex items-center gap-2 border-b border-[#333] pb-2">
              <Type size={18} className="text-[#2563eb]"/> Informações Gerais
            </h2>
            <form className="space-y-5">
              <div className="space-y-2">
                <label className="text-[#999] text-[12px] font-semibold uppercase tracking-wider">Nome da Operação *</label>
                <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full bg-[#222] border border-[#3a3a3a] text-white p-3.5 rounded-sm focus:border-[#2563eb] outline-none" required />
              </div>
              <div className="space-y-2">
                <label className="text-[#999] text-[12px] font-semibold uppercase tracking-wider">Contratante</label>
                <input type="text" value={nomeContratante} onChange={(e) => setNomeContratante(e.target.value)} className="w-full bg-[#222] border border-[#3a3a3a] text-white p-3.5 rounded-sm focus:border-[#2563eb] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[#999] text-[12px] font-semibold uppercase tracking-wider">Localização</label>
                <input type="text" value={endereco} onChange={(e) => setEndereco(e.target.value)} className="w-full bg-[#222] border border-[#3a3a3a] text-white p-3.5 rounded-sm focus:border-[#2563eb] outline-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[#999] text-[12px] font-semibold uppercase tracking-wider">Início *</label>
                  <input type="datetime-local" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full bg-[#222] border border-[#3a3a3a] text-white p-3.5 rounded-sm focus:border-[#2563eb] outline-none [color-scheme:dark]" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[#999] text-[12px] font-semibold uppercase tracking-wider">Término Estimado</label>
                  <input type="datetime-local" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full bg-[#222] border border-[#3a3a3a] text-white p-3.5 rounded-sm focus:border-[#2563eb] outline-none [color-scheme:dark]" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[#999] text-[12px] font-semibold uppercase tracking-wider">Link da Imagem</label>
                <input type="url" value={fotoUrl} onChange={(e) => setFotoUrl(e.target.value)} className="w-full bg-[#222] border border-[#3a3a3a] text-white p-3.5 rounded-sm focus:border-[#2563eb] outline-none" />
              </div>
            </form>
          </div>

          {/* DIVISOR DE SEÇÕES */}
          <div className="w-full h-3 bg-[#111] border-y border-[#333]"></div>

          {/* BLOCO 2: EDIÇÃO DE EQUIPE ESCALADA */}
          <div className="p-5 md:p-8">
            <div className="flex items-center justify-between mb-5 border-b border-[#333] pb-2">
              <h2 className="text-[#e5e5e5] text-[16px] font-bold uppercase tracking-wider flex items-center gap-2">
                <Users size={18} className="text-[#22c55e]"/> Escala Tática
              </h2>
              <span className="bg-[#22c55e]/20 text-[#22c55e] font-bold px-3 py-1 rounded-sm text-[13px]">{totalEscalados} escalados</span>
            </div>

            <div className="relative mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" size={20} />
              <input type="text" placeholder="Buscar segurança na equipe..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full bg-[#222] border border-[#3a3a3a] text-[#e5e5e5] h-[46px] pl-10 pr-4 outline-none rounded-sm" />
            </div>

            <div className="flex flex-col">
              {equipeFiltrada.map(m => (
                <StaffCard key={m.id} membro={m} onToggle={toggleStaff} onSetorChange={updateSetor} />
              ))}
            </div>
          </div>
        </div>

        {/* BOTÃO FIXO DE SALVAR (SALVA TUDO JUNTO) */}
        <div className="p-5 border-t border-[#333333] bg-[#1a1a1a] fixed bottom-0 w-full max-w-[600px] z-20">
          <button 
            onClick={handleSalvarTudo}
            disabled={salvando}
            className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold py-4 rounded-sm flex justify-center items-center gap-2 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
          >
            {salvando ? <Loader2 className="animate-spin" size={22} /> : <Save size={22} strokeWidth={2} />}
            {salvando ? "Sincronizando Dados..." : "Salvar Atualizações"}
          </button>
        </div>

      </div>
    </div>
  );
}