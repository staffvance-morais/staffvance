"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Award,
  FileText,
  Save,
  Loader2,
  CheckCircle2,
  X,
  Users,
  Search,
  Sparkles,
  ShieldAlert,
  Archive,
  Check,
} from "lucide-react";

const ROLES_GESTAO = ["admin", "owner", "coordenador", "producao", "produção"];

export function isGestorAutorizado(role) {
  if (!role) return false;
  return ROLES_GESTAO.includes(String(role).toLowerCase().trim());
}

export function BadgeClassificacao({ classificacao, size = "sm" }) {
  if (!classificacao) return null;
  const estilos = {
    Ouro: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    Prata: "bg-slate-300/20 text-slate-200 border-slate-400/50",
    Bronze: "bg-amber-700/25 text-amber-400 border-amber-600/50",
  };
  const classeCor =
    estilos[classificacao] || "bg-neutral-800 text-neutral-400 border-neutral-700";
  const padding =
    size === "lg"
      ? "px-3 py-1 text-xs"
      : "px-2 py-0.5 text-[10px]";

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider border rounded-sm ${padding} ${classeCor}`}
    >
      <Award size={size === "lg" ? 13 : 10} />
      {classificacao}
    </span>
  );
}

export default function AvaliacaoEncerramentoModal({
  aberto,
  onClose,
  evento,
  escalas = [],
  userRole,
  onSaved,
  onArchiveEvent,
}) {
  const [itens, setItens] = useState([]);
  const [busca, setBusca] = useState("");
  const [salvandoTudo, setSalvandoTudo] = useState(false);
  const [salvandoId, setSalvandoId] = useState(null);
  const [sucessoMsg, setSucessoMsg] = useState("");

  const autorizado = isGestorAutorizado(userRole);

  useEffect(() => {
    if (!aberto) return;
    const formatados = (escalas || []).map((esc) => {
      const perfil = esc.perfis || {};
      return {
        escalaId: esc.id,
        userId: esc.staff_id || perfil.id,
        nome: perfil.nome_completo || "Colaborador sem nome",
        foto: perfil.foto_url || perfil.avatar_url || null,
        cargo: perfil.cargo || perfil.role || "Staff",
        setor: esc.setor || "Geral",
        statusPresenca:
          esc.status_presenca || (esc.checkin_em ? "presente" : "pendente"),
        classificacao: perfil.classificacao || "",
        anotacoesGerais: perfil.anotacoes || "",
        notaEventoAtual: "",
        alterado: false,
      };
    });
    setItens(formatados);
    setSucessoMsg("");
  }, [aberto, escalas]);

  if (!aberto || !autorizado) return null;

  const atualizarCampo = (userId, campo, valor) => {
    setItens((prev) =>
      prev.map((item) =>
        item.userId === userId
          ? { ...item, [campo]: valor, alterado: true }
          : item
      )
    );
  };

  const classificarTodosPresentes = (nivel) => {
    setItens((prev) =>
      prev.map((item) =>
        item.statusPresenca === "presente"
          ? { ...item, classificacao: nivel, alterado: true }
          : item
      )
    );
  };

  const montarAnotacaoFinal = (item) => {
    const base = (item.anotacoesGerais || "").trim();
    const notaNova = (item.notaEventoAtual || "").trim();
    if (!notaNova) return base;

    const dataCurta = evento?.data_inicio
      ? new Date(evento.data_inicio).toLocaleDateString("pt-BR")
      : new Date().toLocaleDateString("pt-BR");
    const cabecalhoEvento = `[${evento?.titulo || "Evento"} - ${dataCurta}]: ${notaNova}`;

    if (base.includes(notaNova)) return base;
    return base ? `${cabecalhoEvento}\n${base}` : cabecalhoEvento;
  };

  const salvarUmStaff = async (item) => {
    if (!item.userId) return;
    setSalvandoId(item.userId);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada.");

      const anotacoesFinais = montarAnotacaoFinal(item);

      const res = await fetch("/api/atualizar-usuario", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: item.userId,
          classificacao: item.classificacao,
          anotacoes: anotacoesFinais,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao salvar avaliação.");

      setItens((prev) =>
        prev.map((i) =>
          i.userId === item.userId
            ? {
                ...i,
                anotacoesGerais: anotacoesFinais,
                notaEventoAtual: "",
                alterado: false,
              }
            : i
        )
      );

      setSucessoMsg(`Avaliação de ${item.nome} salva com sucesso!`);
      setTimeout(() => setSucessoMsg(""), 3000);
      if (onSaved) onSaved();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar avaliação: " + (err.message || "Tente novamente"));
    } finally {
      setSalvandoId(null);
    }
  };

  const salvarTodasAvaliacoes = async (arquivarAposSalvar = false) => {
    setSalvandoTudo(true);
    setSucessoMsg("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada.");

      const payloadAvaliacoes = itens
        .filter((i) => i.userId)
        .map((item) => ({
          userId: item.userId,
          classificacao: item.classificacao,
          anotacoes: montarAnotacaoFinal(item),
        }));

      const res = await fetch("/api/atualizar-usuario", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ avaliacoes: payloadAvaliacoes }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao salvar avaliações.");

      setItens((prev) =>
        prev.map((item) => ({
          ...item,
          anotacoesGerais: montarAnotacaoFinal(item),
          notaEventoAtual: "",
          alterado: false,
        }))
      );

      if (onSaved) await onSaved();

      if (arquivarAposSalvar && onArchiveEvent) {
        await onArchiveEvent();
      } else {
        setSucessoMsg(
          "Todas as classificações (Ouro, Prata, Bronze) e anotações do encerramento foram salvas!"
        );
        setTimeout(() => setSucessoMsg(""), 4000);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar avaliações em lote: " + (err.message || "Tente novamente"));
    } finally {
      setSalvandoTudo(false);
    }
  };

  const itensFiltrados = itens.filter((item) => {
    const termo = busca.toLowerCase();
    return (
      item.nome.toLowerCase().includes(termo) ||
      item.setor.toLowerCase().includes(termo) ||
      (item.classificacao || "").toLowerCase().includes(termo)
    );
  });

  const contOuro = itens.filter((i) => i.classificacao === "Ouro").length;
  const contPrata = itens.filter((i) => i.classificacao === "Prata").length;
  const contBronze = itens.filter((i) => i.classificacao === "Bronze").length;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#181818] border border-[#333] rounded-md w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* CABEÇALHO DO MODAL */}
        <div className="p-4 sm:p-5 bg-[#202020] border-b border-[#333] flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 flex items-center gap-1">
                <Award size={12} /> Restrito: Admin, Coordenadores e Produtores
              </span>
            </div>
            <h2 className="text-white font-bold text-[18px] sm:text-[20px] mt-1">
              Encerramento do Evento: Classificação e Anotações do Staff
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Operação: <strong className="text-neutral-200">{evento?.titulo}</strong> — Avalie o desempenho (Ouro, Prata, Bronze) e registre observações confidenciais.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-sm bg-[#2a2a2a] hover:bg-[#333] text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* BARRA DE RESUMO E AÇÃO RÁPIDA */}
        <div className="p-3.5 bg-[#141414] border-b border-[#2a2a2a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded bg-yellow-500/15 border border-yellow-500/40 text-yellow-400 font-bold">
              🥇 Ouro: {contOuro}
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-300/15 border border-slate-400/40 text-slate-200 font-bold">
              🥈 Prata: {contPrata}
            </span>
            <span className="px-2.5 py-1 rounded bg-amber-700/20 border border-amber-600/40 text-amber-400 font-bold">
              🥉 Bronze: {contBronze}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-neutral-400 mr-1 hidden md:inline">
              Classificar presentes:
            </span>
            <button
              type="button"
              onClick={() => classificarTodosPresentes("Ouro")}
              className="px-2.5 py-1 rounded bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-300 border border-yellow-500/40 font-bold cursor-pointer transition-colors"
            >
              Todos Ouro
            </button>
            <button
              type="button"
              onClick={() => classificarTodosPresentes("Prata")}
              className="px-2.5 py-1 rounded bg-slate-400/15 hover:bg-slate-400/25 text-slate-200 border border-slate-400/40 font-bold cursor-pointer transition-colors"
            >
              Todos Prata
            </button>
          </div>
        </div>

        {/* BARRA DE BUSCA */}
        <div className="px-4 pt-3 pb-2 bg-[#181818]">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
            />
            <input
              type="text"
              placeholder="Buscar colaborador por nome, setor ou classificação..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-[#222] border border-[#333] rounded-sm pl-9 pr-3 py-2 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {sucessoMsg && (
          <div className="mx-4 mt-2 p-2.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={15} />
            <span>{sucessoMsg}</span>
          </div>
        )}

        {/* LISTA DE STAFFS ESCALADOS */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {itensFiltrados.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-sm">
              Nenhum membro escalado encontrado para avaliação.
            </div>
          ) : (
            itensFiltrados.map((item) => {
              const salvandoEste = salvandoId === item.userId;
              return (
                <div
                  key={item.escalaId || item.userId}
                  className="bg-[#222] border border-[#333] rounded-md p-4 flex flex-col gap-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Identificação do Staff */}
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-[#2e2e2e] border border-[#444] overflow-hidden flex items-center justify-center shrink-0">
                        {item.foto ? (
                          <img
                            src={item.foto}
                            alt={item.nome}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users size={20} className="text-neutral-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-white font-bold text-[15px]">
                            {item.nome}
                          </h4>
                          <BadgeClassificacao classificacao={item.classificacao} />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                          <span className="text-blue-400 font-semibold">
                            Setor: {item.setor}
                          </span>
                          <span>•</span>
                          <span
                            className={`font-bold uppercase text-[10px] px-1.5 py-0.5 rounded ${
                              item.statusPresenca === "presente"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : item.statusPresenca === "falta"
                                ? "bg-red-500/15 text-red-400"
                                : "bg-amber-500/15 text-amber-400"
                            }`}
                          >
                            {item.statusPresenca}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botões de Classificação Ouro / Prata / Bronze */}
                    <div className="flex items-center gap-1.5">
                      {[
                        {
                          id: "Ouro",
                          label: "🥇 Ouro",
                          ativo:
                            "bg-yellow-500 text-black border-yellow-400 shadow-md",
                          inativo:
                            "bg-[#1a1a1a] text-yellow-400/80 border-yellow-500/30 hover:bg-yellow-500/15",
                        },
                        {
                          id: "Prata",
                          label: "🥈 Prata",
                          ativo:
                            "bg-slate-200 text-black border-white shadow-md",
                          inativo:
                            "bg-[#1a1a1a] text-slate-300 border-slate-400/30 hover:bg-slate-400/15",
                        },
                        {
                          id: "Bronze",
                          label: "🥉 Bronze",
                          ativo:
                            "bg-amber-600 text-white border-amber-400 shadow-md",
                          inativo:
                            "bg-[#1a1a1a] text-amber-400/80 border-amber-600/30 hover:bg-amber-600/15",
                        },
                      ].map((op) => {
                        const selecionado = item.classificacao === op.id;
                        return (
                          <button
                            key={op.id}
                            type="button"
                            onClick={() =>
                              atualizarCampo(
                                item.userId,
                                "classificacao",
                                selecionado ? "" : op.id
                              )
                            }
                            className={`px-3 py-1.5 rounded-sm border text-xs font-extrabold transition-all cursor-pointer ${
                              selecionado ? op.ativo : op.inativo
                            }`}
                          >
                            {op.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Campo de Anotações do Evento e Histórico Confidencial */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 border-t border-[#2f2f2f]">
                    <div>
                      <label className="text-[11px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                        <FileText size={12} /> Anotação neste Evento (Encerramento)
                      </label>
                      <input
                        type="text"
                        value={item.notaEventoAtual}
                        onChange={(e) =>
                          atualizarCampo(
                            item.userId,
                            "notaEventoAtual",
                            e.target.value
                          )
                        }
                        placeholder="Ex: Ótima postura no setor, pontual, atencioso..."
                        className="w-full bg-[#161616] border border-[#3a3a3a] rounded-sm px-3 py-2 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider flex items-center justify-between mb-1">
                        <span>Histórico / Anotações Confidenciais do Perfil</span>
                        <button
                          type="button"
                          onClick={() => salvarUmStaff(item)}
                          disabled={salvandoEste}
                          className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {salvandoEste ? (
                            <Loader2 size={11} className="animate-spin" />
                          ) : (
                            <Check size={11} />
                          )}
                          Salvar individual
                        </button>
                      </label>
                      <textarea
                        rows={1}
                        value={item.anotacoesGerais}
                        onChange={(e) =>
                          atualizarCampo(
                            item.userId,
                            "anotacoesGerais",
                            e.target.value
                          )
                        }
                        placeholder="Nenhuma observação anterior registrada."
                        className="w-full bg-[#161616] border border-[#3a3a3a] rounded-sm px-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-blue-500 resize-y"
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RODAPÉ COM SALVAMENTO EM LOTE E ENCERRAMENTO */}
        <div className="p-4 bg-[#202020] border-t border-[#333] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <p className="text-[11px] text-neutral-400 flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-yellow-500 shrink-0" />
            <span>
              Visível <strong>somente</strong> para Admin, Coordenadores e Produtores.
            </span>
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {onArchiveEvent && evento?.escopo !== "arquivado" && (
              <button
                type="button"
                disabled={salvandoTudo}
                onClick={() => salvarTodasAvaliacoes(true)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-sm bg-amber-600 hover:bg-amber-500 text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
              >
                <Archive size={15} />
                <span>Salvar e Enviar p/ Histórico</span>
              </button>
            )}

            <button
              type="button"
              disabled={salvandoTudo}
              onClick={() => salvarTodasAvaliacoes(false)}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-sm bg-[#16a34a] hover:bg-[#15803d] text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50 shadow-md"
            >
              {salvandoTudo ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Salvando Avaliações...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Salvar Classificações e Anotações</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

