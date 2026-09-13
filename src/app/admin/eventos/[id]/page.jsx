"use client";
import { supabase } from "@/lib/supabase";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Edit3, 
  Calendar, 
  MapPin, 
  Briefcase, 
  Users, 
  DollarSign,
  Clock,
  Loader2,
  Image as ImageIcon,
  Printer,
  Compass,
  CheckCircle2,
  Trash2,
  AlertTriangle
} from "lucide-react";

export default function DetalhesEvento() {
  const router = useRouter();
  const params = useParams();
  const eventoId = params.id;

  const [evento, setEvento] = useState(null);
  const [totalEscalados, setTotalEscalados] = useState(0);
  const [loading, setLoading] = useState(true);

  // Estados para exclusão
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deletando, setDeletando] = useState(false);

  useEffect(() => {
    const fetchDetalhes = async () => {
      try {
        const { data: dadosEvento, error: erroEvento } = await supabase
          .from('eventos')
          .select('*')
          .eq('id', eventoId)
          .single();

        if (erroEvento) throw erroEvento;
        setEvento(dadosEvento);

        const { count, error: erroEscala } = await supabase
          .from('escalas')
          .select('*', { count: 'exact', head: true })
          .eq('evento_id', eventoId);

        if (!erroEscala && count !== null) {
          setTotalEscalados(count);
        }

      } catch (error) {
        console.error("Erro ao carregar detalhes do evento:", error.message);
      } finally {
        setLoading(false);
      }
    };

    if (eventoId) {
      fetchDetalhes();
    }
  }, [eventoId]);

  const handleExcluirEvento = async () => {
    setDeletando(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let deletado = false;

      if (session?.access_token) {
        const res = await fetch("/api/admin/deletar-evento", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ eventoId }),
        });

        if (res.ok) {
          deletado = true;
        } else {
          const json = await res.json().catch(() => ({}));
          console.warn("Aviso rota API deletar evento:", json.error);
        }
      }

      if (!deletado) {
        // Fallback direto
        await supabase
          .from("escalas")
          .delete()
          .eq("evento_id", eventoId);

        const { error: dbError } = await supabase
          .from("eventos")
          .delete()
          .eq("id", eventoId);

        if (dbError) throw dbError;
      }

      setShowConfirmDelete(false);
      router.push('/admin/eventos');
    } catch (err) {
      console.error("Erro ao excluir evento:", err);
      alert("Erro ao excluir evento: " + (err.message || "Tente novamente"));
      setDeletando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#171717] flex flex-col items-center justify-center text-[#777]">
        <Loader2 className="animate-spin mb-4 text-[#2563eb]" size={40} />
        <p>Carregando informações da operação...</p>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="min-h-screen bg-[#171717] flex flex-col items-center justify-center text-[#777]">
        <p>Evento não encontrado.</p>
        <button onClick={() => router.push('/admin/eventos')} className="mt-4 text-[#2563eb] hover:underline">Voltar para a lista</button>
      </div>
    );
  }

  let dataFormatada = "Data a definir";
  let horaFormatada = "Hora a definir";
  
  if (evento.data_inicio) {
    const dInicio = new Date(evento.data_inicio);
    dataFormatada = dInicio.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    horaFormatada = dInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    if (evento.data_fim) {
      const dFim = new Date(evento.data_fim);
      horaFormatada += " às " + dFim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
  }

  // Verifica se o local possui mapa tático (Presidente Vargas ou flag no banco)
  const possuiMapaTatico = 
    evento.mapa_tatico === true || 
    (evento.endereco_texto && evento.endereco_texto.toLowerCase().includes("presidente vargas"));

  return (
    <div className="min-h-screen bg-[#171717] print:bg-white font-sans flex flex-col items-center">
      <div className="w-full max-w-[500px] min-h-screen flex flex-col bg-[#1c1c1c] print:bg-white relative border-x border-[#2a2a2a] print:border-none">
        
        {/* CABEÇALHO */}
        <div className="print:hidden flex items-center justify-between p-5 border-b border-[#333333] sticky top-0 bg-[#1c1c1c] z-10 shadow-sm">
          <div className="flex items-center gap-4 text-[#cccccc]">
            <button 
              onClick={() => router.push('/admin/eventos')} 
              className="w-10 h-10 flex items-center justify-center rounded-sm hover:bg-[#2a2a2a] transition-colors cursor-pointer"
            >
              <ArrowLeft size={24} strokeWidth={1.5} />
            </button>
            <h1 className="text-[18px] font-semibold tracking-wide text-[#e5e5e5]">Detalhes da Operação</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowConfirmDelete(true)}
              title="Excluir operação"
              className="flex items-center gap-1.5 text-red-400 hover:text-red-300 font-bold text-[14px] bg-red-950/40 border border-red-900/60 px-3 py-2 rounded-sm transition-colors cursor-pointer"
            >
              <Trash2 size={16} strokeWidth={2} />
              EXCLUIR
            </button>

            <button 
              onClick={() => router.push(`/admin/eventos/${eventoId}/editar`)}
              className="flex items-center gap-2 text-[#2563eb] hover:text-[#1d4ed8] font-bold text-[14px] bg-[#2563eb]/10 px-3 py-2 rounded-sm transition-colors cursor-pointer"
            >
              <Edit3 size={18} strokeWidth={2} />
              EDITAR
            </button>
          </div>
        </div>

        {/* CABEÇALHO EXCLUSIVO PARA O PDF */}
        <div className="hidden print:block text-center pt-8 pb-4 border-b-2 border-black mb-6">
          <h1 className="text-2xl font-black uppercase tracking-widest">Wadjet Segurança</h1>
          <p className="text-sm text-gray-500 uppercase tracking-widest mt-1">Relatório Oficial de Operação</p>
        </div>

        {/* IMAGEM DO EVENTO */}
        <div className="w-full h-[200px] bg-[#111] print:bg-gray-200 relative border-b border-[#333] print:border-black">
          {evento.foto_local ? (
            <img src={evento.foto_local} alt={evento.titulo} className="w-full h-full object-cover print:opacity-80" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#555] print:text-black">
              <ImageIcon size={40} className="mb-2" />
              <span className="text-[14px]">Sem imagem do local</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c1c] to-transparent print:hidden"></div>
        </div>

        {/* INFORMAÇÕES PRINCIPAIS */}
        <div className="p-6 -mt-10 print:mt-4 relative z-0">
          <div className="bg-[#222] print:bg-white border border-[#3a3a3a] print:border-black rounded-md p-5 shadow-lg print:shadow-none">
            <h2 className="text-[#e5e5e5] print:text-black text-[24px] font-bold leading-tight uppercase tracking-wide mb-1">
              {evento.titulo}
            </h2>
            <div className="flex items-center gap-2 text-[#2563eb] print:text-gray-700 text-[14px] font-semibold uppercase mb-5">
              <Briefcase size={16} />
              {evento.nome_contratante || "Contratante não informado"}
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 text-[#ccc] print:text-black">
                <Calendar className="text-[#777] print:text-black mt-0.5 shrink-0" size={20} />
                <div>
                  <p className="text-[13px] text-[#777] print:text-gray-600 uppercase tracking-wider font-semibold">Data da Operação</p>
                  <p className="text-[16px] font-medium">{dataFormatada}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-[#ccc] print:text-black">
                <Clock className="text-[#777] print:text-black mt-0.5 shrink-0" size={20} />
                <div>
                  <p className="text-[13px] text-[#777] print:text-gray-600 uppercase tracking-wider font-semibold">Horário</p>
                  <p className="text-[16px] font-medium">{horaFormatada}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-[#ccc] print:text-black">
                <MapPin className="text-[#777] print:text-black mt-0.5 shrink-0" size={20} />
                <div>
                  <p className="text-[13px] text-[#777] print:text-gray-600 uppercase tracking-wider font-semibold">Local (Endereço)</p>
                  <p className="text-[16px] font-medium">{evento.endereco_texto || "Não informado"}</p>
                </div>
              </div>

              <div className="hidden print:flex items-start gap-3 text-black pt-4 border-t border-gray-300 mt-4">
                <Users className="text-black mt-0.5 shrink-0" size={20} />
                <div>
                  <p className="text-[13px] text-gray-600 uppercase tracking-wider font-semibold">Efetivo Total Escalado</p>
                  <p className="text-[16px] font-bold">{totalEscalados} Seguranças</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PAINEL DE CONTROLE */}
        <div className="px-6 pb-8 flex-1 print:hidden">
          <h3 className="text-[#999] text-[13px] uppercase tracking-widest font-bold mb-3">Painel de Controle</h3>
          
          <div className="flex flex-col gap-3">
            
            {/* BOTÃO INTELIGENTE DO MAPA TÁTICO */}
            {possuiMapaTatico && (
              <div 
                onClick={() => router.push(`/mapa?evento=${eventoId}`)}
                className="bg-[#2a2a2a] border border-[#16a34a]/40 hover:border-[#16a34a] p-4 rounded-sm flex items-center justify-between cursor-pointer transition-colors group shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#16a34a]/10 rounded-full flex items-center justify-center text-[#16a34a]">
                    <Compass size={22} />
                  </div>
                  <div>
                    <h4 className="text-[#e5e5e5] font-bold text-[15px] flex items-center gap-2">
                      Painel Tático Operacional
                      <span className="text-[10px] bg-[#16a34a] text-white px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Ativo</span>
                    </h4>
                    <p className="text-[#999] text-[13px]">Visualizar mapa e setores do Estádio</p>
                  </div>
                </div>
              </div>
            )}

            {/* Controle de Presença (Chamada) */}
            <div 
              onClick={() => router.push(`/coordenador/eventos/${eventoId}/presenca`)}
              className="bg-[#2a2a2a] border border-[#3a3a3a] hover:border-[#16a34a] p-4 rounded-sm flex items-center justify-between cursor-pointer transition-colors group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#16a34a]/10 rounded-full flex items-center justify-center text-[#16a34a]">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h4 className="text-[#e5e5e5] font-semibold text-[15px] flex items-center gap-2">
                    Controle de Presença
                    <span className="text-[10px] bg-[#16a34a]/20 text-emerald-400 border border-[#16a34a]/40 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Ao Vivo</span>
                  </h4>
                  <p className="text-[#999] text-[13px]">Lista de chamada em tempo real e selfies</p>
                </div>
              </div>
            </div>

            {/* Gerenciar Escala */}
            <div 
              onClick={() => router.push(`/admin/eventos/${eventoId}/escalar`)}
              className="bg-[#2a2a2a] border border-[#3a3a3a] hover:border-[#22c55e] p-4 rounded-sm flex items-center justify-between cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#22c55e]/10 rounded-full flex items-center justify-center text-[#22c55e]">
                  <Users size={20} />
                </div>
                <div>
                  <h4 className="text-[#e5e5e5] font-semibold text-[15px]">Gerenciar Escala</h4>
                  <p className="text-[#999] text-[13px]">{totalEscalados} segurança(s) escalado(s)</p>
                </div>
              </div>
            </div>

            {/* Acerto Financeiro */}
            <div 
              onClick={() => router.push(`/admin/financeiro/${eventoId}`)}
              className="bg-[#2a2a2a] border border-[#3a3a3a] hover:border-[#eab308] p-4 rounded-sm flex items-center justify-between cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#eab308]/10 rounded-full flex items-center justify-center text-[#eab308]">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h4 className="text-[#e5e5e5] font-semibold text-[15px]">Acerto Financeiro</h4>
                  <p className="text-[#999] text-[13px]">Balanço e pagamento da equipe</p>
                </div>
              </div>
            </div>

            {/* Exportar Relatório / PDF */}
            <div 
              onClick={() => window.print()}
              className="bg-[#2a2a2a] border border-[#3a3a3a] hover:border-[#3b82f6] p-4 rounded-sm flex items-center justify-between cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#3b82f6]/10 rounded-full flex items-center justify-center text-[#3b82f6]">
                  <Printer size={20} />
                </div>
                <div>
                  <h4 className="text-[#e5e5e5] font-semibold text-[15px]">Exportar Relatório</h4>
                  <p className="text-[#999] text-[13px]">Imprimir ou salvar em PDF</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>

      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {showConfirmDelete && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-6"
          onClick={() => !deletando && setShowConfirmDelete(false)}
        >
          <div 
            className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-sm p-6 w-full max-w-xs flex flex-col gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-950 border border-red-800 rounded-sm flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base leading-tight">Excluir evento</h3>
                <p className="text-gray-400 text-xs mt-0.5">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed">
              Deseja excluir a operação <strong className="text-white font-semibold">"{evento?.titulo}"</strong>? Todas as escalas e registros associados a este evento serão removidos.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                disabled={deletando}
                className="flex-1 py-3 border border-[#444] bg-[#2a2a2a] text-gray-300 rounded-sm text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExcluirEvento}
                disabled={deletando}
                className="flex-1 py-3 bg-red-700 hover:bg-red-600 text-white rounded-sm text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {deletando ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={15} className="animate-spin" /> Excluindo...
                  </span>
                ) : (
                  <>
                    <Trash2 size={15} />
                    Excluir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}