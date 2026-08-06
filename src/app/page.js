"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Mail, Lock } from "lucide-react";

// Configuração do Supabase usando as variáveis de ambiente
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro("");

    // Autenticação com o Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setErro("Cadastro não encontrado.");
      setLoading(false);
      return;
    }

    // Busca o cargo (role) do usuário na tabela 'perfis'
    const userId = data.user.id;
    const { data: perfil } = await supabase
      .from("perfis")
      .select("role")
      .eq("id", userId)
      .single();

    // Corta espaços em branco e joga tudo para minúsculo
    const userRole = perfil?.role?.toLowerCase().trim() || "";

    // Redirecionamento baseado no cargo do usuário
    if (userRole === "admin" || userRole === "owner") {
      router.push("/admin");
    } else if (userRole === "coordenador") {
      router.push("/coordenador");
    } else {
      router.push("/freelancers");
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center relative font-sans">
      
      <div className="w-full max-w-sm flex flex-col items-center relative">
        
        {/* Alerta de Erro no Topo */}
        {erro && (
          <div className="w-full bg-[#9f201d] text-white text-center py-3 px-4 mb-6 text-sm font-semibold shadow-md">
            {erro}
          </div>
        )}

        <div className="w-full px-6 flex flex-col items-center">
          {/* Logo */}
          <div className="mb-10 w-56 flex justify-center">
            <img 
              src="/logo_full_gray.svg" 
              alt="Wadjet Segurança" 
              className="w-full h-auto object-contain opacity-70" 
            />
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
            
            {/* Input E-mail */}
            <div className="relative flex items-center">
              <div className="absolute left-4 text-[#777]">
                <Mail size={20} strokeWidth={1.5} />
              </div>
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#2a2a2a] text-white text-sm outline-none py-3 pr-4 pl-12 rounded-sm border border-[#3a3a3a] focus:border-[#555] transition-all [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#2a2a2a] [&:-webkit-autofill]:-webkit-text-fill-color-white"
              />
            </div>

            {/* Input Senha */}
            <div className="relative flex items-center">
              <div className="absolute left-4 text-[#777]">
                <Lock size={20} strokeWidth={1.5} />
              </div>
              <input
                type="password"
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="w-full bg-[#2a2a2a] text-white text-sm outline-none py-3 pr-4 pl-12 rounded-sm border border-[#3a3a3a] focus:border-[#555] transition-all [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#2a2a2a] [&:-webkit-autofill]:-webkit-text-fill-color-white"
              />
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-[#1db954] hover:bg-[#16a34a] text-white font-bold text-sm py-3 rounded-sm transition-colors disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
            
            {/* Esqueci a senha */}
            <div className="text-center mt-[-4px]">
              <a href="#" className="text-[#777] text-xs underline hover:text-white transition-colors">
                Esqueci a senha
              </a>
            </div>

            {/* Divisor */}
            <div className="w-full h-[1px] bg-[#2a2a2a] my-2"></div>

            {/* Botão Cadastre-se */}
            <button
              type="button"
              onClick={() => router.push("/cadastro")}
              className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm py-3 rounded-sm transition-colors"
            >
              Cadastre-se
            </button>
          </form>
        </div>
      </div>

      {/* Rodapé */}
      <div className="absolute bottom-6 text-center text-[10px] text-[#555] flex flex-col gap-1">
        <p>© 2026 Seriguela Solutions.</p>
        <p>Todos os direitos reservados.</p>
      </div>
    </div>
  );
}