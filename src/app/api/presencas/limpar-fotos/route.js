import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return handleCleanup();
}

export async function POST() {
  return handleCleanup();
}

async function handleCleanup() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // 24 horas atrás
    const limite24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // 1. Busca escalas com fotos antigas
    const { data: escalasAntigas, error: fetchErr } = await supabase
      .from("escalas")
      .select("id, checkin_foto_url, checkout_foto_url, checkin_em, checkout_em")
      .or(`checkin_foto_url.neq.null,checkout_foto_url.neq.null`);

    if (fetchErr) {
      // Se a coluna ainda não existe, retorna silenciosamente
      return NextResponse.json({ message: "Nenhuma escala com foto encontrada ou colunas ainda não migradas.", details: fetchErr.message });
    }

    if (!escalasAntigas || escalasAntigas.length === 0) {
      return NextResponse.json({ message: "Nenhuma foto de presença encontrada para limpeza.", count: 0 });
    }

    const arquivosParaDeletar = [];
    const idsParaAtualizar = [];

    const extrairCaminhoStorage = (url) => {
      if (!url) return null;
      try {
        // As URLs costumam ser: .../storage/v1/object/public/[bucket]/[caminho]
        const match = url.match(/\/public\/(?:presencas|eventos-fotos)\/(.+)$/);
        if (match && match[1]) return decodeURIComponent(match[1]);
        // Fallback para caso comece com presencas/
        if (url.includes("presencas/")) {
          const idx = url.indexOf("presencas/");
          return decodeURIComponent(url.substring(idx));
        }
      } catch (e) {
        console.error("Erro ao extrair caminho da foto:", e);
      }
      return null;
    };

    for (const item of escalasAntigas) {
      let precisaLimpar = false;

      // Verifica checkin
      if (item.checkin_foto_url && item.checkin_em && new Date(item.checkin_em) < new Date(limite24h)) {
        const caminho = extrairCaminhoStorage(item.checkin_foto_url);
        if (caminho) arquivosParaDeletar.push(caminho);
        precisaLimpar = true;
      }

      // Verifica checkout
      if (item.checkout_foto_url && item.checkout_em && new Date(item.checkout_em) < new Date(limite24h)) {
        const caminho = extrairCaminhoStorage(item.checkout_foto_url);
        if (caminho) arquivosParaDeletar.push(caminho);
        precisaLimpar = true;
      }

      if (precisaLimpar) {
        idsParaAtualizar.push(item.id);
      }
    }

    // 2. Remove os arquivos do Storage
    if (arquivosParaDeletar.length > 0) {
      await Promise.allSettled([
        supabase.storage.from("presencas").remove(arquivosParaDeletar),
        supabase.storage.from("eventos-fotos").remove(arquivosParaDeletar),
      ]);
    }

    // 3. Atualiza as escalas para remover as URLs (mantendo os horários e presenças intactos)
    for (const id of idsParaAtualizar) {
      await supabase
        .from("escalas")
        .update({
          checkin_foto_url: null,
          checkout_foto_url: null,
        })
        .eq("id", id);
    }

    return NextResponse.json({
      success: true,
      message: `${arquivosParaDeletar.length} foto(s) de presença deletada(s) após 24h. Dados históricos de presença e horários preservados.`,
      fotosRemovidas: arquivosParaDeletar.length,
      escalasAtualizadas: idsParaAtualizar.length,
    });
  } catch (err) {
    console.error("Erro na rota de limpeza de fotos de presença:", err);
    return NextResponse.json({ error: "Erro ao executar rotina de limpeza." }, { status: 500 });
  }
}
