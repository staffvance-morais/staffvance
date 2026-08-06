export async function POST(request) {
  const dados = await request.json();

  // Dicionários de tradução
  const nomesCursos = {
    "nenhum": "Não possui curso em Segurança",
    "apoio": "Curso de Apoio e Segurança em Eventos",
    "extensao": "Extensão para Grandes Eventos"
  };

  const nomesUniformes = {
    "pp": "Tamanho PP",
    "p": "Tamanho P",
    "m": "Tamanho M",
    "g": "Tamanho G",
    "gg": "Tamanho GG"
  };

  const cursoFormatado = nomesCursos[dados.curso] || dados.curso;
  const uniformeFormatado = nomesUniformes[dados.uniforme] || dados.uniforme;

  // Formata a data de YYYY-MM-DD para DD/MM/YYYY para o padrão Brasil
  const dataFormatada = dados.dataNascimento 
    ? dados.dataNascimento.split('-').reverse().join('/') 
    : 'Não informada';

  // Bloco da foto
  const fotoHtml = dados.fotoUrl
    ? `<div style="margin-bottom: 20px;">
         <img src="${dados.fotoUrl}" alt="Foto de perfil de ${dados.nome}" style="width: 150px; height: 200px; object-fit: cover; border-radius: 8px; border: 1px solid #ccc;" />
       </div>`
    : `<p style="color: #777; font-style: italic;">O candidato não enviou foto de perfil.</p>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "StaffVance <onboarding@resend.dev>",
        to: "wadjetseguranca@gmail.com", 
        subject: `Novo candidato: ${dados.nome}`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-width: 600px;">
            <h2 style="color: #1db954;">Novo candidato cadastrado</h2>
            
            ${fotoHtml}

            <p><strong>Nome:</strong> ${dados.nome}</p>
            <p><strong>Email:</strong> ${dados.email}</p>
            <p><strong>WhatsApp:</strong> ${dados.whatsapp}</p>
            <p><strong>CPF:</strong> ${dados.cpf}</p>
            <p><strong>Data de Nascimento:</strong> ${dataFormatada}</p>
            <p><strong>Chave Pix:</strong> ${dados.chavePix}</p>
            <p><strong>Curso:</strong> ${cursoFormatado}</p>
            <p><strong>Uniforme:</strong> ${uniformeFormatado}</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #888;">Acesse o painel do Supabase para gestão completa.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const erro = await response.json();
      return Response.json({ error: erro }, { status: 500 });
    }

    return Response.json({ sucesso: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}