"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LockKeyhole } from "lucide-react";

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

export default function NovaSenha() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const handleAtualizarSenha = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem("");
    setErro("");

    try {
      // O Supabase já sabe quem é o usuário por causa do link seguro que ele clicou no e-mail
      const { error } = await supabase.auth.updateUser({
        password: senha,
      });

      if (error) throw error;

      setMensagem("Senha atualizada com sucesso!");

      // Espera 2 segundinhos para a pessoa ler a mensagem de sucesso e manda pro Login
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      console.error("Erro ao atualizar senha:", error);
      setErro(
        "Houve um erro ao atualizar a senha. Tente solicitar o link novamente.",
      );
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
