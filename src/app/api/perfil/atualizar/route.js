import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PUT(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
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
    // 1. Verifica autenticação do chamador via Bearer token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Não autorizado. Token de sessão ausente." },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Sessão inválida ou expirada. Faça login novamente." },
        { status: 401 }
      );
    }

    const userId = user.id;

    // 2. Lê os campos pessoais permitidos (whitelist de segurança)
    const body = await request.json();
    const {
      nome_completo,
      email,
      cpf,
      chave_pix,
      whatsapp,
      data_nascimento,
      uniforme,
      curso,
      foto_base64,
    } = body;

    const updatePayload = {};

    // E-mail de acesso
    if (email !== undefined) {
      const emailLimpo = (email || "").trim().toLowerCase();
      if (!emailLimpo || !emailLimpo.includes("@")) {
        return NextResponse.json(
          { error: "Informe um endereço de e-mail válido." },
          { status: 400 }
        );
      }

      // Verifica se outro perfil já usa este e-mail
      const { data: emailEmUso } = await supabaseAdmin
        .from("perfis")
        .select("id")
        .eq("email", emailLimpo)
        .neq("id", userId)
        .maybeSingle();

      if (emailEmUso) {
        return NextResponse.json(
          { error: "Este e-mail já está sendo utilizado por outra conta." },
          { status: 400 }
        );
      }

      updatePayload.email = emailLimpo;

      // Sincroniza e-mail no Auth do Supabase se service role estiver disponível
      if (supabaseServiceKey) {
        try {
          const { error: authEmailErr } =
            await supabaseAdmin.auth.admin.updateUserById(userId, {
              email: emailLimpo,
              email_confirm: true,
            });
          if (authEmailErr) {
            console.warn(
              "Aviso ao atualizar e-mail no Auth:",
              authEmailErr.message
            );
          }
        } catch (authErr) {
          console.warn("Erro ao atualizar e-mail no Auth:", authErr);
        }
      }
    }

    // CPF
    if (cpf !== undefined) {
      const cpfLimpo = (cpf || "").trim();
      if (cpfLimpo) {
        // Verifica se outro perfil já usa este CPF
        const { data: cpfEmUso } = await supabaseAdmin
          .from("perfis")
          .select("id")
          .eq("cpf", cpfLimpo)
          .neq("id", userId)
          .maybeSingle();

        if (cpfEmUso) {
          return NextResponse.json(
            { error: "Este CPF já está cadastrado em outra conta." },
            { status: 400 }
          );
        }
      }
      updatePayload.cpf = cpfLimpo || null;
    }

    // Nome completo
    if (nome_completo !== undefined) {
      const nomeLimpo = (nome_completo || "").trim();
      if (!nomeLimpo) {
        return NextResponse.json(
          { error: "O nome completo não pode ficar em branco." },
          { status: 400 }
        );
      }
      updatePayload.nome_completo = nomeLimpo;
    }

    // Chave Pix (dado pessoal crucial para pagamentos)
    if (chave_pix !== undefined) {
      updatePayload.chave_pix = chave_pix ? chave_pix.trim() : null;
    }

    // WhatsApp / Telefone
    if (whatsapp !== undefined) {
      updatePayload.whatsapp = whatsapp ? whatsapp.trim() : null;
    }

    // Data de nascimento (validação e conversão para AAAA-MM-DD)
    if (data_nascimento !== undefined) {
      let dataBanco = null;
      if (data_nascimento && data_nascimento.includes("/")) {
        const partes = data_nascimento.split("/");
        if (partes.length === 3) {
          const dia = parseInt(partes[0], 10);
          const mes = parseInt(partes[1], 10);
          const ano = parseInt(partes[2], 10);
          const anoAtual = new Date().getFullYear();
          if (
            dia >= 1 &&
            dia <= 31 &&
            mes >= 1 &&
            mes <= 12 &&
            ano >= 1920 &&
            ano <= anoAtual
          ) {
            dataBanco = `${ano}-${String(mes).padStart(2, "0")}-${String(
              dia
            ).padStart(2, "0")}`;
          }
        }
      } else if (data_nascimento && data_nascimento.includes("-")) {
        dataBanco = data_nascimento.trim();
      }
      updatePayload.data_nascimento = dataBanco;
    }

    // Uniforme (tamanho de camisa)
    if (uniforme !== undefined) {
      updatePayload.uniforme = uniforme ? String(uniforme).trim().toLowerCase() : null;
    }

    // Curso de formação em segurança
    if (curso !== undefined) {
      updatePayload.curso = curso ? String(curso).trim() : null;
    }

    // 3. Upload de nova foto se fornecida em Base64
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

          // Adiciona timestamp para forçar atualização no navegador
          updatePayload.foto_url = `${pubUrlData.publicUrl}?t=${Date.now()}`;
        } else {
          console.warn("Aviso ao salvar foto no Storage:", uploadError.message);
        }
      } catch (fotoErr) {
        console.warn("Erro ao processar imagem base64:", fotoErr);
      }
    }

    // 4. Executa a atualização na tabela perfis apenas para o usuário autenticado
    const { data: perfilAtualizado, error: dbError } = await supabaseAdmin
      .from("perfis")
      .update(updatePayload)
      .eq("id", userId)
      .select()
      .single();

    if (dbError) {
      console.error("Erro ao atualizar perfil:", dbError);
      return NextResponse.json(
        { error: "Erro ao atualizar dados no banco: " + dbError.message },
        { status: 400 }
      );
    }

    // 5. Opcional: sincroniza user_metadata no Auth se houver service role key
    if (supabaseServiceKey) {
      try {
        const metadataUpdate = {};
        if (updatePayload.nome_completo) {
          metadataUpdate.nome_completo = updatePayload.nome_completo;
        }
        if (updatePayload.cpf) {
          metadataUpdate.cpf = updatePayload.cpf;
        }
        if (updatePayload.whatsapp) {
          metadataUpdate.whatsapp = updatePayload.whatsapp;
        }
        if (updatePayload.chave_pix) {
          metadataUpdate.chave_pix = updatePayload.chave_pix;
        }
        if (updatePayload.foto_url) {
          metadataUpdate.foto_url = updatePayload.foto_url;
        }

        if (Object.keys(metadataUpdate).length > 0) {
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: metadataUpdate,
          });
        }
      } catch (authMetaErr) {
        console.warn("Aviso ao sincronizar user_metadata:", authMetaErr);
      }
    }

    return NextResponse.json({
      success: true,
      perfil: perfilAtualizado,
    });
  } catch (error) {
    console.error("Erro inesperado em /api/perfil/atualizar:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao atualizar perfil." },
      { status: 500 }
    );
  }
}
