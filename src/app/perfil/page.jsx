"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Contact,
  Wallet,
  Smartphone,
  CalendarFold,
  GraduationCap,
  Shirt,
  ShieldCheck,
  Check,
  Loader2,
  Mail,
  Landmark,
  Award,
  AlertCircle,
  Save,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { maskPhone, maskCPF } from "@/lib/masks";

import HeaderSuperior from "@/components/HeaderSuperior";
import AppNavigation from "@/components/AppNavigation";
import FormInput from "@/components/FormInput";
import FormSelect from "@/components/FormSelect";
import FormSectionHeader from "@/components/FormSectionHeader";
import FormNotice from "@/components/FormNotice";
import PhotoUpload from "@/components/PhotoUpload";
import SolidButton from "@/components/SolidButton";
import Alert from "@/components/Alert";

export default function PaginaPerfil() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [perfil, setPerfil] = useState(null);

  const [sucesso, setSucesso] = useState("");
  const [erro, setErro] = useState("");

  // Dados editáveis
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [uniforme, setUniforme] = useState("");
  const [curso, setCurso] = useState("");

  // Foto de perfil
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoArquivo, setFotoArquivo] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [fotoErro, setFotoErro] = useState("");

  // Converte AAAA-MM-DD para DD/MM/AAAA para exibição
  const formatarDataExibicao = (dataStr) => {
    if (!dataStr) return "";
    if (dataStr.includes("-")) {
      const partes = dataStr.split("-");
      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
    }
    return dataStr;
  };

  useEffect(() => {
    async function carregarPerfil() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          router.push("/");
          return;
        }

        const { data, error } = await supabase
          .from("perfis")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("Erro ao carregar perfil:", error);
          setErro("Não foi possível carregar os dados do seu perfil.");
        } else if (data) {
          setPerfil(data);
          setNome(data.nome_completo || "");
          setEmail(data.email || "");
          setCpf(data.cpf ? maskCPF(data.cpf) : "");
          setChavePix(data.chave_pix || "");
          setWhatsapp(data.whatsapp ? maskPhone(data.whatsapp) : "");
          setDataNascimento(formatarDataExibicao(data.data_nascimento));
          setUniforme(data.uniforme ? data.uniforme.toLowerCase() : "");
          setCurso(data.curso || "");
          if (data.foto_url) {
            setFotoPreview(data.foto_url);
          }
        }
      } catch (err) {
        console.error("Erro inesperado:", err);
        setErro("Erro de conexão ao carregar perfil.");
      } finally {
        setLoading(false);
      }
    }

    carregarPerfil();
  }, [router]);

  const handleCpfChange = (e) => {
    setCpf(maskCPF(e.target.value));
  };

  const handleDataNascimentoChange = (e) => {
    const formatted = e.target.value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{2})(\d)/, "$1/$2")
      .replace(/(\d{4})\d+?$/, "$1");
    setDataNascimento(formatted);
  };

  const handleWhatsappChange = (e) => {
    let rawDigits = e.target.value.replace(/\D/g, "");
    if (rawDigits.startsWith("0")) {
      rawDigits = rawDigits.substring(1);
    }
    setWhatsapp(maskPhone(rawDigits));
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro("");
    setSucesso("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Sessão expirada. Por favor, entre novamente.");
      }

      let fotoBase64 = null;
      if (fotoArquivo) {
        fotoBase64 = await fileToBase64(fotoArquivo);
      }

      const payload = {
        nome_completo: nome,
        email: email,
        cpf: cpf,
        chave_pix: chavePix,
        whatsapp: whatsapp,
        data_nascimento: dataNascimento,
        uniforme: uniforme,
        curso: curso,
        ...(fotoBase64 ? { foto_base64: fotoBase64 } : {}),
      };

      const res = await fetch("/api/perfil/atualizar", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao salvar os dados pessoais.");
      }

      setSucesso("Seus dados pessoais foram atualizados com sucesso!");
      if (json.perfil) {
        setPerfil(json.perfil);
        setNome(json.perfil.nome_completo || "");
        setEmail(json.perfil.email || "");
        setCpf(json.perfil.cpf ? maskCPF(json.perfil.cpf) : "");
        if (json.perfil.foto_url) {
          setFotoPreview(json.perfil.foto_url);
        }
      }
      setFotoArquivo(null);

      // Scroll suave até o topo para visualizar o alerta de sucesso
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setErro(err.message || "Erro inesperado ao salvar alterações.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSalvando(false);
    }
  };

  const getHomeHref = () => {
    const roleNorm = (perfil?.role || "").toLowerCase().trim();
    if (roleNorm === "admin" || roleNorm === "owner") return "/admin";
    if (roleNorm === "coordenador") return "/coordenador";
    if (roleNorm === "producao" || roleNorm === "produção") return "/producao";
    return "/freelancers";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <span className="text-neutral-500 font-medium animate-pulse text-sm">
          Carregando seus dados...
        </span>
      </div>
    );
  }

  const roleLabel =
    perfil?.cargo ||
    (perfil?.role === "admin"
      ? "Administrador"
      : perfil?.role === "coordenador"
      ? "Coordenador"
      : perfil?.role === "producao"
      ? "Produção"
      : "Staff");

  return (
    <div className="min-h-screen bg-[#141414] text-neutral-100 flex flex-col justify-between p-4 selection:bg-neutral-800 selection:text-white">
      <div className="mx-auto w-full max-w-sm flex flex-col gap-6 flex-1 pb-8">
        {/* CABEÇALHO COM BREADCRUMB */}
        <HeaderSuperior
          items={[
            { label: "Página inicial", href: getHomeHref() },
            { label: "Meu Perfil" },
          ]}
        />

        {/* FEEDBACK DE SUCESSO OU ERRO */}
        {sucesso && <Alert variant="success">{sucesso}</Alert>}
        {erro && <Alert variant="error">{erro}</Alert>}

        <form onSubmit={handleSalvar} className="flex flex-col gap-6">
          {/* FOTO DE PERFIL */}
          <div className="flex flex-col gap-2">
            <FormSectionHeader title="Foto de Perfil" />
            <PhotoUpload
              fotoPreview={fotoPreview}
              setFotoPreview={setFotoPreview}
              setFotoArquivo={setFotoArquivo}
              isCompressing={isCompressing}
              setIsCompressing={setIsCompressing}
              onError={setFotoErro}
              hasError={!!fotoErro}
            />
            {fotoErro && (
              <span className="text-xs text-red-400 font-semibold block">
                * {fotoErro}
              </span>
            )}
            <FormNotice>
              Adicione uma foto nítida para a identificação da equipe nos eventos.
            </FormNotice>
          </div>

          {/* DADOS DE PAGAMENTO (CHAVE PIX EM DESTAQUE) */}
          <div className="flex flex-col gap-3">
            <FormSectionHeader title="Pagamento & Chave Pix" />

            <div className="bg-[#1b221d] border border-emerald-800/60 p-3 flex items-start gap-2.5 text-xs text-emerald-300">
              <Wallet className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-emerald-200">
                  Importante para o recebimento de diárias
                </strong>
                Mantenha sua chave Pix sempre atualizada. Ela é utilizada pela
                gestão para creditar seus pagamentos das escalas trabalhadas.
              </div>
            </div>

            <div>
              <FormInput
                icon={Wallet}
                type="text"
                name="chavePix"
                value={chavePix}
                onChange={(e) => setChavePix(e.target.value)}
                placeholder="Chave Pix (CPF, Celular, E-mail ou Aleatória)"
                autoComplete="off"
              />
              <FormNotice className="mt-1 text-xs">
                Informe o Pix exato cadastrado no seu banco.
              </FormNotice>
            </div>
          </div>

          {/* CONTATO & IDENTIFICAÇÃO PESSOAL */}
          <div className="flex flex-col gap-3">
            <FormSectionHeader title="Contato Pessoal" />

            <div>
              <FormInput
                icon={Contact}
                type="text"
                name="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome completo"
                autoComplete="name"
                required
              />
            </div>

            <div>
              <FormInput
                icon={Smartphone}
                type="tel"
                name="whatsapp"
                value={whatsapp}
                onChange={handleWhatsappChange}
                placeholder="WhatsApp (com DDD)"
                autoComplete="tel"
                maxLength={15}
              />
              <FormNotice className="mt-1 text-xs">
                Canal onde você receberá comunicações das escalas.
              </FormNotice>
            </div>

            <div>
              <FormInput
                icon={CalendarFold}
                type="text"
                name="dataNascimento"
                value={dataNascimento}
                onChange={handleDataNascimentoChange}
                placeholder="Data de nascimento (DD/MM/AAAA)"
                maxLength={10}
              />
            </div>
          </div>

          {/* PREFERÊNCIAS DE EQUIPE / UNIFORME */}
          <div className="flex flex-col gap-3">
            <FormSectionHeader title="Uniforme & Formação" />

            <div>
              <FormSelect
                icon={Shirt}
                name="uniforme"
                value={uniforme}
                onChange={(e) => setUniforme(e.target.value)}
                placeholder="Tamanho do Uniforme (Camisa)"
              >
                <option value="" disabled hidden>
                  Tamanho do Uniforme (Camisa)
                </option>
                <option value="pp">Camisa de tamanho PP</option>
                <option value="p">Camisa de tamanho P</option>
                <option value="m">Camisa de tamanho M</option>
                <option value="g">Camisa de tamanho G</option>
                <option value="gg">Camisa de tamanho GG</option>
                <option value="xgg">Camisa de tamanho XGG</option>
              </FormSelect>
              <FormNotice className="mt-1 text-xs">
                Utilizado para separação de camisetas nos eventos.
              </FormNotice>
            </div>

            <div>
              <FormSelect
                icon={GraduationCap}
                name="curso"
                value={curso}
                onChange={(e) => setCurso(e.target.value)}
                placeholder="Possui curso de segurança?"
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
            </div>
          </div>

          {/* ACESSO & IDENTIFICAÇÃO (E-MAIL E CPF EDITÁVEIS) */}
          <div className="flex flex-col gap-3">
            <FormSectionHeader title="Acesso & Identificação" />

            <div>
              <FormInput
                icon={Mail}
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail de acesso"
                autoComplete="email"
                required
              />
              <FormNotice className="mt-1 text-xs">
                Utilizado para login. Se alterar, utilize o novo e-mail no próximo acesso.
              </FormNotice>
            </div>

            <div>
              <FormInput
                icon={Landmark}
                type="text"
                name="cpf"
                value={cpf}
                onChange={handleCpfChange}
                placeholder="CPF"
                maxLength={14}
              />
              <FormNotice className="mt-1 text-xs">
                Documento individual de identificação cadastrado.
              </FormNotice>
            </div>
          </div>

          {/* CARGO & FUNÇÃO NO SISTEMA (PROTEGIDO / NÃO EDITÁVEL) */}
          <div className="flex flex-col gap-3">
            <FormSectionHeader title="Cargo & Função no Sistema" />

            <div className="border border-neutral-700 bg-neutral-800/80 p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-neutral-400">
                <Award className="h-4 w-4 text-neutral-400" />
                <span>Cargo atribuído:</span>
              </div>
              <span className="font-semibold text-blue-400 text-sm">
                {roleLabel}
              </span>
            </div>

            <p className="text-[11px] text-neutral-500 leading-tight flex items-start gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-neutral-500 shrink-0 mt-0.5" />
              <span>
                O cargo e as permissões de acesso ao painel são definidos exclusivamente pela diretoria e coordenação da empresa.
              </span>
            </p>
          </div>

          {/* BOTÃO DE SALVAR */}
          <div className="pt-2">
            <SolidButton
              type="submit"
              disabled={salvando || isCompressing}
              variant="primary"
              icon={salvando ? Loader2 : Save}
            >
              {salvando ? "Salvando alterações..." : "Salvar Dados Pessoais"}
            </SolidButton>
          </div>
        </form>
      </div>

      {/* NAVEGAÇÃO INFERIOR */}
      <AppNavigation
        userProfile={perfil}
        userRole={perfil?.role || "staff"}
      />
    </div>
  );
}
