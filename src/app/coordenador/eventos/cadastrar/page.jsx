"use client";
import { supabase } from "@/lib/supabase";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import {
  CalendarDays,
  ChevronRight,
  Handshake,
  Search,
  MapPin,
  ChevronDown,
  ChevronUp,
  Plus,
  Clock,
  ImagePlus,
  Menu,
  Loader2
} from "lucide-react";


const STORAGE_BUCKET = "eventos-fotos";

export default function CadastrarEventoCoordenador() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  // Estados dos campos principais
  const [titulo, setTitulo] = useState("");
  const [contratante, setContratante] = useState("");
  const [clienteId, setClienteId] = useState(null);
  const [dataOperacao, setDataOperacao] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaTermino, setHoraTermino] = useState("");

  // Estados dos Menus Expansíveis
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Estados da Localização
  const [localSelecionado, setLocalSelecionado] = useState("");
  const [customLocalName, setCustomLocalName] = useState("");
  
  // Imagem do Evento/Local visível para todos os locais
  const [fotoUrl, setFotoUrl] = useState("");

  const [clientes, setClientes] = useState([]);
  const [carregandoClientes, setCarregandoClientes] = useState(false);

  const locaisDeFabrica = [
    { nome: "Estádio Presidente Vargas", tatico: true },
    { nome: "Estádio Carlos de Alencar Pinto", tatico: false },
    { nome: "Ginásio Aécio de Borba", tatico: false },
    { nome: "Cidade Vozão", tatico: false }
  ];

  const [locais, setLocais] = useState(locaisDeFabrica);
  const [carregandoLocais, setCarregandoLocais] = useState(false);

  useEffect(() => {
    if (showClientDropdown && clientes.length === 0) {
      buscarClientes();
    }
  }, [showClientDropdown]);

  const buscarClientes = async () => {
    setCarregandoClientes(true);
    try {
      const { data } = await supabase
        .from("clientes")
        .select("id, representante, empresa")
        .order("representante", { ascending: true });
      if (data) setClientes(data);
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setCarregandoClientes(false);
    }
  };

  const handleSelecionarCliente = (cliente) => {
    const nomeExibicao = cliente.empresa 
      ? `${cliente.representante} (${cliente.empresa})` 
      : cliente.representante;
    setContratante(nomeExibicao);
    setClienteId(cliente.id);
    setShowClientDropdown(false);
  };

  useEffect(() => {
    if (showLocationDropdown && locais.length === locaisDeFabrica.length) {
      buscarLocaisSalvos();
    }
  }, [showLocationDropdown]);

  const buscarLocaisSalvos = async () => {
    setCarregandoLocais(true);
    try {
      const { data } = await supabase.from("eventos").select("endereco_texto");
      if (data) {
        const todosNomes = data.map((e) => e.endereco_texto?.trim()).filter(Boolean);
        const locaisMap = new Map();
        todosNomes.forEach(nome => {
          const key = nome.toLowerCase();
          if (!locaisMap.has(key)) locaisMap.set(key, nome);
        });
        const nomesUnicos = Array.from(locaisMap.values());
        const nomesNovos = nomesUnicos.filter((novoNome) => {
          return !locaisDeFabrica.some((fabrica) => fabrica.nome.toLowerCase() === novoNome.toLowerCase());
        });
        const locaisExtras = nomesNovos.map((nome) => ({ nome: nome, tatico: false }));
        setLocais([...locaisDeFabrica, ...locaisExtras]);
      }
    } catch (err) {
      console.error("Erro:", err);
    } finally {
      setCarregandoLocais(false);
    }
  };

  const handleUploadFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEnviandoFoto(true);
    try {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: false };
      const compressedFile = await imageCompression(file, options);

      const extensao = (compressedFile.name || file.name || "jpg").split(".").pop();
      const nomeArquivo = `locais/${Date.now()}.${extensao}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(nomeArquivo, compressedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(nomeArquivo);

      setFotoUrl(publicUrlData.publicUrl);
    } catch (error) {
      console.error("Erro ao comprimir e enviar imagem:", error);
      alert("Erro ao enviar imagem. Verifique se o bucket 'eventos-fotos' existe no Supabase.");
    } finally {
      setEnviandoFoto(false);
    }
  };

  const handleSalvar = async () => {
    if (!titulo || !dataOperacao || !horaInicio) {
      alert("Preencha pelo menos o Título, Data e Início da operação.");
      return;
    }

    setSalvando(true);

    try {
      const dataInicioCompleta = new Date(`${dataOperacao}T${horaInicio}:00`).toISOString();
      const dataFimCompleta = horaTermino ? new Date(`${dataOperacao}T${horaTermino}:00`).toISOString() : null;

      const enderecoFinal = localSelecionado === "Outro (Personalizar)" ? customLocalName : localSelecionado;
      const possuiMapaTatico = localSelecionado === "Estádio Presidente Vargas";

      const { data, error } = await supabase
        .from("eventos")
        .insert([
          {
            titulo: titulo,
            cliente_id: clienteId,
            nome_contratante: contratante,
            endereco_texto: enderecoFinal,
            data_inicio: dataInicioCompleta,
            data_fim: dataFimCompleta,
            foto_local: fotoUrl || null,
            mapa_tatico: possuiMapaTatico
          }
        ])
        .select()
        .single();

      if (error) throw error;

      router.push(`/coordenador/eventos/${data.id}/escalar`);
    } catch (error) {
      console.error("ERRO COMPLETO:", error);
      alert("Erro do banco de dados: " + (error.message || "Erro desconhecido"));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#171717] font-sans flex flex-col items-center pb-10">
      <div className="w-full max-w-[400px] min-h-screen flex flex-col bg-[#171717] relative">

        <div className="flex items-center gap-2 p-4 text-[#aaa] text-[14px] border-b border-[#333333]">
          <CalendarDays size={18} />
          <span>Eventos</span>
          <ChevronRight size={16} />
          <span className="text-[#e5e5e5]">Cadastrar evento</span>
        </div>

        <div className="flex-1 overflow-y-auto pb-[100px] custom-scrollbar">

          {/* FOTO DO EVENTO / LOCAL */}
          <h2 className="text-[#e5e5e5] text-[18px] font-bold px-4 pt-5 pb-3">Foto do Evento</h2>
          <div className="mx-4 mb-4">
            <div className="w-full h-[150px] bg-[#222] relative rounded-sm overflow-hidden flex items-center justify-center border border-[#444]">
              {fotoUrl ? (
                <img src={fotoUrl} alt="Foto do Evento" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-[#777] gap-1">
                  <ImagePlus size={28} />
                  <span className="text-[12px]">Adicionar foto de capa do evento</span>
                </div>
              )}

              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleUploadFoto} className="hidden" />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={enviandoFoto}
                className="absolute bottom-2 right-2 bg-[#2563eb] px-3 py-2 flex items-center gap-1.5 text-white text-xs font-semibold cursor-pointer hover:bg-[#1d4ed8] rounded-sm transition-colors shadow-md"
              >
                {enviandoFoto ? <Loader2 className="animate-spin" size={16} /> : <ImagePlus size={16} />}
                {fotoUrl ? "Alterar Foto" : "Enviar Foto"}
              </button>
            </div>
          </div>

          {/* DADOS DO EVENTO */}
          <h2 className="text-[#e5e5e5] text-[18px] font-bold px-4 pt-2 pb-3">Dados do Evento</h2>

          <div className="mx-4 flex flex-col bg-[#222222] border border-[#444] rounded-sm">

            {/* Título */}
            <div className="flex items-center gap-3 p-3.5 border-b border-[#444]">
              <CalendarDays size={20} className="text-[#777] shrink-0" />
              <input
                type="text"
                placeholder="Título do Evento"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="bg-transparent w-full outline-none text-[#e5e5e5] placeholder:text-[#999] text-[16px]"
              />
            </div>

            {/* Contratante */}
            <div>
              <div
                onClick={() => setShowClientDropdown(!showClientDropdown)}
                className="flex items-center justify-between p-3.5 border-b border-[#444] cursor-pointer bg-[#222222]"
              >
                <div className="flex items-center gap-3">
                  <Handshake size={20} className="text-[#777]" />
                  <span className={contratante ? "text-[#e5e5e5] text-[16px]" : "text-[#999] text-[16px]"}>
                    {contratante || "Contratante"}
                  </span>
                </div>
                <Search size={20} className="text-[#777]" />
              </div>

              {showClientDropdown && (
                <div className="bg-[#1a1a1a] border-b border-[#444] flex flex-col shadow-inner">
                  {carregandoClientes && (
                    <div className="p-3.5 flex items-center gap-2 text-[#999] text-sm">
                      <Loader2 className="animate-spin" size={16} /> Carregando contratantes...
                    </div>
                  )}

                  {!carregandoClientes && clientes.length > 0 &&
                    clientes.map((cliente) => (
                      <div
                        key={cliente.id}
                        onClick={() => handleSelecionarCliente(cliente)}
                        className="p-3.5 text-[#e5e5e5] border-b border-[#333] hover:bg-[#333] cursor-pointer text-[15px] flex items-center justify-between"
                      >
                        <span>{cliente.representante}</span>
                        {cliente.empresa && (
                          <span className="text-[#888] text-[13px] font-normal">{cliente.empresa}</span>
                        )}
                      </div>
                    ))}

                  <div
                    onClick={() => router.push("/coordenador/clientes/cadastrar")}
                    className="p-3.5 flex items-center justify-between text-[#ccc] font-bold hover:bg-[#333] cursor-pointer text-[15px]"
                  >
                    Cadastrar novo
                    <Plus size={20} className="text-[#ccc]" />
                  </div>
                </div>
              )}
            </div>

            {/* Localização */}
            <div>
              <div
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                className="flex items-center justify-between p-3.5 cursor-pointer bg-[#222222]"
              >
                <div className="flex items-center gap-3">
                  <MapPin size={20} className="text-[#777]" />
                  <span className={localSelecionado ? "text-[#e5e5e5] text-[16px]" : "text-[#999] text-[16px]"}>
                    {localSelecionado || "Localização"}
                  </span>
                </div>
                {showLocationDropdown ? <ChevronUp size={20} className="text-[#777]" /> : <ChevronDown size={20} className="text-[#777]" />}
              </div>

              {showLocationDropdown && (
                <div className="bg-[#1a1a1a] border-t border-[#444] flex flex-col shadow-inner">
                  {carregandoLocais && (
                    <div className="p-3.5 flex items-center gap-2 text-[#999] text-[13px]">
                      <Loader2 className="animate-spin" size={14} /> Buscando locais...
                    </div>
                  )}

                  {locais.map((loc, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setLocalSelecionado(loc.nome);
                        setShowLocationDropdown(false);
                      }}
                      className="p-3.5 border-b border-[#333] hover:bg-[#333] cursor-pointer flex flex-col"
                    >
                      <span className="text-[#e5e5e5] text-[15px]">{loc.nome}</span>
                      {loc.tatico && (
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold tracking-widest text-[#999]">
                          <div className="w-2 h-2 bg-[#16a34a] rounded-sm"></div> POSSUI MAPA TÁTICO
                        </div>
                      )}
                    </div>
                  ))}

                  <div
                    onClick={() => setLocalSelecionado("Outro (Personalizar)")}
                    className="p-3.5 border-b border-[#333] text-[#e5e5e5] hover:bg-[#333] cursor-pointer text-[15px]"
                  >
                    Outro (Personalizar)
                  </div>

                  {localSelecionado === "Outro (Personalizar)" && (
                    <div className="p-3.5 flex flex-col gap-3 bg-[#111111]">
                      <input
                        type="text"
                        placeholder="Nome do Novo Local"
                        value={customLocalName}
                        onChange={(e) => setCustomLocalName(e.target.value)}
                        className="bg-[#2a2a2a] border border-[#444] text-[#e5e5e5] p-3 rounded-sm outline-none w-full placeholder:text-[#999] text-[15px]"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* DATA E HORÁRIO */}
          <h2 className="text-[#e5e5e5] text-[18px] font-bold px-4 pt-6 pb-3">Data e Horário</h2>

          <div className="mx-4 flex flex-col bg-[#222222] border border-[#444] rounded-sm">
            <div className="relative flex items-center gap-3 p-3.5 border-b border-[#444]">
              <CalendarDays size={20} className="text-[#777] shrink-0" />
              {!dataOperacao && <span className="text-[#999] pointer-events-none absolute left-11 text-[16px]">Data da operação</span>}
              <input
                type="date"
                value={dataOperacao}
                onChange={(e) => setDataOperacao(e.target.value)}
                className={`bg-transparent w-full outline-none text-[16px] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer ${dataOperacao ? "text-[#e5e5e5]" : "text-transparent"}`}
              />
            </div>

            <div className="relative flex items-center gap-3 p-3.5 border-b border-[#444]">
              <Clock size={20} className="text-[#777] shrink-0" />
              {!horaInicio && <span className="text-[#999] pointer-events-none absolute left-11 text-[16px]">Início</span>}
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className={`bg-transparent w-full outline-none text-[16px] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer ${horaInicio ? "text-[#e5e5e5]" : "text-transparent"}`}
              />
            </div>

            <div className="relative flex items-center gap-3 p-3.5">
              <Clock size={20} className="text-[#777] rotate-180 shrink-0" />
              {!horaTermino && <span className="text-[#999] pointer-events-none absolute left-11 text-[16px]">Término</span>}
              <input
                type="time"
                value={horaTermino}
                onChange={(e) => setHoraTermino(e.target.value)}
                className={`bg-transparent w-full outline-none text-[16px] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer ${horaTermino ? "text-[#e5e5e5]" : "text-transparent"}`}
              />
            </div>
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="px-4 pt-6 pb-4 flex flex-col gap-3">
            <button
              onClick={handleSalvar}
              disabled={salvando}
              className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-bold py-4 rounded-sm flex justify-center items-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
            >
              {salvando ? <Loader2 className="animate-spin" size={20} /> : null}
              {salvando ? "Salvando..." : "Salvar e Escalar"}
            </button>

            <button
              onClick={() => router.push("/coordenador/eventos")}
              className="w-full bg-[#333333] hover:bg-[#444444] text-[#ccc] font-semibold py-3.5 rounded-sm transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>

        </div>

        {/* RODAPÉ */}
        <div className="absolute bottom-0 w-full p-4 bg-[#171717] border-t border-[#2a2a2a]">
          <div className="flex items-stretch justify-between border border-[#3a3a3a] bg-[#1a1a1a] rounded-sm overflow-hidden h-[60px]">
            <div className="w-16 flex items-center justify-center opacity-30">
              <img
                src="/icon.png"
                alt="Wadjet Logo"
                className="w-8 h-8 object-contain grayscale"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            </div>

            <button
              onClick={() => router.push("/coordenador")}
              className="w-[60px] border-l border-[#3a3a3a] flex items-center justify-center text-[#777] bg-[#222] hover:bg-[#2a2a2a] transition-colors cursor-pointer"
            >
              <Menu size={32} strokeWidth={1.5} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}