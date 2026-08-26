"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReCAPTCHA from "react-google-recaptcha";
import {
  Mail,
  LockKeyhole,
  Contact,
  Landmark,
  CalendarFold,
  Smartphone,
  Wallet,
  GraduationCap,
  Shirt,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { maskCPF, maskPhone } from "@/lib/masks";

import Alert from "@/components/Alert";
import AuthLayout from "@/components/AuthLayout";
import Divider from "@/components/Divider";
import FormInput from "@/components/FormInput";
import FormNotice from "@/components/FormNotice";
import FormSelect from "@/components/FormSelect";
import FormSectionHeader from "@/components/FormSectionHeader";
import HeaderSuperior from "@/components/HeaderSuperior";
import LegalModal from "@/components/LegalModal";
import PhotoUpload from "@/components/PhotoUpload";
import SolidButton from "@/components/SolidButton";

export default function Cadastro() {
  const router = useRouter();

  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoArquivo, setFotoArquivo] = useState(null);
  const [comprimindo, setComprimindo] = useState(false);

  const [form, setForm] = useState({
    email: "",
    senha: "",
    confirmarSenha: "",
    nome: "",
    cpf: "",
    dataNascimento: "",
    whatsapp: "",
    chavePix: "",
    curso: "",
    uniforme: "",
  });

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [captchaValido, setCaptchaValido] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("termos");

  const openLegalModal = (type) => {
    setModalType(type);
    setModalOpen(true);
  };

  const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "cpf") {
      formattedValue = maskCPF(value);
    } else if (name === "whatsapp") {
      formattedValue = maskPhone(value);
    }

    setForm((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    setErro("");
    setMensagem("");

    const {
      email,
      senha,
      confirmarSenha,
      nome,
      cpf,
      dataNascimento,
      whatsapp,
      chavePix,
      curso,
      uniforme,
    } = form;

    if (
      !fotoArquivo ||
      !email.trim() ||
      !senha ||
      !confirmarSenha ||
      !nome.trim() ||
      !cpf.trim() ||
      !dataNascimento ||
      !whatsapp.trim() ||
      !chavePix.trim() ||
      !curso ||
      !uniforme
    ) {
      setErro("Todas as informações são obrigatórias.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem!");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter no mínimo 6 caracteres.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (recaptchaKey && !captchaValido) {
      setErro("Por favor, confirme que você não é um robô.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
      });

      if (authError) throw authError;
      if (!authData?.user?.id) {
        throw new Error("Usuário não retornado após criação.");
      }

      const userId = authData.user.id;
      let fotoUrl = null;

      if (fotoArquivo) {
        const fileExt = fotoArquivo.name.split(".").pop() || "jpg";
        const fileName = `${userId}-perfil.${fileExt}`;
        const filePath = `fotos_perfil/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("perfis")
          .upload(filePath, fotoArquivo, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("perfis")
          .getPublicUrl(filePath);

        fotoUrl = publicUrlData.publicUrl;
      }

      const { error: dbError } = await supabase.from("perfis").upsert({
        id: userId,
        nome_completo: nome.trim(),
        role: "staff",
        cpf: cpf.trim(),
        whatsapp: whatsapp.trim(),
        chave_pix: chavePix.trim(),
        data_nascimento: dataNascimento || null,
        curso,
        uniforme,
        foto_url: fotoUrl,
        email: email.trim(),
      });

      if (dbError) throw dbError;

      try {
        await fetch("/api/notificar-cadastro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: nome.trim(),
            email: email.trim(),
            whatsapp: whatsapp.trim(),
            cpf: cpf.trim(),
            chavePix: chavePix.trim(),
            dataNascimento,
            curso,
            uniforme,
            fotoUrl,
          }),
        });
      } catch (emailError) {
        console.warn("Falha ao enviar notificação de cadastro:", emailError);
      }

      setMensagem("Cadastro realizado com sucesso!");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error) {
      let msg = error?.message || "Ocorreu um erro no cadastro.";
      if (
        msg.toLowerCase().includes("already registered") ||
        msg.toLowerCase().includes("already in use") ||
        msg.toLowerCase().includes("unique constraint")
      ) {
        msg = "Este e-mail já está cadastrado.";
      } else if (msg.toLowerCase().includes("password")) {
        msg = "A senha deve ter no mínimo 6 caracteres.";
      } else if (msg.toLowerCase().includes("network") || msg.toLowerCase().includes("fetch")) {
        msg = "Erro de conexão. Verifique sua internet.";
      }
      setErro(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  };

  const isSubmitting = loading || comprimindo;

  return (
    <AuthLayout>
      <div className="flex w-full flex-col items-center gap-4">
        <HeaderSuperior />

        <Alert variant="error">{erro}</Alert>
        <Alert variant="success">{mensagem}</Alert>

        <form onSubmit={handleCadastro} className="flex w-full flex-col gap-4">
          <div className="flex w-full flex-col gap-2">
            <FormSectionHeader title="Foto de Perfil" />
            <FormNotice>
              A foto deve conter o seu rosto 100% visível.
            </FormNotice>

            <PhotoUpload
              fotoPreview={fotoPreview}
              setFotoPreview={setFotoPreview}
              setFotoArquivo={setFotoArquivo}
              isCompressing={comprimindo}
              setIsCompressing={setComprimindo}
              onError={setErro}
            />
          </div>

          <div className="flex w-full flex-col gap-3">
            <FormSectionHeader title="Acesso ao App" />
            <FormInput
              icon={Mail}
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="E-mail"
              autoComplete="email"
            />
            <FormInput
              icon={LockKeyhole}
              type="password"
              name="senha"
              value={form.senha}
              onChange={handleChange}
              placeholder="Senha"
              minLength={6}
              autoComplete="new-password"
            />
            <FormInput
              icon={LockKeyhole}
              type="password"
              name="confirmarSenha"
              value={form.confirmarSenha}
              onChange={handleChange}
              placeholder="Confirmar senha"
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div className="flex w-full flex-col gap-3">
            <FormSectionHeader title="Dados Pessoais" />
            <FormInput
              icon={Contact}
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              placeholder="Nome completo"
              autoComplete="name"
            />
            <FormInput
              icon={Landmark}
              type="text"
              name="cpf"
              value={form.cpf}
              onChange={handleChange}
              placeholder="CPF"
              maxLength={14}
            />
            <FormInput
              icon={CalendarFold}
              type={form.dataNascimento ? "date" : "text"}
              onFocus={(e) => (e.target.type = "date")}
              onBlur={(e) => {
                if (!form.dataNascimento) e.target.type = "text";
              }}
              name="dataNascimento"
              value={form.dataNascimento}
              onChange={handleChange}
              placeholder="Data de nascimento"
            />
            <FormInput
              icon={Smartphone}
              type="tel"
              name="whatsapp"
              value={form.whatsapp}
              onChange={handleChange}
              placeholder="WhatsApp"
              autoComplete="tel"
              maxLength={15}
            />
            <FormInput
              icon={Wallet}
              type="text"
              name="chavePix"
              value={form.chavePix}
              onChange={handleChange}
              placeholder="Chave Pix"
            />
          </div>

          <div className="flex w-full flex-col gap-3">
            <FormSectionHeader title="Dados Profissionais" />
            <FormSelect
              icon={GraduationCap}
              name="curso"
              value={form.curso}
              onChange={handleChange}
            >
              <option value="" disabled hidden>
                Possui curso?
              </option>
              <option value="nenhum">
                Não possuo nenhum curso em Segurança
              </option>
              <option value="apoio">
                Possuo curso de Apoio e Segurança em Eventos
              </option>
              <option value="extensao">
                Possuo extensão para Grandes Eventos
              </option>
            </FormSelect>

            <FormSelect
              icon={Shirt}
              name="uniforme"
              value={form.uniforme}
              onChange={handleChange}
            >
              <option value="" disabled hidden>
                Uniforme
              </option>
              <option value="pp">Camisa de tamanho PP</option>
              <option value="p">Camisa de tamanho P</option>
              <option value="m">Camisa de tamanho M</option>
              <option value="g">Camisa de tamanho G</option>
              <option value="gg">Camisa de tamanho GG</option>
            </FormSelect>
          </div>

          <div className="flex w-full flex-col gap-1">
            <FormNotice>
              Você pode editar seus dados depois indo ao seu perfil no menu.
            </FormNotice>
            <FormNotice className="mt-1">
              Ao continuar, você concorda com os nossos{" "}
              <button
                type="button"
                onClick={() => openLegalModal("termos")}
                className="cursor-pointer underline transition-colors hover:text-neutral-300"
              >
                Termos de Serviço
              </button>{" "}
              e com a nossa{" "}
              <button
                type="button"
                onClick={() => openLegalModal("privacidade")}
                className="cursor-pointer underline transition-colors hover:text-neutral-300"
              >
                Política de Privacidade
              </button>
              .
            </FormNotice>
          </div>

          {recaptchaKey && (
            <div className="my-2 flex w-full justify-center overflow-hidden">
              <ReCAPTCHA
                sitekey={recaptchaKey}
                onChange={(valor) => setCaptchaValido(!!valor)}
                theme="dark"
              />
            </div>
          )}

          <SolidButton
            type="submit"
            disabled={isSubmitting || mensagem !== ""}
            variant="primary"
          >
            {loading
              ? "Cadastrando..."
              : comprimindo
                ? "Processando foto..."
                : "Cadastrar-se"}
          </SolidButton>

          <Divider />

          <SolidButton
            type="button"
            onClick={() => router.push("/")}
            disabled={isSubmitting}
            variant="tertiary"
          >
            Voltar
          </SolidButton>
        </form>
      </div>

      <LegalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        type={modalType}
      />
    </AuthLayout>
  );
}
