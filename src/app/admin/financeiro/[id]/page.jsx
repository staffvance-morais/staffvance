"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, UserCheck, DollarSign, Loader2, Save, MapPin } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function DetalhesFinanceirosEvento() {
  const router = useRouter();
  const eventoId = useParams().id;
  const [evento, setEvento] = useState(null);
  const [equipeLista, setEquipeLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Estados Financeiros
  const [receitaBruta, setReceitaBruta] = useState("");
  const [valorDiaria, setValorDiaria] = useState("");

  useEffect(() => {
    const fetchDetalhes = async () => {
      try {
        const { data: dadosEvento } = await supabase.from('eventos').select('*').eq('id', eventoId).single();
        if (dadosEvento) {
          setEvento(dadosEvento);
          setReceitaBruta(dadosEvento.receita_bruta || "");
          setValorDiaria(dadosEvento.valor_diaria || "");
        }

        // Busca manual à prova de falhas de JOIN
        const { data: dadosEscala } = await supabase.from('escalas').select('*').eq('evento_id', eventoId);
        if (dadosEscala && dadosEscala.length > 0) {
          const staffIds = dadosEscala.map(e => e.staff_id);
          const { data: perfis } = await supabase.from('perfis').select('*').in('id', staffIds);
          
          const listaCompleta = dadosEscala.map(esc => {
            const perfil = perfis.find(p => p.id === esc.staff_id) || {};
            return { ...esc, perfil };
          });
          setEquipeLista(listaCompleta);
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    if (eventoId) fetchDetalhes();
  }, [eventoId]);

  const handleSalvarFinanceiro = async () => {
    setSalvando(true);
    try {
      await supabase.from('eventos').update({ 
        receita_bruta: parseFloat(receitaBruta) || 0, 
        valor_diaria: parseFloat(valorDiaria) || 0 
      }).eq('id', eventoId);
      alert("Valores financeiros atualizados!");
    } catch (error) { alert("Erro ao salvar."); } finally { setSalvando(false); }
  };

  const custoTotal = (parseFloat(valorDiaria) || 0) * equipeLista.length;
  const lucroLiquido = (parseFloat(receitaBruta) || 0) - custoTotal;

  if (loading) return <div className="min-h-screen bg-[#171717] flex items-center justify-center text-[#2563eb]"><Loader2 className="animate-spin" size={40}/></div>;

  return (
    <div className="min-h-screen bg-[#171717] font-sans flex flex-col items-center">
      <div className="w-full max-w-[900px] min-h-screen flex flex-col bg-[#1c1c1c] border-x border-[#2a2a2a]">
        
        <div className="flex items-center p-5 border-b border-[#333333] sticky top-0 bg-[#1c1c1c] z-10 gap-4">
          <button onClick={() => router.push('/admin/financeiro')} className="w-11 h-11 flex items-center justify-center rounded-md border border-[#3a3a3a] bg-[#222] text-[#999]"><ArrowLeft size={22}/></button>
          <div>
            <h1 className="text-[18px] font-bold text-[#e5e5e5] uppercase">Acerto Financeiro</h1>
            <p className="text-[13px] text-[#2563eb] capitalize font-medium">{evento?.titulo}</p>
          </div>
        </div>

        <div className="flex-1 p-5 md:p-8 bg-[#171717]">
          {/* PAINEL DE LUCROS */}
          <div className="bg-[#222] border border-[#333] rounded-md p-5 mb-8">
            <h2 className="text-[#e5e5e5] font-semibold mb-4 border-b border-[#444] pb-2">Balanço do Evento</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div>
                <label className="text-[#999] text-[12px] uppercase">Receita Contratante (R$)</label>
                <input type="number" value={receitaBruta} onChange={e => setReceitaBruta(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#444] text-white p-3 rounded-sm mt-1 focus:border-[#2563eb] outline-none" placeholder="Ex: 5000" />
              </div>
              
              <div>
                <label className="text-[#999] text-[12px] uppercase">Diária por Staff (R$)</label>
                <input type="number" value={valorDiaria} onChange={e => setValorDiaria(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#444] text-white p-3 rounded-sm mt-1 focus:border-[#2563eb] outline-none" placeholder="Ex: 120" />
              </div>
              
              <div className="flex flex-col justify-end">
                <button onClick={handleSalvarFinanceiro} className="w-full bg-[#2563eb] text-white font-bold p-3 rounded-sm flex justify-center items-center gap-2 hover:bg-[#1d4ed8]">
                  {salvando ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} Salvar Valores
                </button>
              </div>

            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[#444] pt-4">
              <div>
                <p className="text-[#999] text-[13px]">Custo Total (Equipe):</p>
                <p className="text-[#ef4444] text-[20px] font-bold">R$ {custoTotal.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[#999] text-[13px]">Lucro Líquido (Wadjet):</p>
                <p className="text-[#22c55e] text-[24px] font-bold">R$ {lucroLiquido.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <h2 className="text-[#e5e5e5] text-[16px] font-semibold mb-4 border-b border-[#333] pb-2">Equipe Escalada ({equipeLista.length})</h2>
          
          {equipeLista.length === 0 ? (
            <div className="text-center py-10 text-[#777] bg-[#222] border border-[#333]">Nenhum segurança escalado.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {equipeLista.map((escala) => (
                <div key={escala.id} className="bg-[#222] border border-[#3a3a3a] p-4 flex justify-between items-center">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 bg-[#1a1a1a] rounded-full overflow-hidden border border-[#444]">
                       {escala.perfil.foto_url ? <img src={escala.perfil.foto_url} className="w-full h-full object-cover" /> : <UserCheck size={20} className="m-2 text-[#666]"/>}
                    </div>
                    <div>
                      <h3 className="text-white capitalize">{escala.perfil.nome_completo || 'Sem nome'}</h3>
                      <p className="text-[#999] text-[12px] flex items-center gap-1"><MapPin size={12}/> Setor: <span className="text-[#e5e5e5]">{escala.setor || 'Geral'}</span></p>
                    </div>
                  </div>
                  <div className="text-[#22c55e] font-bold border border-[#22c55e]/30 bg-[#22c55e]/10 px-3 py-1 rounded-sm text-[13px]">R$ {parseFloat(valorDiaria) || 0}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}