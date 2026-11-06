// Utilitário puro (zero dependências externas) para geração de arquivo PDF real (.pdf),
// texto estruturado para compartilhamento e versão de impressão A4 completa do evento.

export const formatarMoedaRelatorio = (valor) => {
  const num = parseFloat(valor);
  if (isNaN(num)) return "R$ 0,00";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

// Converte string UTF-8 para bytes WinAnsi (CP1252) compatíveis com fontes padrão PDF Type1 (Helvetica)
function encodeWinAnsi(str) {
  const texto = String(str || "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...");

  let out = "";
  for (let i = 0; i < texto.length; i++) {
    const code = texto.charCodeAt(i);
    if (code >= 32 && code <= 126) {
      if (texto[i] === "(" || texto[i] === ")" || texto[i] === "\\") {
        out += "\\" + texto[i];
      } else {
        out += texto[i];
      }
    } else if (code >= 160 && code <= 255) {
      // Caracteres acentuados do português (á, é, í, ó, ú, ã, õ, ç, ê, ô, etc.) em octal WinAnsi
      out += "\\" + code.toString(8).padStart(3, "0");
    } else {
      out += " ";
    }
  }
  return out;
}

function truncarTexto(str, maxLen) {
  const s = String(str || "").trim();
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - 3) + "...";
}

/**
 * Calcula todos os indicadores consolidados do relatório do evento
 */
export function calcularDadosRelatorio(evento, escalas = []) {
  const receitaBruta = parseFloat(evento?.receita_bruta) || 0;
  const despesasLista = Array.isArray(evento?.despesas) ? evento.despesas : [];

  const despesasImpostos = despesasLista.filter((d) => d.categoria === "impostos");
  const despesasOperacionais = despesasLista.filter((d) => d.categoria !== "impostos");

  const totalImpostos = despesasImpostos.reduce(
    (acc, d) => acc + (parseFloat(d.valor) || 0),
    0
  );
  const totalGastosOperacionais = despesasOperacionais.reduce(
    (acc, d) => acc + (parseFloat(d.valor) || 0),
    0
  );

  const listaEquipe = (escalas || []).map((esc) => {
    const valor = parseFloat(esc.valor_pago) || 0;
    const isPago = esc.status_pagamento === true || esc.status_pagamento === "true";
    const isPresente = esc.status_presenca === "presente" || !!esc.checkin_em;
    const isFalta = esc.status_presenca === "falta";
    const statusPresencaLabel = isPresente
      ? "Presente"
      : isFalta
      ? "Falta"
      : "Pendente";

    return {
      id: esc.id,
      staffId: esc.staff_id || esc.perfis?.id,
      nome: esc.perfis?.nome_completo || "Sem nome",
      cpf: esc.perfis?.cpf || "",
      whatsapp: esc.perfis?.whatsapp || "",
      chave_pix: esc.perfis?.chave_pix || "",
      uniforme: (esc.perfis?.uniforme || "").toUpperCase(),
      cargo: esc.perfis?.cargo || esc.perfis?.role || "Staff",
      classificacao: esc.perfis?.classificacao || "",
      anotacoes: esc.perfis?.anotacoes || "",
      setor: esc.setor || "Geral",
      valor,
      isPago,
      isPresente,
      isFalta,
      statusPresencaLabel,
      checkin_em: esc.checkin_em,
      checkout_em: esc.checkout_em,
    };
  });

  const totalEscalados = listaEquipe.length;
  const totalPresentes = listaEquipe.filter((m) => m.isPresente).length;
  const totalFaltas = listaEquipe.filter((m) => m.isFalta).length;
  const totalPendentesPresenca = totalEscalados - totalPresentes - totalFaltas;

  const pessoasPagas = listaEquipe.filter((m) => m.isPago);
  const pessoasPendentesPgto = listaEquipe.filter((m) => !m.isPago);

  const custoTotalEquipe = listaEquipe.reduce((acc, m) => acc + m.valor, 0);
  const valorTotalPagoEquipe = pessoasPagas.reduce((acc, m) => acc + m.valor, 0);
  const valorTotalPendenteEquipe = pessoasPendentesPgto.reduce(
    (acc, m) => acc + m.valor,
    0
  );

  const custoTotalGeral =
    custoTotalEquipe + totalGastosOperacionais + totalImpostos;
  const lucroLiquido = receitaBruta - custoTotalGeral;
  const margemLucro =
    receitaBruta > 0 ? ((lucroLiquido / receitaBruta) * 100).toFixed(1) : "0.0";

  let dataFormatada = "Data a definir";
  let horarioFormatado = "Horário a definir";
  if (evento?.data_inicio) {
    const dIni = new Date(evento.data_inicio);
    dataFormatada = dIni.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    horarioFormatado = dIni.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (evento?.data_fim) {
      const dFim = new Date(evento.data_fim);
      horarioFormatado +=
        " às " +
        dFim.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });
    }
  }

  return {
    titulo: evento?.titulo || "Operação Wadjet",
    contratante: evento?.nome_contratante || "Não informado",
    local: evento?.endereco_texto || "Local não informado",
    dataFormatada,
    horarioFormatado,
    escopo: evento?.escopo || "ativo",
    receitaBruta,
    totalImpostos,
    totalGastosOperacionais,
    custoTotalEquipe,
    valorTotalPagoEquipe,
    valorTotalPendenteEquipe,
    custoTotalGeral,
    lucroLiquido,
    margemLucro,
    despesasImpostos,
    despesasOperacionais,
    listaEquipe,
    totalEscalados,
    totalPresentes,
    totalFaltas,
    totalPendentesPresenca,
    qtdPessoasPagas: pessoasPagas.length,
    qtdPessoasPendentesPgto: pessoasPendentesPgto.length,
  };
}

