"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeft, 
  Building, 
  User, 
  Mail, 
  Phone, 
  FileEdit, 
  Loader2,
  Trash2,
  AlertTriangle 
} from "lucide-react";

export default function DetalhesCliente() {
  const router = useRouter();
  const params = useParams(); 
  const id = params?.id; // Pega o ID direto da URL

  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deletando, setDeletando] = useState(false);

  useEffect(() => {
    const fetchCliente = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', id)
          .single();

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

  const handleExcluirCliente = async () => {
    setDeletando(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let deletado = false;

      if (session?.access_token) {
        const res = await fetch("/api/admin/deletar-cliente", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ clienteId: id }),
        });

        if (res.ok) {
          deletado = true;
        } else {
          const json = await res.json().catch(() => ({}));
          console.warn("Aviso rota API deletar cliente:", json.error);
        }
      }

      if (!deletado) {
        // Fallback direto
        await supabase
          .from("eventos")
          .update({ cliente_id: null })
          .eq("cliente_id", id);

        const { error: dbError } = await supabase
          .from("clientes")
          .delete()
          .eq("id", id);

        if (dbError) throw dbError;
      }

      setShowConfirmDelete(false);
      router.push("/admin/clientes");
    } catch (err) {
      console.error("Erro ao excluir cliente:", err);
      alert("Erro ao excluir cliente: " + (err.message || "Tente novamente"));
      setDeletando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#171717] font-sans flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-[#1c1c1c] border border-[#333] flex flex-col relative min-h-[85vh]">
        
        {/* CABEÇALHO COM BOTÃO VOLTAR E EXCLUIR */}
        <div className="p-4 border-b border-[#333] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center border border-[#444] bg-[#2a2a2a] text-[#aaa] hover:bg-[#333] hover:text-white transition-colors rounded-sm cursor-pointer"
            >
              <ArrowLeft size={20} strokeWidth={1.5} />
            </button>
            <h1 className="text-[#e5e5e5] text-[18px] font-semibold tracking-wide">
              Detalhes do Cliente
            </h1>
          </div>

          {cliente && (
            <button
              onClick={() => setShowConfirmDelete(true)}
              title="Excluir cliente"
              className="w-10 h-10 flex items-center justify-center border border-[#442222] bg-[#2a1515] text-red-500 hover:bg-red-950 hover:border-red-700 hover:text-red-300 transition-colors rounded-sm cursor-pointer"
            >
              <Trash2 size={18} strokeWidth={1.8} />
            </button>
          )}
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

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {showConfirmDelete && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-6"
          onClick={() => !deletando && setShowConfirmDelete(false)}
        >
          <div 
            className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-sm p-6 w-full max-w-xs flex flex-col gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-950 border border-red-800 rounded-sm flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base leading-tight">Excluir cliente</h3>
                <p className="text-gray-400 text-xs mt-0.5">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed">
              Deseja excluir <strong className="text-white font-semibold">"{cliente?.empresa}"</strong>? Somente faça isso se não for mais trabalhar com este cliente.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                disabled={deletando}
                className="flex-1 py-3 border border-[#444] bg-[#2a2a2a] text-gray-300 rounded-sm text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExcluirCliente}
                disabled={deletando}
                className="flex-1 py-3 bg-red-700 hover:bg-red-600 text-white rounded-sm text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {deletando ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={15} className="animate-spin" /> Excluindo...
                  </span>
                ) : (
                  <>
                    <Trash2 size={15} />
                    Excluir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}