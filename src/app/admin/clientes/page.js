"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Search, 
  Handshake, 
  Info, 
  Check, 
  Filter, 
  ChevronUp, 
  Menu,
  Loader2,
  Trash2,
  AlertTriangle
} from "lucide-react";

// ==========================================
// COMPONENTE: CARD DO CLIENTE
// ==========================================
const ClienteCard = ({ id, nome, representante, foto, selected, router, onDeleteClick }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="border border-[#3a3a3a] bg-[#222222] flex p-3 mb-3 rounded-sm relative">
      
      {/* Imagem do Cliente com Checkbox sobreposto */}
      <div className="w-[70px] h-[70px] bg-[#1a1a1a] mr-4 shrink-0 relative border border-[#444]">
        {foto && !imgError ? (
          <img 
            src={foto} 
            alt={nome} 
            className="w-full h-full object-cover" 
            onError={() => setImgError(true)} 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-[#666] text-center p-1">Sem Imagem</div>
        )}
        
        {/* Checkbox no topo esquerdo da foto */}
        <div className={`absolute -top-2 -left-2 w-5 h-5 border ${selected ? 'bg-[#2563eb] border-[#2563eb]' : 'bg-[#1a1a1a] border-[#444]'} flex items-center justify-center rounded-sm`}>
          {selected && <Check size={14} className="text-white" strokeWidth={3} />}
        </div>
      </div>

      {/* Detalhes do Cliente */}
      <div className="flex-1 flex justify-between items-end">
        <div className="pb-1">
          <h3 className="text-[#e5e5e5] text-[18px] font-semibold leading-tight">{nome}</h3>
          <p className="text-[#999999] text-[14px] mt-1">{representante}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Botão de Excluir */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              onDeleteClick({ id, nome });
            }}
            title="Excluir cliente"
            className="w-9 h-9 border border-[#442222] rounded-sm bg-[#2a1515] flex items-center justify-center text-red-500 hover:bg-red-950 hover:border-red-700 hover:text-red-300 transition-colors cursor-pointer z-10"
          >
            <Trash2 size={17} strokeWidth={1.8} />
          </button>

          {/* Botão de Info */}
          <button 
            onClick={(e) => {
              e.preventDefault(); 
              router.push(`/admin/clientes/${id}`);
            }}
            title="Ver detalhes"
            className="w-9 h-9 border border-[#444] rounded-sm bg-[#2a2a2a] flex items-center justify-center text-[#999] hover:bg-[#333] transition-colors cursor-pointer z-10"
          >
            <Info size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// PÁGINA PRINCIPAL: CLIENTES
