"use server";
import { transporter } from "@/lib/nodemailer";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const RESEND_FROM_ESCALA = "Equipe StaffVance <escala@wadjet.seg.br>";
const RESEND_FROM_RELATORIO = "Equipe StaffVance <relatorios@wadjet.seg.br>";
const RESEND_FROM_FINANCEIRO = "Equipe StaffVance <financeiro@wadjet.seg.br>";

/**
 * Dispara e-mail priorizando o domínio oficial verificado (@wadjet.seg.br via Resend / Amazon SES com DKIM e SPF)
 * para garantir entrega direta na Caixa de Entrada Principal (Inbox), com fallback automático para Nodemailer.
 */
async function dispararEmailSeguro({ fromResend, to, subject, text, html }) {
  const destinatariosArray = (Array.isArray(to) ? to : [to])
    .map((e) => (typeof e === "string" ? e.trim().toLowerCase() : ""))
    .filter((e) => e && e.includes("@"));

  if (destinatariosArray.length === 0) {
    throw new Error("Nenhum destinatário válido informado.");
  }

  const replyTo = (process.env.EMAIL_USER || "staffvance.morais@gmail.com").trim();
  const refId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // 1. Prioriza envio autenticado pelo domínio oficial verificado wadjet.seg.br (Resend / Amazon SES)
  if (process.env.RESEND_API_KEY) {
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromResend || RESEND_FROM_ESCALA,
            to: destinatariosArray,
            reply_to: replyTo,
            subject,
            text,
            html,
            headers: {
              "X-Entity-Ref-ID": refId,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return { success: true, provider: "resend", id: data?.id };
        }

        // Se atingiu rate-limit de requisições por segundo da Resend, aguarda e tenta novamente
        if (response.status === 429 && tentativa < 3) {
          await new Promise((r) => setTimeout(r, 650 * tentativa));
          continue;
        }

        const errData = await response.json().catch(() => ({}));
        console.warn("[WADJET] Aviso Resend, acionando fallback SMTP:", errData?.message || response.status);
        break;
      } catch (err) {
        console.warn("[WADJET] Erro de rede Resend, acionando fallback SMTP:", err.message);
        break;
      }
    }
  }

  // 2. Fallback via Gmail SMTP (Nodemailer)
  await transporter.sendMail({
    from: `"Equipe StaffVance" <${replyTo}>`,
    to: destinatariosArray.join(", "),
    replyTo,
    subject,
    text,
    html,
  });

  return { success: true, provider: "smtp" };
}

/**
 * Resolve o e-mail do membro no servidor caso não esteja preenchido na tabela perfis,
 * buscando diretamente no Supabase Auth (auth.users) e sincronizando na tabela perfis.
 */
async function resolverEmailDestinatario(destinatario, staffId) {
  const emailInicial = typeof destinatario === "string" ? destinatario.trim().toLowerCase() : "";
  if (emailInicial && emailInicial.includes("@")) {
    return emailInicial;
  }

  if (!staffId) return "";

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return "";

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: perfil } = await supabaseAdmin
      .from("perfis")
      .select("email")
      .eq("id", staffId)
      .maybeSingle();

    if (perfil?.email && perfil.email.includes("@")) {
      return perfil.email.trim().toLowerCase();
    }

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(staffId);
      const authEmail = userData?.user?.email?.trim().toLowerCase();
      if (authEmail && authEmail.includes("@")) {
        await supabaseAdmin.from("perfis").update({ email: authEmail }).eq("id", staffId);
        return authEmail;
      }
    }
  } catch (err) {
    console.warn("Aviso ao resolver e-mail do staff:", err.message);
  }

  return "";
}

