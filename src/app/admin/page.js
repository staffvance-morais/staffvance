"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

// Inicializa a conexão com o Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminDashboard() {
  const router = useRouter();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Busca os eventos assim que a página carrega
  useEffect(() => {
    async function carregarEventos() {
      try {
        const { data, error } = await supabase
          .from("eventos")
          .select("*")
          .order("created_at", { ascending: false }) // Traz os mais novos primeiro
          .limit(5);

        if (error) throw error;
        
        // Essa linha vai mostrar os dados no Console (F12) para você ver os nomes das colunas
        console.log("MEUS EVENTOS DO BANCO:", data); 
        
        setEventos(data || []);
      } catch (error) {
        console.error("Erro ao buscar eventos:", error.message);
      } finally {
        setLoading(false);
      }
    }

    carregarEventos();
  }, []);

  // Função para sair da conta
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/"); // Volta para a tela de login
  };

  return (
    <main className="min-h-screen flex flex-col items-center p-4 bg-gray-100">
      <div className="w-full max-w-md bg-white p-6 border border-gray-300 shadow-md">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Painel da<br/>Administração</h1>
            <p className="text-sm text-gray-600 mt-1">Gestão centralizada do StaffVance</p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-sm border border-gray-400 p-1 hover:bg-gray-100"
          >
            Sair do<br/>Sistema
          </button>
        </div>

        {/* Botões de Ação com as rotas corrigidas */}
        <div className="flex flex-col gap-2 mb-8">
          <button 
            onClick={() => router.push('/admin/funcionarios')} 
            className="w-full border-2 border-black p-2 font-medium hover:bg-gray-50 flex justify-center gap-2"
          >
            👥 Cadastrar Equipe
          </button>
          
          <button 
            onClick={() => router.push('/admin/clientes')} 
            className="w-full border-2 border-black p-2 font-medium hover:bg-gray-50 flex justify-center gap-2"
          >
            🏢 Cadastrar Clientes
          </button>
          
          <button 
            onClick={() => router.push('/admin/eventos')} 
            className="w-full border-2 border-black p-2 font-medium hover:bg-gray-50 flex justify-center gap-2"
          >
            📅 Criar Eventos
          </button>
          
          <button 
            onClick={() => router.push('/admin/escalas')} 
            className="w-full border-2 border-black p-2 font-medium hover:bg-gray-50 flex justify-center gap-2"
          >
            📋 Montar Escalas
          </button>
        </div>

        {/* Seção de Eventos com Mapa */}
        <div className="border-t-2 border-gray-300 pt-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            📍 Próximos Eventos
          </h2>

          {loading ? (
            <p className="text-center text-gray-500">Carregando eventos...</p>
          ) : eventos.length === 0 ? (
            <p className="text-center text-gray-500">Nenhum evento programado.</p>
          ) : (
            <div className="flex flex-col gap-6">
              {eventos.map((evento, index) => {
                
                // NOME DO EVENTO
                const nomeDoEvento = evento.titulo || "Evento sem nome";
                
                // DATA DO EVENTO FORMATADA PARA O BRASIL
                const dataDoEvento = evento.data_inicio 
                  ? new Date(evento.data_inicio).toLocaleString('pt-BR') 
                  : "Não informada";
                  
                // LOCAL DO EVENTO
                // Se o seu mapa ainda não aparecer, veja no Console qual é o nome exato 
                // da coluna de endereço e troque 'endereco' aqui embaixo:
                const localDoEvento = evento.endereco || evento.local || evento.endereco_completo || "";

                return (
                  <div key={index} className="border border-gray-300 rounded-md overflow-hidden bg-gray-50">
                    <div className="p-3 border-b border-gray-300">
                      <h3 className="font-bold text-lg text-gray-800">{nomeDoEvento}</h3>
                      <p className="text-sm text-gray-600">
                        <strong>Início:</strong> {dataDoEvento}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Local:</strong> {localDoEvento || "Não informado"}
                      </p>
                    </div>
                    
                    {/* Mapa do Google embutido dinamicamente */}
                    {localDoEvento ? (
                      <iframe
                        width="100%"
                        height="150"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps?q=${encodeURIComponent(localDoEvento)}&output=embed`}
                      ></iframe>
                    ) : (
                      <div className="h-[150px] flex items-center justify-center bg-gray-200 text-gray-500 text-sm">
                        Mapa indisponível (Local não preenchido)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}