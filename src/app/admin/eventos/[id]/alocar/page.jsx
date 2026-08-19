"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, Search, Check, Shield, Save, Loader2, Users } from "lucide-react";
import { enviarEmailEscalacao } from "@/app/actions/email"; // Importando a função do e-mail

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function AlocarEquipeConteudo() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const eventoId = params.id;
  const setorNome = searchParams.get("setor") || "Setor Geral";

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [equipe, setEquipe] = useState([]);
  const [busca, setBusca] = useState("");
  const [evento, setEvento] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Busca os dados do evento para usar no E-mail
        const { data: eventoData } = await supabase
          .from('eventos')
          .select('*')
          .eq('id', eventoId)
          .single();
        
        if (eventoData) setEvento(eventoData);

        // 2. Busca TODOS os perfis (já incluindo o e-mail que criamos)
        const { data: perfisData, error: perfisError } = await supabase
          .from('perfis')
          .select('*');

        if (perfisError) {
          console.error("Erro RLS/Supabase na tabela PERFIS:", perfisError);
          alert("Erro ao buscar staffs. Verifique as permissões (RLS) da tabela 'perfis'.");
        }

        // 3. Busca as escalas deste evento
        const { data: escalasData, error: escalasError } = await supabase
          .from('escalas')
          .select('*')
          .eq('evento_id', eventoId);

        if (escalasError) {
          console.error("Erro RLS/Supabase na tabela ESCALAS:", escalasError);
        }

        if (perfisData) {
          // Filtra tirando administradores
          const staffApenas = perfisData.filter(p => p.role !== 'admin');

          const staffFormatado = staffApenas.map(p => {
            const escalaExistente = escalasData?.find(e => e.staff_id === p.id || e.user_id === p.id);
            const estaNesteSetor = escalaExistente?.setor === setorNome;
            const estaEmOutroSetor = escalaExistente && !estaNesteSetor ? escalaExistente.setor : null;

            return {
              id: p.id,
              nome: p.nome_completo || p.nome || "Staff sem nome",
              email: p.email, // Garantindo que o e-mail seja passado
              funcao: p.role || 'Staff Tático',
              foto: p.foto_url || null,
              escalaId: escalaExistente ? escalaExistente.id : null,
              estaNesteSetorOriginalmente: estaNesteSetor,
              estaEmOutroSetor: estaEmOutroSetor,
              selecionado: estaNesteSetor 
            };
          });

          staffFormatado.sort((a, b) => (a.selecionado === b.selecionado) ? 0 : a.selecionado ? -1 : 1);
          setEquipe(staffFormatado);
        }
      } catch (error) {
        console.error("Erro geral:", error);
      } finally {
        setLoading(false);
      }
    };

    if (eventoId) fetchData();
  }, [eventoId, setorNome]);

  const toggleStaff = (id) => {
    setEquipe(prev => prev.map(m => m.id === id ? { ...m, selecionado: !m.selecionado } : m));
  };

  const handleSalvarEscala = async () => {
    setSalvando(true);
    let emailsEnviados = 0;
    let staffsSemEmail = 0;

    try {
      // Blindagem: Garante que os dados do evento existam para o e-mail não ir vazio
      let dadosEventoAtual = evento;
      if (!dadosEventoAtual) {
        const { data: ev } = await supabase.from('eventos').select('*').eq('id', eventoId).single();
        dadosEventoAtual = ev;
      }

      const selecionados = equipe.filter(e => e.selecionado);
      const desmarcados = equipe.filter(e => !e.selecionado && e.estaNesteSetorOriginalmente);

      // Remove os desmarcados
      if (desmarcados.length > 0) {
        const idsParaDeletar = desmarcados.map(d => d.escalaId);
        await supabase.from('escalas').delete().in('id', idsParaDeletar);
      }

      // Insere/Atualiza os selecionados
      for (const staff of selecionados) {
        if (!staff.escalaId) {
          // 1. Inserir no Banco de Dados
          await supabase.from('escalas').insert({
            evento_id: eventoId,
            staff_id: staff.id,
            setor: setorNome
          });

          // 2. Disparar o E-mail de Escalação para este NOVO staff
          if (staff.email && dadosEventoAtual) {
            const res = await enviarEmailEscalacao(
              staff.email,
              staff.nome,
              { 
                titulo: dadosEventoAtual.titulo || "Operação da Wadjet", 
                endereco_texto: dadosEventoAtual.endereco_texto || "Local a ser definido"
              },
              setorNome
            );
            
            if (res.success) {
              emailsEnviados++;
            } else {
              console.error(`Erro ao enviar e-mail para ${staff.email}:`, res.error);
            }
          } else {
            staffsSemEmail++;
          }

        } else if (staff.estaEmOutroSetor) {
          // Apenas atualiza o setor se ele já estava alocado antes
          await supabase.from('escalas').update({ setor: setorNome }).eq('id', staff.escalaId);
        }
      }

      // Dá o feedback claro para o usuário sobre os envios
      alert(`Setor salvo com sucesso!\n\n📧 E-mails de notificação enviados: ${emailsEnviados}\n⚠️ Staffs novos sem e-mail cadastrado: ${staffsSemEmail}`);
      
      router.push(`/admin/eventos/${eventoId}/escalar`);
    } catch (error) {
      console.error(error);
      alert("Falha ao salvar a equipe.");
    } finally {
      setSalvando(false);
    }
  };

  const equipeFiltrada = equipe.filter(m => m.nome.toLowerCase().includes(busca.toLowerCase()));
  const totalSelecionados = equipe.filter(m => m.selecionado).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#171717] flex flex-col items-center justify-center text-[#777]">
        <Loader2 className="animate-spin mb-4 text-[#2563eb]" size={40} />
        <p>Buscando staff disponível...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#171717] font-sans flex flex-col items-center pb-[100px]">
      <div className="w-full max-w-[500px] min-h-screen flex flex-col bg-[#171717] relative border-x border-[#2a2a2a]">
        
        <div className="flex items-center justify-between p-5 border-b border-[#333333] sticky top-0 bg-[#171717] z-10 shadow-sm">
          <div className="flex items-center gap-4 text-[#cccccc]">
            <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-sm hover:bg-[#2a2a2a] transition-colors cursor-pointer">
              <ArrowLeft size={24} strokeWidth={1.5} />
            </button>
            <div>
              <h1 className="text-[18px] font-bold tracking-wide text-[#e5e5e5]">Alocar Equipe</h1>
              <p className="text-[13px] text-[#2563eb] font-semibold uppercase tracking-wider">{setorNome}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-center justify-between mb-5 border-b border-[#333] pb-3">
            <h2 className="text-[#e5e5e5] text-[16px] font-bold uppercase tracking-wider flex items-center gap-2">
              <Users size={18} className="text-[#2563eb]"/> Staffs
            </h2>
            <span className="bg-[#2563eb]/20 text-[#2563eb] font-bold px-3 py-1 rounded-sm text-[13px]">
              {totalSelecionados} neste setor
            </span>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777]" size={20} />
            <input type="text" placeholder="Buscar pelo nome..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full bg-[#222] border border-[#3a3a3a] text-[#e5e5e5] h-[48px] pl-11 pr-4 outline-none rounded-sm focus:border-[#2563eb] transition-colors text-[15px]" />
          </div>

          <div className="flex flex-col gap-2.5">
            {equipeFiltrada.map(membro => (
              <div key={membro.id} onClick={() => toggleStaff(membro.id)} className={`flex items-center justify-between p-4 rounded-sm border cursor-pointer transition-colors ${membro.selecionado ? 'bg-[#1e293b] border-[#3b82f6]' : 'bg-[#222222] border-[#3a3a3a] hover:bg-[#2a2a2a]'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#333] rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-[#444]">
                    {membro.foto ? <img src={membro.foto} alt={membro.nome} className="w-full h-full object-cover" /> : <Shield size={20} className={membro.selecionado ? "text-[#3b82f6]" : "text-[#777]"} />}
                  </div>
                  <div>
                    <h3 className={`text-[16px] font-semibold tracking-wide capitalize ${membro.selecionado ? 'text-white' : 'text-[#e5e5e5]'}`}>{membro.nome}</h3>
                    <div className="text-[#999999] text-[13px] mt-0.5 flex flex-col items-start gap-1">
                      <span className="capitalize">{membro.funcao}</span>
                      {membro.estaEmOutroSetor && !membro.selecionado && (
                        <span className="text-[#eab308] text-[11px] font-bold uppercase tracking-wider bg-[#eab308]/10 px-2 py-0.5 rounded-sm">Já escalado: {membro.estaEmOutroSetor}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`w-[24px] h-[24px] rounded-[2px] flex items-center justify-center border shrink-0 ${membro.selecionado ? 'bg-[#2563eb] border-[#2563eb]' : 'bg-[#1a1a1a] border-[#555]'}`}>
                  {membro.selecionado && <Check size={16} className="text-white" strokeWidth={3.5} />}
                </div>
              </div>
            ))}
            {equipeFiltrada.length === 0 && <div className="text-center py-10 text-[#777]">Nenhum staff encontrado.</div>}
          </div>
        </div>

        <div className="p-5 border-t border-[#333333] bg-[#1a1a1a] fixed bottom-0 w-full max-w-[500px] z-20">
          <button onClick={handleSalvarEscala} disabled={salvando} className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-bold py-4 rounded-sm flex justify-center items-center gap-2 disabled:opacity-50 transition-colors shadow-sm cursor-pointer text-[16px]">
            {salvando ? <Loader2 className="animate-spin" size={22} /> : <Save size={22} strokeWidth={2} />}
            {salvando ? "Salvando Equipe..." : "Confirmar Escala do Setor"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AlocarEquipe() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#171717] flex flex-col items-center justify-center text-[#777]"><Loader2 className="animate-spin mb-4 text-[#2563eb]" size={40} /><p>Preparando painel...</p></div>}>
      <AlocarEquipeConteudo />
    </Suspense>
  );
}