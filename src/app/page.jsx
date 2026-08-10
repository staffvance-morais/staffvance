"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Mail, LockKeyhole } from "lucide-react";

// Configuração do Supabase usando as variáveis de ambiente
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
    <div className="min-h-screen p-6 bg-neutral-900 flex flex-col items-center justify-center relative font-sans text-center rounded-none">
      <div className="w-full max-w-sm flex flex-col items-center relative">
        {/* Alerta de Erro no Topo */}
        {erro && (
          <div className="w-full bg-[#9f201d] text-white text-center py-3 px-4 mb-6 text-sm font-semibold shadow-md">
            {erro}
          </div>
        )}

        {/* Interface */}
        <div className="w-full max-w-full bg-neutral-800 px-6 py-12 border-2 border-neutral-700 flex flex-col gap-4 items-center text-center">
          {/* Logo */}
          <Image
            src="/logo_full_gray.svg"
            alt="Wadjet Segurança"
            width={0}
            height={0}
            sizes="100vw"
            priority
            className="w-64 h-auto object-contain"
          />

          {/* Divisor */}
          <div className="w-full h-px bg-neutral-600"></div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
            {/* Input E-mail */}
            <div className="flex w-full items-center gap-4 bg-neutral-700 border-2 border-neutral-600 px-4 py-2 text-neutral-400 transition-all focus-within:border-neutral-500">
              <Mail className="w-6 h-6 shrink-0" />
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent text-lg outline-none placeholder:text-neutral-400"
              />
            </div>

            {/* Input Senha */}
            <div className="flex w-full items-center gap-4 bg-neutral-700 border-2 border-neutral-600 px-4 py-2 text-neutral-400 transition-all focus-within:border-neutral-500">
              <LockKeyhole className="w-6 h-6 shrink-0" />
              <input
                type="password"
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="w-full bg-transparent text-lg outline-none placeholder:text-neutral-400"
              />
            </div>

            {/* Entrar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 border-green-500 border-2 text-white font-semibold text-lg py-2 transition-colors hover:bg-green-500 hover:border-green-400 cursor-pointer"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

            {/* Esqueci a senha */}
            <button
              type="button"
              onClick={() => router.push("/esqueci-senha")}
              className="-mt-2 text-neutral-400 text-md underline transition-colors hover:text-neutral-300 focus:text-neutral-400 cursor-pointer"
            >
              Esqueci a senha
            </button>

            {/* Divisor */}
            <div className="w-full h-px bg-neutral-600"></div>

            {/* Cadastre-se */}
            <button
              type="button"
              onClick={() => router.push("/cadastro")}
              className="w-full bg-blue-700 text-white font-semibold text-lg py-2 transition-colors border-2 border-blue-600 hover:bg-blue-600 hover:border-blue-500 focus:bg-blue-600 focus:border-blue-500 cursor-pointer"
            >
              Cadastre-se
            </button>
          </form>
        </div>
      </div>

      {/* Rodapé */}
      <div className="absolute bottom-6 text-center text-sm text-neutral-700 flex flex-col gap-1">
        <p>© 2026 Sunset Field Solutions.</p>
        <p>Todos os direitos reservados.</p>
      </div>
    </div>
  );
}
