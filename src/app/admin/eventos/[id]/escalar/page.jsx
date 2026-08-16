"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { 
  ArrowLeft, Search, Check, Shield, Map, AlertCircle, UserCheck, Loader2
} from "lucide-react";

// Conexão com o Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ==========================================
// COMPONENTE: CARD DO SEGURANÇA
// ==========================================
const StaffCard = ({ nome, funcao, foto, escalado, onToggle }) => (
  <div 
    onClick={onToggle}
    className={`flex items-center justify-between p-4 mb-2 rounded-sm border cursor-pointer transition-colors ${
      escalado ? 'bg-[#1e293b] border-[#3b82f6]' : 'bg-[#222222] border-[#3a3a3a] hover:bg-[#2a2a2a]'
    }`}
  >
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-[#333] rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-[#444]">
        {foto ? (
          <img src={foto} alt={nome} className="w-full h-full object-cover" />
        ) : (
          <Shield size={20} className={escalado ? "text-[#3b82f6]" : "text-[#777]"} />
        )}
      </div>
      
      <div>
        <h3 className={`text-[16px] font-semibold tracking-wide capitalize ${escalado ? 'text-white' : 'text-[#e5e5e5]'}`}>{nome}</h3>
        <p className="text-[#999999] text-[13px] mt-0.5 capitalize">{funcao}</p>
      </div>
    </div>

    <div className={`w-[24px] h-[24px] rounded-[2px] flex items-center justify-center border ${
      escalado ? 'bg-[#2563eb] border-[#2563eb]' : 'bg-[#1a1a1a] border-[#555]'
    }`}>
      {escalado && <Check size={16} className="text-white" strokeWidth={3.5} />}
    </div>
  </div>
);

// ==========================================
// PÁGINA: ESCALA TÁTICA DA EQUIPE
// ==========================================
export default function EscalarEquipe() {
  const router = useRouter();
  const params = useParams();
  const eventoId = params.id;

  const [equipe, setEquipe] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const { data, error } = await supabase
          .from('perfis') 
          .select('*')
          .neq('role', 'admin'); 

        if (error) {
          console.warn("Aviso: Erro ao buscar perfis.", error.message);
          setEquipe([]); 
          return;
        }

        if (data) {
          const equipeFormatada = data.map(membro => ({
            id: membro.id,
            nome: membro.nome_completo || "Sem nome", 
            funcao: membro.role === 'staff' ? 'Staff Tático' : membro.role, 
            foto: (membro.foto_url && membro.foto_url.trim() !== '') ? membro.foto_url : null, 
            escalado: false 
          }));
          setEquipe(equipeFormatada);
        }
      } catch (error) {
        console.error("Erro interno:", error.message);
        setEquipe([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, []);

  const toggleStaff = (id) => {
    setEquipe(prev => prev.map(membro => 
      membro.id === id ? { ...membro, escalado: !membro.escalado } : membro
    ));
  };

  // ==========================================
  // FUNÇÃO DO BOTÃO: SALVAR ESCALA COM 'staff_id'
  // ==========================================
  const handleConfirmarEscala = async () => {
    const selecionados = equipe.filter(m => m.escalado);

    if (selecionados.length === 0) {
      alert("⚠️ Selecione pelo menos um membro para confirmar a escala.");
      return;
    }

    setSalvando(true);
    try {
      // Mapeando exatamente com o nome da coluna correta do seu banco: 'staff_id'
      const dadosParaInserir = selecionados.map(membro => ({
        evento_id: eventoId,
        staff_id: membro.id
      }));

      const { error } = await supabase
        .from('escalas')
        .insert(dadosParaInserir);

      if (error) throw error;

      alert(`✅ Sucesso! Escala de ${selecionados.length} membros salva com sucesso.`);
      router.push('/admin/eventos');

    } catch (error) {
      console.error("Erro ao salvar escala:", error.message);
      alert("Erro ao salvar escala no banco: " + error.message);
    } finally {
      setSalvando(false);
    }
  };

  const equipeFiltrada = equipe.filter(membro => 
    membro.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const totalEscalados = equipe.filter(m => m.escalado).length;

  return (
    <div className="min-h-screen bg-[#171717] font-sans flex flex-col items-center">
      <div className="w-full max-w-[500px] min-h-screen flex flex-col bg-[#1c1c1c] relative border-x border-[#2a2a2a]">
        
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between p-5 border-b border-[#333333] sticky top-0 bg-[#1c1c1c] z-10 shadow-sm">
          <div className="flex items-center gap-4 text-[#cccccc]">
            <button onClick={() => router.push('/admin/eventos')} className="w-10 h-10 flex items-center justify-center rounded-sm hover:bg-[#2a2a2a] transition-colors cursor-pointer">
              <ArrowLeft size={24} strokeWidth={1.5} />
            </button>
            <div>
              <h1 className="text-[18px] font-semibold tracking-wide text-[#e5e5e5]">Escalar Equipe</h1>
              <p className="text-[12px] text-[#2563eb] font-medium uppercase tracking-wider">Ref: {eventoId?.slice(0,8)}</p>
            </div>
          </div>
          <button className="text-[#999] hover:text-white transition-colors cursor-pointer">
            <Map size={24} strokeWidth={1.5} />
          </button>
        </div>

        {/* CONTADOR DE EFETIVO */}
        <div className="bg-[#1a1a1a] p-4 flex items-center justify-between border-b border-[#333]">
          <div className="flex items-center gap-2 text-[#999]">
            <UserCheck size={20} className="text-[#22c55e]" />
            <span className="text-[15px]">Efetivo selecionado:</span>
          </div>
          <div className="text-[24px] font-bold text-[#e5e5e5]">
            {totalEscalados} <span className="text-[16px] font-normal text-[#666]">pessoas</span>
          </div>
        </div>

        {/* BARRA DE PESQUISA */}
        <div className="p-4 relative bg-[#1c1c1c]">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-[#777]" size={20} strokeWidth={1.5} />
          <input 
            type="text" 
            placeholder="Buscar segurança por nome..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-[#222222] border border-[#3a3a3a] text-[#e5e5e5] h-[46px] pl-[46px] pr-4 outline-none text-[15px] rounded-sm placeholder:text-[#666] focus:border-[#555] transition-colors" 
          />
        </div>

        {/* LISTA DE EQUIPE */}
        <div className="flex-1 p-4 pt-0 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4 text-[#777] text-[13px] uppercase tracking-wider font-semibold">
            <AlertCircle size={14} /> Disponíveis no RH
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-[#777]">
              <Loader2 className="animate-spin mb-3" size={32} />
              <p>Buscando equipe no banco de dados...</p>
            </div>
          ) : equipeFiltrada.length === 0 ? (
            <div className="text-center py-10 text-[#777] bg-[#222] rounded-sm border border-[#333]">
              <p className="font-semibold text-[#e5e5e5] mb-1">Nenhum segurança encontrado.</p>
              <p className="text-[13px]">A tabela está vazia ou a busca não retornou resultados.</p>
            </div>
          ) : (
            equipeFiltrada.map((membro) => (
              <StaffCard 
                key={membro.id}
                nome={membro.nome}
                funcao={membro.funcao}
                foto={membro.foto}
                escalado={membro.escalado}
                onToggle={() => toggleStaff(membro.id)}
              />
            ))
          )}
        </div>

        {/* BOTÃO FIXO DE CONFIRMAÇÃO */}
        <div className="p-5 border-t border-[#333333] bg-[#1a1a1a] sticky bottom-0">
          <button 
            onClick={handleConfirmarEscala}
            disabled={salvando}
            className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold py-4 text-[17px] tracking-wide rounded-sm transition-colors shadow-sm cursor-pointer flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {salvando ? <Loader2 className="animate-spin" size={22} /> : <Check size={22} strokeWidth={2} />}
            {salvando ? "Salvando Escala..." : `Confirmar Escala de ${totalEscalados} membros`}
          </button>
        </div>

      </div>
    </div>
  );
}