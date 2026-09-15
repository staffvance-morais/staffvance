"use client";
import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import imageCompression from "browser-image-compression";
import {
  ArrowLeft,
  Building,
  User,
  Mail,
  Phone,
  FileEdit,
  Loader2,
  Edit3,
  Save,
  Trash2,
  ImagePlus,
} from "lucide-react";

export default function DetalhesClienteCoordenador() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Estados de Edição
  const [editMode, setEditMode] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [comprimindo, setComprimindo] = useState(false);
  const [fotoArquivo, setFotoArquivo] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    empresa: "",
    representante: "",
    email: "",
    telefone: "",
    observacoes: "",
    foto_url: "",
  });

  useEffect(() => {
    async function checkSecurity() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push("/"); return; }
      const { data: perfilData } = await supabase.from("perfis").select("role").eq("id", session.user.id).single();
      const roleNorm = (perfilData?.role || "").toLowerCase().trim();
      if (!perfilData || (roleNorm !== "coordenador" && roleNorm !== "producao" && roleNorm !== "produção" && roleNorm !== "admin" && roleNorm !== "owner")) {
        router.push("/freelancers");
      } else {
        setIsAuthorized(true);
      }
    }
    checkSecurity();
  }, [router]);

  useEffect(() => {
    if (!isAuthorized || !id) return;
    const fetchCliente = async () => {
      try {
        const { data, error } = await supabase.from("clientes").select("*").eq("id", id).single();
        if (error) throw error;
        if (data) {
          setCliente(data);
          setForm({
            empresa: data.empresa || "",
            representante: data.representante || "",
            email: data.email || "",
            telefone: data.telefone || "",
            observacoes: data.observacoes || "",
            foto_url: data.foto_url || "",
          });
          setFotoPreview(data.foto_url || null);
        }
      } catch (error) {
        console.error("Erro ao buscar detalhes do cliente:", error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCliente();
  }, [isAuthorized, id]);

  const handleFotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setComprimindo(true);
    const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: false };

    try {
      const compressedFile = await imageCompression(file, options);
      setFotoArquivo(compressedFile);
      setFotoPreview(URL.createObjectURL(compressedFile));
    } catch (error) {
      console.error("Erro ao comprimir imagem do cliente:", error);
      alert("Erro ao processar imagem.");
    } finally {
      setComprimindo(false);
    }
  };

  const handleRemoverFoto = () => {
    setFotoPreview(null);
    setFotoArquivo(null);
    setForm((prev) => ({ ...prev, foto_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCancelar = () => {
    if (cliente) {
      setForm({
        empresa: cliente.empresa || "",
        representante: cliente.representante || "",
        email: cliente.email || "",
        telefone: cliente.telefone || "",
        observacoes: cliente.observacoes || "",
        foto_url: cliente.foto_url || "",
      });
      setFotoPreview(cliente.foto_url || null);
      setFotoArquivo(null);
    }
    setEditMode(false);
  };

  const handleSalvarEdicao = async () => {
    if (!form.empresa && !form.representante) {
      alert("Preencha pelo menos a Empresa ou Representante.");
      return;
    }

    setSalvando(true);
    try {
      let finalFotoUrl = form.foto_url;

      if (fotoArquivo) {
        const fileExt = (fotoArquivo.name || "jpg").split(".").pop();
        const fileName = `${Date.now()}-cliente.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("clientes")
          .upload(fileName, fotoArquivo, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("clientes")
          .getPublicUrl(fileName);

        finalFotoUrl = publicUrlData.publicUrl;
      }

      const updateData = {
        empresa: form.empresa.trim(),
        representante: form.representante.trim(),
        email: form.email ? form.email.trim() : null,
        telefone: form.telefone ? form.telefone.trim() : null,
        observacoes: form.observacoes ? form.observacoes.trim() : null,
        foto_url: finalFotoUrl || null,
      };

      const { error: dbError } = await supabase
        .from("clientes")
        .update(updateData)
        .eq("id", id);

      if (dbError) throw dbError;

      setCliente((prev) => ({
        ...prev,
        ...updateData,
      }));
      setFotoArquivo(null);
      setEditMode(false);
      alert("Cliente atualizado com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar alterações do cliente:", err);
      alert("Erro ao salvar cliente: " + (err.message || "Tente novamente"));
    } finally {
      setSalvando(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <span className="text-neutral-500 font-medium animate-pulse">Verificando credenciais...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#171717] font-sans flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-[#1c1c1c] border border-[#333] flex flex-col relative min-h-[85vh]">
        
        {/* CABEÇALHO COM BOTÃO VOLTAR E AÇÕES */}
        <div className="p-4 border-b border-[#333] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => editMode ? handleCancelar() : router.push("/coordenador/clientes")} 
              className="w-10 h-10 flex items-center justify-center border border-[#444] bg-[#2a2a2a] text-[#aaa] hover:bg-[#333] hover:text-white transition-colors rounded-sm cursor-pointer"
              title={editMode ? "Cancelar edição" : "Voltar"}
            >
              <ArrowLeft size={20} strokeWidth={1.5} />
            </button>
            <h1 className="text-[#e5e5e5] text-[18px] font-semibold tracking-wide">
              {editMode ? "Editar Cliente" : "Detalhes do Cliente"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {cliente && !editMode && (
              <button
                onClick={() => setEditMode(true)}
                title="Editar cliente"
                className="w-10 h-10 flex items-center justify-center border border-[#2563eb]/40 bg-[#1e293b] text-[#3b82f6] hover:bg-[#2563eb] hover:text-white transition-colors rounded-sm cursor-pointer"
              >
                <Edit3 size={18} strokeWidth={1.8} />
              </button>
            )}

            {editMode && (
              <button
                onClick={handleSalvarEdicao}
                disabled={salvando || comprimindo}
                title="Salvar alterações"
                className="px-3 h-10 flex items-center gap-1.5 border border-emerald-600 bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider hover:bg-emerald-600 transition-colors rounded-sm cursor-pointer disabled:opacity-50"
              >
                {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {salvando ? "Salvando" : "Salvar"}
              </button>
            )}
          </div>
        </div>

        {/* ÁREA DE CONTEÚDO */}
        <div className="p-5 flex-1 flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center flex-1 text-[#777]">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p>Carregando dados...</p>
            </div>
          ) : !cliente ? (
            <div className="flex flex-col items-center justify-center flex-1 text-[#777]">
              <p>Cliente não encontrado.</p>
            </div>
          ) : editMode ? (
            /* ================= MODO EDIÇÃO ================= */
            <div className="flex flex-col gap-4">
              
              {/* Foto do Cliente */}
              <div className="flex flex-col items-center pb-4 border-b border-[#333]">
                <div className="w-24 h-24 bg-[#1a1a1a] border border-[#444] mb-3 flex items-center justify-center overflow-hidden rounded-sm relative">
                  {comprimindo ? (
                    <div className="flex flex-col items-center text-blue-500 gap-1">
                      <Loader2 className="animate-spin" size={22} />
                      <span className="text-[9px] font-bold">Processando...</span>
                    </div>
                  ) : fotoPreview ? (
                    <img src={fotoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-[#666]">Sem Imagem</span>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFotoChange}
                  className="hidden"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={comprimindo}
                    className="px-3 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ImagePlus size={14} />
                    {fotoPreview ? "Alterar Logo" : "Adicionar Logo"}
                  </button>
                  {fotoPreview && (
                    <button
                      type="button"
                      onClick={handleRemoverFoto}
                      className="px-2.5 py-1.5 border border-[#444] bg-[#222] hover:bg-[#333] text-gray-300 text-xs rounded-sm transition-colors cursor-pointer"
                      title="Remover foto"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Formulário de Campos */}
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[11px] text-[#888] uppercase font-bold block mb-1">
                    Nome da Empresa *
                  </label>
                  <div className="flex items-center border border-[#444] bg-[#222] px-3 py-2.5 rounded-sm focus-within:border-[#2563eb]">
                    <Building size={18} className="text-[#777] shrink-0 mr-2.5" />
                    <input
                      type="text"
                      value={form.empresa}
                      onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                      placeholder="Ex: Arena Prime Eventos"
                      className="bg-transparent w-full text-white text-[14px] outline-none placeholder:text-[#555]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-[#888] uppercase font-bold block mb-1">
                    Nome do Representante *
                  </label>
                  <div className="flex items-center border border-[#444] bg-[#222] px-3 py-2.5 rounded-sm focus-within:border-[#2563eb]">
                    <User size={18} className="text-[#777] shrink-0 mr-2.5" />
                    <input
                      type="text"
                      value={form.representante}
                      onChange={(e) => setForm({ ...form, representante: e.target.value })}
                      placeholder="Ex: Carlos Ferreira"
                      className="bg-transparent w-full text-white text-[14px] outline-none placeholder:text-[#555]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-[#888] uppercase font-bold block mb-1">
                    Telefone / WhatsApp
                  </label>
                  <div className="flex items-center border border-[#444] bg-[#222] px-3 py-2.5 rounded-sm focus-within:border-[#2563eb]">
                    <Phone size={18} className="text-[#777] shrink-0 mr-2.5" />
                    <input
                      type="tel"
                      value={form.telefone}
                      onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="bg-transparent w-full text-white text-[14px] outline-none placeholder:text-[#555]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-[#888] uppercase font-bold block mb-1">
                    E-mail de Contato
                  </label>
                  <div className="flex items-center border border-[#444] bg-[#222] px-3 py-2.5 rounded-sm focus-within:border-[#2563eb]">
                    <Mail size={18} className="text-[#777] shrink-0 mr-2.5" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="cliente@empresa.com"
                      className="bg-transparent w-full text-white text-[14px] outline-none placeholder:text-[#555]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-[#888] uppercase font-bold block mb-1">
                    Observações Operacionais
                  </label>
                  <div className="flex items-start border border-[#444] bg-[#222] px-3 py-2 rounded-sm focus-within:border-[#2563eb]">
                    <FileEdit size={18} className="text-[#777] shrink-0 mr-2.5 mt-1" />
                    <textarea
                      value={form.observacoes}
                      onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                      placeholder="Exigências, particularidades, faturamento..."
                      rows={3}
                      className="bg-transparent w-full text-white text-[14px] outline-none placeholder:text-[#555] resize-none"
                    />
                  </div>
                </div>

                {/* Botões do Rodapé de Edição */}
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={handleCancelar}
                    disabled={salvando}
                    className="flex-1 py-3 border border-[#444] bg-[#2a2a2a] text-gray-300 font-semibold text-sm rounded-sm hover:bg-[#333] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSalvarEdicao}
                    disabled={salvando || comprimindo}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {salvando ? "Salvando..." : "Salvar Alterações"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ================= MODO VISUALIZAÇÃO ================= */
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center pb-4 border-b border-[#333]">
                <div className="w-24 h-24 bg-[#1a1a1a] border border-[#444] mb-4 flex items-center justify-center overflow-hidden rounded-sm relative">
                  {cliente.foto_url && cliente.foto_url.trim() !== "" ? (
                    <img src={cliente.foto_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-[#666]">Sem Imagem</span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-[#e5e5e5]">{cliente.empresa || "Não informada"}</h2>
                <p className="text-[#999] mt-1">{cliente.representante || "Sem representante"}</p>
              </div>

              <div className="flex flex-col gap-3">
                <h3 className="text-[#eee] font-bold text-sm tracking-wide mb-2 uppercase opacity-80">Informações de Contato</h3>
                
                <div className="flex items-center border border-[#333] bg-[#222] p-3 rounded-sm">
                  <User size={18} className="text-[#777] shrink-0" strokeWidth={1.5} />
                  <div className="ml-3">
                    <p className="text-[11px] text-[#777] uppercase font-bold">Representante</p>
                    <p className="text-[#ddd] text-[15px]">{cliente.representante || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center border border-[#333] bg-[#222] p-3 rounded-sm">
                  <Building size={18} className="text-[#777] shrink-0" strokeWidth={1.5} />
                  <div className="ml-3">
                    <p className="text-[11px] text-[#777] uppercase font-bold">Empresa</p>
                    <p className="text-[#ddd] text-[15px]">{cliente.empresa || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center border border-[#333] bg-[#222] p-3 rounded-sm">
                  <Phone size={18} className="text-[#777] shrink-0" strokeWidth={1.5} />
                  <div className="ml-3">
                    <p className="text-[11px] text-[#777] uppercase font-bold">Telefone</p>
                    <p className="text-[#ddd] text-[15px]">{cliente.telefone || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center border border-[#333] bg-[#222] p-3 rounded-sm">
                  <Mail size={18} className="text-[#777] shrink-0" strokeWidth={1.5} />
                  <div className="ml-3 overflow-hidden">
                    <p className="text-[11px] text-[#777] uppercase font-bold">E-mail</p>
                    <p className="text-[#ddd] text-[15px] truncate">{cliente.email || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start border border-[#333] bg-[#222] p-3 rounded-sm mt-2">
                  <FileEdit size={18} className="text-[#777] shrink-0 mt-1" strokeWidth={1.5} />
                  <div className="ml-3 w-full">
                    <p className="text-[11px] text-[#777] uppercase font-bold">Observações</p>
                    <p className="text-[#ddd] text-[14px] mt-1 whitespace-pre-wrap">
                      {cliente.observacoes || "Nenhuma observação registrada."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}