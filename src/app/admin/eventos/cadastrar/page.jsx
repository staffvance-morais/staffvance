"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { 
  ArrowLeft, CalendarDays, MapPin, Clock, Image as ImageIcon, 
  Map, Briefcase, Save, Users, UploadCloud, Check, Loader2
} from "lucide-react";

// Conexão com o Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ==========================================
// COMPONENTE: CAMPO DE FORMULÁRIO CUSTOMIZADO
// ==========================================
const FormInput = ({ label, icon: Icon, type = "text", placeholder, value, onChange, options = [] }) => (
  <div className="mb-5">
    <label className="block text-[#999999] text-[14px] mb-1.5 ml-1">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666]" size={20} strokeWidth={1.5} />}
      {type === "select" ? (
        <select value={value} onChange={onChange} className="w-full bg-[#222222] border border-[#3a3a3a] text-[#e5e5e5] h-[50px] pl-[46px] pr-4 outline-none text-[16px] rounded-sm focus:border-[#2563eb] transition-colors appearance-none">
          <option value="" disabled>Selecione uma opção...</option>
          {options.map((opt, index) => (
            <option key={index} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input type={type} placeholder={placeholder} value={value} onChange={onChange} className="w-full bg-[#222222] border border-[#3a3a3a] text-[#e5e5e5] h-[50px] pl-[46px] pr-4 outline-none text-[16px] rounded-sm placeholder:text-[#555] focus:border-[#2563eb] transition-colors" />
      )}
    </div>
  </div>
);

// ==========================================
// PÁGINA PRINCIPAL: CADASTRAR EVENTO
// ==========================================
export default function CadastrarEvento() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    titulo: "", nome_contratante: "", endereco_texto: "", 
    data_evento: "", hora_inicio: "", hora_fim: "", 
    foto_local: "", foto_arquivo: null, mapa_tatico: ""
  });

  const handleChange = (campo, valor) => setFormData(prev => ({ ...prev, [campo]: valor }));
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setFormData(prev => ({ ...prev, foto_arquivo: e.target.files[0] }));
  };

  const handleSalvarEEscalar = async () => {
    setLoading(true);
    try {
      let imagemFinal = formData.foto_local;

      if (formData.foto_local === "novo" && formData.foto_arquivo) {
        const fileExt = formData.foto_arquivo.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('fotos_locais')
          .upload(fileName, formData.foto_arquivo);

        if (uploadError) throw new Error("Erro ao fazer upload da imagem");

        const { data: publicUrlData } = supabase.storage.from('fotos_locais').getPublicUrl(fileName);
        imagemFinal = publicUrlData.publicUrl; 
      }

      let dataInicioTimestamp = null;
      let dataFimTimestamp = null;

      if (formData.data_evento && formData.hora_inicio) {
        dataInicioTimestamp = new Date(`${formData.data_evento}T${formData.hora_inicio}`).toISOString();
      }
      if (formData.data_evento && formData.hora_fim) {
        dataFimTimestamp = new Date(`${formData.data_evento}T${formData.hora_fim}`).toISOString();
      }

      const { data: eventoData, error: eventoError } = await supabase
        .from('eventos')
        .insert([{
          titulo: formData.titulo || "Evento Sem Título",
          nome_contratante: formData.nome_contratante || null,
          endereco_texto: formData.endereco_texto || null,
          data_inicio: dataInicioTimestamp,
          data_fim: dataFimTimestamp,
          foto_local: imagemFinal || null,
          mapa_tatico: formData.mapa_tatico || null
        }])
        .select()
        .single();

      if (eventoError) throw eventoError;

      router.push(`/admin/eventos/${eventoData.id}/escalar`);

    } catch (error) {
      console.error(error);
      alert("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#171717] font-sans flex flex-col items-center">
      <div className="w-full max-w-[500px] min-h-screen flex flex-col bg-[#1c1c1c] relative border-x border-[#2a2a2a]">
        
        {/* CABEÇALHO */}
        <div className="flex items-center gap-4 text-[#cccccc] p-5 border-b border-[#333333] sticky top-0 bg-[#1c1c1c] z-10">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-sm hover:bg-[#2a2a2a] transition-colors cursor-pointer">
            <ArrowLeft size={24} strokeWidth={1.5} />
          </button>
          <div>
            <h1 className="text-[20px] font-semibold tracking-wide text-[#e5e5e5]">Novo Evento</h1>
            <p className="text-[13px] text-[#777]">Preencha os dados da operação</p>
          </div>
        </div>

        {/* FORMULÁRIO */}
        <div className="p-6 flex-1">
          <FormInput label="Nome do Evento (Título)" icon={CalendarDays} placeholder="Ex: Fortaleza x Ceará" value={formData.titulo} onChange={(e) => handleChange("titulo", e.target.value)} />
          <FormInput label="Contratante / Cliente" icon={Briefcase} placeholder="Ex: Federação Cearense" value={formData.nome_contratante} onChange={(e) => handleChange("nome_contratante", e.target.value)} />
          <FormInput label="Local (Endereço/Estádio)" icon={MapPin} placeholder="Ex: Estádio Presidente Vargas" value={formData.endereco_texto} onChange={(e) => handleChange("endereco_texto", e.target.value)} />

          {/* ==========================================
              CORREÇÃO DE RESPONSIVIDADE: DATA E HORA
              ========================================== */}
          <FormInput label="Data da Operação" icon={CalendarDays} type="date" value={formData.data_evento} onChange={(e) => handleChange("data_evento", e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Início" icon={Clock} type="time" value={formData.hora_inicio} onChange={(e) => handleChange("hora_inicio", e.target.value)} />
            <FormInput label="Término" icon={Clock} type="time" value={formData.hora_fim} onChange={(e) => handleChange("hora_fim", e.target.value)} />
          </div>

          <div className="w-full h-px bg-[#333] my-4"></div>

          <h2 className="text-[#e5e5e5] text-[16px] font-medium mb-4">Recursos Visuais da Escala</h2>

          <FormInput 
            label="Foto do Local (Para os cards)" icon={ImageIcon} type="select" value={formData.foto_local} onChange={(e) => handleChange("foto_local", e.target.value)}
            options={[
              { value: "/Presidente_Vargas_Stadium.jpg", label: "Estádio Presidente Vargas" },
              { value: "/aecio_de_borba.jpg", label: "Ginásio Aécio de Borba" },
              { value: "novo", label: "➕ Novo Local (Enviar Foto)" },
              { value: "padrao", label: "Sem foto específica (Padrão)" }
            ]}
          />

          {formData.foto_local === "novo" && (
            <div className="mb-5 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-[#999999] text-[14px] mb-1.5 ml-1">Anexar Foto</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#3a3a3a] border-dashed rounded-sm cursor-pointer bg-[#222] hover:bg-[#2a2a2a] hover:border-[#2563eb] transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 mb-3 text-[#777]" />
                    <p className="mb-2 text-sm text-[#999]"><span className="font-semibold text-[#e5e5e5]">Clique para enviar</span> ou arraste a foto</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              </div>
              {formData.foto_arquivo && <p className="mt-2 text-[14px] text-[#22c55e] flex items-center gap-2"><Check size={16} /> Imagem carregada: {formData.foto_arquivo.name}</p>}
            </div>
          )}

          <FormInput 
            label="Mapa Tático da Operação" icon={Map} type="select" value={formData.mapa_tatico} onChange={(e) => handleChange("mapa_tatico", e.target.value)}
            options={[
              { value: "mapa_pv", label: "Presidente Vargas - Setores Completos" },
              { value: "nenhum", label: "Não utilizar mapa tático neste evento" }
            ]}
          />
        </div>

        {/* BOTÃO PRINCIPAL COM LOADING */}
        <div className="p-5 border-t border-[#333333] bg-[#1a1a1a] flex flex-col gap-3 sticky bottom-0">
          <button 
            onClick={handleSalvarEEscalar} disabled={loading}
            className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white flex items-center justify-center gap-2 font-semibold py-4 text-[17px] tracking-wide rounded-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={22} /> : <Users size={22} />}
            {loading ? "Salvando no Banco..." : "Salvar e Escalar Equipe"}
          </button>
        </div>

      </div>
    </div>
  );
}