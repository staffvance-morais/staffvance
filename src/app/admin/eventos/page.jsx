"use client";
import { supabase } from "@/lib/supabase";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  CalendarDays, 
  Search, 
  Calendar, 
  Handshake, 
  ClipboardList, 
  Info, 
  Check, 
  Filter, 
  ChevronUp, 
  Menu,
  Loader2,
  Trash2,
  AlertTriangle,
  Archive,
  ArchiveRestore
} from "lucide-react";

// ==========================================
// COMPONENTE: CARD DO EVENTO (DINÂMICO)
// ==========================================
const EventCard = ({ id, image, title, location, date, time, client, staffCount, isLive, isPassado, isArquivado, selected, router, onDeleteClick, onArchiveClick, onUnarchiveClick }) => {
  return (
    <div className="border border-[#3a3a3a] bg-[#222222] flex flex-col mb-4 rounded-sm overflow-hidden shrink-0">
      {/* Imagem do Evento */}
      <div className="h-[100px] w-full relative border-b border-[#3a3a3a] bg-[#1a1a1a]">
        {image ? (
          <img src={image} className="object-cover w-full h-full" alt={title} />
        ) : (
          <div className="flex items-center justify-center h-full text-[#666] text-xs">Sem Imagem</div>
        )}

        {/* Badge discreta de evento passado, arquivado ou ao vivo */}
        {isLive ? (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/80 border border-[#22c55e]/50 px-2 py-0.5 rounded-sm text-[#22c55e] text-[11px] font-bold tracking-widest uppercase">
            <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse"></div> 
            AO VIVO
          </div>
        ) : isArquivado ? (
          <div className="absolute top-2 right-2 bg-black/80 border border-amber-500/50 px-2 py-0.5 rounded-sm text-amber-400 text-[11px] font-bold tracking-wider uppercase flex items-center gap-1">
            <Archive size={11} /> Arquivado
          </div>
        ) : isPassado ? (
          <div className="absolute top-2 right-2 bg-black/80 border border-[#555] px-2 py-0.5 rounded-sm text-[#999] text-[11px] font-bold tracking-wider uppercase">
            Encerrado
          </div>
        ) : null}
      </div>
      
      {/* Detalhes do Evento */}
      <div className="p-4 relative">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-[#e5e5e5] text-[20px] font-semibold leading-tight tracking-wide">{title}</h3>
            <p className="text-[#999999] text-[15px] mt-0.5">{location || "Local não informado"}</p>
          </div>
          
          {/* Checkbox Customizado */}
          <div className={`w-[22px] h-[22px] rounded-[2px] flex items-center justify-center mt-1 border ${selected ? 'bg-[#2563eb] border-[#2563eb]' : 'bg-[#1a1a1a] border-[#444]'}`}>
            {selected && <Check size={16} className="text-white" strokeWidth={3.5} />}
          </div>
        </div>

        <div className="flex justify-between items-end">
          {/* Informações em Lista */}
          <div className="space-y-2.5">
            <div className="flex items-center text-[#999999] text-[14.5px] gap-3">
              <Calendar size={18} className="text-[#777]" /> 
              <span>{date || "Data a definir"}, <strong className="text-[#bbb] font-medium">{time || ""}</strong></span>
            </div>
            <div className="flex items-center text-[#999999] text-[14.5px] gap-3">
              <Handshake size={18} className="text-[#777]" /> 
              <span>{client || "Cliente não informado"}</span>
            </div>
            <div className="flex items-center text-[#22c55e] font-medium text-[14.5px] gap-3">
              <ClipboardList size={18} className="text-[#22c55e]" /> 
              <span>{staffCount}</span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2">
            {/* Botão de Arquivar (para eventos encerrados e não arquivados) */}
            {isPassado && !isArquivado && (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  onArchiveClick({ id, title });
                }}
                title="Arquivar Evento"
                className="w-11 h-11 border border-amber-900/60 rounded-sm bg-amber-950/40 flex items-center justify-center text-amber-400 hover:bg-amber-950 hover:border-amber-600 hover:text-amber-200 transition-colors cursor-pointer"
              >
                <Archive size={19} strokeWidth={1.8} />
              </button>
            )}

            {/* Botão de Desarquivar (para eventos já arquivados) */}
            {isArquivado && (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  onUnarchiveClick({ id, title });
                }}
                title="Desarquivar Evento"
                className="w-11 h-11 border border-blue-900/60 rounded-sm bg-blue-950/40 flex items-center justify-center text-blue-400 hover:bg-blue-950 hover:border-blue-600 hover:text-blue-200 transition-colors cursor-pointer"
              >
                <ArchiveRestore size={19} strokeWidth={1.8} />
              </button>
            )}

            {/* Botão de Excluir */}
            <button 
              onClick={(e) => {
                e.preventDefault();
                onDeleteClick({ id, title });
              }}
              title="Excluir Evento"
              className="w-11 h-11 border border-[#442222] rounded-sm bg-[#2a1515] flex items-center justify-center text-red-500 hover:bg-red-950 hover:border-red-700 hover:text-red-300 transition-colors cursor-pointer"
            >
              <Trash2 size={19} strokeWidth={1.8} />
            </button>

            {/* Botão de Info */}
            <button 
              onClick={() => router.push(`/admin/eventos/${id}`)}
              title="Ver Detalhes do Evento"
              className="w-11 h-11 border border-[#444] rounded-sm bg-[#2a2a2a] flex items-center justify-center text-[#999] hover:bg-[#333] hover:text-[#2563eb] transition-colors cursor-pointer"
            >
              <Info size={24} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// PÁGINA PRINCIPAL: EVENTOS
