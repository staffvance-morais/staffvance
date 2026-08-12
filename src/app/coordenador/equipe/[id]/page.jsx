"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, User, Phone, FileText, Briefcase } from "lucide-react";

// Configuração do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function DetalhesStaff() {
  const router = useRouter();
  const { id } = useParams();
  
  const [membro, setMembro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function fetchDetalhes() {
      if (!id) return;
      
      const { data, error } = await supabase
        .from("perfis")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Erro ao buscar detalhes do staff:", error);
        setErro("Perfil não encontrado no sistema.");
      } else {
        setMembro(data);
      }
      setLoading(false);
    }
    
    fetchDetalhes();
  }, [id]);

  // Função para pegar a foto (ajuste "foto_url" ou "avatar_url" conforme o nome da sua coluna no Supabase)
  const urlDaFoto = membro?.foto_url || membro?.avatar_url;

  return (
    <div className="min-h-screen bg-[#141414] text-gray-300 font-sans flex flex-col relative pb-10">
      
      {/* Cabeçalho de Voltar */}
      <div className="p-4 flex items-center gap-3 pt-6 mb-2">
        <button 
          onClick={() => router.push("/coordenador/equipe")}
          className="p-2 bg-[#2a2a2a] border border-[#333] rounded-sm hover:bg-[#333] transition-colors flex items-center justify-center text-gray-300"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        <span className="text-gray-300 text-base tracking-wide font-medium">Perfil do Staff</span>
      </div>
      
      <div className="w-full h-px bg-[#333] mb-6"></div>

      {/* Área de Conteúdo */}
      <div className="px-4 flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center mt-20 gap-4">
             <div className="w-8 h-8 border-4 border-gray-600 border-t-[#1e50cf] rounded-full animate-spin"></div>
             <p className="text-gray-500">Carregando dados...</p>
          </div>
        ) : erro ? (
          <div className="bg-[#dc2626]/20 border border-[#dc2626] text-[#f87171] p-4 text-sm rounded-sm text-center">
            {erro}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* Bloco Superior: Foto e Nome */}
            <div className="flex flex-col items-center gap-4 bg-[#1a1a1a] border border-[#333] p-6 rounded-sm text-center">
              
              {/* === ÁREA DA FOTO ATUALIZADA === */}
              <div className="w-24 h-24 bg-[#2a2a2a] shrink-0 rounded-sm overflow-hidden flex items-center justify-center shadow-lg border border-[#444]">
                {urlDaFoto ? (
                  <img 
                    src={urlDaFoto} 
                    alt={`Foto de ${membro?.nome_completo}`} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={40} className="text-[#555]" />
                )}
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-white capitalize">
                  {membro?.nome_completo || "Nome não cadastrado"}
                </h1>
                <p className="text-[#1e50cf] font-medium text-sm mt-1 uppercase tracking-widest">
                  {membro?.role || "Staff"}
                </p>
              </div>
            </div>

            {/* Bloco de Informações Detalhadas */}
            <div className="flex flex-col gap-3">
              <h2 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 ml-1">Dados Cadastrais</h2>
              
              {/* Item: Nome */}
              <div className="flex items-center gap-4 bg-[#1e1e1e] border border-[#333] p-4 rounded-sm">
                <div className="text-gray-500">
                  <User size={20} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Nome Completo</span>
                  <span className="text-gray-200 capitalize">{membro?.nome_completo || "-"}</span>
                </div>
              </div>

              {/* Item: CPF */}
              <div className="flex items-center gap-4 bg-[#1e1e1e] border border-[#333] p-4 rounded-sm">
                <div className="text-gray-500">
                  <FileText size={20} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">CPF</span>
                  <span className="text-gray-200">{membro?.cpf || "Não informado"}</span>
                </div>
              </div>

              {/* Item: WhatsApp */}
              <div className="flex items-center gap-4 bg-[#1e1e1e] border border-[#333] p-4 rounded-sm">
                <div className="text-gray-500">
                  <Phone size={20} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">WhatsApp</span>
                  <span className="text-gray-200">{membro?.whatsapp || "Não informado"}</span>
                </div>
              </div>

              {/* Item: ID do Sistema (Oculto ou para controle interno) */}
              <div className="flex items-center gap-4 bg-[#1e1e1e] border border-[#333] p-4 rounded-sm opacity-60">
                <div className="text-gray-600">
                  <Briefcase size={20} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">ID no Sistema</span>
                  <span className="text-gray-400 text-[10px] break-all">{membro?.id}</span>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  );
}