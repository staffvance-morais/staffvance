import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ROLES_PERMITIDOS = ["admin", "owner"];

export async function DELETE(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
    return NextResponse.json(
      { error: "Configuração do Supabase ausente no servidor." },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(
    supabaseUrl,
    supabaseServiceKey || supabaseAnonKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // 1. Validar autenticação do chamador
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Não autorizado. Token ausente." },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: chamador },
      error: authCheckError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authCheckError || !chamador) {
      return NextResponse.json(
        { error: "Token inválido ou expirado." },
        { status: 401 }
      );
    }

    // Valida se o usuário tem perfil admin/owner
    const { data: perfilChamador } = await supabaseAdmin
      .from("perfis")
      .select("role")
      .eq("id", chamador.id)
      .single();

    const roleChamador = (perfilChamador?.role || chamador.user_metadata?.role || "")
      .toLowerCase()
      .trim();

    if (!ROLES_PERMITIDOS.includes(roleChamador)) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem excluir eventos." },
        { status: 403 }
      );
    }

    // 2. Validar payload
    const { eventoId } = await request.json();
    if (!eventoId) {
      return NextResponse.json(
        { error: "eventoId é obrigatório." },
        { status: 400 }
      );
    }

    // 3. Excluir escalas vinculadas ao evento primeiro (evita erro de chave estrangeira)
    const { error: escalasError } = await supabaseAdmin
      .from("escalas")
      .delete()
      .eq("evento_id", eventoId);

    if (escalasError) {
      console.warn("Aviso ao deletar escalas do evento:", escalasError.message);
    }

    // 4. Excluir o evento da tabela eventos
    const { error: eventoError } = await supabaseAdmin
      .from("eventos")
      .delete()
      .eq("id", eventoId);

    if (eventoError) {
      console.error("Erro ao deletar evento:", eventoError);
      return NextResponse.json(
        { error: "Erro ao excluir evento: " + eventoError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erro inesperado ao deletar evento:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor ao excluir evento." },
      { status: 500 }
    );
  }
}
