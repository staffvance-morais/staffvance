"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Lock, ArrowRight } from "lucide-react";

export default function NovaSenha() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const handleAtualizarSenha = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem("");
    setErro("");

    try {
      // O Supabase já sabe quem é o usuário por causa do link seguro que ele clicou no e-mail
      const { error } = await supabase.auth.updateUser({
        password: senha
      });

      if (error) throw error;

      setMensagem("Senha atualizada com sucesso!");
      
      // Espera 2 segundinhos para a pessoa ler a mensagem de sucesso e manda pro Login
      setTimeout(() => {
        router.push("/");
      }, 2000);

    } catch (error) {
      console.error("Erro ao atualizar senha:", error);
      setErro("Houve um erro ao atualizar a senha. Tente solicitar o link novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center p-4 relative pb-24 font-sans selection:bg-[#333]">
      
      <div className="mb-10 w-48 opacity-80">
        <img 
          src="/icon.png" 
          alt="Sunset Field Solutions" 
          className="w-full h-auto object-contain" 
          onError={(e) => { e.target.style.display = 'none'; }} 
        />
      </div>

      <div className="w-full max-w-sm flex flex-col gap-6">
        
        <div className="text-center mb-2">
          <h1 className="text-xl font-bold text-[#eee] mb-2">Criar Nova Senha</h1>
          <p className="text-[#888] text-sm">
            Digite sua nova senha abaixo para acessar sua conta.
          </p>
        </div>

        <form onSubmit={handleAtualizarSenha} className="flex flex-col gap-4">
          
          {mensagem && (
            <div className="bg-[#16a34a]/20 border border-[#16a34a] text-[#4ade80] p-3 text-sm rounded-sm text-center">
              {mensagem}
            </div>
          )}
          {erro && (
            <div className="bg-[#dc2626]/20 border border-[#dc2626] text-[#f87171] p-3 text-sm rounded-sm text-center">
              {erro}
            </div>
          )}

          <div className="relative flex items-center">
            <div className="absolute left-4 text-[#777]">
              <Lock size={18} strokeWidth={1.5} />
            </div>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite a nova senha"
              required
              minLength={6}
              className="w-full bg-[#1c1c1c] border border-[#333] text-[#ddd] text-sm rounded-sm py-3 pl-11 pr-4 outline-none focus:border-[#555] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || mensagem !== ""}
            className="w-full bg-[#1db954] hover:bg-[#16a34a] text-white font-bold py-3 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex justify-center items-center gap-2"
          >
            {loading ? "Salvando..." : "Atualizar Senha"}
            {!loading && <ArrowRight size={18} strokeWidth={2} />}
          </button>
        </form>
      </div>

      <div className="absolute bottom-8 text-center text-[#555] text-xs font-medium leading-relaxed tracking-wide">
        <p>© 2026 Sunset Field Solutions.</p>
        <p>Todos os direitos reservados.</p>
      </div>

    </div>
  );
}