"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function EscalasPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    evento_id: "", staff_id: "", posto_trabalho: "", turno_inicio: "", turno_fim: "", status: "Escalado"
  });
  const [loading, setLoading] = useState(false);
  
  // Novos estados para controlar a disponibilidade
  const [funcionarios, setFuncionarios] = useState([]);
  const [escalasAtivas, setEscalasAtivas] = useState([]);

  // Busca os dados assim que a página abre
  useEffect(() => {
    fetchDisponibilidade();
  }, []);

  const fetchDisponibilidade = async () => {
    try {
      // 1. Pega todos os funcionários da tabela perfis
      const { data: funcData } = await supabase
        .from("perfis")
        .select("id, nome_completo, cargo");
        
      // 2. Pega todas as escalas que estão ativas (Escalado ou Confirmado)
      const { data: escData } = await supabase
        .from("escalas")
        .select("staff_id, posto_trabalho")
        .in("status", ["Escalado", "Confirmado"]);

      if (funcData) setFuncionarios(funcData);
      if (escData) setEscalasAtivas(escData);
    } catch (error) {
      console.error("Erro ao buscar dados do painel:", error);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Função mágica para o Morais: Clica no nome e preenche o ID no formulário
  const selecionarFuncionario = (id) => {
    setForm({ ...form, staff_id: id });
    window.scrollTo({ top: 0, behavior: "smooth" }); // Rola a página de volta pro topo
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("escalas").insert([form]);
      if (error) throw error;
      
      alert("Funcionário escalado com sucesso!");
      // Limpa o formulário, mas mantém o ID do evento para facilitar se ele for escalar várias pessoas pro mesmo evento
      setForm({ ...form, staff_id: "", posto_trabalho: "", turno_inicio: "", turno_fim: "", status: "Escalado" });
      
      // Atualiza a lista de disponíveis e ocupados automaticamente
      fetchDisponibilidade();
    } catch (error) {
      alert("Erro ao escalar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Separando quem está livre e quem está ocupado
  const funcionariosOcupados = funcionarios.filter(f => escalasAtivas.some(e => e.staff_id === f.id));
  const funcionariosLivres = funcionarios.filter(f => !escalasAtivas.some(e => e.staff_id === f.id));

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* FORMULÁRIO DE ESCALA */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <button onClick={() => router.push("/admin")} className="text-blue-600 font-bold mb-6 hover:underline flex items-center">
            &larr; Voltar para o Menu
          </button>
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Escalar Funcionário</h2>
          
          <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" name="evento_id" value={form.evento_id} onChange={handleChange} placeholder="ID do Evento" required className="border p-2 rounded col-span-full" />
            <input type="text" name="staff_id" value={form.staff_id} onChange={handleChange} placeholder="ID do Funcionário (Clique na lista abaixo para preencher)" required className="border p-2 rounded col-span-full bg-blue-50 border-blue-300 font-mono text-sm" />
            
            <input type="text" name="posto_trabalho" value={form.posto_trabalho} onChange={handleChange} placeholder="Posto de Trabalho (Ex: Segurança, Recepção)" required className="border p-2 rounded col-span-full mt-4" />
            
            <div className="flex flex-col">
              <label className="text-sm font-bold text-gray-600 mb-1">Turno Início</label>
              <input type="datetime-local" name="turno_inicio" value={form.turno_inicio} onChange={handleChange} required className="border p-2 rounded" />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-bold text-gray-600 mb-1">Turno Fim</label>
              <input type="datetime-local" name="turno_fim" value={form.turno_fim} onChange={handleChange} required className="border p-2 rounded" />
            </div>

            <select name="status" value={form.status} onChange={handleChange} className="border p-2 rounded col-span-full mt-4 bg-white">
              <option value="Escalado">Escalado</option>
              <option value="Confirmado">Confirmado</option>
            </select>

            <button type="submit" disabled={loading} className="col-span-full mt-4 bg-orange-600 text-white font-bold py-3 rounded hover:bg-orange-700 transition-colors">
              {loading ? "Salvando Escala..." : "Confirmar Escala"}
            </button>
          </form>
        </div>

        {/* PAINEL DE DISPONIBILIDADE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* COLUNA: DISPONÍVEIS */}
          <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-green-500">
            <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center">
              <span className="text-2xl mr-2">✅</span> Equipe Disponível
            </h3>
            <p className="text-sm text-gray-500 mb-4">Clique no nome para preencher o ID no formulário acima.</p>
            
            {funcionariosLivres.length === 0 ? (
              <p className="text-gray-500 italic">Nenhum funcionário disponível no momento.</p>
            ) : (
              <ul className="space-y-2">
                {funcionariosLivres.map((func) => (
                  <li key={func.id} 
                      onClick={() => selecionarFuncionario(func.id)}
                      className="p-3 bg-gray-50 border border-gray-200 rounded cursor-pointer hover:bg-green-50 hover:border-green-300 transition-colors flex justify-between items-center">
                    <span className="font-bold text-gray-800">{func.nome_completo || "Sem Nome"}</span>
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">{func.cargo}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* COLUNA: OCUPADOS */}
          <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-red-500">
            <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center">
              <span className="text-2xl mr-2">⏳</span> Equipe Ocupada (Em Escala)
            </h3>
            <p className="text-sm text-gray-500 mb-4">Estes funcionários já possuem uma escala ativa.</p>
            
            {funcionariosOcupados.length === 0 ? (
              <p className="text-gray-500 italic">Nenhum funcionário em escala no momento.</p>
            ) : (
              <ul className="space-y-2">
                {funcionariosOcupados.map((func) => {
                  // Procura qual é o posto de trabalho que a pessoa está ocupando
                  const escalaDessaPessoa = escalasAtivas.find(e => e.staff_id === func.id);
                  return (
                    <li key={func.id} className="p-3 bg-red-50 border border-red-100 rounded flex flex-col">
                      <span className="font-bold text-gray-800">{func.nome_completo || "Sem Nome"}</span>
                      <span className="text-sm text-red-600 mt-1">
                        Posto: {escalaDessaPessoa?.posto_trabalho || "Não informado"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}