"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Home, 
  Contact, 
  Handshake, 
  Calendar, 
  ClipboardList, 
  Wallet, 
  Menu, 
  X, 
  ChevronDown 
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function DashboardAdmin() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSair = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    // Utilizamos h-screen e overflow-hidden para garantir que o rodapé não suma da tela
    <div className="h-screen w-full bg-[#141414] text-gray-300 font-sans flex flex-col relative overflow-hidden">
      
      {/* ===== TELA PRINCIPAL (Menu Fechado) ===== */}
      
      {/* Cabeçalho (Fiel à segunda imagem, com a linha separadora) */}
      <div className="p-5 flex flex-col">
        <div className="flex items-center gap-3 mb-3">
          <Home size={20} className="text-gray-400" />
          <span className="text-gray-300 text-sm tracking-wide">Página inicial</span>
        </div>
        <div className="w-full h-px bg-[#333]"></div>
      </div>

      {/* Centro (Em desenvolvimento) */}
      <div className="flex-1 flex items-center justify-center">
        <span className="text-[#666] text-lg font-medium">Em desenvolvimento</span>
      </div>

      {/* Barra Inferior (Fiel à segunda imagem, em formato de caixa) */}
      <div className="p-4 w-full">
        <div className="w-full border border-[#333] p-3 flex justify-between items-center bg-[#1a1a1a]">
          {/* Logo */}
          <div className="w-10 h-10 flex items-center justify-center opacity-50">
            <img src="/icon.png" alt="Logo Wadjet" className="h-full object-contain" />
          </div>
          
          {/* Botão de Menu (Três linhas) */}
          <button 
            onClick={() => setIsMenuOpen(true)} 
            className="p-2 border border-[#444] rounded-sm bg-transparent hover:bg-[#2a2a2a] transition-colors"
          >
            <Menu size={28} className="text-gray-400" strokeWidth={1.5} />
          </button>
        </div>
      </div>


      {/* ===== MENU ABERTO (Fiel à terceira imagem) ===== */}
      
      {isMenuOpen && (
        <div className="absolute inset-0 bg-[#1e1e1e] z-50 flex flex-col p-5 overflow-y-auto">
          
          {/* Cabeçalho do Menu (Copyright e Botão Fechar) */}
          <div className="flex justify-between items-start mb-6">
            <div className="text-xs text-gray-500 leading-tight">
              <p>© 2026 Seriguela Solutions.</p>
              <p>Todos os direitos reservados.</p>
            </div>
            <button 
              onClick={() => setIsMenuOpen(false)} 
              className="p-2 border border-[#444] rounded-sm bg-transparent text-gray-400 hover:bg-[#2a2a2a] transition-colors"
            >
              <X size={24} strokeWidth={1.5} />
            </button>
          </div>

          {/* Lista de Navegação */}
          <div className="flex flex-col gap-2 flex-1">
            <MenuButton icon={<Home size={22} strokeWidth={1.5} />} text="Página inicial" href="/dashboard" />
            <MenuButton icon={<Contact size={22} strokeWidth={1.5} />} text="Equipe" href="/admin/funcionarios" />
            <MenuButton icon={<Handshake size={22} strokeWidth={1.5} />} text="Clientes" href="#" />
            <MenuButton icon={<Calendar size={22} strokeWidth={1.5} />} text="Eventos" href="#" />
            <MenuButton icon={<ClipboardList size={22} strokeWidth={1.5} />} text="Escalas" href="#" />
            <MenuButton icon={<Wallet size={22} strokeWidth={1.5} />} text="Financeiro" href="#" />
          </div>

          {/* Card do Morais (Perfil e Sair) */}
          <div 
            onClick={handleSair}
            className="mt-4 border border-[#333] bg-[#262626] p-3 flex items-center gap-4 cursor-pointer hover:bg-[#2a2a2a] transition-colors"
          >
            <div className="w-14 h-14 bg-white rounded-sm"></div>
            <div className="flex-1">
              <p className="font-bold text-gray-200 text-lg">Morais</p>
              <p className="text-sm text-gray-400">Toque para saber mais</p>
            </div>
          </div>

          {/* Barra Inferior do Menu */}
          <div className="mt-4 pt-4 border-t border-[#333] flex justify-between items-center">
            <div className="w-8 h-8 flex items-center justify-center opacity-50">
               <img src="/icon.png" alt="Logo Wadjet" className="h-full object-contain" />
            </div>
            <button 
              onClick={() => setIsMenuOpen(false)} 
              className="p-2 border border-[#444] rounded-sm bg-transparent text-gray-400 hover:bg-[#2a2a2a] transition-colors"
            >
              <ChevronDown size={24} strokeWidth={1.5} />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

/* Componente Auxiliar para os Botões do Menu */
function MenuButton({ icon, text, href }) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-4 p-4 border border-[#333] bg-[#262626] text-gray-300 hover:bg-[#2a2a2a] transition-colors"
    >
      <div className="text-gray-400">
        {icon}
      </div>
      <span className="text-lg tracking-wide">{text}</span>
    </Link>
  );
}