/**
 * Gera um texto completo e bem formatado para compartilhamento (WhatsApp / Web Share)
 */
export function gerarTextoCompartilhamentoRelatorio(dados, incluirAvaliacoes = true) {
  const linhas = [
    "🛡️ *RELATÓRIO GERAL DA OPERAÇÃO - WADJET SEGURANÇA*",
    "━━━━━━━━━━━━━━━━━━━━━━",
    `📌 *Evento:* ${dados.titulo}`,
    `🤝 *Contratante:* ${dados.contratante}`,
    `📍 *Local:* ${dados.local}`,
    `📅 *Data:* ${dados.dataFormatada} (${dados.horarioFormatado})`,
    "",
    "👥 *RESUMO DE EFETIVO E PRESENÇA*",
    `• Total Escalado: ${dados.totalEscalados} pessoa(s)`,
    `• Presentes Confirmados: ${dados.totalPresentes}`,
    `• Faltas: ${dados.totalFaltas} | Pendentes: ${dados.totalPendentesPresenca}`,
    "",
    "💰 *BALANÇO FINANCEIRO E GASTOS*",
    `• Receita Bruta (Contratante): ${formatarMoedaRelatorio(dados.receitaBruta)}`,
    `• Impostos / NF-e: ${formatarMoedaRelatorio(dados.totalImpostos)}`,
    `• Custo Total de Equipe: ${formatarMoedaRelatorio(dados.custoTotalEquipe)}`,
    `  ├─ Pessoas Pagas (${dados.qtdPessoasPagas}): ${formatarMoedaRelatorio(dados.valorTotalPagoEquipe)}`,
    `  └─ Pendentes de Pagamento (${dados.qtdPessoasPendentesPgto}): ${formatarMoedaRelatorio(dados.valorTotalPendenteEquipe)}`,
    `• Gastos Operacionais Extras (${dados.despesasOperacionais.length}): ${formatarMoedaRelatorio(dados.totalGastosOperacionais)}`,
    `• Custo Total Geral: ${formatarMoedaRelatorio(dados.custoTotalGeral)}`,
    `💵 *SALDO / LUCRO LÍQUIDO:* ${formatarMoedaRelatorio(dados.lucroLiquido)} (${dados.margemLucro}%)`,
  ];

  if (dados.despesasOperacionais.length > 0) {
    linhas.push("", "🧾 *DETALHAMENTO DE GASTOS OPERACIONAIS*");
    dados.despesasOperacionais.forEach((d, idx) => {
      linhas.push(
        `${idx + 1}. ${d.descricao || d.categoria} (${d.forma_pagamento || "Pix"}): ${formatarMoedaRelatorio(d.valor)}`
      );
    });
  }

  if (dados.listaEquipe.length > 0) {
    linhas.push("", "📋 *RELAÇÃO DA EQUIPE E PAGAMENTOS*");
    dados.listaEquipe.forEach((m, idx) => {
      const statusPgto = m.isPago ? "✅ PAGO" : "⏳ PENDENTE";
      const classif =
        incluirAvaliacoes && m.classificacao ? ` [${m.classificacao}]` : "";
      linhas.push(
        `${idx + 1}. ${m.nome} (${m.setor})${classif} - ${m.statusPresencaLabel} - ${formatarMoedaRelatorio(m.valor)} - ${statusPgto}`
      );
    });
  }

  return linhas.join("\n");
}

