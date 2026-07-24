"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

// Inicializando o cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // 1. Tenta fazer a autenticação (Verificar credenciais no cofre)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      // 2. Busca o perfil do usuário logado na tabela "perfis" sem usar o .single()
      const { data: perfilData, error: perfilError } = await supabase
        .from("perfis")
        .select("role")
        .eq("id", authData.user.id);

      if (perfilError) throw perfilError;

      // Se a tabela estiver vazia, bloqueada ou o perfil não existir, ele avisa sem quebrar
      if (!perfilData || perfilData.length === 0) {
        throw new Error("Login aprovado, mas o perfil não foi encontrado na tabela.");
      }

      // 3. Redirecionamento de Página baseado no Cargo (pegando o 1º item da lista)
      if (perfilData[0].role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }

    } catch (error) {
      console.error(error);
      alert("Erro ao entrar: " + error.message);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 border border-gray-300 shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b-2 border-gray-300 pb-2">
          Entrar no StaffVance
        </h1>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-400 p-2"
            placeholder="E-mail"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-400 p-2"
            placeholder="Senha"
            required
          />
          <button 
            type="submit" 
            className="w-full bg-gray-200 border border-gray-400 p-2 hover:bg-gray-300 transition-colors mt-2"
          >
            Entrando...
          </button>
        </form>
      </div>
    </main>
  );
}