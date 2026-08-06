"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { supabase } from "@/lib/supabase";
import { 
  UserPlus, Mail, Lock, User, CreditCard, 
  Calendar, Smartphone, Wallet, GraduationCap, 
  Shirt, ChevronDown, ImagePlus, Check
} from "lucide-react";

export default function Cadastro() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoArquivo, setFotoArquivo] = useState(null);
  const [comprimindo, setComprimindo] = useState(false);

  const [form, setForm] = useState({
    email: "", senha: "", confirmarSenha: "",
    nome: "", cpf: "", dataNascimento: "", whatsapp: "", chavePix: "",
    curso: "", uniforme: ""
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFotoChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setComprimindo(true);

    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1024,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      setFotoArquivo(compressedFile);
      setFotoPreview(URL.createObjectURL(compressedFile));
    } catch (error) {
      console.error("Erro ao comprimir a imagem:", error);
      alert("Erro ao processar a imagem. Tente outra foto.");
    } finally {
      setComprimindo(false);
    }
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    
    if (form.senha !== form.confirmarSenha) {
      alert("As senhas não coincidem!");
      return;
    }

    setComprimindo(true); 

    try {
      // PASSO 1: Cria a autenticação no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.senha,
      });

      if (authError) throw authError;
      if (!authData?.user?.id) throw new Error("Usuário não retornado após criação.");

      const userId = authData.user.id;
      let fotoUrl = null;

      // PASSO 2: Upload da Foto no Storage
      if (fotoArquivo) {
        const fileExt = fotoArquivo.name.split('.').pop();
        const fileName = `${userId}-perfil.${fileExt}`;
        const filePath = `fotos_perfil/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('perfis') 
          .upload(filePath, fotoArquivo);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('perfis')
          .getPublicUrl(filePath);

        fotoUrl = publicUrlData.publicUrl;
      }

      // PASSO 3: Inserção MANUAL na tabela perfis
      const { error: dbError } = await supabase
        .from('perfis')
        .upsert({ 
          id: userId,
          nome_completo: form.nome,
          role: 'staff',
          cpf: form.cpf,
          whatsapp: form.whatsapp,
          chave_pix: form.chavePix,
          data_nascimento: form.dataNascimento || null,
          curso: form.curso,
          uniforme: form.uniforme,
          foto_url: fotoUrl 
        });

      if (dbError) {
        console.error("ERRO AO INSERIR NO BANCO:", dbError);
        throw dbError;
      }

      // PASSO 4: Enviar notificação por e-mail com TODOS os dados
      try {
        await fetch("/api/notificar-cadastro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: form.nome,
            email: form.email,
            whatsapp: form.whatsapp,
            cpf: form.cpf,
            chavePix: form.chavePix,
            dataNascimento: form.dataNascimento, // ADICIONADO AQUI
            curso: form.curso,
            uniforme: form.uniforme,
            fotoUrl: fotoUrl,
          }),
        });
      } catch (emailError) {
        console.error("Erro ao notificar admin:", emailError);
      }

      alert("Cadastro realizado com sucesso!");
      router.push("/"); 

    } catch (error) {
      console.error("ERRO COMPLETO:", error);
      alert(error.message || "Ocorreu um erro no cadastro.");
    } finally {
      setComprimindo(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center font-sans text-white">
      <div className="w-full max-w-sm px-4 pb-10">
        
        {/* Cabeçalho */}
        <div className="sticky top-0 z-50 bg-[#141414] pt-8 pb-3 mb-6 flex items-center gap-2 border-b border-[#2a2a2a]">
          <UserPlus size={20} className="text-[#aaa]" />
          <h1 className="text-sm font-semibold text-[#ddd]">Cadastre-se</h1>
        </div>

        <form onSubmit={handleCadastro} className="flex flex-col gap-6">
          
          {/* Foto de Perfil */}
          <div className="flex flex-col gap-2">
            <h2 className="text-[13px] font-semibold text-[#ccc]">Foto de Perfil</h2>
            <p className="text-[11px] text-[#777]">A foto deve conter o seu rosto 100% visível.</p>
            
            <div className="w-24 h-32 bg-white relative mt-1 rounded-sm overflow-hidden flex items-center justify-center">
              {comprimindo ? (
                <span className="text-xs text-gray-500 font-semibold animate-pulse">Enviando...</span>
              ) : fotoPreview ? (
                <img src={fotoPreview} alt="Sua foto" className="w-full h-full object-cover" />
              ) : null}

              <button 
                type="button" 
                onClick={() => fileInputRef.current.click()}
                className={`absolute -bottom-1 -right-1 p-2.5 rounded-sm transition-colors shadow-md z-10 ${fotoPreview ? 'bg-[#1db954] hover:bg-[#16a34a]' : 'bg-[#2563eb] hover:bg-[#1d4ed8]'}`}
                disabled={comprimindo}
              >
                {fotoPreview ? <Check size={16} className="text-white" /> : <ImagePlus size={16} className="text-white" />}
              </button>

              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFotoChange} className="hidden" />
            </div>
          </div>

          {/* Acesso ao App */}
          <div className="flex flex-col gap-2 mt-2">
            <h2 className="text-[13px] font-semibold text-[#ccc] mb-1">Acesso ao App</h2>
            
            <div className="relative flex items-center">
              <div className="absolute left-4 text-[#777]"><Mail size={18} strokeWidth={1.5} /></div>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="E-mail" required className="w-full bg-[#2a2a2a] text-white text-sm outline-none py-3 pr-4 pl-11 rounded-sm border border-[#3a3a3a] focus:border-[#555] transition-all" />
            </div>
            
            <div className="relative flex items-center">
              <div className="absolute left-4 text-[#777]"><Lock size={18} strokeWidth={1.5} /></div>
              <input type="password" name="senha" value={form.senha} onChange={handleChange} placeholder="Senha" required className="w-full bg-[#2a2a2a] text-white text-sm outline-none py-3 pr-4 pl-11 rounded-sm border border-[#3a3a3a] focus:border-[#555] transition-all" />
            </div>

            <div className="relative flex items-center">
              <div className="absolute left-4 text-[#777]"><Lock size={18} strokeWidth={1.5} /></div>
              <input type="password" name="confirmarSenha" value={form.confirmarSenha} onChange={handleChange} placeholder="Confirmar senha" required className="w-full bg-[#2a2a2a] text-white text-sm outline-none py-3 pr-4 pl-11 rounded-sm border border-[#3a3a3a] focus:border-[#555] transition-all" />
            </div>
          </div>

          {/* Dados Pessoais */}
          <div className="flex flex-col gap-2 mt-2">
            <h2 className="text-[13px] font-semibold text-[#ccc] mb-1">Dados Pessoais</h2>
            
            <div className="relative flex items-center">
              <div className="absolute left-4 text-[#777]"><User size={18} strokeWidth={1.5} /></div>
              <input type="text" name="nome" value={form.nome} onChange={handleChange} placeholder="Nome completo" required className="w-full bg-[#2a2a2a] text-white text-sm outline-none py-3 pr-4 pl-11 rounded-sm border border-[#3a3a3a] focus:border-[#555] transition-all" />
            </div>

            <div className="relative flex items-center">
              <div className="absolute left-4 text-[#777]"><CreditCard size={18} strokeWidth={1.5} /></div>
              <input type="text" name="cpf" value={form.cpf} onChange={handleChange} placeholder="CPF" required className="w-full bg-[#2a2a2a] text-white text-sm outline-none py-3 pr-4 pl-11 rounded-sm border border-[#3a3a3a] focus:border-[#555] transition-all" />
            </div>

            <div className="relative flex items-center">
              <div className="absolute left-4 text-[#777]"><Calendar size={18} strokeWidth={1.5} /></div>
              <input type="text" name="dataNascimento" value={form.dataNascimento} onChange={handleChange} placeholder="Data de nascimento" onFocus={(e) => e.target.type = 'date'} onBlur={(e) => e.target.type = form.dataNascimento ? 'date' : 'text'} required className="w-full bg-[#2a2a2a] text-[#aaa] text-sm outline-none py-3 pr-4 pl-11 rounded-sm border border-[#3a3a3a] focus:border-[#555] transition-all" />
            </div>

            <div className="relative flex items-center">
              <div className="absolute left-4 text-[#777]"><Smartphone size={18} strokeWidth={1.5} /></div>
              <input type="tel" name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="WhatsApp" required className="w-full bg-[#2a2a2a] text-white text-sm outline-none py-3 pr-4 pl-11 rounded-sm border border-[#3a3a3a] focus:border-[#555] transition-all" />
            </div>

            <div className="relative flex items-center">
              <div className="absolute left-4 text-[#777]"><Wallet size={18} strokeWidth={1.5} /></div>
              <input type="text" name="chavePix" value={form.chavePix} onChange={handleChange} placeholder="Chave Pix" required className="w-full bg-[#2a2a2a] text-white text-sm outline-none py-3 pr-4 pl-11 rounded-sm border border-[#3a3a3a] focus:border-[#555] transition-all" />
            </div>
          </div>

          {/* Dados Profissionais */}
          <div className="flex flex-col gap-2 mt-2">
            <h2 className="text-[13px] font-semibold text-[#ccc] mb-1">Dados Profissionais</h2>
            
            <div className="relative flex items-center">
              <div className="absolute left-4 text-[#777] pointer-events-none"><GraduationCap size={18} strokeWidth={1.5} /></div>
              <select name="curso" value={form.curso} onChange={handleChange} required className="w-full bg-[#2a2a2a] text-[#aaa] text-sm outline-none py-3 pr-10 pl-11 rounded-sm border border-[#3a3a3a] focus:border-[#555] appearance-none transition-all">
                <option value="" disabled hidden>Possui curso?</option>
                <option value="nenhum">Não possuo nenhum curso em Segurança</option>
                <option value="apoio">Possuo curso de Apoio e Segurança em Eventos</option>
                <option value="extensao">Possuo extensão para Grandes Eventos</option>
              </select>
              <div className="absolute right-4 text-[#777] pointer-events-none"><ChevronDown size={18} strokeWidth={1.5} /></div>
            </div>

            <div className="relative flex items-center">
              <div className="absolute left-4 text-[#777] pointer-events-none"><Shirt size={18} strokeWidth={1.5} /></div>
              <select name="uniforme" value={form.uniforme} onChange={handleChange} required className="w-full bg-[#2a2a2a] text-[#aaa] text-sm outline-none py-3 pr-10 pl-11 rounded-sm border border-[#3a3a3a] focus:border-[#555] appearance-none transition-all">
                <option value="" disabled hidden>Uniforme</option>
                <option value="pp">Camisa de tamanho PP</option>
                <option value="p">Camisa de tamanho P</option>
                <option value="m">Camisa de tamanho M</option>
                <option value="g">Camisa de tamanho G</option>
                <option value="gg">Camisa de tamanho GG</option>
              </select>
              <div className="absolute right-4 text-[#777] pointer-events-none"><ChevronDown size={18} strokeWidth={1.5} /></div>
            </div>
          </div>

          <div className="w-full bg-[#9f201d] text-white text-center py-2 px-4 text-xs font-semibold rounded-sm mt-4">
            Todas as informações são obrigatórias.
          </div>

          {/* Botões */}
          <div className="flex flex-col gap-2 mt-2">
            <button type="submit" disabled={comprimindo} className="w-full bg-[#1db954] hover:bg-[#16a34a] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold text-sm py-3 rounded-sm transition-colors">
              {comprimindo ? 'Enviando...' : 'Cadastrar-se'}
            </button>
            <button type="button" onClick={() => router.push("/")} disabled={comprimindo} className="w-full bg-[#3a3a3a] hover:bg-[#4a4a4a] disabled:opacity-50 text-[#ddd] font-bold text-sm py-3 rounded-sm transition-colors">
              Voltar
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}