/**
 * Gera um arquivo PDF binário real (Blob application/pdf) em formato A4 multipágina
 */
export function gerarArquivoPdfBlob(dados, incluirAvaliacoes = true) {
  const PAGE_W = 595.28;
  const PAGE_H = 841.89;
  const MARGIN_X = 36;
  const CONTENT_W = PAGE_W - MARGIN_X * 2;

  const pages = [];
  let cmds = [];
  let curY = PAGE_H - 40;

  const novaPagina = () => {
    if (cmds.length > 0) {
      pages.push(cmds.join("\n"));
    }
    cmds = [];
    curY = PAGE_H - 40;
  };

  const garantirEspaco = (alturaNecessaria) => {
    if (curY - alturaNecessaria < 48) {
      novaPagina();
      // Mini cabeçalho de continuação nas páginas seguintes
      drawRect(MARGIN_X, curY - 22, CONTENT_W, 22, [0.11, 0.16, 0.25]);
      drawText(
        `WADJET SEGURANÇA - ${truncarTexto(dados.titulo.toUpperCase(), 45)} (Continuação)`,
        MARGIN_X + 10,
        curY - 15,
        9,
        true,
        [1, 1, 1]
      );
      curY -= 32;
    }
  };

  const drawRect = (x, y, w, h, fillRgb, strokeRgb = null) => {
    cmds.push("q");
    if (fillRgb) {
      cmds.push(
        `${fillRgb[0].toFixed(3)} ${fillRgb[1].toFixed(3)} ${fillRgb[2].toFixed(3)} rg`
      );
    }
    if (strokeRgb) {
      cmds.push(
        `${strokeRgb[0].toFixed(3)} ${strokeRgb[1].toFixed(3)} ${strokeRgb[2].toFixed(3)} RG`
      );
      cmds.push("0.7 w");
    }
    const op = fillRgb && strokeRgb ? "B" : fillRgb ? "f" : "S";
    cmds.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${op}`);
    cmds.push("Q");
  };

  const drawText = (
    text,
    x,
    y,
    size = 10,
    bold = false,
    rgb = [0.1, 0.1, 0.1]
  ) => {
    const font = bold ? "/F2" : "/F1";
    const encoded = encodeWinAnsi(text);
    cmds.push("BT");
    cmds.push(`${rgb[0].toFixed(3)} ${rgb[1].toFixed(3)} ${rgb[2].toFixed(3)} rg`);
    cmds.push(`${font} ${size} Tf`);
    cmds.push(`1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm`);
    cmds.push(`(${encoded}) Tj`);
    cmds.push("ET");
  };

  // ─── CABEÇALHO PRINCIPAL ───
  drawRect(MARGIN_X, curY - 54, CONTENT_W, 54, [0.08, 0.13, 0.24]);
  drawText(
    "WADJET SEGURANÇA E EVENTOS",
    MARGIN_X + 14,
    curY - 22,
    15,
    true,
    [1, 1, 1]
  );
  drawText(
    "RELATÓRIO EXECUTIVO E OPERACIONAL DO EVENTO",
    MARGIN_X + 14,
    curY - 37,
    9,
    false,
    [0.75, 0.85, 1]
  );
  const geradoEm = `Emitido em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  drawText(geradoEm, PAGE_W - MARGIN_X - 150, curY - 22, 8, false, [0.8, 0.85, 0.95]);
  curY -= 68;

  // ─── SEÇÃO 1: INFORMAÇÕES GERAIS DO EVENTO ───
  drawRect(MARGIN_X, curY - 20, CONTENT_W, 20, [0.15, 0.39, 0.92]);
  drawText(
    "1. INFORMAÇÕES GERAIS DA OPERAÇÃO",
    MARGIN_X + 10,
    curY - 14,
    10,
    true,
    [1, 1, 1]
  );
  curY -= 22;

  drawRect(MARGIN_X, curY - 72, CONTENT_W, 72, [0.97, 0.98, 1], [0.82, 0.86, 0.92]);
  drawText("EVENTO / OPERAÇÃO:", MARGIN_X + 10, curY - 16, 8, true, [0.4, 0.45, 0.55]);
  drawText(truncarTexto(dados.titulo, 55), MARGIN_X + 105, curY - 16, 10, true, [0.08, 0.1, 0.15]);

  drawText("CONTRATANTE:", MARGIN_X + 10, curY - 32, 8, true, [0.4, 0.45, 0.55]);
  drawText(truncarTexto(dados.contratante, 45), MARGIN_X + 105, curY - 32, 9, false, [0.15, 0.15, 0.2]);

  drawText("LOCAL / ENDEREÇO:", MARGIN_X + 10, curY - 48, 8, true, [0.4, 0.45, 0.55]);
  drawText(truncarTexto(dados.local, 68), MARGIN_X + 105, curY - 48, 9, false, [0.15, 0.15, 0.2]);

  drawText("DATA E HORÁRIO:", MARGIN_X + 10, curY - 64, 8, true, [0.4, 0.45, 0.55]);
  drawText(`${dados.dataFormatada} - ${dados.horarioFormatado}`, MARGIN_X + 105, curY - 64, 9, true, [0.15, 0.15, 0.2]);

  drawText("EFETIVO ESCALADO:", MARGIN_X + 310, curY - 32, 8, true, [0.4, 0.45, 0.55]);
  drawText(
    `${dados.totalEscalados} total (${dados.totalPresentes} pres. / ${dados.totalFaltas} faltas)`,
    MARGIN_X + 398,
    curY - 32,
    9,
    true,
    [0.08, 0.45, 0.22]
  );

  drawText("PESSOAS PAGAS:", MARGIN_X + 310, curY - 64, 8, true, [0.4, 0.45, 0.55]);
  drawText(
    `${dados.qtdPessoasPagas} de ${dados.totalEscalados} pagas`,
    MARGIN_X + 398,
    curY - 64,
    9,
    true,
    [0.12, 0.35, 0.78]
  );
  curY -= 86;

  // ─── SEÇÃO 2: RESUMO FINANCEIRO, GASTOS E PAGAMENTOS ───
  garantirEspaco(115);
  drawRect(MARGIN_X, curY - 20, CONTENT_W, 20, [0.09, 0.52, 0.32]);
  drawText(
    "2. BALANÇO FINANCEIRO, GASTOS E PESSOAS PAGAS",
    MARGIN_X + 10,
    curY - 14,
    10,
    true,
    [1, 1, 1]
  );
  curY -= 24;

  const boxW = (CONTENT_W - 12) / 3;
  // Linha 1 de cards financeiros
  drawRect(MARGIN_X, curY - 40, boxW, 40, [0.96, 0.97, 0.99], [0.82, 0.85, 0.9]);
  drawText("RECEITA BRUTA (CONTRATANTE)", MARGIN_X + 8, curY - 14, 7.5, true, [0.4, 0.45, 0.52]);
  drawText(formatarMoedaRelatorio(dados.receitaBruta), MARGIN_X + 8, curY - 30, 11, true, [0.1, 0.15, 0.25]);

  drawRect(MARGIN_X + boxW + 6, curY - 40, boxW, 40, [0.96, 0.97, 0.99], [0.82, 0.85, 0.9]);
  drawText("CUSTO TOTAL COM EQUIPE", MARGIN_X + boxW + 14, curY - 14, 7.5, true, [0.4, 0.45, 0.52]);
  drawText(
    `${formatarMoedaRelatorio(dados.custoTotalEquipe)} (${dados.totalEscalados} staffs)`,
    MARGIN_X + boxW + 14,
    curY - 30,
    10,
    true,
    [0.15, 0.25, 0.55]
  );

  drawRect(MARGIN_X + (boxW + 6) * 2, curY - 40, boxW, 40, [0.96, 0.97, 0.99], [0.82, 0.85, 0.9]);
  drawText("GASTOS EXTRAS + IMPOSTOS", MARGIN_X + (boxW + 6) * 2 + 8, curY - 14, 7.5, true, [0.4, 0.45, 0.52]);
  drawText(
    formatarMoedaRelatorio(dados.totalGastosOperacionais + dados.totalImpostos),
    MARGIN_X + (boxW + 6) * 2 + 8,
    curY - 30,
    10,
    true,
    [0.7, 0.35, 0.05]
  );
  curY -= 46;

  // Linha 2 de cards financeiros (Pessoas Pagas, Pendentes e Lucro Líquido)
  drawRect(MARGIN_X, curY - 40, boxW, 40, [0.93, 0.99, 0.95], [0.65, 0.88, 0.72]);
  drawText(
    `PESSOAS PAGAS (${dados.qtdPessoasPagas} DE ${dados.totalEscalados})`,
    MARGIN_X + 8,
    curY - 14,
    7.5,
    true,
    [0.08, 0.48, 0.24]
  );
  drawText(formatarMoedaRelatorio(dados.valorTotalPagoEquipe), MARGIN_X + 8, curY - 30, 11, true, [0.06, 0.45, 0.22]);

  drawRect(MARGIN_X + boxW + 6, curY - 40, boxW, 40, [1, 0.97, 0.92], [0.92, 0.8, 0.6]);
  drawText(
    `PENDENTES DE PAGTO (${dados.qtdPessoasPendentesPgto})`,
    MARGIN_X + boxW + 14,
    curY - 14,
    7.5,
    true,
    [0.68, 0.38, 0.05]
  );
  drawText(
    formatarMoedaRelatorio(dados.valorTotalPendenteEquipe),
    MARGIN_X + boxW + 14,
    curY - 30,
    11,
    true,
    [0.7, 0.35, 0.05]
  );

  const lucroPositivo = dados.lucroLiquido >= 0;
  drawRect(
    MARGIN_X + (boxW + 6) * 2,
    curY - 40,
    boxW,
    40,
    lucroPositivo ? [0.92, 0.97, 1] : [1, 0.93, 0.93],
    lucroPositivo ? [0.6, 0.78, 0.95] : [0.92, 0.65, 0.65]
  );
  drawText(
    `SALDO / LUCRO LÍQUIDO (${dados.margemLucro}%)`,
    MARGIN_X + (boxW + 6) * 2 + 8,
    curY - 14,
    7.5,
    true,
    lucroPositivo ? [0.1, 0.35, 0.75] : [0.75, 0.15, 0.15]
  );
  drawText(
    formatarMoedaRelatorio(dados.lucroLiquido),
    MARGIN_X + (boxW + 6) * 2 + 8,
    curY - 30,
    11,
    true,
    lucroPositivo ? [0.08, 0.32, 0.72] : [0.75, 0.12, 0.12]
  );
  curY -= 54;

  // ─── SEÇÃO 3: DETALHAMENTO DE GASTOS OPERACIONAIS E IMPOSTOS ───
  const todasDespesas = [...dados.despesasImpostos, ...dados.despesasOperacionais];
  garantirEspaco(55);
  drawRect(MARGIN_X, curY - 20, CONTENT_W, 20, [0.72, 0.42, 0.06]);
  drawText(
    `3. DETALHAMENTO DE GASTOS E DESPESAS DA OPERAÇÃO (${todasDespesas.length})`,
    MARGIN_X + 10,
    curY - 14,
    10,
    true,
    [1, 1, 1]
  );
  curY -= 22;

  if (todasDespesas.length === 0) {
    drawRect(MARGIN_X, curY - 24, CONTENT_W, 24, [0.98, 0.98, 0.98], [0.86, 0.86, 0.86]);
    drawText(
      "Nenhum gasto operacional extra ou imposto registrado neste evento.",
      MARGIN_X + 10,
      curY - 15,
      9,
      false,
      [0.45, 0.45, 0.45]
    );
    curY -= 34;
  } else {
    // Cabeçalho da tabela de gastos
    drawRect(MARGIN_X, curY - 18, CONTENT_W, 18, [0.9, 0.92, 0.95], [0.78, 0.8, 0.85]);
    drawText("CATEGORIA", MARGIN_X + 8, curY - 12, 8, true, [0.2, 0.25, 0.35]);
    drawText("DESCRIÇÃO DO GASTO", MARGIN_X + 110, curY - 12, 8, true, [0.2, 0.25, 0.35]);
    drawText("FORMA PAGTO", MARGIN_X + 345, curY - 12, 8, true, [0.2, 0.25, 0.35]);
    drawText("VALOR (R$)", MARGIN_X + 440, curY - 12, 8, true, [0.2, 0.25, 0.35]);
    curY -= 18;

    todasDespesas.forEach((desp, idx) => {
      garantirEspaco(20);
      const bg = idx % 2 === 0 ? [1, 1, 1] : [0.97, 0.98, 0.99];
      drawRect(MARGIN_X, curY - 18, CONTENT_W, 18, bg, [0.88, 0.9, 0.92]);
      drawText(
        truncarTexto((desp.categoria || "Outros").toUpperCase(), 16),
        MARGIN_X + 8,
        curY - 12,
        8,
        true,
        [0.3, 0.35, 0.45]
      );
      drawText(
        truncarTexto(desp.descricao || "-", 44),
        MARGIN_X + 110,
        curY - 12,
        8.5,
        false,
        [0.15, 0.15, 0.2]
      );
      drawText(
        truncarTexto(desp.forma_pagamento || "Pix", 16),
        MARGIN_X + 345,
        curY - 12,
        8,
        false,
        [0.35, 0.35, 0.4]
      );
      drawText(
        formatarMoedaRelatorio(desp.valor),
        MARGIN_X + 440,
        curY - 12,
        8.5,
        true,
        [0.7, 0.3, 0.05]
      );
      curY -= 18;
    });
    curY -= 12;
  }

  // ─── SEÇÃO 4: RELAÇÃO NOMINAL DA EQUIPE, PRESENÇA E PESSOAS PAGAS ───
  garantirEspaco(60);
  drawRect(MARGIN_X, curY - 20, CONTENT_W, 20, [0.15, 0.22, 0.36]);
  drawText(
    `4. RELAÇÃO DA EQUIPE ESCALADA, PRESENÇA E PAGAMENTOS (${dados.listaEquipe.length})`,
    MARGIN_X + 10,
    curY - 14,
    10,
    true,
    [1, 1, 1]
  );
  curY -= 22;

  if (dados.listaEquipe.length === 0) {
    drawRect(MARGIN_X, curY - 24, CONTENT_W, 24, [0.98, 0.98, 0.98], [0.86, 0.86, 0.86]);
    drawText(
      "Nenhum colaborador escalado neste evento.",
      MARGIN_X + 10,
      curY - 15,
      9,
      false,
      [0.45, 0.45, 0.45]
    );
    curY -= 30;
  } else {
    drawRect(MARGIN_X, curY - 18, CONTENT_W, 18, [0.9, 0.92, 0.95], [0.78, 0.8, 0.85]);
    drawText("#", MARGIN_X + 6, curY - 12, 8, true, [0.2, 0.25, 0.35]);
    drawText("COLABORADOR", MARGIN_X + 24, curY - 12, 8, true, [0.2, 0.25, 0.35]);
    drawText("SETOR", MARGIN_X + 185, curY - 12, 8, true, [0.2, 0.25, 0.35]);
    drawText("PRESENÇA", MARGIN_X + 285, curY - 12, 8, true, [0.2, 0.25, 0.35]);
    if (incluirAvaliacoes) {
      drawText("CLASSIF.", MARGIN_X + 350, curY - 12, 8, true, [0.2, 0.25, 0.35]);
    }
    drawText("VALOR", MARGIN_X + 405, curY - 12, 8, true, [0.2, 0.25, 0.35]);
    drawText("PAGAMENTO", MARGIN_X + 462, curY - 12, 8, true, [0.2, 0.25, 0.35]);
    curY -= 18;

    dados.listaEquipe.forEach((m, idx) => {
      const temNota = incluirAvaliacoes && m.anotacoes && m.anotacoes.trim().length > 0;
      const rowH = temNota ? 28 : 18;
      garantirEspaco(rowH + 4);

      const bg = idx % 2 === 0 ? [1, 1, 1] : [0.97, 0.98, 0.99];
      drawRect(MARGIN_X, curY - rowH, CONTENT_W, rowH, bg, [0.88, 0.9, 0.92]);

      drawText(String(idx + 1), MARGIN_X + 6, curY - 12, 8, false, [0.4, 0.4, 0.45]);
      drawText(truncarTexto(m.nome, 28), MARGIN_X + 24, curY - 12, 8.5, true, [0.12, 0.14, 0.18]);
      drawText(truncarTexto(m.setor, 17), MARGIN_X + 185, curY - 12, 8, false, [0.25, 0.3, 0.4]);

      const corPresenca = m.isPresente
        ? [0.06, 0.48, 0.24]
        : m.isFalta
        ? [0.75, 0.15, 0.15]
        : [0.68, 0.42, 0.05];
      drawText(m.statusPresencaLabel, MARGIN_X + 285, curY - 12, 8, true, corPresenca);

      if (incluirAvaliacoes) {
        drawText(
          m.classificacao || "-",
          MARGIN_X + 350,
          curY - 12,
          8,
          true,
          m.classificacao === "Ouro"
            ? [0.72, 0.52, 0.04]
            : m.classificacao === "Prata"
            ? [0.4, 0.45, 0.5]
            : m.classificacao === "Bronze"
            ? [0.65, 0.32, 0.1]
            : [0.55, 0.55, 0.55]
        );
      }

      drawText(
        formatarMoedaRelatorio(m.valor),
        MARGIN_X + 405,
        curY - 12,
        8,
        true,
        [0.15, 0.15, 0.2]
      );

      drawText(
        m.isPago ? "PAGO" : "PENDENTE",
        MARGIN_X + 462,
        curY - 12,
        8,
        true,
        m.isPago ? [0.06, 0.5, 0.24] : [0.72, 0.38, 0.05]
      );

      if (temNota) {
        drawText(
          `Obs: ${truncarTexto(m.anotacoes.replace(/\s+/g, " "), 95)}`,
          MARGIN_X + 24,
          curY - 23,
          7,
          false,
          [0.42, 0.42, 0.48]
        );
      }

      curY -= rowH;
    });
  }

  // Rodapé em todas as páginas
  if (cmds.length > 0) {
    pages.push(cmds.join("\n"));
  }

  // Monta estrutura de objetos PDF 1.4
  const objects = [];
  const addObj = (body) => {
    objects.push(body);
    return objects.length;
  };

  const fontRegularId = addObj(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"
  );
  const fontBoldId = addObj(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"
  );

  const pageIds = [];
  const pagesTreePlaceholderIdx = objects.length;
  addObj(""); // placeholder para /Pages

  const totalPages = pages.length;
  pages.forEach((pageContent, idx) => {
    const footerCmd = [
      "BT",
      "0.45 0.45 0.5 rg",
      "/F1 8 Tf",
      `1 0 0 1 ${MARGIN_X} 22 Tm`,
      `(${encodeWinAnsi(`Wadjet Segurança & Eventos - Relatório Oficial da Operação | Página ${idx + 1} de ${totalPages}`)}) Tj`,
      "ET",
    ].join("\n");

    const fullStream = pageContent + "\n" + footerCmd;
    const contentId = addObj(
      `<< /Length ${fullStream.length} >>\nstream\n${fullStream}\nendstream`
    );

    const pageId = addObj(
      `<< /Type /Page /Parent ${pagesTreePlaceholderIdx + 1} 0 R /MediaBox [0 0 ${PAGE_W.toFixed(2)} ${PAGE_H.toFixed(2)}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    pageIds.push(pageId);
  });

  objects[pagesTreePlaceholderIdx] = `<< /Type /Pages /Kids [${pageIds
    .map((id) => `${id} 0 R`)
    .join(" ")}] /Count ${pageIds.length} >>`;

  const catalogId = addObj(
    `<< /Type /Catalog /Pages ${pagesTreePlaceholderIdx + 1} 0 R >>`
  );

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  // Converte string binária 1 byte por caractere (Latin1 / WinAnsi) para Uint8Array
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) {
    bytes[i] = pdf.charCodeAt(i) & 0xff;
  }

  return new Blob([bytes], { type: "application/pdf" });
}

