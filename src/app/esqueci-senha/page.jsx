"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Mail, ArrowLeft } from "lucide-react";

export default function EsqueciSenha() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const handleRecuperarSenha = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem("");
    setErro("");

    try {
      // O Supabase envia um e-mail com um link seguro. 
      // O redirectTo é para onde o usuário volta após clicar no link do e-mail.
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/nova-senha`,
      });

      if (error) throw error;

      setMensagem("Link de recuperação enviado! Verifique sua caixa de entrada ou spam.");
    } catch (error) {
      console.error("Erro ao recuperar senha:", error);
      setErro("Não foi possível enviar o e-mail. Verifique se o endereço está correto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center p-4 font-sans selection:bg-[#333]">
      
      {/* Logo */}
      <div className="mb-10 w-48 opacity-80">
        <img 
          src="/icon.png" 
          alt="Wadjet Segurança" 
          className="w-full h-auto object-contain" 
          onError={(e) => { e.target.style.display = 'none'; }} 
        />
      </div>

      <div className="w-full max-w-sm flex flex-col gap-6">
        
        <div className="text-center mb-2">
          <h1 className="text-xl font-bold text-[#eee] mb-2">Recuperar Senha</h1>
          <p className="text-[#888] text-sm">
            Digite seu e-mail cadastrado e enviaremos um link para redefinir sua senha.
          </p>
        </div>

        <form onSubmit={handleRecuperarSenha} className="flex flex-col gap-4">
          
          {/* Mensagens de Sucesso ou Erro */}
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

          {/* Campo de E-mail */}
          <div className="relative flex items-center">
            <div className="absolute left-4 text-[#777]">
              <Mail size={18} strokeWidth={1.5} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              required
              className="w-full bg-[#1c1c1c] border border-[#333] text-[#ddd] text-sm rounded-sm py-3 pl-11 pr-4 outline-none focus:border-[#555] transition-colors"
            />
          </div>

          {/* Botão Enviar (Verde) */}
          <button
            type="submit"
            disabled={loading || mensagem !== ""}
            className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-bold py-3 rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </button>

          {/* Botão Voltar (Azul) */}
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold py-3 rounded-sm transition-colors flex items-center justify-center gap-2 mt-4"
          >
            <ArrowLeft size={18} strokeWidth={2} />
            Voltar para o Login
          </button>

        </form>
      </div>

      {/* Rodapé Legal */}
      <div className="absolute bottom-8 text-center text-[#555] text-xs font-medium leading-relaxed tracking-wide">
        <p>© 2026 Sunset Field Solutions.</p>
        <p>Todos os direitos reservados.</p>
      </div>

    </div>
  );
}