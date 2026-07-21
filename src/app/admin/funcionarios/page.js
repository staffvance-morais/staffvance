"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function FuncionariosPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "", senha: "", nome_completo: "", cpf: "", whatsapp: "", data_nascimento: "", chave_pix: "", cargo: "funcionario", emblema: "Bronze", observacoes: "", foto_url: ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSalvar = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.senha,
      });
      if (authError) throw authError;

      const { error: dbError } = await supabase.from("perfis").insert([{
        id: authData.user.id,
        nome_completo: form.nome_completo,
        cpf: form.cpf,
        whatsapp: form.whatsapp,
        data_nascimento: form.data_nascimento,
        chave_pix: form.chave_pix,
        cargo: form.cargo,
        emblema: form.emblema,
        observacoes: form.observacoes,
        foto_url: form.foto_url
      }]);
      if (dbError) throw dbError;

      alert("Funcionário cadastrado com sucesso!");
      setForm({ email: "", senha: "", nome_completo: "", cpf: "", whatsapp: "", data_nascimento: "", chave_pix: "", cargo: "funcionario", emblema: "Bronze", observacoes: "", foto_url: "" });
    } catch (error) {
      alert("Erro ao cadastrar: " + error.message);
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
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Cadastrar Novo Funcionário</h2>
        
        <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-full border-b pb-2"><h3 className="font-bold text-gray-600">Acesso ao App</h3></div>
          <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="E-mail de Login" required className="border p-2 rounded" />
          <input type="password" name="senha" value={form.senha} onChange={handleChange} placeholder="Senha Inicial" required className="border p-2 rounded" />

          <div className="col-span-full mt-4 border-b pb-2"><h3 className="font-bold text-gray-600">Dados Pessoais</h3></div>
          <input type="text" name="nome_completo" value={form.nome_completo} onChange={handleChange} placeholder="Nome Completo" required className="border p-2 rounded" />
          <input type="text" name="cpf" value={form.cpf} onChange={handleChange} placeholder="CPF" required className="border p-2 rounded" />
          <input type="date" name="data_nascimento" value={form.data_nascimento} onChange={handleChange} required className="border p-2 rounded text-gray-600" />
          <input type="text" name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder="WhatsApp" required className="border p-2 rounded" />

          <div className="col-span-full mt-4 border-b pb-2"><h3 className="font-bold text-gray-600">Empresa</h3></div>
          <input type="text" name="chave_pix" value={form.chave_pix} onChange={handleChange} placeholder="Chave PIX" className="border p-2 rounded" />
          <input type="text" name="foto_url" value={form.foto_url} onChange={handleChange} placeholder="URL da Foto (Opcional)" className="border p-2 rounded" />
          
          <select name="cargo" value={form.cargo} onChange={handleChange} className="border p-2 rounded bg-white">
            <option value="funcionario">Funcionário Comum</option>
            <option value="admin">Administrador</option>
          </select>
          <select name="emblema" value={form.emblema} onChange={handleChange} className="border p-2 rounded bg-white">
            <option value="Bronze">Nível: Bronze</option>
            <option value="Prata">Nível: Prata</option>
            <option value="Ouro">Nível: Ouro</option>
          </select>
          <textarea name="observacoes" value={form.observacoes} onChange={handleChange} placeholder="Observações..." className="border p-2 rounded col-span-full h-24"></textarea>

          <button type="submit" disabled={loading} className="col-span-full mt-4 bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700">
            {loading ? "Cadastrando..." : "Salvar Funcionário"}
          </button>
        </form>
      </div>
    </div>
  );
}