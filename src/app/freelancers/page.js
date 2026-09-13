"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Shield,
  Wallet,
  CheckCircle2,
  Map,
  Shirt,
  Copy,
  Check,
  Camera,
  CheckCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import HeaderSuperior from "@/components/HeaderSuperior";
import AppNavigation from "@/components/AppNavigation";
import CameraPontoModal from "@/components/CameraPontoModal";

export default function DashboardFreelancer() {
  const router = useRouter();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  const [minhasEscalas, setMinhasEscalas] = useState([]);
  const [proximaEscala, setProximaEscala] = useState(null);
  const [totalPendente, setTotalPendente] = useState(0);
  const [totalPago, setTotalPago] = useState(0);
  const [pixCopiado, setPixCopiado] = useState(false);
  const [pontoModalAberto, setPontoModalAberto] = useState(false);
  const [pontoTipo, setPontoTipo] = useState("checkin");

  const abrirModalPonto = (tipo) => {
    setPontoTipo(tipo);
    setPontoModalAberto(true);
  };

  useEffect(() => {
    async function carregarDashboardStaff() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push("/");
          return;
        }

        const { data: perfilData, error: perfilError } = await supabase
          .from("perfis")
          .select("*")
          .eq("id", user.id)
          .single();

        if (perfilError) throw perfilError;
        setPerfil(perfilData);

        const { data: escalasData, error: escalasError } = await supabase
          .from("escalas")
          .select(`
            id,
            setor,
            valor_pago,
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
              mapa_tatico,
              valor_diaria
            )
          `)
          .eq("staff_id", user.id);

        if (escalasError) throw escalasError;

        if (escalasData) {
          const validas = escalasData.filter((e) => e.eventos !== null);

          validas.sort(
            (a, b) => new Date(a.eventos.data_inicio) - new Date(b.eventos.data_inicio)
          );

          setMinhasEscalas(validas);

          let pendente = 0;
          let pago = 0;

          validas.forEach((e) => {
            const valor = parseFloat(e.valor_pago) || parseFloat(e.eventos?.valor_diaria) || 0;
            if (e.status_pagamento) {
              pago += valor;
            } else {
              pendente += valor;
            }
          });

          setTotalPendente(pendente);
          setTotalPago(pago);

          const agora = new Date();
          const futuras = validas.filter(
            (e) => e.eventos.data_inicio && new Date(e.eventos.data_inicio) >= agora
          );

          setProximaEscala(futuras.length > 0 ? futuras[0] : validas[0] || null);
        }
      } catch (error) {
        console.error("Erro dashboard staff:", error);
      } finally {
        setLoading(false);
      }
    }

    carregarDashboardStaff();
  }, [router]);

  const copiarMinhaChavePix = () => {
    if (!perfil?.chave_pix) return;
    navigator.clipboard.writeText(perfil.chave_pix);
    setPixCopiado(true);
    setTimeout(() => setPixCopiado(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <span className="text-neutral-500 font-medium animate-pulse text-sm">
          Carregando sua escala...
        </span>
      </div>
    );
  }

  const primeiroNome = perfil?.nome_completo?.split(" ")[0] || "Colaborador";

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
              Minha escala e diárias
            </p>
          </div>
          {perfil?.uniforme && (
            <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 flex items-center gap-1">
              <Shirt size={11} /> {perfil.uniforme.toUpperCase()}
            </span>
          )}
        </div>

        {/* VALORES PESSOAIS COMPACTOS */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#1f1f1f] border border-[#333] p-2.5 rounded text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              A Receber
            </span>
            <div className="text-[16px] font-black text-amber-400 mt-0.5">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalPendente)}
            </div>
          </div>

          <div className="bg-[#1f1f1f] border border-[#333] p-2.5 rounded text-center">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Recebido (Pix)
            </span>
            <div className="text-[16px] font-black text-emerald-400 mt-0.5">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalPago)}
            </div>
          </div>
        </div>

        {/* PRÓXIMA ESCALA */}
        <div className="bg-[#1f1f1f] border border-[#333] rounded-sm p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#2e2e2e] pb-2">
            <span className="flex items-center gap-1.5 text-blue-400 text-[11px] font-bold uppercase tracking-wider">
              <Shield size={13} />
              <span>Minha Próxima Operação</span>
            </span>
            {proximaEscala && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                  proximaEscala.status_pagamento
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}
              >
                {proximaEscala.status_pagamento ? "Paga ✅" : "Pendente ⏳"}
              </span>
            )}
          </div>

          {proximaEscala ? (
            <div className="space-y-3">
              <div>
                <h3 className="text-[16px] font-bold text-white leading-snug">
                  {proximaEscala.eventos?.titulo}
                </h3>
                <div className="mt-1.5 inline-flex items-center gap-1.5 bg-[#2563eb]/15 border border-[#2563eb]/30 text-blue-300 px-2 py-0.5 rounded text-[11px] font-bold">
                  <Shield size={12} className="text-blue-400" />
                  <span>Setor: {proximaEscala.setor || "Geral"}</span>
                </div>
              </div>

              <div className="space-y-1 text-[11px] bg-[#161616] p-2.5 rounded border border-[#2b2b2b]">
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <Calendar size={12} className="text-blue-400 shrink-0" />
                  <span>
                    {proximaEscala.eventos?.data_inicio
                      ? new Date(proximaEscala.eventos.data_inicio).toLocaleDateString("pt-BR")
                      : "Data a definir"}
                  </span>
                </div>
                {proximaEscala.eventos?.endereco_texto && (
                  <div className="flex items-start gap-1.5 text-neutral-400 pt-1 border-t border-[#262626]">
                    <MapPin size={12} className="text-red-400 shrink-0 mt-0.5" />
                    <span className="leading-tight truncate">
                      {proximaEscala.eventos.endereco_texto}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                {proximaEscala.eventos?.endereco_texto && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      proximaEscala.eventos.endereco_texto
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#262626] hover:bg-[#333] text-neutral-200 border border-[#444] py-2 px-3 rounded text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MapPin size={13} className="text-red-400" />
                    <span>Como Chegar</span>
                  </a>
                )}
                <button
                  onClick={() => router.push(`/mapa?evento=${proximaEscala.eventos?.id}`)}
                  className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white py-2 px-3 rounded text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Map size={13} />
                  <span>Mapa</span>
                </button>
              </div>

              {/* PONTO ELETRÔNICO / CONFIRMAÇÃO DE PRESENÇA */}
              <div className="bg-[#181818] border border-[#333] rounded p-3 space-y-2.5 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                    <Camera size={13} className="text-blue-400" />
                    <span>Ponto da Operação</span>
                  </span>
                  {proximaEscala.status_presenca === "presente" || proximaEscala.checkin_em ? (
                    <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                      <Check size={11} /> Presente
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold">
                      Pendente
                    </span>
                  )}
                </div>

                {/* Status de Horários */}
                {proximaEscala.checkin_em && (
                  <div className="text-[11px] bg-[#121212] p-2 rounded border border-[#262626] space-y-1">
                    <div className="flex items-center justify-between text-neutral-300">
                      <span className="text-neutral-500">Entrada (Selfie):</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {new Date(proximaEscala.checkin_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {proximaEscala.checkout_em && (
                      <div className="flex items-center justify-between text-neutral-300 pt-1 border-t border-[#222]">
                        <span className="text-neutral-500">Saída:</span>
                        <span className="font-mono text-blue-400 font-bold">
                          {new Date(proximaEscala.checkout_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Botões do Ponto */}
                {!proximaEscala.checkin_em ? (
                  <button
                    type="button"
                    onClick={() => abrirModalPonto("checkin")}
                    className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white py-2.5 px-3 rounded text-[12px] font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
                  >
                    <Camera size={15} />
                    <span>Bater Ponto / Confirmar Chegada</span>
                  </button>
                ) : !proximaEscala.checkout_em ? (
                  <button
                    type="button"
                    onClick={() => abrirModalPonto("checkout")}
                    className="w-full bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 py-2.5 px-3 rounded text-[12px] font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Clock size={15} />
                    <span>Registrar Saída do Evento</span>
                  </button>
                ) : (
                  <div className="text-center py-1 text-[11px] text-neutral-400 font-medium flex items-center justify-center gap-1">
                    <CheckCheck size={14} className="text-emerald-400" />
                    <span>Presença e turno concluídos com sucesso!</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-neutral-500 text-xs">
              <p>Nenhuma escala ativa no momento.</p>
              <p className="text-[10px] text-neutral-600 mt-1">
                Você será notificado por e-mail quando for escalado.
              </p>
            </div>
          )}
        </div>

        {/* CHAVE PIX DISCRETA */}
        {perfil?.chave_pix && (
          <div className="bg-[#1a1a1a] border border-[#2b2b2b] p-2.5 rounded flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-neutral-400 min-w-0">
              <Wallet size={12} className="text-emerald-400 shrink-0" />
              <span className="font-semibold">Pix:</span>
              <span className="text-neutral-300 truncate font-mono text-[10px]">
                {perfil.chave_pix}
              </span>
            </div>
            <button
              onClick={copiarMinhaChavePix}
              className="px-2 py-0.5 bg-[#262626] hover:bg-[#333] text-neutral-300 text-[10px] font-bold rounded flex items-center gap-1 shrink-0 cursor-pointer"
            >
              {pixCopiado ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
              <span>{pixCopiado ? "Copiado!" : "Copiar"}</span>
            </button>
          </div>
        )}

        {/* MENU INFERIOR */}
        <AppNavigation userProfile={perfil} userRole="staff" />

        {/* MODAL DE CÂMERA E PONTO */}
        <CameraPontoModal
          isOpen={pontoModalAberto}
          onClose={() => setPontoModalAberto(false)}
          escalaId={proximaEscala?.id}
          eventoTitulo={proximaEscala?.eventos?.titulo}
          tipo={pontoTipo}
          onSucesso={(res) => {
            setProximaEscala((prev) => ({
              ...prev,
              status_presenca: "presente",
              checkin_em: pontoTipo === "checkin" ? res.horario : prev?.checkin_em,
              checkout_em: pontoTipo === "checkout" ? res.horario : prev?.checkout_em,
              checkin_foto_url: pontoTipo === "checkin" ? res.fotoUrl : prev?.checkin_foto_url,
              checkout_foto_url: pontoTipo === "checkout" ? res.fotoUrl : prev?.checkout_foto_url,
            }));
          }}
        />
      </div>
    </div>
  );
}