// ==========================================
export default function PainelClientes() {
  const router = useRouter(); 
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  // Estado para exclusão
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, nome }
  const [deletando, setDeletando] = useState(false);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn("Aviso: Tabela de clientes vazia ou não encontrada.", error.message);
        setClientes([]);
        return;
      }

      if (data) {
        const clientesFormatados = data.map(cli => ({
          id: cli.id,
          nome: cli.empresa || "Empresa não informada",
          representante: cli.representante || "Sem representante", 
          foto: (cli.foto_url && cli.foto_url.trim() !== "") ? cli.foto_url : null,
          selected: false 
        }));
        setClientes(clientesFormatados);
      }
    } catch (error) {
      console.error("Erro ao buscar clientes:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarExclusao = async () => {
    if (!confirmDelete) return;
    setDeletando(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      let deletado = false;

      // 1. Tenta deletar via API de admin com token
      if (session?.access_token) {
        const res = await fetch("/api/admin/deletar-cliente", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ clienteId: confirmDelete.id }),
        });

        if (res.ok) {
          deletado = true;
        } else {
          const json = await res.json().catch(() => ({}));
          console.warn("Aviso rota API deletar cliente:", json.error);
        }
      }

      // 2. Se a rota API falhou ou não tinha token de admin, tenta direto via client Supabase
      if (!deletado) {
        // Desvincula eventos primeiro
        await supabase
          .from("eventos")
          .update({ cliente_id: null })
          .eq("cliente_id", confirmDelete.id);

        const { error: dbError } = await supabase
          .from("clientes")
          .delete()
          .eq("id", confirmDelete.id);

        if (dbError) throw dbError;
      }

      setClientes(prev => prev.filter(c => c.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (err) {
      console.error("Erro ao excluir cliente:", err);
      alert("Erro ao excluir cliente: " + (err.message || "Tente novamente"));
    } finally {
      setDeletando(false);
    }
  };

  const clientesFiltrados = clientes.filter(cli => 
    cli.nome.toLowerCase().includes(busca.toLowerCase()) ||
    cli.representante.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#171717] font-sans flex flex-col items-center justify-center">
      
      <div className="w-full max-w-[400px] h-[100dvh] flex flex-col p-4 bg-[#171717] relative">
        
        {/* CABEÇALHO */}
        <div className="flex items-center gap-3 text-[#cccccc] pb-3 border-b border-[#333333]">
          <Handshake size={20} strokeWidth={1.5} />
          <h1 className="text-[17px] tracking-wide">Clientes</h1>
        </div>

        {/* BARRA DE PESQUISA */}
        <div className="mt-4 relative shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777]" size={22} strokeWidth={1.5} />
          <input 
            type="text" 
            placeholder="Toque para pesquisar" 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-[#2a2a2a] border border-[#3a3a3a] text-[#e5e5e5] py-3.5 pl-[46px] pr-4 outline-none text-[17px] rounded-sm placeholder:text-[#777] focus:border-[#555] transition-colors" 
          />
        </div>

        {/* CONTAGEM DE LISTA */}
        <div className="mt-4 mb-3 text-[14px] text-[#999999] tracking-wide shrink-0">
          Listando {clientesFiltrados.length} de {clientes.length}
        </div>

        {/* ÁREA DE ROLAGEM DOS CARDS */}
        <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#777]">
              <Loader2 className="animate-spin mb-2" size={28} />
              <p className="text-sm">Carregando clientes...</p>
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="text-center py-20 text-[#777] bg-[#222] rounded-sm border border-[#333]">
              <p className="font-semibold text-[#e5e5e5] mb-1">Nenhum cliente encontrado.</p>
            </div>
          ) : (
            clientesFiltrados.map((cli) => (
              <ClienteCard 
                key={cli.id}
                id={cli.id}
                nome={cli.nome}
                representante={cli.representante}
                foto={cli.foto}
                selected={cli.selected}
                router={router}
                onDeleteClick={(clienteInfo) => setConfirmDelete(clienteInfo)}
              />
            ))
          )}
        </div>

        {/* ÁREA INFERIOR FIXA (BOTÕES E MENU) */}
        <div className="shrink-0 pt-2 flex flex-col gap-3 bg-[#171717]">
          
          <Link 
            href="/admin/clientes/cadastrar"
            className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white flex items-center justify-center font-semibold py-4 text-[18px] tracking-wide rounded-sm transition-colors shadow-sm cursor-pointer"
          >
            Cadastrar cliente
          </Link>

          <button className="w-full bg-[#2a2a2a] border border-[#3a3a3a] hover:bg-[#333] text-[#a3a3a3] py-[14px] flex items-center justify-between px-4 rounded-sm transition-colors cursor-pointer">
            <div className="flex items-center gap-3 text-[17px] tracking-wide">
              <Filter size={22} strokeWidth={1.5} /> Mais opções...
            </div>
            <div className="p-0.5 border border-[#4a4a4a] rounded-sm bg-[#222]">
              <ChevronUp size={20} strokeWidth={1.5} className="text-[#999]" />
            </div>
          </button>

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

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {confirmDelete && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-6"
          onClick={() => !deletando && setConfirmDelete(null)}
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
              Deseja remover <strong className="text-white font-semibold">"{confirmDelete.nome}"</strong>? Somente prossiga se realmente não for mais trabalhar com este cliente.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={deletando}
                className="flex-1 py-3 border border-[#444] bg-[#2a2a2a] text-gray-300 rounded-sm text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusao}
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