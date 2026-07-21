"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function EventosPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    titulo: "", cliente_id: "", data_inicio: "", data_fim: "", endereco_texto: "", latitude: "", longitude: "", escopo: ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSalvar = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("eventos").insert([{
        titulo: form.titulo,
        cliente_id: form.cliente_id || null,
        data_inicio: form.data_inicio,
        data_fim: form.data_fim,
        endereco_texto: form.endereco_texto,
        latitude: parseFloat(form.latitude) || null,
        longitude: parseFloat(form.longitude) || null,
        escopo: form.escopo
      }]);
      if (error) throw error;
      alert("Evento cadastrado com sucesso!");
      setForm({ titulo: "", cliente_id: "", data_inicio: "", data_fim: "", endereco_texto: "", latitude: "", longitude: "", escopo: "" });
    } catch (error) {
      alert("Erro ao criar evento: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <button onClick={() => router.push("/admin")} className="text-blue-600 font-bold mb-6 hover:underline">
          &larr; Voltar para o Menu
        </button>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Criar Novo Evento</h2>
        
        <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" name="titulo" value={form.titulo} onChange={handleChange} placeholder="Título do Evento" required className="border p-2 rounded col-span-full" />
          <input type="text" name="cliente_id" value={form.cliente_id} onChange={handleChange} placeholder="ID do Cliente (Cole o ID aqui por enquanto)" className="border p-2 rounded col-span-full" />
          
          <div className="flex flex-col">
            <label className="text-sm font-bold text-gray-600 mb-1">Data/Hora Início</label>
            <input type="datetime-local" name="data_inicio" value={form.data_inicio} onChange={handleChange} required className="border p-2 rounded" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-bold text-gray-600 mb-1">Data/Hora Fim</label>
            <input type="datetime-local" name="data_fim" value={form.data_fim} onChange={handleChange} required className="border p-2 rounded" />
          </div>

          <input type="text" name="endereco_texto" value={form.endereco_texto} onChange={handleChange} placeholder="Endereço Completo" className="border p-2 rounded col-span-full mt-4" />
          <input type="number" step="any" name="latitude" value={form.latitude} onChange={handleChange} placeholder="Latitude (Ex: -3.7327)" className="border p-2 rounded" />
          <input type="number" step="any" name="longitude" value={form.longitude} onChange={handleChange} placeholder="Longitude (Ex: -38.5270)" className="border p-2 rounded" />
          
          <textarea name="escopo" value={form.escopo} onChange={handleChange} placeholder="Escopo / Descrição do serviço..." className="border p-2 rounded col-span-full h-24 mt-4"></textarea>

          <button type="submit" disabled={loading} className="col-span-full mt-4 bg-purple-600 text-white font-bold py-3 rounded hover:bg-purple-700">
            {loading ? "Criando..." : "Salvar Evento"}
          </button>
        </form>
      </div>
    </div>
  );
}