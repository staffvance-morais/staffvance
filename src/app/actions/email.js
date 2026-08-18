"use server";
import { transporter } from "@/lib/nodemailer";

// 1. E-mail enviado quando o staff é escalado para um evento
export async function enviarEmailEscalacao(destinatario, nomeStaff, dadosEvento, setor) {
  try {
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #333; background: #1c1c1c; color: #fff; padding: 20px; border-radius: 8px;">
        <h2 style="color: #2563eb; text-transform: uppercase;">Wadjet Segurança</h2>
        <h3 style="color: #e5e5e5;">Você foi escalado para uma operação!</h3>
        <p>Olá, <strong>${nomeStaff}</strong>,</p>
        <p>Você foi escalado para atuar no evento:</p>
        <div style="background: #252525; padding: 15px; border-radius: 5px; border-left: 4px solid #2563eb; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Evento:</strong> ${dadosEvento.titulo}</p>
            <p style="margin: 5px 0;"><strong>Setor:</strong> ${setor}</p>
            <p style="margin: 5px 0;"><strong>Local:</strong> ${dadosEvento.endereco_texto || 'A definir'}</p>
        </div>
        <p>Fique atento aos horários e prepare-se para a operação.</p>
        <br />
        <p style="color: #888; font-size: 12px;">E-mail automático gerado pelo sistema StaffVance.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Wadjet Segurança" <staffvance.morais@gmail.com>`,
      to: destinatario,
      subject: `Escala Confirmada: ${dadosEvento.titulo} (${setor})`,
      html: htmlContent,
    });
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao enviar e-mail de escala:", error);
    return { success: false, error: error.message };
  }
}

// 2. E-mail enviado quando o pagamento do staff é concluído no financeiro
export async function enviarEmailPagamento(destinatario, nomeStaff, dadosEvento, valorPago) {
  try {
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #333; background: #1c1c1c; color: #fff; padding: 20px; border-radius: 8px;">
        <h2 style="color: #16a34a; text-transform: uppercase;">Wadjet Segurança</h2>
        <h3 style="color: #e5e5e5;">Comprovante de Acerto Financeiro</h3>
        <p>Olá, <strong>${nomeStaff}</strong>,</p>
        <p>O seu pagamento referente à operação abaixo foi processado e concluído com sucesso:</p>
        <div style="background: #252525; padding: 15px; border-radius: 5px; border-left: 4px solid #16a34a; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Evento:</strong> ${dadosEvento.titulo}</p>
            <p style="margin: 5px 0; font-size: 18px; color: #22c55e;"><strong>Valor Pago:</strong> R$ ${valorPago}</p>
        </div>
        <p>Agradecemos pelo excelente trabalho na operação!</p>
        <br />
        <p style="color: #888; font-size: 12px;">E-mail automático gerado pelo sistema StaffVance.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Wadjet Segurança" <staffvance.morais@gmail.com>`,
      to: destinatario,
      subject: `Pagamento Realizado: ${dadosEvento.titulo}`,
      html: htmlContent,
    });
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao enviar e-mail de pagamento:", error);
    return { success: false, error: error.message };
  }
}