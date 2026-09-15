"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import HeaderSuperior from "@/components/HeaderSuperior";
import { Search, Info, Plus, Filter, ChevronUp, Menu, User, Trash2, X, ZoomIn, AlertTriangle } from "lucide-react";

export default function EquipeAdmin() {
  const router = useRouter();
  
  const [equipeList, setEquipeList] = useState([]);
  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado do lightbox (ampliar foto)
  const [fotoAmpliada, setFotoAmpliada] = useState(null); // { url, nome }

  // Estado do modal de confirmação de exclusão
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, nome } ou "bulk"
  const [deletando, setDeletando] = useState(false);

  useEffect(() => {
    fetchEquipe();
  }, []);

  async function fetchEquipe() {
    setLoading(true);
    const { data, error } = await supabase
      .from("perfis")
      .select("*")
      .order("nome_completo", { ascending: true });

    if (error) {
      console.error("Erro ao buscar equipe:", error);
    } else {
      setEquipeList(data || []);
    }
    setLoading(false);
  }

  const filtrados = equipeList.filter((membro) => {
    const nome = membro.nome_completo ? membro.nome_completo.toLowerCase() : "";
    const cargo = (membro.cargo || (membro.role === 'producao' ? 'Produção' : membro.role) || "").toLowerCase();
    const termo = busca.toLowerCase();
    return nome.includes(termo) || cargo.includes(termo);
  });

  const handleSelecionar = (id) => {
    if (selecionados.includes(id)) {
      setSelecionados(selecionados.filter((itemId) => itemId !== id));
    } else {
      setSelecionados([...selecionados, id]);
    }
  };

  // ─── DELETAR UM MEMBRO (Auth + perfil via API server-side) ─────────
  const handleDeletarUm = async (id) => {
    setDeletando(true);
    try {
      // Obtém o token JWT da sessão atual para autenticar no servidor
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada. Faça login novamente.");

      const res = await fetch("/api/deletar-usuario", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId: id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro desconhecido");
      setEquipeList((prev) => prev.filter((m) => m.id !== id));
      setSelecionados((prev) => prev.filter((sid) => sid !== id));
    } catch (err) {
      console.error("Erro ao deletar membro:", err);
      alert("Erro ao excluir o membro: " + err.message);
    } finally {
      setDeletando(false);
      setConfirmDelete(null);
    }
  };

  // ─── DELETAR SELECIONADOS (Auth + perfil via API server-side) ───────
  const handleDeletarSelecionados = async () => {
    setDeletando(true);
    try {
      // Obtém o token JWT da sessão atual uma só vez
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada. Faça login novamente.");

      const token = session.access_token;

      // Envia um DELETE para cada usuário selecionado em paralelo
      const resultados = await Promise.all(
        selecionados.map((id) =>
          fetch("/api/deletar-usuario", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ userId: id }),
          }).then((r) => r.json().then((j) => ({ id, ok: r.ok, error: j.error })))
        )
      );

      const falhas = resultados.filter((r) => !r.ok);
      if (falhas.length > 0) {
        console.error("Falhas ao deletar:", falhas);
        alert(`${falhas.length} membro(s) não puderam ser excluídos.`);
      }

      // Remove da lista local apenas os que tiveram sucesso
      const idsRemovidos = resultados.filter((r) => r.ok).map((r) => r.id);
      setEquipeList((prev) => prev.filter((m) => !idsRemovidos.includes(m.id)));
      setSelecionados((prev) => prev.filter((id) => !idsRemovidos.includes(id)));
    } catch (err) {
      console.error("Erro ao deletar membros:", err);
      alert("Erro ao excluir os membros. Tente novamente.");
    } finally {
      setDeletando(false);
      setConfirmDelete(null);
    }
  };

  const confirmarDelecao = () => {
    if (confirmDelete === "bulk") {
      handleDeletarSelecionados();
    } else if (confirmDelete?.id) {
      handleDeletarUm(confirmDelete.id);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-gray-300 font-sans flex flex-col relative pb-48">
      <div className="p-4 pt-6">
        <HeaderSuperior />
      </div>

      <div className="px-4 flex-1">
        <div className="relative flex items-center mb-2">
          <Search size={20} className="absolute left-3 text-gray-500" strokeWidth={2} />
          <input
            type="text"
            placeholder="Toque para pesquisar"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-[#262626] text-white outline-none py-3 pr-4 pl-10 border border-[#333] focus:border-[#555] transition-colors rounded-sm placeholder-gray-500"
          />
        </div>

        <p className="text-xs text-gray-400 font-medium mb-4">
          Listando {filtrados.length} de {equipeList.length} -{" "}
          <span className="font-bold text-gray-300">{selecionados.length} selecionados</span>
        </p>

        <div className="flex flex-col gap-2">
          {loading ? (
            <p className="text-center text-gray-500 text-sm py-4">Carregando equipe...</p>
          ) : filtrados.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-4">Nenhum membro encontrado.</p>
          ) : (
            filtrados.map((membro) => {
              const urlDaFoto = membro.foto_url || membro.avatar_url;
              const estaSelecionado = selecionados.includes(membro.id);

              return (
                <div key={membro.id} className="relative border border-[#333] bg-[#1e1e1e] p-3 flex gap-3">
                  <div className="pt-1">
                    <div
                      onClick={() => handleSelecionar(membro.id)}
                      className={`w-5 h-5 border flex items-center justify-center cursor-pointer transition-colors ${
                        estaSelecionado ? "bg-[#333] border-[#555]" : "border-[#444] bg-[#2a2a2a]"
                      }`}
                    >
                      {estaSelecionado && <div className="w-3 h-3 bg-gray-400" />}
                    </div>
                  </div>

                  <div
                    onClick={() => urlDaFoto && setFotoAmpliada({ url: urlDaFoto, nome: membro.nome_completo })}
                    className={`w-16 h-16 bg-[#2a2a2a] shrink-0 rounded-sm overflow-hidden flex items-center justify-center border border-[#444] relative group ${
                      urlDaFoto ? "cursor-zoom-in" : ""
                    }`}
                  >
                    {urlDaFoto ? (
                      <>
                        <img src={urlDaFoto} alt="Foto" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ZoomIn size={20} className="text-white drop-shadow" />
                        </div>
                      </>
                    ) : (
                      <User size={28} className="text-[#555]" />
                    )}
                  </div>

                  <div className="flex flex-col justify-center flex-1 min-w-0">
                    <h3 className="text-white font-bold text-lg leading-tight truncate">
                      {membro.nome_completo || "Nome não definido"}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1 capitalize">
                      {membro.cargo || (membro.role === 'producao' ? 'Produção' : membro.role) || "Cargo não definido"}
                    </p>
                  </div>

                  <button
                    onClick={() => router.push(`/admin/funcionarios/${membro.id}`)}
                    className="absolute right-12 bottom-3 w-8 h-8 border border-[#444] bg-[#2a2a2a] flex items-center justify-center text-gray-400 hover:bg-[#333] hover:text-white transition-colors rounded-sm cursor-pointer"
                  >
                    <Info size={18} strokeWidth={2} />
                  </button>

                  <button
                    onClick={() =>
                      setConfirmDelete({ id: membro.id, nome: membro.nome_completo || "este membro" })
                    }
                    className="absolute right-3 bottom-3 w-8 h-8 border border-[#442222] bg-[#2a1515] flex items-center justify-center text-red-500 hover:bg-red-950 hover:border-red-700 hover:text-red-300 transition-colors rounded-sm cursor-pointer"
                    title="Excluir membro"
                  >
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-[#141414] p-4 flex flex-col gap-2 border-t border-[#222]">
        {selecionados.length > 0 && (
          <button
            onClick={() => setConfirmDelete("bulk")}
            className="w-full bg-red-950 border border-red-800 text-red-400 font-medium text-base py-3 flex items-center justify-center gap-2 rounded-sm hover:bg-red-900 transition-colors"
          >
            <Trash2 size={18} strokeWidth={2} />
            Excluir {selecionados.length} selecionado{selecionados.length > 1 ? "s" : ""}
          </button>
        )}

        <button
          onClick={() => router.push("/admin/funcionarios/novo")}
          className="w-full bg-[#1e50cf] hover:bg-[#163a99] text-white font-medium text-lg py-4 flex items-center justify-center gap-2 rounded-sm transition-colors"
        >
          <Plus size={24} strokeWidth={2.5} />
          Adicionar Membro
        </button>

        <button className="w-full bg-[#2a2a2a] border border-[#333] text-gray-400 py-3 px-4 flex items-center justify-between rounded-sm hover:bg-[#333] transition-colors">
          <div className="flex items-center gap-2">
            <Filter size={20} strokeWidth={1.5} />
            <span className="text-base">Mais opções...</span>
          </div>
          <ChevronUp size={20} strokeWidth={1.5} />
        </button>

        <div className="w-full border border-[#333] p-3 mt-1 flex justify-between items-center bg-[#1a1a1a] rounded-sm">
          <div className="w-9 h-9 flex items-center justify-center opacity-40 grayscale">
            <img src="/icon.png" alt="Logo" className="h-full object-contain" />
          </div>
          <button
            onClick={() => router.push("/admin")}
            className="p-2 border border-[#444] rounded-sm bg-transparent hover:bg-[#2a2a2a] transition-colors"
          >
            <Menu size={26} className="text-gray-400" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {fotoAmpliada && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setFotoAmpliada(null)}
        >
          <div
            className="relative max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setFotoAmpliada(null)}
              className="absolute -top-4 -right-4 z-10 w-9 h-9 bg-[#333] border border-[#555] rounded-full flex items-center justify-center text-gray-300 hover:bg-[#444] transition-colors"
            >
              <X size={18} />
            </button>
            <img
              src={fotoAmpliada.url}
              alt={fotoAmpliada.nome}
              className="w-full rounded-sm border border-[#444] object-contain max-h-[70vh]"
            />
            {fotoAmpliada.nome && (
              <p className="text-center text-gray-300 text-sm mt-3 font-medium">
                {fotoAmpliada.nome}
              </p>
            )}
          </div>
        </div>
      )}

      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-6"
          onClick={() => !deletando && setConfirmDelete(null)}
        >
          <div
            className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-sm p-6 w-full max-w-xs flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-950 border border-red-800 rounded-sm flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base leading-tight">Confirmar exclusão</h3>
                <p className="text-gray-400 text-xs mt-0.5">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              {confirmDelete === "bulk"
                ? `Deseja excluir os ${selecionados.length} membros selecionados permanentemente?`
                : `Deseja excluir "${confirmDelete.nome}" permanentemente?`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deletando}
                className="flex-1 py-3 border border-[#444] bg-[#2a2a2a] text-gray-300 rounded-sm text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarDelecao}
                disabled={deletando}
                className="flex-1 py-3 bg-red-700 hover:bg-red-600 text-white rounded-sm text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {deletando ? (
                  <span>Excluindo...</span>
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