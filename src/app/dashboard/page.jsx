"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Importação dinâmica do mapa (Obrigatório ficar aqui no topo)
const MapComponent = dynamic(() => import("@/app/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center bg-gray-100 rounded text-gray-500">
      Carregando mapa interativo...
    </div>
  ),
});

// Inicializa o Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function DashboardFuncionario() {
  const router = useRouter();
  const [perfil, setPerfil] = useState(null);
  const [minhasEscalas, setMinhasEscalas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Controle de qual mapa está aberto nas escalas
  const [eventoNoMapa, setEventoNoMapa] = useState(null);

  useEffect(() => {
    carregarDadosDoPainel();
  }, []);

  const carregarDadosDoPainel = async () => {
    try {
      // 1. Pega o ID do usuário logado no cofre
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) throw new Error("Usuário não autenticado");
      const userId = authData.user.id;

      // 2. Busca os dados do Perfil dele
      const { data: perfilData, error: perfilError } = await supabase
        .from("perfis")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (perfilError) throw perfilError;
      setPerfil(perfilData);

      // 3. Busca as Escalas desse funcionário
      const { data: escalasData, error: escalasError } = await supabase
        .from("escalas")
        .select("*")
        .eq("staff_id", userId);

      if (escalasError) throw escalasError;

      // 4. Se ele tiver escalas, busca os detalhes dos Eventos correspondentes
      if (escalasData && escalasData.length > 0) {
        // Pega só os IDs dos eventos para pesquisar
        const eventosIds = escalasData.map(e => e.evento_id);
        
        const { data: eventosData, error: eventosError } = await supabase
          .from("eventos")
          .select("*")
          .in("id", eventosIds);

        if (eventosError) throw eventosError;

        // 5. Junta a escala com os dados do evento para ficar fácil de mostrar na tela
        const escalasComEventos = escalasData.map(escala => {
          const eventoDetalhe = eventosData.find(ev => ev.id === escala.evento_id);
          return { ...escala, evento: eventoDetalhe };
        });

        // Ordena para as escalas mais recentes/próximas aparecerem primeiro
        escalasComEventos.sort((a, b) => new Date(a.turno_inicio) - new Date(b.turno_inicio));
        setMinhasEscalas(escalasComEventos);
      }
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error.message);
      // Se der erro de autenticação, manda pro login
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleSair = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 font-bold text-gray-600">Carregando seu painel...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      
      {/* CABEÇALHO */}
      <div className="bg-blue-800 text-white p-6 shadow-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Painel do Funcionário</h1>
            <p className="text-blue-200 text-sm mt-1">StaffVance</p>
          </div>
          <button onClick={handleSair} className="bg-blue-900 hover:bg-blue-950 px-4 py-2 rounded text-sm font-bold transition-colors">
            Sair
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-8 px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* COLUNA ESQUERDA: PERFIL E PAGAMENTO */}
        <div className="md:col-span-1 flex flex-col gap-6">
          
          {/* Card de Perfil */}
          <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 overflow-hidden border-2 border-gray-300">
                {perfil?.foto_url ? (
                  <img src={perfil.foto_url} alt="Foto de Perfil" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl mt-6 block">👤</span>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-800">{perfil?.nome_completo || "Nome não cadastrado"}</h2>
              <p className="text-gray-500 uppercase text-sm font-bold mt-1">{perfil?.cargo || "Staff"}</p>
            </div>
          </div>

          {/* Card de Dados de Pagamento */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-bold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
              <span>💰</span> Meus Dados
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Chave PIX:</p>
                <p className="font-bold text-gray-800 bg-gray-50 p-2 rounded border">{perfil?.chave_pix || "Não informada"}</p>
              </div>
              <div>
                <p className="text-gray-500">WhatsApp:</p>
                <p className="font-bold text-gray-800 bg-gray-50 p-2 rounded border">{perfil?.whatsapp || "Não informado"}</p>
              </div>
              <div>
                <p className="text-gray-500">CPF:</p>
                <p className="font-bold text-gray-800 bg-gray-50 p-2 rounded border">{perfil?.cpf || "Não informado"}</p>
              </div>
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA: ESCALAS E MAPA */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          {/* Card de Escalas */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span>📋</span> Minhas Próximas Escalas
            </h3>

            {minhasEscalas.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded border border-dashed border-gray-300">
                <p className="text-gray-500 italic">Você não possui escalas ativas no momento.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {minhasEscalas.map((escala) => {
                  const evento = escala.evento;
                  const temMapa = evento?.latitude && evento?.longitude;
                  
                  return (
                    <div key={escala.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Cabeçalho do Card da Escala */}
                      <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-lg text-blue-800">{evento?.titulo || "Evento sem título"}</h4>
                          <p className="text-sm text-gray-600 mt-1"><strong>Posto:</strong> {escala.posto_trabalho}</p>
                          <p className="text-sm text-gray-600"><strong>Status:</strong> <span className="text-orange-600 font-bold">{escala.status}</span></p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-bold text-gray-700">Início: {new Date(escala.turno_inicio).toLocaleString('pt-BR')}</p>
                          <p className="text-gray-500">Fim: {new Date(escala.turno_fim).toLocaleString('pt-BR')}</p>
                        </div>
                      </div>

                      {/* Endereço e Botão do Mapa */}
                      <div className="p-4 bg-white flex justify-between items-center">
                        <p className="text-sm text-gray-600 flex-1">
                          📍 {evento?.endereco_texto || "Endereço não informado"}
                        </p>
                        
                        {temMapa && (
                          <button 
                            onClick={() => setEventoNoMapa(eventoNoMapa?.id === evento.id ? null : evento)}
                            className="ml-4 bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded text-sm font-bold transition-colors"
                          >
                            {eventoNoMapa?.id === evento.id ? "Esconder Mapa" : "Ver no Mapa"}
                          </button>
                        )}
                      </div>

                      {/* Mapa Estático Antigo do Evento */}
                      {eventoNoMapa?.id === evento?.id && temMapa && (
                        <div className="h-64 w-full bg-gray-200 border-t border-gray-200">
                          <iframe 
                            width="100%" 
                            height="100%" 
                            frameBorder="0" 
                            scrolling="no" 
                            marginHeight="0" 
                            marginWidth="0" 
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${evento.longitude - 0.005},${evento.latitude - 0.005},${evento.longitude + 0.005},${evento.latitude + 0.005}&layer=mapnik&marker=${evento.latitude},${evento.longitude}`}
                            className="w-full h-full"
                          ></iframe>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* NOVO CARD COM O MAPA INTERATIVO GERAL */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🗺️</span> Mapa de Localizações
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Visão geral de registros e pontos de interesse.
            </p>
            
            {/* O Mapa que você criou usando Leaflet é chamado aqui! */}
            <div className="w-full overflow-hidden rounded-lg border border-gray-200">
              <MapComponent />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}