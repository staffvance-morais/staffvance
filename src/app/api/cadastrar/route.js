import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const body = await request.json();
    console.log("🔍 DADOS RECEBIDOS DO FRONT-END:", body);

    // 1. Tenta criar o usuário no Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        nome_completo: body.nome_completo,
        cargo: body.cargo,
        cpf: body.cpf
      }
    });

    if (authError) {
      console.log("❌ ERRO COMPLETO DO AUTH (BRUTO):", authError);
      let motivoReal = authError.message;
      if (typeof authError.message === 'object' || !authError.message) {
          motivoReal = JSON.stringify(authError);
      }
      return NextResponse.json({ error: motivoReal }, { status: 400 });
    }

    // 2. Atualizando a linha que o Gatilho do Supabase criou automaticamente (upsert)
    const { error: dbError } = await supabaseAdmin.from('perfis').upsert({
      id: authData.user.id,
      nome_completo: body.nome_completo,
      cpf: body.cpf,
      data_nascimento: body.data_nascimento,
      whatsapp: body.whatsapp,
      cargo: body.cargo,
      emblema: body.emblema,
      observacoes: body.observacoes,
      foto_url: body.foto_url,
      role: 'staff'
    });

    if (dbError) {
      console.log("❌ ERRO NA TABELA PERFIS:", dbError.message);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.log("❌ ERRO CRÍTICO NO SERVIDOR:", error);
    return NextResponse.json({ error: "Erro interno catastrófico" }, { status: 500 });
  }
}