"use client";
import { supabase } from "@/lib/supabase";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Edit3, 
  Calendar, 
  MapPin, 
  Briefcase, 
  Users, 
  Clock,
  Loader2,
  Image as ImageIcon,
  Compass,
  CheckCircle2,
  Shirt,
  Send,
  Award,
  History
} from "lucide-react";
import AvaliacaoEncerramentoModal, { isGestorAutorizado } from "@/components/AvaliacaoEncerramentoModal";
import RelatorioEventoHub from "@/components/RelatorioEventoHub";

export default function DetalhesEventoCoordenador() {
  const router = useRouter();
  const params = useParams();
  const eventoId = params.id;

  const [evento, setEvento] = useState(null);
  const [escalas, setEscalas] = useState([]);
  const [totalEscalados, setTotalEscalados] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("coordenador");

  // Modal de Classificação e Anotações no Encerramento
  const [modalAvaliacaoAberto, setModalAvaliacaoAberto] = useState(false);

  // Estados para envio de e-mails operacionais
  const [enviandoVestuario, setEnviandoVestuario] = useState(false);
  const [vestuarioEnviado, setVestuarioEnviado] = useState(false);
  const [notificandoEquipe, setNotificandoEquipe] = useState(false);
  const [equipeNotificada, setEquipeNotificada] = useState(false);

  const fetchDetalhes = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: perfilData } = await supabase
          .from("perfis")
          .select("role")
          .eq("id", session.user.id)
          .single();
        if (perfilData?.role) {
          setUserRole(perfilData.role.toLowerCase().trim());
        }
      }

      const { data: dadosEvento, error: erroEvento } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', eventoId)
        .single();

      if (erroEvento) throw erroEvento;
      setEvento(dadosEvento);

      const { data: dadosEscalas, error: erroEscala } = await supabase
        .from('escalas')
        .select(`
          id,
          evento_id,
          staff_id,
          setor,
          valor_pago,
          status_pagamento,
          status_presenca,
          checkin_em,
          checkout_em,
          perfis (
            id,
            nome_completo,
            cpf,
            whatsapp,
            chave_pix,
            uniforme,
            role,
            cargo,
            classificacao,
            anotacoes,
            foto_url
          )
        `)
        .eq('evento_id', eventoId);

      if (!erroEscala && dadosEscalas) {
        setEscalas(dadosEscalas);
        setTotalEscalados(dadosEscalas.length);
      }

    } catch (error) {
      console.error("Erro ao carregar detalhes do evento:", error.message);
    } finally {
      setLoading(false);
    }
  }, [eventoId]);

  useEffect(() => {
    if (eventoId) {
      fetchDetalhes();
    }
  }, [eventoId, fetchDetalhes]);

  const handleArquivarNoHistorico = async () => {
    try {
      const { error } = await supabase
        .from("eventos")
        .update({ escopo: "arquivado" })
        .eq("id", eventoId);
      if (error) throw error;
      setEvento((prev) => (prev ? { ...prev, escopo: "arquivado" } : prev));
      setModalAvaliacaoAberto(false);
      alert("✅ Avaliações salvas e evento movido para a aba Histórico!");
    } catch (err) {
      console.error("Erro ao arquivar evento:", err);
      alert("Erro ao enviar evento para o histórico.");
    }
  };

  const handleEnviarRelatorioVestuario = async () => {
    if (totalEscalados === 0) {
      alert("Nenhum membro escalado para gerar relatório de vestuário.");
      return;
    }
    setEnviandoVestuario(true);
    try {
      const res = await fetch("/api/resumo-camisas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventoId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVestuarioEnviado(true);
        alert(`✅ ${data.message || "Relatório de uniformes enviado para admin e coordenadores/produtores escalados!"}`);
      } else {
        alert("Aviso: " + (data.message || data.error || "Não foi possível enviar o relatório."));
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar relatório de vestuário.");
    } finally {
      setEnviandoVestuario(false);
    }
  };

  const handleNotificarEquipe = async () => {
    if (totalEscalados === 0) {
      alert("Nenhum membro escalado nesta operação.");
      return;
    }
    const confirma = window.confirm(`Deseja disparar aviso de convocação por e-mail para os ${totalEscalados} membros escalados nesta operação?`);
    if (!confirma) return;

    setNotificandoEquipe(true);
    try {
      const res = await fetch("/api/notificar-equipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventoId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEquipeNotificada(true);
        alert(`✅ ${data.message}`);
      } else {
        alert("Aviso: " + (data.message || data.error || "Não foi possível enviar as notificações."));
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao disparar notificações para a equipe.");
    } finally {
      setNotificandoEquipe(false);
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
        <button onClick={() => router.push('/coordenador/eventos')} className="mt-4 text-[#2563eb] hover:underline">Voltar para a lista</button>
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

  const possuiMapaTatico = 
    evento.mapa_tatico === true || 
    (evento.endereco_texto && evento.endereco_texto.toLowerCase().includes("presidente vargas"));

  const podeVerAvaliacoes = isGestorAutorizado(userRole);

  return (
    <div className="min-h-screen bg-[#171717] font-sans flex flex-col items-center">
      <div className="w-full max-w-[540px] min-h-screen flex flex-col bg-[#1c1c1c] relative border-x border-[#2a2a2a]">
        
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between p-5 border-b border-[#333333] sticky top-0 bg-[#1c1c1c] z-10 shadow-sm">
          <div className="flex items-center gap-4 text-[#cccccc]">
            <button 
              onClick={() => router.push('/coordenador/eventos')} 
              className="w-10 h-10 flex items-center justify-center rounded-sm hover:bg-[#2a2a2a] transition-colors cursor-pointer"
            >
              <ArrowLeft size={24} strokeWidth={1.5} />
            </button>
            <h1 className="text-[18px] font-semibold tracking-wide text-[#e5e5e5]">Detalhes da Operação</h1>
          </div>
          
          <button 
            onClick={() => router.push(`/coordenador/eventos/${eventoId}/editar`)}
            className="flex items-center gap-2 text-[#2563eb] hover:text-[#1d4ed8] font-bold text-[14px] bg-[#2563eb]/10 px-3 py-2 rounded-sm transition-colors cursor-pointer"
          >
            <Edit3 size={18} strokeWidth={2} />
            EDITAR
          </button>
        </div>

        {/* IMAGEM DO EVENTO */}
        <div className="w-full h-[200px] bg-[#111] relative border-b border-[#333]">
          {evento.foto_local ? (
            <img src={evento.foto_local} alt={evento.titulo} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#555]">
              <ImageIcon size={40} className="mb-2" />
              <span className="text-[14px]">Sem imagem do local</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c1c] to-transparent"></div>
        </div>

        {/* INFORMAÇÕES PRINCIPAIS */}
        <div className="p-6 -mt-10 relative z-0">
          <div className="bg-[#222] border border-[#3a3a3a] rounded-md p-5 shadow-lg">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-[#e5e5e5] text-[22px] font-bold leading-tight uppercase tracking-wide mb-1">
                {evento.titulo}
              </h2>
              {evento.escopo === "arquivado" && (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold uppercase flex items-center gap-1 shrink-0">
                  <History size={11} /> No Histórico
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[#2563eb] text-[14px] font-semibold uppercase mb-5">
              <Briefcase size={16} />
              {evento.nome_contratante || "Contratante não informado"}
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 text-[#ccc]">
                <Calendar className="text-[#777] mt-0.5 shrink-0" size={20} />
                <div>
                  <p className="text-[13px] text-[#777] uppercase tracking-wider font-semibold">Data da Operação</p>
                  <p className="text-[16px] font-medium">{dataFormatada}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-[#ccc]">
                <Clock className="text-[#777] mt-0.5 shrink-0" size={20} />
                <div>
                  <p className="text-[13px] text-[#777] uppercase tracking-wider font-semibold">Horário</p>
                  <p className="text-[16px] font-medium">{horaFormatada}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-[#ccc]">
                <MapPin className="text-[#777] mt-0.5 shrink-0" size={20} />
                <div>
                  <p className="text-[13px] text-[#777] uppercase tracking-wider font-semibold">Local (Endereço)</p>
                  <p className="text-[16px] font-medium">{evento.endereco_texto || "Não informado"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PAINEL DE CONTROLE */}
        <div className="px-6 pb-8 flex-1">
          <h3 className="text-[#999] text-[13px] uppercase tracking-widest font-bold mb-3">Painel de Controle</h3>
          
          <div className="flex flex-col gap-3">
            
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

            {/* Controle de Presença */}
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
              onClick={() => router.push(`/coordenador/eventos/${eventoId}/escalar`)}
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

            {/* ENCERRAMENTO DO EVENTO: CLASSIFICAÇÃO (OURO, PRATA, BRONZE) E ANOTAÇÕES — VISÍVEL APENAS PARA ADMIN, COORDENADORES E PRODUTORES */}
            {podeVerAvaliacoes && (
              <div 
                onClick={() => setModalAvaliacaoAberto(true)}
                className="bg-[#2a2a2a] border border-yellow-500/40 hover:border-yellow-400 p-4 rounded-sm flex items-center justify-between cursor-pointer transition-colors group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-500/15 rounded-full flex items-center justify-center text-yellow-400 shrink-0">
                    <Award size={20} />
                  </div>
                  <div>
                    <h4 className="text-[#e5e5e5] font-semibold text-[15px] flex items-center gap-2 flex-wrap">
                      Classificar Staff & Anotações (Encerramento)
                      <span className="text-[10px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                        Ouro • Prata • Bronze
                      </span>
                    </h4>
                    <p className="text-[#999] text-[13px]">
                      Avaliar equipe escalada e registrar anotações confidenciais do evento
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Relatório de Vestuário */}
            <div 
              onClick={handleEnviarRelatorioVestuario}
              className="bg-[#2a2a2a] border border-[#10b981]/40 hover:border-[#10b981] p-4 rounded-sm flex items-center justify-between cursor-pointer transition-colors group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#10b981]/15 rounded-full flex items-center justify-center text-[#10b981]">
                  {enviandoVestuario ? <Loader2 size={20} className="animate-spin" /> : <Shirt size={20} />}
                </div>
                <div>
                  <h4 className="text-[#e5e5e5] font-semibold text-[15px] flex items-center gap-2">
                    Relatório de Vestuário
                    <span className="text-[10px] bg-[#10b981]/20 text-emerald-400 border border-[#10b981]/40 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                      {vestuarioEnviado ? "Enviado" : "Admin & Escalados"}
                    </span>
                  </h4>
                  <p className="text-[#999] text-[13px]">
                    {enviandoVestuario ? "Disparando relatório..." : "Enviar resumo de tamanhos para admins e coordenadores/produtores escalados"}
                  </p>
                </div>
              </div>
            </div>

            {/* Notificar Equipe */}
            <div 
              onClick={handleNotificarEquipe}
              className="bg-[#2a2a2a] border border-[#2563eb]/40 hover:border-[#2563eb] p-4 rounded-sm flex items-center justify-between cursor-pointer transition-colors group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2563eb]/15 rounded-full flex items-center justify-center text-[#60a5fa]">
                  {notificandoEquipe ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </div>
                <div>
                  <h4 className="text-[#e5e5e5] font-semibold text-[15px] flex items-center gap-2">
                    Notificar Equipe da Partida
                    <span className="text-[10px] bg-[#2563eb]/20 text-blue-400 border border-[#2563eb]/40 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                      {equipeNotificada ? "Avisos Enviados" : "E-mail Staff"}
                    </span>
                  </h4>
                  <p className="text-[#999] text-[13px]">
                    {notificandoEquipe ? "Enviando convocações..." : "Enviar aviso de convocação para todos os escalados"}
                  </p>
                </div>
              </div>
            </div>

            {/* CENTRAL ILUSTRATIVA DE EXPORTAR / BAIXAR PDF / COMPARTILHAR RELATÓRIO */}
            <RelatorioEventoHub
              evento={evento}
              escalas={escalas}
              userRole={userRole}
            />
            
          </div>
        </div>

      </div>

      {/* MODAL DE CLASSIFICAÇÃO E ANOTAÇÕES NO ENCERRAMENTO */}
      <AvaliacaoEncerramentoModal
        aberto={modalAvaliacaoAberto}
        onClose={() => setModalAvaliacaoAberto(false)}
        evento={evento}
        escalas={escalas}
        userRole={userRole}
        onSaved={fetchDetalhes}
        onArchiveEvent={handleArquivarNoHistorico}
      />
    </div>
  );
}
