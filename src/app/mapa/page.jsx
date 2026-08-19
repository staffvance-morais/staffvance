"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  ShieldAlert,
  Accessibility,
  Ticket,
  Info,
  Users,
  DoorOpen,
  X,
  ArrowLeft,
  Crosshair,
  Wrench,
  Copy,
  Check,
} from "lucide-react";

export default function MapaTaticoPage() {
  const router = useRouter();
  const [pontoAtivo, setPontoAtivo] = useState(null);

  // ---------- MODO CALIBRAÇÃO ----------
  const [modoCalibracao, setModoCalibracao] = useState(false);
  const [ultimoClique, setUltimoClique] = useState(null);
  const [copiado, setCopiado] = useState(false);

  function handleCliqueCalibracao(e) {
    if (!modoCalibracao) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const leftPct = (((e.clientX - rect.left) / rect.width) * 100).toFixed(1);
    const topPct = (((e.clientY - rect.top) / rect.height) * 100).toFixed(1);
    setUltimoClique({ top: `${topPct}%`, left: `${leftPct}%` });
    setCopiado(false);
  }

  function copiarCoordenada() {
    if (!ultimoClique) return;
    const texto = `top: "${ultimoClique.top}", left: "${ultimoClique.left}",`;
    navigator.clipboard?.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  // ---------- DADOS TÁTICOS — COORDENADAS AJUSTADAS ----------
  const pontosEstrategicos = [
    {
      id: "entrada-principal",
      nome: "Entrada Principal & Revista",
      categoria: "Acesso e Controle",
      top: "82%",
      left: "25%",
      cor: "bg-purple-600",
      icone: <DoorOpen size={18} className="text-white" />,
      detalhes: [
        "Local por onde entram as pessoas com cortesias.",
        "Divisória (isolamento) logo na entrada, com espaços separados para crianças e para a imprensa.",
        "Revista do público realizada logo após a entrada, dividida entre masculino e feminino.",
        "A revista do setor Social também é feita nesse mesmo ponto de entrada.",
        "Listagem para quem não usa cortesia (convidados) fica posicionada perto da entrada, com 1 segurança fixo.",
      ],
    },
    {
      id: "setor-azul",
      nome: "Setor Azul",
      categoria: "Setorização",
      top: "72%",
      left: "40%",
      cor: "bg-blue-600",
      icone: <Ticket size={18} className="text-white" />,
      detalhes: [
        "Localização: Rua Marechal Deodoro (fachada principal/endereço oficial do estádio).",
        "Funciona como portão de emergência e social.",
        "Possui rampa e elevador — acesso designado para PCDs.",
        "Staff atua prioritariamente na recepção, no elevador e na rampa.",
      ],
    },
    {
      id: "setor-vermelho",
      nome: "Setor Vermelho",
      categoria: "Setorização",
      top: "50%",
      left: "20%",
      cor: "bg-red-600",
      icone: <Accessibility size={18} className="text-white" />,
      detalhes: [
        "Localização: Rua Costa Sousa.",
        "Designado oficialmente como Setor Social.",
        "Também atende ao público PCD.",
      ],
    },
    {
      id: "setor-amarelo",
      nome: "Setor Amarelo",
      categoria: "Setorização",
      top: "26%",
      left: "50%",
      cor: "bg-yellow-500",
      icone: <Ticket size={18} className="text-white" />,
      detalhes: [
        "Localização: próximo à Av. dos Expedicionários (lado sul do estádio).",
        "Abriga saída de emergência e o estacionamento social.",
        "Ponto de apoio da ambulância e de uma catraca improvisada.",
        "É onde ocorre o isolamento do 'Sócio Vozão'.",
      ],
    },
    {
      id: "setor-verde",
      nome: "Setor Verde (Ginásio Aécio de Borba)",
      categoria: "Infraestrutura Externa",
      top: "22%",
      left: "82%",
      cor: "bg-green-600",
      icone: <MapPin size={18} className="text-white" />,
      detalhes: [
        "Referenciado internamente pela equipe como 'setor do Laércio'.",
        "Corresponde ao Ginásio Aécio de Borba, ao lado do Instituto Federal de Educação, Ciência e Tecnologia do Ceará.",
      ],
    },
    {
      id: "setor-laranja",
      nome: "Setor Laranja",
      categoria: "Setorização",
      top: "48%",
      left: "76%",
      cor: "bg-orange-500",
      icone: <Info size={18} className="text-white" />,
      detalhes: [
        "Localizado na parte de trás do estádio.",
        "Acesso dificilmente utilizado — fluxo muito baixo nos eventos padrão.",
      ],
    },
    {
      id: "campo",
      nome: "Acesso e Proteção do Campo",
      categoria: "Segurança Nível 1",
      top: "50%",
      left: "48%",
      cor: "bg-zinc-200",
      icone: <ShieldAlert size={18} className="text-zinc-900" />,
      detalhes: [
        "1 segurança fixo posicionado sempre na entrada de acesso ao campo.",
        "4 seguranças em cada ponta/ponto do perímetro do campo.",
      ],
    },
    {
      id: "banheiros",
      nome: "Controle de Banheiros",
      categoria: "Segurança Nível 2",
      top: "68%",
      left: "60%",
      cor: "bg-zinc-200",
      icone: <Users size={18} className="text-zinc-900" />,
      detalhes: [
        "Obrigatório alocar 2 seguranças: 1 para o banheiro feminino e 1 para o masculino.",
      ],
    },
    {
      id: "tribuna",
      nome: "Tribuna e Camarote",
      categoria: "Segurança VIP",
      top: "62%",
      left: "28%",
      cor: "bg-[#1e50cf]",
      icone: <ShieldAlert size={18} className="text-white" />,
      detalhes: [
        "Equipe de segurança dedicada à presença na tribuna.",
        "Controle rigoroso e restrito de acesso ao camarote.",
      ],
    },
  ];

  return (
    <div className="h-screen w-full bg-[#0a0a0a] text-gray-300 font-sans flex flex-col overflow-hidden">
      {/* CABEÇALHO */}
      <div className="px-4 md:px-6 py-4 bg-[#111111] border-b border-[#222] flex justify-between items-center z-30 shadow-md">
        <div className="flex items-center gap-3 md:gap-5">
          <button
            onClick={() => router.push("/admin")}
            className="p-2 bg-[#1a1a1a] border border-[#333] hover:bg-[#222] transition-colors rounded-sm group"
          >
            <ArrowLeft
              size={20}
              className="text-gray-400 group-hover:text-white transition-colors"
              strokeWidth={2}
            />
          </button>

          <div className="flex flex-col">
            <h1 className="text-white font-bold text-sm md:text-lg tracking-widest uppercase flex items-center gap-2">
              <Crosshair size={18} className="text-[#1e50cf] hidden md:block" />
              Painel Tático Operacional
            </h1>
            <span className="text-[#1e50cf] text-[10px] md:text-xs font-semibold tracking-wider">
              ESTÁDIO PRESIDENTE VARGAS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setModoCalibracao((v) => !v);
              setUltimoClique(null);
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-sm border text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors ${
              modoCalibracao
                ? "bg-[#1e50cf] border-[#1e50cf] text-white"
                : "bg-[#1a1a1a] border-[#333] text-gray-400 hover:bg-[#222]"
            }`}
            title="Clique na foto para descobrir o top/left exato de um ponto"
          >
            <Wrench size={14} />
            {modoCalibracao ? "Calibrando" : "Calibrar"}
          </button>

          <div className="w-8 h-8 md:w-10 md:h-10 opacity-60 grayscale">
            <img
              src="/icon.png"
              alt="Logo"
              className="w-full h-full object-contain"
              onError={(e) => (e.target.style.display = "none")}
            />
          </div>
        </div>
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex flex-1 relative bg-[#0a0a0a] overflow-hidden">
        {/* CONTAINER DO MAPA RESPONSIVO */}
        <div
          className={`relative w-full h-full transition-all duration-700 ease-in-out flex flex-col items-center justify-center p-2 md:p-6 ${
            pontoAtivo ? "md:w-2/3 md:pr-4" : "w-full"
          }`}
        >
          {/* Wrapper 16:9 */}
          <div
            onClick={handleCliqueCalibracao}
            className={`relative w-full max-w-6xl aspect-[16/9] bg-[#111] rounded-lg md:rounded-xl overflow-hidden border border-[#222] shadow-[0_0_40px_rgba(0,0,0,0.5)] ${
              modoCalibracao ? "cursor-crosshair" : ""
            }`}
          >
            <img
              src="/Presidente_Vargas_Stadium.jpg"
              alt="Visão Aérea do PV"
              className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
            />

            {/* MARCADORES */}
            {pontosEstrategicos.map((ponto) => (
              <button
                key={ponto.id}
                onClick={(e) => {
                  if (modoCalibracao) return; 
                  e.stopPropagation();
                  setPontoAtivo(ponto);
                }}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 md:w-11 md:h-11 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 z-10 
                  ${ponto.cor} 
                  ${
                    pontoAtivo?.id === ponto.id
                      ? "ring-4 ring-[#1e50cf] ring-opacity-70 scale-125 shadow-[0_0_20px_#1e50cf] z-20"
                      : "border-2 border-white/20 shadow-lg hover:scale-110 hover:border-white/60"
                  }
                `}
                style={{ top: ponto.top, left: ponto.left }}
              >
                {ponto.icone}

                {/* Tooltip */}
                {!pontoAtivo && (
                  <div className="hidden md:block absolute -top-12 bg-[#111] text-gray-200 text-xs font-medium px-3 py-1.5 rounded-sm whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity border border-[#333] shadow-xl pointer-events-none">
                    {ponto.nome}
                  </div>
                )}
              </button>
            ))}

            {/* Marcador temporário do modo calibração */}
            {modoCalibracao && ultimoClique && (
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#1e50cf] z-20 pointer-events-none animate-pulse"
                style={{ top: ultimoClique.top, left: ultimoClique.left }}
              />
            )}
          </div>

          {/* Painel de coordenadas do modo calibração */}
          {modoCalibracao && (
            <div className="mt-3 md:mt-4 flex items-center gap-3 bg-[#111111] border border-[#333] rounded-sm px-4 py-2.5 shadow-xl z-30">
              <Wrench size={14} className="text-[#1e50cf]" />
              {ultimoClique ? (
                <>
                  <code className="text-xs text-gray-300">
                    top: "{ultimoClique.top}", left: "{ultimoClique.left}",
                  </code>
                  <button
                    onClick={copiarCoordenada}
                    className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-gray-400 hover:text-white border border-[#333] hover:border-[#1e50cf] rounded-sm px-2 py-1 transition-colors"
                  >
                    {copiado ? <Check size={12} /> : <Copy size={12} />}
                    {copiado ? "Copiado" : "Copiar"}
                  </button>
                </>
              ) : (
                <span className="text-xs text-gray-500">
                  Clique no ponto certo na foto para gerar o top/left
                </span>
              )}
            </div>
          )}

          {/* Dica para o usuário */}
          {!pontoAtivo && !modoCalibracao && (
            <div className="absolute bottom-6 md:bottom-10 left-1/2 transform -translate-x-1/2 bg-[#111111]/90 backdrop-blur-md px-4 md:px-6 py-2 md:py-3 rounded-full border border-[#333] shadow-2xl animate-pulse">
              <p className="text-gray-300 text-xs md:text-sm font-medium flex items-center gap-2 md:gap-3 tracking-wide whitespace-nowrap">
                <MapPin size={16} className="text-[#1e50cf]" />
                SELECIONE UM SETOR
              </p>
            </div>
          )}
        </div>

        {/* PAINEL LATERAL DE DIRETRIZES */}
        <div
          className={`absolute right-0 top-0 h-full bg-[#111111] border-l border-[#222] shadow-[-10px_0_30px_rgba(0,0,0,0.8)] transition-transform duration-500 ease-in-out overflow-y-auto z-30 
          ${
            pontoAtivo
              ? "translate-x-0 w-full md:w-1/3"
              : "translate-x-full w-full md:w-1/3"
          }`}
        >
          {pontoAtivo && (
            <div className="p-6 md:p-8 h-full flex flex-col">
              <div className="flex justify-between items-start mb-6 md:mb-8">
                <div
                  className={`px-3 py-1.5 rounded-sm text-[10px] md:text-xs font-bold text-white uppercase tracking-widest shadow-sm ${pontoAtivo.cor}`}
                >
                  {pontoAtivo.categoria}
                </div>
                <button
                  onClick={() => setPontoAtivo(null)}
                  className="p-2 bg-[#1a1a1a] border border-[#333] hover:bg-[#222] hover:text-white rounded-sm text-gray-500 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <h3 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight leading-none">
                {pontoAtivo.nome}
              </h3>

              <div className="w-16 h-1.5 bg-[#1e50cf] mb-6 md:mb-8 rounded-full"></div>

              <div className="flex-1">
                <h4 className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-4">
                  Protocolos Operacionais
                </h4>
                <ul className="space-y-3 md:space-y-4">
                  {pontoAtivo.detalhes.map((detalhe, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 md:gap-4 bg-[#181818] border border-[#222] p-4 md:p-5 rounded-sm hover:border-[#333] transition-colors group"
                    >
                      <div className="mt-0.5 text-[#1e50cf] group-hover:scale-110 transition-transform">
                        <ShieldAlert
                          size={16}
                          className="md:w-[18px] md:h-[18px]"
                        />
                      </div>
                      <p className="text-gray-300 text-xs md:text-sm leading-relaxed">
                        {detalhe}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-[#222] text-center">
                <span className="text-[#444] text-[10px] md:text-xs font-semibold uppercase tracking-widest">
                  Wadjet Segurança Integrada
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}