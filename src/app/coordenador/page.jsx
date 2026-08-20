"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { 
  Home, 
  Users, 
  Calendar, 
  Menu, 
  X, 
  ChevronDown 
} from "lucide-react";

// Conectando com o Supabase usando as chaves do Netlify
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function PainelCoordenadora() {
  const router = useRouter();
  const [menuAberto, setMenuAberto] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false); // Trava de segurança

  // ==========================================
  // TRAVA DE SEGURANÇA: Verifica o cargo (role)
  // ==========================================
  useEffect(() => {
    async function checkSecurity() {
      // 1. Pega quem é o usuário logado
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/"); // Não está logado? Volta pro início.
        return;
      }

      // 2. Consulta a tabela de perfis
      const { data: perfil } = await supabase
        .from("perfis")
        .select("role")
        .eq("id", user.id)
        .single();

      // 3. O Julgamento: É coordenador ou admin?
      if (!perfil || (perfil.role !== "coordenador" && perfil.role !== "admin")) {
        // Se for freelancer, chuta pra fora
        router.push("/freelancers");
      } else {
        // Se tiver permissão, destranca a tela
        setIsAuthorized(true);
      }
    }

    checkSecurity();
  }, [router]);

  // Tela de carregamento anti-flicker (evita que a tela pisque antes de bloquear)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <span className="text-gray-500 font-medium animate-pulse">Verificando credenciais...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-gray-300 font-sans flex flex-col relative overflow-hidden">
      
      {/* Cabeçalho */}
      <div className="p-4 flex flex-col pt-6">
        <div className="flex items-center gap-3 mb-3">
          <Home size={22} className="text-gray-400" strokeWidth={1.5} />
          <span className="text-gray-300 text-base tracking-wide">Página inicial</span>
        </div>
        <div className="w-full h-px bg-[#333]"></div>
      </div>

      {/* Centro - Mensagem */}
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Em desenvolvimento</p>
      </div>

      {/* Barra de Navegação Inferior */}
      <div className="p-4">
        <div className="w-full border border-[#333] p-3 flex justify-between items-center bg-[#1a1a1a] rounded-sm">
          <div className="w-9 h-9 flex items-center justify-center opacity-40 grayscale">
             <img src="/icon.png" alt="Logo" className="h-full object-contain" />
          </div>
          
          <button 
            onClick={() => setMenuAberto(true)}
            className="p-2 border border-[#444] rounded-sm bg-transparent hover:bg-[#2a2a2a] transition-colors"
          >
            <Menu size={26} className="text-gray-400" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* OVERLAY DO MENU */}
      {menuAberto && (
        <div className="absolute inset-0 z-50 bg-[#141414] flex flex-col p-4 animate-in fade-in duration-200">
          
          <div className="flex justify-between items-start mb-6 pt-2">
            <div className="text-gray-500 text-sm leading-snug">
              <p>© 2026 Sunset Field Solutions.</p>
              <p>Todos os direitos reservados.</p>
              <p className="mt-4 text-gray-400">Perfil da Coordenação - Protótipo</p>
            </div>
            
            <button 
              onClick={() => setMenuAberto(false)}
              className="p-2 border border-[#333] rounded-sm flex items-center justify-center text-gray-400 hover:bg-[#2a2a2a] transition-colors"
            >
              <X size={24} strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex flex-col gap-2 flex-1">
            
            <button 
              onClick={() => setMenuAberto(false)}
              className="w-full border border-[#333] bg-[#1e1e1e] p-4 flex items-center gap-4 text-gray-300 text-lg hover:bg-[#2a2a2a] transition-colors rounded-sm"
            >
              <Home size={24} strokeWidth={1.5} className="text-gray-400" />
              <span>Página inicial</span>
            </button>

            <button 
              onClick={() => router.push("/coordenador/equipe")}
              className="w-full border border-[#333] bg-[#1e1e1e] p-4 flex items-center gap-4 text-gray-300 text-lg hover:bg-[#2a2a2a] transition-colors rounded-sm"
            >
              <Users size={24} strokeWidth={1.5} className="text-gray-400" />
              <span>Equipe</span>
            </button>

            {/* AQUI ESTÁ A CORREÇÃO DO LINK DE EVENTOS */}
            <button 
              onClick={() => router.push("/coordenador/eventos")}
              className="w-full border border-[#333] bg-[#1e1e1e] p-4 flex items-center gap-4 text-gray-300 text-lg hover:bg-[#2a2a2a] transition-colors rounded-sm"
            >
              <Calendar size={24} strokeWidth={1.5} className="text-gray-400" />
              <span>Eventos</span>
            </button>

            <div className="w-full border border-[#333] bg-[#1e1e1e] p-3 mt-2 flex gap-3 cursor-pointer hover:bg-[#2a2a2a] transition-colors rounded-sm">
              <div className="w-16 h-16 bg-white shrink-0 rounded-sm"></div>
              
              <div className="flex flex-col justify-center">
                <h3 className="text-white font-bold text-lg leading-tight">Lana</h3>
                <p className="text-gray-400 text-sm mt-1">Toque para saber mais</p>
              </div>
            </div>

          </div>

          <div className="w-full border border-[#333] p-3 flex justify-between items-center bg-[#1a1a1a] rounded-sm mt-4">
            <div className="w-9 h-9 flex items-center justify-center opacity-40 grayscale">
              <img src="/icon.png" alt="Logo" className="h-full object-contain" />
            </div>
            
            <button 
              onClick={() => setMenuAberto(false)}
              className="p-2 border border-[#444] rounded-sm bg-transparent hover:bg-[#2a2a2a] transition-colors"
            >
              <ChevronDown size={26} className="text-gray-400" strokeWidth={1.5} />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}