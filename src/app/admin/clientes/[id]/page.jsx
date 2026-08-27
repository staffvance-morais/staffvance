"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { 
  ArrowLeft, 
  Building, 
  User, 
  Mail, 
  Phone, 
  FileEdit, 
  Loader2 
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function DetalhesCliente() {
  const router = useRouter();
  const params = useParams(); 
  const id = params?.id; // Pega o ID direto da URL

  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCliente = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', id)
          .single(); // single() porque queremos apenas 1 cliente específico

        if (error) throw error;
        if (data) setCliente(data);
      } catch (error) {
        console.error("Erro ao buscar detalhes do cliente:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCliente();
  }, [id]);

  return (
    <div className="min-h-screen bg-[#171717] font-sans flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-[#1c1c1c] border border-[#333] flex flex-col relative min-h-[85vh]">
        
        {/* CABEÇALHO COM BOTÃO VOLTAR */}
        <div className="p-4 border-b border-[#333] flex items-center gap-3">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center border border-[#444] bg-[#2a2a2a] text-[#aaa] hover:bg-[#333] hover:text-white transition-colors rounded-sm"
          >
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
          <h1 className="text-[#e5e5e5] text-[18px] font-semibold tracking-wide">
            Detalhes do Cliente
          </h1>
        </div>

        {/* ÁREA DE CONTEÚDO */}
        <div className="p-5 flex-1 flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center flex-1 text-[#777]">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p>Carregando dados...</p>
            </div>
          ) : !cliente ? (
            <div className="flex flex-col items-center justify-center flex-1 text-[#777]">
              <p>Cliente não encontrado.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              
              {/* FOTO E NOME DA EMPRESA */}
              <div className="flex flex-col items-center text-center pb-4 border-b border-[#333]">
                <div className="w-24 h-24 bg-[#1a1a1a] border border-[#444] mb-4 flex items-center justify-center overflow-hidden rounded-sm relative">
                  {cliente.foto_url && cliente.foto_url.trim() !== "" ? (
                    <img src={cliente.foto_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-[#666]">Sem Imagem</span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-[#e5e5e5]">{cliente.empresa || "Não informada"}</h2>
                <p className="text-[#999] mt-1">{cliente.representante || "Sem representante"}</p>
              </div>

              {/* LISTA DE DADOS */}
              <div className="flex flex-col gap-3">
                <h3 className="text-[#eee] font-bold text-sm tracking-wide mb-2 uppercase opacity-80">Informações de Contato</h3>
                
                <div className="flex items-center border border-[#333] bg-[#222] p-3 rounded-sm">
                  <User size={18} className="text-[#777] shrink-0" strokeWidth={1.5} />
                  <div className="ml-3">
                    <p className="text-[11px] text-[#777] uppercase font-bold">Representante</p>
                    <p className="text-[#ddd] text-[15px]">{cliente.representante || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center border border-[#333] bg-[#222] p-3 rounded-sm">
                  <Building size={18} className="text-[#777] shrink-0" strokeWidth={1.5} />
                  <div className="ml-3">
                    <p className="text-[11px] text-[#777] uppercase font-bold">Empresa</p>
                    <p className="text-[#ddd] text-[15px]">{cliente.empresa || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center border border-[#333] bg-[#222] p-3 rounded-sm">
                  <Phone size={18} className="text-[#777] shrink-0" strokeWidth={1.5} />
                  <div className="ml-3">
                    <p className="text-[11px] text-[#777] uppercase font-bold">Telefone</p>
                    <p className="text-[#ddd] text-[15px]">{cliente.telefone || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center border border-[#333] bg-[#222] p-3 rounded-sm">
                  <Mail size={18} className="text-[#777] shrink-0" strokeWidth={1.5} />
                  <div className="ml-3 overflow-hidden">
                    <p className="text-[11px] text-[#777] uppercase font-bold">E-mail</p>
                    <p className="text-[#ddd] text-[15px] truncate">{cliente.email || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start border border-[#333] bg-[#222] p-3 rounded-sm mt-2">
                  <FileEdit size={18} className="text-[#777] shrink-0 mt-1" strokeWidth={1.5} />
                  <div className="ml-3 w-full">
                    <p className="text-[11px] text-[#777] uppercase font-bold">Observações</p>
                    <p className="text-[#ddd] text-[14px] mt-1 whitespace-pre-wrap">
                      {cliente.observacoes || "Nenhuma observação registrada."}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}