"use client";
import { supabase } from "@/lib/supabase";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  Loader2,
  Image as ImageIcon
} from "lucide-react";

// Conexão com o Supabase

const STORAGE_BUCKET = "eventos-fotos";

// ==========================================
// FUNÇÃO DE COMPRESSÃO DE IMAGEM
// ==========================================
const compactarImagem = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          0.7 
        );
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function CadastrarEvento() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [salvando, setSalvando] = useState(false);

  // Estados dos campos principais
  const [titulo, setTitulo] = useState("");
  const [contratante, setContratante] = useState("");
  const [clienteId, setClienteId] = useState(null);
  const [dataOperacao, setDataOperacao] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaTermino, setHoraTermino] = useState("");

  // Estados da Capa do Evento
  const [fotoPreview, setFotoPreview] = useState("");
  const [fotoUpload, setFotoUpload] = useState(null);
  const [comprimindo, setComprimindo] = useState(false);

  // Estados dos Menus Expansíveis
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // Estados da Localização
  const [localSelecionado, setLocalSelecionado] = useState("");
  const [customLocalName, setCustomLocalName] = useState("");

  // Estados Dinâmicos do Banco
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

  // ----------------------------------------------------
  // BUSCA CLIENTES
  // ----------------------------------------------------
  useEffect(() => {
    if (showClientDropdown && clientes.length === 0) {
      buscarClientes();
    }
  }, [showClientDropdown]);

  const buscarClientes = async () => {
    setCarregandoClientes(true);
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, representante, empresa")
        .order("representante", { ascending: true });

      if (error) {
        console.error("Erro ao buscar clientes:", error);
      }

      if (data) {
        setClientes(data);
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
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

  // ----------------------------------------------------
  // BUSCA LOCAIS DINÂMICOS
  // ----------------------------------------------------
  useEffect(() => {
    if (showLocationDropdown && locais.length === locaisDeFabrica.length) {
      buscarLocaisSalvos();
    }
  }, [showLocationDropdown]);

  const buscarLocaisSalvos = async () => {
    setCarregandoLocais(true);
    try {
      const { data, error } = await supabase.from("eventos").select("endereco_texto");

      if (data && !error) {
        const todosNomes = data.map((e) => e.endereco_texto?.trim()).filter(Boolean);
        const locaisMap = new Map();
        
        todosNomes.forEach(nome => {
          const key = nome.toLowerCase();
          if (!locaisMap.has(key)) {
            locaisMap.set(key, nome);
          }
        });
        const nomesUnicos = Array.from(locaisMap.values());

        const nomesNovos = nomesUnicos.filter((novoNome) => {
          const novoNomeLower = novoNome.toLowerCase();
          return !locaisDeFabrica.some((fabrica) => fabrica.nome.toLowerCase() === novoNomeLower);
        });

        const locaisExtras = nomesNovos.map((nome) => ({ nome: nome, tatico: false }));
        setLocais([...locaisDeFabrica, ...locaisExtras]);
      }
    } catch (err) {
      console.error("Erro ao buscar locais:", err);
    } finally {
      setCarregandoLocais(false);
    }
  };

  // ----------------------------------------------------
  // MANIPULAÇÃO DA CAPA DO EVENTO E MÁSCARAS
  // ----------------------------------------------------
  const selecionarFotoPublic = (caminho) => {
    setFotoPreview(caminho);
    setFotoUpload(null); 
  };

  const handleUploadFoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setComprimindo(true);
    try {
      const arquivoComprimido = await compactarImagem(file);
      setFotoUpload(arquivoComprimido);
      setFotoPreview(URL.createObjectURL(arquivoComprimido)); 
    } catch (error) {
      console.error("Erro na compactação:", error);
      alert("Erro ao processar a imagem.");
    } finally {
      setComprimindo(false);
    }
  };

  const formatarData = (valor) => {
    return valor
      .replace(/\D/g, "") 
      .replace(/(\d{2})(\d)/, "$1/$2") 
      .replace(/(\d{2})(\d)/, "$1/$2") 
      .replace(/(\d{4})\d+?$/, "$1");
  };

  const formatarHora = (valor) => {
    return valor
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1:$2")
      .replace(/(\d{2})\d+?$/, "$1");
  };

  // ----------------------------------------------------
  // SALVAR NOVO EVENTO
  // ----------------------------------------------------
  const handleSalvar = async () => {
    // Validação de preenchimento correto
    if (!titulo || dataOperacao.length !== 10 || horaInicio.length !== 5) {
      alert("Preencha o Título, Data da operação (DD/MM/AAAA) e Início (HH:MM) corretamente.");
      return;
    }

    setSalvando(true);

    try {
      let urlFinalDaFoto = fotoPreview; 

      if (fotoUpload) {
        const extensao = fotoUpload.name.split(".").pop() || "jpg";
        const nomeArquivo = `capas/${Date.now()}.${extensao}`;

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(nomeArquivo, fotoUpload, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(nomeArquivo);

        urlFinalDaFoto = publicUrlData.publicUrl;
      }

      // Converte DD/MM/AAAA para AAAA-MM-DD para o banco de dados
      const [dia, mes, ano] = dataOperacao.split("/");
      const dataIso = `${ano}-${mes}-${dia}`;

      const dataInicioCompleta = new Date(`${dataIso}T${horaInicio}:00`).toISOString();
      const dataFimCompleta = horaTermino?.length === 5 ? new Date(`${dataIso}T${horaTermino}:00`).toISOString() : null;
      
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
            foto_local: urlFinalDaFoto || null,
            mapa_tatico: possuiMapaTatico
          }
        ])
        .select()
        .single();

      if (error) throw error;

      router.push(`/admin/eventos/${data.id}/escalar`);
    } catch (error) {
      console.error(error);
      alert("Erro ao cadastrar. Verifique os dados.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#171717] font-sans flex flex-col items-center pb-10">
      <div className="w-full max-w-[400px] min-h-screen flex flex-col bg-[#171717] relative">

        {/* BREADCRUMB */}
        <div className="flex items-center gap-2 p-4 text-[#aaa] text-[14px] border-b border-[#333333]">
          <CalendarDays size={18} />
          <span>Eventos</span>
          <ChevronRight size={16} />
          <span className="text-[#e5e5e5]">Cadastrar evento</span>
        </div>

        <div className="flex-1 overflow-y-auto pb-[100px] custom-scrollbar">

          {/* DADOS DO EVENTO */}
          <h2 className="text-[#e5e5e5] text-[18px] font-bold px-4 pt-5 pb-3">Dados do Evento</h2>

          <div className="mx-4 flex flex-col bg-[#222222] border border-[#444] rounded-sm">

            {/* Título */}
            <div className="flex items-center gap-3 p-3.5 border-b border-[#444]">
              <CalendarDays size={20} className="text-[#777] shrink-0" />
              <input
                type="text"
                placeholder="Título"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="bg-transparent w-full outline-none text-[#e5e5e5] placeholder:text-[#999] text-[16px]"
              />
            </div>

            {/* Contratante / Representante */}
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
                      <Loader2 className="animate-spin" size={16} />
                      Carregando contratantes...
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
                    onClick={() => router.push("/admin/clientes/cadastrar")}
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
                {showLocationDropdown ? (
                  <ChevronUp size={20} className="text-[#777]" />
                ) : (
                  <ChevronDown size={20} className="text-[#777]" />
                )}
              </div>

              {showLocationDropdown && (
                <div className="bg-[#1a1a1a] border-t border-[#444] flex flex-col shadow-inner">
                  {carregandoLocais && (
                    <div className="p-3.5 flex items-center gap-2 text-[#999] text-[13px]">
                      <Loader2 className="animate-spin" size={14} /> Buscando novos locais...
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
                          <div className="w-2 h-2 bg-[#16a34a] rounded-sm"></div>
                          POSSUI MAPA TÁTICO
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
                        placeholder="Nome do Local (Ex: Marina Park)"
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

          {/* CAPA DO EVENTO */}
          <h2 className="text-[#e5e5e5] text-[18px] font-bold px-4 pt-6 pb-3">Capa do Evento</h2>
          <div className="mx-4 flex flex-col gap-3">
            
            <div className="w-full h-[160px] bg-[#222] border border-[#444] rounded-sm overflow-hidden flex items-center justify-center relative">
              {comprimindo ? (
                <div className="flex flex-col items-center text-[#777]">
                  <Loader2 className="animate-spin mb-2" size={28} />
                  <span className="text-[13px]">Compactando imagem...</span>
                </div>
              ) : fotoPreview ? (
                <img src={fotoPreview} alt="Capa" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-[#666]">
                  <ImageIcon size={36} className="mb-2 opacity-50" />
                  <span className="text-[13px]">Nenhuma foto selecionada</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button 
                type="button" 
                onClick={() => selecionarFotoPublic("/Presidente_Vargas_Stadium.jpg")} 
                className="bg-[#2a2a2a] border border-[#444] hover:bg-[#333] text-[#ccc] font-semibold text-[13px] py-2.5 rounded-sm transition-colors cursor-pointer"
              >
                Usar PV
              </button>
              
              <button 
                type="button" 
                onClick={() => selecionarFotoPublic("/aecio_de_borba.jpg")} 
                className="bg-[#2a2a2a] border border-[#444] hover:bg-[#333] text-[#ccc] font-semibold text-[13px] py-2.5 rounded-sm transition-colors cursor-pointer"
              >
                Usar Aécio
              </button>
              
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                className="col-span-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[15px] font-bold py-3 rounded-sm transition-colors flex items-center justify-center gap-2 mt-1 cursor-pointer"
              >
                <ImagePlus size={20} />
                Enviar do dispositivo
              </button>
              
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleUploadFoto} 
                className="hidden" 
              />
            </div>
          </div>

          {/* DATA E HORÁRIO (AGORA COM MÁSCARA LIMPA E PERFEITA) */}
          <h2 className="text-[#e5e5e5] text-[18px] font-bold px-4 pt-6 pb-3">Data e Horário</h2>

          <div className="mx-4 flex flex-col bg-[#222222] border border-[#444] rounded-sm">

            <div className="flex items-center gap-3 p-3.5 border-b border-[#444]">
              <CalendarDays size={20} className="text-[#777] shrink-0" />
              <input
                type="text"
                placeholder="Data da operação (DD/MM/AAAA)"
                maxLength={10}
                value={dataOperacao}
                onChange={(e) => setDataOperacao(formatarData(e.target.value))}
                className="bg-transparent w-full outline-none text-[#e5e5e5] placeholder:text-[#999] text-[16px]"
              />
            </div>

            <div className="flex items-center gap-3 p-3.5 border-b border-[#444]">
              <Clock size={20} className="text-[#777] shrink-0" />
              <input
                type="text"
                placeholder="Início (HH:MM)"
                maxLength={5}
                value={horaInicio}
                onChange={(e) => setHoraInicio(formatarHora(e.target.value))}
                className="bg-transparent w-full outline-none text-[#e5e5e5] placeholder:text-[#999] text-[16px]"
              />
            </div>

            <div className="flex items-center gap-3 p-3.5">
              <Clock size={20} className="text-[#777] rotate-180 shrink-0" />
              <input
                type="text"
                placeholder="Término (HH:MM)"
                maxLength={5}
                value={horaTermino}
                onChange={(e) => setHoraTermino(formatarHora(e.target.value))}
                className="bg-transparent w-full outline-none text-[#e5e5e5] placeholder:text-[#999] text-[16px]"
              />
            </div>

          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="px-4 pt-8 pb-4 flex flex-col gap-3">
            <button
              onClick={handleSalvar}
              disabled={salvando || comprimindo}
              className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-bold py-4 rounded-sm flex justify-center items-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
            >
              {salvando ? <Loader2 className="animate-spin" size={20} /> : null}
              {salvando ? "Salvando Evento..." : "Salvar e Escalar"}
            </button>

            <button
              onClick={() => router.push("/admin/eventos")}
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
              onClick={() => router.push("/admin")}
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