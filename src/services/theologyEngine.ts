export interface TheologyRequest {
  mode: 'exegesis' | 'sermon' | 'prayer' | 'chat';
  prompt?: string;
  reference?: string;
  audience?: string;
  feelings?: string;
}

export interface TheologyResponse {
  result: string;
  source: 'gemini' | 'curated-theology';
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function buildTheologyPrompts(payload: TheologyRequest) {
  const { mode = 'exegesis', prompt = '', reference = '', audience = 'Geral', feelings = '' } = payload;

  const systemInstruction = `Você é um Doutor em Teologia Bíblica, Exegeta experiente nas línguas originais (Hebraico, Aramaico e Grego Koiné) e Pastor Sênior da plataforma Ecclesia. 
Sua missão é fornecer estudos profundos, fieis às Sagradas Escrituras, academicamente sólidos e pastoralmente edificantes.
Responda em Português do Brasil com excelente formatação em Markdown (títulos claros com emojis, subtítulos, listas ordenadas, destaques em negrito, citações bíblicas completas).
Nunca responda com frases vagas ou textos genéricos curtos. Entregue sempre um conteúdo completo, rico e detalhado.`;

  let userPrompt = '';

  if (mode === 'exegesis') {
    const targetRef = reference || prompt || 'João 3:16';
    userPrompt = `Realize uma EXEGESE BÍBLICA COMPLETA, PROFUNDA E MINUCIOSA da passagem: "${targetRef}".

Estruture rigorosamente sua resposta nas seguintes seções:

# 📖 Exegese Teológica e Análise Bíblica: ${targetRef}

## 1. 🏛️ Contexto Histórico, Cultural e Literário
- **Autor, Data e Destinatários Originais:** Quem escreveu, para quem, em que época e sob quais circunstâncias históricas/políticas.
- **Gênero Literário e Estrutura Textual:** Como o texto está inserido no livro e na narrativa bíblica geral.
- **Propósito Teológico da Passagem:** O que o autor inspirado pretendia comunicar à audiência original.

## 2. 📜 Análise Linguística e Palavras-Chave no Original (Grego/Hebraico)
- Analise pelo menos 3 palavras ou expressões centrais da passagem no idioma original (com caracteres originais, transliteração, significado léxico estrito e nuances teológicas).
- Sintaxe, tempos verbais ou figuras de linguagem marcantes no texto.

## 3. ✝️ Conexão Cristocêntrica e Teologia Bíblica
- Como esta passagem se conecta com o plano da redenção de Deus e aponta para a pessoa e obra de Jesus Cristo.
- Relação tipológica ou profética com o Antigo/Novo Testamento.

## 4. 💡 Síntese Exegética Versículo por Versículo
- Explicação versículo a versículo com comentários teológicos substanciais.

## 5. 🎯 Aplicações Práticas e Ministeriais Contemporâneas
1. **Vida Devocional e Fé Pessoal:** Como aplicar esta verdade no dia a dia.
2. **Vida em Comunidade e Família:** O impacto nas relações cristãs.
3. **Missão e Serviço Cristão:** O chamado prático para a igreja de hoje.

## 6. 🙏 Oração Pastoral Guiada e Versículo de Apoio
- Uma oração fervorosa para internalizar a mensagem do texto.
- Passagens bíblicas complementares para estudo cruzado.`;
  } else if (mode === 'sermon') {
    const targetTopic = prompt || reference || 'O Poder da Fé e da Perseverança';
    const targetAudience = audience || 'Igreja Geral';
    userPrompt = `Crie um ESBOÇO HOMILÉTICO EXPOSITIVO COMPLETO E DETALHADO de sermão bíblico sobre o tema/texto: "${targetTopic}", direcionado para o público: "${targetAudience}".

Estruture sua resposta nas seguintes seções:

# 📜 Esboço Homilético Expositivo: ${targetTopic}

## 🎯 Informações Gerais da Mensagem
- **Tema Central:** ${targetTopic}
- **Texto Bíblico Base:** (identifique e cite o texto principal com referências)
- **Textos de Apoio Cruzados:** (passagens correlatas do AT e NT)
- **Tese Homilética (Ideia Central):** Uma única frase marcante que resume a mensagem.
- **Objetivo do Sermão:** O que a congregação deve crer, sentir e praticar após ouvir esta palavra.

## 🌟 1. Introdução
- **Gancho de Abertura / Quebra-Gelo:** Uma história, metáfora ou pergunta provocativa para prender a atenção.
- **Problema Humano / Dilema Atual:** A tensão que o texto bíblico responde.
- **Transição Homilética:** Conexão clara entre a realidade dos ouvintes e a autoridade da Palavra.

## 📖 2. Corpo do Sermão (Divisões Principais)

### 📌 Ponto I: (Título do Ponto com Verbo no Presente)
- **Texto Bíblico Específico:**
- **Explicação Exegética:** O que o texto diz e significa.
- **Ilustração Prática:** Uma metáfora ou exemplo bíblico/cotidiano.
- **Aplicação Direta:** Como viver essa verdade hoje.

### 📌 Ponto II: (Título do Ponto com Verbo no Presente)
- **Texto Bíblico Específico:**
- **Explicação Exegética:** O que o texto diz e significa.
- **Ilustração Prática:** Uma metáfora ou exemplo bíblico/cotidiano.
- **Aplicação Direta:** Como viver essa verdade hoje.

### 📌 Ponto III: (Título do Ponto com Verbo no Presente)
- **Texto Bíblico Específico:**
- **Explicação Exegética:** O que o texto diz e significa.
- **Ilustração Prática:** Uma metáfora ou exemplo bíblico/cotidiano.
- **Aplicação Direta:** Como viver essa verdade hoje.

## 🏁 3. Conclusão e Apelo
- **Recapitulação dos Pontos Principais:** Síntese rápida e impactante.
- **Chamado à Ação / Apelo de Altar:** Desafio prático e espiritual para resposta imediata.
- **Oração Pastoral de Consagração:** Oração guiada para ministração ao final da pregação.`;
  } else if (mode === 'prayer') {
    const targetFeelings = feelings || prompt || 'Busca por paz, sabedoria e direção divina';
    userPrompt = `Escreva uma MINISTRAÇÃO PASTORAL E ORAÇÃO PROFUNDA para alguém que está vivenciando/sentindo: "${targetFeelings}".

Estruture com:
# 🙏 Ministração Pastoral e Oração Guiada

## 💖 Palavra de Encorajamento e Acolhimento
- Uma mensagem bíblica pastoral profunda que valida a dor/anseio e aponta para a fidelidade de Deus.

## 📖 Promessas Bíblicas de Sustento
- 3 versículos das Escrituras Sagradas completos e comentados que trazem paz e renovo para este momento.

## 🕊️ Oração Guiada em Primeira Pessoa
- Uma oração fervorosa, detalhada e inspirada no Espírito Santo que o irmão/irmã possa fazer em voz alta.

## 👣 Passos Práticos de Fé para os Próximos Dias
- 3 atitudes espirituais e práticas para manter o coração firme no Senhor.`;
  } else {
    userPrompt = `Pergunta/Dúvida Bíblico-Teológica: "${prompt}".
Forneça uma resposta rica, hermeneuticamente fundamentada, com citações bíblicas precisas, contextualização teológica e aplicação pastoral acolhedora.`;
  }

  return { systemInstruction, userPrompt };
}

/**
 * Rich offline/dynamic theological fallback generator
 * Generates highly structured, customized theological content when the API is offline
 */
export function generateContextualTheologyFallback(payload: TheologyRequest): string {
  const { mode = 'exegesis', prompt = '', reference = '', audience = 'Igreja Geral', feelings = '' } = payload;
  const rawSubject = (reference || prompt || feelings || 'A Palavra da Fé e Esperança').trim();

  if (mode === 'exegesis') {
    const ref = rawSubject || 'Romanos 8:28-39';
    return `# 📖 Exegese Teológica e Análise Bíblica: ${ref}

## 1. 🏛️ Contexto Histórico, Cultural e Literário
- **Autor e Ocasião:** Esta passagem faz parte da revelação inspirada pelo Espírito Santo através dos autores bíblicos para instruir, consolar e fundamentar a fé do povo da Aliança.
- **Contexto da Audiência:** Os primeiros destinatários viviam sob pressões culturais, espirituais e sociais, necessitando de uma firme ancoragem nas promessas soberanas de Deus.
- **Gênero Literário:** Texto de exortação e ensino doutrinário, combinando elementos teológicos com imperativos éticos e devocionais.

## 2. 📜 Análise Linguística e Palavras-Chave no Original
- **Hesed (חֶסֶד) / Agape (ἀγάπη):** O amor leal, pactual e incondicional de Deus que não se baseia no mérito humano, mas na Sua fidelidade eterna.
- **Emunah (אֱמוּנָה) / Pistis (πίστις):** Fé ativa, fidelidade firme e confiança absoluta na providência divina que resiste às provações do tempo presente.
- **Shalom (שָׁלוֹם) / Eirene (εἰρήνη):** Plenitude de paz, completude e bem-estar espiritual derivado da reconciliação com o Criador por meio da graça.

## 3. ✝️ Conexão Cristocêntrica
- Toda a Escritura converge para a pessoa de Jesus Cristo (*Lucas 24:27*). Nesta passagem, vemos a manifestação da redenção, onde o sacrifício perfeito de Cristo assegura a justificação, a santificação e a vitória final do crente sobre o pecado e o desânimo.

## 4. 💡 Síntese Exegética e Significado Central
- O texto comunica que Deus está ativamente soberano sobre a história e sobre as circunstâncias individuais de cada servo. Nenhuma aflição terrena tem o poder de anular o propósito pactual selado pelo sangue de Jesus.

## 5. 🎯 Aplicações Práticas e Ministeriais
1. **Descanso na Providência:** Entregue suas preocupações a Deus em oração diária, confiando que Ele faz cooperar todas as coisas para o bem daqueles que O amam.
2. **Santidade e Compromisso:** Viva com intencionalidade cristã, permitindo que a Palavra molde seus pensamentos, palavras e atitudes no ambiente familiar e profissional.
3. **Testemunho na Comunidade:** Fortaleça os irmãos através do discipulado, comunhão mútua e proclamação graciosa do Evangelho.

## 6. 🙏 Oração Pastoral Guiada
*"Senhor Deus e Pai Celeste, abre o meu entendimento e grava esta Palavra viva no mais íntimo do meu ser. Que o Teu Santo Espírito me conceda discernimento, ousadia e amor para caminhar em fidelidade todos os dias. Em nome de Jesus, Amém!"*

---
*Versículos de apoio para meditação cruzada: Salmos 119:105, Isaías 40:29-31, 2 Timóteo 3:16-17.*`;
  }

  if (mode === 'sermon') {
    const topic = rawSubject || 'Vencendo os Gigantes pela Fé';
    return `# 📜 Esboço Homilético Expositivo: ${topic}

## 🎯 Informações Gerais da Mensagem
- **Tema:** ${topic}
- **Público-Alvo:** ${audience}
- **Texto Base:** Hebreus 11:1-6 / Romanos 8:31-39 / Josué 1:6-9
- **Tese Central:** A verdadeira fé não é a ausência de lutas, mas a certeza inabalável da presença e do poder soberano de Deus em meio a qualquer desafio.
- **Objetivo:** Edificar a congregação, renovar a esperança e despertar um posicionamento prático de obediência e adoração.

---

## 🌟 1. Introdução
- **Gancho / Ilustração:** Vivemos em tempos em que incertezas materiais e emocionais tentam paralisar nosso coração. Assim como uma âncora que firma o barco nas ondas revoltas, a fidelidade de Deus nos sustenta.
- **O Problema:** Como permanecer firme quando os recursos humanos se esgotam e o medo bate à porta?
- **Proposição:** A Palavra de Deus nos revela três fundamentos para triunfar em fé.

---

## 📖 2. Corpo da Mensagem

### 📌 I. Reconhecer a Soberania e a Fidelidade de Deus
- **Fundamento Bíblico:** *Lamentações 3:22-24* — "As misericórdias do Senhor são a causa de não sermos consumidos."
- **Explicação:** Nossa estabilidade espiritual não depende das circunstâncias ao redor, mas do caráter imutável de Deus.
- **Aplicação:** Pare de olhar para o tamanho do problema e contemple a grandeza dAquele que cuida de você.

### 📌 II. Assumir uma Postura de Obediência e Oração
- **Fundamento Bíblico:** *Filipenses 4:6-7* — "Não andeis ansiosos por coisa alguma; antes, as vossas petições sejam conhecidas diante de Deus."
- **Explicação:** A fé bíblica se manifesta em oração perseverante e em passos diários de consagração e obediência.
- **Aplicação:** Estabeleça um altar diário de oração em sua casa e entregue suas decisões ao Senhor.

### 📌 III. Apropriar-se da Vitória Selada em Cristo Jesus
- **Fundamento Bíblico:** *1 Coríntios 15:57* — "Graças a Deus, que nos dá a vitória por nosso Senhor Jesus Cristo."
- **Explicação:** Na cruz, Jesus já venceu a condenação, a desesperança e o poder da morte. Somos mais que vencedores por meio d’Ele.
- **Aplicação:** Caminhe em autoridade espiritual, perdoe, ame e persevere com ousadia santa.

---

## 🏁 3. Conclusão e Apelo ao Altar
- **Recapitulação:** Deus é fiel, a oração transforma circunstâncias e a vitória em Cristo é certa.
- **Chamado Prático:** Convite aos que precisam de renovo espiritual, reconciliação ou força para vencer uma batalha específica.
- **Oração de Ministração:** *"Pai, reveste Teu povo com poder, quebrantamento e fé renovada. Que esta palavra produza frutos de vida eterna. Em nome de Jesus!"*`;
  }

  if (mode === 'prayer') {
    const feeling = rawSubject || 'Paz, cura interior e clareza de propósito';
    return `# 🙏 Ministração Pastoral e Oração Guiada: ${feeling}

## 💖 Palavra Pastoral de Encorajamento
Irmão(ã), o Senhor conhece as profundezas do seu coração, cada lágrima silenciosa e cada anseio por direção. A Bíblia nos garante que *o Senhor está perto dos que têm o coração quebrantado e salva os de espírito abatido (Salmo 34:18)*. Você não está desamparado(a).

## 📖 Promessas Bíblicas para o seu Coração
1. **Isaías 41:10:** *"Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça."*
2. **João 14:27:** *"Deixo-vos a paz, a minha paz vos dou; não vo-la dou como o mundo a dá. Não se turbe o vosso coração, nem se atemorize."*
3. **Salmo 46:1:** *"Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia."*

## 🕊️ Oração Guiada (Ore em Voz Alta)
*"Querido Deus e Pai de amor, coloco a minha vida, a minha mente e as minhas emoções no Teu altar neste momento. Confesso que diante de ${feeling}, as minhas forças humanas são limitadas, mas o Teu poder se aperfeiçoa na minha fraqueza.
Derrama sobre mim a Tua paz que excede todo o entendimento. Dissipa toda angústia, dúvida e medo. Restaura o meu ânimo, renova a minha esperança e guia os meus passos pelo Teu Santo Espírito.
Eu declaro que o Teu favor me cerca como um escudo e que o Teu plano para mim é de paz e vitória. Em nome de Jesus Cristo, Amém!"*

## 👣 Próximos Passos de Fé
- Separe 15 minutos hoje para louvar a Deus em secreto e ler o Salmo 91.
- Compartilhe seu pedido de oração com irmãos maduros na fé para apoio mútuo.
- Descanse sabendo que Aquele que começou a boa obra em você a completará.`;
  }

  return `# 💬 Resposta Teológica Pastoral
A paz do Senhor! Sobre a sua consulta referente a **"${rawSubject}"**:

A Escritura Sagrada nos ensina que a revelação de Deus é suficiente, infalível e viva (*Hebreus 4:12*). Ao meditar neste tema, lembre-se de que a graça de Deus nos capacita para toda boa obra (*2 Timóteo 3:16-17*). Busque ao Senhor em oração contínua, comunhão com o corpo de Cristo e estudo dedicado da Palavra, e Ele guiará os seus caminhos em verdade e santidade.`;
}
