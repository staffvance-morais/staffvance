"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Home, 
  Users, 
  Handshake, 
  Calendar, 
  ClipboardList, 
  Menu, 
  X, 
  ChevronDown 
} from "lucide-react";

export default function PainelCoordenadora() {
  const router = useRouter();
  // Estado para controlar se o menu está aberto ou fechado
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="min-h-screen bg-[#141414] text-gray-300 font-sans flex flex-col relative overflow-hidden">
      
      {/* =========================================================
          TELA PRINCIPAL: "Em desenvolvimento" (Terceira Imagem) 
          ========================================================= */}
      
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

      {/* Barra de Navegação Inferior (Tela Inicial) */}
      <div className="p-4">
        <div className="w-full border border-[#333] p-3 flex justify-between items-center bg-[#1a1a1a] rounded-sm">
          <div className="w-9 h-9 flex items-center justify-center opacity-40 grayscale">
             {/* Logo provisória da Wadjet */}
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

      {/* =========================================================
          OVERLAY DO MENU: Painel da Lana (Primeira Imagem)
          Só aparece se 'menuAberto' for true
          ========================================================= */}
      
      {menuAberto && (
        <div className="absolute inset-0 z-50 bg-[#141414] flex flex-col p-4 animate-in fade-in duration-200">
          
          {/* Topo do Menu: Créditos e Botão Fechar */}
          <div className="flex justify-between items-start mb-6 pt-2">
            <div className="text-gray-500 text-sm leading-snug">
              <p>© 2026 Seriguela Solutions.</p>
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

          {/* Lista de Botões de Navegação (SEM O FINANCEIRO) */}
          <div className="flex flex-col gap-2 flex-1">
            
            <button 
              onClick={() => setMenuAberto(false)}
              className="w-full border border-[#333] bg-[#1e1e1e] p-4 flex items-center gap-4 text-gray-300 text-lg hover:bg-[#2a2a2a] transition-colors rounded-sm"
            >
              <Home size={24} strokeWidth={1.5} className="text-gray-400" />
              <span>Página inicial</span>
            </button>

            <button 
              onClick={() => router.push("/coordenador/equipe")} // Ajuste a rota se necessário
              className="w-full border border-[#333] bg-[#1e1e1e] p-4 flex items-center gap-4 text-gray-300 text-lg hover:bg-[#2a2a2a] transition-colors rounded-sm"
            >
              <Users size={24} strokeWidth={1.5} className="text-gray-400" />
              <span>Equipe</span>
            </button>

            <button className="w-full border border-[#333] bg-[#1e1e1e] p-4 flex items-center gap-4 text-gray-300 text-lg hover:bg-[#2a2a2a] transition-colors rounded-sm">
              <Handshake size={24} strokeWidth={1.5} className="text-gray-400" />
              <span>Clientes</span>
            </button>

            <button className="w-full border border-[#333] bg-[#1e1e1e] p-4 flex items-center gap-4 text-gray-300 text-lg hover:bg-[#2a2a2a] transition-colors rounded-sm">
              <Calendar size={24} strokeWidth={1.5} className="text-gray-400" />
              <span>Eventos</span>
            </button>

            <button className="w-full border border-[#333] bg-[#1e1e1e] p-4 flex items-center gap-4 text-gray-300 text-lg hover:bg-[#2a2a2a] transition-colors rounded-sm">
              <ClipboardList size={24} strokeWidth={1.5} className="text-gray-400" />
              <span>Escalas</span>
            </button>

            {/* Perfil da Lana */}
            <div className="w-full border border-[#333] bg-[#1e1e1e] p-3 mt-2 flex gap-3 cursor-pointer hover:bg-[#2a2a2a] transition-colors rounded-sm">
              {/* Espaço para a foto em branco como no design */}
              <div className="w-16 h-16 bg-white shrink-0 rounded-sm"></div>
              
              <div className="flex flex-col justify-center">
                <h3 className="text-white font-bold text-lg leading-tight">Lana</h3>
                <p className="text-gray-400 text-sm mt-1">Toque para saber mais</p>
              </div>
            </div>

          </div>

          {/* Barra Inferior do Menu Aberto (com a setinha para baixo) */}
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