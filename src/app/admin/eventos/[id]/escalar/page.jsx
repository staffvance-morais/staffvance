"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, Search, Check, Shield, Map, AlertCircle, UserCheck, Loader2, Send } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

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

export default function EscalarEquipe() {
  const router = useRouter();
  const eventoId = useParams().id;
  
  const [eventoDetalhes, setEventoDetalhes] = useState({ titulo: "Carregando..." });
  const [equipe, setEquipe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Busca os detalhes do Evento para mostrar no Cabeçalho e enviar no E-mail
        const { data: evData } = await supabase.from('eventos').select('titulo, data_inicio').eq('id', eventoId).single();
        if (evData) setEventoDetalhes(evData);

        // 2. Busca a equipe
        const { data: perfisData, error } = await supabase.from('perfis').select('*').neq('role', 'admin'); 
        if (error) throw error;
        
        if (perfisData) {
          const equipeFormatada = perfisData.map(m => ({
            id: m.id,
            nome: m.nome_completo || "Sem nome", 
            email: m.email || "", // Preparado para o e-mail real
            funcao: m.role === 'staff' ? 'Staff Tático' : m.role, 
            foto: (m.foto_url && m.foto_url.trim() !== '') ? m.foto_url : null, 
            classificacao: m.classificacao || "",
            escalado: false,
            setor: "" 
          }));
          setEquipe(equipeFormatada);
        }
      } catch (error) {
        console.error("Erro interno:", error.message);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [eventoId]);

  const toggleStaff = (id) => {
    setEquipe(prev => prev.map(m => m.id === id ? { ...m, escalado: !m.escalado } : m));
  };

  const updateSetor = (id, novoSetor) => {
    setEquipe(prev => prev.map(m => m.id === id ? { ...m, setor: novoSetor } : m));
  };

  const handleConfirmarEscala = async () => {
    const selecionados = equipe.filter(m => m.escalado);
    if (selecionados.length === 0) return alert("Selecione pelo menos um membro.");
    
    setSalvando(true);
    try {
      // 1. Salva no Supabase
      const dadosParaInserir = selecionados.map(m => ({
        evento_id: eventoId,
        staff_id: m.id,
        setor: m.setor || "Geral" 
      }));
      const { error } = await supabase.from('escalas').insert(dadosParaInserir);
      if (error) throw error;

      // 2. Dispara Notificações de E-mail via API
      try {
        await fetch('/api/notificar-equipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            evento: eventoDetalhes,
            equipe: selecionados
          })
        });
      } catch (emailError) {
        console.error("Erro ao tentar chamar API de e-mail:", emailError);
      }

      alert(`Sucesso! Escala salva e notificações enviadas para ${selecionados.length} membros.`);
      router.push('/admin/eventos');
      
    } catch (error) {
      alert("Erro ao salvar: " + error.message);
    } finally { setSalvando(false); }
  };

  const equipeFiltrada = equipe.filter(m => m.nome.toLowerCase().includes(busca.toLowerCase()));
  const totalEscalados = equipe.filter(m => m.escalado).length;

  return (
    <div className="min-h-screen bg-[#171717] font-sans flex flex-col items-center">
      <div className="w-full max-w-[500px] min-h-screen flex flex-col bg-[#1c1c1c] relative border-x border-[#2a2a2a]">
        
        {/* CABEÇALHO ATUALIZADO */}
        <div className="flex items-center justify-between p-5 border-b border-[#333333] sticky top-0 bg-[#1c1c1c] z-10 shadow-sm">
          <div className="flex items-center gap-4 text-[#cccccc]">
            <button onClick={() => router.push('/admin/eventos')} className="w-10 h-10 flex items-center justify-center rounded-sm hover:bg-[#2a2a2a] cursor-pointer">
              <ArrowLeft size={24} strokeWidth={1.5} />
            </button>
            <div>
              <h1 className="text-[18px] font-semibold tracking-wide text-[#e5e5e5]">Escalar Equipe</h1>
              <p className="text-[12px] text-[#2563eb] font-bold uppercase truncate max-w-[200px]">{eventoDetalhes.titulo}</p>
            </div>
          </div>
          <Map size={24} className="text-[#999]" strokeWidth={1.5} />
        </div>
        
        <div className="bg-[#1a1a1a] p-4 flex justify-between border-b border-[#333]">
          <div className="flex items-center gap-2 text-[#999]"><UserCheck size={20} className="text-[#22c55e]" /><span className="text-[15px]">Efetivo selecionado:</span></div>
          <div className="text-[24px] font-bold text-[#e5e5e5]">{totalEscalados}</div>
        </div>
        
        <div className="p-4 bg-[#1c1c1c]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" size={20} />
            <input type="text" placeholder="Buscar segurança..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full bg-[#222] border border-[#3a3a3a] text-[#e5e5e5] h-[46px] pl-10 pr-4 outline-none rounded-sm" />
          </div>
        </div>
        
        <div className="flex-1 p-4 pt-0 overflow-y-auto">
          {loading ? <div className="py-10 text-center text-[#777]"><Loader2 className="animate-spin mx-auto mb-2" />Carregando...</div> : 
           equipeFiltrada.map(m => <StaffCard key={m.id} membro={m} onToggle={toggleStaff} onSetorChange={updateSetor} />)}
        </div>
        
        <div className="p-5 border-t border-[#333333] bg-[#1a1a1a] sticky bottom-0">
          <button onClick={handleConfirmarEscala} disabled={salvando} className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold py-4 rounded-sm flex justify-center items-center gap-2 disabled:opacity-50">
            {salvando ? <Loader2 className="animate-spin" size={22} /> : <Send size={22} strokeWidth={2} />}
            {salvando ? "Salvando e Notificando..." : "Confirmar e Notificar"}
          </button>
        </div>
      </div>
    </div>
  );
}