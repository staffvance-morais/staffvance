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
  Loader2,
} from "lucide-react";
import AppNavigation from "@/components/AppNavigation";

const ClienteCard = ({ id, nome, representante, foto, selected, router }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="border border-[#3a3a3a] bg-[#222222] flex p-3 mb-3 rounded-sm relative">
      <div className="w-[70px] h-[70px] bg-[#1a1a1a] mr-4 shrink-0 relative border border-[#444]">
        {foto && !imgError ? (
          <img
            src={foto}
            alt={nome}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-[#666] text-center p-1">
            Sem Imagem
          </div>
        )}
        <div
          className={`absolute -top-2 -left-2 w-5 h-5 border ${
            selected
              ? "bg-[#2563eb] border-[#2563eb]"
              : "bg-[#1a1a1a] border-[#444]"
          } flex items-center justify-center rounded-sm`}
        >
          {selected && (
            <Check size={14} className="text-white" strokeWidth={3} />
          )}
        </div>
      </div>

      <div className="flex-1 flex justify-between items-end">
        <div className="pb-1">
          <h3 className="text-[#e5e5e5] text-[18px] font-semibold leading-tight">
            {nome}
          </h3>
          <p className="text-[#999999] text-[14px] mt-1">{representante}</p>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            router.push(`/coordenador/clientes/${id}`);
          }}
          className="w-9 h-9 border border-[#444] rounded-sm bg-[#2a2a2a] flex items-center justify-center text-[#999] hover:bg-[#333] transition-colors cursor-pointer z-10"
        >
          <Info size={20} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};

export default function PainelClientesCoordenador() {
  const router = useRouter();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [perfil, setPerfil] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    async function checkSecurity() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      const { data: perfilData } = await supabase
        .from("perfis")
        .select("*")
        .eq("id", user.id)
        .single();

      if (
        !perfilData ||
        (perfilData.role !== "coordenador" && perfilData.role !== "admin")
      ) {
        router.push("/freelancers");
      } else {
        setPerfil(perfilData);
        setIsAuthorized(true);
      }
    }

    checkSecurity();
  }, [router]);

  useEffect(() => {
    if (!isAuthorized) return;

    const fetchClientes = async () => {
      try {
        const { data, error } = await supabase
          .from("clientes")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.warn(
            "Aviso: Tabela de clientes vazia ou nao encontrada.",
            error.message
          );
          setClientes([]);
          return;
        }

        if (data) {
          const clientesFormatados = data.map((cli) => ({
            id: cli.id,
            nome: cli.empresa || "Empresa nao informada",
            representante: cli.representante || "Sem representante",
            foto:
              cli.foto_url && cli.foto_url.trim() !== "" ? cli.foto_url : null,
            selected: false,
          }));
          setClientes(clientesFormatados);
        }
      } catch (error) {
        console.error("Erro ao buscar clientes:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, [isAuthorized]);

  const clientesFiltrados = clientes.filter(
    (cli) =>
      cli.nome.toLowerCase().includes(busca.toLowerCase()) ||
      cli.representante.toLowerCase().includes(busca.toLowerCase())
  );

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <span className="text-neutral-500 font-medium animate-pulse">
          Verificando credenciais...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#171717] font-sans flex flex-col items-center justify-center">
      <div className="w-full max-w-[400px] h-[100dvh] flex flex-col p-4 bg-[#171717] relative">
        <div className="flex items-center gap-3 text-[#cccccc] pb-3 border-b border-[#333333]">
          <Handshake size={20} strokeWidth={1.5} />
          <h1 className="text-[17px] tracking-wide">Clientes</h1>
        </div>

        <div className="mt-4 relative shrink-0">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777]"
            size={22}
            strokeWidth={1.5}
          />
          <input
            type="text"
            placeholder="Toque para pesquisar"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-[#2a2a2a] border border-[#3a3a3a] text-[#e5e5e5] py-3.5 pl-[46px] pr-4 outline-none text-[17px] rounded-sm placeholder:text-[#777] focus:border-[#555] transition-colors"
          />
        </div>

        <div className="mt-4 mb-3 text-[14px] text-[#999999] tracking-wide shrink-0">
          Listando {clientesFiltrados.length} de {clientes.length} -{" "}
          <span className="text-[#e5e5e5] font-semibold">0 selecionados</span>
        </div>

        <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#777]">
              <Loader2 className="animate-spin mb-2" size={28} />
              <p className="text-sm">Carregando clientes...</p>
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="text-center py-20 text-[#777] bg-[#222] rounded-sm border border-[#333]">
              <p className="font-semibold text-[#e5e5e5] mb-1">
                Nenhum cliente encontrado.
              </p>
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
              />
            ))
          )}
        </div>

        <div className="shrink-0 pt-2 flex flex-col gap-3 bg-[#171717]">
          <Link
            href="/coordenador/clientes/cadastrar"
            className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white flex items-center justify-center font-semibold py-4 text-[18px] tracking-wide rounded-sm transition-colors shadow-sm cursor-pointer"
          >
            Cadastrar cliente
          </Link>

          <button className="w-full bg-[#2a2a2a] border border-[#3a3a3a] hover:bg-[#333] text-[#a3a3a3] py-[14px] flex items-center justify-between px-4 rounded-sm transition-colors cursor-pointer">
            <div className="flex items-center gap-3 text-[17px] tracking-wide">
              <Filter size={22} strokeWidth={1.5} /> Mais opcoes...
            </div>
            <div className="p-0.5 border border-[#4a4a4a] rounded-sm bg-[#222]">
              <ChevronUp size={20} strokeWidth={1.5} className="text-[#999]" />
            </div>
          </button>

          <AppNavigation userProfile={perfil} userRole="coordenador" />
        </div>
      </div>
    </div>
  );
}
