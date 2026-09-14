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
  AlertCircle,
} from "lucide-react";

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

  const [errosCampos, setErrosCampos] = useState({});
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [captchaValido, setCaptchaValido] = useState(false);
  const [autorizoImagem, setAutorizoImagem] = useState(true);
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

    // Limpa erro específico do campo que o usuário está editando
    if (errosCampos[name]) {
      setErrosCampos((prev) => {
        const novo = { ...prev };
        delete novo[name];
        return novo;
      });
    }

    if (name === "cpf") {
      formattedValue = maskCPF(value);
    } else if (name === "whatsapp") {
      let rawDigits = value.replace(/\D/g, "");
      if (rawDigits.startsWith("0")) {
        rawDigits = rawDigits.substring(1);
      }
      formattedValue = maskPhone(rawDigits);
    } else if (name === "dataNascimento") {
      formattedValue = value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d)/, "$1/$2")
        .replace(/(\d{2})(\d)/, "$1/$2")
        .replace(/(\d{4})\d+?$/, "$1");
    } else if (name === "nome") {
      formattedValue = value
        .toLowerCase()
        .split(" ")
        .map((word) => {
          if (word.length === 0) return word;
          const preposicoes = ["de", "da", "do", "das", "dos", "e"];
          if (preposicoes.includes(word)) return word;
          return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
    }

    setForm((prev) => ({ ...prev, [name]: formattedValue }));
  };

  // Limpa erro de foto assim que uma foto válida é selecionada
  const handleSetFotoArquivo = (arquivo) => {
    setFotoArquivo(arquivo);
    if (arquivo && errosCampos.foto) {
      setErrosCampos((prev) => {
        const novo = { ...prev };
        delete novo.foto;
        return novo;
      });
    }
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

    // 1. VALIDAÇÃO DETALHADA CAMPO A CAMPO (COM FEEDBACK VISUAL)
    const novosErros = {};

    if (!fotoArquivo && !fotoPreview) {
      novosErros.foto = "Adicione uma foto de perfil nítida do seu rosto";
    }

    if (!email.trim()) {
      novosErros.email = "Informe seu e-mail";
    } else if (!email.includes("@") || !email.includes(".")) {
      novosErros.email = "Formato de e-mail inválido";
    }

    if (!senha) {
      novosErros.senha = "Crie uma senha de acesso";
    } else if (senha.length < 6) {
      novosErros.senha = "A senha deve ter no mínimo 6 caracteres";
    }

    if (!confirmarSenha) {
      novosErros.confirmarSenha = "Confirme sua senha";
    } else if (senha !== confirmarSenha) {
      novosErros.confirmarSenha = "As senhas digitadas não coincidem";
    }

    if (!nome.trim()) {
      novosErros.nome = "Informe seu nome completo";
    } else if (nome.trim().split(" ").filter(Boolean).length < 2) {
      novosErros.nome = "Por favor, digite seu nome e sobrenome";
    }

    const cpfNumeros = cpf.replace(/\D/g, "");
    if (!cpf.trim()) {
      novosErros.cpf = "Informe seu CPF";
    } else if (cpfNumeros.length !== 11) {
      novosErros.cpf = "CPF incompleto (são necessários 11 dígitos)";
    }

    if (!dataNascimento) {
      novosErros.dataNascimento = "Informe sua data de nascimento";
    } else if (dataNascimento.length !== 10) {
      novosErros.dataNascimento = "Data incompleta (formato DD/MM/AAAA)";
    }

    const telNumeros = whatsapp.replace(/\D/g, "");
    if (!whatsapp.trim()) {
      novosErros.whatsapp = "Informe seu WhatsApp";
    } else if (telNumeros.length < 10) {
      novosErros.whatsapp = "WhatsApp incompleto (inclua o DDD)";
    }

    if (!chavePix.trim()) {
      novosErros.chavePix = "Informe sua chave Pix para pagamento das diárias";
    }

    if (!curso) {
      novosErros.curso = "Selecione se possui curso na área de segurança";
    }

    if (!uniforme) {
      novosErros.uniforme = "Selecione o tamanho da sua camisa de uniforme";
    }

    if (Object.keys(novosErros).length > 0) {
      setErrosCampos(novosErros);
      const primeiroErro = Object.values(novosErros)[0];
      setErro(primeiroErro);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Validação do ReCAPTCHA (com aviso específico se faltar)
    if (recaptchaKey && !captchaValido) {
      setErro("Por favor, marque a caixa 'Não sou um robô' para continuar.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);

    try {
      // Converte a foto em base64 para envio seguro ao servidor
      let fotoBase64 = null;
      if (fotoArquivo) {
        fotoBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(fotoArquivo);
        });
      }

      const res = await fetch("/api/cadastrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: senha,
          nome_completo: nome.trim(),
          cpf: cpf.trim(),
          data_nascimento: dataNascimento,
          whatsapp: whatsapp.trim(),
          chave_pix: chavePix.trim(),
          curso,
          uniforme,
          foto_base64: fotoBase64,
          autorizo_imagem: autorizoImagem,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ocorreu um erro no cadastro.");

      // Dispara e-mail de notificação em segundo plano se disponível
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
            autorizoImagem,
          }),
        });
      } catch (emailError) {
        console.warn("Falha ao enviar notificação de cadastro:", emailError);
      }

      setMensagem("Cadastro realizado com sucesso! Faça login para continuar.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error) {
      let msg = error?.message || "Ocorreu um erro no cadastro.";
      if (
        msg.toLowerCase().includes("already registered") ||
        msg.toLowerCase().includes("already in use")
      ) {
        msg = "Este e-mail já está cadastrado no sistema. Faça login com sua senha.";
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

        {erro && (
          <Alert variant="error">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="shrink-0 text-red-400" />
              <span>{erro}</span>
            </div>
          </Alert>
        )}

        {mensagem && <Alert variant="success">{mensagem}</Alert>}

        <form onSubmit={handleCadastro} className="flex w-full flex-col gap-4">
          
          {/* FOTO DE PERFIL */}
          <div className="flex w-full flex-col gap-2">
            <FormSectionHeader title="Foto de Perfil" />
            <FormNotice>
              A foto deve conter o seu rosto 100% visível (estilo documento/crachá).
            </FormNotice>

            <PhotoUpload
              fotoPreview={fotoPreview}
              setFotoPreview={setFotoPreview}
              setFotoArquivo={handleSetFotoArquivo}
              isCompressing={comprimindo}
              setIsCompressing={setComprimindo}
              onError={setErro}
              hasError={!!errosCampos.foto}
            />
            {errosCampos.foto && (
              <span className="text-xs text-red-400 font-semibold ml-1">
                * {errosCampos.foto}
              </span>
            )}
          </div>

          {/* ACESSO AO APP */}
          <div className="flex w-full flex-col gap-3">
            <FormSectionHeader title="Acesso ao App" />
            
            <div>
              <FormInput
                icon={Mail}
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="E-mail"
                autoComplete="email"
                className={errosCampos.email ? "!border-red-500 bg-red-950/20" : ""}
              />
              {errosCampos.email && (
                <span className="text-xs text-red-400 font-semibold ml-1 block mt-1">
                  * {errosCampos.email}
                </span>
              )}
            </div>

            <div>
              <FormInput
                icon={LockKeyhole}
                type="password"
                name="senha"
                value={form.senha}
                onChange={handleChange}
                placeholder="Senha (mínimo 6 dígitos)"
                minLength={6}
                autoComplete="new-password"
                className={errosCampos.senha ? "!border-red-500 bg-red-950/20" : ""}
              />
              {errosCampos.senha && (
                <span className="text-xs text-red-400 font-semibold ml-1 block mt-1">
                  * {errosCampos.senha}
                </span>
              )}
            </div>

            <div>
              <FormInput
                icon={LockKeyhole}
                type="password"
                name="confirmarSenha"
                value={form.confirmarSenha}
                onChange={handleChange}
                placeholder="Confirmar senha"
                minLength={6}
                autoComplete="new-password"
                className={errosCampos.confirmarSenha ? "!border-red-500 bg-red-950/20" : ""}
              />
              {errosCampos.confirmarSenha && (
                <span className="text-xs text-red-400 font-semibold ml-1 block mt-1">
                  * {errosCampos.confirmarSenha}
                </span>
              )}
            </div>
          </div>

          {/* DADOS PESSOAIS */}
          <div className="flex w-full flex-col gap-3">
            <FormSectionHeader title="Dados Pessoais" />
            
            <div>
              <FormInput
                icon={Contact}
                type="text"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                placeholder="Nome completo"
                autoComplete="name"
                className={errosCampos.nome ? "!border-red-500 bg-red-950/20" : ""}
              />
              {errosCampos.nome && (
                <span className="text-xs text-red-400 font-semibold ml-1 block mt-1">
                  * {errosCampos.nome}
                </span>
              )}
            </div>

            <div>
              <FormInput
                icon={Landmark}
                type="text"
                name="cpf"
                value={form.cpf}
                onChange={handleChange}
                placeholder="CPF"
                maxLength={14}
                className={errosCampos.cpf ? "!border-red-500 bg-red-950/20" : ""}
              />
              {errosCampos.cpf && (
                <span className="text-xs text-red-400 font-semibold ml-1 block mt-1">
                  * {errosCampos.cpf}
                </span>
              )}
            </div>

            <div>
              <FormInput
                icon={CalendarFold}
                type="text"
                name="dataNascimento"
                value={form.dataNascimento}
                onChange={handleChange}
                placeholder="Data de nascimento (DD/MM/AAAA)"
                maxLength={10}
                className={errosCampos.dataNascimento ? "!border-red-500 bg-red-950/20" : ""}
              />
              {errosCampos.dataNascimento && (
                <span className="text-xs text-red-400 font-semibold ml-1 block mt-1">
                  * {errosCampos.dataNascimento}
                </span>
              )}
            </div>

            <div>
              <FormInput
                icon={Smartphone}
                type="tel"
                name="whatsapp"
                value={form.whatsapp}
                onChange={handleChange}
                placeholder="WhatsApp (com DDD)"
                autoComplete="tel"
                maxLength={15}
                className={errosCampos.whatsapp ? "!border-red-500 bg-red-950/20" : ""}
              />
              {errosCampos.whatsapp && (
                <span className="text-xs text-red-400 font-semibold ml-1 block mt-1">
                  * {errosCampos.whatsapp}
                </span>
              )}
            </div>

            <div>
              <FormInput
                icon={Wallet}
                type="text"
                name="chavePix"
                value={form.chavePix}
                onChange={handleChange}
                placeholder="Chave Pix (para diárias)"
                className={errosCampos.chavePix ? "!border-red-500 bg-red-950/20" : ""}
              />
              {errosCampos.chavePix && (
                <span className="text-xs text-red-400 font-semibold ml-1 block mt-1">
                  * {errosCampos.chavePix}
                </span>
              )}
            </div>
          </div>

          {/* DADOS PROFISSIONAIS */}
          <div className="flex w-full flex-col gap-3">
            <FormSectionHeader title="Dados Profissionais" />
            
            <div>
              <FormSelect
                icon={GraduationCap}
                name="curso"
                value={form.curso}
                onChange={handleChange}
                hasError={!!errosCampos.curso}
              >
                <option value="" disabled hidden>
                  Possui curso de segurança?
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
              {errosCampos.curso && (
                <span className="text-xs text-red-400 font-semibold ml-1 block mt-1">
                  * {errosCampos.curso}
                </span>
              )}
            </div>

            <div>
              <FormSelect
                icon={Shirt}
                name="uniforme"
                value={form.uniforme}
                onChange={handleChange}
                hasError={!!errosCampos.uniforme}
              >
                <option value="" disabled hidden>
                  Tamanho do Uniforme (Camisa)
                </option>
                <option value="pp">Camisa de tamanho PP</option>
                <option value="p">Camisa de tamanho P</option>
                <option value="m">Camisa de tamanho M</option>
                <option value="g">Camisa de tamanho G</option>
                <option value="gg">Camisa de tamanho GG</option>
              </FormSelect>
              {errosCampos.uniforme && (
                <span className="text-xs text-red-400 font-semibold ml-1 block mt-1">
                  * {errosCampos.uniforme}
                </span>
              )}
            </div>
          </div>

          {/* TERMO DE AUTORIZAÇÃO DE USO DE IMAGEM */}
          <div className="flex items-start gap-3 p-3.5 rounded border border-neutral-700/80 bg-neutral-900/60 transition-colors hover:border-neutral-600">
            <input
              type="checkbox"
              id="autorizoImagem"
              name="autorizoImagem"
              checked={autorizoImagem}
              onChange={(e) => setAutorizoImagem(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-600 bg-neutral-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer accent-blue-600"
            />
            <label htmlFor="autorizoImagem" className="text-xs sm:text-sm text-neutral-300 leading-snug cursor-pointer select-none">
              Autorizo o uso da minha imagem nos eventos para as mídias sociais e divulgação institucional.{" "}
              <button
                type="button"
                onClick={() => openLegalModal("imagem")}
                className="cursor-pointer text-blue-400 hover:text-blue-300 underline font-medium inline-block ml-0.5"
              >
                (Ler mais sobre o termo)
              </button>
            </label>
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