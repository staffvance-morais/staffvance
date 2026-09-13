"use client";
import { supabase } from "@/lib/supabase";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Edit3, 
  Save, 
  Loader2, 
  Award, 
  FileText,
  Landmark,
  CalendarFold,
  Wallet,
  GraduationCap,
  Shirt,
  ShieldCheck
} from "lucide-react";


export default function DetalhesStaffCoordenador() {
  const router = useRouter();
  const perfilId = useParams().id;
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [isCoordenadorOrAdmin, setIsCoordenadorOrAdmin] = useState(false);

  // Estados Editáveis
  const [classificacao, setClassificacao] = useState("");
  const [anotacoes, setAnotacoes] = useState("");

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        // Verifica se o usuário atual logado tem permissão
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: userPerfil } = await supabase.from('perfis').select('role').eq('id', session.user.id).single();
          const roleNorm = (userPerfil?.role || "").toLowerCase().trim();
          if (roleNorm === 'admin' || roleNorm === 'owner' || roleNorm === 'coordenador') {
            setIsCoordenadorOrAdmin(true);
          }
        }

        const { data } = await supabase.from('perfis').select('*').eq('id', perfilId).single();
        if (data) {
          setPerfil(data);
          setClassificacao(data.classificacao || "");
          setAnotacoes(data.anotacoes || "");
        }
      } catch (error) { 
        console.error(error); 
      } finally { 
        setLoading(false); 
      }
    };
    if (perfilId) fetchPerfil();
  }, [perfilId]);

  const handleSalvarEdicao = async () => {
    setSalvando(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada. Faça login novamente.");

      const payload = { 
        userId: perfilId,
        classificacao, 
        anotacoes 
      };

      const res = await fetch("/api/atualizar-usuario", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao salvar no servidor.");

      setPerfil(prev => ({ 
        ...prev, 
        classificacao, 
        anotacoes
      }));
      setEditMode(false);
    } catch (error) { 
      console.error(error);
      alert("Erro ao salvar alterações: " + (error.message || error)); 
    } finally { 
      setSalvando(false); 
    }
  };

  // Função para formatar a data do banco (AAAA-MM-DD) para (DD/MM/AAAA) visualmente
  const formatarData = (dataStr) => {
    if (!dataStr) return 'Não informada';
    if (dataStr.includes('-')) {
      const partes = dataStr.split('-');
      if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataStr;
  };

  if (loading) return <div className="min-h-screen bg-[#111] flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#111111] font-sans flex flex-col items-center pb-20">
      <div className="w-full max-w-[800px] min-h-screen bg-[#1a1a1a] border-x border-[#333]">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center p-5 border-b border-[#333]">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/coordenador/equipe")} className="text-[#999] hover:text-white cursor-pointer p-1">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-white font-semibold">Perfil do Staff</h1>
          </div>

          {isCoordenadorOrAdmin && (
            <button 
              onClick={() => editMode ? handleSalvarEdicao() : setEditMode(true)} 
              className="flex items-center gap-2 text-[#2563eb] hover:text-[#1d4ed8] font-bold cursor-pointer"
            >
              {salvando ? <Loader2 className="animate-spin" size={18}/> : editMode ? <Save size={18} /> : <Edit3 size={18} />}
              {editMode ? "SALVAR" : "EDITAR"}
            </button>
          )}
        </div>

        {/* Foto e Nome */}
        <div className="flex flex-col items-center pt-10 pb-6 border-b border-[#333]">
          <div className="w-24 h-24 bg-[#333] rounded-full overflow-hidden border-2 border-[#444] mb-4 flex items-center justify-center shadow-lg">
            {perfil?.foto_url || perfil?.avatar_url ? (
              <img src={perfil.foto_url || perfil.avatar_url} className="w-full h-full object-cover" alt="Foto" />
            ) : (
              <User size={40} className="text-[#777]"/>
            )}
          </div>
          <h2 className="text-[22px] font-bold text-white capitalize">{perfil?.nome_completo || "Sem Nome"}</h2>
          <p className="text-[#2563eb] uppercase tracking-widest text-[12px] font-bold mt-1">{perfil?.role || 'staff'}</p>
        </div>

        {/* Dados Cadastrais Completos */}
        <div className="p-6">
          <p className="text-[#777] text-[12px] font-bold uppercase tracking-wider mb-4">Dados Cadastrais</p>
          
          <div className="bg-[#222] border border-[#333] rounded-md p-4 mb-3 flex items-center gap-4">
            <User className="text-[#666]" size={20} />
            <div>
              <p className="text-[#999] text-[12px]">Nome Completo</p>
              <p className="text-[#e5e5e5] capitalize">{perfil?.nome_completo || 'Não informado'}</p>
            </div>
          </div>

          <div className="bg-[#222] border border-[#333] rounded-md p-4 mb-3 flex items-center gap-4">
            <Landmark className="text-[#666]" size={20} />
            <div>
              <p className="text-[#999] text-[12px]">CPF</p>
              <p className="text-[#e5e5e5]">{perfil?.cpf || 'Não informado'}</p>
            </div>
          </div>

          <div className="bg-[#222] border border-[#333] rounded-md p-4 mb-3 flex items-center gap-4">
            <CalendarFold className="text-[#666]" size={20} />
            <div>
              <p className="text-[#999] text-[12px]">Data de Nascimento</p>
              <p className="text-[#e5e5e5]">{formatarData(perfil?.data_nascimento)}</p>
            </div>
          </div>

          <div className="bg-[#222] border border-[#333] rounded-md p-4 mb-3 flex items-center gap-4">
            <Phone className="text-[#666]" size={20} />
            <div>
              <p className="text-[#999] text-[12px]">WhatsApp</p>
              <p className="text-[#e5e5e5]">{perfil?.whatsapp || 'Não informado'}</p>
            </div>
          </div>

          <div className="bg-[#222] border border-[#333] rounded-md p-4 mb-3 flex items-center gap-4">
            <Wallet className="text-[#666]" size={20} />
            <div className="overflow-hidden">
              <p className="text-[#999] text-[12px]">Chave Pix</p>
              <p className="text-[#e5e5e5] truncate">{perfil?.chave_pix || 'Não informada'}</p>
            </div>
          </div>

          <div className="bg-[#222] border border-[#333] rounded-md p-4 mb-3 flex items-center gap-4">
            <GraduationCap className="text-[#666]" size={20} />
            <div>
              <p className="text-[#999] text-[12px]">Curso de Segurança</p>
              <p className="text-[#e5e5e5]">
                {perfil?.curso === 'nenhum' ? 'Não possui' :
                 perfil?.curso === 'apoio' ? 'Apoio e Segurança em Eventos' :
                 perfil?.curso === 'extensao' ? 'Extensão para Grandes Eventos' :
                 (perfil?.curso || 'Não informado')}
              </p>
            </div>
          </div>

          <div className="bg-[#222] border border-[#333] rounded-md p-4 mb-3 flex items-center gap-4">
            <Shirt className="text-[#666]" size={20} />
            <div>
              <p className="text-[#999] text-[12px]">Tamanho do Uniforme</p>
              <p className="text-[#e5e5e5] uppercase">{perfil?.uniforme || 'Não informado'}</p>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-[#777] text-[12px] font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><Award size={14}/> Gestão Interna (Morais)</p>
            
            {/* Cargo/Papel no Sistema */}
            <div className="bg-[#222] border border-[#333] rounded-md p-5 mb-4">
              <p className="text-[#999] text-[13px] mb-3 flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#2563eb]"/> Cargo / Função no Sistema:
              </p>
              <span className={`inline-block px-4 py-1.5 rounded-sm font-bold text-[13px] uppercase tracking-wider ${
                perfil?.role === 'coordenador' 
                  ? 'bg-purple-900/40 text-purple-300 border border-purple-600/50' 
                  : perfil?.role === 'admin' 
                    ? 'bg-red-900/40 text-red-300 border border-red-600/50' 
                    : 'bg-blue-900/40 text-blue-300 border border-blue-600/50'
              }`}>
                {perfil?.role || 'staff'}
              </span>
            </div>

            {/* Classificação do Staff */}
            <div className="bg-[#222] border border-[#333] rounded-md p-5 mb-4">
              <p className="text-[#999] text-[13px] mb-3">Classificação do Staff:</p>
              {editMode ? (
                <div className="flex gap-3">
                  {['Ouro', 'Prata', 'Bronze'].map(cat => (
                    <button 
                      key={cat} 
                      type="button"
                      onClick={() => setClassificacao(cat)} 
                      className={`px-4 py-2 rounded-sm border font-bold text-[13px] transition-colors cursor-pointer ${
                        classificacao === cat 
                          ? 'bg-[#2563eb] border-[#2563eb] text-white' 
                          : 'border-[#444] text-[#777] hover:bg-[#333] hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              ) : (
                <span className={`px-4 py-1.5 rounded-sm font-bold text-[13px] uppercase ${
                  classificacao === 'Ouro' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 
                  classificacao === 'Prata' ? 'bg-gray-400/20 text-gray-300 border border-gray-400/50' : 
                  classificacao === 'Bronze' ? 'bg-orange-700/20 text-orange-500 border border-orange-700/50' : 
                  'text-[#666] border border-[#444]'
                }`}>
                  {classificacao || 'Não Classificado'}
                </span>
              )}
            </div>

            {/* Anotações Confidenciais */}
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