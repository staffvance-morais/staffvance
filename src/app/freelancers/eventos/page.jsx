"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Menu,
  ChevronRight,
  User
} from "lucide-react";

export default function EventosStaffPage() {
  const router = useRouter();

  // PROTÓTIPO: Estes dados são simulados para você ver o design.
  // Futuramente, o sistema vai buscar apenas os eventos do Supabase onde este usuário específico foi escalado.
  const [meusEventos] = useState([
    {
      id: 1,
      nome: "Fortaleza x Ceará - Clássico-Rei",
      data: "20/08/2026",
      horario: "16:00",
      local: "Estádio Presidente Vargas",
      funcao: "Segurança",
      setor: "Setor Azul (Elevador)",
      status: "Confirmado",
      destaque: true
    },
    {
      id: 2,
      nome: "Ferroviário x Floresta",
      data: "25/08/2026",
      horario: "19:30",
      local: "Estádio Presidente Vargas",
      funcao: "Staff",
      setor: "Entrada Principal (Catraca)",
      status: "Confirmado",
      destaque: false
    }
  ]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-sans flex flex-col pb-24">
      
      {/* CABEÇALHO DO STAFF */}
      <div className="px-6 py-4 bg-[#111111] border-b border-[#222] flex justify-between items-center z-30 shadow-md">
        <div className="w-10 h-10 opacity-80">
          <img src="/icon.png" alt="Wadjet Logo" className="w-full h-full object-contain" onError={(e) => e.target.style.display='none'} />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-white text-sm font-bold capitalize">Olá, Colaborador</p>
            <p className="text-[#1e50cf] text-[10px] font-bold uppercase tracking-widest">Painel Operacional</p>
          </div>
          <div className="w-10 h-10 bg-[#1a1a1a] border border-[#333] rounded-full flex items-center justify-center">
            <User size={18} className="text-gray-400" />
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-3xl mx-auto w-full flex flex-col gap-6 mt-4">
        
        {/* MENSAGEM DE BOAS VINDAS */}
        <div className="mb-2">
          <h1 className="text-2xl font-black text-white tracking-wide">Minhas Escalas</h1>
          <p className="text-gray-500 text-sm mt-1">Confira abaixo os próximos eventos em que você está escalado.</p>
        </div>

        {/* LISTAGEM DE EVENTOS */}
        <div className="flex flex-col gap-4">
          {meusEventos.map((evento) => (
            <div 
              key={evento.id} 
              className={`relative bg-[#111111] border rounded-md overflow-hidden transition-all hover:border-[#444] ${
                evento.destaque ? 'border-[#1e50cf] shadow-[0_0_15px_rgba(30,80,207,0.15)]' : 'border-[#222]'
              }`}
            >
              {/* Tarja lateral de destaque */}
              {evento.destaque && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1e50cf]"></div>
              )}

              <div className="p-5 md:p-6 pl-6">
                
                {/* Header do Card (Data e Status) */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                    <span className="text-[#1e50cf] text-xs font-bold tracking-widest uppercase mb-1">
                      Próximo Evento
                    </span>
                    <h2 className="text-xl font-bold text-white leading-tight">{evento.nome}</h2>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-green-900/20 border border-green-900/50 rounded-sm text-green-500 text-[10px] font-bold uppercase tracking-wider">
                    <CheckCircle2 size={12} />
                    {evento.status}
                  </div>
                </div>

                {/* Grid de Informações */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  
                  {/* Data e Hora */}
                  <div className="flex items-start gap-3 bg-[#161616] p-3 rounded-sm border border-[#222]">
                    <Calendar size={18} className="text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Data do Evento</p>
                      <p className="text-gray-200 text-sm font-medium">{evento.data}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-[#161616] p-3 rounded-sm border border-[#222]">
                    <Clock size={18} className="text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Horário de Chegada</p>
                      <p className="text-gray-200 text-sm font-medium">{evento.horario}</p>
                    </div>
                  </div>

                  {/* Local */}
                  <div className="flex items-start gap-3 bg-[#161616] p-3 rounded-sm border border-[#222] md:col-span-2">
                    <MapPin size={18} className="text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Local</p>
                      <p className="text-gray-200 text-sm font-medium">{evento.local}</p>
                    </div>
                  </div>

                  {/* Função e Setor (As informações mais importantes pro Staff) */}
                  <div className="flex items-start gap-3 bg-[#1a1a2e] p-3 rounded-sm border border-[#1e50cf]/30 md:col-span-2 mt-2">
                    <ShieldCheck size={18} className="text-[#1e50cf] mt-0.5" />
                    <div className="flex-1 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-[#1e50cf] uppercase tracking-widest font-bold">Sua Missão</p>
                        <p className="text-white text-sm font-bold">{evento.funcao} <span className="text-gray-400 font-normal ml-1">em</span> {evento.setor}</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-600" />
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BARRA DE NAVEGAÇÃO INFERIOR MOBILE */}
      <div className="fixed bottom-0 left-0 w-full bg-[#111] border-t border-[#222] p-4 flex justify-between items-center z-40 md:hidden">
        <button className="flex flex-col items-center gap-1 text-[#1e50cf]">
          <Calendar size={20} />
          <span className="text-[9px] uppercase tracking-widest font-bold">Escalas</span>
        </button>
        
        <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-300">
          <User size={20} />
          <span className="text-[9px] uppercase tracking-widest font-bold">Perfil</span>
        </button>

        <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-300">
          <Menu size={20} />
          <span className="text-[9px] uppercase tracking-widest font-bold">Menu</span>
        </button>
      </div>

    </div>
  );
}