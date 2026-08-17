"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { 
  Search, 
  Handshake, 
  Info, 
  Check, 
  Filter, 
  ChevronUp, 
  Menu,
  Loader2 
} from "lucide-react";

// Conexão com o Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ==========================================
// COMPONENTE: CARD DO CLIENTE
// ==========================================
const ClienteCard = ({ nome, representante, foto, selected }) => {
  return (
    <div className="border border-[#3a3a3a] bg-[#222222] flex p-3 mb-3 rounded-sm relative">
      
      {/* Imagem do Cliente com Checkbox sobreposto */}
      <div className="w-[70px] h-[70px] bg-[#1a1a1a] mr-4 shrink-0 relative border border-[#444]">
        {foto ? (
          <img src={foto} alt={nome} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-[#666] text-center p-1">Sem Imagem</div>
        )}
        
        {/* Checkbox no topo esquerdo da foto */}
        <div className={`absolute -top-2 -left-2 w-5 h-5 border ${selected ? 'bg-[#2563eb] border-[#2563eb]' : 'bg-[#1a1a1a] border-[#444]'} flex items-center justify-center rounded-sm`}>
          {selected && <Check size={14} className="text-white" strokeWidth={3} />}
        </div>
      </div>

      {/* Detalhes do Cliente */}
      <div className="flex-1 flex justify-between items-end">
        <div className="pb-1">
          <h3 className="text-[#e5e5e5] text-[18px] font-semibold leading-tight">{nome}</h3>
          <p className="text-[#999999] text-[14px] mt-1">{representante}</p>
        </div>
        
        {/* Botão de Info */}
        <button className="w-9 h-9 border border-[#444] rounded-sm bg-[#2a2a2a] flex items-center justify-center text-[#999] hover:bg-[#333] transition-colors cursor-pointer">
          <Info size={20} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};

// ==========================================
// PÁGINA PRINCIPAL: CLIENTES
// ==========================================
export default function PainelClientes() {
  const router = useRouter(); // Roteador para fazer o botão Voltar funcionar
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        // Busca os clientes na tabela do Supabase
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn("Aviso: Tabela de clientes vazia ou não encontrada.", error.message);
          setClientes([]);
          return;
        }

        if (data) {
          const clientesFormatados = data.map(cli => ({
            id: cli.id,
            nome: cli.nome || "Cliente sem nome",
            // Ajuste o campo 'representante' para o nome da coluna que você usa no banco
            representante: cli.representante || cli.nome_fantasia || "Sem representante", 
            foto: cli.foto_url || cli.logo_url || null,
            selected: false // Deixando desmarcado por padrão
          }));
          setClientes(clientesFormatados);
        }
      } catch (error) {
        console.error("Erro ao buscar clientes:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, []);

  // Filtro da barra de pesquisa
  const clientesFiltrados = clientes.filter(cli => 
    cli.nome.toLowerCase().includes(busca.toLowerCase()) ||
    cli.representante.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#171717] font-sans flex flex-col items-center justify-center">
      
      {/* Container Principal */}
      <div className="w-full max-w-[400px] h-[100dvh] flex flex-col p-4 bg-[#171717] relative">
        
        {/* CABEÇALHO */}
        <div className="flex items-center gap-3 text-[#cccccc] pb-3 border-b border-[#333333]">
          <Handshake size={20} strokeWidth={1.5} />
          <h1 className="text-[17px] tracking-wide">Clientes</h1>
        </div>

        {/* BARRA DE PESQUISA */}
        <div className="mt-4 relative shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777]" size={22} strokeWidth={1.5} />
          <input 
            type="text" 
            placeholder="Toque para pesquisar" 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-[#2a2a2a] border border-[#3a3a3a] text-[#e5e5e5] py-3.5 pl-[46px] pr-4 outline-none text-[17px] rounded-sm placeholder:text-[#777] focus:border-[#555] transition-colors" 
          />
        </div>

        {/* CONTAGEM DE LISTA */}
        <div className="mt-4 mb-3 text-[14px] text-[#999999] tracking-wide shrink-0">
          Listando {clientesFiltrados.length} de {clientes.length} - <span className="text-[#e5e5e5] font-semibold">0 selecionados</span>
        </div>

        {/* ÁREA DE ROLAGEM DOS CARDS */}
        <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#777]">
              <Loader2 className="animate-spin mb-2" size={28} />
              <p className="text-sm">Carregando clientes...</p>
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="text-center py-20 text-[#777] bg-[#222] rounded-sm border border-[#333]">
              <p className="font-semibold text-[#e5e5e5] mb-1">Nenhum cliente encontrado.</p>
            </div>
          ) : (
            clientesFiltrados.map((cli) => (
              <ClienteCard 
                key={cli.id}
                nome={cli.nome}
                representante={cli.representante}
                foto={cli.foto}
                selected={cli.selected}
              />
            ))
          )}
        </div>

        {/* ÁREA INFERIOR FIXA (BOTÕES E MENU) */}
        <div className="shrink-0 pt-2 flex flex-col gap-3 bg-[#171717]">
          
          {/* Botão de Cadastrar com Link configurado */}
          <Link 
            href="/admin/clientes/cadastrar"
            className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white flex items-center justify-center font-semibold py-4 text-[18px] tracking-wide rounded-sm transition-colors shadow-sm cursor-pointer"
          >
            Cadastrar cliente
          </Link>

          {/* Botão Mais Opções */}
          <button className="w-full bg-[#2a2a2a] border border-[#3a3a3a] hover:bg-[#333] text-[#a3a3a3] py-[14px] flex items-center justify-between px-4 rounded-sm transition-colors cursor-pointer">
            <div className="flex items-center gap-3 text-[17px] tracking-wide">
              <Filter size={22} strokeWidth={1.5} /> Mais opções...
            </div>
            <div className="p-0.5 border border-[#4a4a4a] rounded-sm bg-[#222]">
              <ChevronUp size={20} strokeWidth={1.5} className="text-[#999]" />
            </div>
          </button>

          {/* ==================================================
              RODAPÉ ATUALIZADO: BOTÃO MENU COM REDIRECIONAMENTO
              ================================================== */}
          <div className="flex items-stretch justify-between border border-[#3a3a3a] bg-[#1a1a1a] rounded-sm overflow-hidden h-[60px]">
            <div className="w-16 flex items-center justify-center opacity-30">
              <img 
                src="/icon.png" 
                alt="Wadjet Logo" 
                className="w-8 h-8 object-contain grayscale" 
                onError={(e) => { e.target.style.display = "none"; }}
              />
            </div>
            
            <button 
              onClick={() => router.push('/admin')} 
              className="w-[60px] border-l border-[#3a3a3a] flex items-center justify-center text-[#777] bg-[#222] hover:bg-[#2a2a2a] transition-colors cursor-pointer"
            >
              <Menu size={32} strokeWidth={1.5} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}