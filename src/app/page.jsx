"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Mail, LockKeyhole } from "lucide-react";

// Componentes reutilizáveis
import AuthLayout from "./components/AuthLayout";
import Alert from "./components/Alert";
import AuthCard from "./components/AuthCard";
import Divider from "./components/Divider";
import FormInput from "./components/FormInput";
import SolidButton from "./components/SolidButton";
import LinkButton from "./components/LinkButton";

// Configuração do Supabase usando as variáveis de ambiente
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro("");

    // Autenticação com o Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setErro("Cadastro não encontrado.");
      setLoading(false);
      return;
    }

    // Busca o cargo (role) do usuário na tabela 'perfis'
    const userId = data.user.id;
    const { data: perfil } = await supabase
      .from("perfis")
      .select("role")
      .eq("id", userId)
      .single();

    // Corta espaços em branco e joga tudo para minúsculo
    const userRole = perfil?.role?.toLowerCase().trim() || "";

    // Redirecionamento baseado no cargo do usuário
    if (userRole === "admin" || userRole === "owner") {
      router.push("/admin");
    } else if (userRole === "coordenador") {
      router.push("/coordenador");
    } else {
      router.push("/freelancers");
    }
  };

  return (
    <AuthLayout>
      <Alert variant="error">{erro}</Alert>

      <AuthCard>
        <Image
          src="/logo_full_gray.svg"
          alt="Wadjet Segurança"
          width={0}
          height={0}
          sizes="100vw"
          priority
          className="mb-4 h-auto w-64 object-contain pointer-events-none"
        />

        <Divider />

        <form onSubmit={handleLogin} className="flex w-full flex-col gap-4">
          <FormInput
            icon={Mail}
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <FormInput
            icon={LockKeyhole}
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />

          <SolidButton type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </SolidButton>

          <LinkButton onClick={() => router.push("/esqueci-senha")}>
            Esqueci a senha
          </LinkButton>

          <Divider />

          <SolidButton
            type="button"
            onClick={() => router.push("/cadastro")}
            variant="secondary"
          >
            Cadastre-se
          </SolidButton>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
