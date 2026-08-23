import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Nossa conexão centralizada!

// Força a rota a ser dinâmica (não usar cache no Netlify)
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Faz a consulta mais leve possível: pede só 1 ID da tabela perfis
    const { data, error } = await supabase
      .from('perfis')
      .select('id')
      .limit(1);

    if (error) throw error;

    // Se deu certo, responde que está tudo OK
    return NextResponse.json(
      { status: 'ok', mensagem: 'O despertador tocou! Supabase está ativo.' },
      { status: 200 }
    );
  } catch (erro) {
    return NextResponse.json(
      { status: 'erro', mensagem: 'Falha ao acordar o banco.' },
      { status: 500 }
    );
  }
}