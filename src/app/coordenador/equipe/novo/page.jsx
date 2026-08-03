"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Contact2, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Trash2,
  ImagePlus,
  Mail,
  Lock,
  Contact,
  Landmark,
  Calendar,
  Smartphone,
  UserCircle2,
  Medal,
  Shirt,
  PenLine,
  Shield,
  Menu,
  DollarSign
} from "lucide-react";

export default function CadastrarFuncionarioCoordenador() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  // Estados dos inputs textuais
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [pix, setPix] = useState("");
  const [observacao, setObservacao] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");

  // Estados dos selects customizados
  const [cargo, setCargo] = useState("");
  const [isCargoOpen, setIsCargoOpen] = useState(false);

  const [nivel, setNivel] = useState("");
  const [isNivelOpen, setIsNivelOpen] = useState(false);

  const [tamanho, setTamanho] = useState("");
  const [isTamanhoOpen, setIsTamanhoOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  // Fecha os dropdowns se clicar fora
  const closeAllDropdowns = () => {
    setIsCargoOpen(false);
    setIsNivelOpen(false);
    setIsTamanhoOpen(false);
  };

  const handleOpenGallery = () => {
    fileInputRef.current?.click();
  };

  // Captura o arquivo de imagem selecionado
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setFotoUrl(imageUrl);
    }
  };

  // Remove a foto selecionada
  const handleRemoveFoto = () => {
    setFotoUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/cadastrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: senha,
          nome_completo: nome,
          cpf,
          data_nascimento: dataNascimento || null,
          whatsapp: telefone || null,
          chave_pix: pix || null,
          cargo: cargo || null,
          emblema: nivel || "Bronze",
          tamanho_camisa: tamanho || null,
          observacoes: observacao || null,
          foto_url: fotoUrl || null
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || data.error || "Erro desconhecido ao cadastrar.");
      }

      alert("Funcionário cadastrado com sucesso!");
      // REDIRECIONA PARA A PÁGINA DA LANA
      router.push("/coordenador/equipe");

    } catch (error) {
      alert("Falha no cadastro: " + error.message);
      console.error("Erro completo:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-gray-400 font-sans flex flex-col relative pb-32">
      
      {/* Overlay invisível para fechar dropdowns */}
      {(isCargoOpen || isNivelOpen || isTamanhoOpen) && (
        <div className="fixed inset-0 z-40" onClick={closeAllDropdowns}></div>
      )}

      {/* Cabeçalho */}
      <div className="px-5 py-5 flex items-center gap-2 border-b border-[#333]">
        <Contact2 size={20} className="text-gray-400" strokeWidth={1.5} />
        <span className="text-gray-400 text-sm">Equipe</span>
        <ChevronRight size={16} className="text-gray-500" />
        <span className="text-gray-200 text-sm font-medium">Cadastrar funcionário</span>
      </div>

      <div className="p-5 flex-1 overflow-y-auto">
        
        {/* === SEÇÃO: FOTO DE PERFIL === */}
        <div className="mb-8">
          <div className="mb-3">
            <h2 className="text-gray-200 font-bold text-lg">Foto de Perfil</h2>
            <p className="text-xs text-gray-500 mt-1">
              Recomendado: <strong>500x500px</strong> (proporção quadrada 1:1). Máx: <strong>2MB</strong>.
            </p>
          </div>
          
          <div className="border border-[#333] p-3 flex justify-between bg-[#1a1a1a]">
            <div className="w-32 h-32 bg-white flex-shrink-0 flex items-center justify-center text-center p-2 overflow-hidden">
              {fotoUrl ? (
                <img src={fotoUrl} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-gray-400 font-medium">Sem foto</span>
              )}
            </div>
            
            <div className="flex flex-col gap-3 justify-end">
              <button 
                type="button"
                onClick={handleRemoveFoto}
                className="w-12 h-12 border border-[#444] bg-[#2a2a2a] flex items-center justify-center hover:bg-[#333] transition-colors"
                title="Remover foto"
              >
                <Trash2 size={22} className="text-gray-400" strokeWidth={1.5} />
              </button>
              
              <button 
                type="button"
                onClick={handleOpenGallery}
                className="w-12 h-12 bg-[#0d47a1] flex items-center justify-center hover:bg-[#1565c0] transition-colors"
                title="Adicionar foto"
              >
                <ImagePlus size={22} className="text-white" strokeWidth={1.5} />
              </button>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFotoChange}
                className="hidden" 
                accept="image/png, image/jpeg, image/webp" 
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleCadastro} className="flex flex-col gap-8">
          
          {/* === SEÇÃO: ACESSO AO APP === */}
          <div>
            <h2 className="text-gray-200 font-bold text-lg mb-3">Acesso ao App</h2>
            <div className="flex flex-col gap-2">
              <div className="border border-[#333] bg-[#1a1a1a] flex items-center gap-3 p-3 focus-within:border-[#555] transition-colors">
                <Mail size={20} className="text-gray-500" strokeWidth={1.5} />
                <input 
                  type="email" 
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-transparent w-full text-gray-200 outline-none placeholder-gray-500"
                />
              </div>
              
              <div className="border border-[#333] bg-[#1a1a1a] flex items-center gap-3 p-3 focus-within:border-[#555] transition-colors">
                <Lock size={20} className="text-gray-500" strokeWidth={1.5} />
                <input 
                  type="password" 
                  placeholder="Senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  minLength="6"
                  className="bg-transparent w-full text-gray-200 outline-none placeholder-gray-500"
                />
              </div>
            </div>
          </div>

          {/* === SEÇÃO: DADOS PESSOAIS === */}
          <div>
            <h2 className="text-gray-200 font-bold text-lg mb-3 border-b border-[#333] pb-2">Dados Pessoais</h2>
            <div className="flex flex-col gap-2">
              
              <div className="border border-[#333] bg-[#1a1a1a] flex items-center gap-3 p-3 focus-within:border-[#555] transition-colors">
                <Contact size={20} className="text-gray-500" strokeWidth={1.5} />
                <input 
                  type="text" 
                  placeholder="Nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="bg-transparent w-full text-gray-200 outline-none placeholder-gray-500"
                />
              </div>

              <div className="border border-[#333] bg-[#1a1a1a] flex items-center gap-3 p-3 focus-within:border-[#555] transition-colors">
                <Landmark size={20} className="text-gray-500" strokeWidth={1.5} />
                <input 
                  type="text" 
                  placeholder="CPF"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  required
                  className="bg-transparent w-full text-gray-200 outline-none placeholder-gray-500"
                />
              </div>

              <div className="border border-[#333] bg-[#1a1a1a] flex items-center gap-3 p-3 focus-within:border-[#555] transition-colors">
                <Calendar size={20} className="text-gray-500" strokeWidth={1.5} />
                <input 
                  type="date" 
                  placeholder="Data de nascimento"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="bg-transparent w-full text-gray-200 outline-none placeholder-gray-500 [color-scheme:dark]"
                />
              </div>

              <div className="border border-[#333] bg-[#1a1a1a] flex items-center gap-3 p-3 focus-within:border-[#555] transition-colors">
                <Smartphone size={20} className="text-gray-500" strokeWidth={1.5} />
                <input 
                  type="text" 
                  placeholder="WhatsApp"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="bg-transparent w-full text-gray-200 outline-none placeholder-gray-500"
                />
              </div>

              <div className="border border-[#333] bg-[#1a1a1a] flex items-center gap-3 p-3 focus-within:border-[#555] transition-colors">
                <DollarSign size={20} className="text-gray-500" strokeWidth={1.5} />
                <input 
                  type="text" 
                  placeholder="Chave PIX"
                  value={pix}
                  onChange={(e) => setPix(e.target.value)}
                  className="bg-transparent w-full text-gray-200 outline-none placeholder-gray-500"
                />
              </div>

            </div>
          </div>

          {/* === SEÇÃO: DADOS PROFISSIONAIS === */}
          <div>
            <h2 className="text-gray-200 font-bold text-lg mb-3">Dados Profissionais</h2>
            <div className="flex flex-col gap-2">
              
              <div className={`relative ${isCargoOpen ? "z-50" : "z-30"}`}>
                <div 
                  onClick={() => {closeAllDropdowns(); setIsCargoOpen(!isCargoOpen);}}
                  className="border border-[#333] bg-[#1a1a1a] flex items-center gap-3 p-3 cursor-pointer select-none"
                >
                  <UserCircle2 size={20} className="text-gray-500" strokeWidth={1.5} />
                  <span className={`flex-1 ${cargo ? "text-gray-200" : "text-gray-500"}`}>
                    {cargo || "Cargo"}
                  </span>
                  {isCargoOpen ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                </div>
                {isCargoOpen && (
                  <div className="absolute top-full left-0 w-full bg-[#1a1a1a] border border-[#333] mt-1 shadow-lg">
                    {["Segurança", "Staff"].map((opcao) => (
                      <div 
                        key={opcao}
                        onClick={() => {setCargo(opcao); setIsCargoOpen(false);}}
                        className="p-3 text-gray-300 hover:bg-[#333] cursor-pointer border-b border-[#222] last:border-0"
                      >
                        {opcao}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={`relative ${isNivelOpen ? "z-50" : "z-20"}`}>
                <div 
                  onClick={() => {closeAllDropdowns(); setIsNivelOpen(!isNivelOpen);}}
                  className="border border-[#333] bg-[#1a1a1a] flex items-center gap-3 p-3 cursor-pointer select-none"
                >
                  <Medal size={20} className="text-gray-500" strokeWidth={1.5} />
                  <span className={`flex-1 ${nivel ? "text-gray-200" : "text-gray-500"}`}>
                    {nivel || "Nível"}
                  </span>
                  {isNivelOpen ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                </div>
                
                {isNivelOpen && (
                  <div className="absolute top-full left-0 w-full mt-1 flex flex-col border border-[#333] shadow-lg overflow-hidden">
                    <div 
                      onClick={() => {setNivel("Ouro"); setIsNivelOpen(false);}}
                      className="bg-[#b47318] p-3 flex items-center gap-3 cursor-pointer hover:brightness-110 border-b border-[#333]"
                    >
                      <Shield size={20} className="text-white" strokeWidth={2} />
                      <span className="text-white font-bold tracking-wide">Ouro</span>
                    </div>
                    <div 
                      onClick={() => {setNivel("Prata"); setIsNivelOpen(false);}}
                      className="bg-[#475569] p-3 flex items-center gap-3 cursor-pointer hover:brightness-110 border-b border-[#333]"
                    >
                      <Shield size={20} className="text-white" strokeWidth={2} />
                      <span className="text-white font-bold tracking-wide">Prata</span>
                    </div>
                    <div 
                      onClick={() => {setNivel("Bronze"); setIsNivelOpen(false);}}
                      className="bg-[#9c4221] p-3 flex items-center gap-3 cursor-pointer hover:brightness-110"
                    >
                      <Shield size={20} className="text-white" strokeWidth={2} />
                      <span className="text-white font-bold tracking-wide">Bronze</span>
                    </div>
                  </div>
                )}
              </div>

              <div className={`relative ${isTamanhoOpen ? "z-50" : "z-10"}`}>
                <div 
                  onClick={() => {closeAllDropdowns(); setIsTamanhoOpen(!isTamanhoOpen);}}
                  className="border border-[#333] bg-[#1a1a1a] flex items-center gap-3 p-3 cursor-pointer select-none"
                >
                  <Shirt size={20} className="text-gray-500" strokeWidth={1.5} />
                  <span className={`flex-1 ${tamanho ? "text-gray-200" : "text-gray-500"}`}>
                    {tamanho || "Tamanho"}
                  </span>
                  {isTamanhoOpen ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                </div>
                {isTamanhoOpen && (
                  <div className="absolute top-full left-0 w-full bg-[#1a1a1a] border border-[#333] mt-1 shadow-lg max-h-48 overflow-y-auto">
                    {["PP", "P", "M", "G", "GG", "XG"].map((opcao) => (
                      <div 
                        key={opcao}
                        onClick={() => {setTamanho(opcao); setIsTamanhoOpen(false);}}
                        className="p-3 text-gray-300 hover:bg-[#333] cursor-pointer border-b border-[#222] last:border-0"
                      >
                        {opcao}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border border-[#333] bg-[#1a1a1a] flex items-start gap-3 p-3 focus-within:border-[#555] transition-colors mt-2">
                <PenLine size={20} className="text-gray-500 mt-1 shrink-0" strokeWidth={1.5} />
                <textarea 
                  placeholder="Observações..."
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  rows="4"
                  className="bg-transparent w-full text-gray-200 outline-none placeholder-gray-500 resize-none"
                ></textarea>
              </div>

            </div>
          </div>

          {/* === BOTÕES DE AÇÃO === */}
          <div className="flex flex-col gap-3 mt-4">
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold text-lg py-4 flex items-center justify-center transition-colors"
            >
              {loading ? "Cadastrando..." : "Cadastrar"}
            </button>
            
            <button 
              type="button"
              // REDIRECIONA PARA A PÁGINA DA LANA NO CANCELAMENTO
              onClick={() => router.push("/coordenador/equipe")}
              className="w-full bg-[#2a2a2a] border border-[#333] hover:bg-[#333] text-gray-300 font-medium text-lg py-4 flex items-center justify-center transition-colors"
            >
              Cancelar
            </button>
          </div>

        </form>
      </div>

      {/* ===== BARRA INFERIOR FIXA ===== */}
      <div className="fixed bottom-0 left-0 w-full bg-[#111111] p-4 flex flex-col border-t border-[#222] z-40">
        <div className="w-full border border-[#333] p-3 flex justify-between items-center bg-[#1a1a1a]">
          <div className="w-9 h-9 flex items-center justify-center opacity-40 grayscale">
            <img src="/icon.png" alt="Logo" className="h-full object-contain" onError={(e) => e.target.style.display='none'} />
          </div>
          
          <button 
            // REDIRECIONA PARA O MENU INICIAL DO COORDENADOR
            onClick={() => router.push("/coordenador")}
            className="p-2 border border-[#444] bg-transparent hover:bg-[#2a2a2a] transition-colors cursor-pointer"
          >
            <Menu size={26} className="text-gray-400" strokeWidth={1.5} />
          </button>
        </div>
      </div>

    </div>
  );
}