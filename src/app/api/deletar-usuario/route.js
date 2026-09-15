import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Roles que têm permissão para deletar usuários
const ROLES_PERMITIDOS = ["admin", "owner", "coordenador", "producao", "produção"];

export async function DELETE(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
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

    // Cliente autenticado como o próprio chamador para ler seu próprio perfil via RLS
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const clientPrincipal = supabaseServiceKey ? supabaseAdmin : supabaseUserClient;

    let roleChamador = (chamador.user_metadata?.role || "").toLowerCase().trim();

    const { data: perfilChamador } = await clientPrincipal
      .from("perfis")
      .select("role")
      .eq("id", chamador.id)
      .single();

    if (perfilChamador?.role) {
      roleChamador = perfilChamador.role.toLowerCase().trim();
    }

    if (!ROLES_PERMITIDOS.includes(roleChamador)) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores, coordenadores e produção podem excluir membros." },
        { status: 403 }
      );
    }

    // ─── 2. VALIDAR O PAYLOAD ──────────────────────────────────────
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório." }, { status: 400 });
    }

    // Impede o usuário de deletar a si mesmo
    if (userId === chamador.id) {
      return NextResponse.json(
        { error: "Você não pode excluir a sua própria conta por aqui." },
        { status: 400 }
      );
    }

    // Se o chamador for coordenador ou produção, garante que só pode excluir staff (não outros coordenadores, produção ou admins)
    if (roleChamador === "coordenador" || roleChamador === "producao" || roleChamador === "produção") {
      const { data: targetPerfil } = await clientPrincipal
        .from("perfis")
        .select("role, cargo")
        .eq("id", userId)
        .maybeSingle();

      if (targetPerfil) {
        const targetRole = (targetPerfil.role || "").toLowerCase().trim();
        const targetCargo = (targetPerfil.cargo || "").toLowerCase().trim();
        if (
          targetRole === "admin" ||
          targetRole === "owner" ||
          targetRole === "coordenador" ||
          targetRole === "producao" ||
          targetRole === "produção" ||
          targetCargo.includes("coord") ||
          targetCargo.includes("prod") ||
          targetCargo.includes("admin")
        ) {
          return NextResponse.json(
            { error: "Coordenadores e Produção só podem excluir membros da equipe (staff)." },
            { status: 403 }
          );
        }
      }
    }

    // ─── 3. DELETAR ESCALAS DO MEMBRO (evita violação de chave estrangeira) ──
    const { error: escalasError } = await clientPrincipal
      .from("escalas")
      .delete()
      .eq("staff_id", userId);

    if (escalasError) {
      console.warn("Aviso ao deletar escalas do membro:", escalasError.message);
    }

    // ─── 4. DELETAR FOTO DO STORAGE ───────────────────────────────
    try {
      await clientPrincipal.storage
        .from("perfis")
        .remove([`fotos_perfil/${userId}-perfil.jpg`]);
    } catch (fotoErr) {
      console.warn("Aviso ao remover foto do storage:", fotoErr);
    }

    // ─── 5. DELETAR PERFIL DA TABELA PERFIS ───────────────────────
    const { error: perfilError } = await clientPrincipal
      .from("perfis")
      .delete()
      .eq("id", userId);

    if (perfilError) {
      console.error("Erro ao deletar perfil:", perfilError);
      return NextResponse.json(
        { error: "Erro ao excluir perfil do banco: " + perfilError.message },
        { status: 400 }
      );
    }

    // ─── 6. DELETAR DO SUPABASE AUTH (requer Service Role Key) ─────
    if (supabaseServiceKey) {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (authError) {
        // Se o usuário não existir no auth (já deletado ou órfão), não interrompe
        const msg = (authError.message || "").toLowerCase();
        if (!msg.includes("not found") && !msg.includes("user not found")) {
          console.error("Erro ao deletar usuário do Auth:", authError);
          // O perfil já foi apagado do banco com sucesso
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erro inesperado na rota deletar-usuario:", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
