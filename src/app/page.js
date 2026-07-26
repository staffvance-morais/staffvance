"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight } from "lucide-react";

// Inicializando o cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); 
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); 

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const { data: perfilData, error: perfilError } = await supabase
        .from("perfis")
        .select("role")
        .eq("id", authData.user.id);

      if (perfilError) throw perfilError;

      if (!perfilData || perfilData.length === 0) {
        throw new Error("Login aprovado, mas o perfil não foi encontrado.");
      }

      if (perfilData[0].role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }

    } catch (error) {
      console.error(error);
      alert("Erro ao entrar: " + error.message);
      setLoading(false); 
    }
  };

  return (
    <div style={{ height: '100vh', width: '100%', backgroundColor: '#18181b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', position: 'relative', overflow: 'hidden' }}>
      
      {/* CAIXA DE LOGIN: Mais estreita (21rem), sem bordas arredondadas e sem sombras */}
      <div style={{ width: '90%', maxWidth: '21rem', backgroundColor: '#222222', border: '1px solid #4a4a4a', padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: '0', boxShadow: 'none', boxSizing: 'border-box' }}>
        
        {/* LOGO */}
        <img 
          src="/logo_full_gray.svg" 
          alt="Wadjet Segurança" 
          style={{ width: '11rem', marginBottom: '2.5rem', opacity: '0.7', objectFit: 'contain' }} 
        />

        {/* FORMULÁRIO */}
        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxSizing: 'border-box' }}>
          
          {/* E-MAIL */}
          <div style={{ position: 'relative', width: '100%' }}>
            {/* Ícone com stroke mais grosso e cor mais clara */}
            <Mail style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3', width: '1.25rem', height: '1.25rem' }} strokeWidth={2.5} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              required
              style={{ width: '100%', backgroundColor: '#333333', border: '1px solid #5c5c5c', color: '#ffffff', padding: '0.875rem 1rem 0.875rem 3.25rem', borderRadius: '0', fontSize: '1rem', fontWeight: '400', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* SENHA */}
          <div style={{ position: 'relative', width: '100%' }}>
             {/* Ícone com stroke mais grosso e cor mais clara */}
            <Lock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3', width: '1.25rem', height: '1.25rem' }} strokeWidth={2.5} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              required
              style={{ width: '100%', backgroundColor: '#333333', border: '1px solid #5c5c5c', color: '#ffffff', padding: '0.875rem 1rem 0.875rem 3.25rem', borderRadius: '0', fontSize: '1rem', fontWeight: '400', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* BOTÃO ENTRAR: Sem contorno, mesma largura dos inputs, quadrado */}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', backgroundColor: '#1ea853', color: '#ffffff', border: 'none', padding: '0.875rem', fontSize: '1.125rem', fontWeight: '600', borderRadius: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.25rem', boxSizing: 'border-box' }}
          >
            {loading ? (
              "Entrando..."
            ) : (
              <>
                {/* Seta branca e mais grossa */}
                <ArrowRight style={{ color: '#ffffff', width: '1.5rem', height: '1.5rem' }} strokeWidth={3} />
                Entrar
              </>
            )}
          </button>
        </form>

        {/* TEXTO DE AJUDA: Quebra de linha adicionada para bater com o design */}
        <div style={{ marginTop: '2rem', color: '#737373', fontSize: '0.875rem', textAlign: 'center', lineHeight: '1.5' }}>
          Primeiro acesso?<br />Contate o administrador.
        </div>
      </div>

      {/* DIREITOS RESERVADOS: Quebra de linha adicionada */}
      <div style={{ position: 'absolute', bottom: '2rem', color: '#525252', fontSize: '0.875rem', textAlign: 'center', width: '100%', lineHeight: '1.5' }}>
        © 2026 Seriguela Solutions.<br />Todos os direitos reservados.
      </div>

    </div>
  );
}