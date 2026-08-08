"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Home, Calendar, X, ChevronDownSquare } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function DashboardFreelancer() {
  const router = useRouter();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarPerfil();
  }, []);

  const carregarPerfil = async () => {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) throw new Error("Usuário não autenticado");

      const { data: perfilData, error: perfilError } = await supabase
        .from("perfis")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (perfilError) throw perfilError;
      setPerfil(perfilData);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error.message);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleSair = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleFechar = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-[#777] font-sans text-sm font-medium">
        Carregando...
      </div>
    );
  }

  const primeiroNome = perfil?.nome_completo?.split(" ")[0] || "Staff";

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans selection:bg-[#333] flex items-center justify-center p-4">
      {/* Painel central com borda, imitando o "modal/drawer" do design */}
      <div className="w-full max-w-sm border border-[#333] bg-[#1c1c1c] relative flex flex-col min-h-[90vh] p-6">

        {/* Botão Fechar (X) */}
        <button
          onClick={handleFechar}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center border border-[#3a3a3a] rounded-none bg-[#2a2a2a] text-[#999] hover:bg-[#333] hover:text-[#ccc] transition-colors cursor-pointer"
          title="Fechar"
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        {/* TOPO: Textos legais */}
        <div className="text-[#666] text-[13px] font-medium leading-relaxed tracking-wide pr-12">
          <p>© 2026 Sunset Field Solutions.</p>
          <p>Todos os direitos reservados.</p>
          <p className="mt-4">Perfil da Staff - Protótipo</p>
        </div>

        {/* CENTRO: Navegação, centralizada verticalmente */}
        <div className="flex-1 flex flex-col justify-center gap-3 py-8">

          <button className="flex items-center w-full p-4 border border-[#3a3a3a] rounded-none bg-[#2a2a2a] hover:bg-[#333] transition-colors cursor-pointer">
            <Home className="text-[#999] w-6 h-6 mr-4" strokeWidth={1.5} />
            <span className="text-[#ddd] text-[17px] font-normal tracking-wide">Página inicial</span>
          </button>

          <button
            onClick={() => router.push("/eventos")}
            className="flex items-center w-full p-4 border border-[#3a3a3a] rounded-none bg-[#2a2a2a] hover:bg-[#333] transition-colors cursor-pointer"
          >
            <Calendar className="text-[#999] w-6 h-6 mr-4" strokeWidth={1.5} />
            <span className="text-[#ddd] text-[17px] font-normal tracking-wide">Eventos</span>
          </button>

          {/* Divisória */}
          <div className="w-full h-px bg-[#3a3a3a] my-2"></div>

          {/* Caixa de Perfil */}
          <button className="flex items-center w-full p-4 border border-[#3a3a3a] rounded-none bg-[#2a2a2a] hover:bg-[#333] transition-colors text-left cursor-pointer">
            <div className="w-16 h-16 bg-white shrink-0 mr-4 flex items-center justify-center overflow-hidden">
              {perfil?.foto_url ? (
                <img src={perfil.foto_url} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : null}
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[#eee] text-lg font-bold leading-tight">{primeiroNome}</span>
              <span className="text-[#777] text-[13px] mt-0.5 tracking-wide">Toque para saber mais</span>
            </div>
          </button>

        </div>

        {/* Divisória acima do rodapé */}
        <div className="w-full h-px bg-[#3a3a3a]"></div>

        {/* RODAPÉ: Logo e botão Sair */}
        <div className="flex justify-between items-end pt-4">

          <div className="w-10 h-10 flex items-center justify-start opacity-30 hover:opacity-50 transition-opacity">
            <img
              src="/icon.png"
              alt="Logo Wadjet"
              className="max-w-full max-h-full object-contain grayscale"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          </div>

          <button
            onClick={handleSair}
            className="w-10 h-10 flex items-center justify-center border border-[#4a4a4a] bg-[#2a2a2a] text-[#999] hover:text-[#ccc] hover:bg-[#333] transition-colors cursor-pointer"
            title="Sair da conta"
          >
            <ChevronDownSquare size={24} strokeWidth={1.3} />
          </button>

        </div>

      </div>
    </div>
  );
}