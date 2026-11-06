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

    // 3. Identifica administradores e apenas os coordenadores/produtores que foram escalados na partida
    const { data: todosPerfis, error: gestoresError } = await supabaseAdmin
      .from("perfis")
      .select("*");

    if (gestoresError) {
      console.error("Erro ao buscar gestores:", gestoresError);
      return NextResponse.json({ error: "Erro ao buscar gestores." }, { status: 500 });
    }

    const idsEscalados = new Set((escalas || []).map(e => e.staff_id));
    const rolesAdmin = ["admin", "owner", "administrador"];
    const rolesCoordEProd = ["coordenador", "coordenadora", "producao", "produção", "produtor", "produtora"];

    const destinatariosPerfis = (todosPerfis || []).filter(p => {
      const r = (p.role || "").toLowerCase().trim();
      const c = (p.cargo || "").toLowerCase().trim();

      // Administradores sempre recebem
      if (rolesAdmin.includes(r) || rolesAdmin.includes(c)) {
        return true;
      }

      // Coordenadores e produtores recebem SOMENTE se estiverem escalados neste evento
      const isCoordOuProd = rolesCoordEProd.includes(r) || rolesCoordEProd.includes(c);
      return isCoordOuProd && idsEscalados.has(p.id);
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

    // 6. Coleta e-mails válidos apenas dos 2 administradores (Morais e Admin conectado) e dos coordenadores/produtores escalados
    const emailsSet = new Set();

    // Garante explicitamente os 2 administradores principais (principalmente o Morais)
    emailsSet.add("alexmorais_silva@hotmail.com");
    if (process.env.EMAIL_USER && process.env.EMAIL_USER.includes("@")) {
      emailsSet.add(process.env.EMAIL_USER.trim().toLowerCase());
    }
    emailsSet.add("disnouaraujo@gmail.com");

    for (const g of destinatariosPerfis) {
      if (g.email && g.email.includes("@")) {
        emailsSet.add(g.email.trim().toLowerCase());
      } else if (g.id && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const { data: uData } = await supabaseAdmin.auth.admin.getUserById(g.id);
          const authEmail = uData?.user?.email?.trim().toLowerCase();
          if (authEmail && authEmail.includes("@")) {
            emailsSet.add(authEmail);
          }
        } catch (_) {}
      }
    }

    const emailsDestinatarios = Array.from(emailsSet);

    if (emailsDestinatarios.length === 0) {
      return NextResponse.json({ success: false, message: "Nenhum e-mail de administrador, coordenador ou produtor escalado encontrado." });
    }

    // 7. Envia o relatório de vestuário
    const resultado = await enviarEmailResumoCamisas(
      emailsDestinatarios,
      evento,
      contagemFiltrada,
      listaStaff
    );

    if (!resultado.success) {
      return NextResponse.json({ success: false, error: resultado.error }, { status: 500 });
    }

    console.log(`[WADJET] Relatório de vestuário enviado para ${resultado.enviados} destinatário(s) (admin + coordenadores/produtores escalados). Evento: ${evento.titulo}. Staffs: ${listaStaff.length}.`);

    return NextResponse.json({
      success: true,
      message: `Relatório de uniformes enviado com sucesso para ${resultado.enviados} destinatário(s) (admin e coordenadores/produtores escalados).`,
      totalStaff: listaStaff.length,
      contagem: contagemFiltrada,
      coordenadoresNotificados: emailsDestinatarios,
    });

  } catch (error) {
    console.error("Erro na API resumo-camisas:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}