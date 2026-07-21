'use client';
import { useState } from 'react';
import { signUpStaff } from '@/lib/auth';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cpf, setCpf] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    const userData = {
      nome_completo: nomeCompleto,
      cpf: cpf,
      whatsapp: whatsapp,
      data_nascimento: dataNascimento,
      chave_pix: chavePix,
      foto_url: fotoUrl,
    };

    const result = await signUpStaff(email, password, userData);

    if (result.success) {
      alert('Cadastro realizado com sucesso! Aguarde a liberação da administração.');
      setNomeCompleto('');
      setCpf('');
      setWhatsapp('');
      setDataNascimento('');
      setChavePix('');
      setFotoUrl('');
      setEmail('');
      setPassword('');
    } else {
      alert('Erro: ' + result.error);
    }
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-900 px-4 py-8">
      <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold mb-6 text-zinc-800 border-b pb-2">Cadastro de Funcionário</h1>
        
        <form onSubmit={handleSignup} className="space-y-6">
          
          {/* Dados de Login */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input
              type="email"
              placeholder="E-mail de acesso"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Senha de acesso"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Dados Pessoais */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Nome Completo"
              className="w-full sm:col-span-2 rounded-md border border-zinc-300 px-3 py-2 text-black"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="CPF"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              required
            />
            <input
              type="date"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              required
            />
            <input
              type="tel"
              placeholder="WhatsApp (com DDD)"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Chave PIX"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black"
              value={chavePix}
              onChange={(e) => setChavePix(e.target.value)}
              required
            />
            <input
              type="url"
              placeholder="Link da Foto (Opcional)"
              className="w-full sm:col-span-2 rounded-md border border-zinc-300 px-3 py-2 text-black"
              value={fotoUrl}
              onChange={(e) => setFotoUrl(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 rounded-md bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-500 disabled:bg-blue-400 transition-colors"
          >
            {loading ? 'Processando Cadastro...' : 'Enviar Cadastro'}
          </button>
        </form>

        {/* O BOTÃO DE VOLTAR PARA O LOGIN */}
        <div className="mt-6 text-center border-t pt-4">
          <p className="text-zinc-600">
            Já tem uma conta?{' '}
            <Link href="/" className="text-blue-600 font-bold hover:underline">
              Voltar para o Login
            </Link>
          </p>
        </div>

      </div>
    </main>
  );
}