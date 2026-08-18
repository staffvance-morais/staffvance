"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  CheckCircle2, 
  Circle, 
  Menu, 
  Printer, 
  MapPin, 
  Shield 
} from "lucide-react";
import { enviarEmailPagamento } from "@/app/actions/email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Função auxiliar para formatar em Reais (R$)
const formatarMoeda = (valor) => {
  const numero = parseFloat(valor);
  if (isNaN(numero)) return "R$ 0,00";
  return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Função simples e limpa para leitura visual rápida
const formatarPorExtenso = (valor) => {
  const num = parseFloat(valor);
  if (isNaN(num) || num === 0) return "Zero reais";
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)} bilhão(ões)`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)} milhão(ões)`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)} mil reais`;
  return `${num.toFixed(2)} reais`;
};

export default function AcertoFinanceiro() {
  const router = useRouter();
  const params = useParams();
  const eventoId = params.id;

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [evento, setEvento] = useState(null);
  const [receitaBruta, setReceitaBruta] = useState("");
  const [equipe, setEquipe] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // 1. Busca dados do evento
      const { data: evData } = await supabase.from('eventos').select('*').eq('id', eventoId).single();
      setEvento(evData);
      setReceitaBruta(evData?.receita_bruta !== null && evData?.receita_bruta !== undefined ? evData.receita_bruta : "");

      // 2. Busca equipe escalada de forma independente (à prova de falhas de JOIN)
      const { data: escData, error: errEscala } = await supabase
        .from('escalas')
        .select('*')
        .eq('evento_id', eventoId);

      if (errEscala) {
        console.error("Erro ao buscar escalas:", errEscala.message);
      }

      if (escData && escData.length > 0) {
        // Descobre se a coluna de referência é staff_id ou user_id
        const primeiroItem = escData[0];
        const idField = primeiroItem.staff_id ? 'staff_id' : (primeiroItem.user_id ? 'user_id' : 'id');
        
        const ids = escData.map(e => e[idField]).filter(Boolean);

        let perfisMap = {};
        if (ids.length > 0) {
          const { data: perfisData } = await supabase
            .from('perfis')
            .select('*')
            .in('id', ids);

          if (perfisData) {
            perfisData.forEach(p => {
              perfisMap[p.id] = p;
            });
          }
        }

        // Junta os dados da escala com o perfil correspondente
        const equipeFormatada = escData.map(item => {
          const userId = item.staff_id || item.user_id;
          return {
            ...item,
            perfis: perfisMap[userId] || {},
            valor_pago: item.valor_pago !== null && item.valor_pago !== undefined ? item.valor_pago : ""
          };
        });

        setEquipe(equipeFormatada);
      } else {
        setEquipe([]);
      }

      setLoading(false);
    };

    if (eventoId) fetchData();
  }, [eventoId]);

  const custoTotal = equipe.reduce((acc, curr) => {
    const val = parseFloat(curr.valor_pago);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const receitaNum = parseFloat(receitaBruta) || 0;
  const lucroLiquido = receitaNum - custoTotal;

  const handleUpdateStaff = (id, campo, valor) => {
    setEquipe(prev => prev.map(m => m.id === id ? { ...m, [campo]: valor } : m));
  };

  const handleTogglePagamento = async (staff) => {
    const novoStatus = !staff.status_pagamento;
    
    setEquipe(prev => prev.map(m => m.id === staff.id ? { ...m, status_pagamento: novoStatus } : m));

    try {
      await supabase.from('escalas').update({ status_pagamento: novoStatus }).eq('id', staff.id);

      if (novoStatus && staff.perfis?.email) {
        const valorFormatado = parseFloat(staff.valor_pago || 0).toFixed(2);
        const res = await enviarEmailPagamento(
          staff.perfis.email,
          staff.perfis.nome_completo || "Colaborador",
          { titulo: evento?.titulo || "Operação" },
          valorFormatado
        );

        if (res.success) {
          alert(`Pagamento confirmado e e-mail enviado para ${staff.perfis.email}!`);
        } else {
          console.error("Erro ao enviar e-mail:", res.error);
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar pagamento:", error);
      alert("Erro ao atualizar o status de pagamento.");
    }
  };

  const handleSalvarTudo = async () => {
    setSalvando(true);
    try {
      const receitaFinal = parseFloat(receitaBruta) || 0;

      await supabase.from('eventos').update({ receita_bruta: receitaFinal }).eq('id', eventoId);

      for (const staff of equipe) {
        const valorStaff = parseFloat(staff.valor_pago) || 0;
        await supabase.from('escalas').update({ 
          valor_pago: valorStaff, 
          status_pagamento: staff.status_pagamento || false 
        }).eq('id', staff.id);
      }
      alert("Balanço e pagamentos atualizados com sucesso!");
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar os dados.");
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#171717] flex flex-col items-center justify-center text-[#777]">
        <Loader2 className="animate-spin mb-2 text-[#2563eb]" size={36} />
        <p className="text-[14px]">Carregando financeiro...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#171717] font-sans flex flex-col items-center pb-24">
      <div className="w-full max-w-[400px] min-h-screen flex flex-col bg-[#171717] relative">
        
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between p-4 border-b border-[#333333] sticky top-0 bg-[#171717] z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push(`/admin/eventos`)} 
              className="w-10 h-10 flex items-center justify-center rounded-sm border border-[#3a3a3a] bg-[#222] hover:bg-[#2a2a2a] text-[#999] cursor-pointer transition-colors"
            >
              <ArrowLeft size={20} strokeWidth={1.5} />
            </button>
            <div>
              <h1 className="text-[16px] font-bold tracking-wider text-[#e5e5e5] uppercase">Acerto Financeiro</h1>
              <p className="text-[11px] text-[#2563eb] font-semibold uppercase tracking-wider truncate max-w-[180px]">
                {evento?.titulo || "Operação"}
              </p>
            </div>
          </div>

          <button 
            onClick={() => window.print()}
            className="w-10 h-10 flex items-center justify-center rounded-sm border border-[#3a3a3a] bg-[#222] hover:bg-[#2a2a2a] text-[#2563eb] transition-colors cursor-pointer"
            title="Imprimir / Salvar PDF"
          >
            <Printer size={18} />
          </button>
        </div>

        {/* CONTEÚDO PRINCIPAL */}
        <div className="flex-1 p-4 space-y-5 overflow-y-auto pb-[100px] custom-scrollbar">
          
          {/* PAINEL DE BALANÇO */}
          <div className="bg-[#222222] border border-[#3a3a3a] rounded-sm p-4 shadow-md">
            <h2 className="text-[#e5e5e5] text-[15px] font-bold uppercase tracking-wider mb-3 border-b border-[#333] pb-2">
              Balanço do Evento
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-[#777] uppercase tracking-wider font-bold">Receita Contratante (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={receitaBruta} 
                  onChange={(e) => setReceitaBruta(e.target.value)}
                  className="w-full bg-[#111] text-white p-3 mt-1 rounded-sm border border-[#444] outline-none focus:border-[#2563eb] text-[15px]"
                  placeholder="Ex: 5000.00"
                />
                {receitaBruta !== "" && (
                  <p className="text-[11px] text-[#aaa] mt-1 italic">
                    Referência: {formatarPorExtenso(receitaBruta)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#333]">
                <div className="bg-[#1a1a1a] p-3 rounded-sm border border-[#2a2a2a] overflow-hidden">
                  <p className="text-[11px] text-[#777] uppercase tracking-wider">Custo Total</p>
                  <p className="text-red-400 text-[15px] font-bold mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                    {formatarMoeda(custoTotal)}
                  </p>
                </div>
                <div className="bg-[#1a1a1a] p-3 rounded-sm border border-[#2a2a2a] overflow-hidden">
                  <p className="text-[11px] text-[#777] uppercase tracking-wider">Lucro Líquido</p>
                  <p className={`text-[15px] font-bold mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis ${lucroLiquido < 0 ? 'text-red-500' : 'text-green-400'}`}>
                    {formatarMoeda(lucroLiquido)}
                  </p>
                </div>
              </div>

              <button 
                onClick={handleSalvarTudo} 
                disabled={salvando}
                className="w-full mt-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold py-3.5 rounded-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                {salvando ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {salvando ? "Salvando Balanço..." : "Salvar Valores"}
              </button>
            </div>
          </div>

          {/* EQUIPE ESCALADA */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#e5e5e5] text-[15px] font-bold uppercase tracking-wider">
                Equipe Escalada ({equipe.length})
              </h3>
            </div>

            {equipe.length === 0 ? (
              <div className="bg-[#222] border border-[#333] rounded-sm p-8 text-center text-[#777] text-[14px]">
                Nenhum staff escalado neste evento.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {equipe.map((staff) => (
                  <div key={staff.id} className="bg-[#222222] border border-[#3a3a3a] p-4 rounded-sm flex flex-col gap-3">
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#1a1a1a] rounded-full overflow-hidden border border-[#444] flex items-center justify-center shrink-0">
                          {staff.perfis?.foto_url ? (
                            <img src={staff.perfis.foto_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Shield size={18} className="text-[#666]" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-[#e5e5e5] font-semibold text-[15px] capitalize">
                            {staff.perfis?.nome_completo || "Sem nome"}
                          </h4>
                          <p className="text-[#888] text-[12px] flex items-center gap-1 mt-0.5">
                            <MapPin size={12} /> Setor: <span className="text-[#ccc]">{staff.setor || "Geral"}</span>
                          </p>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleTogglePagamento(staff)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors border ${
                          staff.status_pagamento 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' 
                            : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20'
                        }`}
                        title="Clique para alternar status de pagamento e disparar e-mail"
                      >
                        {staff.status_pagamento ? (
                          <>
                            <CheckCircle2 size={14} /> Pago
                          </>
                        ) : (
                          <>
                            <Circle size={14} /> Pendente
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex flex-col gap-1 pt-2 border-t border-[#333]">
                      <div className="flex items-center gap-2">
                        <span className="text-[#777] text-[13px] font-semibold shrink-0">Valor (R$):</span>
                        <input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00" 
                          value={staff.valor_pago} 
                          onChange={(e) => handleUpdateStaff(staff.id, 'valor_pago', e.target.value)}
                          className="w-full bg-[#111] text-white px-3 py-2 rounded-sm border border-[#444] text-[14px] outline-none focus:border-[#2563eb]"
                        />
                      </div>
                      {staff.valor_pago !== "" && staff.valor_pago !== null && (
                        <span className="text-[11px] text-[#aaa] italic ml-1">
                          Leitura: {formatarPorExtenso(staff.valor_pago)}
                        </span>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RODAPÉ FIXO */}
        <div className="absolute bottom-0 w-full p-4 bg-[#171717] border-t border-[#2a2a2a]">
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