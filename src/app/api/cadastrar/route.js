import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
    return NextResponse.json(
      { error: "Configuração do Supabase ausente no servidor." },
      { status: 500 }
    );
  }

  // Cliente admin usando Service Role Key se configurada; caso contrário, cliente Anon
  const isServiceRole = Boolean(supabaseServiceKey);
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
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
      autorizo_imagem,
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

    // 1. Converte e valida data de nascimento (DD/MM/AAAA -> AAAA-MM-DD)
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

    let userId = null;
    let foiCriadoAgora = false;
    let sessionToken = null;

    if (isServiceRole) {
      // ─── FLUXO ADMINISTRATIVO (Service Role Key disponível) ───────

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

      // 2. Cria o usuário com e-mail confirmado automaticamente
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: emailLimpo,
          password,
          email_confirm: true,
          user_metadata: {
            nome_completo: nomeLimpo,
            cpf: cpfLimpo,
            role: "staff",
            autorizo_imagem: typeof autorizo_imagem === "boolean" ? autorizo_imagem : true,
          },
        });

      if (authError) {
        const msg = (authError.message || "").toLowerCase();

        // AUTO-RECUPERAÇÃO: Se o e-mail já existe no Auth
        if (msg.includes("already registered") || msg.includes("already in use")) {
          const { data: perfilExistente } = await supabaseAdmin
            .from("perfis")
            .select("id")
            .eq("email", emailLimpo)
            .maybeSingle();

          if (perfilExistente) {
            return NextResponse.json(
              { error: "Este e-mail já possui cadastro. Faça login ou utilize a recuperação de senha." },
              { status: 400 }
            );
          }

          // Se NÃO tem perfil (conta órfã presa no Auth), atualiza senha e recupera
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
          const userOrfao = listData?.users?.find(
            (u) => u.email?.toLowerCase() === emailLimpo
          );

          if (userOrfao) {
            await supabaseAdmin.auth.admin.updateUserById(userOrfao.id, {
              password,
              email_confirm: true,
              user_metadata: {
                nome_completo: nomeLimpo,
                cpf: cpfLimpo,
                role: "staff",
                autorizo_imagem: typeof autorizo_imagem === "boolean" ? autorizo_imagem : true,
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
    } else {
      // ─── FLUXO DE CONTINGÊNCIA (Fallback via Anon Key) ───────────
      const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
        email: emailLimpo,
        password,
        options: {
          data: {
            nome_completo: nomeLimpo,
            cpf: cpfLimpo,
            role: "staff",
            autorizo_imagem: typeof autorizo_imagem === "boolean" ? autorizo_imagem : true,
          },
        },
      });

      if (authError) {
        const msg = (authError.message || "").toLowerCase();
        if (msg.includes("already registered") || msg.includes("already in use")) {
          return NextResponse.json(
            { error: "Este e-mail já possui cadastro. Faça login ou utilize a recuperação de senha." },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: authError.message || "Erro ao realizar cadastro." },
          { status: 400 }
        );
      }

      if (!authData?.user?.id) {
        return NextResponse.json(
          { error: "Não foi possível criar o usuário. Tente novamente." },
          { status: 400 }
        );
      }

      userId = authData.user.id;
      sessionToken = authData.session?.access_token || null;
      foiCriadoAgora = true;
    }

    // Cliente ativo para gravação (se temos token da sessão no fallback, usamos o cliente autenticado)
    const activeClient = sessionToken
      ? createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: `Bearer ${sessionToken}` } },
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : supabaseAdmin;

    let finalFotoUrl = foto_url || null;

    // 4. Upload de foto se foto_base64 foi enviada
    if (foto_base64) {
      try {
        const base64Data = foto_base64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const fileName = `${userId}-perfil.jpg`;
        const filePath = `fotos_perfil/${fileName}`;

        const { error: uploadError } = await activeClient.storage
          .from("perfis")
          .upload(filePath, buffer, { contentType: "image/jpeg", upsert: true });

        if (!uploadError) {
          const { data: pubUrlData } = activeClient.storage
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

    // 5. Insere/Atualiza o perfil na tabela perfis
    const { error: dbError } = await activeClient.from("perfis").upsert({
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

    if (dbError) {
      console.error("❌ ERRO NA TABELA PERFIS:", dbError.message);
      if (foiCriadoAgora && isServiceRole) {
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