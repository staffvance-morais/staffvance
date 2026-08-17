import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { evento, equipe } = await request.json();

    // =================================================================
    // AQUI ENTRA A INTEGRAÇÃO REAL NO FUTURO (Exemplo com Resend)
    // =================================================================
    /*
    import { Resend } from 'resend';
    const resend = new Resend(process.env.RESEND_API_KEY);

    for (const membro of equipe) {
      if (membro.email) {
        await resend.emails.send({
          from: 'Wadjet Escalas <escala@wadjet.com.br>',
          to: membro.email,
          subject: `Você foi escalado: ${evento.titulo}`,
          html: `
            <h2>Olá, ${membro.nome}!</h2>
            <p>Você foi escalado para a operação <strong>${evento.titulo}</strong>.</p>
            <p><strong>Setor de Atuação:</strong> ${membro.setor}</p>
            <p>Acesse o aplicativo para confirmar sua presença.</p>
          `
        });
      }
    }
    */

    // Simulação no terminal do seu VS Code para você ver funcionando:
    console.log("==========================================");
    console.log(`[SISTEMA WADJET] Disparando e-mails para ${equipe.length} membros...`);
    equipe.forEach(m => {
      console.log(`-> E-mail enviado para: ${m.nome} | Setor: ${m.setor}`);
    });
    console.log("==========================================");

    return NextResponse.json({ success: true, message: "Notificações enviadas com sucesso!" });

  } catch (error) {
    console.error("Erro na API de e-mail:", error);
    return NextResponse.json({ success: false, error: "Falha ao enviar notificações" }, { status: 500 });
  }
}