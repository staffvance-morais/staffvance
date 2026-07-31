"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Mail, Lock, ArrowRight } from "lucide-react";

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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setErro("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    const userId = data.user.id;
    const { data: perfil } = await supabase
      .from("perfis")
      .select("role")
      .eq("id", userId)
      .single();

    // Corta espaços em branco e joga tudo para minúsculo
    const userRole = perfil?.role?.toLowerCase().trim() || "";
    
    // Imprime no console
    console.log("O cargo exato que veio do banco é:", `"${userRole}"`); 

  
    // Redirecionamento baseado no cargo do usuário
    if (userRole === "admin" || userRole === "owner") {
      router.push("/admin"); 
    } else if (userRole === "coordenador") {
      router.push("/coordenador"); 
    } else {
      router.push("/funcionarios"); 
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center relative font-sans">
      <div className="bg-[#1e1e1e] p-8 rounded-md border border-[#2a2a2a] w-full max-w-sm flex flex-col items-center shadow-2xl">
        <div className="mb-8 w-48 flex justify-center">
          <img src="/logo_full_gray.svg" alt="Wadjet Segurança" className="w-full h-auto object-contain opacity-80" />
        </div>

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          <div className="relative flex items-center">
            <div className="absolute left-4 text-gray-500"><Mail size={18} strokeWidth={2} /></div>
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#2a2a2a] text-white font-semibold outline-none py-3 pr-4 pl-12 rounded-sm border border-[#333] focus:border-[#444] transition-all [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#2a2a2a] [&:-webkit-autofill]:-webkit-text-fill-color-white"
            />
          </div>

          <div className="relative flex items-center">
            <div className="absolute left-4 text-gray-500"><Lock size={18} strokeWidth={2} /></div>
            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="w-full bg-[#2a2a2a] text-white font-semibold outline-none py-3 pr-4 pl-12 rounded-sm border border-[#333] focus:border-[#444] transition-all [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#2a2a2a] [&:-webkit-autofill]:-webkit-text-fill-color-white"
            />
          </div>

          {erro && <p className="text-red-500 text-sm text-center font-semibold mt-1">{erro}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-[#1ed760] hover:bg-[#1db954] text-gray-900 font-bold text-base py-3 rounded-sm flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? "Entrando..." : <><ArrowRight size={20} strokeWidth={2.5} /> Entrar</>}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-500 flex flex-col gap-1">
          <p>Primeiro acesso?</p>
          <p>Contate o administrador.</p>
        </div>
      </div>

      <div className="absolute bottom-6 text-center text-xs text-[#555] flex flex-col gap-1">
        <p>© 2026 Seriguela Solutions.</p>
        <p>Todos os direitos reservados.</p>
      </div>
    </div>
  );
}