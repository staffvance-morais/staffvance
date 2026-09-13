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
        { error: "Acesso negado. Apenas administradores podem excluir clientes." },
        { status: 403 }
      );
    }

    // 2. Validar payload
    const { clienteId } = await request.json();
    if (!clienteId) {
      return NextResponse.json(
        { error: "clienteId é obrigatório." },
        { status: 400 }
      );
    }

    // 3. Desvincular cliente dos eventos existentes para evitar violação de chave estrangeira
    const { error: desvincularError } = await supabaseAdmin
      .from("eventos")
      .update({ cliente_id: null })
      .eq("cliente_id", clienteId);

    if (desvincularError) {
      console.warn("Aviso ao desvincular cliente dos eventos:", desvincularError.message);
    }

    // 4. Excluir o cliente da tabela clientes
    const { error: clienteError } = await supabaseAdmin
      .from("clientes")
      .delete()
      .eq("id", clienteId);

    if (clienteError) {
      console.error("Erro ao deletar cliente:", clienteError);
      return NextResponse.json(
        { error: "Erro ao excluir cliente: " + clienteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erro inesperado ao deletar cliente:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor ao excluir cliente." },
      { status: 500 }
    );
  }
}
