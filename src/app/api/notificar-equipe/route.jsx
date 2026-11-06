import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { enviarEmailEscalacao } from '@/app/actions/email';

export async function POST(request) {
  try {
    const body = await request.json();
    let { evento, equipe, eventoId } = body;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Se passou apenas eventoId, busca dados do evento e equipe no banco
    if (eventoId && (!evento || !equipe)) {
      const { data: evData, error: evError } = await supabaseAdmin
        .from('eventos')
        .select('*')
        .eq('id', eventoId)
        .single();

      if (evError || !evData) {
        return NextResponse.json({ success: false, error: "Evento não encontrado." }, { status: 404 });
      }

      evento = evData;

      const { data: escData, error: escError } = await supabaseAdmin
        .from('escalas')
        .select('setor, staff_id, perfis ( id, nome_completo, email )')
        .eq('evento_id', eventoId);

      if (escError) {
        return NextResponse.json({ success: false, error: "Erro ao buscar escalas." }, { status: 500 });
      }

      equipe = (escData || []).map(e => ({
        id: e.staff_id,
        nome: e.perfis?.nome_completo || "Staff",
        email: e.perfis?.email || null,
        setor: e.setor || "Geral",
      }));
    }

    if (!evento || !equipe || equipe.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Nenhum membro ou evento fornecido para notificação."
      }, { status: 400 });
    }

    let enviados = 0;
    let semEmail = 0;
    const falhas = [];

    for (const membro of equipe) {
      if ((membro.email && membro.email.includes('@')) || membro.id) {
        const res = await enviarEmailEscalacao(
          membro.email ? membro.email.trim() : "",
          membro.nome || "Profissional",
          {
            titulo: evento.titulo || "Operação Wadjet",
            endereco_texto: evento.endereco_texto || "Local a ser definido"
          },
          membro.setor || "Geral",
          membro.id || null
        );

        if (res.success) {
          enviados++;
        } else if (res.error === "E-mail do colaborador não encontrado.") {
          semEmail++;
        } else {
          console.error(`Erro ao notificar ${membro.email || membro.id}:`, res.error);
          falhas.push({ email: membro.email || membro.id, error: res.error });
        }
      } else {
        semEmail++;
      }
    }

    console.log(`[WADJET] Notificações de equipe enviadas: ${enviados}. Sem e-mail: ${semEmail}. Falhas: ${falhas.length}.`);

    return NextResponse.json({
      success: true,
      message: `${enviados} aviso(s) de convocação enviado(s) com sucesso por e-mail!`,
      totalEquipe: equipe.length,
      enviados,
      semEmail,
      falhas: falhas.length > 0 ? falhas : undefined
    });

  } catch (error) {
    console.error("Erro na API notificar-equipe:", error);
    return NextResponse.json({ success: false, error: error.message || "Falha ao enviar notificações" }, { status: 500 });
  }
}