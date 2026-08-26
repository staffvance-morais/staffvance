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
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import HeaderSuperior from "@/components/HeaderSuperior";
import AppNavigation from "@/components/AppNavigation";
import SolidButton from "@/components/SolidButton";

export default function MinhasEscalas() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [escalas, setEscalas] = useState([]);
  const [perfil, setPerfil] = useState(null);

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
    </div>
  );
}