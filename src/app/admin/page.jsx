"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Home, 
  Menu, 
  X, 
  Contact2, 
  Handshake, 
  CopyPlus, 
  CalendarClock, 
  Wallet,
  ChevronDown
} from "lucide-react";

export default function AdminPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  // ==========================================
  // TELA 2: MENU ABERTO
  // ==========================================
  if (isMenuOpen) {
    return (
      <div className="min-h-screen bg-[#111111] text-gray-400 font-sans flex flex-col p-5">
        
        {/* Topo: Copyright e Botão Fechar */}
        <div className="flex justify-between items-start mb-8">
          <div className="text-xs text-[#555] font-medium leading-relaxed mt-2">
            © 2026 Seriguela Solutions.<br/>
            Todos os direitos reservados.
          </div>
          <button 
            onClick={() => setIsMenuOpen(false)}
            className="border border-[#333] bg-[#1a1a1a] p-2 flex items-center justify-center hover:bg-[#222] transition-colors cursor-pointer"
          >
            <X size={24} className="text-gray-400" strokeWidth={1.5} />
          </button>
        </div>

        {/* Lista de Navegação */}
        <div className="flex flex-col gap-2 mb-8">
          <button 
            onClick={() => setIsMenuOpen(false)}
            className="border border-[#333] bg-[#1a1a1a] flex items-center gap-4 p-4 hover:bg-[#222] transition-colors text-left cursor-pointer"
          >
            <Home size={22} className="text-gray-400" strokeWidth={1.5} />
            <span className="text-gray-200 text-lg">Página inicial</span>
          </button>

          {/* Botão Equipe configurado com a rota correta do Morais */}
          <button 
             onClick={() => router.push("/admin/funcionarios")}
            className="border border-[#333] bg-[#1a1a1a] flex items-center gap-4 p-4 hover:bg-[#222] transition-colors text-left cursor-pointer"
          >
            <Contact2 size={22} className="text-gray-400" strokeWidth={1.5} />
            <span className="text-gray-200 text-lg">Equipe</span>
          </button>

          <button className="border border-[#333] bg-[#1a1a1a] flex items-center gap-4 p-4 hover:bg-[#222] transition-colors text-left cursor-pointer">
            <Handshake size={22} className="text-gray-400" strokeWidth={1.5} />
            <span className="text-gray-200 text-lg">Clientes</span>
          </button>

          <button className="border border-[#333] bg-[#1a1a1a] flex items-center gap-4 p-4 hover:bg-[#222] transition-colors text-left cursor-pointer">
            <CopyPlus size={22} className="text-gray-400" strokeWidth={1.5} />
            <span className="text-gray-200 text-lg">Eventos</span>
          </button>

          <button className="border border-[#333] bg-[#1a1a1a] flex items-center gap-4 p-4 hover:bg-[#222] transition-colors text-left cursor-pointer">
            <CalendarClock size={22} className="text-gray-400" strokeWidth={1.5} />
            <span className="text-gray-200 text-lg">Escalas</span>
          </button>

          <button className="border border-[#333] bg-[#1a1a1a] flex items-center gap-4 p-4 hover:bg-[#222] transition-colors text-left cursor-pointer">
            <Wallet size={22} className="text-gray-400" strokeWidth={1.5} />
            <span className="text-gray-200 text-lg">Financeiro</span>
          </button>
        </div>

        {/* Card do Usuário (Morais) */}
        <div className="border border-[#333] bg-[#1a1a1a] flex items-center gap-4 p-3 mb-8 cursor-pointer hover:bg-[#222] transition-colors">
          <div className="w-14 h-14 bg-white flex-shrink-0"></div>
          <div className="flex flex-col">
            <span className="text-gray-200 font-bold text-lg leading-tight">Morais</span>
            <span className="text-gray-500 text-sm">Toque para saber mais</span>
          </div>
        </div>

        {/* Rodapé do Menu */}
        <div className="mt-auto flex justify-between items-end border-t border-[#333] pt-6">
          <div className="w-10 h-10 opacity-40 grayscale">
            <img src="/icon.png" alt="Wadjet Logo" className="w-full h-full object-contain" onError={(e) => e.target.style.display='none'} />
          </div>
          <button className="border border-[#333] bg-[#1a1a1a] p-2 flex items-center justify-center hover:bg-[#222] transition-colors cursor-pointer">
            <ChevronDown size={24} className="text-gray-400" strokeWidth={1.5} />
          </button>
        </div>

      </div>
    );
  }

  // ==========================================
  // TELA 1: PÁGINA INICIAL (Em Desenvolvimento)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#111111] text-gray-400 font-sans flex flex-col relative pb-24">
      
      {/* Cabeçalho */}
      <div className="px-6 py-5 border-b border-[#333]">
        <div className="flex items-center gap-3">
          <Home size={20} className="text-gray-300" strokeWidth={1.5} />
          <span className="text-gray-300 text-sm font-medium">Página inicial</span>
        </div>
      </div>

      {/* Centro (Em desenvolvimento) */}
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#666] text-lg font-medium">Em desenvolvimento</p>
      </div>

      {/* Barra de Navegação Inferior */}
      <div className="fixed bottom-6 w-[calc(100%-3rem)] mx-6 border border-[#333] bg-[#1a1a1a] p-3 flex justify-between items-center z-40">
        <div className="w-8 h-8 opacity-40 grayscale ml-2">
          <img src="/icon.png" alt="Wadjet Logo" className="w-full h-full object-contain" onError={(e) => e.target.style.display='none'} />
        </div>
        
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="border border-[#333] bg-[#222] p-2 flex items-center justify-center hover:bg-[#333] transition-colors cursor-pointer"
        >
          <Menu size={24} className="text-gray-400" strokeWidth={1.5} />
        </button>
      </div>

    </div>
  );
}