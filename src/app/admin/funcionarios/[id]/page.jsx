"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, User, Phone, Edit3, Save, Loader2, Award, FileText } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function PerfilDetalhado() {
  const router = useRouter();
  const perfilId = useParams().id;
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Estados Editáveis
  const [classificacao, setClassificacao] = useState("");
  const [anotacoes, setAnotacoes] = useState("");

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const { data } = await supabase.from('perfis').select('*').eq('id', perfilId).single();
        if (data) {
          setPerfil(data);
          setClassificacao(data.classificacao || "");
          setAnotacoes(data.anotacoes || "");
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    if (perfilId) fetchPerfil();
  }, [perfilId]);

  const handleSalvarEdicao = async () => {
    setSalvando(true);
    try {
      await supabase.from('perfis').update({ classificacao, anotacoes }).eq('id', perfilId);
      setPerfil(prev => ({ ...prev, classificacao, anotacoes }));
      setEditMode(false);
    } catch (error) { alert("Erro ao salvar"); } finally { setSalvando(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#111] flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#111111] font-sans flex flex-col items-center">
      <div className="w-full max-w-[800px] min-h-screen bg-[#1a1a1a] border-x border-[#333]">
        
        <div className="flex justify-between items-center p-5 border-b border-[#333]">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-[#999] hover:text-white"><ArrowLeft size={24} /></button>
            <h1 className="text-white font-semibold">Perfil Detalhado</h1>
          </div>
          <button onClick={() => editMode ? handleSalvarEdicao() : setEditMode(true)} className="flex items-center gap-2 text-[#2563eb] hover:text-[#1d4ed8] font-bold">
            {salvando ? <Loader2 className="animate-spin" size={18}/> : editMode ? <Save size={18} /> : <Edit3 size={18} />}
            {editMode ? "SALVAR" : "EDITAR"}
          </button>
        </div>

        <div className="flex flex-col items-center pt-10 pb-6 border-b border-[#333]">
          <div className="w-24 h-24 bg-[#333] rounded-full overflow-hidden border-2 border-[#444] mb-4 flex items-center justify-center">
            {perfil?.foto_url ? <img src={perfil.foto_url} className="w-full h-full object-cover" /> : <User size={40} className="text-[#777]"/>}
          </div>
          <h2 className="text-[22px] font-bold text-white capitalize">{perfil?.nome_completo}</h2>
          <p className="text-[#2563eb] uppercase tracking-widest text-[12px] font-bold mt-1">{perfil?.role}</p>
        </div>

        <div className="p-6">
          <p className="text-[#777] text-[12px] font-bold uppercase tracking-wider mb-4">Dados Cadastrais</p>
          
          <div className="bg-[#222] border border-[#333] rounded-md p-4 mb-3 flex items-center gap-4">
            <User className="text-[#666]" size={20} />
            <div>
              <p className="text-[#999] text-[12px]">Nome Completo</p>
              <p className="text-[#e5e5e5] capitalize">{perfil?.nome_completo}</p>
            </div>
          </div>

          <div className="bg-[#222] border border-[#333] rounded-md p-4 mb-3 flex items-center gap-4">
            <Phone className="text-[#666]" size={20} />
            <div>
              <p className="text-[#999] text-[12px]">WhatsApp</p>
              <p className="text-[#e5e5e5]">{perfil?.whatsapp || 'Não informado'}</p>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-[#777] text-[12px] font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><Award size={14}/> Gestão Interna (Morais)</p>
            
            <div className="bg-[#222] border border-[#333] rounded-md p-5 mb-4">
              <p className="text-[#999] text-[13px] mb-3">Classificação do Staff:</p>
              {editMode ? (
                <div className="flex gap-3">
                  {['Ouro', 'Prata', 'Bronze'].map(cat => (
                    <button key={cat} onClick={() => setClassificacao(cat)} className={`px-4 py-2 rounded-sm border font-bold text-[13px] ${classificacao === cat ? 'bg-[#2563eb] border-[#2563eb] text-white' : 'border-[#444] text-[#777] hover:bg-[#333]'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              ) : (
                <span className={`px-4 py-1.5 rounded-sm font-bold text-[13px] uppercase ${classificacao === 'Ouro' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : classificacao === 'Prata' ? 'bg-gray-400/20 text-gray-300 border border-gray-400/50' : classificacao === 'Bronze' ? 'bg-orange-700/20 text-orange-500 border border-orange-700/50' : 'text-[#666] border border-[#444]'}`}>
                  {classificacao || 'Não Classificado'}
                </span>
              )}
            </div>

            <div className="bg-[#222] border border-[#333] rounded-md p-5">
              <p className="text-[#999] text-[13px] mb-3 flex items-center gap-2"><FileText size={16}/> Anotações Confidenciais:</p>
              {editMode ? (
                <textarea 
                  value={anotacoes} 
                  onChange={(e) => setAnotacoes(e.target.value)} 
                  className="w-full bg-[#111] border border-[#444] rounded-sm p-3 text-white text-[14px] outline-none focus:border-[#2563eb] min-h-[100px]"
                  placeholder="Escreva observações sobre o comportamento, faltas..."
                />
              ) : (
                <p className="text-[#ccc] text-[14px] whitespace-pre-wrap">{anotacoes || 'Nenhuma anotação registrada.'}</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}