import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: "Configuração do Supabase ausente no servidor." },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const body = await request.json();
    const { escalaId, tipo = "checkin", fotoBase64, latitude, longitude } = body;

    if (!escalaId) {
      return NextResponse.json({ error: "ID da escala é obrigatório." }, { status: 400 });
    }

    // 1. Localiza a escala
    const { data: escala, error: fetchError } = await supabase
      .from("escalas")
      .select("id, evento_id, staff_id")
      .eq("id", escalaId)
      .single();

    if (fetchError || !escala) {
      return NextResponse.json({ error: "Escala não encontrada." }, { status: 404 });
    }

    let fotoUrl = null;

    // 2. Se enviou foto em base64, sobe para o Supabase Storage
    if (fotoBase64) {
      try {
        const base64Data = fotoBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const fileName = `presencas/${escala.evento_id}/${escala.id}_${tipo}_${Date.now()}.jpg`;

        // Tenta bucket 'presencas' primeiro, fallback para 'eventos-fotos'
        let targetBucket = "presencas";
        let uploadRes = await supabase.storage
          .from(targetBucket)
          .upload(fileName, buffer, { contentType: "image/jpeg", upsert: true });

        if (uploadRes.error && uploadRes.error.message?.includes("Bucket not found")) {
          // Tenta criar o bucket se não existir
          await supabase.storage.createBucket("presencas", { public: true });
          uploadRes = await supabase.storage
            .from("presencas")
            .upload(fileName, buffer, { contentType: "image/jpeg", upsert: true });

          // Se ainda falhar, tenta o bucket eventos-fotos que já existe
          if (uploadRes.error) {
            targetBucket = "eventos-fotos";
            uploadRes = await supabase.storage
              .from(targetBucket)
              .upload(fileName, buffer, { contentType: "image/jpeg", upsert: true });
          }
        }

        if (!uploadRes.error) {
          const { data: pubData } = supabase.storage
            .from(targetBucket)
            .getPublicUrl(fileName);
          fotoUrl = pubData.publicUrl;
        } else {
          console.warn("Aviso upload de foto de presença:", uploadRes.error.message);
        }
      } catch (uploadErr) {
        console.error("Erro no processamento da imagem:", uploadErr);
      }
    }

    // 3. Monta o objeto de atualização
    const agora = new Date().toISOString();
    const updateData = {};

    if (tipo === "checkin") {
      updateData.status_presenca = "presente";
      updateData.checkin_em = agora;
      if (fotoUrl) updateData.checkin_foto_url = fotoUrl;
      if (latitude !== undefined && latitude !== null) updateData.checkin_lat = parseFloat(latitude);
      if (longitude !== undefined && longitude !== null) updateData.checkin_lng = parseFloat(longitude);
      updateData.checkin_manual = false;
    } else {
      updateData.checkout_em = agora;
      if (fotoUrl) updateData.checkout_foto_url = fotoUrl;
      if (latitude !== undefined && latitude !== null) updateData.checkout_lat = parseFloat(latitude);
      if (longitude !== undefined && longitude !== null) updateData.checkout_lng = parseFloat(longitude);
    }

    const { error: updateError } = await supabase
      .from("escalas")
      .update(updateData)
      .eq("id", escalaId);

    if (updateError) {
      console.error("Erro ao atualizar escala:", updateError);
      return NextResponse.json({ 
        error: "Erro ao salvar presença. Verifique se as colunas de presença foram criadas no banco.",
        details: updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tipo,
      horario: agora,
      fotoUrl,
      mensagem: tipo === "checkin" ? "Check-in confirmado com sucesso!" : "Check-out registrado com sucesso!"
    });

  } catch (err) {
    console.error("Erro geral na rota de presença:", err);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
