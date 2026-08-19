"use server";
import { transporter } from "@/lib/nodemailer";

// URL base do seu sistema
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// 1. TEMPLATE: AVISO DE ESCALAÇÃO
export async function enviarEmailEscalacao(destinatario, nomeStaff, dadosEvento, setor) {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #171717; color: #e5e5e5; border-radius: 8px; overflow: hidden; border: 1px solid #333;">
        <div style="background-color: #222; padding: 20px; border-bottom: 2px solid #2563eb; text-align: center;">
          <h2 style="color: #2563eb; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px;">Wadjet Segurança</h2>
        </div>
        <div style="padding: 30px 20px;">
          <h3 style="color: #ffffff; font-size: 20px; margin-top: 0;">Nova Escala de Operação</h3>
          <p style="font-size: 16px; line-height: 1.5; color: #cccccc;">Olá, <strong>${nomeStaff}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.5; color: #cccccc;">Você foi escalado(a) para uma nova operação. Confira os detalhes abaixo:</p>
          
          <div style="background-color: #1c1c1c; border: 1px solid #3a3a3a; border-radius: 6px; padding: 15px; margin: 25px 0; border-left: 4px solid #2563eb;">
            <p style="margin: 8px 0; font-size: 15px;"><strong>📌 Evento:</strong> <span style="color: #ffffff;">${dadosEvento.titulo}</span></p>
            <p style="margin: 8px 0; font-size: 15px;"><strong>🛡️ Setor:</strong> <span style="color: #ffffff;">${setor}</span></p>
            <p style="margin: 8px 0; font-size: 15px;"><strong>📍 Local:</strong> <span style="color: #ffffff;">${dadosEvento.endereco_texto || 'A definir'}</span></p>
          </div>

          <p style="font-size: 15px; color: #999999; margin-bottom: 25px;">Por favor, acesse o painel do staff para confirmar sua disponibilidade e ver mais instruções.</p>
          
          <div style="text-align: center;">
            <a href="${SITE_URL}/freelancers" style="background-color: #2563eb; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; display: inline-block;">Acessar Painel do Staff</a>
          </div>
        </div>
        <div style="background-color: #111; padding: 15px; text-align: center; border-top: 1px solid #333;">
          <p style="margin: 0; color: #666; font-size: 12px;">Esta é uma mensagem automática do sistema StaffVance.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Wadjet Segurança" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: `🛡️ Você foi escalado: ${dadosEvento.titulo}`,
      html: htmlContent,
    });
    return { success: true };
  } catch (error) {
    console.error("Erro E-mail Escala:", error);
    return { success: false, error: error.message };
  }
}

// 2. TEMPLATE: AVISO DE PAGAMENTO
export async function enviarEmailPagamento(destinatario, nomeStaff, dadosEvento, valorPago) {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #171717; color: #e5e5e5; border-radius: 8px; overflow: hidden; border: 1px solid #333;">
        <div style="background-color: #222; padding: 20px; border-bottom: 2px solid #22c55e; text-align: center;">
          <h2 style="color: #22c55e; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px;">Wadjet Financeiro</h2>
        </div>
        <div style="padding: 30px 20px;">
          <h3 style="color: #ffffff; font-size: 20px; margin-top: 0;">Confirmação de Pagamento</h3>
          <p style="font-size: 16px; line-height: 1.5; color: #cccccc;">Olá, <strong>${nomeStaff}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.5; color: #cccccc;">Informamos que o acerto financeiro referente à sua atuação na operação foi realizado com sucesso.</p>
          
          <div style="background-color: #1c1c1c; border: 1px solid #3a3a3a; border-radius: 6px; padding: 15px; margin: 25px 0; border-left: 4px solid #22c55e; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #999; text-transform: uppercase;">Referente ao evento</p>
            <p style="margin: 0 0 15px 0; font-size: 18px; color: #ffffff; font-weight: bold;">${dadosEvento.titulo}</p>
            <p style="margin: 0; font-size: 14px; color: #999; text-transform: uppercase;">Valor Transferido</p>
            <p style="margin: 5px 0 0 0; font-size: 28px; color: #22c55e; font-weight: bold;">R$ ${valorPago}</p>
          </div>

          <p style="font-size: 15px; color: #999999; text-align: center;">Agradecemos pelo seu excelente trabalho e dedicação na operação!</p>
        </div>
        <div style="background-color: #111; padding: 15px; text-align: center; border-top: 1px solid #333;">
          <p style="margin: 0; color: #666; font-size: 12px;">Dúvidas? Entre em contato com a administração da Wadjet.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Wadjet Segurança" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: `💰 Pagamento Confirmado: ${dadosEvento.titulo}`,
      html: htmlContent,
    });
    return { success: true };
  } catch (error) {
    console.error("Erro E-mail Pagamento:", error);
    return { success: false, error: error.message };
  }
}