import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: "Configuração do Supabase ausente no servidor (SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const body = await request.json();
    const {
      email,
      password,
      nome_completo,
      cpf,
      data_nascimento,
      whatsapp,
      chave_pix,
      curso,
      uniforme,
      foto_url,
      foto_base64,
    } = body;

    if (!email || !password || !nome_completo || !cpf) {
      return NextResponse.json(
        { error: "E-mail, senha, nome completo e CPF são obrigatórios." },
        { status: 400 }
      );
    }

    // Converta data de DD/MM/AAAA para AAAA-MM-DD se necessário
    let dataBanco = data_nascimento;
    if (dataBanco && dataBanco.includes("/")) {
      const partes = dataBanco.split("/");
      if (partes.length === 3) {
        dataBanco = `${partes[2]}-${partes[1]}-${partes[0]}`;
      }
    }

    // 1. Tenta criar o usuário no Supabase Auth com confirmação automática de e-mail
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email.trim(),
        password,
        email_confirm: true,
        user_metadata: {
          nome_completo: nome_completo.trim(),
          cpf: cpf.trim(),
          role: "staff",
        },
      });

    if (authError) {
      let msg = authError.message || "Erro ao criar usuário no sistema de autenticação.";
      if (
        msg.toLowerCase().includes("already registered") ||
        msg.toLowerCase().includes("already in use")
      ) {
        msg = "Este e-mail já está cadastrado no sistema.";
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const userId = authData.user.id;
    let finalFotoUrl = foto_url || null;

    // Upload de foto via servidor usando Service Role Key se foto_base64 foi enviada
    if (foto_base64) {
      try {
        const base64Data = foto_base64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const fileName = `${userId}-perfil.jpg`;
        const filePath = `fotos_perfil/${fileName}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("perfis")
          .upload(filePath, buffer, { contentType: "image/jpeg", upsert: true });

        if (!uploadError) {
          const { data: pubUrlData } = supabaseAdmin.storage
            .from("perfis")
            .getPublicUrl(filePath);
          finalFotoUrl = pubUrlData.publicUrl;
        } else {
          console.warn("Aviso ao salvar foto no Storage:", uploadError.message);
        }
      } catch (fotoErr) {
        console.warn("Erro ao processar imagem base64:", fotoErr);
      }
    }

    // 2. Insere/Atualiza o perfil na tabela perfis (bypassing RLS)
    const { error: dbError } = await supabaseAdmin.from("perfis").upsert({
      id: userId,
      email: email.trim(),
      nome_completo: nome_completo.trim(),
      cpf: cpf.trim(),
      data_nascimento: dataBanco || null,
      whatsapp: whatsapp ? whatsapp.trim() : null,
      chave_pix: chave_pix ? chave_pix.trim() : null,
      curso: curso || null,
      uniforme: uniforme || null,
      foto_url: finalFotoUrl,
      role: "staff",
      cargo: "staff",
    });

    // Se falhar ao salvar no banco, remove do Auth para NUNCA deixar o e-mail preso em auth.users
    if (dbError) {
      console.error("❌ ERRO NA TABELA PERFIS:", dbError.message);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: "Erro ao salvar perfil no banco de dados: " + dbError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, userId });
  } catch (error) {
    console.error("❌ ERRO CRÍTICO NO CADASTRO:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao realizar cadastro." },
      { status: 500 }
    );
  }
}