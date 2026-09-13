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

    const emailLimpo = (email || "").trim().toLowerCase();
    const cpfLimpo = (cpf || "").trim();
    const nomeLimpo = (nome_completo || "").trim();

    if (!emailLimpo || !password || !nomeLimpo || !cpfLimpo) {
      return NextResponse.json(
        { error: "E-mail, senha, nome completo e CPF são obrigatórios." },
        { status: 400 }
      );
    }

    // 1. Verifica se o CPF já está em uso por outro perfil
    const { data: cpfExistente } = await supabaseAdmin
      .from("perfis")
      .select("id, email")
      .eq("cpf", cpfLimpo)
      .maybeSingle();

    if (cpfExistente && cpfExistente.email?.toLowerCase() !== emailLimpo) {
      return NextResponse.json(
        { error: "Este CPF já está cadastrado em outra conta. Verifique os dados digitados." },
        { status: 400 }
      );
    }

    // 2. Converte e valida data de nascimento (DD/MM/AAAA -> AAAA-MM-DD)
    let dataBanco = null;
    if (data_nascimento && data_nascimento.includes("/")) {
      const partes = data_nascimento.split("/");
      if (partes.length === 3) {
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10);
        const ano = parseInt(partes[2], 10);
        const anoAtual = new Date().getFullYear();
        if (dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12 && ano >= 1930 && ano <= anoAtual - 14) {
          dataBanco = `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
        }
      }
    } else if (data_nascimento && data_nascimento.includes("-")) {
      dataBanco = data_nascimento;
    }

    // 3. Tenta criar o usuário no Supabase Auth com confirmação automática de e-mail
    let userId = null;
    let foiCriadoAgora = false;

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: emailLimpo,
        password,
        email_confirm: true,
        user_metadata: {
          nome_completo: nomeLimpo,
          cpf: cpfLimpo,
          role: "staff",
        },
      });

    if (authError) {
      const msg = (authError.message || "").toLowerCase();

      // AUTO-RECUPERAÇÃO: Se o e-mail já existe no Auth
      if (msg.includes("already registered") || msg.includes("already in use")) {
        // Verifica se existe perfil na tabela perfis
        const { data: perfilExistente } = await supabaseAdmin
          .from("perfis")
          .select("id")
          .eq("email", emailLimpo)
          .maybeSingle();

        if (perfilExistente) {
          // O perfil já existe de verdade: pede para fazer login
          return NextResponse.json(
            { error: "Este e-mail já possui cadastro. Faça login ou utilize a recuperação de senha." },
            { status: 400 }
          );
        }

        // Se NÃO tem perfil (conta órfã/presa no Auth), recupera o usuário e cria o perfil!
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        const userOrfao = listData?.users?.find(
          (u) => u.email?.toLowerCase() === emailLimpo
        );

        if (userOrfao) {
          // Atualiza a senha e os metadados do usuário existente
          await supabaseAdmin.auth.admin.updateUserById(userOrfao.id, {
            password,
            email_confirm: true,
            user_metadata: {
              nome_completo: nomeLimpo,
              cpf: cpfLimpo,
              role: "staff",
            },
          });
          userId = userOrfao.id;
        } else {
          return NextResponse.json(
            { error: "Este e-mail já está cadastrado no sistema. Tente fazer login." },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: authError.message || "Erro ao criar usuário no sistema." },
          { status: 400 }
        );
      }
    } else {
      userId = authData.user.id;
      foiCriadoAgora = true;
    }

    let finalFotoUrl = foto_url || null;

    // 4. Upload de foto via servidor usando Service Role Key se foto_base64 foi enviada
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

    // 5. Insere/Atualiza o perfil na tabela perfis (bypassing RLS)
    const { error: dbError } = await supabaseAdmin.from("perfis").upsert({
      id: userId,
      email: emailLimpo,
      nome_completo: nomeLimpo,
      cpf: cpfLimpo,
      data_nascimento: dataBanco || null,
      whatsapp: whatsapp ? whatsapp.trim() : null,
      chave_pix: chave_pix ? chave_pix.trim() : null,
      curso: curso || null,
      uniforme: uniforme || null,
      foto_url: finalFotoUrl,
      role: "staff",
      cargo: "staff",
    });

    // Se falhar ao salvar no banco e foi criado agora, remove do Auth para não deixar conta órfã
    if (dbError) {
      console.error("❌ ERRO NA TABELA PERFIS:", dbError.message);
      if (foiCriadoAgora) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      }
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