// 1. TEMPLATE: AVISO DE ESCALAÇÃO (Domínio verificado @wadjet.seg.br + estrutura tabular limpa sem links externos)
export async function enviarEmailEscalacao(destinatario, nomeStaff, dadosEvento, setor, staffId = null) {
  try {
    const emailFinal = await resolverEmailDestinatario(destinatario, staffId);
    if (!emailFinal) {
      return { success: false, error: "E-mail do colaborador não encontrado." };
    }

    const nomeExibicao = (nomeStaff || "Colaborador").trim();
    const tituloEvento = (dadosEvento?.titulo || "Operacao Wadjet").trim();
    const localEvento = (dadosEvento?.endereco_texto || "A definir").trim();
    const setorDesignado = (setor || "Geral").trim();
    const dataGerada = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const textContent = [
      `CONFIRMACAO DE SETOR — ${tituloEvento}`,
      `Local: ${localEvento}`,
      "",
      `Colaborador(a): ${nomeExibicao}`,
      `Setor designado: ${setorDesignado}`,
      "",
      `Detalhamento da Alocacao:`,
      `- Nome: ${nomeExibicao}`,
      `- Evento: ${tituloEvento}`,
      `- Setor: ${setorDesignado}`,
      `- Local: ${localEvento}`,
      "",
      `Comunicado gerado pelo sistema StaffVance em ${dataGerada}.`,
    ].join("\n");

    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:20px 12px;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <div style="max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;padding:28px;">
    <p style="margin:0 0 4px 0;color:#6b7280;font-size:12px;font-weight:600;">StaffVance &middot; Coordenação Operacional</p>
    <h2 style="margin:0 0 18px 0;color:#111827;font-size:20px;font-weight:700;border-bottom:1px solid #e5e7eb;padding-bottom:12px;">
      Confirmação de Setor — ${tituloEvento}
    </h2>

    <div style="background-color:#f9fafb;border:1px solid #d1d5db;border-radius:6px;padding:16px 18px;margin-bottom:20px;">
      <p style="margin:0 0 6px 0;font-size:14px;color:#374151;"><strong style="color:#111827;">Colaborador(a):</strong> ${nomeExibicao}</p>
      <p style="margin:0 0 6px 0;font-size:14px;color:#374151;"><strong style="color:#111827;">Operação:</strong> ${tituloEvento}</p>
      <p style="margin:0;font-size:14px;color:#374151;"><strong style="color:#111827;">Local:</strong> ${localEvento}</p>
    </div>

    <h3 style="margin:20px 0 10px 0;color:#111827;font-size:15px;font-weight:700;">Dados da Alocação</h3>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;">
      <thead>
        <tr style="background-color:#f1f5f9;">
          <th style="padding:10px 14px;text-align:left;color:#475569;font-size:12px;border-bottom:1px solid #e2e8f0;">Colaborador</th>
          <th style="padding:10px 14px;text-align:left;color:#475569;font-size:12px;border-bottom:1px solid #e2e8f0;">Setor Designado</th>
          <th style="padding:10px 14px;text-align:left;color:#475569;font-size:12px;border-bottom:1px solid #e2e8f0;">Local</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:10px 14px;background-color:#ffffff;border-bottom:1px solid #e2e8f0;color:#1e293b;font-size:13px;font-weight:600;">${nomeExibicao}</td>
          <td style="padding:10px 14px;background-color:#ffffff;border-bottom:1px solid #e2e8f0;color:#1d4ed8;font-size:13px;font-weight:700;">${setorDesignado}</td>
          <td style="padding:10px 14px;background-color:#ffffff;border-bottom:1px solid #e2e8f0;color:#475569;font-size:13px;">${localEvento}</td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:14px;font-size:12px;color:#9ca3af;">
      Comunicado gerado pelo sistema StaffVance em ${dataGerada}. Em caso de dúvidas, responda a este e-mail.
    </div>
  </div>
</body>
</html>`;

    await dispararEmailSeguro({
      fromResend: RESEND_FROM_ESCALA,
      to: [emailFinal],
      subject: `Confirmacao de setor: ${tituloEvento}`,
      text: textContent,
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
    const emailFinal = (destinatario || "").trim().toLowerCase();
    const nomeExibicao = (nomeStaff || "Colaborador").trim();
    const tituloEvento = (dadosEvento?.titulo || "Operação Wadjet").trim();

    const textContent = [
      `Olá, ${nomeExibicao},`,
      "",
      `Informamos que o pagamento referente à sua atuação na operação "${tituloEvento}" foi realizado com sucesso.`,
      "",
      `Evento: ${tituloEvento}`,
      `Valor transferido: R$ ${valorPago}`,
      "",
      "Agradecemos pelo seu trabalho e dedicação na operação.",
      "",
      "Atenciosamente,",
      "Financeiro — Wadjet Segurança",
    ].join("\n");

    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmação de Pagamento - ${tituloEvento}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
    <tr>
      <td style="background-color: #14532d; padding: 20px 28px; border-bottom: 3px solid #16a34a;">
        <p style="margin: 0; color: #bbf7d0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Comunicado Financeiro</p>
        <h1 style="margin: 4px 0 0 0; color: #ffffff; font-size: 20px; font-weight: 700;">Wadjet Segurança</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 28px;">
        <p style="margin: 0 0 14px 0; font-size: 16px; line-height: 1.5; color: #0f172a;">Olá, <strong>${nomeExibicao}</strong>,</p>
        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #334155;">
          Informamos que o acerto financeiro referente à sua atuação na operação foi realizado com sucesso.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #16a34a; border-radius: 6px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 16px 20px;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;">
                <strong style="color: #0f172a;">Referente ao evento:</strong> ${tituloEvento}
              </p>
              <p style="margin: 0; font-size: 16px; color: #15803d; font-weight: 700;">
                Valor transferido: R$ ${valorPago}
              </p>
            </td>
          </tr>
        </table>
        <p style="margin: 0; font-size: 14px; color: #475569;">
          Agradecemos pelo seu excelente trabalho e dedicação na operação.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc; padding: 16px 28px; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #64748b; font-size: 12px;">
          Dúvidas? Responda a este e-mail ou entre em contato com a administração da Wadjet.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await dispararEmailSeguro({
      fromResend: RESEND_FROM_FINANCEIRO,
      to: [emailFinal],
      subject: `Confirmacao de pagamento: ${tituloEvento}`,
      text: textContent,
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
        const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
        return `<tr>
          <td style="padding:10px 16px;background-color:${bg};border-bottom:1px solid #e2e8f0;color:#1e293b;font-weight:700;font-size:14px;">${tam}</td>
          <td style="padding:10px 16px;background-color:${bg};border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;font-weight:600;">${quantidade} ${quantidade === 1 ? "camisa" : "camisas"}</td>
        </tr>`;
      }).join("");

    const semTamanhoHtml = totalSemTamanho > 0
      ? `<div style="margin-top:20px;background-color:#fffbeb;border:1px solid #fde68a;border-left:4px solid #f59e0b;border-radius:6px;padding:14px 18px;">
          <p style="margin:0 0 8px 0;color:#b45309;font-size:13px;font-weight:700;">${totalSemTamanho} colaborador${totalSemTamanho > 1 ? "es" : ""} sem tamanho cadastrado:</p>
          ${listaStaff.filter(s => !s.uniforme || s.uniforme.trim() === "").map(s => `<p style="margin:3px 0;color:#78350f;font-size:13px;">&bull; ${s.nome}</p>`).join("")}
        </div>`
      : `<div style="margin-top:20px;background-color:#f0fdf4;border:1px solid #bbf7d0;border-left:4px solid #16a34a;border-radius:6px;padding:12px 18px;">
          <p style="margin:0;color:#15803d;font-size:13px;font-weight:600;">Todos os colaboradores escalados possuem tamanho de uniforme cadastrado.</p>
        </div>`;

    const linhasStaff = listaStaff.map((s, idx) => {
      const bg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
      const uniforme = s.uniforme ? s.uniforme.toUpperCase() : null;
      return `<tr>
        <td style="padding:9px 14px;background-color:${bg};border-bottom:1px solid #e2e8f0;color:#1e293b;font-size:13px;">${s.nome}</td>
        <td style="padding:9px 14px;background-color:${bg};border-bottom:1px solid #e2e8f0;color:#475569;font-size:13px;">${s.setor || "-"}</td>
        <td style="padding:9px 14px;background-color:${bg};border-bottom:1px solid #e2e8f0;text-align:center;font-size:13px;font-weight:700;color:${uniforme ? "#1d4ed8" : "#b45309"};">
          ${uniforme || "Não informado"}
        </td>
      </tr>`;
    }).join("");

    const dataGerada = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:20px 12px;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <div style="max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;padding:28px;">
    <p style="margin:0 0 4px 0;color:#6b7280;font-size:12px;font-weight:600;">StaffVance &middot; Gestão de Uniformes</p>
    <h2 style="margin:0 0 18px 0;color:#111827;font-size:20px;font-weight:700;border-bottom:1px solid #e5e7eb;padding-bottom:12px;">
      Relatório de Uniformes — ${dadosEvento.titulo || "Evento"}
    </h2>

    <div style="background-color:#f9fafb;border:1px solid #d1d5db;border-radius:6px;padding:16px 18px;margin-bottom:20px;">
      <p style="margin:0 0 6px 0;font-size:14px;color:#374151;"><strong style="color:#111827;">Operação:</strong> ${dadosEvento.titulo || "Evento"}</p>
      <p style="margin:0 0 6px 0;font-size:14px;color:#374151;"><strong style="color:#111827;">Local:</strong> ${dadosEvento.endereco_texto || "A definir"}</p>
      <p style="margin:0;font-size:14px;color:#374151;"><strong style="color:#111827;">Total escalado:</strong> ${totalGeral} membro(s) (${totalComTamanho} com tamanho definido)</p>
    </div>

    <h3 style="margin:20px 0 10px 0;color:#111827;font-size:15px;font-weight:700;">Quantidade por Tamanho</h3>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;">
      <thead>
        <tr style="background-color:#f1f5f9;">
          <th style="padding:10px 16px;text-align:left;color:#475569;font-size:12px;border-bottom:1px solid #e2e8f0;">Tamanho</th>
          <th style="padding:10px 16px;text-align:left;color:#475569;font-size:12px;border-bottom:1px solid #e2e8f0;">Quantidade</th>
        </tr>
      </thead>
      <tbody>${linhasTamanhos || "<tr><td colspan='2' style='padding:14px;text-align:center;color:#64748b;'>Nenhum tamanho cadastrado.</td></tr>"}</tbody>
    </table>

    ${semTamanhoHtml}

    <h3 style="margin:24px 0 10px 0;color:#111827;font-size:15px;font-weight:700;">Lista de Escalados</h3>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;">
      <thead>
        <tr style="background-color:#f1f5f9;">
          <th style="padding:9px 14px;text-align:left;color:#475569;font-size:12px;border-bottom:1px solid #e2e8f0;">Nome</th>
          <th style="padding:9px 14px;text-align:left;color:#475569;font-size:12px;border-bottom:1px solid #e2e8f0;">Setor</th>
          <th style="padding:9px 14px;text-align:center;color:#475569;font-size:12px;border-bottom:1px solid #e2e8f0;">Uniforme</th>
        </tr>
      </thead>
      <tbody>${linhasStaff}</tbody>
    </table>

    <div style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:14px;font-size:12px;color:#9ca3af;">
      Relatório gerado pelo sistema StaffVance em ${dataGerada}.
    </div>
  </div>
</body>
</html>`;

    const resumoTamanhosTexto = ordemTamanhos
      .filter(tam => contagem[tam] > 0)
      .map(tam => `- Tamanho ${tam}: ${contagem[tam]} camisa(s)`)
      .join("\n");

    const textContent = [
      `RELATÓRIO DE UNIFORMES — ${dadosEvento.titulo || "Evento"}`,
      `Local: ${dadosEvento.endereco_texto || "A definir"}`,
      `Total Escalado: ${totalGeral} membros (${totalComTamanho} com tamanho definido)`,
      "",
      "Quantidade por Tamanho:",
      resumoTamanhosTexto || "Nenhum tamanho cadastrado.",
      "",
      "Lista de Escalados:",
      ...listaStaff.map(s => `- ${s.nome} (${s.setor || "Geral"}): ${s.uniforme ? s.uniforme.toUpperCase() : "Não cadastrado"}`),
    ].join("\n");

    const listaUnica = Array.from(
      new Set(
        (Array.isArray(destinatarios) ? destinatarios : [destinatarios])
          .map((e) => (typeof e === "string" ? e.trim().toLowerCase() : ""))
          .filter((e) => e && e.includes("@"))
      )
    );

    if (listaUnica.length === 0) {
      return { success: false, error: "Nenhum e-mail de destinatário válido informado." };
    }

    // Envia em um único disparo com todos os destinatários autorizados no cabeçalho "to"
    // (os 2 admins + coordenadores/produtores escalados) para que todos recebam juntos e apareçam no "para:"
    await dispararEmailSeguro({
      fromResend: RESEND_FROM_RELATORIO,
      to: listaUnica,
      subject: `Relatorio de uniformes: ${dadosEvento.titulo || "Operacao"}`,
      text: textContent,
      html: htmlContent,
    });

    return {
      success: true,
      enviados: listaUnica.length,
      total: listaUnica.length,
    };
  } catch (error) {
    console.error("Erro E-mail Resumo Camisas:", error);
    return { success: false, error: error.message };
  }
}