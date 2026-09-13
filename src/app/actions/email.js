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
// 3. TEMPLATE: RELATORIO DE UNIFORMES DA ESCALA
export async function enviarEmailResumoCamisas(destinatarios, dadosEvento, contagem, listaStaff) {
  try {
    const ordemPadrao = ["PP", "P", "M", "G", "GG", "XGG", "XGGG"];
    const outrosTamanhos = Object.keys(contagem).filter(t => !ordemPadrao.includes(t));
    const ordemTamanhos = [...ordemPadrao, ...outrosTamanhos];

    const totalComTamanho = Object.values(contagem).reduce((a, b) => a + b, 0);
    const totalSemTamanho = listaStaff.filter(s => !s.uniforme || s.uniforme.trim() === "").length;
    const totalGeral = listaStaff.length;

    const linhasTamanhos = ordemTamanhos
      .filter(tam => contagem[tam] > 0)
      .map((tam, idx) => {
        const quantidade = contagem[tam];
        const bg = idx % 2 === 0 ? "#1e1e1e" : "#242424";
        const barraWidth = Math.round((quantidade / totalGeral) * 100);
        return `<tr>
          <td style="padding:14px 20px;background-color:${bg};border-bottom:1px solid #2a2a2a;">
            <span style="display:inline-block;background-color:#1d3a6e;color:#60a5fa;font-weight:900;font-size:15px;letter-spacing:2px;padding:4px 14px;border-radius:3px;border:1px solid #2563eb;min-width:48px;text-align:center;">${tam}</span>
          </td>
          <td style="padding:14px 20px;background-color:${bg};border-bottom:1px solid #2a2a2a;">
            <table cellpadding="0" cellspacing="0" style="width:100%;"><tr>
              <td style="width:120px;"><div style="background-color:#333;border-radius:2px;height:6px;"><div style="width:${barraWidth}%;background-color:#2563eb;height:6px;border-radius:2px;"></div></div></td>
              <td style="padding-left:10px;color:#ffffff;font-size:18px;font-weight:900;white-space:nowrap;">${quantidade} <span style="color:#666;font-size:13px;font-weight:400;">${quantidade === 1 ? "camisa" : "camisas"}</span></td>
            </tr></table>
          </td>
        </tr>`;
      }).join("");

    const semTamanhoHtml = totalSemTamanho > 0
      ? `<div style="margin-top:24px;background-color:#1c1c1c;border:1px solid #3a3a3a;border-left:4px solid #f59e0b;border-radius:6px;padding:16px 20px;">
          <p style="margin:0 0 10px 0;color:#f59e0b;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">&#9888; ${totalSemTamanho} staff${totalSemTamanho > 1 ? "s" : ""} sem tamanho cadastrado</p>
          ${listaStaff.filter(s => !s.uniforme || s.uniforme.trim() === "").map(s => `<p style="margin:4px 0;color:#999;font-size:14px;">&#8226; ${s.nome}</p>`).join("")}
          <p style="margin:12px 0 0 0;color:#666;font-size:12px;">Acesse o perfil de cada membro para cadastrar o tamanho do uniforme.</p>
        </div>`
      : `<div style="margin-top:24px;background-color:#1c1c1c;border:1px solid #3a3a3a;border-left:4px solid #22c55e;border-radius:6px;padding:12px 20px;">
          <p style="margin:0;color:#22c55e;font-size:14px;font-weight:bold;">&#10003; Todos os staff possuem tamanho de uniforme cadastrado.</p>
        </div>`;

    const linhasStaff = listaStaff.map((s, idx) => {
      const bg = idx % 2 === 0 ? "#1e1e1e" : "#242424";
      const uniforme = s.uniforme ? s.uniforme.toUpperCase() : null;
      return `<tr>
        <td style="padding:10px 16px;background-color:${bg};border-bottom:1px solid #2a2a2a;color:#e5e5e5;font-size:13px;">${s.nome}</td>
        <td style="padding:10px 16px;background-color:${bg};border-bottom:1px solid #2a2a2a;color:#999;font-size:12px;">${s.setor || "&#8212;"}</td>
        <td style="padding:10px 16px;background-color:${bg};border-bottom:1px solid #2a2a2a;text-align:center;">
          ${uniforme
            ? `<span style="background-color:#1d3a6e;color:#60a5fa;font-weight:900;font-size:12px;letter-spacing:1px;padding:3px 10px;border-radius:3px;border:1px solid #2563eb;">${uniforme}</span>`
            : `<span style="color:#f59e0b;font-size:11px;font-weight:bold;">&#9888; Nao cadastrado</span>`}
        </td>
      </tr>`;
    }).join("");

    const dataGerada = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

    const htmlContent = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/></head><body style="margin:0;padding:0;background-color:#0f0f0f;">
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:620px;margin:30px auto;background-color:#171717;border-radius:10px;overflow:hidden;border:1px solid #2a2a2a;box-shadow:0 8px 32px rgba(0,0,0,0.5);">
        <div style="background-color:#0d1f3c;padding:32px 28px;border-bottom:3px solid #2563eb;text-align:center;">
          <div style="display:inline-block;background-color:rgba(37,99,235,0.15);border:1px solid rgba(37,99,235,0.4);border-radius:6px;padding:6px 18px;margin-bottom:14px;">
            <span style="color:#60a5fa;font-size:11px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;">Relatorio Operacional</span>
          </div>
          <h1 style="margin:0 0 6px 0;color:#ffffff;font-size:26px;font-weight:900;letter-spacing:1px;">WADJET SEGURANCA</h1>
          <p style="margin:0;color:#60a5fa;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Sistema de Gestao de Uniformes</p>
        </div>
        <div style="padding:28px 28px 0 28px;">
          <h2 style="margin:0 0 6px 0;color:#ffffff;font-size:20px;font-weight:800;">Relatorio de Uniformes</h2>
          <p style="margin:0;color:#999;font-size:14px;">Escala concluida &mdash; relatorio gerado automaticamente pelo StaffVance.</p>
        </div>
        <div style="margin:20px 28px 0 28px;background-color:#1c1c1c;border:1px solid #333;border-radius:8px;padding:18px 20px;">
          <p style="margin:0 0 4px 0;color:#666;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Operacao</p>
          <p style="margin:0 0 14px 0;color:#ffffff;font-size:20px;font-weight:900;">${dadosEvento.titulo || "Evento"}</p>
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:30px;">
              <p style="margin:0 0 2px 0;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Local</p>
              <p style="margin:0;color:#ccc;font-size:14px;">${dadosEvento.endereco_texto || "A definir"}</p>
            </td>
            <td>
              <p style="margin:0 0 2px 0;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Total Escalado</p>
              <p style="margin:0;color:#ccc;font-size:14px;"><strong style="color:#ffffff;font-size:18px;">${totalGeral}</strong> membros</p>
            </td>
          </tr></table>
        </div>
        <div style="margin:16px 28px 0 28px;background-color:#162b4a;border:1px solid #2563eb;border-radius:8px;padding:20px;text-align:center;">
          <p style="margin:0 0 4px 0;color:#60a5fa;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Total de Camisas Necessarias</p>
          <p style="margin:0;color:#ffffff;font-size:52px;font-weight:900;line-height:1;">${totalComTamanho}</p>
          <p style="margin:4px 0 0 0;color:#60a5fa;font-size:13px;">${totalComTamanho === 1 ? "uniforme" : "uniformes"} com tamanho definido</p>
        </div>
        <div style="margin:24px 28px 0 28px;">
          <p style="margin:0 0 12px 0;color:#777;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Detalhamento por Tamanho</p>
          <table style="width:100%;border-collapse:collapse;border:1px solid #2a2a2a;">
            <thead><tr style="background-color:#111;">
              <th style="padding:12px 20px;text-align:left;color:#555;font-size:11px;letter-spacing:2px;text-transform:uppercase;border-bottom:1px solid #2a2a2a;">Tamanho</th>
              <th style="padding:12px 20px;text-align:left;color:#555;font-size:11px;letter-spacing:2px;text-transform:uppercase;border-bottom:1px solid #2a2a2a;">Quantidade</th>
            </tr></thead>
            <tbody>${linhasTamanhos || "<tr><td colspan='2' style='padding:20px;text-align:center;color:#555;'>Nenhum tamanho cadastrado.</td></tr>"}</tbody>
          </table>
        </div>
        <div style="margin:0 28px;">${semTamanhoHtml}</div>
        <div style="margin:24px 28px 0 28px;">
          <p style="margin:0 0 12px 0;color:#777;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Lista Completa dos Escalados</p>
          <table style="width:100%;border-collapse:collapse;border:1px solid #2a2a2a;">
            <thead><tr style="background-color:#111;">
              <th style="padding:10px 16px;text-align:left;color:#555;font-size:11px;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid #2a2a2a;">Nome</th>
              <th style="padding:10px 16px;text-align:left;color:#555;font-size:11px;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid #2a2a2a;">Setor</th>
              <th style="padding:10px 16px;text-align:center;color:#555;font-size:11px;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid #2a2a2a;">Uniforme</th>
            </tr></thead>
            <tbody>${linhasStaff}</tbody>
          </table>
        </div>
        <div style="margin:28px 0 0 0;background-color:#111;border-top:1px solid #222;padding:22px 28px;text-align:center;">
          <p style="margin:0 0 6px 0;color:#2563eb;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">WADJET SEGURANCA LTDA</p>
          <p style="margin:0 0 4px 0;color:#555;font-size:12px;">CNPJ 54.011.901/0001-08 &middot; Fortaleza, CE</p>
          <p style="margin:0;color:#444;font-size:11px;">Relatorio gerado automaticamente pelo StaffVance &middot; ${dataGerada}</p>
        </div>
      </div>
    </body></html>`;

    await transporter.sendMail({
      from: `"Wadjet StaffVance" <${process.env.EMAIL_USER}>`,
      to: destinatarios.join(", "),
      subject: `Relatorio de Uniformes - ${dadosEvento.titulo || "Operacao"}`,
      html: htmlContent,
    });

    return { success: true };
  } catch (error) {
    console.error("Erro E-mail Resumo Camisas:", error);
    return { success: false, error: error.message };
  }
}