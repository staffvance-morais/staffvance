"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Calendar, Clock, MapPin, Shield, CheckCircle2, Loader2, User, Map } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function MinhasEscalas() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [escalas, setEscalas] = useState([]);
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    const fetchMinhasEscalas = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          router.push("/"); 
          return;
        }

        const { data: perfilData } = await supabase
          .from('perfis')
          .select('nome_completo, nome')
          .eq('id', user.id)
          .single();
        
        setPerfil(perfilData);

        // CORREÇÃO: Buscando 'data_inicio' em vez das colunas antigas
        const { data: escalasData, error: escalasError } = await supabase
          .from('escalas')
          .select(`
            id,
            setor,
            status_pagamento,
            eventos (
              id,
              titulo,
              data_inicio,
              endereco_texto,
              mapa_tatico
            )
          `)
          .eq('staff_id', user.id); 

        if (escalasError) throw escalasError;

        if (escalasData) {
          const escalasValidas = escalasData.filter(e => e.eventos !== null);
          // Ordena pela data de início
          escalasValidas.sort((a, b) => new Date(a.eventos.data_inicio) - new Date(b.eventos.data_inicio));
          setEscalas(escalasValidas);
        }
      } catch (error) {
        console.error("Erro detalhado do banco:", error.message || error);
      } finally {
        setLoading(false);
      }
    };

    fetchMinhasEscalas();
  }, [router]);

  const abrirMapaTatico = (eventoId) => {
    router.push(`/mapa?evento=${eventoId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center text-[#777]">
        <Loader2 className="animate-spin mb-4 text-[#2563eb]" size={40} />
        <p>Carregando suas escalas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans text-[#e5e5e5]">
      
      <header className="flex items-center justify-between p-5 border-b border-[#222]">
        <div className="flex items-center opacity-70">
          <Shield size={28} className="text-[#555]" />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[14px] font-bold">Olá, {perfil?.nome_completo || perfil?.nome || "Colaborador"}</p>
            <p className="text-[11px] text-[#2563eb] font-semibold tracking-wider uppercase">Painel Operacional</p>
          </div>
          <div className="w-10 h-10 rounded-full border border-[#333] bg-[#1a1a1a] flex items-center justify-center">
            <User size={18} className="text-[#888]" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 mt-6">
        
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Minhas Escalas</h1>
          <p className="text-[#888] text-[15px]">Confira abaixo os próximos eventos em que você está escalado.</p>
        </div>

        {escalas.length === 0 ? (
          <div className="bg-[#111] border border-[#222] rounded-lg p-10 text-center flex flex-col items-center">
            <Calendar size={48} className="text-[#333] mb-4" />
            <h3 className="text-[18px] font-bold text-[#ccc] mb-2">Nenhuma escala programada</h3>
            <p className="text-[#777] max-w-md">Você ainda não foi escalado para nenhuma operação futura. Quando for selecionado, os detalhes aparecerão aqui.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {escalas.map((escala, index) => {
              const evento = escala.eventos;
              const isProximo = index === 0; 
              
              // Verifica se tem mapa pelo banco ou pelo nome do local
              const temMapa = evento.mapa_tatico === true || evento.endereco_texto?.includes("Presidente Vargas");

              // Extrai a data e a hora corretamente do data_inicio salvo no banco
              const dataObj = evento.data_inicio ? new Date(evento.data_inicio) : null;
              const dataExibicao = dataObj ? dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "A definir";
              const horaExibicao = dataObj ? dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "A definir";

              return (
                <div 
                  key={escala.id} 
                  className={`bg-[#111111] rounded-lg overflow-hidden border transition-all ${
                    isProximo ? 'border-[#2563eb] shadow-[0_0_15px_rgba(37,99,235,0.1)]' : 'border-[#222]'
                  }`}
                >
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222]">
                    <div>
                      {isProximo && (
                        <span className="text-[#2563eb] text-[11px] font-bold tracking-widest uppercase mb-1 block">Próximo Evento</span>
                      )}
                      <h2 className="text-[20px] font-bold text-white">{evento.titulo}</h2>
                    </div>
                    
                    <div className="flex items-center gap-1.5 bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-sm shrink-0 self-start sm:self-auto">
                      <CheckCircle2 size={16} />
                      <span className="text-[12px] font-bold tracking-wider uppercase">Confirmado</span>
                    </div>
                  </div>

                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 rounded-md flex items-start gap-3">
                      <Calendar className="text-[#555] shrink-0 mt-0.5" size={18} />
                      <div>
                        <p className="text-[11px] text-[#777] font-bold tracking-wider uppercase">Data do Evento</p>
                        <p className="text-[15px] font-semibold text-[#ccc] mt-0.5">{dataExibicao}</p>
                      </div>
                    </div>

                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 rounded-md flex items-start gap-3">
                      <Clock className="text-[#555] shrink-0 mt-0.5" size={18} />
                      <div>
                        <p className="text-[11px] text-[#777] font-bold tracking-wider uppercase">Horário de Chegada</p>
                        <p className="text-[15px] font-semibold text-[#ccc] mt-0.5">{horaExibicao}</p>
                      </div>
                    </div>

                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 rounded-md flex items-start gap-3 md:col-span-2">
                      <MapPin className="text-[#555] shrink-0 mt-0.5" size={18} />
                      <div>
                        <p className="text-[11px] text-[#777] font-bold tracking-wider uppercase">Local</p>
                        <p className="text-[15px] font-semibold text-[#ccc] mt-0.5">{evento.endereco_texto || "A definir"}</p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between border-t ${
                    isProximo ? 'bg-[#151c2c] border-[#1e293b]' : 'bg-[#161616] border-[#222]'
                  }`}>
                    
                    <div className="flex flex-col gap-3 w-full sm:w-auto">
                      <div className="flex items-start gap-3">
                        <Shield className={isProximo ? "text-[#3b82f6]" : "text-[#555]"} size={20} />
                        <div>
                          <p className="text-[11px] text-[#777] font-bold tracking-wider uppercase">Sua Missão</p>
                          <p className="text-[15px] text-[#e5e5e5] mt-0.5">
                            Segurança em <strong className="text-white">Setor {escala.setor}</strong>
                          </p>
                        </div>
                      </div>

                      {temMapa && (
                        <button 
                          onClick={() => abrirMapaTatico(evento.id)}
                          className="flex items-center gap-2 mt-2 w-fit bg-[#2a2a2a] hover:bg-[#333] border border-[#444] text-[#ccc] px-3 py-2 rounded-sm transition-colors text-[13px] font-semibold"
                        >
                          <Map size={16} className="text-[#3b82f6]" />
                          Ver Mapa Tático do Estádio
                        </button>
                      )}
                    </div>
                    
                    {escala.status_pagamento && (
                      <span className="mt-4 sm:mt-0 self-start sm:self-center text-[12px] bg-green-500/20 text-green-400 px-3 py-1 rounded-sm font-bold uppercase tracking-wider">
                        Pagamento Liberado
                      </span>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}