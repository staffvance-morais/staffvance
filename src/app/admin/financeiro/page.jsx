"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { 
  ArrowLeft, 
  Wallet, 
  Calendar, 
  MapPin, 
  ChevronRight,
  Loader2,
  DollarSign,
  Briefcase
} from "lucide-react";

// Conexão com o Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ==========================================
// COMPONENTE: CARD FINANCEIRO DO EVENTO
// ==========================================
// Passamos o 'router' como propriedade para ele conseguir navegar
const FinanceiroCard = ({ evento, router }) => {
  let dataFormatada = "Data não definida";
  if (evento.data_inicio) {
    const d = new Date(evento.data_inicio);
    dataFormatada = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  return (
    <div 
      // A mágica acontece aqui: ao clicar, ele vai para a rota com o ID do evento!
      onClick={() => router.push(`/admin/financeiro/${evento.id}`)}
      className="bg-[#222222] border border-[#3a3a3a] p-5 rounded-md mb-4 flex flex-col md:flex-row md:items-center justify-between hover:border-[#2563eb] cursor-pointer transition-all group"
    >
      
      {/* Informações Básicas do Evento */}
      <div className="flex flex-col gap-2 mb-4 md:mb-0">
        <h3 className="text-[#e5e5e5] text-[18px] font-semibold tracking-wide capitalize group-hover:text-[#2563eb] transition-colors">
          {evento.titulo || "Evento sem título"}
        </h3>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-[#999999] text-[14px]">
          <span className="flex items-center gap-1.5">
            <Calendar size={16} className="text-[#666]" /> {dataFormatada}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={16} className="text-[#666]" /> {evento.endereco_texto || 'Local não informado'}
          </span>
          <span className="flex items-center gap-1.5">
            <Briefcase size={16} className="text-[#666]" /> {evento.nome_contratante || 'Contratante não informado'}
          </span>
        </div>
      </div>

      {/* Status Financeiro e Seta */}
      <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-[#333]">
        <div className="flex flex-col md:items-end">
          <span className="text-[12px] text-[#777] uppercase tracking-wider mb-1">Status Financeiro</span>
          <div className="flex items-center gap-1.5 text-[#eab308] bg-[#eab308]/10 px-2 py-1 rounded-sm border border-[#eab308]/20">
            <DollarSign size={14} />
            <span className="font-medium text-[13px] uppercase tracking-wider">Acerto Pendente</span>
          </div>
        </div>
        
        <div className="w-10 h-10 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center group-hover:bg-[#2563eb] group-hover:border-[#2563eb] group-hover:text-white text-[#777] transition-all">
          <ChevronRight size={20} />
        </div>
      </div>

    </div>
  );
};

// ==========================================
// PÁGINA PRINCIPAL: GESTÃO FINANCEIRA
// ==========================================
export default function GestaoFinanceira() {
  const router = useRouter(); // Roteador ativado na página principal
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventosFinanceiro = async () => {
      try {
        const { data, error } = await supabase
          .from('eventos')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (data) {
          setEventos(data);
        }
      } catch (error) {
        console.error("Erro ao buscar dados financeiros:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEventosFinanceiro();
  }, []);

  return (
    <div className="min-h-screen bg-[#171717] font-sans flex flex-col items-center">
      
      <div className="w-full max-w-[900px] min-h-screen flex flex-col bg-[#1c1c1c] relative border-x border-[#2a2a2a]">
        
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between p-5 border-b border-[#333333] sticky top-0 bg-[#1c1c1c] z-10">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => router.push('/admin')} 
              className="w-11 h-11 flex items-center justify-center rounded-md border border-[#3a3a3a] bg-[#222] hover:bg-[#2a2a2a] transition-colors text-[#999] cursor-pointer"
            >
              <ArrowLeft size={22} strokeWidth={1.5} />
            </button>
            
            <div className="flex items-center gap-3 text-[#cccccc]">
              <Wallet size={24} className="text-[#2563eb]" strokeWidth={2} />
              <div>
                <h1 className="text-[18px] font-bold tracking-widest text-[#e5e5e5] uppercase">Gestão Financeira</h1>
                <p className="text-[12px] text-[#777] uppercase tracking-wider font-medium">Controle de pagamentos e eventos</p>
              </div>
            </div>
          </div>

          <div className="opacity-20 hidden sm:block">
            <img 
              src="/icon.png" 
              alt="Wadjet Logo" 
              className="w-10 h-10 object-contain grayscale" 
              onError={(e) => { e.target.style.display = "none"; }}
            />
          </div>
        </div>

        {/* ÁREA DE CONTEÚDO (LISTA DE EVENTOS) */}
        <div className="flex-1 p-5 md:p-8 overflow-y-auto bg-[#171717]">
          
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-[#e5e5e5] text-[16px] font-semibold">Balanço de Eventos</h2>
            <span className="text-[#777] text-[14px]">{eventos.length} operações registradas</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-[#777]">
              <Loader2 className="animate-spin mb-4 text-[#2563eb]" size={40} />
              <p className="text-[15px]">Sincronizando dados financeiros...</p>
            </div>
          ) : eventos.length === 0 ? (
            <div className="border border-[#2a2a2a] bg-[#1c1c1c] rounded-lg p-16 flex flex-col items-center justify-center mt-10">
              <Wallet size={48} className="text-[#444] mb-4" strokeWidth={1} />
              <p className="text-[#777] text-[15px]">Nenhum registro financeiro encontrado.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {eventos.map((evento) => (
                // Repassando a propriedade router para o card conseguir usar
                <FinanceiroCard key={evento.id} evento={evento} router={router} />
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}