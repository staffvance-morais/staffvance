"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// 1. INICIALIZA O SUPABASE
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function GestaoFinanceira() {
  // PAINÉIS SUPERIORES (Editáveis pelo Morais)
  const [faturamentoBruto, setFaturamentoBruto] = useState(0);
  const [saidasStaff, setSaidasStaff] = useState(0);
  const [lucroLiquido, setLucroLiquido] = useState(0);

  // DADOS DA TABELA E ESTADO DE CARREGAMENTO
  const [pagamentos, setPagamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // ESTADOS DO MODAL DE EDIÇÃO
  const [modalAberto, setModalAberto] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);

  // 2. BUSCAR DADOS DO SUPABASE AO CARREGAR A PÁGINA
  useEffect(() => {
    buscarDados();
  }, []);

  const buscarDados = async () => {
    setCarregando(true);
    
    // Buscando da tabela "escalas"
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

  // 3. ATUALIZAR STATUS DE PAGO/PENDENTE NO BANCO DE DADOS
  const handleTogglePago = async (id, statusAtual) => {
    const novoStatus = !statusAtual;

    setPagamentos(pagamentos.map((func) =>
      func.id === id ? { ...func, pago: novoStatus } : func
    ));

    const { error } = await supabase
      .from("escalas")
      .update({ pago: novoStatus })
      .eq("id", id);

    if (error) {
      alert("Erro ao atualizar status no banco: " + error.message);
      buscarDados(); 
    }
  };

  // 4. FUNÇÕES DO MODAL (ABRIR E SALVAR NO BANCO)
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
        evento: itemEditando.evento, 
        valor: Number(itemEditando.valor) 
      })
      .eq("id", itemEditando.id);

    if (error) {
      alert("Erro ao salvar edições no banco: " + error.message);
      buscarDados(); 
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 relative">
      <div className="max-w-5xl mx-auto">
        
        {/* CABEÇALHO */}
        <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <Link href="/admin" className="self-start px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm font-medium transition">
            ← Voltar para o Menu
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Gestão Financeira</h1>
        </div>

        {/* CARDS DE RESUMO EDITÁVEIS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-blue-500 flex flex-col justify-center items-center text-center">
            <h3 className="text-gray-500 text-sm font-bold uppercase mb-2">Entradas (Faturamento)</h3>
            <div className="flex items-center justify-center text-2xl sm:text-3xl font-bold text-blue-600 w-full">
              <span>R$</span>
              <input
                type="number"
                value={faturamentoBruto}
                onChange={(e) => setFaturamentoBruto(e.target.value)}
                className="bg-transparent border-b border-dashed border-blue-300 focus:border-solid focus:border-blue-600 focus:outline-none text-center w-full max-w-[150px] ml-1 py-1"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-red-500 flex flex-col justify-center items-center text-center">
            <h3 className="text-gray-500 text-sm font-bold uppercase mb-2">Saídas (Staff)</h3>
            <div className="flex items-center justify-center text-2xl sm:text-3xl font-bold text-red-600 w-full">
              <span>R$</span>
              <input
                type="number"
                value={saidasStaff}
                onChange={(e) => setSaidasStaff(e.target.value)}
                className="bg-transparent border-b border-dashed border-red-300 focus:border-solid focus:border-red-600 focus:outline-none text-center w-full max-w-[150px] ml-1 py-1"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border-t-4 border-green-500 flex flex-col justify-center items-center text-center">
            <h3 className="text-gray-500 text-sm font-bold uppercase mb-2">Lucro Líquido</h3>
            <div className="flex items-center justify-center text-2xl sm:text-3xl font-bold text-green-600 w-full">
              <span>R$</span>
              <input
                type="number"
                value={lucroLiquido}
                onChange={(e) => setLucroLiquido(e.target.value)}
                className="bg-transparent border-b border-dashed border-green-300 focus:border-solid focus:border-green-600 focus:outline-none text-center w-full max-w-[150px] ml-1 py-1"
              />
            </div>
          </div>
        </div>

        {/* TABELA DE PAGAMENTOS */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="p-4 bg-gray-800 text-white flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span>🧾</span> Controle de Pagamentos
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs">
                  <th className="p-4 font-semibold">Funcionário</th>
                  <th className="p-4 font-semibold">Evento</th>
                  <th className="p-4 font-semibold">Valor</th>
                  <th className="p-4 font-semibold text-center">Ação</th>
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-500">
                      Carregando registros...
                    </td>
                  </tr>
                ) : pagamentos.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-500 italic">
                      Nenhum registro encontrado na escala.
                    </td>
                  </tr>
                ) : (
                  pagamentos.map((item) => (
                    <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 transition ${item.pago ? 'bg-green-50/30' : ''}`}>
                      <td className="p-4">
                        <p className="font-bold text-gray-800 text-sm">{item.nome}</p>
                        <p className="text-xs text-gray-500 uppercase mt-1">{item.cargo}</p>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{item.evento}</td>
                      <td className="p-4 font-bold text-gray-800 text-sm">
                        {formatarMoeda(item.valor)}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col items-center gap-2">
                          <button
                            onClick={() => handleTogglePago(item.id, item.pago)}
                            className={`px-3 py-2 rounded text-xs font-bold w-full max-w-[110px] transition-colors ${
                              item.pago 
                                ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200' 
                                : 'bg-orange-100 text-orange-700 border border-orange-300 hover:bg-orange-200'
                            }`}
                          >
                            {item.pago ? "PAGO ✅" : "PENDENTE ⏳"}
                          </button>
                          <button
                            onClick={() => abrirEdicao(item)}
                            className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 rounded text-xs w-full max-w-[110px] transition"
                          >
                            ✏️ Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL DE EDIÇÃO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Editar Registro</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Funcionário</label>
                <input 
                  type="text" 
                  value={itemEditando?.nome || ''}
                  onChange={(e) => setItemEditando({...itemEditando, nome: e.target.value})}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                <input 
                  type="text" 
                  value={itemEditando?.cargo || ''}
                  onChange={(e) => setItemEditando({...itemEditando, cargo: e.target.value})}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Evento</label>
                <input 
                  type="text" 
                  value={itemEditando?.evento || ''}
                  onChange={(e) => setItemEditando({...itemEditando, evento: e.target.value})}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor a Pagar (R$)</label>
                <input 
                  type="number" 
                  value={itemEditando?.valor || ''}
                  onChange={(e) => setItemEditando({...itemEditando, valor: e.target.value})}
                  className="w-full border border-gray-300 rounded p-2 font-bold text-blue-600 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setModalAberto(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-medium transition"
              >
                Cancelar
              </button>
              <button 
                onClick={salvarEdicao}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}