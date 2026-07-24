"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// Inicializa o Supabase para o botão de sair funcionar
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminDashboard() {
  const router = useRouter();

  const handleSair = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center pt-10">
      <div className="w-full max-w-md bg-white p-8 rounded shadow-sm">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">Painel da<br/>Administração</h1>
            <p className="text-gray-700 mt-4 text-sm">Gestão centralizada do Staffvance</p>
          </div>
          <button 
            onClick={handleSair}
            className="border border-gray-400 text-gray-800 px-3 py-1 text-xs hover:bg-gray-100 transition text-center"
          >
            Sair do<br/>Sistema
          </button>
        </div>

        {/* Menu de Botões */}
        <div className="flex flex-col border border-gray-400 mt-2">
          
          <Link href="/admin/funcionarios" className="border-b border-gray-400 py-3 text-center hover:bg-gray-50 transition">
            <span className="block text-purple-900 text-lg mb-1">👥</span>
            <span className="text-purple-900 underline text-[15px]">Cadastrar Equipe</span>
          </Link>

          <Link href="/admin/clientes" className="border-b border-gray-400 py-3 text-center hover:bg-gray-50 transition">
            <span className="block text-purple-900 text-lg mb-1">🏢</span>
            <span className="text-purple-900 underline text-[15px]">Cadastrar Clientes</span>
          </Link>

          <Link href="/admin/eventos" className="border-b border-gray-400 py-3 text-center hover:bg-gray-50 transition">
            <span className="block text-purple-900 text-lg mb-1">📅</span>
            <span className="text-purple-900 underline text-[15px]">Criar Eventos</span>
          </Link>

          <Link href="/admin/escalas" className="border-b border-gray-400 py-3 text-center hover:bg-gray-50 transition">
            <span className="block text-purple-900 text-lg mb-1">📋</span>
            <span className="text-purple-900 underline text-[15px]">Montar Escalas</span>
          </Link>

          {/* NOVO BOTÃO: Gestão Financeira */}
          <Link href="/admin/financeiro" className="py-3 text-center hover:bg-gray-50 transition bg-purple-50">
            <span className="block text-purple-900 text-lg mb-1">💰</span>
            <span className="text-purple-900 underline text-[15px] font-bold">Gestão Financeira</span>
          </Link>

        </div>

      </div>
    </div>
  );
}