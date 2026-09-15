"use client";
import { supabase } from "@/lib/supabase";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, Save, Loader2, Type, Briefcase, MapPin, 
  Calendar, Image as ImageIcon, Search, Check, Shield, Users,
  ChevronDown, ChevronUp, ImagePlus
} from "lucide-react";

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

// Função auxiliar para data
const formatarDataParaInput = (dataString) => {
  if (!dataString) return "";
  const d = new Date(dataString);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
};

// ==========================================
// COMPONENTE: CARD DO SEGURANÇA
// ==========================================
const StaffCard = ({ membro, onToggle, onSetorChange }) => (
  <div className={`flex flex-col p-4 mb-2 rounded-sm border transition-colors ${membro.escalado ? 'bg-[#1e293b] border-[#3b82f6]' : 'bg-[#222222] border-[#3a3a3a] hover:bg-[#2a2a2a]'}`}>
    <div className="flex items-center justify-between cursor-pointer" onClick={() => onToggle(membro.id)}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[#333] rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-[#444]">
          {membro.foto ? <img src={membro.foto} alt={membro.nome} className="w-full h-full object-cover" /> : <Shield size={20} className={membro.escalado ? "text-[#3b82f6]" : "text-[#777]"} />}
        </div>
        <div>
          <h3 className={`text-[16px] font-semibold tracking-wide capitalize ${membro.escalado ? 'text-white' : 'text-[#e5e5e5]'}`}>{membro.nome}</h3>
          <p className="text-[#999999] text-[13px] mt-0.5 capitalize flex items-center gap-2">
            {membro.funcao} 
            {membro.classificacao && <span className="text-[#eab308] font-bold text-[11px] uppercase tracking-wider">[{membro.classificacao}]</span>}
          </p>
        </div>
      </div>
      <div className={`w-[24px] h-[24px] rounded-[2px] flex items-center justify-center border ${membro.escalado ? 'bg-[#2563eb] border-[#2563eb]' : 'bg-[#1a1a1a] border-[#555]'}`}>
        {membro.escalado && <Check size={16} className="text-white" strokeWidth={3.5} />}
      </div>
    </div>
    
    {/* Campo de Setor */}
    {membro.escalado && (
      <div className="mt-4 pt-3 border-t border-[#3b82f6]/30 animate-in fade-in slide-in-from-top-2">
        <input 
          type="text" 
          placeholder="Setor de atuação (Ex: Produção, Coordenação, Portão A)" 
          value={membro.setor}
          onChange={(e) => onSetorChange(membro.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-[#0f172a] border border-[#3b82f6]/50 text-[#e5e5e5] h-[40px] px-3 outline-none text-[14px] rounded-sm placeholder:text-[#64748b] focus:border-[#3b82f6] transition-colors"
        />
      </div>
    )}
  </div>
);

// ==========================================
// PÁGINA PRINCIPAL DE EDIÇÃO (INFO + ESCALA)
// ==========================================
export default function EditarEvento() {
  const router = useRouter();
  const eventoId = useParams().id;
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Estados do Evento
  const [titulo, setTitulo] = useState("");
  const [nomeContratante, setNomeContratante] = useState("");
  const [endereco, setEndereco] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // Estados da Capa do Evento
  const [fotoUrl, setFotoUrl] = useState("");
  const [fotoPreview, setFotoPreview] = useState("");
  const [fotoUpload, setFotoUpload] = useState(null);
  const [comprimindo, setComprimindo] = useState(false);

  // Estados da Localização
  const locaisDeFabrica = [
    { nome: "Estádio Presidente Vargas", tatico: true },
    { nome: "Estádio Carlos de Alencar Pinto", tatico: false },
    { nome: "Ginásio Aécio de Borba", tatico: false },
    { nome: "Cidade Vozão", tatico: false }
  ];
  const [locais, setLocais] = useState(locaisDeFabrica);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [carregandoLocais, setCarregandoLocais] = useState(false);
  const [customLocalName, setCustomLocalName] = useState("");

  // Estados da Escala
  const [equipe, setEquipe] = useState([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const fetchDadosCompletos = async () => {
      try {
        // 1. Puxa os dados em texto do evento
        const { data: eventoData, error: eventoError } = await supabase
          .from('eventos')
          .select('*')
          .eq('id', eventoId)
          .single();

        if (eventoError) throw eventoError;

        if (eventoData) {
          setTitulo(eventoData.titulo || "");
          setNomeContratante(eventoData.nome_contratante || "");
          const endSalvo = eventoData.endereco_texto || "";
          setEndereco(endSalvo);
          
          const ehDeFabrica = locaisDeFabrica.some(l => l.nome.toLowerCase() === endSalvo.toLowerCase());
          if (endSalvo && !ehDeFabrica) {
            setCustomLocalName(endSalvo);
          }

          setFotoUrl(eventoData.foto_local || "");
          setFotoPreview(eventoData.foto_local || "");
          setDataInicio(formatarDataParaInput(eventoData.data_inicio));
          setDataFim(formatarDataParaInput(eventoData.data_fim));
        }

        // 2. Puxa todos os seguranças e quem já está escalado
        const { data: perfisData } = await supabase.from('perfis').select('*').neq('role', 'admin');
        const { data: escalasData } = await supabase.from('escalas').select('*').eq('evento_id', eventoId);

        if (perfisData) {
          const equipeFormatada = perfisData.map(p => {
            const escalaExistente = escalasData?.find(e => e.staff_id === p.id);
            return {
              id: p.id,
              nome: p.nome_completo || "Sem nome",
              funcao: p.role === 'staff' ? 'Staff Tático' : p.role,
              foto: p.foto_url || null,
              classificacao: p.classificacao || "",
              escalado: !!escalaExistente,
              setor: escalaExistente ? escalaExistente.setor : "",
              escalaId: escalaExistente ? escalaExistente.id : null
            };
          });
          setEquipe(equipeFormatada);
        }

      } catch (error) {
        console.error("Erro ao buscar dados:", error.message);
      } finally {
        setLoading(false);
      }
    };

    if (eventoId) fetchDadosCompletos();
  }, [eventoId]);

  // Busca locais salvos dinamicamente ao abrir o dropdown
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

  // Manipulação da foto da capa
  const selecionarFotoPublic = (caminho) => {
    setFotoPreview(caminho);
    setFotoUrl(caminho);
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

  // Controles da Escala
  const toggleStaff = (id) => setEquipe(prev => prev.map(m => m.id === id ? { ...m, escalado: !m.escalado } : m));
  const updateSetor = (id, novoSetor) => setEquipe(prev => prev.map(m => m.id === id ? { ...m, setor: novoSetor } : m));

  const handleSalvarTudo = async (e) => {
    e.preventDefault();
    if (!titulo || !dataInicio) return alert("Preencha título e data de início.");
    setSalvando(true);

    try {
      let urlFinalDaFoto = fotoUrl;

      // Se enviou nova foto pelo dispositivo, faz o upload para o Storage
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

      const enderecoFinal = endereco === "Outro (Personalizar)" 
        ? customLocalName 
        : (endereco || customLocalName || null);
      const possuiMapaTatico = Boolean(enderecoFinal && enderecoFinal.toLowerCase().includes("presidente vargas"));

      // 1. Salva as informações de texto
      const { error: updateError } = await supabase
        .from('eventos')
        .update({
          titulo, 
          nome_contratante: nomeContratante, 
          endereco_texto: enderecoFinal,
          mapa_tatico: possuiMapaTatico,
          data_inicio: dataInicio ? new Date(dataInicio).toISOString() : null,
          data_fim: dataFim ? new Date(dataFim).toISOString() : null,
          foto_local: urlFinalDaFoto || null,
        })
        .eq('id', eventoId);
      if (updateError) throw updateError;

      // 2. Sincroniza as Escalas da Equipe
      const selecionados = equipe.filter(e => e.escalado);
      const naoSelecionados = equipe.filter(e => !e.escalado);

      // A. Deleta quem foi desmarcado (mas que tinha ID no banco)
      const idsParaDeletar = naoSelecionados.filter(e => e.escalaId).map(e => e.escalaId);
      if (idsParaDeletar.length > 0) {
        await supabase.from('escalas').delete().in('id', idsParaDeletar);
      }

      // B. Insere gente nova (que foi marcada agora e não tinha ID no banco)
      const novosParaInserir = selecionados.filter(e => !e.escalaId).map(e => ({
        evento_id: eventoId,
        staff_id: e.id,
        setor: e.setor || "Geral"
      }));
      if (novosParaInserir.length > 0) {
        await supabase.from('escalas').insert(novosParaInserir);
      }

      // C. Atualiza o setor de quem já estava e continua marcado
      const mantidosParaAtualizar = selecionados.filter(e => e.escalaId);
      for (const item of mantidosParaAtualizar) {
        await supabase.from('escalas').update({ setor: item.setor || "Geral" }).eq('id', item.escalaId);
      }

      alert("✅ Evento e Equipe atualizados com sucesso!");
      router.push(`/admin/eventos/${eventoId}`);

    } catch (error) {
      console.error("Erro ao salvar:", error.message);
      alert("Erro ao salvar as alterações.");
    } finally {
      setSalvando(false);
    }
  };

  const equipeFiltrada = equipe.filter(m => m.nome.toLowerCase().includes(busca.toLowerCase()));
  const totalEscalados = equipe.filter(m => m.escalado).length;

  if (loading) return <div className="min-h-screen bg-[#171717] flex flex-col items-center justify-center text-[#777]"><Loader2 className="animate-spin mb-4 text-[#2563eb]" size={40} /><p>Preparando painel de edição...</p></div>;

  return (
    <div className="min-h-screen bg-[#171717] font-sans flex flex-col items-center pb-[100px]">
      <div className="w-full max-w-[600px] min-h-screen flex flex-col bg-[#1c1c1c] relative border-x border-[#2a2a2a]">
        
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between p-5 border-b border-[#333333] sticky top-0 bg-[#1c1c1c] z-10 shadow-sm">
          <div className="flex items-center gap-4 text-[#cccccc]">
            <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-sm hover:bg-[#2a2a2a] transition-colors cursor-pointer">
              <ArrowLeft size={24} strokeWidth={1.5} />
            </button>
            <div>
              <h1 className="text-[18px] font-semibold tracking-wide text-[#e5e5e5]">Central de Edição</h1>
              <p className="text-[12px] text-[#2563eb] font-medium uppercase tracking-wider">Ref: {eventoId?.slice(0,8)}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* BLOCO 1: DADOS DO EVENTO */}
          <div className="p-5 md:p-8">
            <h2 className="text-[#e5e5e5] text-[16px] font-bold uppercase tracking-wider mb-5 flex items-center gap-2 border-b border-[#333] pb-2">
              <Type size={18} className="text-[#2563eb]"/> Informações Gerais
            </h2>
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <label className="text-[#999] text-[12px] font-semibold uppercase tracking-wider">Nome da Operação *</label>
                <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full bg-[#222] border border-[#3a3a3a] text-white p-3.5 rounded-sm focus:border-[#2563eb] outline-none" required />
              </div>
              <div className="space-y-2">
                <label className="text-[#999] text-[12px] font-semibold uppercase tracking-wider">Contratante</label>
                <input type="text" value={nomeContratante} onChange={(e) => setNomeContratante(e.target.value)} className="w-full bg-[#222] border border-[#3a3a3a] text-white p-3.5 rounded-sm focus:border-[#2563eb] outline-none" />
              </div>

              {/* LOCALIZAÇÃO COM DROPDOWN DE PRESETS E CUSTOM */}
              <div className="space-y-2">
                <label className="text-[#999] text-[12px] font-semibold uppercase tracking-wider flex items-center gap-2">
                  <MapPin size={15} className="text-[#2563eb]" /> Localização
                </label>
                <div className="bg-[#222] border border-[#3a3a3a] rounded-sm">
                  <div
                    onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                    className="flex items-center justify-between p-3.5 cursor-pointer bg-[#222] hover:bg-[#282828] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin size={18} className="text-[#777]" />
                      <span className={endereco ? "text-[#e5e5e5] text-[15px]" : "text-[#999] text-[15px]"}>
                        {endereco || "Selecionar localização..."}
                      </span>
                    </div>
                    {showLocationDropdown ? <ChevronUp size={18} className="text-[#777]" /> : <ChevronDown size={18} className="text-[#777]" />}
                  </div>

                  {showLocationDropdown && (
                    <div className="bg-[#1a1a1a] border-t border-[#3a3a3a] flex flex-col shadow-inner">
                      {carregandoLocais && (
                        <div className="p-3.5 flex items-center gap-2 text-[#999] text-[13px]">
                          <Loader2 className="animate-spin" size={14} /> Buscando locais...
                        </div>
                      )}

                      {locais.map((loc, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setEndereco(loc.nome);
                            setShowLocationDropdown(false);
                          }}
                          className="p-3.5 border-b border-[#2e2e2e] hover:bg-[#2d2d2d] cursor-pointer flex flex-col transition-colors"
                        >
                          <span className="text-[#e5e5e5] text-[14px]">{loc.nome}</span>
                          {loc.tatico && (
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold tracking-widest text-[#999]">
                              <div className="w-2 h-2 bg-[#16a34a] rounded-sm"></div> POSSUI MAPA TÁTICO
                            </div>
                          )}
                        </div>
                      ))}

                      <div
                        onClick={() => {
                          setEndereco("Outro (Personalizar)");
                          if (!customLocalName && endereco && !locais.some(l => l.nome === endereco)) {
                            setCustomLocalName(endereco);
                          }
                        }}
                        className="p-3.5 border-b border-[#2e2e2e] text-[#e5e5e5] hover:bg-[#2d2d2d] cursor-pointer text-[14px]"
                      >
                        Outro (Personalizar)
                      </div>

                      {endereco === "Outro (Personalizar)" && (
                        <div className="p-3.5 flex flex-col gap-2 bg-[#111111]">
                          <input
                            type="text"
                            placeholder="Nome do local (Ex: Marina Park)"
                            value={customLocalName}
                            onChange={(e) => {
                              setCustomLocalName(e.target.value);
                            }}
                            className="bg-[#2a2a2a] border border-[#444] text-[#e5e5e5] p-3 rounded-sm outline-none w-full placeholder:text-[#999] text-[14px] focus:border-[#2563eb]"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[#999] text-[12px] font-semibold uppercase tracking-wider">Início *</label>
                  <input type="datetime-local" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full bg-[#222] border border-[#3a3a3a] text-white p-3.5 rounded-sm focus:border-[#2563eb] outline-none [color-scheme:dark]" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[#999] text-[12px] font-semibold uppercase tracking-wider">Término Estimado</label>
                  <input type="datetime-local" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full bg-[#222] border border-[#3a3a3a] text-white p-3.5 rounded-sm focus:border-[#2563eb] outline-none [color-scheme:dark]" />
                </div>
              </div>

              {/* CAPA DO EVENTO (PRESETS + UPLOAD DO DISPOSITIVO, SEM OPÇÃO DE LINK) */}
              <div className="space-y-3 pt-2">
                <label className="text-[#999] text-[12px] font-semibold uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon size={15} className="text-[#2563eb]" /> Capa do Evento
                </label>

                <div className="w-full h-[180px] bg-[#222] border border-[#3a3a3a] rounded-sm overflow-hidden flex items-center justify-center relative">
                  {comprimindo ? (
                    <div className="flex flex-col items-center text-[#777]">
                      <Loader2 className="animate-spin mb-2" size={28} />
                      <span className="text-[13px]">Compactando imagem...</span>
                    </div>
                  ) : fotoPreview ? (
                    <img src={fotoPreview} alt="Capa do Evento" className="w-full h-full object-cover" />
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
            </form>
          </div>

          {/* DIVISOR DE SEÇÕES */}
          <div className="w-full h-3 bg-[#111] border-y border-[#333]"></div>

          {/* BLOCO 2: EDIÇÃO DE EQUIPE ESCALADA */}
          <div className="p-5 md:p-8">
            <div className="flex items-center justify-between mb-5 border-b border-[#333] pb-2">
              <h2 className="text-[#e5e5e5] text-[16px] font-bold uppercase tracking-wider flex items-center gap-2">
                <Users size={18} className="text-[#22c55e]"/> Escala Tática
              </h2>
              <span className="bg-[#22c55e]/20 text-[#22c55e] font-bold px-3 py-1 rounded-sm text-[13px]">{totalEscalados} escalados</span>
            </div>

            <div className="relative mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]" size={20} />
              <input type="text" placeholder="Buscar segurança na equipe..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full bg-[#222] border border-[#3a3a3a] text-[#e5e5e5] h-[46px] pl-10 pr-4 outline-none rounded-sm" />
            </div>

            <div className="flex flex-col">
              {equipeFiltrada.map(m => (
                <StaffCard key={m.id} membro={m} onToggle={toggleStaff} onSetorChange={updateSetor} />
              ))}
            </div>
          </div>
        </div>

        {/* BOTÃO FIXO DE SALVAR (SALVA TUDO JUNTO) */}
        <div className="p-5 border-t border-[#333333] bg-[#1a1a1a] fixed bottom-0 w-full max-w-[600px] z-20">
          <button 
            onClick={handleSalvarTudo}
            disabled={salvando}
            className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold py-4 rounded-sm flex justify-center items-center gap-2 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
          >
            {salvando ? <Loader2 className="animate-spin" size={22} /> : <Save size={22} strokeWidth={2} />}
            {salvando ? "Sincronizando Dados..." : "Salvar Atualizações"}
          </button>
        </div>

      </div>
    </div>
  );
}