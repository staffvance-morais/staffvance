"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ClientesPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nome_empresa: "", nome_contato: "", telefone: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSalvar = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("clientes").insert([form]);
      if (error) throw error;
      alert("Cliente cadastrado com sucesso!");
      setForm({ nome_empresa: "", nome_contato: "", telefone: "" });
    } catch (error) {
      alert("Erro ao cadastrar cliente: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <button onClick={() => router.push("/admin")} className="text-blue-600 font-bold mb-6 hover:underline">
          &larr; Voltar para o Menu
        </button>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Cadastrar Novo Cliente</h2>
        
        <form onSubmit={handleSalvar} className="flex flex-col gap-4">
          <input type="text" name="nome_empresa" value={form.nome_empresa} onChange={handleChange} placeholder="Nome da Empresa (Ex: Coca-Cola)" required className="border p-3 rounded" />
          <input type="text" name="nome_contato" value={form.nome_contato} onChange={handleChange} placeholder="Nome do Contato (Ex: João Silva)" required className="border p-3 rounded" />
          <input type="text" name="telefone" value={form.telefone} onChange={handleChange} placeholder="Telefone do Contato" required className="border p-3 rounded" />
          
          <button type="submit" disabled={loading} className="mt-4 bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700">
            {loading ? "Salvando..." : "Salvar Cliente"}
          </button>
        </form>
      </div>
    </div>
  );
}