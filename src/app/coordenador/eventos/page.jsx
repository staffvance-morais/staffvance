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
  Loader2 
} from "lucide-react";

// Conexão com o Supabase

const EventCard = ({ id, image, title, location, date, time, client, staffCount, isLive, selected, router }) => {
  return (
    <div className="border border-[#3a3a3a] bg-[#222222] flex flex-col mb-4 rounded-sm overflow-hidden shrink-0">
      <div className="h-[100px] w-full relative border-b border-[#3a3a3a] bg-[#1a1a1a]">
        {image ? (
          <img src={image} className="object-cover w-full h-full" alt={title} />
        ) : (
          <div className="flex items-center justify-center h-full text-[#666] text-xs">Sem Imagem</div>
        )}
      </div>
      
      <div className="p-4 relative">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-[#e5e5e5] text-[20px] font-semibold leading-tight tracking-wide">{title}</h3>
            <p className="text-[#999999] text-[15px] mt-0.5">{location || "Local não informado"}</p>
          </div>
          
          <div className={`w-[22px] h-[22px] rounded-[2px] flex items-center justify-center mt-1 border ${selected ? 'bg-[#2563eb] border-[#2563eb]' : 'bg-[#1a1a1a] border-[#444]'}`}>
            {selected && <Check size={16} className="text-white" strokeWidth={3.5} />}
          </div>
        </div>

        <div className="flex justify-between items-end">
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

          <div className="flex flex-col items-end justify-between h-[84px]">
            {isLive ? (
              <div className="flex items-center gap-1.5 text-[#e5e5e5] text-[13px] font-bold tracking-widest uppercase">
                <div className="w-2.5 h-2.5 bg-[#22c55e] rounded-sm"></div> 
                AO VIVO
              </div>
            ) : (
              <div></div>
            )}
            
            <button 
              onClick={() => router.push(`/coordenador/eventos/${id}`)}
              title="Ver Detalhes do Evento"
              className="w-11 h-11 border border-[#444] rounded-sm bg-[#2a2a2a] flex items-center justify-center text-[#999] hover:bg-[#333] hover:text-[#2563eb] transition-colors cursor-pointer"
            >
              <Info size={26} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PainelEventosCoordenador() {
  const router = useRouter(); 
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
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
          const eventosFormatados = evData.map(ev => {
            let dataFormatada = "";
            let horaFormatada = "";
            if (ev.data_inicio) {
              const d = new Date(ev.data_inicio);
              dataFormatada = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
              horaFormatada = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + " - " + 
                (ev.data_fim ? new Date(ev.data_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "");
            }

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

    fetchEventos();
  }, []);

  const eventosFiltrados = eventos.filter(ev => 
    ev.title?.toLowerCase().includes(busca.toLowerCase()) ||
    ev.location?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#171717] font-sans flex flex-col items-center justify-center">
      
      <div className="w-full max-w-[400px] h-[100dvh] flex flex-col p-4 bg-[#171717] relative">
        
        {/* CABEÇALHO */}
        <div className="flex items-center gap-3 text-[#cccccc] pb-3 border-b border-[#333333]">
          <CalendarDays size={20} strokeWidth={1.5} />
          <h1 className="text-[17px] tracking-wide">Eventos</h1>
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
        <div className="mt-4 mb-3 text-[14px] text-[#999999] tracking-wide shrink-0">
          Listando <span className="text-[#e5e5e5] font-semibold">{eventosFiltrados.length}</span> eventos
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
              <p className="font-semibold text-[#e5e5e5] mb-1">Nenhum evento encontrado.</p>
              <p className="text-[13px]">Cadastre o primeiro evento usando o botão abaixo.</p>
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
                selected={ev.selected}
                router={router} 
              />
            ))
          )}
        </div>

        {/* ÁREA INFERIOR FIXA */}
        <div className="shrink-0 pt-2 flex flex-col gap-3 bg-[#171717]">
          
          <Link 
            href="/coordenador/eventos/cadastrar"
            className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white flex items-center justify-center font-semibold py-4 text-[18px] tracking-wide rounded-sm transition-colors shadow-sm cursor-pointer"
          >
            Cadastrar evento
          </Link>

          <button className="w-full bg-[#2a2a2a] border border-[#3a3a3a] hover:bg-[#333] text-[#a3a3a3] py-[14px] flex items-center justify-between px-4 rounded-sm transition-colors cursor-pointer">
            <div className="flex items-center gap-3 text-[17px] tracking-wide">
              <Filter size={22} strokeWidth={1.5} /> Mais opções...
            </div>
            <div className="p-0.5 border border-[#4a4a4a] rounded-sm bg-[#222]">
              <ChevronUp size={20} strokeWidth={1.5} className="text-[#999]" />
            </div>
          </button>

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
              onClick={() => router.push('/coordenador')} 
              className="w-[60px] border-l border-[#3a3a3a] flex items-center justify-center text-[#777] bg-[#222] hover:bg-[#2a2a2a] transition-colors cursor-pointer"
            >
              <Menu size={32} strokeWidth={1.5} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}