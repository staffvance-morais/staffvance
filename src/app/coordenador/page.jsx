"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Users,
  MapPin,
  Shield,
  Map,
  Compass,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import HeaderSuperior from "@/components/HeaderSuperior";
import AppNavigation from "@/components/AppNavigation";

export default function PainelCoordenador() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  const [metricas, setMetricas] = useState({
    totalOperacoes: 0,
    totalEscalados: 0,
  });
  const [proximaOperacao, setProximaOperacao] = useState(null);
  const [escaladosProxima, setEscaladosProxima] = useState(0);

  useEffect(() => {
    async function carregarDashboardCoordenador() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          router.push("/");
          return;
        }

        const { data: perfilData } = await supabase
          .from("perfis")
          .select("id, role, nome_completo, foto_url")
          .eq("id", session.user.id)
          .single();

        const userRole = (perfilData?.role || "").toLowerCase().trim();
        if (
          !perfilData ||
          (userRole !== "coordenador" && userRole !== "admin" && userRole !== "owner")
        ) {
          router.push("/freelancers");
          return;
        }

        setPerfil(perfilData);
        setIsAuthorized(true);

        const [
          { data: eventosData },
          { data: escalasData },
        ] = await Promise.all([
          supabase.from("eventos").select("*").order("data_inicio", { ascending: true }),
          supabase.from("escalas").select("id, evento_id"),
        ]);

        setMetricas({
          totalOperacoes: eventosData?.length || 0,
          totalEscalados: escalasData?.length || 0,
        });

        const agora = new Date();
        const eventosFuturos = (eventosData || []).filter((ev) => {
          if (!ev.data_inicio) return false;
          return new Date(ev.data_inicio) >= agora;
        });

        const eventoFoco = eventosFuturos.length > 0 ? eventosFuturos[0] : (eventosData && eventosData[0] ? eventosData[0] : null);
        setProximaOperacao(eventoFoco);

        if (eventoFoco) {
          const escaladosNeste = (escalasData || []).filter((e) => e.evento_id === eventoFoco.id).length;
          setEscaladosProxima(escaladosNeste);
        }
      } catch (err) {
        console.error("Erro dashboard coordenador:", err);
      } finally {
        setLoading(false);
      }
    }

    carregarDashboardCoordenador();
  }, [router]);

  if (!isAuthorized && loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <span className="text-neutral-500 font-medium animate-pulse text-sm">
          Carregando painel operacional...
        </span>
      </div>
    );
  }

  const primeiroNome = perfil?.nome_completo?.split(" ")[0] || "Coordenador";

  return (
    <div className="min-h-screen bg-[#141414] text-neutral-300 font-sans flex flex-col justify-between p-4 pb-6">
      <div className="w-full max-w-sm mx-auto space-y-4">
        <HeaderSuperior />

        {/* SAUDAÇÃO LIMPA */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h2 className="text-[20px] font-black text-white">
              Olá, {primeiroNome} 👋
            </h2>
            <p className="text-[12px] text-neutral-400">
              Comando tático e operações de campo
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Campo
          </span>
        </div>

        {/* MÉTRICAS EM LINHA */}
        <div className="grid grid-cols-3 gap-2">
          <Link
            href="/coordenador/eventos"
            className="bg-[#1f1f1f] hover:bg-[#262626] border border-[#333] p-2.5 rounded text-center transition-all cursor-pointer"
          >
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-center gap-1">
              <Calendar size={11} className="text-blue-400" />
              <span>Escalas</span>
            </div>
            <div className="text-[18px] font-black text-white mt-0.5">
              {metricas.totalOperacoes}
            </div>
          </Link>

          <Link
            href="/coordenador/equipe"
            className="bg-[#1f1f1f] hover:bg-[#262626] border border-[#333] p-2.5 rounded text-center transition-all cursor-pointer"
          >
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-center gap-1">
              <Users size={11} className="text-emerald-400" />
              <span>Alocados</span>
            </div>
            <div className="text-[18px] font-black text-white mt-0.5">
              {metricas.totalEscalados}
            </div>
          </Link>

          <Link
            href="/mapa"
            className="bg-[#1f1f1f] hover:bg-[#262626] border border-[#333] p-2.5 rounded text-center transition-all cursor-pointer"
          >
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-center gap-1">
              <Compass size={11} className="text-purple-400" />
              <span>Planta</span>
            </div>
            <div className="text-[15px] font-black text-white mt-0.5">
              Mapa
            </div>
          </Link>
        </div>

        {/* PRÓXIMA OPERAÇÃO */}
        <div className="bg-[#1f1f1f] border border-[#333] rounded-sm p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#2e2e2e] pb-2">
            <span className="flex items-center gap-1.5 text-amber-400 text-[11px] font-bold uppercase tracking-wider">
              <Shield size={13} />
              <span>Próximo Turno</span>
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">
              {proximaOperacao?.data_inicio
                ? new Date(proximaOperacao.data_inicio).toLocaleDateString("pt-BR")
                : "Sem data"}
            </span>
          </div>

          {proximaOperacao ? (
            <div className="space-y-3">
              <div>
                <h3 className="text-[16px] font-bold text-white leading-snug">
                  {proximaOperacao.titulo}
                </h3>
                {proximaOperacao.nome_contratante && (
                  <p className="text-[12px] text-neutral-400 mt-0.5">
                    {proximaOperacao.nome_contratante}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 text-[11px] bg-[#161616] p-2.5 rounded border border-[#2b2b2b]">
                <div className="flex items-center justify-between text-neutral-300">
                  <span className="text-neutral-500">Membros Alocados:</span>
                  <span className="font-bold text-amber-400">{escaladosProxima} membros</span>
                </div>
                {proximaOperacao.endereco_texto && (
                  <div className="flex items-center gap-1 text-neutral-400 truncate pt-1 border-t border-[#262626]">
                    <MapPin size={12} className="text-red-400 shrink-0" />
                    <span className="truncate">{proximaOperacao.endereco_texto}</span>
                  </div>
                )}
              </div>

              {/* BOTÃO PRINCIPAL: CHAMADA / PRESENÇA */}
              <button
                onClick={() => router.push(`/coordenador/eventos/${proximaOperacao.id}/presenca`)}
                className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white py-2.5 px-3 rounded text-[13px] font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                <Users size={16} />
                <span>Lista de Presença / Chamada</span>
              </button>

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  onClick={() => router.push(`/coordenador/eventos/${proximaOperacao.id}/escalar`)}
                  className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white py-2.5 px-3 rounded text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Users size={13} />
                  <span>Escalar</span>
                </button>
                <button
                  onClick={() => router.push(`/mapa?evento=${proximaOperacao.id}`)}
                  className="bg-[#2a2a2a] hover:bg-[#333] text-neutral-200 border border-[#444] py-2.5 px-3 rounded text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Map size={13} className="text-purple-400" />
                  <span>Mapa Tático</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-neutral-500 text-xs">
              <p>Nenhuma operação agendada no momento.</p>
            </div>
          )}
        </div>

        {/* MENU INFERIOR */}
        <AppNavigation userProfile={perfil} userRole="coordenador" />
      </div>
    </div>
  );
}