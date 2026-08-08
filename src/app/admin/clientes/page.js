"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Handshake, Search, Info, Filter, ChevronUp, Menu } from "lucide-react";

export default function ListaClientes() {
  const router = useRouter();
  
  // Estados para guardar os clientes, o carregamento e a pesquisa
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  // Assim que a tela abre, ele chama a função para buscar os dados
  useEffect(() => {
    buscarClientes();
  }, []);

  const buscarClientes = async () => {
    try {
      // Puxa todos os clientes da tabela, ordenando do mais novo pro mais antigo
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtra os clientes em tempo real com base no que foi digitado na barra de pesquisa
  const clientesFiltrados = clientes.filter(cliente => {
    const termo = busca.toLowerCase();
    const rep = cliente.representante?.toLowerCase() || "";
    const emp = cliente.empresa?.toLowerCase() || "";
    return rep.includes(termo) || emp.includes(termo);
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans selection:bg-[#333] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-sm border border-[#333] bg-[#1c1c1c] relative flex flex-col min-h-[85vh]">
        
        {/* Cabeçalho */}
        <div className="p-5 pb-3">
          <div className="flex items-center text-[#aaa] gap-2 mb-4">
            <Handshake size={20} strokeWidth={1.5} />
            <span className="text-[15px] font-medium tracking-wide">Clientes</span>
          </div>

          {/* Barra de Pesquisa Funcional */}
          <div className="relative w-full mb-3">
            <div className="absolute left-3 top-0 bottom-0 flex items-center text-[#777]">
              <Search size={20} strokeWidth={1.5} />
            </div>
            <input 
              type="text" 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Toque para pesquisar" 
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] text-[#ddd] text-[15px] rounded-none py-3 pl-11 pr-4 outline-none focus:border-[#555] placeholder:text-[#666] transition-colors"
            />
          </div>

          {/* Contador Dinâmico */}
          <div className="text-[13px] text-[#888] tracking-wide">
            Listando {clientesFiltrados.length} de {clientes.length} - <span className="font-bold text-[#aaa]">0 selecionados</span>
          </div>
        </div>

        {/* Lista de Clientes (Puxando do Banco) */}
        <div className="flex-1 overflow-y-auto px-5 flex flex-col gap-3 pb-4">
          
          {loading ? (
            <div className="text-center text-[#777] text-sm mt-10">Carregando clientes...</div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="text-center text-[#777] text-sm mt-10">Nenhum cliente encontrado.</div>
          ) : (
            clientesFiltrados.map((cliente) => (
              <div key={cliente.id} className="border border-[#333] bg-[#222] p-3 flex relative h-[104px]">
                
                {/* Foto com Efeito de Checkbox cortado */}
                <div className="relative w-[76px] h-[76px] bg-white shrink-0">
                  <div className="absolute -top-1 -left-1 w-5 h-5 bg-[#222] border border-[#444] cursor-pointer hover:bg-[#333] transition-colors z-10"></div>
                  
                  {/* Se o cliente tiver foto, exibe. Se não, fica o fundo branco padrão */}
                  {cliente.foto_url && (
                    <img src={cliente.foto_url} alt={cliente.representante} className="w-full h-full object-cover absolute inset-0" />
                  )}
                </div>

                {/* Textos Dinâmicos (Evita que nomes muito longos quebrem o layout com line-clamp-1) */}
                <div className="ml-4 flex flex-col pt-1 w-full pr-8">
                  <span className="text-[#eee] font-bold text-[17px] tracking-wide leading-tight truncate" title={cliente.representante}>
                    {cliente.representante}
                  </span>
                  <span className="text-[#888] text-[14px] truncate" title={cliente.empresa}>
                    {cliente.empresa}
                  </span>
                </div>

                {/* Botão de Info */}
                <button className="absolute bottom-3 right-3 w-8 h-8 flex items-center justify-center border border-[#444] bg-[#2a2a2a] text-[#777] hover:text-[#aaa] hover:bg-[#333] transition-colors">
                  <Info size={18} strokeWidth={1.5} />
                </button>
              </div>
            ))
          )}

        </div>

        {/* Rodapé Fixo (Ações) */}
        <div className="p-5 pt-0 flex flex-col gap-3 mt-auto">
          
          <button 
            onClick={() => router.push("/admin/clientes/cadastrar")}
            className="w-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-[17px] font-medium py-4 transition-colors tracking-wide"
          >
            Cadastrar cliente
          </button>

          <button className="w-full border border-[#444] bg-[#2a2a2a] hover:bg-[#333] transition-colors flex items-center justify-between p-4 text-[#aaa]">
            <div className="flex items-center gap-3">
              <Filter size={20} strokeWidth={1.5} />
              <span className="text-[17px] font-normal tracking-wide">Mais opções...</span>
            </div>
            <ChevronUp size={20} strokeWidth={1.5} className="bg-[#333] border border-[#444] rounded-sm p-0.5" />
          </button>

          {/* Linha Divisória */}
          <div className="w-full h-px bg-[#333] mt-2 mb-2"></div>

          {/* Logo e Menu */}
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 flex items-center justify-start opacity-30">
              <img src="/icon.png" alt="Logo Wadjet" className="max-w-full max-h-full object-contain grayscale" onError={(e) => e.target.style.display = 'none'} />
            </div>
            <button className="w-10 h-10 flex items-center justify-center border border-[#444] bg-[#2a2a2a] text-[#888] hover:bg-[#333] transition-colors">
              <Menu size={22} strokeWidth={1.5} />
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}