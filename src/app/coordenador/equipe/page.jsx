"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Search, Info, Plus, Filter, ChevronUp, Menu, Users } from "lucide-react";

// Configuração do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function EquipeCoordenador() {
  const router = useRouter();
  const [funcionarios, setFuncionarios] = useState([]);
  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState([]);
  const [loading, setLoading] = useState(true);

  // Busca apenas os funcionários com o cargo 'staff' no Supabase ao carregar a página
  useEffect(() => {
    async function fetchEquipe() {
      const { data, error } = await supabase
        .from("perfis")
        .select("*")
        .eq("role", "staff") // Filtra para trazer apenas os funcionários comuns
        .order("nome_completo", { ascending: true });

      if (error) {
        console.error("Erro ao buscar equipe:", error);
      } else {
        setFuncionarios(data || []);
      }
      setLoading(false);
    }
    
    fetchEquipe();
  }, []);

  // Lógica da barra de pesquisa em tempo real
  const filtrados = funcionarios.filter((func) => {
    const nome = func.nome_completo ? func.nome_completo.toLowerCase() : "";
    const cargo = func.role ? func.role.toLowerCase() : "";
    const termo = busca.toLowerCase();
    return nome.includes(termo) || cargo.includes(termo);
  });

  // Lógica para selecionar/desmarcar checkboxes
  const handleSelecionar = (id) => {
    if (selecionados.includes(id)) {
      setSelecionados(selecionados.filter((itemId) => itemId !== id));
    } else {
      setSelecionados([...selecionados, id]);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-gray-300 font-sans flex flex-col relative pb-48">
      
      {/* Cabeçalho */}
      <div className="p-4 flex flex-col pt-6">
        <div className="flex items-center gap-3 mb-3">
          <Users size={22} className="text-gray-400" strokeWidth={1.5} />
          <span className="text-gray-300 text-base tracking-wide">Equipe</span>
        </div>
        <div className="w-full h-px bg-[#333]"></div>
      </div>

      {/* Área de Pesquisa e Lista */}
      <div className="px-4 flex-1">
        
        {/* Barra de Pesquisa */}
        <div className="relative flex items-center mb-2">
          <Search size={20} className="absolute left-3 text-gray-500" strokeWidth={2} />
          <input
            type="text"
            placeholder="Toque para pesquisar"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-[#262626] text-white outline-none py-3 pr-4 pl-10 border border-[#333] focus:border-[#555] transition-colors rounded-sm placeholder-gray-500"
          />
        </div>

        {/* Contador Dinâmico */}
        <p className="text-xs text-gray-400 font-medium mb-4">
          Listando {filtrados.length} de {funcionarios.length} - <span className="font-bold text-gray-300">{selecionados.length} selecionados</span>
        </p>

        {/* Lista de Funcionários Renderizada */}
        <div className="flex flex-col gap-2">
          {loading ? (
            <p className="text-center text-gray-500 text-sm py-4">Carregando equipe...</p>
          ) : filtrados.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-4">Nenhum funcionário encontrado.</p>
          ) : (
            filtrados.map((func) => (
              <div key={func.id} className="relative border border-[#333] bg-[#1e1e1e] p-3 flex gap-3">
                
                {/* Checkbox customizado */}
                <div className="pt-1">
                  <div 
                    onClick={() => handleSelecionar(func.id)}
                    className={`w-5 h-5 border flex items-center justify-center cursor-pointer transition-colors ${
                      selecionados.includes(func.id) ? "bg-[#333] border-[#555]" : "border-[#444] bg-[#2a2a2a]"
                    }`}
                  >
                    {selecionados.includes(func.id) && <div className="w-3 h-3 bg-gray-400" />}
                  </div>
                </div>

                {/* Foto (Placeholder Branco como na imagem) */}
                <div className="w-16 h-16 bg-white shrink-0 rounded-sm overflow-hidden flex items-center justify-center">
                   {/* Espaço reservado para a foto do funcionário no futuro */}
                </div>

                {/* Dados do Funcionário */}
                <div className="flex flex-col justify-center">
                  <h3 className="text-white font-bold text-lg leading-tight">
                    {func.nome_completo || "Nome não definido"}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1 capitalize">
                    {func.role || "Cargo não definido"}
                  </p>
                </div>

                {/* Botão Info */}
                <button className="absolute right-3 bottom-3 w-8 h-8 border border-[#444] bg-[#2a2a2a] flex items-center justify-center text-gray-400 hover:bg-[#333] transition-colors rounded-sm">
                  <Info size={18} strokeWidth={2} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===== BARRA INFERIOR FIXA ===== */}
      <div className="fixed bottom-0 left-0 w-full bg-[#141414] p-4 flex flex-col gap-2 border-t border-[#222]">
        
        {/* Botão que leva para a tela de Cadastrar Novo Funcionário */}
        <button 
          onClick={() => router.push("/coordenador/funcionarios/novo")} 
          className="w-full bg-[#1e50cf] hover:bg-[#163a99] text-white font-medium text-lg py-4 flex items-center justify-center gap-2 rounded-sm transition-colors"
        >
          <Plus size={24} strokeWidth={2.5} />
          Adicionar funcionário
        </button>

        {/* Botão de Filtros Extras */}
        <button className="w-full bg-[#2a2a2a] border border-[#333] text-gray-400 py-3 px-4 flex items-center justify-between rounded-sm hover:bg-[#333] transition-colors">
          <div className="flex items-center gap-2">
            <Filter size={20} strokeWidth={1.5} />
            <span className="text-base">Mais opções...</span>
          </div>
          <ChevronUp size={20} strokeWidth={1.5} />
        </button>

        {/* Barra de Navegação do App */}
        <div className="w-full border border-[#333] p-3 mt-1 flex justify-between items-center bg-[#1a1a1a] rounded-sm">
          <div className="w-9 h-9 flex items-center justify-center opacity-40 grayscale">
             <img src="/icon.png" alt="Logo" className="h-full object-contain" />
          </div>
          
          <button className="p-2 border border-[#444] rounded-sm bg-transparent hover:bg-[#2a2a2a] transition-colors">
            <Menu size={26} className="text-gray-400" strokeWidth={1.5} />
          </button>
        </div>

      </div>
    </div>
  );
}