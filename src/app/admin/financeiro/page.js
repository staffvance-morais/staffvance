"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { 
  ArrowLeft, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  X
} from "lucide-react";

// 1. INICIALIZA O SUPABASE
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function GestaoFinanceira() {
  const router = useRouter();

  // ESTADOS PRINCIPAIS
  const [pagamentos, setPagamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  
  // Dicionário para armazenar o faturamento digitado de CADA evento separadamente
  const [faturamentos, setFaturamentos] = useState({});

  // ESTADOS DO MODAL DE EDIÇÃO
  const [modalAberto, setModalAberto] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);

  // 2. BUSCAR DADOS
  useEffect(() => {
    buscarDados();
  }, []);

  const buscarDados = async () => {
    setCarregando(true);
    const { data, error } = await supabase
      .from("escalas")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Erro ao buscar dados:", error.message);
    } else if (data) {
      setPagamentos(data);
    }
    setCarregando(false);
  };

  // 3. ATUALIZAR STATUS DE PAGO/PENDENTE
  const handleTogglePago = async (id, statusAtual) => {
    const novoStatus = !statusAtual;

    // Atualiza a tela instantaneamente (Otimista)
    setPagamentos(pagamentos.map((func) =>
      func.id === id ? { ...func, pago: novoStatus } : func
    ));

    // Atualiza no banco
    const { error } = await supabase
      .from("escalas")
      .update({ pago: novoStatus })
      .eq("id", id);

    if (error) {
      alert("Erro ao atualizar status no banco: " + error.message);
      buscarDados(); // Reverte em caso de erro
    }
  };

  // 4. FUNÇÕES DO MODAL
  const abrirEdicao = (item) => {
    setItemEditando({ ...item });
    setModalAberto(true);
  };

  const salvarEdicao = async () => {
    setPagamentos(pagamentos.map((func) =>
      func.id === itemEditando.id 
        ? { ...itemEditando, valor: Number(itemEditando.valor) } 
        : func
    ));
    setModalAberto(false);

    const { error } = await supabase
      .from("escalas")
      .update({
        nome: itemEditando.nome,     
        cargo: itemEditando.cargo,   
        valor: Number(itemEditando.valor) 
      })
      .eq("id", itemEditando.id);

    if (error) {
      alert("Erro ao salvar edições no banco: " + error.message);
      buscarDados(); 
    }
  };

  // 5. LÓGICA DE AGRUPAMENTO POR EVENTO
  const eventosAgrupados = pagamentos.reduce((acc, item) => {
    const nomeEvento = item.evento || "Evento Não Especificado";
    if (!acc[nomeEvento]) {
      acc[nomeEvento] = [];
    }
    acc[nomeEvento].push(item);
    return acc;
  }, {});

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

  const handleFaturamentoChange = (evento, valor) => {
    setFaturamentos(prev => ({ ...prev, [evento]: valor }));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-sans flex flex-col pb-24">
      
      {/* CABEÇALHO WADJET */}
      <div className="px-6 py-4 bg-[#111111] border-b border-[#222] flex justify-between items-center z-30 shadow-md sticky top-0">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => router.push("/admin")}
            className="p-2.5 bg-[#1a1a1a] border border-[#333] hover:bg-[#222] transition-colors rounded-sm group"
          >
            <ArrowLeft size={20} className="text-gray-400 group-hover:text-white transition-colors" strokeWidth={2} />
          </button>
          
          <div className="flex flex-col">
            <h1 className="text-white font-bold text-lg tracking-widest uppercase flex items-center gap-2">
              <Wallet size={18} className="text-[#1e50cf]" />
              Gestão Financeira
            </h1>
            <span className="text-gray-500 text-xs font-semibold tracking-wider">CONTROLE DE PAGAMENTOS E EVENTOS</span>
          </div>
        </div>

        <div className="w-10 h-10 opacity-60 grayscale hidden md:block">
          <img src="/icon.png" alt="Wadjet Logo" className="w-full h-full object-contain" onError={(e) => e.target.style.display='none'} />
        </div>
      </div>

      {/* ÁREA DE EVENTOS */}
      <div className="p-4 md:p-6 max-w-7xl mx-auto w-full flex flex-col gap-8">
        
        {carregando ? (
          <div className="flex flex-col items-center justify-center mt-20 gap-4">
             <div className="w-8 h-8 border-4 border-gray-600 border-t-[#1e50cf] rounded-full animate-spin"></div>
             <p className="text-gray-500">Buscando dados financeiros...</p>
          </div>
        ) : Object.keys(eventosAgrupados).length === 0 ? (
          <div className="text-center py-20 bg-[#111] border border-[#222] rounded-md">
            <Wallet size={48} className="mx-auto text-gray-600 mb-4 opacity-50" />
            <p className="text-gray-500">Nenhum registro financeiro encontrado.</p>
          </div>
        ) : (
          Object.entries(eventosAgrupados).map(([nomeEvento, equipe]) => {
            
            // Cálculos dinâmicos do evento específico
            const saidasTotais = equipe.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);
            const faturamento = Number(faturamentos[nomeEvento] || 0);
            const lucro = faturamento - saidasTotais;
            const isLucroPositivo = lucro >= 0;

            return (
              <div key={nomeEvento} className="bg-[#111111] border border-[#222] rounded-lg shadow-xl overflow-hidden">
                
                {/* Título do Evento */}
                <div className="bg-[#1a1a1a] border-b border-[#333] px-6 py-4">
                  <h2 className="text-xl font-bold text-white uppercase tracking-wide">{nomeEvento}</h2>
                </div>

                {/* Dashboard Financeiro do Evento */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-1 border-b border-[#222] bg-[#0a0a0a]">
                  
                  {/* Entradas */}
                  <div className="bg-[#111] p-6 flex flex-col items-center border-b md:border-b-0 md:border-r border-[#222]">
                    <div className="flex items-center gap-2 text-gray-500 mb-3">
                      <TrendingUp size={16} className="text-blue-500" />
                      <span className="text-xs font-bold uppercase tracking-widest">Faturamento Bruto</span>
                    </div>
                    <div className="flex items-center text-3xl font-black text-blue-500 w-full justify-center">
                      <span className="text-lg mr-1 mt-1">R$</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={faturamentos[nomeEvento] || ''}
                        onChange={(e) => handleFaturamentoChange(nomeEvento, e.target.value)}
                        className="bg-transparent border-b border-dashed border-blue-900/50 hover:border-blue-500 focus:border-blue-500 focus:outline-none text-center w-full max-w-[150px] transition-colors pb-1"
                      />
                    </div>
                  </div>

                  {/* Saídas */}
                  <div className="bg-[#111] p-6 flex flex-col items-center border-b md:border-b-0 md:border-r border-[#222]">
                    <div className="flex items-center gap-2 text-gray-500 mb-3">
                      <TrendingDown size={16} className="text-red-500" />
                      <span className="text-xs font-bold uppercase tracking-widest">Custo da Equipe (Saídas)</span>
                    </div>
                    <div className="flex items-center text-3xl font-black text-red-500">
                      {formatarMoeda(saidasTotais)}
                    </div>
                  </div>

                  {/* Lucro */}
                  <div className="bg-[#111] p-6 flex flex-col items-center">
                    <div className="flex items-center gap-2 text-gray-500 mb-3">
                      <DollarSign size={16} className={isLucroPositivo ? "text-green-500" : "text-red-500"} />
                      <span className="text-xs font-bold uppercase tracking-widest">Lucro Líquido</span>
                    </div>
                    <div className={`flex items-center text-3xl font-black ${isLucroPositivo ? "text-green-500" : "text-red-500"}`}>
                      {formatarMoeda(lucro)}
                    </div>
                  </div>
                </div>

                {/* Tabela de Staff do Evento */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#161616] border-b border-[#333] text-gray-500 uppercase text-[10px] tracking-widest">
                        <th className="p-4 font-semibold">Membro da Equipe</th>
                        <th className="p-4 font-semibold">Valor Acordado</th>
                        <th className="p-4 font-semibold text-center">Status / Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {equipe.map((item) => (
                        <tr key={item.id} className="border-b border-[#222] hover:bg-[#161616] transition-colors group">
                          
                          <td className="p-4">
                            <p className="font-bold text-gray-200 text-sm capitalize">{item.nome}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">{item.cargo || "Staff"}</p>
                          </td>
                          
                          <td className="p-4 font-bold text-gray-300 text-sm">
                            {formatarMoeda(item.valor)}
                          </td>
                          
                          <td className="p-4">
                            <div className="flex flex-row items-center justify-center gap-2">
                              
                              {/* Botão de Toggle de Pagamento */}
                              <button
                                onClick={() => handleTogglePago(item.id, item.pago)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-bold w-full max-w-[130px] justify-center transition-all ${
                                  item.pago 
                                    ? 'bg-green-900/20 text-green-500 border border-green-900/50 hover:bg-green-900/40' 
                                    : 'bg-orange-900/20 text-orange-500 border border-orange-900/50 hover:bg-orange-900/40'
                                }`}
                              >
                                {item.pago ? (
                                  <><CheckCircle2 size={14} /> PAGO</>
                                ) : (
                                  <><Clock size={14} /> PENDENTE</>
                                )}
                              </button>
                              
                              {/* Botão Editar */}
                              <button
                                onClick={() => abrirEdicao(item)}
                                className="p-2 bg-[#222] text-gray-400 border border-[#333] hover:bg-[#333] hover:text-white rounded-sm transition-colors"
                                title="Editar Valor/Nome"
                              >
                                <Edit3 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* ==========================================
          MODAL DE EDIÇÃO (DARK MODE)
          ========================================== */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111] border border-[#333] rounded-sm shadow-2xl w-full max-w-md p-6">
            
            <div className="flex justify-between items-center border-b border-[#222] pb-4 mb-6">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Editar Registro</h3>
              <button onClick={() => setModalAberto(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Nome do Funcionário</label>
                <input 
                  type="text" 
                  value={itemEditando?.nome || ''}
                  onChange={(e) => setItemEditando({...itemEditando, nome: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-sm p-3 focus:ring-1 focus:ring-[#1e50cf] focus:border-[#1e50cf] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Cargo</label>
                <input 
                  type="text" 
                  value={itemEditando?.cargo || ''}
                  onChange={(e) => setItemEditando({...itemEditando, cargo: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-sm p-3 focus:ring-1 focus:ring-[#1e50cf] focus:border-[#1e50cf] outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Valor a Pagar (R$)</label>
                <input 
                  type="number" 
                  value={itemEditando?.valor || ''}
                  onChange={(e) => setItemEditando({...itemEditando, valor: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#333] text-blue-500 font-bold rounded-sm p-3 focus:ring-1 focus:ring-[#1e50cf] focus:border-[#1e50cf] outline-none transition-colors"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => setModalAberto(false)}
                className="px-5 py-2.5 bg-[#222] text-gray-300 border border-[#333] hover:bg-[#333] rounded-sm font-medium text-sm transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={salvarEdicao}
                className="px-5 py-2.5 bg-[#1e50cf] text-white hover:bg-[#163a99] rounded-sm font-medium text-sm transition-colors flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}