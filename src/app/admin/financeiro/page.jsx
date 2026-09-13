"use client";

import { supabase } from "@/lib/supabase";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Wallet, 
  Calendar, 
  MapPin, 
  ChevronRight,
  Loader2, 
  DollarSign, 
  Briefcase,
  TrendingUp,
  TrendingDown,
  Car,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  RefreshCw,
  Sparkles,
  Landmark,
  Calculator,
  FileText
} from "lucide-react";

// Formatação de Moeda
const formatarMoeda = (valor) => {
  const numero = parseFloat(valor);
  if (isNaN(numero)) return "R$ 0,00";
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

// ==========================================
// COMPONENTE: CARD FINANCEIRO DO EVENTO
// ==========================================
const FinanceiroCard = ({ evento, router }) => {
  let dataFormatada = "Data não definida";
  if (evento.data_inicio) {
    const d = new Date(evento.data_inicio);
    dataFormatada = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  const receita = parseFloat(evento.receita_bruta) || 0;
  const custoStaff = evento.custoStaff || 0;
  const custoOperacional = evento.custoOperacional || 0;
  const custoImpostos = evento.custoImpostos || 0;
  const custoTotal = custoStaff + custoOperacional + custoImpostos;
  const lucro = receita - custoTotal;
  const margem = receita > 0 ? ((lucro / receita) * 100).toFixed(0) : null;
  const despesasOperacionaisCount = Array.isArray(evento.despesas) 
    ? evento.despesas.filter(d => d.categoria !== "impostos").length 
    : 0;

  // Status Dinâmico
  let statusBadge = {
    texto: "Acerto Pendente",
    cor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    icone: Clock,
  };

  if (evento.totalStaff === 0) {
    statusBadge = {
      texto: "Sem Escala",
      cor: "text-[#888] bg-[#222] border-[#3a3a3a]",
      icone: Users,
    };
  } else if (evento.todosPagos && receita > 0) {
    statusBadge = {
      texto: "100% Quitado",
      cor: "text-green-400 bg-green-500/10 border-green-500/20",
      icone: CheckCircle2,
    };
  } else if (lucro < 0 && receita > 0) {
    statusBadge = {
      texto: "Atenção: Prejuízo",
      cor: "text-red-400 bg-red-500/10 border-red-500/20",
      icone: AlertCircle,
    };
  }

  const StatusIcon = statusBadge.icone;

  return (
    <div 
      onClick={() => router.push(`/admin/financeiro/${evento.id}`)}
      className="bg-[#202020] border border-[#333333] hover:border-[#2563eb] p-5 rounded-lg mb-4 flex flex-col gap-4 cursor-pointer transition-all duration-200 group shadow-sm hover:shadow-md"
    >
      {/* Topo do Card: Título, Data, Local e Status */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[#f0f0f0] text-[17px] md:text-[18px] font-bold tracking-wide group-hover:text-[#3b82f6] transition-colors">
              {evento.titulo || "Evento sem título"}
            </h3>
            {custoImpostos > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Landmark size={12} /> Com NF-e
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-[#999999] text-[13px] mt-1.5">
            <span className="flex items-center gap-1.5">
              <Calendar size={15} className="text-[#666]" /> {dataFormatada}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={15} className="text-[#666]" /> {evento.endereco_texto || "Local não informado"}
            </span>
            <span className="flex items-center gap-1.5">
              <Briefcase size={15} className="text-[#666]" /> {evento.nome_contratante || "Contratante não informado"}
            </span>
          </div>
        </div>

        {/* Badge de Status e Seta */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider border ${statusBadge.cor}`}>
            <StatusIcon size={13} />
            <span>{statusBadge.texto}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#181818] border border-[#333] flex items-center justify-center group-hover:bg-[#2563eb] group-hover:border-[#2563eb] group-hover:text-white text-[#777] transition-all">
            <ChevronRight size={18} />
          </div>
        </div>
      </div>

      {/* Mini Balanço Financeiro dentro do Card */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-3 border-t border-[#2c2c2c] bg-[#1a1a1a]/60 p-3 rounded-md">
        <div>
          <span className="text-[10px] text-[#777] uppercase font-bold tracking-wider block">Receita Bruta</span>
          <span className="text-[14px] font-bold text-[#e5e5e5]">
            {receita > 0 ? formatarMoeda(receita) : <span className="text-[#666]">Não lançada</span>}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-[#777] uppercase font-bold tracking-wider block">Imposto / NF</span>
          <span className="text-[14px] font-bold text-emerald-400">
            {custoImpostos > 0 ? formatarMoeda(custoImpostos) : <span className="text-[#666]">Sem NF</span>}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-[#777] uppercase font-bold tracking-wider block">Equipe ({evento.totalStaff})</span>
          <span className="text-[14px] font-bold text-[#bbb]">
            {formatarMoeda(custoStaff)}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-[#777] uppercase font-bold tracking-wider block flex items-center gap-1">
            <Car size={11} className="text-amber-400" /> Extras ({despesasOperacionaisCount})
          </span>
          <span className="text-[14px] font-bold text-amber-400">
            {formatarMoeda(custoOperacional)}
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <span className="text-[10px] text-[#777] uppercase font-bold tracking-wider block">Lucro Real</span>
          <span className={`text-[14px] font-extrabold flex items-center gap-1 ${
            lucro < 0 ? "text-red-400" : lucro > 0 ? "text-green-400" : "text-[#777]"
          }`}>
            {formatarMoeda(lucro)}
            {margem !== null && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                lucro < 0 ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
              }`}>
                {margem}%
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// PÁGINA PRINCIPAL: GESTÃO FINANCEIRA
// ==========================================
export default function GestaoFinanceira() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos"); // 'todos' | 'pendentes' | 'quitados' | 'extras' | 'impostos'

  // 1. VERIFICAÇÃO DE SEGURANÇA (ADMIN ONLY)
  useEffect(() => {
    async function checkSecurity() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push("/");
        return;
      }

      const { data: perfilData } = await supabase
        .from("perfis")
        .select("role")
        .eq("id", session.user.id)
        .single();

      const userRole = (perfilData?.role || "").toLowerCase().trim();
      if (!perfilData || (userRole !== "admin" && userRole !== "owner")) {
        router.push("/freelancers");
      } else {
        setIsAuthorized(true);
      }
    }

    checkSecurity();
  }, [router]);

  // 2. BUSCA DE EVENTOS E ESCALAS CONSOLIDADAS
  const carregarDadosFinanceiros = async () => {
    setLoading(true);
    try {
      // 1. Puxa eventos ordenados por data mais recente
      const { data: evData, error: evError } = await supabase
        .from("eventos")
        .select("*")
        .order("data_inicio", { ascending: false });

      if (evError) throw evError;

      // 2. Puxa todas as escalas para calcular custo com equipe
      const { data: escData, error: escError } = await supabase
        .from("escalas")
        .select("id, evento_id, valor_pago, status_pagamento");

      if (escError) throw escError;

      // 3. Mescla escalas e despesas com cada evento
      const eventosProcessados = (evData || []).map((ev) => {
        const escalasDoEvento = (escData || []).filter((e) => e.evento_id === ev.id);
        const custoStaff = escalasDoEvento.reduce((acc, curr) => acc + (parseFloat(curr.valor_pago) || 0), 0);
        const todosPagos = escalasDoEvento.length > 0 && escalasDoEvento.every((e) => e.status_pagamento === true);

        const despesasLista = Array.isArray(ev.despesas) ? ev.despesas : [];
        const custoImpostos = despesasLista
          .filter((d) => d.categoria === "impostos")
          .reduce((acc, curr) => acc + (parseFloat(curr.valor) || 0), 0);
        const custoOperacional = despesasLista
          .filter((d) => d.categoria !== "impostos")
          .reduce((acc, curr) => acc + (parseFloat(curr.valor) || 0), 0);
        const custoExtras = despesasLista.reduce((acc, curr) => acc + (parseFloat(curr.valor) || 0), 0);

        return {
          ...ev,
          custoStaff,
          custoOperacional,
          custoImpostos,
          custoExtras,
          totalStaff: escalasDoEvento.length,
          todosPagos,
        };
      });

      setEventos(eventosProcessados);
    } catch (error) {
      console.error("Erro ao buscar dados financeiros:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      carregarDadosFinanceiros();
    }
  }, [isAuthorized]);

  // 3. MÉTRICAS GLOBAIS (DASHBOARD EXECUTIVO)
  const metricasGlobais = useMemo(() => {
    let faturamentoTotal = 0;
    let custoEquipeTotal = 0;
    let gastosOperacionaisTotal = 0;
    let impostosTotal = 0;

    eventos.forEach((ev) => {
      faturamentoTotal += parseFloat(ev.receita_bruta) || 0;
      custoEquipeTotal += ev.custoStaff || 0;
      gastosOperacionaisTotal += ev.custoOperacional || 0;
      impostosTotal += ev.custoImpostos || 0;
    });

    const custosGerais = custoEquipeTotal + gastosOperacionaisTotal + impostosTotal;
    const lucroLiquidoGeral = faturamentoTotal - custosGerais;
    const margemGeral = faturamentoTotal > 0 ? ((lucroLiquidoGeral / faturamentoTotal) * 100).toFixed(1) : "0.0";

    return {
      faturamentoTotal,
      custoEquipeTotal,
      gastosOperacionaisTotal,
      impostosTotal,
      lucroLiquidoGeral,
      margemGeral,
    };
  }, [eventos]);

  // 4. FILTRAGEM DE EVENTOS
  const eventosFiltrados = useMemo(() => {
    return eventos.filter((ev) => {
      const termo = busca.toLowerCase();
      const titulo = (ev.titulo || "").toLowerCase();
      const contratante = (ev.nome_contratante || "").toLowerCase();
      const endereco = (ev.endereco_texto || "").toLowerCase();

      const atendeBusca = !busca || titulo.includes(termo) || contratante.includes(termo) || endereco.includes(termo);

      if (!atendeBusca) return false;

      if (filtroStatus === "pendentes") {
        return !ev.todosPagos || !ev.receita_bruta;
      }
      if (filtroStatus === "quitados") {
        return ev.todosPagos && parseFloat(ev.receita_bruta) > 0;
      }
      if (filtroStatus === "extras") {
        return ev.custoOperacional > 0;
      }
      if (filtroStatus === "impostos") {
        return ev.custoImpostos > 0;
      }

      return true;
    });
  }, [eventos, busca, filtroStatus]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center text-[#777]">
        <Loader2 className="animate-spin mb-2 text-[#2563eb]" size={36} />
        <span className="ml-3 font-medium">Validando permissões de administrador...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] font-sans flex flex-col items-center">
      
      <div className="w-full max-w-4xl min-h-screen flex flex-col bg-[#1c1c1c] relative border-x border-[#2a2a2a] shadow-2xl">
        
        {/* CABEÇALHO SUPERIOR */}
        <div className="flex items-center justify-between p-5 border-b border-[#2e2e2e] sticky top-0 bg-[#1c1c1c]/95 backdrop-blur-md z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/admin")} 
              className="w-10 h-10 flex items-center justify-center rounded-md border border-[#3a3a3a] bg-[#222] hover:bg-[#2a2a2a] transition-colors text-[#999] hover:text-white cursor-pointer shadow-sm"
              title="Voltar ao Painel Admin"
            >
              <ArrowLeft size={20} strokeWidth={1.5} />
            </button>
            
            <div className="flex items-center gap-3 text-[#cccccc]">
              <div className="w-10 h-10 rounded-md bg-[#2563eb]/10 border border-[#2563eb]/20 flex items-center justify-center text-[#3b82f6]">
                <Wallet size={22} strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-[18px] font-bold tracking-wider text-[#e5e5e5] uppercase">Gestão Financeira</h1>
                <p className="text-[12px] text-[#777] uppercase tracking-wider font-medium">Controle de receitas, equipe, impostos e despesas</p>
              </div>
            </div>
          </div>

          <button
            onClick={carregarDadosFinanceiros}
            className="w-10 h-10 flex items-center justify-center rounded-md border border-[#3a3a3a] bg-[#222] hover:bg-[#2a2a2a] text-[#888] hover:text-white transition-colors cursor-pointer"
            title="Atualizar dados"
          >
            <RefreshCw size={17} className={loading ? "animate-spin text-[#2563eb]" : ""} />
          </button>
        </div>

        {/* ÁREA DE CONTEÚDO */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-[#141414] space-y-6">
          
          {/* ==========================================
              DASHBOARD EXECUTIVO COM CARDS
             ========================================== */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            
            {/* Card 1: Faturamento Total */}
            <div className="bg-[#1f1f1f] border border-[#303030] p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between text-[#888] text-[11px] font-bold uppercase tracking-wider mb-1">
                <span>Faturamento Total</span>
                <DollarSign size={15} className="text-[#2563eb]" />
              </div>
              <p className="text-[#f5f5f5] text-[16px] md:text-[19px] font-extrabold truncate">
                {formatarMoeda(metricasGlobais.faturamentoTotal)}
              </p>
              <span className="text-[11px] text-[#666] font-medium">
                {eventos.length} operações
              </span>
            </div>

            {/* Card 2: Impostos Retidos */}
            <div className="bg-[#1f1f1f] border border-[#303030] p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between text-[#888] text-[11px] font-bold uppercase tracking-wider mb-1">
                <span>Impostos (NF)</span>
                <Landmark size={15} className="text-emerald-400" />
              </div>
              <p className="text-emerald-400 text-[16px] md:text-[19px] font-extrabold truncate">
                {formatarMoeda(metricasGlobais.impostosTotal)}
              </p>
              <span className="text-[11px] text-[#666] font-medium">
                Retenções tributárias
              </span>
            </div>

            {/* Card 3: Custo Equipe */}
            <div className="bg-[#1f1f1f] border border-[#303030] p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between text-[#888] text-[11px] font-bold uppercase tracking-wider mb-1">
                <span>Custo Equipe</span>
                <Users size={15} className="text-[#3b82f6]" />
              </div>
              <p className="text-[#ddd] text-[16px] md:text-[19px] font-extrabold truncate">
                {formatarMoeda(metricasGlobais.custoEquipeTotal)}
              </p>
              <span className="text-[11px] text-[#666] font-medium">
                Diárias de staff
              </span>
            </div>

            {/* Card 4: Gastos Operacionais Extras */}
            <div className="bg-[#1f1f1f] border border-[#303030] p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between text-[#888] text-[11px] font-bold uppercase tracking-wider mb-1">
                <span>Gastos Extras</span>
                <Car size={15} className="text-amber-400" />
              </div>
              <p className="text-amber-400 text-[16px] md:text-[19px] font-extrabold truncate">
                {formatarMoeda(metricasGlobais.gastosOperacionaisTotal)}
              </p>
              <span className="text-[11px] text-[#666] font-medium">
                Uber, água, lanches
              </span>
            </div>

            {/* Card 5: Lucro Líquido Real no Bolso */}
            <div className={`border p-4 rounded-lg shadow-sm col-span-2 md:col-span-1 ${
              metricasGlobais.lucroLiquidoGeral < 0
                ? "bg-red-950/20 border-red-500/30"
                : "bg-green-950/20 border-green-500/30"
            }`}>
              <div className="flex items-center justify-between text-[#888] text-[11px] font-bold uppercase tracking-wider mb-1">
                <span>Lucro no Bolso</span>
                <TrendingUp size={15} className={metricasGlobais.lucroLiquidoGeral < 0 ? "text-red-400" : "text-green-400"} />
              </div>
              <p className={`text-[16px] md:text-[19px] font-extrabold truncate ${
                metricasGlobais.lucroLiquidoGeral < 0 ? "text-red-400" : "text-green-400"
              }`}>
                {formatarMoeda(metricasGlobais.lucroLiquidoGeral)}
              </p>
              <span className={`text-[11px] font-bold ${
                metricasGlobais.lucroLiquidoGeral < 0 ? "text-red-400" : "text-green-400"
              }`}>
                Margem {metricasGlobais.margemGeral}%
              </span>
            </div>

          </div>

          {/* ==========================================
              BARRA DE BUSCA E FILTROS
             ========================================== */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-2">
            
            {/* Campo de Busca */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777]" />
              <input
                type="text"
                placeholder="Pesquisar evento por nome, cliente ou local..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-[#1e1e1e] text-[#e5e5e5] pl-10 pr-4 py-2.5 rounded-md border border-[#333] text-[13px] outline-none focus:border-[#2563eb] transition-colors"
              />
            </div>

            {/* Filtros por Status */}
            <div className="flex items-center bg-[#1e1e1e] border border-[#333] rounded-md p-1 self-start sm:self-auto overflow-x-auto">
              <button
                onClick={() => setFiltroStatus("todos")}
                className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  filtroStatus === "todos" ? "bg-[#2563eb] text-white" : "text-[#888] hover:text-white"
                }`}
              >
                Todos ({eventos.length})
              </button>
              <button
                onClick={() => setFiltroStatus("pendentes")}
                className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  filtroStatus === "pendentes" ? "bg-amber-500 text-black font-extrabold" : "text-[#888] hover:text-white"
                }`}
              >
                Pendentes
              </button>
              <button
                onClick={() => setFiltroStatus("quitados")}
                className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  filtroStatus === "quitados" ? "bg-green-600 text-white font-extrabold" : "text-[#888] hover:text-white"
                }`}
              >
                Quitados
              </button>
              <button
                onClick={() => setFiltroStatus("extras")}
                className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  filtroStatus === "extras" ? "bg-[#181818] text-amber-400 border border-amber-500/30" : "text-[#888] hover:text-white"
                }`}
                title="Eventos com gastos extras operacionais"
              >
                Com Extras
              </button>
              <button
                onClick={() => setFiltroStatus("impostos")}
                className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  filtroStatus === "impostos" ? "bg-emerald-700 text-white font-bold" : "text-[#888] hover:text-white"
                }`}
                title="Eventos com Nota Fiscal emitida"
              >
                Com NF-e
              </button>
            </div>

          </div>

          {/* ==========================================
              LISTA DE EVENTOS COM BALANÇO
             ========================================== */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[#e5e5e5] text-[15px] font-bold uppercase tracking-wider">
                Eventos e Acertos ({eventosFiltrados.length})
              </h2>
              {busca && (
                <span className="text-[12px] text-[#777]">
                  Filtrando por: &quot;{busca}&quot;
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-28 text-[#777]">
                <Loader2 className="animate-spin mb-3 text-[#2563eb]" size={36} />
                <p className="text-[14px]">Sincronizando balanços de eventos...</p>
              </div>
            ) : eventosFiltrados.length === 0 ? (
              <div className="border border-[#2a2a2a] bg-[#1a1a1a] rounded-lg p-14 flex flex-col items-center justify-center text-center">
                <Wallet size={44} className="text-[#444] mb-3" strokeWidth={1.5} />
                <p className="text-[#bbb] text-[15px] font-semibold">Nenhum evento financeiro encontrado.</p>
                <p className="text-[#666] text-[13px] mt-1 max-w-sm">
                  {busca ? "Tente alterar os termos da sua pesquisa ou os filtros de status." : "Nenhum evento registrado no sistema."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {eventosFiltrados.map((evento) => (
                  <FinanceiroCard key={evento.id} evento={evento} router={router} />
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}