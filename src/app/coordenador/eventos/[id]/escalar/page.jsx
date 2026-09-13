"use client";
import { supabase } from "@/lib/supabase";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { CalendarDays, ChevronRight, User, Info, Menu, Loader2 } from "lucide-react";

export default function SelecionarSetorEscalaCoordenador() {
  const router = useRouter();
  const params = useParams();
  const eventoId = params.id;

  const [loading, setLoading] = useState(true);
  const [salvandoSetor, setSalvandoSetor] = useState(false);
  const [enviandoRelatorio, setEnviandoRelatorio] = useState(false);
  const [escalas, setEscalas] = useState([]);
  
  const [setores, setSetores] = useState([
    "Entrada (Revista)", "Banheiro", "Estacionamento", "Quadra (Campo)",
    "Vestiário", "Tribuna", "Camarote", "Acessos as arquibancadas",
    "Entrada para PCD", "Portão de emergência"
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: escalasData, error: escalasError } = await supabase
          .from("escalas")
          .select("id, setor, staff_id, perfis ( id, nome_completo )")
          .eq("evento_id", eventoId);

        if (escalasError) {
          console.error("Erro ao buscar escalas:", escalasError);
        } else if (escalasData) {
          setEscalas(escalasData);
        }

        const { data: eventoData } = await supabase
          .from("eventos")
          .select("setores_extras")
          .eq("id", eventoId)
          .single();

        let todosOsSetores = [...setores];

        if (eventoData && eventoData.setores_extras) {
          const extrasDoBanco = eventoData.setores_extras;
          extrasDoBanco.forEach(setorExtra => {
            if (!todosOsSetores.includes(setorExtra)) {
              todosOsSetores.push(setorExtra);
            }
          });
        }
        
        if (escalasData) {
          const setoresNasEscalas = escalasData.map(e => e.setor).filter(Boolean);
          setoresNasEscalas.forEach(s => {
            if (!todosOsSetores.includes(s)) todosOsSetores.push(s);
          });
        }

        setSetores(todosOsSetores);
      } catch (error) {
        console.error("Erro geral ao carregar dados da escala:", error);
      } finally {
        setLoading(false);
      }
    };

    if (eventoId) fetchData();
  }, [eventoId]);

  const handleAdicionarSetor = async () => {
    const novoSetor = window.prompt("Digite o nome do novo setor:");
    if (novoSetor && novoSetor.trim() !== "") {
      const nomeLimpo = novoSetor.trim();
      
      if (setores.includes(nomeLimpo)) {
        alert("Este setor já existe na lista.");
        return;
      }

      setSalvandoSetor(true);
      try {
        const novaListaSetores = [nomeLimpo, ...setores];
        setSetores(novaListaSetores);

        const { data: evData } = await supabase.from('eventos').select('setores_extras').eq('id', eventoId).single();
        const extrasAtuais = evData?.setores_extras || [];
        const extrasAtualizados = [...extrasAtuais, nomeLimpo];

        await supabase.from('eventos').update({ setores_extras: extrasAtualizados }).eq('id', eventoId);
        
      } catch (error) {
        console.error("Erro ao salvar o setor extra no banco:", error);
        alert("Erro ao salvar o setor.");
      } finally {
        setSalvandoSetor(false);
      }
    }
  };

  const totalEscaladosGeral = escalas.length;

  const handleConcluir = async () => {
    setEnviandoRelatorio(true);
    try {
      await fetch("/api/resumo-camisas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventoId }),
      });
    } catch (err) {
      console.error("Erro ao enviar relatorio de camisas:", err);
    } finally {
      setEnviandoRelatorio(false);
      router.push(`/coordenador/eventos/${eventoId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#171717] font-sans flex flex-col items-center pb-10">
      <div className="w-full max-w-[400px] min-h-screen flex flex-col bg-[#171717] relative">
        
        <div className="flex items-center gap-2 p-4 text-[#aaa] text-[14px] border-b border-[#333333]">
          <CalendarDays size={18} /><span>Eventos</span><ChevronRight size={16} /><span className="text-[#e5e5e5]">Escalar membros</span>
        </div>

        <div className="flex-1 overflow-y-auto pb-[100px] custom-scrollbar">
          <h2 className="text-[#e5e5e5] text-[18px] font-bold px-4 pt-5 pb-4">
            Selecione o Setor
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#777]">
              <Loader2 className="animate-spin mb-2 text-[#2563eb]" size={28} />
              <p className="text-sm">Carregando setores...</p>
            </div>
          ) : (
            <div className="px-4 flex flex-col gap-3">
              {setores.map((nomeSetor, index) => {
                const staffNoSetor = escalas.filter(e => e.setor === nomeSetor);
                const qtdEscalados = staffNoSetor.length;
                const capacidade = 99;
                const isCheio = qtdEscalados >= capacidade;

                return (
                  <div key={index} className="bg-[#222222] border border-[#3a3a3a] rounded-sm p-4 flex flex-col">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-[#e5e5e5] text-[18px] font-bold">{nomeSetor}</h3>
                        <div className="flex items-center gap-1.5 text-[#999] mt-1">
                          <User size={14} />
                          <span className="text-[13px]">{qtdEscalados}/{capacidade} escalados</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {isCheio && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-[#e5e5e5]">
                            <div className="w-2 h-2 bg-[#16a34a] rounded-sm"></div>CHEIO
                          </div>
                        )}
                        <button 
                          onClick={() => router.push(`/coordenador/eventos/${eventoId}/alocar?setor=${encodeURIComponent(nomeSetor)}`)}
                          className="w-10 h-10 border border-[#555] rounded-sm flex items-center justify-center text-[#999] hover:bg-[#333] hover:text-[#e5e5e5] transition-colors mt-1 cursor-pointer"
                        >
                          <Info size={22} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>

                    {qtdEscalados > 0 && (
                      <div className="mt-4 pt-3 border-t border-[#3a3a3a] flex flex-col gap-1">
                        {staffNoSetor.map((escala, i) => (
                          <span key={i} className="text-[#999] text-[14px] capitalize">
                            {escala.perfis?.nome_completo || "Segurança sem nome"}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="px-4 pt-6 pb-4 flex flex-col gap-3 mt-2">
            <button 
              onClick={handleAdicionarSetor}
              disabled={salvandoSetor}
              className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold py-4 rounded-sm transition-colors cursor-pointer text-[16px] flex items-center justify-center gap-2"
            >
              {salvandoSetor ? <Loader2 className="animate-spin" size={20} /> : null}
              Adicionar novo setor
            </button>

            {totalEscaladosGeral > 0 ? (
              <button 
                onClick={handleConcluir}
                disabled={enviandoRelatorio}
                className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-bold py-3.5 rounded-sm transition-colors cursor-pointer text-[16px] flex items-center justify-center gap-2"
              >
                {enviandoRelatorio ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Enviando relatório...</span>
                  </>
                ) : (
                  "Concluir"
                )}
              </button>
            ) : (
              <button 
                onClick={() => router.push(`/coordenador/eventos/${eventoId}`)}
                className="w-full bg-[#333333] hover:bg-[#444444] text-[#ccc] font-semibold py-3.5 rounded-sm transition-colors cursor-pointer text-[16px]"
              >
                Escalar depois
              </button>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 w-full p-4 bg-[#171717] border-t border-[#2a2a2a]">
          <div className="flex items-stretch justify-between border border-[#3a3a3a] bg-[#1a1a1a] rounded-sm overflow-hidden h-[60px]">
            <div className="w-16 flex items-center justify-center opacity-30">
              <img src="/icon.png" alt="Wadjet Logo" className="w-8 h-8 object-contain grayscale" onError={(e) => { e.target.style.display = "none"; }}/>
            </div>
            <button onClick={() => router.push('/coordenador')} className="w-[60px] border-l border-[#3a3a3a] flex items-center justify-center text-[#777] bg-[#222] hover:bg-[#2a2a2a] transition-colors cursor-pointer">
              <Menu size={32} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}