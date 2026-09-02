import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Cliente com permissão total (service_role) — NUNCA expor no client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Roles que têm permissão para deletar usuários
const ROLES_PERMITIDOS = ["admin", "owner"];

export async function DELETE(request) {
  try {
    // ─── 1. VERIFICAR AUTENTICAÇÃO DO CHAMADOR ─────────────────────
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Não autorizado. Token ausente." },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Valida o token JWT e obtém o usuário chamador
    const { data: { user: chamador }, error: authCheckError } =
      await supabaseAdmin.auth.getUser(token);

    if (authCheckError || !chamador) {
      return NextResponse.json(
        { error: "Token inválido ou expirado." },
        { status: 401 }
      );
    }

    // Busca o role do chamador na tabela perfis
    const { data: perfilChamador, error: perfilCheckError } =
      await supabaseAdmin
        .from("perfis")
        .select("role")
        .eq("id", chamador.id)
        .single();

    if (perfilCheckError || !perfilChamador) {
      return NextResponse.json(
        { error: "Perfil do solicitante não encontrado." },
        { status: 403 }
      );
    }

    const roleChamador = (perfilChamador.role || "").toLowerCase().trim();
    if (!ROLES_PERMITIDOS.includes(roleChamador)) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem excluir usuários." },
        { status: 403 }
      );
    }

    // ─── 2. VALIDAR O PAYLOAD ──────────────────────────────────────
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório." }, { status: 400 });
    }

    // Impede o admin de deletar a si mesmo
    if (userId === chamador.id) {
      return NextResponse.json(
        { error: "Você não pode excluir a sua própria conta por aqui." },
        { status: 400 }
      );
    }

    // ─── 3. DELETAR PERFIL DA TABELA ──────────────────────────────
    const { error: perfilError } = await supabaseAdmin
      .from("perfis")
      .delete()
      .eq("id", userId);

    if (perfilError) {
      console.error("Erro ao deletar perfil:", perfilError);
      // Não interrompe — tenta deletar do Auth mesmo assim
    }

    // ─── 4. DELETAR DO SUPABASE AUTH ──────────────────────────────
    // Revoga todas as sessões ativas e remove permanentemente
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("Erro ao deletar usuário do Auth:", authError);
      return NextResponse.json(
        { error: "Erro ao remover usuário do sistema de autenticação." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erro inesperado na rota deletar-usuario:", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
