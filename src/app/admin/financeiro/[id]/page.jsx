"use client";

import { supabase } from "@/lib/supabase";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  CheckCircle2, 
  Circle, 
  Printer, 
  MapPin, 
  Shield, 
  Calendar,
  Briefcase,
  Car,
  Droplets,
  Utensils,
  Radio,
  Receipt,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Copy,
  Check,
  CheckCheck,
  Search,
  Filter,
  Users,
  Landmark,
  Calculator,
  FileText,
  Percent,
  Share2,
  Wallet,
  Camera,
  X,
  ExternalLink,
  Clock,
  UserCheck,
  UserX
} from "lucide-react";
import { enviarEmailPagamento } from "@/app/actions/email";

// ==========================================
// FORMATAÇÕES & CONSTANTES
// ==========================================
const formatarMoeda = (valor) => {
  const numero = parseFloat(valor);
  if (isNaN(numero)) return "R$ 0,00";
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const formatarPorExtenso = (valor) => {
  const num = parseFloat(valor);
  if (isNaN(num) || num === 0) return "Zero reais";
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)} bilhão(ões)`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)} milhão(ões)`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)} mil reais`;
  return `${num.toFixed(2)} reais`;
};

const CATEGORIAS_GASTOS = [
  { id: "transporte", nome: "Uber / Transporte", icon: Car, cor: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { id: "agua", nome: "Água & Gelo", icon: Droplets, cor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  { id: "alimentacao", nome: "Alimentação & Lanche", icon: Utensils, cor: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { id: "equipamentos", nome: "Insumos & Equip.", icon: Radio, cor: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { id: "impostos", nome: "Impostos / NF", icon: Landmark, cor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { id: "outros", nome: "Outros / Imprevistos", icon: Receipt, cor: "text-zinc-300 bg-zinc-700/30 border-zinc-600/30" },
];

const SUGESTOES_RAPIDAS = [
  { texto: "Uber volta equipe madrugada", cat: "transporte" },
  { texto: "Fardos de água mineral 500ml", cat: "agua" },
  { texto: "Saco de gelo filtrado", cat: "agua" },
  { texto: "Lanches da tarde / marmitas", cat: "alimentacao" },
  { texto: "Pilhas AA para rádios HT", cat: "equipamentos" },
  { texto: "Fita zebrada de isolamento", cat: "equipamentos" },
  { texto: "Estacionamento coordenação", cat: "transporte" },
];

const ALÍQUOTAS_PADRAO = [
  { valor: "6", rotulo: "6% (Simples Anexo III)" },
  { valor: "8.5", rotulo: "8.5% (Simples Faixa 2)" },
  { valor: "10", rotulo: "10% (ISS + PIS/COFINS)" },
  { valor: "15", rotulo: "15% (Lucro Presumido)" },
];

// ==========================================
// PÁGINA PRINCIPAL DO ACERTO FINANCEIRO
// ==========================================
export default function AcertoFinanceiro() {
  const router = useRouter();
  const params = useParams();
  const eventoId = params?.id;

  // Estados de Segurança e Carregamento
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [alertaSql, setAlertaSql] = useState(false);
  const [sqlCopiado, setSqlCopiado] = useState(false);

  // Dados do Evento e Financeiro
  const [evento, setEvento] = useState(null);
  const [receitaBruta, setReceitaBruta] = useState("");
  const [equipe, setEquipe] = useState([]);
  const [despesas, setDespesas] = useState([]);

  // Estado da Gestão Fiscal & Impostos
  const [tributos, setTributos] = useState({
    emitiuNf: false,
    numeroNf: "",
    aliquota: "6",
    valorManual: "",
    usarValorManual: false,
    anotacoes: "",
  });

  // Estado do Formulário de Nova Despesa
  const [novaCategoria, setNovaCategoria] = useState("transporte");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novoValor, setNovoValor] = useState("");
  const [novaFormaPagto, setNovaFormaPagto] = useState("Pix");

  // Filtros da Equipe
  const [filtroEquipe, setFiltroEquipe] = useState("todos"); // 'todos' | 'presentes' | 'faltas' | 'pendentes_pgto' | 'pagos'
  const [buscaEquipe, setBuscaEquipe] = useState("");

  // Modal de Auditoria de Selfie
  const [fotoModal, setFotoModal] = useState(null);

  // Feedback de Cópia Pix e WhatsApp
  const [pixCopiadoId, setPixCopiadoId] = useState(null);
  const [zapCopiado, setZapCopiado] = useState(false);

  // Feedback de Salvo
  const [mensagemSucesso, setMensagemSucesso] = useState("");

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

  // 2. BUSCA DADOS DO EVENTO, ESCALAS E DESPESAS (INCLUINDO CHAVE PIX)
  useEffect(() => {
    if (!isAuthorized || !eventoId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: evData, error: evError } = await supabase
          .from("eventos")
          .select("*")
          .eq("id", eventoId)
          .single();

        if (evError) throw evError;
        setEvento(evData);
        setReceitaBruta(evData?.receita_bruta !== null && evData?.receita_bruta !== undefined ? evData.receita_bruta : "");

        // Carrega despesas operacionais
        const listaDespesas = Array.isArray(evData?.despesas) ? evData.despesas : [];
        setDespesas(listaDespesas);

        // Se houver um gasto da categoria "impostos", inicializa o módulo de tributos
        const impostoSalvo = listaDespesas.find((d) => d.categoria === "impostos");
        if (impostoSalvo) {
          setTributos({
            emitiuNf: true,
            numeroNf: impostoSalvo.numero_nf || "",
            aliquota: impostoSalvo.aliquota ? String(impostoSalvo.aliquota) : "6",
            valorManual: impostoSalvo.valor_manual ? String(impostoSalvo.valor) : "",
            usarValorManual: !!impostoSalvo.valor_manual,
            anotacoes: impostoSalvo.anotacoes || "",
          });
        }

        // Carrega a equipe escalada (incluindo chave_pix do perfil e dados de presenca)
        const { data: escData, error: escError } = await supabase
          .from("escalas")
          .select(`
            id, setor, valor_pago, status_pagamento, 
            status_presenca, checkin_em, checkin_foto_url, checkin_lat, checkin_lng, checkout_em, checkin_manual,
            perfis ( id, nome_completo, foto_url, email, chave_pix, uniforme )
          `)
          .eq("evento_id", eventoId);

        if (escError) throw escError;

        const equipeFormatada = (escData || []).map((item) => ({
          ...item,
          valor_pago: item.valor_pago !== null && item.valor_pago !== undefined ? item.valor_pago : "",
          status_pagamento: item.status_pagamento || false,
          status_presenca: item.status_presenca || (item.checkin_em ? "presente" : "pendente"),
        }));

        setEquipe(equipeFormatada);

        // Executa silenciosamente a rotina de limpeza de fotos de mais de 24h
        fetch("/api/presencas/limpar-fotos").catch(() => {});
      } catch (err) {
        console.error("Erro ao carregar acerto financeiro:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthorized, eventoId]);

  // 3. CÁLCULOS FINANCEIROS EM TEMPO REAL
  const receitaNum = parseFloat(receitaBruta) || 0;

  // Cálculo de Impostos
  const valorImpostoCalculado = useMemo(() => {
    if (!tributos.emitiuNf) return 0;
    if (tributos.usarValorManual && tributos.valorManual) {
      const v = parseFloat(tributos.valorManual.replace(",", "."));
      return isNaN(v) ? 0 : v;
    }
    const aliq = parseFloat(tributos.aliquota) || 0;
    return (receitaNum * aliq) / 100;
  }, [tributos, receitaNum]);

  const custoStaffTotal = useMemo(() => {
    return equipe.reduce((acc, curr) => {
      const val = parseFloat(curr.valor_pago);
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
  }, [equipe]);

  // Despesas operacionais puras (sem impostos)
  const custoDespesasOperacionais = useMemo(() => {
    return despesas
      .filter((d) => d.categoria !== "impostos")
      .reduce((acc, curr) => {
        const val = parseFloat(curr.valor);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
  }, [despesas]);

  // Custo Total Geral: Staff + Despesas Operacionais + Impostos
  const custoTotalGeral = custoStaffTotal + custoDespesasOperacionais + valorImpostoCalculado;
  const receitaLiquidaAposImpostos = receitaNum - valorImpostoCalculado;
  const lucroLiquido = receitaNum - custoTotalGeral;
  const margemLucro = receitaNum > 0 ? ((lucroLiquido / receitaNum) * 100) : 0;

  // Resumo de Gastos por Categoria
  const gastosPorCategoria = useMemo(() => {
    const mapa = {};
    CATEGORIAS_GASTOS.forEach((cat) => {
      mapa[cat.id] = 0;
    });
    despesas.forEach((d) => {
      const v = parseFloat(d.valor) || 0;
      if (mapa[d.categoria] !== undefined) {
        mapa[d.categoria] += v;
      } else {
        mapa["outros"] = (mapa["outros"] || 0) + v;
      }
    });
    if (tributos.emitiuNf && valorImpostoCalculado > 0) {
      mapa["impostos"] = valorImpostoCalculado;
    }
    return mapa;
  }, [despesas, tributos.emitiuNf, valorImpostoCalculado]);

  // 4. SINCRONIZADOR DE TRIBUTOS NA LISTA DE DESPESAS
  const mesclarTributosNaListaDespesas = (listaAtual) => {
    const listaSemImposto = (listaAtual || []).filter((d) => d.categoria !== "impostos");

    if (!tributos.emitiuNf || valorImpostoCalculado <= 0) {
      return listaSemImposto;
    }

    const itemImposto = {
      id: "desp_imposto_" + (eventoId || "auto"),
      categoria: "impostos",
      descricao: `Imposto / NF-e ${tributos.numeroNf ? `(${tributos.numeroNf})` : ""} - Alíquota ${tributos.aliquota}%`,
      valor: valorImpostoCalculado,
      forma_pagamento: "Guia Fiscal / DAS",
      aliquota: parseFloat(tributos.aliquota) || 0,
      numero_nf: tributos.numeroNf,
      valor_manual: tributos.usarValorManual,
      anotacoes: tributos.anotacoes,
      criado_em: new Date().toISOString(),
    };

    return [itemImposto, ...listaSemImposto];
  };

  // 5. MANIPULAÇÃO DE GASTOS OPERACIONAIS
  const handleAdicionarDespesa = (e) => {
    e?.preventDefault();
    const valorNumerico = parseFloat(novoValor.replace(",", "."));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      alert("Informe um valor válido para o gasto.");
      return;
    }
    if (!novaDescricao.trim()) {
      alert("Informe uma descrição para o gasto (ex: Uber para equipe, 3 fardos de água).");
      return;
    }

    const novoItem = {
      id: "desp_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      categoria: novaCategoria,
      descricao: novaDescricao.trim(),
      valor: valorNumerico,
      forma_pagamento: novaFormaPagto,
      criado_em: new Date().toISOString(),
    };

    setDespesas((prev) => [novoItem, ...prev]);
    setNovaDescricao("");
    setNovoValor("");
  };

  const handleRemoverDespesa = (id) => {
    if (confirm("Deseja realmente remover esta despesa operacional?")) {
      setDespesas((prev) => prev.filter((d) => d.id !== id));
    }
  };

  // 6. COPIAR CHAVE PIX DO COLABORADOR
  const copiarPix = (staffId, chavePix) => {
    if (!chavePix) {
      alert("Este colaborador não cadastrou uma chave Pix.");
      return;
    }
    navigator.clipboard.writeText(chavePix);
    setPixCopiadoId(staffId);
    setTimeout(() => setPixCopiadoId(null), 2500);
  };

  // 7. COPIAR RESUMO PARA WHATSAPP
  const copiarResumoWhatsApp = () => {
    const dataFormatada = evento?.data_inicio 
      ? new Date(evento.data_inicio).toLocaleDateString("pt-BR") 
      : "A definir";
    
    const texto = [
      "🛡️ *ACERTO FINANCEIRO - WADJET*",
      `📌 *Operação:* ${evento?.titulo || "Evento sem título"}`,
      `👤 *Contratante:* ${evento?.nome_contratante || "Não informado"}`,
      `📅 *Data:* ${dataFormatada}`,
      `📍 *Local:* ${evento?.endereco_texto || "Não informado"}`,
      "",
      `💰 *Receita Bruta:* ${formatarMoeda(receitaNum)}`,
      tributos.emitiuNf && valorImpostoCalculado > 0 
        ? `🏛️ *Impostos Retidos (NF ${tributos.numeroNf || ""}):* ${formatarMoeda(valorImpostoCalculado)} (${tributos.aliquota}%)` 
        : null,
      `👥 *Equipe (${equipe.length} staffs):* ${formatarMoeda(custoStaffTotal)}`,
      custoDespesasOperacionais > 0 
        ? `🚗 *Gastos Operacionais Extras:* ${formatarMoeda(custoDespesasOperacionais)}` 
        : null,
      "━━━━━━━━━━━━━━━━━━━━",
      `💵 *LUCRO LÍQUIDO REAL:* ${formatarMoeda(lucroLiquido)} (${margemLucro.toFixed(1)}% de margem)`,
    ].filter(Boolean).join("\n");

    navigator.clipboard.writeText(texto);
    setZapCopiado(true);
    setTimeout(() => setZapCopiado(false), 3000);
  };

  // Rolar suavemente até a seção de Gestão Fiscal & Impostos com destaque visual
  const scrollParaGestaoFiscal = () => {
    const el = document.getElementById("gestao-fiscal");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.classList.add("ring-2", "ring-emerald-500", "border-emerald-500");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-emerald-500", "border-emerald-500");
      }, 1800);
    }
  };

  // 8. MANIPULAÇÃO DA EQUIPE E PAGAMENTOS
  const handleUpdateStaff = (id, campo, valor) => {
    setEquipe((prev) => prev.map((m) => (m.id === id ? { ...m, [campo]: valor } : m)));
  };

  const handleTogglePagamento = async (staff) => {
    const novoStatus = !staff.status_pagamento;
    setEquipe((prev) => prev.map((m) => (m.id === staff.id ? { ...m, status_pagamento: novoStatus } : m)));

    try {
      await supabase.from("escalas").update({ status_pagamento: novoStatus }).eq("id", staff.id);

      const valorStaff = parseFloat(staff.valor_pago || 0);
      if (novoStatus && staff.perfis?.email && valorStaff > 0) {
        const valorFormatado = valorStaff.toFixed(2);
        const res = await enviarEmailPagamento(
          staff.perfis.email,
          staff.perfis.nome_completo || "Staff",
          { titulo: evento?.titulo || "Operação Wadjet" },
          valorFormatado
        );
        if (res.success) {
          setMensagemSucesso(`E-mail de comprovante enviado para ${staff.perfis.nome_completo}!`);
          setTimeout(() => setMensagemSucesso(""), 4000);
        }
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar status de pagamento.");
    }
  };

  const handleMarcarTodosPagos = async () => {
    const presentes = equipe.filter((m) => m.status_presenca === "presente" || !!m.checkin_em);
    const naoPresentes = equipe.filter((m) => m.status_presenca !== "presente" && !m.checkin_em);

    let listaParaPagar = equipe;

    if (naoPresentes.length > 0) {
      const pagarApenasPresentes = confirm(
        `🛡️ Proteção Financeira Wadjet:\n\n` +
        `Detectamos ${naoPresentes.length} colaborador(es) SEM confirmação de presença neste evento.\n\n` +
        `• Clique [OK] para pagar APENAS os ${presentes.length} presentes confirmados.\n` +
        `• Clique [CANCELAR] para cancelar o pagamento em lote.`
      );
      if (!pagarApenasPresentes) return;
      listaParaPagar = presentes;
    } else {
      const confirmacao = confirm(`Deseja marcar os ${equipe.length} colaboradores como PAGOS?`);
      if (!confirmacao) return;
    }

    if (listaParaPagar.length === 0) {
      alert("Nenhum colaborador com presença confirmada para pagar.");
      return;
    }

    setSalvando(true);
    try {
      const idsPagos = new Set(listaParaPagar.map((m) => m.id));
      setEquipe((prev) => prev.map((m) => idsPagos.has(m.id) ? { ...m, status_pagamento: true } : m));

      for (const staff of listaParaPagar) {
        await supabase.from("escalas").update({ status_pagamento: true }).eq("id", staff.id);
      }
      setMensagemSucesso(`${listaParaPagar.length} colaborador(es) marcados como pagos com sucesso!`);
      setTimeout(() => setMensagemSucesso(""), 4000);
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar pagamentos em lote.");
    } finally {
      setSalvando(false);
    }
  };

  const handleTogglePresenca = async (staffId, novoStatus) => {
    try {
      const agora = new Date().toISOString();
      const updateData = {
        status_presenca: novoStatus,
      };

      if (novoStatus === "presente") {
        updateData.checkin_em = agora;
        updateData.checkin_manual = true;
      } else if (novoStatus === "pendente") {
        updateData.checkin_em = null;
        updateData.checkout_em = null;
        updateData.checkin_manual = false;
      }

      await supabase.from("escalas").update(updateData).eq("id", staffId);

      setEquipe((prev) =>
        prev.map((s) =>
          s.id === staffId
            ? {
                ...s,
                status_presenca: novoStatus,
                checkin_em: novoStatus === "presente" ? (s.checkin_em || agora) : null,
                checkin_manual: novoStatus === "presente" ? true : s.checkin_manual,
              }
            : s
        )
      );
    } catch (err) {
      console.error("Erro ao alterar presenca no financeiro:", err);
      alert("Erro ao atualizar status de presença.");
    }
  };

  // 9. SALVAR TODAS AS INFORMAÇÕES NO SUPABASE
  const handleSalvarTudo = async () => {
    setSalvando(true);
    setMensagemSucesso("");

    try {
      const despesasFinais = mesclarTributosNaListaDespesas(despesas);
      setDespesas(despesasFinais);

      // 1. Atualiza receita_bruta e despesas no evento
      const { error: eventoUpdateError } = await supabase
        .from("eventos")
        .update({
          receita_bruta: parseFloat(receitaBruta) || 0,
          despesas: despesasFinais,
        })
        .eq("id", eventoId);

      if (eventoUpdateError) {
        if (eventoUpdateError.message?.includes("column \"despesas\" of relation \"eventos\" does not exist") ||
            eventoUpdateError.message?.includes("despesas")) {
          setAlertaSql(true);
          await supabase.from("eventos").update({ receita_bruta: parseFloat(receitaBruta) || 0 }).eq("id", eventoId);
        } else {
          throw eventoUpdateError;
        }
      }

      // 2. Atualiza valores e status da equipe
      for (const staff of equipe) {
        await supabase
          .from("escalas")
          .update({
            valor_pago: parseFloat(staff.valor_pago) || 0,
            status_pagamento: staff.status_pagamento || false,
          })
          .eq("id", staff.id);
      }

      setMensagemSucesso("Balanço financeiro, despesas e impostos salvos com sucesso!");
      setTimeout(() => setMensagemSucesso(""), 4000);
    } catch (e) {
      console.error("Erro ao salvar balanço:", e);
      alert("Erro ao salvar alterações financeiras.");
    } finally {
      setSalvando(false);
    }
  };

  const copiarComandoSql = () => {
    navigator.clipboard.writeText("ALTER TABLE eventos ADD COLUMN IF NOT EXISTS despesas JSONB DEFAULT '[]'::jsonb;");
    setSqlCopiado(true);
    setTimeout(() => setSqlCopiado(false), 3000);
  };

  // Filtro de equipe
  const equipeFiltrada = equipe.filter((staff) => {
    const isPresente = staff.status_presenca === "presente" || !!staff.checkin_em;
    const isFalta = staff.status_presenca === "falta";

    let atendeFiltroStatus = true;
    if (filtroEquipe === "pagos") atendeFiltroStatus = staff.status_pagamento === true;
    else if (filtroEquipe === "pendentes_pgto") atendeFiltroStatus = staff.status_pagamento === false;
    else if (filtroEquipe === "presentes") atendeFiltroStatus = isPresente;
    else if (filtroEquipe === "faltas") atendeFiltroStatus = isFalta;

    const nome = staff.perfis?.nome_completo?.toLowerCase() || "";
    const setor = staff.setor?.toLowerCase() || "";
    const pix = staff.perfis?.chave_pix?.toLowerCase() || "";
    const termo = buscaEquipe.toLowerCase();
    const atendeBusca = !buscaEquipe || nome.includes(termo) || setor.includes(termo) || pix.includes(termo);

    return atendeFiltroStatus && atendeBusca;
  });

  if (!isAuthorized || loading) {
    return (
      <div className="min-h-screen bg-[#171717] flex flex-col items-center justify-center text-[#777]">
        <Loader2 className="animate-spin mb-3 text-[#2563eb]" size={40} />
        <p className="text-[15px] font-medium tracking-wide">Carregando acerto financeiro...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-[#e5e5e5] font-sans flex flex-col items-center pb-20 print:bg-white print:text-black print:pb-0">
      
      {/* CONTAINER RESPONSIVO */}
      <div className="w-full max-w-4xl flex flex-col bg-[#1c1c1c] print:bg-white border-x border-[#2a2a2a] print:border-none min-h-screen shadow-2xl">
        
        {/* CABEÇALHO COM BOTÃO WHATSAPP E IMPRIMIR */}
        <div className="p-4 md:p-6 border-b border-[#2e2e2e] sticky top-0 bg-[#1c1c1c]/95 backdrop-blur-md z-20 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin/financeiro")}
              className="w-10 h-10 flex items-center justify-center rounded-md border border-[#3a3a3a] bg-[#242424] hover:bg-[#2e2e2e] text-[#aaa] hover:text-white transition-all cursor-pointer shadow-sm"
              title="Voltar para a lista financeira"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-[#2563eb]/20 text-[#3b82f6] border border-[#2563eb]/30">
                  Painel Executivo
                </span>
                <h1 className="text-[17px] md:text-[19px] font-bold text-[#f5f5f5] tracking-wide uppercase">
                  Acerto Financeiro
                </h1>
              </div>
              <p className="text-[13px] text-[#2563eb] font-semibold mt-0.5 truncate max-w-[200px] sm:max-w-[320px] md:max-w-[450px]">
                {evento?.titulo || "Evento sem título"}
              </p>
            </div>
          </div>

          {/* BOTÕES DE AÇÃO: WHATSAPP + IMPRIMIR */}
          <div className="flex items-center gap-2">
            
            {/* BOTÃO COPIAR RESUMO PARA WHATSAPP */}
            <button
              onClick={copiarResumoWhatsApp}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md border text-[13px] font-semibold transition-all cursor-pointer shadow-sm ${
                zapCopiado
                  ? "bg-green-600 text-white border-green-500"
                  : "bg-green-950/20 hover:bg-green-900/30 text-green-400 border-green-600/40"
              }`}
              title="Copiar resumo financeiro formatado para WhatsApp"
            >
              {zapCopiado ? <Check size={16} /> : <Share2 size={16} />}
              <span className="hidden sm:inline">{zapCopiado ? "Resumo Copiado!" : "WhatsApp"}</span>
            </button>

            {/* BOTÃO IMPRIMIR RELATÓRIO */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-2 rounded-md border border-[#3a3a3a] bg-[#242424] hover:bg-[#2e2e2e] text-[#ccc] text-[13px] font-medium transition-colors cursor-pointer shadow-sm"
              title="Imprimir relatório executivo"
            >
              <Printer size={16} className="text-[#2563eb]" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
          </div>
        </div>

        {/* FEEDBACK DE SALVO COM SUCESSO */}
        {mensagemSucesso && (
          <div className="mx-4 md:mx-6 mt-4 p-3.5 bg-green-500/10 border border-green-500/30 rounded-md text-green-400 text-[13px] font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{mensagemSucesso}</span>
          </div>
        )}

        {/* AVISO SE A COLUNA DESPESAS NÃO EXISTIR NO BANCO */}
        {alertaSql && (
          <div className="mx-4 md:mx-6 mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-md text-[#e5e5e5] text-[13px] flex flex-col gap-2.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-[14px]">
              <AlertTriangle size={18} />
              <span>Configuração no Banco de Dados Necessária</span>
            </div>
            <p className="text-[#bbb]">
              A coluna de <strong>despesas operacionais</strong> ainda não foi criada na tabela <code>eventos</code> do Supabase. Copie o comando abaixo e execute-o no <strong>SQL Editor</strong> do seu painel Supabase para salvar os gastos definitivamente:
            </p>
            <div className="flex items-center justify-between bg-[#111] p-2.5 rounded border border-[#333] font-mono text-[12px] text-amber-300">
              <span className="truncate">ALTER TABLE eventos ADD COLUMN IF NOT EXISTS despesas JSONB DEFAULT &apos;[]&apos;::jsonb;</span>
              <button
                onClick={copiarComandoSql}
                className="ml-3 flex items-center gap-1 text-[11px] font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] px-2.5 py-1 rounded transition-colors cursor-pointer shrink-0"
              >
                {sqlCopiado ? <Check size={14} /> : <Copy size={14} />}
                {sqlCopiado ? "Copiado!" : "Copiar SQL"}
              </button>
            </div>
          </div>
        )}

        {/* CABEÇALHO EXCLUSIVO PARA IMPRESSÃO */}
        <div className="hidden print:block p-8 border-b-2 border-black text-black">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wider">WADJET SEGURANÇA & EVENTOS</h1>
              <p className="text-sm font-semibold text-gray-700">Relatório Executivo de Acerto Financeiro</p>
              <p className="text-xs text-gray-500 mt-1">Gerado em: {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")}</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold border border-black px-3 py-1 uppercase">Confidencial</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 text-sm border-t border-gray-300 pt-4">
            <div><strong>Evento:</strong> {evento?.titulo}</div>
            <div><strong>Contratante:</strong> {evento?.nome_contratante || "Não informado"}</div>
            <div><strong>Local:</strong> {evento?.endereco_texto || "Não informado"}</div>
            <div><strong>Data:</strong> {evento?.data_inicio ? new Date(evento.data_inicio).toLocaleDateString("pt-BR") : "A definir"}</div>
            {tributos.emitiuNf && (
              <div className="col-span-2 pt-2 border-t border-gray-200">
                <strong>Fiscal / NF-e:</strong> {tributos.numeroNf || "Emitida"} | <strong>Alíquota:</strong> {tributos.aliquota}% | <strong>Imposto Retido:</strong> {formatarMoeda(valorImpostoCalculado)}
                {tributos.anotacoes && <p className="text-xs italic mt-1 text-gray-600">Obs: {tributos.anotacoes}</p>}
              </div>
            )}
          </div>
        </div>

        {/* CONTEÚDO PRINCIPAL */}
        <div className="p-4 md:p-6 space-y-6 flex-1">
          
          {/* ==========================================
              BLOCO 1: BALANÇO EXECUTIVO DO EVENTO
             ========================================== */}
          <section className="bg-[#222222] border border-[#333333] rounded-lg p-4 md:p-6 shadow-lg print:border-gray-300 print:bg-white print:p-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#333] print:border-gray-300 mb-4">
              <div className="flex items-center gap-2 text-[#f0f0f0] print:text-black">
                <DollarSign className="text-[#2563eb]" size={20} />
                <h2 className="text-[16px] md:text-[17px] font-bold uppercase tracking-wider">
                  Balanço Operacional do Evento
                </h2>
              </div>
              <div className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider border ${
                lucroLiquido < 0 
                  ? "bg-red-500/10 text-red-400 border-red-500/20" 
                  : margemLucro >= 30 
                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}>
                {lucroLiquido < 0 ? "Em Prejuízo" : `Margem Líquida: ${margemLucro.toFixed(1)}%`}
              </div>
            </div>

            {/* ENTRADA DA RECEITA DO CONTRATANTE */}
            <div className="mb-5">
              <label className="text-[12px] text-[#999] uppercase font-bold tracking-wider block mb-1.5 print:text-gray-700">
                Receita Contratante / Valor Cobrado (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777] font-semibold text-[15px]">R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={receitaBruta}
                  onChange={(e) => setReceitaBruta(e.target.value)}
                  placeholder="0,00"
                  className="w-full bg-[#161616] text-[#f5f5f5] text-[18px] font-bold pl-11 pr-4 py-3 rounded-md border border-[#444] outline-none focus:border-[#2563eb] transition-all print:bg-white print:text-black print:border-gray-400"
                />
              </div>
              {receitaBruta && (
                <p className="text-[11px] text-[#aaa] mt-1.5 italic print:text-gray-600">
                  Referência: {formatarPorExtenso(receitaBruta)}
                </p>
              )}
            </div>

            {/* GRID DE INDICADORES DO BALANÇO */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
              
              {/* Imposto / Tributo (Clicável para ir direto à Gestão Fiscal) */}
              <div
                onClick={scrollParaGestaoFiscal}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") scrollParaGestaoFiscal(); }}
                title="Clique para ir direto à Gestão Fiscal e cálculo de impostos"
                className="bg-[#181818] hover:bg-[#202020] p-3 rounded-md border border-[#2e2e2e] hover:border-emerald-500/70 transition-all cursor-pointer group shadow-sm print:border-gray-300 print:bg-gray-50 select-none"
              >
                <div className="flex items-center justify-between text-[#888] group-hover:text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-1 transition-colors">
                  <span className="flex items-center gap-1">
                    Imposto / NF
                    <span className="text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">↓</span>
                  </span>
                  <Landmark size={14} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-emerald-400 text-[15px] md:text-[17px] font-bold truncate print:text-emerald-700">
                  {formatarMoeda(valorImpostoCalculado)}
                </p>
                <div className="flex items-center justify-between text-[10px] text-[#666] group-hover:text-[#aaa] font-medium transition-colors mt-0.5">
                  <span className="truncate">{tributos.emitiuNf ? `${tributos.aliquota}% s/ receita` : "Isento / Sem NF"}</span>
                  <span className="text-emerald-400 text-[9px] font-semibold underline underline-offset-2 ml-1 shrink-0">Editar</span>
                </div>
              </div>

              {/* Custo Equipe */}
              <div className="bg-[#181818] p-3 rounded-md border border-[#2e2e2e] print:border-gray-300 print:bg-gray-50">
                <div className="flex items-center justify-between text-[#888] text-[11px] font-bold uppercase tracking-wider mb-1">
                  <span>Equipe Staff</span>
                  <Users size={14} className="text-[#3b82f6]" />
                </div>
                <p className="text-[#e5e5e5] text-[15px] md:text-[17px] font-bold truncate print:text-black">
                  {formatarMoeda(custoStaffTotal)}
                </p>
                <span className="text-[10px] text-[#666] font-medium">
                  {equipe.length} diárias
                </span>
              </div>

              {/* Gastos Operacionais Extras */}
              <div className="bg-[#181818] p-3 rounded-md border border-[#2e2e2e] print:border-gray-300 print:bg-gray-50">
                <div className="flex items-center justify-between text-[#888] text-[11px] font-bold uppercase tracking-wider mb-1">
                  <span>Gastos Extras</span>
                  <Car size={14} className="text-amber-400" />
                </div>
                <p className="text-amber-400 text-[15px] md:text-[17px] font-bold truncate print:text-amber-700">
                  {formatarMoeda(custoDespesasOperacionais)}
                </p>
                <span className="text-[10px] text-[#666] font-medium">
                  Uber, água, lanches
                </span>
              </div>

              {/* Custo Total Geral */}
              <div className="bg-[#181818] p-3 rounded-md border border-[#2e2e2e] print:border-gray-300 print:bg-gray-50">
                <div className="flex items-center justify-between text-[#888] text-[11px] font-bold uppercase tracking-wider mb-1">
                  <span>Custo Total</span>
                  <TrendingDown size={14} className="text-red-400" />
                </div>
                <p className="text-red-400 text-[15px] md:text-[17px] font-bold truncate print:text-red-700">
                  {formatarMoeda(custoTotalGeral)}
                </p>
                <span className="text-[10px] text-[#666] font-medium">
                  Tudo incluso
                </span>
              </div>

              {/* Lucro Líquido Real no Bolso */}
              <div className={`p-3 rounded-md border col-span-2 sm:col-span-1 ${
                lucroLiquido < 0
                  ? "bg-red-950/20 border-red-500/30 print:bg-red-50"
                  : "bg-green-950/20 border-green-500/30 print:bg-green-50"
              }`}>
                <div className="flex items-center justify-between text-[#888] text-[11px] font-bold uppercase tracking-wider mb-1">
                  <span>Lucro no Bolso</span>
                  <TrendingUp size={14} className={lucroLiquido < 0 ? "text-red-400" : "text-green-400"} />
                </div>
                <p className={`text-[15px] md:text-[17px] font-extrabold truncate ${
                  lucroLiquido < 0 ? "text-red-400 print:text-red-700" : "text-green-400 print:text-green-700"
                }`}>
                  {formatarMoeda(lucroLiquido)}
                </p>
                <span className={`text-[10px] font-bold ${
                  lucroLiquido < 0 ? "text-red-400" : "text-green-400"
                }`}>
                  {receitaNum > 0 ? `${margemLucro.toFixed(1)}% sobra real` : "Sem receita"}
                </span>
              </div>

            </div>

            {/* BARRA DE PROPORÇÃO VISUAL (STAFF vs EXTRAS vs IMPOSTOS vs LUCRO) */}
            {receitaNum > 0 && (
              <div className="mt-4 pt-4 border-t border-[#333] print:hidden">
                <div className="flex items-center justify-between text-[11px] text-[#888] uppercase font-bold mb-1.5">
                  <span>Divisão Real da Receita</span>
                  <span>Receita Líquida pós-impostos: {formatarMoeda(receitaLiquidaAposImpostos)}</span>
                </div>
                <div className="w-full h-3 bg-[#111] rounded-full overflow-hidden flex border border-[#333]">
                  {/* Impostos */}
                  {valorImpostoCalculado > 0 && (
                    <div
                      title={`Impostos: ${((valorImpostoCalculado / receitaNum) * 100).toFixed(1)}%`}
                      style={{ width: `${Math.min(100, (valorImpostoCalculado / receitaNum) * 100)}%` }}
                      className="bg-emerald-500 h-full transition-all"
                    />
                  )}
                  {/* Staff */}
                  <div
                    title={`Staff: ${((custoStaffTotal / receitaNum) * 100).toFixed(0)}%`}
                    style={{ width: `${Math.min(100 - (valorImpostoCalculado / receitaNum) * 100, (custoStaffTotal / receitaNum) * 100)}%` }}
                    className="bg-[#2563eb] h-full transition-all"
                  />
                  {/* Gastos Extras */}
                  <div
                    title={`Gastos Extras: ${((custoDespesasOperacionais / receitaNum) * 100).toFixed(0)}%`}
                    style={{ width: `${Math.min(100 - ((custoStaffTotal + valorImpostoCalculado) / receitaNum) * 100, (custoDespesasOperacionais / receitaNum) * 100)}%` }}
                    className="bg-amber-500 h-full transition-all"
                  />
                  {/* Lucro Líquido */}
                  {lucroLiquido > 0 && (
                    <div
                      title={`Lucro Líquido: ${margemLucro.toFixed(0)}%`}
                      style={{ width: `${Math.max(0, margemLucro)}%` }}
                      className="bg-green-500 h-full transition-all"
                    />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-[#888]">
                  {valorImpostoCalculado > 0 && (
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Impostos ({((valorImpostoCalculado / receitaNum) * 100 || 0).toFixed(1)}%)</span>
                  )}
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#2563eb] rounded-full" /> Staff ({((custoStaffTotal / receitaNum) * 100 || 0).toFixed(0)}%)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full" /> Gastos Extras ({((custoDespesasOperacionais / receitaNum) * 100 || 0).toFixed(0)}%)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-green-500 rounded-full" /> Lucro Real ({margemLucro.toFixed(0)}%)</span>
                </div>
              </div>
            )}

            {/* BOTÃO SALVAR BALANÇO GERAL */}
            <div className="mt-5 print:hidden">
              <button
                onClick={handleSalvarTudo}
                disabled={salvando}
                className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold py-3 px-4 rounded-md flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md disabled:opacity-50"
              >
                {salvando ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                <span>{salvando ? "Salvando alterações..." : "Salvar Balanço, Impostos e Gastos"}</span>
              </button>
            </div>
          </section>

          {/* ==========================================
              BLOCO 2: GESTÃO FISCAL & IMPOSTOS (NF-E)
             ========================================== */}
          <section
            id="gestao-fiscal"
            className="scroll-mt-24 bg-[#222222] border border-[#333333] rounded-lg p-4 md:p-6 shadow-lg transition-all duration-500 print:border-gray-300 print:bg-white print:p-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#333] print:border-gray-300 mb-4 gap-2">
              <div className="flex items-center gap-2.5 text-[#f0f0f0] print:text-black">
                <Calculator className="text-emerald-400" size={20} />
                <div>
                  <h2 className="text-[16px] md:text-[17px] font-bold uppercase tracking-wider">
                    Gestão Fiscal & Impostos (NF-e)
                  </h2>
                  <p className="text-[12px] text-[#888] font-medium print:text-gray-600">
                    Calculadora de retenção tributária e anotações contábeis do evento
                  </p>
                </div>
              </div>

              {/* TOGGLE EMISSÃO DE NOTA FISCAL */}
              <div className="flex items-center gap-2 print:hidden">
                <label className="flex items-center gap-2 text-[13px] font-bold cursor-pointer text-[#ccc] hover:text-white select-none">
                  <input
                    type="checkbox"
                    checked={tributos.emitiuNf}
                    onChange={(e) => setTributos((prev) => ({ ...prev, emitiuNf: e.target.checked }))}
                    className="w-4 h-4 accent-[#2563eb] rounded cursor-pointer"
                  />
                  <span>Emitiu Nota Fiscal neste evento?</span>
                </label>
              </div>
            </div>

            {tributos.emitiuNf ? (
              <div className="bg-[#181818] border border-[#2e2e2e] p-4 rounded-md space-y-4">
                
                {/* LINHA 1: NÚMERO DA NOTA E SELEÇÃO DE ALÍQUOTA */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  
                  {/* Número da Nota */}
                  <div className="sm:col-span-4">
                    <label className="text-[11px] text-[#888] uppercase font-bold tracking-wider block mb-1">
                      Nº da Nota Fiscal (NF-e / RPS)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: NF 1042"
                      value={tributos.numeroNf}
                      onChange={(e) => setTributos((prev) => ({ ...prev, numeroNf: e.target.value }))}
                      className="w-full bg-[#111] text-[#e5e5e5] px-3 py-2 rounded border border-[#3a3a3a] text-[13px] outline-none focus:border-[#2563eb]"
                    />
                  </div>

                  {/* Alíquota de Imposto */}
                  <div className="sm:col-span-8">
                    <label className="text-[11px] text-[#888] uppercase font-bold tracking-wider block mb-1">
                      Alíquota de Tributação (%)
                    </label>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {ALÍQUOTAS_PADRAO.map((item) => (
                        <button
                          key={item.valor}
                          type="button"
                          onClick={() => setTributos((prev) => ({ ...prev, aliquota: item.valor, usarValorManual: false }))}
                          className={`px-2.5 py-1.5 rounded text-[11px] font-bold border transition-all cursor-pointer ${
                            !tributos.usarValorManual && tributos.aliquota === item.valor
                              ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                              : "bg-[#222] text-[#888] border-[#333] hover:text-white"
                          }`}
                        >
                          {item.rotulo}
                        </button>
                      ))}

                      {/* Botão de Alíquota Personalizada */}
                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-[11px] text-[#777]">Outro %:</span>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="%"
                          value={tributos.aliquota}
                          onChange={(e) => setTributos((prev) => ({ ...prev, aliquota: e.target.value, usarValorManual: false }))}
                          className="w-16 bg-[#111] text-[#e5e5e5] px-2 py-1 rounded border border-[#3a3a3a] text-[12px] font-bold outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* LINHA 2: RESUMO DO CÁLCULO E OPÇÃO DE VALOR MANUAL */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[#111] rounded border border-[#2a2a2a] gap-3">
                  <div>
                    <span className="text-[11px] text-[#777] uppercase font-bold block">
                      Imposto Calculado Automaticamente
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-[20px] font-extrabold text-emerald-400">
                        {formatarMoeda(valorImpostoCalculado)}
                      </span>
                      <span className="text-[12px] text-[#888]">
                        ({tributos.aliquota}% sobre {formatarMoeda(receitaNum)})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-[12px] text-[#aaa] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tributos.usarValorManual}
                        onChange={(e) => setTributos((prev) => ({ ...prev, usarValorManual: e.target.checked }))}
                        className="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer"
                      />
                      <span>Digitar valor exato da guia (R$)</span>
                    </label>

                    {tributos.usarValorManual && (
                      <input
                        type="number"
                        step="0.01"
                        placeholder="R$ 0,00"
                        value={tributos.valorManual}
                        onChange={(e) => setTributos((prev) => ({ ...prev, valorManual: e.target.value }))}
                        className="w-28 bg-[#161616] text-emerald-400 font-bold px-2.5 py-1 rounded border border-emerald-500/50 text-[13px] outline-none"
                      />
                    )}
                  </div>
                </div>

                {/* LINHA 3: ANOTAÇÕES CONTÁBEIS / FISCAIS DO EVENTO */}
                <div>
                  <label className="text-[11px] text-[#888] uppercase font-bold tracking-wider block mb-1">
                    Anotações Contábeis / Observações da Nota
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Retenção de 5% de ISS na fonte pela prefeitura. Guia DAS com vencimento no dia 20. Chave de acesso da NFe arquivada..."
                    value={tributos.anotacoes}
                    onChange={(e) => setTributos((prev) => ({ ...prev, anotacoes: e.target.value }))}
                    className="w-full bg-[#111] text-[#e5e5e5] p-2.5 rounded border border-[#3a3a3a] text-[12px] outline-none focus:border-emerald-500 transition-colors placeholder:text-[#555]"
                  />
                </div>

              </div>
            ) : (
              <div className="border border-dashed border-[#333] rounded-md p-6 text-center text-[#777] text-[13px] flex flex-col items-center justify-center">
                <Landmark size={28} className="text-[#444] mb-2" />
                <p>Nenhuma nota fiscal registrada para esta operação (evento sem retenção de impostos).</p>
                <p className="text-[11px] text-[#555] mt-1">
                  Marque a caixa acima caso tenha emitido NF-e para calcular automaticamente a retenção tributária.
                </p>
              </div>
            )}
          </section>

          {/* ==========================================
              BLOCO 3: GASTOS OPERACIONAIS (UBER, ÁGUA, ETC.)
             ========================================== */}
          <section className="bg-[#222222] border border-[#333333] rounded-lg p-4 md:p-6 shadow-lg print:border-gray-300 print:bg-white print:p-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#333] print:border-gray-300 mb-4 gap-2">
              <div className="flex items-center gap-2.5 text-[#f0f0f0] print:text-black">
                <Car className="text-amber-400" size={20} />
                <div>
                  <h2 className="text-[16px] md:text-[17px] font-bold uppercase tracking-wider">
                    Gastos Operacionais no Evento
                  </h2>
                  <p className="text-[12px] text-[#888] font-medium print:text-gray-600">
                    Controle de custos extras (Uber, água mineral, lanches, gelo, etc.)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                  Total Extras: {formatarMoeda(custoDespesasOperacionais)}
                </span>
              </div>
            </div>

            {/* FORMULÁRIO RÁPIDO PARA ADICIONAR GASTO */}
            <form onSubmit={handleAdicionarDespesa} className="bg-[#181818] border border-[#2e2e2e] p-4 rounded-md mb-5 print:hidden">
              <div className="text-[12px] text-[#aaa] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Plus size={14} className="text-[#2563eb]" /> Lançar Nova Despesa Operacional
              </div>

              {/* SELEÇÃO DE CATEGORIA */}
              <div className="flex flex-wrap gap-2 mb-3.5">
                {CATEGORIAS_GASTOS.map((cat) => {
                  const IconComp = cat.icon;
                  const isSelected = novaCategoria === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNovaCategoria(cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#2563eb] text-white border-[#2563eb] shadow-sm"
                          : "bg-[#222] text-[#888] border-[#333] hover:text-[#ccc] hover:bg-[#282828]"
                      }`}
                    >
                      <IconComp size={14} />
                      {cat.nome}
                    </button>
                  );
                })}
              </div>

              {/* SUGESTÕES RÁPIDAS DE DESPESAS */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px] text-[#777]">
                <span className="font-semibold uppercase tracking-wider">Sugestões:</span>
                {SUGESTOES_RAPIDAS.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setNovaDescricao(sug.texto);
                      setNovaCategoria(sug.cat);
                    }}
                    className="bg-[#242424] hover:bg-[#333] hover:text-[#ddd] text-[#888] px-2 py-0.5 rounded border border-[#333] transition-colors cursor-pointer"
                  >
                    + {sug.texto}
                  </button>
                ))}
              </div>

              {/* CAMPOS DE TEXTO E VALORES */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <input
                    type="text"
                    placeholder="Descrição do gasto (ex: 2 Ubers volta da equipe)"
                    value={novaDescricao}
                    onChange={(e) => setNovaDescricao(e.target.value)}
                    className="w-full bg-[#111] text-[#e5e5e5] px-3.5 py-2.5 rounded border border-[#3a3a3a] text-[13px] outline-none focus:border-[#2563eb] transition-colors"
                  />
                </div>

                <div className="sm:col-span-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777] text-[13px] font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={novoValor}
                      onChange={(e) => setNovoValor(e.target.value)}
                      className="w-full bg-[#111] text-[#e5e5e5] pl-9 pr-3 py-2.5 rounded border border-[#3a3a3a] text-[13px] font-bold outline-none focus:border-[#2563eb] transition-colors"
                    />
                  </div>
                </div>

                <div className="sm:col-span-3 flex gap-2">
                  <select
                    value={novaFormaPagto}
                    onChange={(e) => setNovaFormaPagto(e.target.value)}
                    className="w-full bg-[#111] text-[#ccc] px-2.5 py-2.5 rounded border border-[#3a3a3a] text-[12px] outline-none focus:border-[#2563eb] cursor-pointer"
                  >
                    <option value="Pix">Pix</option>
                    <option value="Cartão Corporativo">Cartão</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Guia Fiscal / DAS">Boleto / DAS</option>
                    <option value="Reembolso Staff">Reembolso</option>
                  </select>

                  <button
                    type="submit"
                    className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold px-4 py-2.5 rounded flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Adicionar gasto"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </form>

            {/* RESUMO POR CATEGORIA (PILLS) */}
            <div className="flex flex-wrap gap-2 mb-4">
              {CATEGORIAS_GASTOS.map((cat) => {
                const valorCat = gastosPorCategoria[cat.id] || 0;
                if (valorCat <= 0) return null;
                const IconComp = cat.icon;
                return (
                  <div
                    key={cat.id}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold border ${cat.cor}`}
                  >
                    <IconComp size={13} />
                    <span>{cat.nome}:</span>
                    <strong className="font-bold">{formatarMoeda(valorCat)}</strong>
                  </div>
                );
              })}
            </div>

            {/* LISTA DE DESPESAS LANÇADAS (FILTRANDO AS DESPESAS OPERACIONAIS) */}
            {despesas.filter((d) => d.categoria !== "impostos").length === 0 ? (
              <div className="border border-dashed border-[#333] rounded-md p-8 text-center text-[#777] text-[13px] flex flex-col items-center justify-center">
                <Car size={32} className="text-[#444] mb-2" />
                <p>Nenhuma despesa operacional registrada para este evento.</p>
                <p className="text-[11px] text-[#555] mt-1">
                  Use o formulário acima para lançar gastos com transporte (Uber), água, refeições e insumos.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {despesas
                  .filter((d) => d.categoria !== "impostos")
                  .map((despesa) => {
                    const catConfig = CATEGORIAS_GASTOS.find((c) => c.id === despesa.categoria) || CATEGORIAS_GASTOS[5];
                    const IconComp = catConfig.icon;

                    return (
                      <div
                        key={despesa.id}
                        className="bg-[#191919] border border-[#2e2e2e] hover:border-[#444] p-3 rounded-md flex items-center justify-between transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-md flex items-center justify-center border shrink-0 ${catConfig.cor}`}>
                            <IconComp size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[#e5e5e5] text-[14px] font-semibold truncate">
                              {despesa.descricao}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-[#888] mt-0.5">
                              <span className="capitalize">{catConfig.nome}</span>
                              <span>•</span>
                              <span className="text-[#aaa] bg-[#222] px-1.5 py-0.5 rounded border border-[#333]">
                                {despesa.forma_pagamento || "Pix"}
                              </span>
                              {despesa.criado_em && (
                                <>
                                  <span>•</span>
                                  <span>
                                    {new Date(despesa.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <span className="text-amber-400 font-bold text-[14px] md:text-[15px]">
                            {formatarMoeda(despesa.valor)}
                          </span>
                          <button
                            onClick={() => handleRemoverDespesa(despesa.id)}
                            className="w-8 h-8 rounded flex items-center justify-center text-[#666] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors cursor-pointer print:hidden"
                            title="Remover despesa"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </section>

          {/* ==========================================
              BLOCO 4: GESTÃO DA EQUIPE ESCALADA, CACHETS & PIX
             ========================================== */}
          <section className="bg-[#222222] border border-[#333333] rounded-lg p-4 md:p-6 shadow-lg print:border-gray-300 print:bg-white print:p-4">
            
            {/* CABEÇALHO DO BLOCO DA EQUIPE */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-[#333] print:border-gray-300 mb-4 gap-3">
              <div className="flex items-center gap-2.5 text-[#f0f0f0] print:text-black">
                <Users className="text-[#3b82f6]" size={20} />
                <div>
                  <h2 className="text-[16px] md:text-[17px] font-bold uppercase tracking-wider">
                    Equipe Escalada ({equipe.length})
                  </h2>
                  <p className="text-[12px] text-[#888] font-medium print:text-gray-600">
                    Custo total em diárias: {formatarMoeda(custoStaffTotal)}
                  </p>
                </div>
              </div>

              {/* BOTÕES DE AÇÃO RÁPIDA (PAGAR TODOS / FILTROS) */}
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={handleMarcarTodosPagos}
                  disabled={salvando || equipe.length === 0}
                  className="flex items-center gap-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 px-3 py-1.5 rounded text-[12px] font-bold uppercase transition-all cursor-pointer disabled:opacity-50"
                  title="Marcar todos os colaboradores como pagos"
                >
                  <CheckCheck size={15} />
                  <span>Pagar Todos</span>
                </button>

                {/* Filtros da equipe com presenças e pagamentos */}
                <div className="flex flex-wrap items-center bg-[#181818] border border-[#333] rounded p-0.5 gap-0.5">
                  <button
                    type="button"
                    onClick={() => setFiltroEquipe("todos")}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      filtroEquipe === "todos" ? "bg-[#2563eb] text-white" : "text-[#888] hover:text-white"
                    }`}
                  >
                    Todos ({equipe.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroEquipe("presentes")}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      filtroEquipe === "presentes" ? "bg-emerald-600 text-white" : "text-emerald-400 hover:text-white"
                    }`}
                  >
                    Presentes ({equipe.filter((m) => m.status_presenca === "presente" || !!m.checkin_em).length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroEquipe("faltas")}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      filtroEquipe === "faltas" ? "bg-red-600 text-white" : "text-red-400 hover:text-white"
                    }`}
                  >
                    Faltas ({equipe.filter((m) => m.status_presenca === "falta").length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroEquipe("pendentes_pgto")}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      filtroEquipe === "pendentes_pgto" ? "bg-amber-500 text-black font-extrabold" : "text-[#888] hover:text-white"
                    }`}
                  >
                    A Pagar ({equipe.filter((m) => !m.status_pagamento).length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroEquipe("pagos")}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      filtroEquipe === "pagos" ? "bg-green-600 text-white font-extrabold" : "text-[#888] hover:text-white"
                    }`}
                  >
                    Pagos ({equipe.filter((m) => m.status_pagamento).length})
                  </button>
                </div>
              </div>
            </div>

            {/* BUSCA RÁPIDA DE STAFF */}
            {equipe.length > 5 && (
              <div className="relative mb-4 print:hidden">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" />
                <input
                  type="text"
                  placeholder="Filtrar membro da equipe por nome, setor ou chave Pix..."
                  value={buscaEquipe}
                  onChange={(e) => setBuscaEquipe(e.target.value)}
                  className="w-full bg-[#181818] text-[#e5e5e5] pl-9 pr-3 py-2 rounded border border-[#333] text-[12px] outline-none focus:border-[#2563eb]"
                />
              </div>
            )}

            {/* LISTA DE MEMBROS ESCALADOS */}
            {equipeFiltrada.length === 0 ? (
              <div className="bg-[#191919] border border-[#333] rounded p-8 text-center text-[#777] text-[13px]">
                {equipe.length === 0
                  ? "Nenhum staff escalado para esta operação."
                  : "Nenhum membro encontrado com o filtro selecionado."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {equipeFiltrada.map((staff) => (
                  <div
                    key={staff.id}
                    className="bg-[#191919] border border-[#333] hover:border-[#444] p-4 rounded-md flex flex-col justify-between gap-3 transition-colors print:border-gray-300 print:bg-white"
                  >
                    {/* INFO DO COLABORADOR */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-[#121212] rounded-full overflow-hidden border border-[#444] flex items-center justify-center shrink-0">
                          {staff.perfis?.foto_url ? (
                            <img src={staff.perfis.foto_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Shield size={18} className="text-[#777]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[#e5e5e5] font-semibold text-[14px] capitalize truncate print:text-black">
                            {staff.perfis?.nome_completo || "Colaborador sem nome"}
                          </h4>
                          <p className="text-[#888] text-[12px] flex items-center gap-1 mt-0.5 print:text-gray-600 truncate">
                            <MapPin size={12} className="shrink-0" /> Setor:{" "}
                            <span className="text-[#ccc] font-medium print:text-black">
                              {staff.setor || "Geral"}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* BOTÃO TOGGLE PAGAMENTO */}
                      <button
                        type="button"
                        onClick={() => handleTogglePagamento(staff)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold uppercase border transition-all cursor-pointer shrink-0 print:border-gray-400 ${
                          staff.status_pagamento
                            ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                        }`}
                        title={staff.status_pagamento ? "Clique para reverter para pendente" : "Clique para marcar como pago e notificar"}
                      >
                        {staff.status_pagamento ? (
                          <>
                            <CheckCircle2 size={14} className="text-green-400" />
                            <span>Pago</span>
                          </>
                        ) : (
                          <>
                            <Circle size={14} className="text-amber-400" />
                            <span>Pendente</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* BLOCO DE PRESENÇA CONFIRMADA & SELFIE */}
                    <div className="bg-[#141414] p-2.5 rounded border border-[#262626] flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2 min-w-0">
                        {staff.status_presenca === "presente" || !!staff.checkin_em ? (
                          <div className="flex items-center gap-1 text-emerald-400 font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Presente</span>
                            <span className="text-neutral-400 font-normal">
                              ({staff.checkin_em ? new Date(staff.checkin_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "Confirmado"})
                            </span>
                          </div>
                        ) : staff.status_presenca === "falta" ? (
                          <div className="flex items-center gap-1 text-red-400 font-bold">
                            <span className="w-2 h-2 rounded-full bg-red-400" />
                            <span>Faltou / Ausente</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-neutral-400">
                            <span className="w-2 h-2 rounded-full bg-neutral-600" />
                            <span>Sem check-in</span>
                          </div>
                        )}

                        {/* Botão para ver selfie do check-in */}
                        {staff.checkin_foto_url && (
                          <button
                            type="button"
                            onClick={() =>
                              setFotoModal({
                                url: staff.checkin_foto_url,
                                nome: staff.perfis?.nome_completo || "Staff",
                                horario: staff.checkin_em,
                                lat: staff.checkin_lat,
                                lng: staff.checkin_lng,
                              })
                            }
                            className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Ver selfie enviada pelo staff"
                          >
                            <Camera size={11} />
                            <span>Selfie</span>
                          </button>
                        )}
                      </div>

                      {/* Ações de presença rápida para o Admin */}
                      <div className="flex items-center gap-1 shrink-0 print:hidden">
                        {staff.status_presenca !== "presente" && !staff.checkin_em ? (
                          <button
                            type="button"
                            onClick={() => handleTogglePresenca(staff.id, "presente")}
                            className="text-[10px] text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded font-semibold transition-colors cursor-pointer"
                          >
                            + Confirmar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleTogglePresenca(staff.id, "falta")}
                            className="text-[10px] text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded font-semibold transition-colors cursor-pointer"
                          >
                            Marcar Falta
                          </button>
                        )}
                      </div>
                    </div>

                    {/* VALOR DA DIÁRIA */}
                    <div className="pt-2 border-t border-[#2e2e2e] print:border-gray-200 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[#888] text-[12px] font-bold uppercase tracking-wider shrink-0 print:text-gray-700">
                          Diária:
                        </span>
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#777] text-[12px]">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            value={staff.valor_pago}
                            onChange={(e) => handleUpdateStaff(staff.id, "valor_pago", e.target.value)}
                            className="w-full bg-[#121212] text-[#e5e5e5] pl-8 pr-3 py-1.5 rounded border border-[#3a3a3a] text-[13px] font-semibold outline-none focus:border-[#2563eb] transition-colors print:bg-white print:text-black print:border-gray-400"
                          />
                        </div>
                      </div>
                      {staff.valor_pago && (
                        <span className="text-[10px] text-[#777] italic ml-1 print:text-gray-500">
                          {formatarPorExtenso(staff.valor_pago)}
                        </span>
                      )}
                    </div>

                    {/* CHAVE PIX DO STAFF COM BOTÃO COPIAR */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#262626] print:border-gray-200">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#888] min-w-0">
                        <Wallet size={12} className="text-emerald-400 shrink-0" />
                        <span className="shrink-0 font-semibold">Pix:</span>
                        <span className="text-[#ccc] truncate font-mono" title={staff.perfis?.chave_pix || "Não cadastrada"}>
                          {staff.perfis?.chave_pix || "Não cadastrada"}
                        </span>
                      </div>

                      {staff.perfis?.chave_pix && (
                        <button
                          type="button"
                          onClick={() => copiarPix(staff.id, staff.perfis.chave_pix)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer shrink-0 print:hidden ${
                            pixCopiadoId === staff.id
                              ? "bg-emerald-600 text-white"
                              : "bg-[#252525] hover:bg-[#333] text-[#aaa] hover:text-white border border-[#3a3a3a]"
                          }`}
                          title="Copiar chave Pix deste colaborador"
                        >
                          {pixCopiadoId === staff.id ? <Check size={11} /> : <Copy size={11} />}
                          <span>{pixCopiadoId === staff.id ? "Copiado!" : "Copiar Pix"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* RODAPÉ DO ACERTO */}
        <div className="p-4 md:p-6 border-t border-[#2e2e2e] bg-[#181818] flex items-center justify-between print:hidden">
          <button
            onClick={() => router.push("/admin/financeiro")}
            className="text-[13px] text-[#888] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={16} /> Voltar para o Financeiro
          </button>

          <button
            onClick={handleSalvarTudo}
            disabled={salvando}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold py-2.5 px-6 rounded-md flex items-center gap-2 transition-colors cursor-pointer shadow-md disabled:opacity-50"
          >
            {salvando ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            <span>{salvando ? "Salvando..." : "Salvar Tudo"}</span>
          </button>
        </div>

        {/* ASSINATURA PARA IMPRESSÃO */}
        <div className="hidden print:block p-8 mt-12 border-t-2 border-black text-black">
          <div className="grid grid-cols-2 gap-12 text-center text-sm pt-8">
            <div>
              <div className="border-t border-black pt-2 font-bold uppercase">Diretoria / Coordenação Wadjet</div>
              <p className="text-xs text-gray-600">Assinatura do Responsável</p>
            </div>
            <div>
              <div className="border-t border-black pt-2 font-bold uppercase">Contratante / Representante</div>
              <p className="text-xs text-gray-600">Confirmação de Prestação de Contas</p>
            </div>
          </div>
        </div>

        {/* MODAL DE AUDITORIA DE FOTO/SELFIE */}
        {fotoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1a1a1a] border border-[#333] w-full max-w-sm rounded-lg overflow-hidden shadow-2xl flex flex-col">
              <div className="p-3 bg-[#222] border-b border-[#333] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera size={16} className="text-blue-400" />
                  <h4 className="text-white font-bold text-[13px]">Selfie de Presença</h4>
                </div>
                <button
                  onClick={() => setFotoModal(null)}
                  className="text-neutral-400 hover:text-white p-1 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="relative w-full aspect-[4/5] bg-black">
                <img
                  src={fotoModal.url}
                  alt={fotoModal.nome}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-3 space-y-2 text-[12px] bg-[#1a1a1a]">
                <div>
                  <p className="text-white font-bold text-[14px]">{fotoModal.nome}</p>
                  <p className="text-neutral-400 text-[11px] flex items-center gap-1 mt-0.5">
                    <Clock size={12} className="text-blue-400" />
                    <span>
                      {fotoModal.horario
                        ? new Date(fotoModal.horario).toLocaleString("pt-BR")
                        : "Horário não registrado"}
                    </span>
                  </p>
                </div>

                {fotoModal.lat && fotoModal.lng && (
                  <div className="pt-2 border-t border-[#2e2e2e] flex items-center justify-between">
                    <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                      <MapPin size={12} className="text-red-400" />
                      GPS: {Number(fotoModal.lat).toFixed(4)}, {Number(fotoModal.lng).toFixed(4)}
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${fotoModal.lat},${fotoModal.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-400 hover:underline font-bold flex items-center gap-1"
                    >
                      <span>Abrir no Google Maps</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}