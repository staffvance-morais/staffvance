"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Shield,
  CheckCircle2,
  Map,
  Camera,
  Check,
  CheckCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import HeaderSuperior from "@/components/HeaderSuperior";
import AppNavigation from "@/components/AppNavigation";
import SolidButton from "@/components/SolidButton";
import CameraPontoModal from "@/components/CameraPontoModal";

export default function MinhasEscalas() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [escalas, setEscalas] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const [modalPontoAberto, setModalPontoAberto] = useState(false);
  const [modalPontoTipo, setModalPontoTipo] = useState("checkin");
  const [escalaParaPonto, setEscalaParaPonto] = useState(null);

  const abrirPonto = (escala, tipo) => {
    setEscalaParaPonto(escala);
    setModalPontoTipo(tipo);
    setModalPontoAberto(true);
  };

  useEffect(() => {
    async function fetchMinhasEscalas() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push("/");
          return;
        }

        const { data: perfilData } = await supabase
          .from("perfis")
          .select("*")
          .eq("id", user.id)
          .single();

        setPerfil(perfilData);

        const { data: escalasData, error: escalasError } = await supabase
          .from("escalas")
          .select(`
            id,
            setor,
            status_pagamento,
            status_presenca,
            checkin_em,
            checkin_foto_url,
            checkout_em,
            checkout_foto_url,
            eventos (
              id,
              titulo,
              data_inicio,
              endereco_texto,
              mapa_tatico
            )
          `)
          .eq("staff_id", user.id);

        if (escalasError) throw escalasError;

        if (escalasData) {
          const escalasValidas = escalasData.filter((e) => e.eventos !== null);
          escalasValidas.sort(
            (a, b) =>
              new Date(a.eventos.data_inicio) - new Date(b.eventos.data_inicio)
          );
          setEscalas(escalasValidas);
        }
      } catch (error) {
        console.error("Erro ao carregar escalas:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMinhasEscalas();
  }, [router]);

  const abrirMapaTatico = (eventoId) => {
    router.push(`/mapa?evento=${eventoId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <span className="text-neutral-500 font-medium animate-pulse">
          Carregando eventos...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-300 font-sans flex flex-col justify-between p-4">
      <div className="w-full max-w-sm mx-auto">
        <HeaderSuperior />
      </div>

      <main className="w-full max-w-sm mx-auto flex-1 flex flex-col gap-3 my-4 overflow-y-auto">
        {escalas.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-neutral-700 bg-neutral-800 p-6 text-center gap-3">
            <Calendar className="h-10 w-10 text-neutral-500" />
            <h2 className="text-lg font-semibold text-neutral-200">
              Nenhuma escala programada
            </h2>
            <p className="text-sm text-neutral-400">
              Você ainda não foi escalado para nenhuma operação futura. Quando for selecionado, os detalhes aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {escalas.map((escala, index) => {
              const evento = escala.eventos;
              const isProximo = index === 0;
              const temMapa =
                evento.mapa_tatico === true ||
                evento.endereco_texto?.includes("Presidente Vargas");

              const dataObj = evento.data_inicio
                ? new Date(evento.data_inicio)
                : null;
              const dataExibicao = dataObj
                ? dataObj.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "A definir";
              const horaExibicao = dataObj
                ? dataObj.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "A definir";

              return (
                <div
                  key={escala.id}
                  className={`border-2 bg-neutral-800 p-4 flex flex-col gap-3 transition-colors shadow-lg ${
                    isProximo
                      ? "border-neutral-500"
                      : "border-neutral-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 border-b border-neutral-700 pb-2.5">
                    <div className="overflow-hidden">
                      {isProximo && (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                          Próximo Evento
                        </span>
                      )}
                      <h3 className="truncate text-lg font-bold text-white">
                        {evento.titulo}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 border border-green-600/40 bg-green-950/40 px-2 py-0.5 text-green-400 text-xs font-semibold uppercase">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Confirmado</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 text-sm text-neutral-300">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="h-4 w-4 shrink-0 text-neutral-400" />
                      <span>{dataExibicao}</span>
                      <span className="text-neutral-500">•</span>
                      <Clock className="h-4 w-4 shrink-0 text-neutral-400" />
                      <span>{horaExibicao}</span>
                    </div>

                    <div className="flex items-center gap-2.5 text-neutral-400">
                      <MapPin className="h-4 w-4 shrink-0 text-neutral-400" />
                      <span className="truncate">
                        {evento.endereco_texto || "Local a definir"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Shield className="h-4 w-4 shrink-0 text-neutral-400" />
                      <span>
                        Missão: <strong className="text-white">Setor {escala.setor}</strong>
                      </span>
                    </div>
                  </div>

                  {temMapa && (
                    <SolidButton
                      type="button"
                      onClick={() => abrirMapaTatico(evento.id)}
                      variant="tertiary"
                      icon={Map}
                      className="!h-11 !text-base !font-medium mt-1"
                    >
                      Ver Mapa Tático
                    </SolidButton>
                  )}

                  {/* PONTO ELETRÔNICO DO EVENTO */}
                  <div className="border border-neutral-700 bg-neutral-900/60 p-3 rounded space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-neutral-400 flex items-center gap-1">
                        <Camera size={12} className="text-blue-400" />
                        Ponto Eletrônico
                      </span>
                      {escala.status_presenca === "presente" || escala.checkin_em ? (
                        <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1">
                          <Check size={10} /> Presente
                        </span>
                      ) : (
                        <span className="text-neutral-500 text-[10px]">Aguardando</span>
                      )}
                    </div>

                    {escala.checkin_em && (
                      <div className="text-[11px] bg-neutral-900 p-2 rounded border border-neutral-800 space-y-1">
                        <div className="flex justify-between text-neutral-300">
                          <span className="text-neutral-500">Entrada:</span>
                          <span className="font-mono text-emerald-400 font-bold">
                            {new Date(escala.checkin_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        {escala.checkout_em && (
                          <div className="flex justify-between text-neutral-300 pt-1 border-t border-neutral-800">
                            <span className="text-neutral-500">Saída:</span>
                            <span className="font-mono text-blue-400 font-bold">
                              {new Date(escala.checkout_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {!escala.checkin_em ? (
                      <button
                        type="button"
                        onClick={() => abrirPonto(escala, "checkin")}
                        className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white py-2 rounded text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Camera size={14} />
                        <span>Confirmar Chegada (Selfie)</span>
                      </button>
                    ) : !escala.checkout_em ? (
                      <button
                        type="button"
                        onClick={() => abrirPonto(escala, "checkout")}
                        className="w-full bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 py-2 rounded text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Clock size={14} />
                        <span>Registrar Saída</span>
                      </button>
                    ) : (
                      <div className="text-center py-0.5 text-[11px] text-neutral-400 flex items-center justify-center gap-1">
                        <CheckCheck size={13} className="text-emerald-400" />
                        <span>Presença finalizada</span>
                      </div>
                    )}
                  </div>

                  {escala.status_pagamento && (
                    <div className="border border-green-600/30 bg-green-950/30 px-3 py-1 text-center text-xs font-bold uppercase text-green-400">
                      Pagamento Liberado
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <AppNavigation userProfile={perfil} userRole="staff" />

      {/* MODAL DE PONTO */}
      <CameraPontoModal
        isOpen={modalPontoAberto}
        onClose={() => setModalPontoAberto(false)}
        escalaId={escalaParaPonto?.id}
        eventoTitulo={escalaParaPonto?.eventos?.titulo}
        tipo={modalPontoTipo}
        onSucesso={(res) => {
          setEscalas((prev) =>
            prev.map((e) =>
              e.id === escalaParaPonto?.id
                ? {
                    ...e,
                    status_presenca: "presente",
                    checkin_em: modalPontoTipo === "checkin" ? res.horario : e.checkin_em,
                    checkout_em: modalPontoTipo === "checkout" ? res.horario : e.checkout_em,
                    checkin_foto_url: modalPontoTipo === "checkin" ? res.fotoUrl : e.checkin_foto_url,
                    checkout_foto_url: modalPontoTipo === "checkout" ? res.fotoUrl : e.checkout_foto_url,
                  }
                : e
            )
          );
        }}
      />
    </div>
  );
}