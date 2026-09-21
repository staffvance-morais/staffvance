// NOVA SENHA - PÁGINA FINALIZADA

"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LockKeyhole } from "lucide-react";

import Alert from "@/components/Alert";
import AuthLayout from "@/components/AuthLayout";
import AuthCard from "@/components/AuthCard";
import Divider from "@/components/Divider";
import AuthHeader from "@/components/AuthHeader";
import AuthTitle from "@/components/AuthTitle";
import AuthSubtitle from "@/components/AuthSubtitle";
import FormInput from "@/components/FormInput";
import SolidButton from "@/components/SolidButton";

export default function NovaSenha() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [sessaoPronta, setSessaoPronta] = useState(false);

  useEffect(() => {
    // 1. Verifica se a URL retornou erro de link expirado ou inválido (via hash ou query)
    if (typeof window !== "undefined") {
      const hash = window.location.hash || "";
      const search = window.location.search || "";
      const params = new URLSearchParams(search || hash.replace("#", "?"));

      const errorDescription = params.get("error_description") || params.get("error");
      const errorCode = params.get("error_code");

      if (errorDescription || errorCode) {
        console.warn("Erro recebido no link de recuperação:", errorDescription, errorCode);
        if (errorCode === "otp_expired" || (errorDescription && errorDescription.toLowerCase().includes("expired"))) {
          setErro("O link de recuperação de senha expirou. Por favor, solicite um novo link.");
        } else {
          setErro(decodeURIComponent((errorDescription || "Link de recuperação inválido.").replace(/\+/g, " ")));
        }
        return;
      }

      // 2. Suporte ao fluxo PKCE (quando a URL vem com ?code=...)
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        supabase.auth.exchangeCodeForSession(code).then(({ data, error: exchangeError }) => {
          if (exchangeError) {
            console.error("Erro ao validar código da URL:", exchangeError);
            setErro("Link de recuperação inválido ou já utilizado. Solicite um novo link.");
          } else if (data?.session) {
            setSessaoPronta(true);
          }
        });
      }
    }

    // 3. Ouvir evento de PASSWORD_RECOVERY ou sessão ativa
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setSessaoPronta(true);
        setErro("");
      }
    });

    // 4. Checagem direta de sessão
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessaoPronta(true);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleAtualizarSenha = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem("");
    setErro("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: senha,
      });

      if (error) {
        console.error("Erro Supabase updateUser:", error);
        if (error.message?.toLowerCase().includes("session") || error.name === "AuthSessionMissingError") {
          setErro("Sessão expirada ou não identificada. Por favor, solicite um novo link de recuperação.");
        } else if (error.message?.toLowerCase().includes("same_password") || error.message?.toLowerCase().includes("different")) {
          setErro("A nova senha deve ser diferente da anterior.");
        } else if (error.message?.toLowerCase().includes("at least")) {
          setErro("A senha deve conter no mínimo 6 caracteres.");
        } else {
          setErro(error.message || "Houve um erro ao atualizar a senha. Tente solicitar o link novamente.");
        }
        setLoading(false);
        return;
      }

      setMensagem("Senha atualizada com sucesso! Redirecionando para o login...");

      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      console.error("Erro inesperado ao atualizar senha:", error);
      setErro(
        error.message || "Houve um erro ao atualizar a senha. Tente solicitar o link novamente."
      );
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Alert variant="error" className="mb-6">{erro}</Alert>
      {erro && (
        <div className="mb-6 -mt-3 text-center">
          <Link href="/esqueci-senha" className="text-sm text-blue-400 hover:text-blue-300 underline font-semibold">
            Solicitar novo link de recuperação de senha &rarr;
          </Link>
        </div>
      )}
      <Alert variant="success" className="mb-6">{mensagem}</Alert>

      <AuthCard>
        <Image
          src="/logo_full_gray.svg"
          alt="Wadjet Segurança"
          width={0}
          height={0}
          sizes="100vw"
          priority
          className="pointer-events-none mb-4 h-auto w-64 object-contain"
        />

        <Divider />

        <AuthHeader>
          <AuthTitle>Criar Nova Senha</AuthTitle>
          <AuthSubtitle>
            Digite sua nova senha abaixo para acessar sua conta.
          </AuthSubtitle>
        </AuthHeader>

        <form
          onSubmit={handleAtualizarSenha}
          className="flex w-full flex-col gap-4"
        >
          <FormInput
            icon={LockKeyhole}
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Nova senha"
            required
            minLength={6}
            autoComplete="new-password"
          />

          <SolidButton
            type="submit"
            disabled={loading || mensagem !== ""}
            variant="primary"
          >
            {loading ? "Salvando..." : "Atualizar Senha"}
          </SolidButton>

          <Divider />

          <SolidButton
            type="button"
            onClick={() => router.push("/")}
            variant="tertiary"
          >
            Voltar
          </SolidButton>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
