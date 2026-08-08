"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { supabase } from "@/lib/supabase"; // Importação crucial para o banco de dados
import { Handshake, ChevronRight, ImagePlus, Delete, User, Building, Mail, Phone, FileEdit, Menu } from "lucide-react";

export default function CadastrarCliente() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  // Estados da Imagem
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoArquivo, setFotoArquivo] = useState(null);
  const [comprimindo, setComprimindo] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Estados dos Campos de Texto
  const [form, setForm] = useState({
    representante: "",
    empresa: "",
    email: "",
    telefone: "",
    observacoes: ""
  });

  // Atualiza os campos conforme o usuário digita
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Lida com a escolha da foto
  const handleFotoChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setComprimindo(true);

    const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };

    try {
      const compressedFile = await imageCompression(file, options);
      setFotoArquivo(compressedFile);
      setFotoPreview(URL.createObjectURL(compressedFile));
    } catch (error) {
      console.error("Erro ao comprimir imagem:", error);
      alert("Erro ao processar imagem.");
    } finally {
      setComprimindo(false);
    }
  };

  const handleRemoverFoto = () => {
    setFotoPreview(null);
    setFotoArquivo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // O "MOTOR" DO CADASTRO (O que acontece ao clicar no botão verde)
  const handleCadastro = async () => {
    if (!form.representante || !form.empresa) {
      alert("Por favor, preencha pelo menos o Representante e a Empresa.");
      return;
    }

    setSalvando(true);

    try {
      let fotoUrl = null;

      // 1. Se tiver foto, faz o upload para o Storage (Bucket 'clientes')
      if (fotoArquivo) {
        const fileExt = fotoArquivo.name.split('.').pop();
        const fileName = `${Date.now()}-cliente.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('clientes') 
          .upload(fileName, fotoArquivo);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('clientes')
          .getPublicUrl(fileName);

        fotoUrl = publicUrlData.publicUrl;
      }

      // 2. Salva os textos e a URL da foto na tabela 'clientes'
      const { error: dbError } = await supabase
        .from('clientes')
        .insert([{
          representante: form.representante,
          empresa: form.empresa,
          email: form.email,
          telefone: form.telefone,
          observacoes: form.observacoes,
          foto_url: fotoUrl 
        }]);

      if (dbError) throw dbError;

      alert("Cliente cadastrado com sucesso!");
      router.push("/admin/clientes"); // Volta para a lista
      
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar cliente: " + error.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans selection:bg-[#333] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-sm border border-[#333] bg-[#1c1c1c] relative flex flex-col min-h-[85vh]">
        
        <div className="p-5 pb-3">
          <div className="flex items-center text-[#aaa] gap-2 mb-5">
            <Handshake size={18} strokeWidth={1.5} />
            <span className="text-[14px] font-medium tracking-wide">Clientes</span>
            <ChevronRight size={14} strokeWidth={1.5} className="text-[#666]" />
            <span className="text-[14px] font-medium tracking-wide text-[#ddd]">Cadastrar cliente</span>
          </div>

          <h2 className="text-[#eee] font-bold text-lg mb-1 tracking-wide">Foto do Cliente</h2>
          <p className="text-[#777] text-[13px] mb-4">Logo da empresa ou um retrato memorável...</p>

          <div className="flex border border-[#333] bg-[#222] p-4 gap-4">
            <div className="w-28 h-28 bg-white shrink-0 relative overflow-hidden flex items-center justify-center">
              {comprimindo ? (
                <span className="text-xs text-gray-500 font-bold animate-pulse">Aguarde...</span>
              ) : fotoPreview ? (
                <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : null}
            </div>

            <div className="flex flex-col gap-2 justify-end">
              <button 
                type="button" onClick={handleRemoverFoto} disabled={comprimindo || !fotoPreview}
                className="w-10 h-10 flex items-center justify-center border border-[#444] bg-[#2a2a2a] text-[#777] hover:bg-[#333] hover:text-[#aaa] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Delete size={20} strokeWidth={1.5} />
              </button>
              
              <button 
                type="button" onClick={() => fileInputRef.current.click()} disabled={comprimindo || salvando}
                className="w-10 h-10 flex items-center justify-center bg-[#1d4ed8] text-white hover:bg-[#1e40af] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ImagePlus size={20} strokeWidth={1.5} />
              </button>

              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFotoChange} className="hidden" />
            </div>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-3">
          <h2 className="text-[#eee] font-bold text-lg mb-1 tracking-wide">Dados</h2>

          <div className="flex items-center border border-[#333] bg-[#2a2a2a] p-3 focus-within:border-[#555] transition-colors">
            <User size={20} className="text-[#777] shrink-0" strokeWidth={1.5} />
            <input type="text" name="representante" value={form.representante} onChange={handleChange} placeholder="Representante" className="w-full bg-transparent outline-none text-[#ddd] ml-3 placeholder:text-[#777] text-[15px]" />
          </div>

          <div className="flex items-center border border-[#333] bg-[#2a2a2a] p-3 focus-within:border-[#555] transition-colors">
            <Building size={20} className="text-[#777] shrink-0" strokeWidth={1.5} />
            <input type="text" name="empresa" value={form.empresa} onChange={handleChange} placeholder="Empresa" className="w-full bg-transparent outline-none text-[#ddd] ml-3 placeholder:text-[#777] text-[15px]" />
          </div>

          <div className="flex items-center border border-[#333] bg-[#2a2a2a] p-3 focus-within:border-[#555] transition-colors">
            <Mail size={20} className="text-[#777] shrink-0" strokeWidth={1.5} />
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="E-mail" className="w-full bg-transparent outline-none text-[#ddd] ml-3 placeholder:text-[#777] text-[15px]" />
          </div>

          <div className="flex items-center border border-[#333] bg-[#2a2a2a] p-3 focus-within:border-[#555] transition-colors">
            <Phone size={20} className="text-[#777] shrink-0" strokeWidth={1.5} />
            <input type="tel" name="telefone" value={form.telefone} onChange={handleChange} placeholder="Telefone" className="w-full bg-transparent outline-none text-[#ddd] ml-3 placeholder:text-[#777] text-[15px]" />
          </div>

          <div className="flex items-start border border-[#333] bg-[#2a2a2a] p-3 focus-within:border-[#555] transition-colors h-28">
            <FileEdit size={20} className="text-[#777] shrink-0 mt-0.5" strokeWidth={1.5} />
            <textarea name="observacoes" value={form.observacoes} onChange={handleChange} placeholder="Observações..." className="w-full h-full bg-transparent outline-none text-[#ddd] ml-3 placeholder:text-[#777] text-[15px] resize-none" />
          </div>
        </div>

        <div className="p-5 pt-2 flex flex-col gap-3 mt-auto">
          
          <button 
            onClick={handleCadastro}
            disabled={salvando}
            className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white text-[17px] font-bold py-4 transition-colors tracking-wide disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {salvando ? "Cadastrando..." : "Cadastrar"}
          </button>

          <button 
            onClick={() => router.back()}
            disabled={salvando}
            className="w-full border border-[#444] bg-[#2a2a2a] hover:bg-[#333] text-[#aaa] text-[17px] py-4 transition-colors tracking-wide disabled:opacity-50"
          >
            Cancelar
          </button>

          <div className="w-full h-px bg-[#333] mt-2 mb-2"></div>

          <div className="flex justify-between items-center">
            <div className="w-10 h-10 flex items-center justify-start opacity-30">
              <img src="/icon.png" alt="Logo Wadjet" className="max-w-full max-h-full object-contain grayscale" onError={(e) => e.target.style.display = 'none'} />
            </div>
            <button className="w-10 h-10 flex items-center justify-center border border-[#444] bg-[#2a2a2a] text-[#888] hover:bg-[#333] transition-colors">
              <Menu size={22} strokeWidth={1.5} />
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}