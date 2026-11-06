"use client";

import React, { useState, useMemo } from "react";
import {
  Download,
  Share2,
  Printer,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  Users,
  Calendar,
  MapPin,
  Briefcase,
  Receipt,
  Award,
  X,
  Copy,
  Check,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import {
  calcularDadosRelatorio,
  formatarMoedaRelatorio,
  gerarTextoCompartilhamentoRelatorio,
  gerarArquivoPdfBlob,
} from "@/lib/gerarPdfRelatorio";
import { isGestorAutorizado, BadgeClassificacao } from "./AvaliacaoEncerramentoModal";

export default function RelatorioEventoHub({
  evento,
  escalas = [],
  userRole = "admin",
}) {
  const [modalRelatorioAberto, setModalRelatorioAberto] = useState(false);
  const [modalShareAberto, setModalShareAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [baixandoPdf, setBaixandoPdf] = useState(false);
  const [feedbackAcao, setFeedbackAcao] = useState("");

  const mostrarAvaliacoes = isGestorAutorizado(userRole);

  const dados = useMemo(
    () => calcularDadosRelatorio(evento, escalas),
    [evento, escalas]
  );

  const nomeArquivoPdf = useMemo(() => {
    const slug = String(dados.titulo || "operacao")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
    return `relatorio-evento-${slug || "wadjet"}.pdf`;
  }, [dados.titulo]);

  // 1. Baixar arquivo .PDF diretamente no dispositivo (1 clique)
  const handleBaixarPdfDireto = () => {
    setBaixandoPdf(true);
    try {
      const blob = gerarArquivoPdfBlob(dados, mostrarAvaliacoes);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nomeArquivoPdf;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      setFeedbackAcao("PDF baixado com sucesso no seu dispositivo!");
      setTimeout(() => setFeedbackAcao(""), 3500);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Não foi possível baixar o PDF automaticamente. Tente a opção Imprimir / Exportar PDF.");
    } finally {
      setBaixandoPdf(false);
    }
  };

  // 2. Compartilhar Relatório (Arquivo PDF ou Resumo Completo via Web Share API / WhatsApp)
  const handleCompartilhar = async () => {
    const textoResumo = gerarTextoCompartilhamentoRelatorio(
      dados,
      mostrarAvaliacoes
    );

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        const blob = gerarArquivoPdfBlob(dados, mostrarAvaliacoes);
        const file = new File([blob], nomeArquivoPdf, {
          type: "application/pdf",
        });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Relatório: ${dados.titulo}`,
            text: textoResumo,
            files: [file],
          });
          return;
        }

        await navigator.share({
          title: `Relatório: ${dados.titulo}`,
          text: textoResumo,
        });
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }

    // Se o navegador não tiver share nativo (ex: desktop), abre o modal rápido de compartilhamento
    setModalShareAberto(true);
  };

  const handleCompartilharWhatsApp = () => {
    const textoResumo = gerarTextoCompartilhamentoRelatorio(
      dados,
      mostrarAvaliacoes
    );
    const url = `https://wa.me/?text=${encodeURIComponent(textoResumo)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopiarTexto = () => {
    const textoResumo = gerarTextoCompartilhamentoRelatorio(
      dados,
      mostrarAvaliacoes
    );
    navigator.clipboard.writeText(textoResumo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  // 3. Exportar / Imprimir em janela A4 limpa e dedicada (funciona perfeitamente em celular e PC)
  const handleImprimirA4 = () => {
    const todasDespesas = [
      ...dados.despesasImpostos,
      ...dados.despesasOperacionais,
    ];

    const linhasDespesasHtml =
      todasDespesas.length === 0
        ? `<tr><td colspan="4" style="text-align:center;color:#666;padding:12px;">Nenhum gasto operacional extra ou imposto registrado neste evento.</td></tr>`
        : todasDespesas
            .map(
              (d, i) => `
          <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f8fafc"};">
            <td style="padding:8px;border:1px solid #cbd5e1;font-weight:700;text-transform:uppercase;font-size:11px;">${
              d.categoria || "Outros"
            }</td>
            <td style="padding:8px;border:1px solid #cbd5e1;">${
              d.descricao || "-"
            }</td>
            <td style="padding:8px;border:1px solid #cbd5e1;">${
              d.forma_pagamento || "Pix"
            }</td>
            <td style="padding:8px;border:1px solid #cbd5e1;font-weight:700;color:#b45309;text-align:right;">${formatarMoedaRelatorio(
              d.valor
            )}</td>
          </tr>`
            )
            .join("");

    const linhasEquipeHtml =
      dados.listaEquipe.length === 0
        ? `<tr><td colspan="7" style="text-align:center;color:#666;padding:12px;">Nenhum colaborador escalado neste evento.</td></tr>`
        : dados.listaEquipe
            .map(
              (m, i) => `
          <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f8fafc"};">
            <td style="padding:7px;border:1px solid #cbd5e1;text-align:center;">${
              i + 1
            }</td>
            <td style="padding:7px;border:1px solid #cbd5e1;font-weight:700;">
              ${m.nome}
              ${
                mostrarAvaliacoes && m.anotacoes
                  ? `<div style="font-size:10px;color:#555;font-weight:400;margin-top:2px;">Obs: ${m.anotacoes}</div>`
                  : ""
              }
            </td>
            <td style="padding:7px;border:1px solid #cbd5e1;">${m.setor}</td>
            <td style="padding:7px;border:1px solid #cbd5e1;font-weight:700;color:${
              m.isPresente ? "#15803d" : m.isFalta ? "#b91c1c" : "#b45309"
            };">${m.statusPresencaLabel}</td>
            ${
              mostrarAvaliacoes
                ? `<td style="padding:7px;border:1px solid #cbd5e1;font-weight:700;text-align:center;">${
                    m.classificacao || "-"
                  }</td>`
                : ""
            }
            <td style="padding:7px;border:1px solid #cbd5e1;font-weight:700;text-align:right;">${formatarMoedaRelatorio(
              m.valor
            )}</td>
            <td style="padding:7px;border:1px solid #cbd5e1;font-weight:800;text-align:center;color:${
              m.isPago ? "#15803d" : "#b45309"
            };">${m.isPago ? "PAGO" : "PENDENTE"}</td>
          </tr>`
            )
            .join("");

    const htmlDoc = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Relatório - ${dados.titulo}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 0; padding: 16px; font-size: 12px; background: #fff; }
    .header { background: #0f172a; color: #fff; padding: 16px 20px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .header h1 { margin: 0; font-size: 18px; letter-spacing: 1px; text-transform: uppercase; }
    .header p { margin: 4px 0 0; font-size: 11px; color: #93c5fd; }
    .section-title { background: #1e3a8a; color: #fff; padding: 7px 12px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 4px; margin: 14px 0 8px; }
    .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 4px; }
    .grid-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 8px; }
    .card { border: 1px solid #cbd5e1; background: #f8fafc; padding: 10px; border-radius: 4px; }
    .card-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #475569; }
    .card-val { font-size: 15px; font-weight: 800; margin-top: 4px; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #e2e8f0; color: #1e293b; text-align: left; padding: 8px; border: 1px solid #cbd5e1; font-size: 10px; text-transform: uppercase; }
    .no-print { margin-bottom: 14px; display: flex; gap: 10px; }
    @media print { .no-print { display: none !important; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()" style="background:#2563eb;color:#fff;border:none;padding:10px 18px;border-radius:4px;font-weight:700;cursor:pointer;">🖨️ Imprimir / Salvar como PDF</button>
    <button onclick="window.close()" style="background:#e2e8f0;color:#1e293b;border:none;padding:10px 16px;border-radius:4px;font-weight:700;cursor:pointer;">Fechar</button>
  </div>
  <div class="header">
    <div>
      <h1>Wadjet Segurança & Eventos</h1>
      <p>Relatório Geral, Operacional e Financeiro do Evento</p>
    </div>
    <div style="text-align:right;font-size:11px;color:#cbd5e1;">
      Emitido em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
    </div>
  </div>

  <div class="section-title">1. Informações Gerais do Evento</div>
  <div class="grid-info">
    <div><strong>Evento / Operação:</strong> ${dados.titulo}</div>
    <div><strong>Contratante / Cliente:</strong> ${dados.contratante}</div>
    <div><strong>Local / Endereço:</strong> ${dados.local}</div>
    <div><strong>Data e Horário:</strong> ${dados.dataFormatada} (${dados.horarioFormatado})</div>
    <div><strong>Efetivo Escalado:</strong> ${dados.totalEscalados} membros (${dados.totalPresentes} presentes, ${dados.totalFaltas} faltas, ${dados.totalPendentesPresenca} pendentes)</div>
    <div><strong>Status de Pagamentos:</strong> ${dados.qtdPessoasPagas} pessoa(s) paga(s) | ${dados.qtdPessoasPendentesPgto} pendente(s)</div>
  </div>

  <div class="section-title" style="background:#065f46;">2. Balanço Financeiro, Gastos e Pessoas Pagas</div>
  <div class="grid-cards">
    <div class="card">
      <div class="card-label">Receita Bruta (Contratante)</div>
      <div class="card-val">${formatarMoedaRelatorio(dados.receitaBruta)}</div>
    </div>
    <div class="card">
      <div class="card-label">Custo Total com Equipe (${dados.totalEscalados})</div>
      <div class="card-val" style="color:#1d4ed8;">${formatarMoedaRelatorio(dados.custoTotalEquipe)}</div>
    </div>
    <div class="card">
      <div class="card-label">Gastos Operacionais + Impostos</div>
      <div class="card-val" style="color:#b45309;">${formatarMoedaRelatorio(dados.totalGastosOperacionais + dados.totalImpostos)}</div>
    </div>
    <div class="card" style="background:#f0fdf4;border-color:#86efac;">
      <div class="card-label" style="color:#166534;">Pessoas Pagas (${dados.qtdPessoasPagas} de ${dados.totalEscalados})</div>
      <div class="card-val" style="color:#15803d;">${formatarMoedaRelatorio(dados.valorTotalPagoEquipe)}</div>
    </div>
    <div class="card" style="background:#fffbeb;border-color:#fcd34d;">
      <div class="card-label" style="color:#92400e;">Pendentes de Pagamento (${dados.qtdPessoasPendentesPgto})</div>
      <div class="card-val" style="color:#b45309;">${formatarMoedaRelatorio(dados.valorTotalPendenteEquipe)}</div>
    </div>
    <div class="card" style="background:${dados.lucroLiquido >= 0 ? "#eff6ff" : "#fef2f2"};border-color:${dados.lucroLiquido >= 0 ? "#93c5fd" : "#fca5a5"};">
      <div class="card-label">Lucro / Saldo Líquido (${dados.margemLucro}%)</div>
      <div class="card-val" style="color:${dados.lucroLiquido >= 0 ? "#1d4ed8" : "#dc2626"};">${formatarMoedaRelatorio(dados.lucroLiquido)}</div>
    </div>
  </div>

  <div class="section-title" style="background:#92400e;">3. Detalhamento de Gastos e Despesas Operacionais (${todasDespesas.length})</div>
  <table>
    <thead>
      <tr>
        <th style="width:18%;">Categoria</th>
        <th>Descrição do Gasto</th>
        <th style="width:18%;">Forma Pagto</th>
        <th style="width:18%;text-align:right;">Valor</th>
      </tr>
    </thead>
    <tbody>
      ${linhasDespesasHtml}
    </tbody>
  </table>

  <div class="section-title" style="background:#1e293b;">4. Relação da Equipe Escalada, Presença e Pessoas Pagas (${dados.listaEquipe.length})</div>
  <table>
    <thead>
      <tr>
        <th style="width:5%;text-align:center;">#</th>
        <th>Colaborador</th>
        <th style="width:18%;">Setor</th>
        <th style="width:13%;">Presença</th>
        ${mostrarAvaliacoes ? '<th style="width:11%;text-align:center;">Classif.</th>' : ""}
        <th style="width:13%;text-align:right;">Valor</th>
        <th style="width:13%;text-align:center;">Pagamento</th>
      </tr>
    </thead>
    <tbody>
      ${linhasEquipeHtml}
    </tbody>
  </table>
  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 250); };
  </script>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.open();
      win.document.write(htmlDoc);
      win.document.close();
    } else {
      window.print();
    }
  };

  return (
    <>
      {/* CARD ILUSTRATIVO COM OS 3 BOTÕES GRANDES E FÁCEIS DE USAR */}
      <div className="bg-[#222222] border border-[#3b82f6]/40 rounded-md p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#3b82f6]/15 border border-[#3b82f6]/30 rounded-full flex items-center justify-center text-[#60a5fa] shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <h4 className="text-white font-bold text-[15px] flex items-center gap-2">
                Central do Relatório do Evento
                <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded uppercase font-extrabold">
                  Completo
                </span>
              </h4>
              <p className="text-[#aaa] text-[12px]">
                Dados gerais, financeiro, gastos extras e pessoas pagas
              </p>
            </div>
          </div>
        </div>

        {feedbackAcao && (
          <div className="p-2.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={15} />
            <span>{feedbackAcao}</span>
          </div>
        )}

        {/* 3 BOTÕES ILUSTRATIVOS GRANDES */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* BOTÃO 1: BAIXAR EM PDF */}
          <button
            type="button"
            disabled={baixandoPdf}
            onClick={handleBaixarPdfDireto}
            className="flex items-center sm:flex-col justify-center gap-2.5 p-3.5 rounded-md bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] hover:from-[#3b82f6] hover:to-[#2563eb] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer border border-blue-400/30"
          >
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <Download size={20} />
            </div>
            <div className="text-left sm:text-center">
              <span className="block text-[13px] font-extrabold">
                Baixar PDF
              </span>
              <span className="block text-[10px] text-blue-100 font-normal normal-case">
                Download direto (.pdf)
              </span>
            </div>
          </button>

          {/* BOTÃO 2: COMPARTILHAR */}
          <button
            type="button"
            onClick={handleCompartilhar}
            className="flex items-center sm:flex-col justify-center gap-2.5 p-3.5 rounded-md bg-gradient-to-br from-[#059669] to-[#047857] hover:from-[#10b981] hover:to-[#059669] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer border border-emerald-400/30"
          >
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <Share2 size={20} />
            </div>
            <div className="text-left sm:text-center">
              <span className="block text-[13px] font-extrabold">
                Compartilhar
              </span>
              <span className="block text-[10px] text-emerald-100 font-normal normal-case">
                WhatsApp / Enviar PDF
              </span>
            </div>
          </button>

          {/* BOTÃO 3: EXPORTAR / VER RELATÓRIO COMPLETO */}
          <button
            type="button"
            onClick={() => setModalRelatorioAberto(true)}
            className="flex items-center sm:flex-col justify-center gap-2.5 p-3.5 rounded-md bg-gradient-to-br from-[#4f46e5] to-[#4338ca] hover:from-[#6366f1] hover:to-[#4f46e5] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer border border-indigo-400/30"
          >
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <Printer size={20} />
            </div>
            <div className="text-left sm:text-center">
              <span className="block text-[13px] font-extrabold">
                Exportar / Ver
              </span>
              <span className="block text-[10px] text-indigo-100 font-normal normal-case">
                Abrir e Imprimir PDF
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* MODAL RÁPIDO DE COMPARTILHAMENTO (PARA DESKTOP OU ESCOLHA DIRETA) */}
      {modalShareAberto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalShareAberto(false)}
        >
          <div
            className="bg-[#1c1c1c] border border-[#383838] rounded-md p-5 w-full max-w-md space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#303030] pb-3">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Share2 size={18} className="text-emerald-400" />
                Compartilhar Relatório do Evento
              </h3>
              <button
                type="button"
                onClick={() => setModalShareAberto(false)}
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleCompartilharWhatsApp}
                className="w-full py-3.5 px-4 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 cursor-pointer transition-colors"
              >
                <MessageCircle size={19} />
                <span>Enviar Relatório Completo no WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleBaixarPdfDireto();
                  setModalShareAberto(false);
                }}
                className="w-full py-3.5 px-4 rounded-sm bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm flex items-center justify-center gap-2.5 cursor-pointer transition-colors"
              >
                <Download size={19} />
                <span>Baixar Arquivo PDF ({nomeArquivoPdf})</span>
              </button>

              <button
                type="button"
                onClick={handleCopiarTexto}
                className="w-full py-3 px-4 rounded-sm bg-[#2a2a2a] hover:bg-[#333] border border-[#444] text-neutral-200 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {copiado ? (
                  <>
                    <Check size={17} className="text-emerald-400" />
                    <span className="text-emerald-400">
                      Relatório Copiado para a Área de Transferência!
                    </span>
                  </>
                ) : (
                  <>
                    <Copy size={17} />
                    <span>Copiar Texto Completo do Relatório</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL COMPLETO DE VISUALIZAÇÃO E EXPORTAÇÃO DO RELATÓRIO */}
      {modalRelatorioAberto && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5">
          <div className="bg-[#181818] border border-[#333] rounded-md w-full max-w-4xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
            {/* TOPO COM BOTÕES ILUSTRATIVOS DE AÇÃO */}
            <div className="p-4 bg-[#202020] border-b border-[#333] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-white font-extrabold text-[17px] sm:text-[19px] uppercase tracking-wide flex items-center gap-2">
                  <FileText size={20} className="text-blue-400" />
                  Relatório Geral da Operação
                </h2>
                <p className="text-xs text-neutral-400">
                  {dados.titulo} • {dados.dataFormatada}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleBaixarPdfDireto}
                  className="px-3.5 py-2 rounded bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Download size={15} />
                  <span>Baixar PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleCompartilharWhatsApp}
                  className="px-3.5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Share2 size={15} />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleImprimirA4}
                  className="px-3.5 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Printer size={15} />
                  <span>Imprimir / Salvar PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalRelatorioAberto(false)}
                  className="w-8 h-8 rounded bg-[#2c2c2c] hover:bg-[#3a3a3a] text-neutral-300 flex items-center justify-center cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* CORPO COMPLETO DO RELATÓRIO */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
              {/* 1. DADOS GERAIS DO EVENTO */}
              <section className="bg-[#202020] border border-[#303030] rounded-md p-4 space-y-3">
                <h3 className="text-blue-400 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 border-b border-[#2e2e2e] pb-2">
                  <Calendar size={15} /> 1. Informações Gerais do Evento
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-[#181818] p-3 rounded border border-[#2a2a2a]">
                    <span className="text-neutral-500 uppercase font-bold block text-[10px]">
                      Operação / Evento
                    </span>
                    <span className="text-white font-bold text-sm mt-0.5 block">
                      {dados.titulo}
                    </span>
                  </div>
                  <div className="bg-[#181818] p-3 rounded border border-[#2a2a2a]">
                    <span className="text-neutral-500 uppercase font-bold block text-[10px]">
                      Contratante / Cliente
                    </span>
                    <span className="text-neutral-200 font-semibold text-sm mt-0.5 block">
                      {dados.contratante}
                    </span>
                  </div>
                  <div className="bg-[#181818] p-3 rounded border border-[#2a2a2a]">
                    <span className="text-neutral-500 uppercase font-bold block text-[10px]">
                      Data e Horário
                    </span>
                    <span className="text-neutral-200 font-semibold text-sm mt-0.5 block">
                      {dados.dataFormatada} ({dados.horarioFormatado})
                    </span>
                  </div>
                  <div className="bg-[#181818] p-3 rounded border border-[#2a2a2a] sm:col-span-2">
                    <span className="text-neutral-500 uppercase font-bold block text-[10px]">
                      Local / Endereço
                    </span>
                    <span className="text-neutral-200 font-semibold text-sm mt-0.5 block">
                      {dados.local}
                    </span>
                  </div>
                  <div className="bg-[#181818] p-3 rounded border border-[#2a2a2a]">
                    <span className="text-neutral-500 uppercase font-bold block text-[10px]">
                      Efetivo & Presença
                    </span>
                    <span className="text-emerald-400 font-bold text-sm mt-0.5 block">
                      {dados.totalEscalados} escalados ({dados.totalPresentes} presentes / {dados.totalFaltas} faltas)
                    </span>
                  </div>
                </div>
              </section>

              {/* 2. BALANÇO FINANCEIRO, GASTOS E PESSOAS PAGAS */}
              <section className="bg-[#202020] border border-[#303030] rounded-md p-4 space-y-3">
                <h3 className="text-emerald-400 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 border-b border-[#2e2e2e] pb-2">
                  <DollarSign size={15} /> 2. Resumo Financeiro, Gastos e Pessoas Pagas
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-[#161616] border border-[#2d2d2d] p-3 rounded">
                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                      Receita Bruta (Contratante)
                    </span>
                    <span className="text-white font-extrabold text-base sm:text-lg mt-0.5 block">
                      {formatarMoedaRelatorio(dados.receitaBruta)}
                    </span>
                  </div>

                  <div className="bg-[#161616] border border-[#2d2d2d] p-3 rounded">
                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                      Custo Total Equipe ({dados.totalEscalados})
                    </span>
                    <span className="text-blue-400 font-extrabold text-base sm:text-lg mt-0.5 block">
                      {formatarMoedaRelatorio(dados.custoTotalEquipe)}
                    </span>
                  </div>

                  <div className="bg-[#161616] border border-[#2d2d2d] p-3 rounded">
                    <span className="text-[10px] text-neutral-400 uppercase font-bold block">
                      Gastos Extras + Impostos
                    </span>
                    <span className="text-amber-400 font-extrabold text-base sm:text-lg mt-0.5 block">
                      {formatarMoedaRelatorio(
                        dados.totalGastosOperacionais + dados.totalImpostos
                      )}
                    </span>
                  </div>

                  <div className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold block">
                      Pessoas Pagas ({dados.qtdPessoasPagas} de {dados.totalEscalados})
                    </span>
                    <span className="text-emerald-300 font-extrabold text-base sm:text-lg mt-0.5 block">
                      {formatarMoedaRelatorio(dados.valorTotalPagoEquipe)}
                    </span>
                  </div>

                  <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded">
                    <span className="text-[10px] text-amber-400 uppercase font-bold block">
                      Pendentes de Pagto ({dados.qtdPessoasPendentesPgto})
                    </span>
                    <span className="text-amber-300 font-extrabold text-base sm:text-lg mt-0.5 block">
                      {formatarMoedaRelatorio(dados.valorTotalPendenteEquipe)}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded border ${
                      dados.lucroLiquido >= 0
                        ? "bg-blue-950/25 border-blue-500/40"
                        : "bg-red-950/25 border-red-500/40"
                    }`}
                  >
                    <span className="text-[10px] text-neutral-300 uppercase font-bold block">
                      Lucro / Saldo Líquido ({dados.margemLucro}%)
                    </span>
                    <span
                      className={`font-extrabold text-base sm:text-lg mt-0.5 block ${
                        dados.lucroLiquido >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {formatarMoedaRelatorio(dados.lucroLiquido)}
                    </span>
                  </div>
                </div>
              </section>

              {/* 3. GASTOS E DESPESAS OPERACIONAIS */}
              <section className="bg-[#202020] border border-[#303030] rounded-md p-4 space-y-3">
                <h3 className="text-amber-400 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 border-b border-[#2e2e2e] pb-2">
                  <Receipt size={15} /> 3. Gastos Operacionais e Impostos (
                  {dados.despesasOperacionais.length + dados.despesasImpostos.length})
                </h3>

                {dados.despesasOperacionais.length === 0 &&
                dados.despesasImpostos.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-3 text-center">
                    Nenhum gasto operacional extra ou imposto lançado neste evento.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#161616] text-neutral-400 uppercase text-[10px]">
                          <th className="p-2.5 border border-[#2e2e2e]">Categoria</th>
                          <th className="p-2.5 border border-[#2e2e2e]">Descrição</th>
                          <th className="p-2.5 border border-[#2e2e2e]">Pagamento</th>
                          <th className="p-2.5 border border-[#2e2e2e] text-right">
                            Valor
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...dados.despesasImpostos, ...dados.despesasOperacionais].map(
                          (d, idx) => (
                            <tr
                              key={d.id || idx}
                              className="border-b border-[#2a2a2a] hover:bg-[#262626]"
                            >
                              <td className="p-2.5 font-bold uppercase text-amber-400">
                                {d.categoria || "Outros"}
                              </td>
                              <td className="p-2.5 text-neutral-200">
                                {d.descricao || "-"}
                              </td>
                              <td className="p-2.5 text-neutral-400">
                                {d.forma_pagamento || "Pix"}
                              </td>
                              <td className="p-2.5 text-right font-bold text-white">
                                {formatarMoedaRelatorio(d.valor)}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* 4. RELAÇÃO DA EQUIPE, PRESENÇA, CLASSIFICAÇÃO E PAGAMENTOS */}
              <section className="bg-[#202020] border border-[#303030] rounded-md p-4 space-y-3">
                <h3 className="text-indigo-400 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 border-b border-[#2e2e2e] pb-2">
                  <Users size={15} /> 4. Equipe Escalada, Presença e Pessoas Pagas (
                  {dados.listaEquipe.length})
                </h3>

                {dados.listaEquipe.length === 0 ? (
                  <p className="text-xs text-neutral-500 py-3 text-center">
                    Nenhum membro escalado nesta operação.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#161616] text-neutral-400 uppercase text-[10px]">
                          <th className="p-2.5 border border-[#2e2e2e]">#</th>
                          <th className="p-2.5 border border-[#2e2e2e]">Colaborador</th>
                          <th className="p-2.5 border border-[#2e2e2e]">Setor</th>
                          <th className="p-2.5 border border-[#2e2e2e]">Presença</th>
                          {mostrarAvaliacoes && (
                            <th className="p-2.5 border border-[#2e2e2e]">
                              Classificação
                            </th>
                          )}
                          <th className="p-2.5 border border-[#2e2e2e] text-right">
                            Diária / Valor
                          </th>
                          <th className="p-2.5 border border-[#2e2e2e] text-center">
                            Status Pagto
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {dados.listaEquipe.map((m, idx) => (
                          <tr
                            key={m.id || idx}
                            className="border-b border-[#2a2a2a] hover:bg-[#262626]"
                          >
                            <td className="p-2.5 text-neutral-500">{idx + 1}</td>
                            <td className="p-2.5">
                              <div className="font-bold text-white">{m.nome}</div>
                              {mostrarAvaliacoes && m.anotacoes && (
                                <div className="text-[11px] text-amber-300/90 mt-0.5">
                                  Obs: {m.anotacoes}
                                </div>
                              )}
                            </td>
                            <td className="p-2.5 text-blue-400 font-semibold">
                              {m.setor}
                            </td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  m.isPresente
                                    ? "bg-emerald-500/15 text-emerald-400"
                                    : m.isFalta
                                    ? "bg-red-500/15 text-red-400"
                                    : "bg-amber-500/15 text-amber-400"
                                }`}
                              >
                                {m.statusPresencaLabel}
                              </span>
                            </td>
                            {mostrarAvaliacoes && (
                              <td className="p-2.5">
                                {m.classificacao ? (
                                  <BadgeClassificacao
                                    classificacao={m.classificacao}
                                  />
                                ) : (
                                  <span className="text-neutral-600">-</span>
                                )}
                              </td>
                            )}
                            <td className="p-2.5 text-right font-bold text-white">
                              {formatarMoedaRelatorio(m.valor)}
                            </td>
                            <td className="p-2.5 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                  m.isPago
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                    : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                }`}
                              >
                                {m.isPago ? "PAGO" : "PENDENTE"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

