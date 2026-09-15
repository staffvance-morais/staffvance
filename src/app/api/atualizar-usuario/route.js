import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Roles que têm permissão para atualizar usuários
const ROLES_PERMITIDOS = ["admin", "owner", "coordenador", "producao", "produção"];

export async function PUT(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
    return NextResponse.json(
      { error: "Configuração do Supabase ausente no servidor." },
      { status: 500 }
    );
  }

  // Cliente Admin (com Service Role Key se disponível, ou Anon Key)
  const supabaseAdmin = createClient(
    supabaseUrl,
    supabaseServiceKey || supabaseAnonKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // ─── 1. VERIFICAR AUTENTICAÇÃO E PERMISSÃO DO CHAMADOR ─────────
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

    // Cliente com o token do próprio usuário chamador para respeitar RLS ao ler seu próprio perfil
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let roleChamador = (chamador.user_metadata?.role || "").toLowerCase().trim();

    // Busca na tabela perfis com o cliente do usuário
    const { data: perfilChamador } = await supabaseUserClient
      .from("perfis")
      .select("role")
      .eq("id", chamador.id)
      .single();

    if (perfilChamador?.role) {
      roleChamador = perfilChamador.role.toLowerCase().trim();
    }

    if (!ROLES_PERMITIDOS.includes(roleChamador)) {
      return NextResponse.json(
        {
          error:
            "Acesso negado. Apenas administradores podem atualizar o perfil/cargo de funcionários.",
        },
        { status: 403 }
      );
    }

    // ─── 2. VALIDAR O PAYLOAD ──────────────────────────────────────
    const { userId, role, cargo, classificacao, anotacoes } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório." }, { status: 400 });
    }

    // Normaliza role e cargo se fornecidos
    let roleNormalizada = role;
    let cargoNormalizado = cargo;

    if (role !== undefined) {
      const rLower = String(role).toLowerCase().trim();
      if (rLower === "producao" || rLower === "produção") {
        roleNormalizada = "producao";
        if (cargo === undefined) cargoNormalizado = "Produção";
      } else if (rLower === "coordenador") {
        roleNormalizada = "coordenador";
        if (cargo === undefined) cargoNormalizado = "Coordenador";
      } else if (rLower === "staff") {
        roleNormalizada = "staff";
        if (cargo === undefined) cargoNormalizado = "Staff";
      }
    } else if (cargo !== undefined) {
      const cLower = String(cargo).toLowerCase().trim();
      if (cLower.includes("prod")) {
        roleNormalizada = "producao";
      } else if (cLower.includes("coord")) {
        roleNormalizada = "coordenador";
      }
    }

    // Monta o objeto com apenas os campos fornecidos
    const updateData = {};
    if (roleNormalizada !== undefined) updateData.role = roleNormalizada;
    if (cargoNormalizado !== undefined) updateData.cargo = cargoNormalizado;
    if (classificacao !== undefined) updateData.classificacao = classificacao;
    if (anotacoes !== undefined) updateData.anotacoes = anotacoes;

    // ─── 3. ATUALIZAR TABELA PERFIS VIA SUPABASE ADMIN ─────────────
    const { error: updateDbError } = await supabaseAdmin
      .from("perfis")
      .update(updateData)
      .eq("id", userId);

    if (updateDbError) {
      console.error("Erro ao atualizar tabela perfis:", updateDbError);
      return NextResponse.json(
        { error: "Erro ao atualizar dados no banco: " + updateDbError.message },
        { status: 400 }
      );
    }

    // ─── 4. Opcional: Atualizar user_metadata no Auth se role/cargo foram alterados
    if ((updateData.role !== undefined || updateData.cargo !== undefined) && supabaseServiceKey) {
      try {
        const metadataUpdate = {};
        if (updateData.role !== undefined) metadataUpdate.role = updateData.role;
        if (updateData.cargo !== undefined) metadataUpdate.cargo = updateData.cargo;
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: metadataUpdate,
        });
      } catch (authMetaErr) {
        console.warn("Não foi possível atualizar user_metadata no Auth:", authMetaErr);
      }
    }

    return NextResponse.json({ success: true, updated: updateData });
  } catch (err) {
    console.error("Erro inesperado na rota atualizar-usuario:", err);
    return NextResponse.json(
      { error: "Erro interno do servidor ao atualizar usuário." },
      { status: 500 }
    );
  }
}
