"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Mail } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha"; // <-- Importação do reCAPTCHA

// Componentes reutilizáveis
import Alert from "../components/Alert";
import AuthLayout from "../components/AuthLayout";
import AuthCard from "../components/AuthCard";
import Divider from "../components/Divider";
import AuthHeader from "../components/AuthHeader";
import AuthTitle from "../components/AuthTitle";
import AuthSubtitle from "../components/AuthSubtitle";
import FormInput from "../components/FormInput";
import SolidButton from "../components/SolidButton";

export default function EsqueciSenha() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  
  // Estado para controlar se o usuário marcou a caixinha do Google
  const [captchaValido, setCaptchaValido] = useState(false);

  const handleRecuperarSenha = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem("");
    setErro("");

    // 1. TRAVA DE SEGURANÇA DO ROBÔ
    if (!captchaValido) {
      setErro("Por favor, confirme que você não é um robô marcando a caixa abaixo.");
      setLoading(false);
      return;
    }

    try {
      // O Supabase envia um e-mail com um link seguro.
      // O redirectTo é para onde o usuário volta após clicar no link do e-mail.
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/nova-senha`,
      });

      if (error) throw error;

      setMensagem(
        "Link de recuperação enviado! Verifique sua caixa de entrada ou spam.",
      );
    } catch (error) {
      console.error("Erro ao recuperar senha:", error);
      setErro("Não foi possível enviar o e-mail. Verifique se o endereço está correto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Alert variant="error">{erro}</Alert>
      <Alert variant="success">{mensagem}</Alert>

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
          <AuthTitle>Recuperar Senha</AuthTitle>
          <AuthSubtitle>
            Digite seu e-mail para receber o link de recuperação.
          </AuthSubtitle>
        </AuthHeader>

        <form onSubmit={handleRecuperarSenha} className="flex w-full flex-col gap-4">
          <FormInput
            icon={Mail}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            required
          />

          {/* COMPONENTE DO GOOGLE RECAPTCHA (TEMA ESCURO) */}
          <div className="flex justify-center w-full my-2 overflow-hidden rounded-md">
            <ReCAPTCHA
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
              onChange={(valor) => setCaptchaValido(!!valor)}
              theme="dark"
            />
          </div>

          <SolidButton
            type="submit"
            disabled={loading || mensagem !== ""}
            variant="primary"
          >
            {loading ? "Enviando..." : "Enviar link"}
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