// ==========================================
export default function PainelEventosMorais() {
  const router = useRouter(); 
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  // Estado para exclusão
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, title }
  const [deletando, setDeletando] = useState(false);

  // Estado para arquivamento e visualização
  const [aba, setAba] = useState("ativos"); // "ativos" | "arquivados"
  const [showMaisOpcoes, setShowMaisOpcoes] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(null); // { id, title }
  const [arquivando, setArquivando] = useState(false);

  const fetchEventos = async () => {
    try {
      const { data: evData, error: evError } = await supabase
        .from('eventos')
        .select('*')
        .order('created_at', { ascending: false });

      if (evError) throw evError;

      const { data: escData } = await supabase
        .from('escalas')
        .select('evento_id');

      if (evData) {
        const agora = new Date();
        const eventosFormatados = evData.map(ev => {
          let dataFormatada = "";
          let horaFormatada = "";
          let isPassado = false;

          if (ev.data_inicio) {
            const d = new Date(ev.data_inicio);
            dataFormatada = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            horaFormatada = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + " - " + 
              (ev.data_fim ? new Date(ev.data_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "");
            
            const dataFinal = ev.data_fim ? new Date(ev.data_fim) : d;
            isPassado = dataFinal < agora;
          }

          const isArquivado = ev.escopo === 'arquivado';
          const count = escData ? escData.filter(esc => esc.evento_id === ev.id).length : 0;

          return {
            id: ev.id,
            title: ev.titulo,
            location: ev.endereco_texto,
            client: ev.nome_contratante,
            date: dataFormatada,
            time: horaFormatada,
            image: ev.foto_local,
            staffCount: `${count} escalado(s)`, 
            isLive: false,
            isPassado,
            isArquivado,
            selected: true
          };
        });

        setEventos(eventosFormatados);
      }
    } catch (error) {
      console.error("Erro ao buscar eventos:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventos();
  }, []);

  const handleConfirmarExclusao = async () => {
    if (!confirmDelete) return;
    setDeletando(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      let deletado = false;

      // 1. Tenta deletar via API de admin com token
      if (session?.access_token) {
        const res = await fetch("/api/admin/deletar-evento", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ eventoId: confirmDelete.id }),
        });

        if (res.ok) {
          deletado = true;
        } else {
          const json = await res.json().catch(() => ({}));
          console.warn("Aviso rota API deletar evento:", json.error);
        }
      }

      // 2. Se a rota API falhou ou não tinha token de admin, tenta direto via client Supabase
      if (!deletado) {
        // Exclui escalas primeiro
        await supabase
          .from("escalas")
          .delete()
          .eq("evento_id", confirmDelete.id);

        const { error: dbError } = await supabase
          .from("eventos")
          .delete()
          .eq("id", confirmDelete.id);

        if (dbError) throw dbError;
      }

      setEventos(prev => prev.filter(e => e.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (err) {
      console.error("Erro ao excluir evento:", err);
      alert("Erro ao excluir evento: " + (err.message || "Tente novamente"));
    } finally {
      setDeletando(false);
    }
  };

  const handleConfirmarArquivamento = async () => {
    if (!confirmArchive) return;
    setArquivando(true);

    try {
      const { error } = await supabase
        .from('eventos')
        .update({ escopo: 'arquivado' })
        .eq('id', confirmArchive.id);

      if (error) throw error;

      setEventos(prev => prev.map(e => e.id === confirmArchive.id ? { ...e, isArquivado: true } : e));
      setConfirmArchive(null);
    } catch (err) {
      console.error("Erro ao arquivar evento:", err);
      alert("Erro ao arquivar evento: " + (err.message || "Tente novamente"));
    } finally {
      setArquivando(false);
    }
  };

  const handleDesarquivar = async (evInfo) => {
    try {
      const { error } = await supabase
        .from('eventos')
        .update({ escopo: null })
        .eq('id', evInfo.id);

      if (error) throw error;

      setEventos(prev => prev.map(e => e.id === evInfo.id ? { ...e, isArquivado: false } : e));
    } catch (err) {
      console.error("Erro ao desarquivar evento:", err);
      alert("Erro ao desarquivar evento: " + (err.message || "Tente novamente"));
    }
  };

  const totalAtivos = eventos.filter(ev => !ev.isArquivado).length;
  const totalArquivados = eventos.filter(ev => ev.isArquivado).length;

  const eventosPorAba = eventos.filter(ev => aba === 'arquivados' ? ev.isArquivado : !ev.isArquivado);

  const eventosFiltrados = eventosPorAba.filter(ev => 
    ev.title?.toLowerCase().includes(busca.toLowerCase()) ||
    ev.location?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#171717] font-sans flex flex-col items-center justify-center">
      
      <div className="w-full max-w-[400px] h-[100dvh] flex flex-col p-4 bg-[#171717] relative">
        
        {/* CABEÇALHO */}
        <div className="flex items-center gap-3 text-[#cccccc] pb-3 border-b border-[#333333]">
          <CalendarDays size={20} strokeWidth={1.5} />
          <h1 className="text-[17px] tracking-wide">
            {aba === 'arquivados' ? 'Eventos Arquivados' : 'Eventos'}
          </h1>
        </div>

        {/* BARRA DE PESQUISA */}
        <div className="mt-4 relative shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777]" size={22} strokeWidth={1.5} />
          <input 
            type="text" 
            placeholder="Toque para pesquisar" 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-[#2a2a2a] border border-[#3a3a3a] text-[#e5e5e5] py-3.5 pl-[46px] pr-4 outline-none text-[17px] rounded-sm placeholder:text-[#777] focus:border-[#555] transition-colors" 
          />
        </div>

        {/* CONTAGEM DE LISTA */}
        <div className="mt-4 mb-3 text-[14px] text-[#999999] tracking-wide shrink-0 flex items-center justify-between">
          <div>
            Listando <span className="text-[#e5e5e5] font-semibold">{eventosFiltrados.length}</span> {aba === 'arquivados' ? 'eventos arquivados' : 'eventos'}
          </div>
          {aba === 'arquivados' && (
            <button
              onClick={() => setAba('ativos')}
              className="text-xs text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer"
            >
              Voltar aos ativos
            </button>
          )}
        </div>

        {/* ÁREA DE ROLAGEM DOS CARDS */}
        <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#777]">
              <Loader2 className="animate-spin mb-2" size={28} />
              <p className="text-sm">Carregando eventos do banco...</p>
            </div>
          ) : eventosFiltrados.length === 0 ? (
            <div className="text-center py-20 text-[#777] bg-[#222] rounded-sm border border-[#333]">
              <p className="font-semibold text-[#e5e5e5] mb-1">
                {aba === 'arquivados' ? 'Nenhum evento arquivado.' : 'Nenhum evento encontrado.'}
              </p>
              <p className="text-[13px]">
                {aba === 'arquivados' 
                  ? 'Eventos passados arquivados aparecerão aqui.' 
                  : 'Cadastre o primeiro evento usando o botão abaixo.'}
              </p>
            </div>
          ) : (
            eventosFiltrados.map((ev) => (
              <EventCard 
                key={ev.id}
                id={ev.id}
                image={ev.image}
                title={ev.title}
                location={ev.location}
                date={ev.date}
                time={ev.time}
                client={ev.client}
                staffCount={ev.staffCount}
                isLive={ev.isLive}
                isPassado={ev.isPassado}
                isArquivado={ev.isArquivado}
                selected={ev.selected}
                router={router} 
                onDeleteClick={(evInfo) => setConfirmDelete(evInfo)}
                onArchiveClick={(evInfo) => setConfirmArchive(evInfo)}
                onUnarchiveClick={(evInfo) => handleDesarquivar(evInfo)}
              />
            ))
          )}
        </div>

        {/* ÁREA INFERIOR FIXA */}
        <div className="shrink-0 pt-2 flex flex-col gap-3 bg-[#171717]">
          
          <Link 
            href="/admin/eventos/cadastrar"
            className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white flex items-center justify-center font-semibold py-4 text-[18px] tracking-wide rounded-sm transition-colors shadow-sm cursor-pointer"
          >
            Cadastrar evento
          </Link>

          <button 
            type="button"
            onClick={() => setShowMaisOpcoes(prev => !prev)}
            className="w-full bg-[#2a2a2a] border border-[#3a3a3a] hover:bg-[#333] text-[#a3a3a3] py-[14px] flex items-center justify-between px-4 rounded-sm transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 text-[17px] tracking-wide">
              <Filter size={22} strokeWidth={1.5} /> Mais opções...
            </div>
            <div className="p-0.5 border border-[#4a4a4a] rounded-sm bg-[#222]">
              <ChevronUp size={20} strokeWidth={1.5} className={`text-[#999] transition-transform ${showMaisOpcoes ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {showMaisOpcoes && (
            <div className="bg-[#1f1f1f] border border-[#3a3a3a] rounded-sm p-2 flex flex-col gap-1 -mt-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setAba(aba === 'ativos' ? 'arquivados' : 'ativos');
                  setShowMaisOpcoes(false);
                }}
                className={`w-full py-2.5 px-3 rounded-sm flex items-center justify-between text-[14px] font-semibold transition-colors cursor-pointer ${
                  aba === 'arquivados' 
                    ? 'bg-[#2563eb] text-white' 
                    : 'bg-[#2a2a2a] hover:bg-[#333] text-[#ccc] border border-[#3a3a3a]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Archive size={16} />
                  <span>{aba === 'arquivados' ? 'Exibir eventos ativos' : 'Ver eventos arquivados'}</span>
                </div>
                <span className="text-xs bg-black/40 px-2 py-0.5 rounded-full">
                  {aba === 'arquivados' ? `${totalAtivos} ativos` : `${totalArquivados} arquivados`}
                </span>
              </button>
            </div>
          )}

          <div className="flex items-stretch justify-between border border-[#3a3a3a] bg-[#1a1a1a] rounded-sm overflow-hidden h-[60px]">
            <div className="w-16 flex items-center justify-center opacity-30">
              <img 
                src="/icon.png" 
                alt="Wadjet Logo" 
                className="w-8 h-8 object-contain grayscale" 
                onError={(e) => { e.target.style.display = "none"; }}
              />
            </div>
            
            <button 
              onClick={() => router.push('/admin')} 
              className="w-[60px] border-l border-[#3a3a3a] flex items-center justify-center text-[#777] bg-[#222] hover:bg-[#2a2a2a] transition-colors cursor-pointer"
            >
              <Menu size={32} strokeWidth={1.5} />
            </button>
          </div>

        </div>

      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {confirmDelete && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-6"
          onClick={() => !deletando && setConfirmDelete(null)}
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
              Deseja excluir o evento <strong className="text-white font-semibold">&quot;{confirmDelete.title}&quot;</strong>? Todas as escalas deste evento serão removidas.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={deletando}
                className="flex-1 py-3 border border-[#444] bg-[#2a2a2a] text-gray-300 rounded-sm text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusao}
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

      {/* MODAL DE CONFIRMAÇÃO DE ARQUIVAMENTO */}
      {confirmArchive && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-6"
          onClick={() => !arquivando && setConfirmArchive(null)}
        >
          <div 
            className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-sm p-6 w-full max-w-xs flex flex-col gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-950 border border-amber-800 rounded-sm flex items-center justify-center shrink-0">
                <Archive size={20} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base leading-tight">Arquivar evento</h3>
                <p className="text-gray-400 text-xs mt-0.5">O evento sairá da tela principal</p>
              </div>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed">
              Deseja arquivar o evento <strong className="text-white font-semibold">&quot;{confirmArchive.title}&quot;</strong>? Ele continuará salvo no histórico e poderá ser acessado em &quot;Mais opções...&quot;.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmArchive(null)}
                disabled={arquivando}
                className="flex-1 py-3 border border-[#444] bg-[#2a2a2a] text-gray-300 rounded-sm text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarArquivamento}
                disabled={arquivando}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-black rounded-sm text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {arquivando ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={15} className="animate-spin" /> Arquivando...
                  </span>
                ) : (
                  <>
                    <Archive size={15} />
                    Arquivar
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