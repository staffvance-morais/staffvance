"use client";

import { useState } from "react";
import Link from "next/link";

export default function CadastrarFuncionario() {
  // Estados para o Acesso ao App
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  // Estados para Dados Pessoais
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");

  // Estados para Dados Profissionais
  const [fotoUrl, setFotoUrl] = useState("");
  const [cargo, setCargo] = useState("");
  const [nivel, setNivel] = useState("Bronze");
  const [observacao, setObservacao] = useState("");

  const [loading, setLoading] = useState(false);

  const handleCadastro = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Enviando todos os dados do formulário para a API no back-end
      const response = await fetch('/api/cadastrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: senha,
          nome_completo: nome,
          cpf: cpf,
          data_nascimento: dataNascimento || null,
          whatsapp: telefone || null,
          cargo: cargo || null,
          emblema: nivel,
          observacoes: observacao || null,
          foto_url: fotoUrl || null
        }),
      });

      const data = await response.json();

      // Se a API avisar que deu algum erro, extraímos a mensagem real para mostrar na tela
      if (!response.ok) {
        let mensagemErro = "Erro desconhecido ao cadastrar.";
        if (data.error && data.error.message) {
          mensagemErro = data.error.message;
        } else if (typeof data.error === 'string') {
          mensagemErro = data.error;
        } else {
          // Converte o objeto de erro para texto, evitando o erro visual "{}"
          mensagemErro = JSON.stringify(data.error);
        }
        throw new Error(mensagemErro);
      }

      alert("Funcionário cadastrado com sucesso!");

      // Limpar formulário após o sucesso
      setEmail("");
      setSenha("");
      setNome("");
      setCpf("");
      setDataNascimento("");
      setTelefone("");
      setFotoUrl("");
      setCargo("");
      setNivel("Bronze");
      setObservacao("");

    } catch (error) {
      alert("Falha no cadastro: " + error.message);
      console.error("Erro completo:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link 
          href="/admin" 
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm font-medium"
        >
          ← Voltar para o Menu
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8 text-gray-800">Cadastrar Novo Funcionário</h1>

      <form onSubmit={handleCadastro} className="space-y-8 bg-white p-6 rounded-lg shadow">
        
        {/* Seção 1: Acesso ao App */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-blue-600 border-b pb-2">Acesso ao App</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="email"
              placeholder="Email do funcionário"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border border-gray-300 p-2 w-full rounded focus:outline-blue-500"
            />
            <input
              type="password"
              placeholder="Senha (mínimo 6 caracteres)"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength="6"
              className="border border-gray-300 p-2 w-full rounded focus:outline-blue-500"
            />
          </div>
        </div>

        {/* Seção 2: Dados Pessoais */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-blue-600 border-b pb-2">Dados Pessoais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nome Completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="border border-gray-300 p-2 w-full rounded focus:outline-blue-500"
            />
            <input
              type="text"
              placeholder="CPF (Apenas números)"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              required
              className="border border-gray-300 p-2 w-full rounded focus:outline-blue-500"
            />
            <input
              type="date"
              placeholder="Data de Nascimento"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              className="border border-gray-300 p-2 w-full rounded focus:outline-blue-500 text-gray-600"
            />
            <input
              type="text"
              placeholder="WhatsApp / Telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="border border-gray-300 p-2 w-full rounded focus:outline-blue-500"
            />
          </div>
        </div>

        {/* Seção 3: Dados Profissionais */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-blue-600 border-b pb-2">Dados Profissionais (WADjet)</h2>
          <div className="grid grid-cols-1 gap-4">
            <input
              type="text"
              placeholder="URL da Foto (Opcional)"
              value={fotoUrl}
              onChange={(e) => setFotoUrl(e.target.value)}
              className="border border-gray-300 p-2 w-full rounded focus:outline-blue-500"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Cargo (Ex: Garçom, Segurança)"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="border border-gray-300 p-2 w-full rounded focus:outline-blue-500"
              />
              
              <select
                value={nivel}
                onChange={(e) => setNivel(e.target.value)}
                className="border border-gray-300 p-2 w-full rounded focus:outline-blue-500 bg-white"
              >
                <option value="Bronze">Bronze (Novato)</option>
                <option value="Prata">Prata (Intermediário)</option>
                <option value="Ouro">Ouro (Experiente)</option>
                <option value="Diamante">Diamante (Elite)</option>
              </select>
            </div>

            <textarea
              placeholder="Observações sobre o funcionário..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows="3"
              className="border border-gray-300 p-2 w-full rounded focus:outline-blue-500 resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
        >
          {loading ? "Cadastrando..." : "Cadastrar Funcionário"}
        </button>
      </form>
    </div>
  );
}