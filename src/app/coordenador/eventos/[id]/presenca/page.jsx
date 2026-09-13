"use client";

import { supabase } from "@/lib/supabase";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Camera,
  Shirt,
  Loader2,
  RotateCcw,
  CheckCheck,
  ExternalLink,
  Shield,
  X,
  UserCheck,
  UserX
} from "lucide-react";

export default function ListaPresencaCoordenador() {
  const router = useRouter();
  const params = useParams();
  const eventoId = params?.id;

  const [loading, setLoading] = useState(true);
  const [salvandoId, setSalvandoId] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userRole, setUserRole] = useState("");

  const [evento, setEvento] = useState(null);
  const [equipe, setEquipe] = useState([]);
  const [setoresDisponiveis, setSetoresDisponiveis] = useState([]);

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos"); // "todos" | "presentes" | "pendentes" | "faltas"
  const [filtroSetor, setFiltroSetor] = useState("todos");

  // Modal de Foto Ampliada
  const [fotoModal, setFotoModal] = useState(null); // { url, nome, horario, lat, lng }

  // 1. Verifica permissão (Admin, Owner ou Coordenador)
  useEffect(() => {
    async function checkAuth() {
      try {
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

        const role = (perfilData?.role || "").toLowerCase().trim();
        if (role !== "admin" && role !== "owner" && role !== "coordenador") {
          router.push("/freelancers");
          return;
        }

        setUserRole(role);
        setIsAuthorized(true);
      } catch (err) {
        console.error("Erro na verificação de autenticação:", err);
      }
    }
    checkAuth();
  }, [router]);

  // 2. Carrega Evento e Escala da Equipe
  useEffect(() => {
    if (!isAuthorized || !eventoId) return;

    async function carregarDados() {
      setLoading(true);
      try {
        // Busca evento
        const { data: evData, error: evErr } = await supabase
          .from("eventos")
          .select("*")
          .eq("id", eventoId)
          .single();

        if (evErr) throw evErr;
        setEvento(evData);

        // Busca escalas e perfis
        const { data: escData, error: escErr } = await supabase
          .from("escalas")
          .select(`
            id,
            setor,
            status_presenca,
            checkin_em,
            checkin_foto_url,
            checkin_lat,
            checkin_lng,
            checkout_em,
            checkout_foto_url,
            checkin_manual,
            perfis (
              id,
              nome_completo,
              foto_url,
              uniforme,
              whatsapp
            )
          `)
          .eq("evento_id", eventoId);

        if (escErr) throw escErr;

        const listaFormatada = (escData || []).map((e) => ({
          ...e,
          status_presenca: e.status_presenca || (e.checkin_em ? "presente" : "pendente"),
        }));

        setEquipe(listaFormatada);

        // Extrai lista de setores
        const setUnicos = [...new Set(listaFormatada.map((e) => e.setor).filter(Boolean))];
        setSetoresDisponiveis(setUnicos);
      } catch (err) {
        console.error("Erro ao carregar presença:", err);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [isAuthorized, eventoId]);

  // 3. Ações de Marcação de Presença
  const handleAlterarStatus = async (escalaId, novoStatus) => {
    setSalvandoId(escalaId);
    try {
      const agora = new Date().toISOString();
      const updatePayload = {
        status_presenca: novoStatus,
      };

      if (novoStatus === "presente") {
        updatePayload.checkin_em = agora;
        updatePayload.checkin_manual = true;
      } else if (novoStatus === "pendente") {
        updatePayload.checkin_em = null;
        updatePayload.checkout_em = null;
        updatePayload.checkin_manual = false;
      }

      const { error } = await supabase
        .from("escalas")
        .update(updatePayload)
        .eq("id", escalaId);

      if (error) throw error;

      setEquipe((prev) =>
        prev.map((e) =>
          e.id === escalaId
            ? {
                ...e,
                status_presenca: novoStatus,
                checkin_em: novoStatus === "presente" ? (e.checkin_em || agora) : null,
                checkin_manual: novoStatus === "presente" ? true : e.checkin_manual,
              }
            : e
        )
      );
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar presença: " + (err.message || "Tente novamente"));
    } finally {
      setSalvandoId(null);
    }
  };

  // 4. Marcar Saída Geral da Equipe (no final do evento)
  const handleDarSaidaGeral = async () => {
    const presentesSemSaida = equipe.filter(
      (e) => (e.status_presenca === "presente" || e.checkin_em) && !e.checkout_em
    );

    if (presentesSemSaida.length === 0) {
      alert("Todos os presentes já registraram saída!");
      return;
    }

    const confirmar = confirm(
      `Deseja registrar o término de turno (saída) para os ${presentesSemSaida.length} colaboradores presentes?`
    );
    if (!confirmar) return;

    setLoading(true);
    try {
      const agora = new Date().toISOString();
      for (const item of presentesSemSaida) {
        await supabase
          .from("escalas")
          .update({ checkout_em: agora })
          .eq("id", item.id);
      }

      setEquipe((prev) =>
        prev.map((e) =>
          (e.status_presenca === "presente" || e.checkin_em) && !e.checkout_em
            ? { ...e, checkout_em: agora }
            : e
        )
      );
      alert("Saída geral registrada com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao dar saída geral.");
    } finally {
      setLoading(false);
    }
  };

  // 5. Marcar Todos Presentes em Lote
  const handleMarcarTodosPresentes = async () => {
    const pendentes = equipe.filter((e) => e.status_presenca !== "presente");
    if (pendentes.length === 0) {
      alert("Todos os membros já estão com presença confirmada.");
      return;
    }

    const confirmar = confirm(
      `Deseja marcar PRESENÇA MANUAL para todos os ${pendentes.length} colaboradores pendentes?`
    );
    if (!confirmar) return;

    setLoading(true);
    try {
      const agora = new Date().toISOString();
      for (const item of pendentes) {
        await supabase
          .from("escalas")
          .update({
            status_presenca: "presente",
            checkin_em: item.checkin_em || agora,
            checkin_manual: true,
          })
          .eq("id", item.id);
      }

      setEquipe((prev) =>
        prev.map((e) => ({
          ...e,
          status_presenca: "presente",
          checkin_em: e.checkin_em || agora,
          checkin_manual: true,
        }))
      );
    } catch (err) {
      console.error(err);
      alert("Erro ao marcar presença em lote.");
    } finally {
      setLoading(false);
    }
  };

  // Métricas
  const total = equipe.length;
  const presentesCount = equipe.filter((e) => e.status_presenca === "presente" || e.checkin_em).length;
  const faltasCount = equipe.filter((e) => e.status_presenca === "falta").length;
  const pendentesCount = total - presentesCount - faltasCount;

  // Filtragem
  const equipeFiltrada = useMemo(() => {
    return equipe.filter((item) => {
      // Filtro de status
      const isPresente = item.status_presenca === "presente" || !!item.checkin_em;
      const isFalta = item.status_presenca === "falta";
      const isPendente = !isPresente && !isFalta;

      if (filtroStatus === "presentes" && !isPresente) return false;
      if (filtroStatus === "faltas" && !isFalta) return false;
      if (filtroStatus === "pendentes" && !isPendente) return false;

      // Filtro de setor
      if (filtroSetor !== "todos" && item.setor !== filtroSetor) return false;

      // Busca por nome
      if (busca.trim()) {
        const nome = (item.perfis?.nome_completo || "").toLowerCase();
        if (!nome.includes(busca.trim().toLowerCase())) return false;
      }

      return true;
    });
  }, [equipe, filtroStatus, filtroSetor, busca]);

  if (loading && equipe.length === 0) {
    return (
      <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center text-neutral-400 font-sans">
        <Loader2 className="animate-spin text-blue-500 mb-3" size={32} />
        <span className="text-sm">Carregando lista de presença...</span>
      </div>
    );
  }

  const voltarUrl = userRole === "admin" || userRole === "owner"
    ? `/admin/eventos/${eventoId}`
    : `/coordenador`;

  return (
    <div className="min-h-screen bg-[#141414] text-neutral-200 font-sans flex flex-col items-center pb-12">
      <div className="w-full max-w-lg min-h-screen flex flex-col bg-[#171717] border-x border-[#282828] relative">
        
        {/* CABEÇALHO FIXO */}
        <div className="sticky top-0 z-20 bg-[#1a1a1a]/95 backdrop-blur-md border-b border-[#2e2e2e] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(voltarUrl)}
              className="text-neutral-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className="text-white font-bold text-[16px] leading-tight flex items-center gap-2">
                Lista de Presença
                <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-mono">
                  AO VIVO
                </span>
              </h1>
              <p className="text-[11px] text-neutral-400 truncate max-w-[220px]">
                {evento?.titulo || "Operação Wadjet"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDarSaidaGeral}
              title="Dar saída em lote para presentes"
              className="text-[11px] bg-[#242424] hover:bg-[#303030] text-amber-300 border border-amber-500/30 px-2.5 py-1.5 rounded font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Clock size={13} />
              <span>Saída Geral</span>
            </button>
          </div>
        </div>

        {/* PAINEL DE MÉTRICAS EM TEMPO REAL */}
        <div className="p-4 bg-[#141414] border-b border-[#242424]">
          <div className="grid grid-cols-3 gap-2">
            <div
              onClick={() => setFiltroStatus(filtroStatus === "presentes" ? "todos" : "presentes")}
              className={`p-2.5 rounded border text-center transition-all cursor-pointer ${
                filtroStatus === "presentes"
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                  : "bg-[#1d1d1d] border-[#2e2e2e] text-neutral-300 hover:border-emerald-500/50"
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center justify-center gap-1">
                <CheckCircle2 size={11} /> Presentes
              </div>
              <div className="text-[18px] font-black text-white mt-0.5">
                {presentesCount} <span className="text-[11px] font-normal text-neutral-500">/ {total}</span>
              </div>
            </div>

            <div
              onClick={() => setFiltroStatus(filtroStatus === "pendentes" ? "todos" : "pendentes")}
              className={`p-2.5 rounded border text-center transition-all cursor-pointer ${
                filtroStatus === "pendentes"
                  ? "bg-amber-500/20 border-amber-500 text-amber-300"
                  : "bg-[#1d1d1d] border-[#2e2e2e] text-neutral-300 hover:border-amber-500/50"
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center justify-center gap-1">
                <Clock size={11} /> Pendentes
              </div>
              <div className="text-[18px] font-black text-white mt-0.5">
                {pendentesCount}
              </div>
            </div>

            <div
              onClick={() => setFiltroStatus(filtroStatus === "faltas" ? "todos" : "faltas")}
              className={`p-2.5 rounded border text-center transition-all cursor-pointer ${
                filtroStatus === "faltas"
                  ? "bg-red-500/20 border-red-500 text-red-300"
                  : "bg-[#1d1d1d] border-[#2e2e2e] text-neutral-300 hover:border-red-500/50"
              }`}
            >
              <div className="text-[10px] uppercase font-bold text-red-400 flex items-center justify-center gap-1">
                <XCircle size={11} /> Faltas
              </div>
              <div className="text-[18px] font-black text-white mt-0.5">
                {faltasCount}
              </div>
            </div>
          </div>

          {/* BARRA DE PESQUISA E SETORES */}
          <div className="mt-3 space-y-2">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-3 text-neutral-500" />
              <input
                type="text"
                placeholder="Buscar segurança por nome..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-[#1c1c1c] border border-[#333] rounded pl-9 pr-3 py-2 text-[13px] text-white placeholder:text-neutral-500 outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {setoresDisponiveis.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-[11px]">
                <button
                  type="button"
                  onClick={() => setFiltroSetor("todos")}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                    filtroSetor === "todos"
                      ? "bg-blue-600 text-white font-bold"
                      : "bg-[#242424] text-neutral-400 hover:text-white"
                  }`}
                >
                  Todos os Setores
                </button>
                {setoresDisponiveis.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFiltroSetor(st)}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                      filtroSetor === st
                        ? "bg-blue-600 text-white font-bold"
                        : "bg-[#242424] text-neutral-400 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* LISTA DA EQUIPE */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {equipeFiltrada.length === 0 ? (
            <div className="py-16 text-center text-neutral-500 text-xs space-y-1">
              <Users size={32} className="mx-auto text-neutral-600 mb-2" />
              <p className="font-semibold text-neutral-400">Nenhum segurança encontrado com esses filtros.</p>
              <p>Tente alterar o status ou a busca.</p>
            </div>
          ) : (
            equipeFiltrada.map((item) => {
              const perfil = item.perfis;
              const isPresente = item.status_presenca === "presente" || !!item.checkin_em;
              const isFalta = item.status_presenca === "falta";
              const salvando = salvandoId === item.id;

              return (
                <div
                  key={item.id}
                  className={`bg-[#1c1c1c] border rounded p-3.5 space-y-3 transition-colors ${
                    isPresente
                      ? "border-emerald-500/40 bg-emerald-950/10"
                      : isFalta
                      ? "border-red-500/40 bg-red-950/10"
                      : "border-[#303030]"
                  }`}
                >
                  {/* Topo do Card do Staff */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Foto de Perfil ou Selfie */}
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full bg-[#2a2a2a] border border-[#3e3e3e] overflow-hidden flex items-center justify-center">
                          {perfil?.foto_url ? (
                            <img
                              src={perfil.foto_url}
                              alt={perfil.nome_completo}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Users size={20} className="text-neutral-500" />
                          )}
                        </div>

                        {/* Indicador se tem selfie enviada */}
                        {item.checkin_foto_url && (
                          <button
                            type="button"
                            onClick={() =>
                              setFotoModal({
                                url: item.checkin_foto_url,
                                nome: perfil?.nome_completo || "Staff",
                                horario: item.checkin_em,
                                lat: item.checkin_lat,
                                lng: item.checkin_lng,
                              })
                            }
                            title="Ver selfie do check-in"
                            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-600 border border-black flex items-center justify-center text-white cursor-pointer shadow"
                          >
                            <Camera size={11} />
                          </button>
                        )}
                      </div>

                      {/* Nome e Dados */}
                      <div className="min-w-0">
                        <h3 className="text-[14px] font-bold text-white truncate leading-snug">
                          {perfil?.nome_completo || "Segurança sem nome"}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-400">
                          <span className="text-blue-400 font-semibold truncate">
                            {item.setor || "Setor Geral"}
                          </span>
                          {perfil?.uniforme && (
                            <span className="flex items-center gap-0.5 text-neutral-400 bg-[#262626] px-1.5 py-0.2 rounded text-[10px]">
                              <Shirt size={10} /> {perfil.uniforme}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Badge de Status */}
                    <div className="shrink-0 text-right">
                      {isPresente ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded">
                          <CheckCircle2 size={11} /> Presente
                        </span>
                      ) : isFalta ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/15 border border-red-500/30 px-2 py-0.5 rounded">
                          <XCircle size={11} /> Falta
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                          <Clock size={11} /> Pendente
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detalhes de Horário e Auditoria (se houver) */}
                  {isPresente && (
                    <div className="bg-[#141414] p-2 rounded border border-[#272727] text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-neutral-300">
                        <span className="text-neutral-500">
                          {item.checkin_manual ? "Chegada (Manual Coordenador):" : "Chegada (Selfie no App):"}
                        </span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {item.checkin_em
                            ? new Date(item.checkin_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                            : "--:--"}
                        </span>
                      </div>

                      {item.checkout_em && (
                        <div className="flex items-center justify-between text-neutral-300 pt-1 border-t border-[#222]">
                          <span className="text-neutral-500">Saída registrada:</span>
                          <span className="font-mono text-blue-400 font-bold">
                            {new Date(item.checkout_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      )}

                      {/* Botão para ver selfie e GPS se existir */}
                      {item.checkin_foto_url && (
                        <div className="pt-1 flex items-center justify-between text-[10px] text-blue-400 border-t border-[#222]">
                          <button
                            type="button"
                            onClick={() =>
                              setFotoModal({
                                url: item.checkin_foto_url,
                                nome: perfil?.nome_completo || "Staff",
                                horario: item.checkin_em,
                                lat: item.checkin_lat,
                                lng: item.checkin_lng,
                              })
                            }
                            className="flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <Camera size={11} />
                            <span>Ver foto do check-in</span>
                          </button>

                          {item.checkin_lat && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${item.checkin_lat},${item.checkin_lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-0.5 text-neutral-400 hover:text-white"
                            >
                              <MapPin size={10} className="text-red-400" />
                              <span>GPS Confirmado</span>
                              <ExternalLink size={9} />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Ações Rápidas de 1 Toque do Coordenador */}
                  <div className="flex items-center gap-2 pt-1">
                    {!isPresente ? (
                      <button
                        type="button"
                        disabled={salvando}
                        onClick={() => handleAlterarStatus(item.id, "presente")}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {salvando ? <Loader2 className="animate-spin" size={14} /> : <UserCheck size={14} />}
                        <span>Confirmar Presença</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={salvando}
                        onClick={() => handleAlterarStatus(item.id, "pendente")}
                        className="flex-1 bg-[#282828] hover:bg-[#333] text-neutral-300 py-2 rounded text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {salvando ? <Loader2 className="animate-spin" size={14} /> : <RotateCcw size={14} />}
                        <span>Desfazer</span>
                      </button>
                    )}

                    {!isFalta ? (
                      <button
                        type="button"
                        disabled={salvando}
                        onClick={() => handleAlterarStatus(item.id, "falta")}
                        className="px-3 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 py-2 rounded text-[12px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <UserX size={14} />
                        <span>Falta</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={salvando}
                        onClick={() => handleAlterarStatus(item.id, "pendente")}
                        className="px-3 bg-[#282828] hover:bg-[#333] text-neutral-300 py-2 rounded text-[12px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <RotateCcw size={14} />
                        <span>Desmarcar Falta</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* BARRA INFERIOR COM AÇÃO EM LOTE */}
        <div className="sticky bottom-0 bg-[#1a1a1a] border-t border-[#2e2e2e] p-3 flex items-center justify-between gap-3">
          <div className="text-[11px] text-neutral-400">
            <span className="font-bold text-white">{presentesCount}</span> de {total} confirmados
          </div>

          <button
            type="button"
            onClick={handleMarcarTodosPresentes}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white py-2 px-3.5 rounded text-[12px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCheck size={15} />
            <span>Confirmar Todos</span>
          </button>
        </div>

      </div>

      {/* MODAL DE AUDITORIA DE SELFIE COM GPS E HORÁRIO */}
      {fotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] border border-[#333] w-full max-w-sm rounded-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-3 bg-[#222] border-b border-[#333] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera size={16} className="text-blue-400" />
                <h4 className="text-white font-bold text-[13px]">Comprovante de Check-in</h4>
              </div>
              <button
                onClick={() => setFotoModal(null)}
                className="text-neutral-400 hover:text-white p-1"
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
                <p className="text-white font-bold">{fotoModal.nome}</p>
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
                    GPS: {fotoModal.lat.toFixed(4)}, {fotoModal.lng.toFixed(4)}
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${fotoModal.lat},${fotoModal.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-400 hover:underline font-bold flex items-center gap-1"
                  >
                    <span>Abrir Mapa</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
