"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Users,
  DollarSign,
  Shield,
  MapPin,
  ChevronRight,
  Handshake,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import HeaderSuperior from "@/components/HeaderSuperior";
import AppNavigation from "@/components/AppNavigation";

export default function AdminPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  const [metricas, setMetricas] = useState({
    totalEventos: 0,
    totalStaff: 0,
    faturamentoPrevisto: 0,
  });
  const [proximoEvento, setProximoEvento] = useState(null);
  const [totalEscaladosProximo, setTotalEscaladosProximo] = useState(0);

  useEffect(() => {
    async function carregarDashboardAdmin() {
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
        if (!perfilData || (userRole !== "admin" && userRole !== "owner")) {
          router.push("/freelancers");
          return;
        }

        setPerfil(perfilData);
        setIsAuthorized(true);

        const [
          { data: eventosData },
          { data: perfisData },
        ] = await Promise.all([
          supabase.from("eventos").select("*").order("data_inicio", { ascending: true }),
          supabase.from("perfis").select("id"),
        ]);

        const faturamento = (eventosData || []).reduce(
          (acc, ev) => acc + (parseFloat(ev.receita_bruta) || 0),
          0
        );

        setMetricas({
          totalEventos: eventosData?.length || 0,
          totalStaff: perfisData?.length || 0,
          faturamentoPrevisto: faturamento,
        });

        const agora = new Date();
        const eventosFuturos = (eventosData || []).filter((ev) => {
          if (!ev.data_inicio) return false;
          return new Date(ev.data_inicio) >= agora;
        });

        const eventoFoco = eventosFuturos.length > 0 ? eventosFuturos[0] : (eventosData && eventosData[0] ? eventosData[0] : null);
        setProximoEvento(eventoFoco);

        if (eventoFoco) {
          const { count } = await supabase
            .from("escalas")
            .select("*", { count: "exact", head: true })
            .eq("evento_id", eventoFoco.id);
          setTotalEscaladosProximo(count || 0);
        }
      } catch (err) {
        console.error("Erro dashboard admin:", err);
      } finally {
        setLoading(false);
      }
    }

    carregarDashboardAdmin();
  }, [router]);

  if (!isAuthorized && loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <span className="text-neutral-500 font-medium animate-pulse text-sm">
          Carregando painel...
        </span>
      </div>
    );
  }

  const primeiroNome = perfil?.nome_completo?.split(" ")[0] || "Administrador";

  return (
    <div className="min-h-screen bg-[#141414] text-neutral-300 font-sans flex flex-col justify-between p-4 pb-6">
      <div className="w-full max-w-sm mx-auto space-y-4">
        <HeaderSuperior />

        {/* SAUDAÇÃO LIMPA & DIRETA */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h2 className="text-[20px] font-black text-white">
              Olá, {primeiroNome} 👋
            </h2>
            <p className="text-[12px] text-neutral-400">
              Resumo operacional da Wadjet
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </span>
        </div>

        {/* RÉGUA COMPACTA DE MÉTRICAS (3 CARDS EM 1 LINHA) */}
        <div className="grid grid-cols-3 gap-2">
          <Link
            href="/admin/eventos"
            className="bg-[#1f1f1f] hover:bg-[#262626] border border-[#333] p-2.5 rounded text-center transition-all cursor-pointer group"
          >
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-center gap-1">
              <Calendar size={11} className="text-blue-400" />
              <span>Eventos</span>
            </div>
            <div className="text-[18px] font-black text-white mt-0.5">
              {metricas.totalEventos}
            </div>
          </Link>

          <Link
            href="/admin/funcionarios"
            className="bg-[#1f1f1f] hover:bg-[#262626] border border-[#333] p-2.5 rounded text-center transition-all cursor-pointer group"
          >
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-center gap-1">
              <Users size={11} className="text-emerald-400" />
              <span>Equipe</span>
            </div>
            <div className="text-[18px] font-black text-white mt-0.5">
              {metricas.totalStaff}
            </div>
          </Link>

          <Link
            href="/admin/financeiro"
            className="bg-[#1f1f1f] hover:bg-[#262626] border border-[#333] p-2.5 rounded text-center transition-all cursor-pointer group"
          >
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-center gap-1">
              <DollarSign size={11} className="text-purple-400" />
              <span>Caixa</span>
            </div>
            <div className="text-[14px] font-black text-white mt-1 truncate">
              {metricas.faturamentoPrevisto > 0
                ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(metricas.faturamentoPrevisto)
                : "R$ 0"}
            </div>
          </Link>
        </div>

        {/* PRÓXIMA OPERAÇÃO (FOCO PRINCIPAL) */}
        <div className="bg-[#1f1f1f] border border-[#333] rounded-sm p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#2e2e2e] pb-2">
            <span className="flex items-center gap-1.5 text-blue-400 text-[11px] font-bold uppercase tracking-wider">
              <Shield size={13} />
              <span>Próxima Operação</span>
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">
              {proximoEvento?.data_inicio
                ? new Date(proximoEvento.data_inicio).toLocaleDateString("pt-BR")
                : "Sem data"}
            </span>
          </div>

          {proximoEvento ? (
            <div className="space-y-3">
              <div>
                <h3 className="text-[16px] font-bold text-white leading-snug">
                  {proximoEvento.titulo}
                </h3>
                {proximoEvento.nome_contratante && (
                  <p className="text-[12px] text-neutral-400 mt-0.5 flex items-center gap-1">
                    <Handshake size={12} className="text-neutral-500" />
                    <span>{proximoEvento.nome_contratante}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5 text-[11px] bg-[#161616] p-2.5 rounded border border-[#2b2b2b]">
                <div className="flex items-center justify-between text-neutral-300">
                  <span className="text-neutral-500">Equipe Escalada:</span>
                  <span className="font-bold text-emerald-400">{totalEscaladosProximo} colaboradores</span>
                </div>
                {proximoEvento.endereco_texto && (
                  <div className="flex items-center gap-1 text-neutral-400 truncate pt-1 border-t border-[#262626]">
                    <MapPin size={12} className="text-red-400 shrink-0" />
                    <span className="truncate">{proximoEvento.endereco_texto}</span>
                  </div>
                )}
              </div>

              {/* BOTÕES DE AÇÃO DIRETA */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  onClick={() => router.push(`/admin/eventos/${proximoEvento.id}/escalar`)}
                  className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white py-2.5 px-3 rounded text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Users size={13} />
                  <span>Escala</span>
                </button>
                <button
                  onClick={() => router.push(`/admin/financeiro/${proximoEvento.id}`)}
                  className="bg-[#2a2a2a] hover:bg-[#333] text-neutral-200 border border-[#444] py-2.5 px-3 rounded text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <DollarSign size={13} className="text-emerald-400" />
                  <span>Financeiro</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-neutral-500 text-xs">
              <p>Nenhuma operação agendada.</p>
              <button
                onClick={() => router.push("/admin/eventos/cadastrar")}
                className="mt-2 text-blue-400 hover:underline font-bold"
              >
                + Criar Novo Evento
              </button>
            </div>
          )}
        </div>

        {/* MENU INFERIOR */}
        <AppNavigation userProfile={perfil} userRole="admin" />
      </div>
    </div>
  );
}