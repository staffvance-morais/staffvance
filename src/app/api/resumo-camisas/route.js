import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enviarEmailResumoCamisas } from "@/app/actions/email";

export async function POST(request) {
  try {
    const { eventoId } = await request.json();

    if (!eventoId) {
      return NextResponse.json({ error: "eventoId e obrigatorio." }, { status: 400 });
    }

    // Cliente Supabase com service role para leitura irrestrita
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // 1. Dados do evento
    const { data: evento, error: eventoError } = await supabaseAdmin
      .from("eventos")
      .select("titulo, endereco_texto")
      .eq("id", eventoId)
      .single();

    if (eventoError || !evento) {
      return NextResponse.json({ error: "Evento nao encontrado." }, { status: 404 });
    }

    // 2. Busca todas as escalas do evento com join nos perfis (nome + uniforme)
    const { data: escalas, error: escalasError } = await supabaseAdmin
      .from("escalas")
      .select("setor, staff_id, perfis ( nome_completo, uniforme )")
      .eq("evento_id", eventoId);

    if (escalasError) {
      console.error("Erro ao buscar escalas:", escalasError);
      return NextResponse.json({ error: "Erro ao buscar escalas." }, { status: 500 });
    }

    // 3. Busca e-mails de todos admins, coordenadores e owners (filtrando com trim/toLowerCase)
    const { data: todosPerfis, error: gestoresError } = await supabaseAdmin
      .from("perfis")
      .select("email, nome_completo, role");

    if (gestoresError) {
      console.error("Erro ao buscar gestores:", gestoresError);
      return NextResponse.json({ error: "Erro ao buscar gestores." }, { status: 500 });
    }

    const rolesPermitidas = ["admin", "coordenador", "producao", "produção", "owner"];
    const gestores = (todosPerfis || []).filter(g => {
      const r = (g.role || "").toLowerCase().trim();
      return rolesPermitidas.includes(r);
    });

    // 4. Monta a lista de staff escalado
    const listaStaff = (escalas || []).map(e => ({
      nome: e.perfis?.nome_completo || "Staff sem nome",
      setor: e.setor || "Setor nao definido",
      uniforme: e.perfis?.uniforme || null,
    }));

    if (listaStaff.length === 0) {
      return NextResponse.json({ success: false, message: "Nenhum staff escalado para este evento." });
    }

    // 5. Conta os tamanhos
    const ordemTamanhos = ["PP", "P", "M", "G", "GG", "XGG", "XGGG"];
    const contagem = {};
    ordemTamanhos.forEach(t => { contagem[t] = 0; });

    listaStaff.forEach(s => {
      if (s.uniforme) {
        const tam = s.uniforme.toUpperCase().trim();
        if (contagem.hasOwnProperty(tam)) {
          contagem[tam]++;
        } else {
          contagem[tam] = (contagem[tam] || 0) + 1;
        }
      }
    });

    // Remove tamanhos com zero
    const contagemFiltrada = Object.fromEntries(
      Object.entries(contagem).filter(([, v]) => v > 0)
    );

    // 6. Coleta e-mails validos dos gestores
    const emailsDestinatarios = (gestores || [])
      .filter(g => g.email && g.email.includes("@"))
      .map(g => g.email);

    if (emailsDestinatarios.length === 0) {
      return NextResponse.json({ success: false, message: "Nenhum gestor com e-mail cadastrado encontrado." });
    }

    // 7. Envia o e-mail
    const resultado = await enviarEmailResumoCamisas(
      emailsDestinatarios,
      evento,
      contagemFiltrada,
      listaStaff
    );

    if (!resultado.success) {
      return NextResponse.json({ success: false, error: resultado.error }, { status: 500 });
    }

    console.log(`[WADJET] Relatorio de uniformes enviado para ${emailsDestinatarios.length} gestores. Evento: ${evento.titulo}. Total staff: ${listaStaff.length}.`);

    return NextResponse.json({
      success: true,
      message: `Relatorio enviado para ${emailsDestinatarios.length} gestor(es).`,
      totalStaff: listaStaff.length,
      contagem: contagemFiltrada,
    });

  } catch (error) {
    console.error("Erro na API resumo-camisas:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}