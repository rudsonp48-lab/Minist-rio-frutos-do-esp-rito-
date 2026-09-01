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
  const { mode = 'exegesis', prompt = '', reference = '', audience = 'Igreja Geral', feelings = '' } = payload;

  const systemInstruction = `Você é um Doutor em Teologia Bíblica, Exegeta experiente nas línguas bíblicas originais (Hebraico, Aramaico e Grego Koiné) e Pastor Sênior da plataforma Ecclesia. 
Sua missão é responder EXATAMENTE ao tema, versículo ou pergunta solicitada pelo usuário com fidelidade às Sagradas Escrituras, profundidade hermenêutica e aplicação pastoral edificante.
Responda sempre em Português do Brasil com formatação impecável em Markdown (títulos com emojis, subtítulos claros, listas ordenadas, destaques em negrito, citações de versículos bíblicos completos).
Nunca entregue respostas genéricas ou evasivas. Atenda com máxima precisão teológica o assunto exato que foi solicitado.`;

  let userPrompt = '';

  if (mode === 'exegesis') {
    const targetRef = (reference || prompt || 'João 3:16').trim();
    userPrompt = `Realize uma EXEGESE BÍBLICA COMPLETA, PROFUNDA E MINUCIOSA focada especificamente na seguinte passagem/tema: "${targetRef}".

Estruture sua resposta rigorosamente nas seguintes seções:

# 📖 Exegese Teológica e Análise Bíblica: ${targetRef}

## 1. 🏛️ Contexto Histórico, Cultural e Literário
- **Autor, Data e Destinatários Originais:** Quem escreveu, para quem, em que época e sob quais circunstâncias históricas/políticas.
- **Gênero Literário e Estrutura Textual:** Como o texto está inserido no livro e na narrativa bíblica geral.
- **Propósito Teológico da Passagem:** O que o autor inspirado pretendia comunicar à audiência original.

## 2. 📜 Análise Linguística e Palavras-Chave no Original (Grego/Hebraico)
- Analise pelo menos 3 palavras ou expressões centrais da passagem específica "${targetRef}" no idioma original (com caracteres originais, transliteração, significado léxico estrito e nuances teológicas).
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
    const targetTopic = (prompt || reference || 'O Poder da Fé e da Perseverança').trim();
    const targetAudience = audience || 'Igreja Geral';
    userPrompt = `Crie um ESBOÇO HOMILÉTICO EXPOSITIVO COMPLETO, DETALHADO E PRONTO PARA MINISTRAÇÃO sobre o tema específico: "${targetTopic}", direcionado para o público/ocasião: "${targetAudience}".

Estruture sua resposta rigorosamente nas seguintes seções:

# 📜 Esboço Homilético Expositivo: ${targetTopic}

## 🎯 Informações Gerais da Mensagem
- **Tema Central:** ${targetTopic}
- **Público-Alvo:** ${targetAudience}
- **Texto Bíblico Base:** (identifique e cite com precisão o texto principal e versículos correspondentes a ${targetTopic})
- **Textos de Apoio Cruzados:** (passagens correlatas do AT e NT)
- **Tese Homilética (Ideia Central da Mensagem):** Uma única frase marcante e memorável que resume a essência do sermão.
- **Objetivo do Sermão:** O que a congregação deve crer, sentir e praticar após ouvir esta palavra.

## 🌟 1. Introdução
- **Gancho de Abertura / Quebra-Gelo:** Uma história, metáfora ou pergunta provocativa para prender a atenção.
- **Problema Humano / Dilema Atual:** A tensão da vida real que este texto bíblico responde.
- **Transição Homilética:** Conexão clara entre a realidade dos ouvintes e a autoridade da Palavra de Deus.

## 📖 2. Corpo do Sermão (Divisões Principais)

### 📌 Ponto I: (Título do Ponto com Verbo no Presente focado no tema)
- **Texto Bíblico Específico:** (cite a referência e o versículo)
- **Explicação Exegética:** O que o texto bíblico diz e significa.
- **Ilustração Prática:** Uma metáfora ou exemplo bíblico/cotidiano.
- **Aplicação Direta:** Como viver essa verdade hoje.

### 📌 Ponto II: (Título do Ponto com Verbo no Presente focado no tema)
- **Texto Bíblico Específico:** (cite a referência e o versículo)
- **Explicação Exegética:** O que o texto bíblico diz e significa.
- **Ilustração Prática:** Uma metáfora ou exemplo bíblico/cotidiano.
- **Aplicação Direta:** Como viver essa verdade hoje.

### 📌 Ponto III: (Título do Ponto com Verbo no Presente focado no tema)
- **Texto Bíblico Específico:** (cite a referência e o versículo)
- **Explicação Exegética:** O que o texto bíblico diz e significa.
- **Ilustração Prática:** Uma metáfora ou exemplo bíblico/cotidiano.
- **Aplicação Direta:** Como viver essa verdade hoje.

## 🏁 3. Conclusão e Apelo
- **Recapitulação dos Pontos Principais:** Síntese rápida e impactante.
- **Chamado à Ação / Apelo de Altar:** Desafio prático e espiritual para resposta imediata.
- **Oração Pastoral de Consagração:** Oração guiada para ministração ao final da pregação.`;
  } else if (mode === 'prayer') {
    const targetFeelings = (feelings || prompt || 'Busca por paz, sabedoria e direção divina').trim();
    userPrompt = `Escreva uma MINISTRAÇÃO PASTORAL E ORAÇÃO PROFUNDA focada especificamente para quem está vivenciando: "${targetFeelings}".

Estruture com:
# 🙏 Ministração Pastoral e Oração Guiada: ${targetFeelings}

## 💖 Palavra de Encorajamento e Acolhimento
- Uma mensagem bíblica pastoral profunda que valida a situação e aponta para a fidelidade de Deus.

## 📖 Promessas Bíblicas de Sustento
- 3 versículos das Escrituras Sagradas completos e comentados que trazem paz e renovo para este momento exato.

## 🕊️ Oração Guiada em Primeira Pessoa
- Uma oração fervorosa, detalhada e inspirada no Espírito Santo que a pessoa possa fazer em voz alta.

## 👣 Passos Práticos de Fé para os Próximos Dias
- 3 atitudes espirituais e práticas para manter o coração firme no Senhor.`;
  } else {
    const query = (prompt || 'Dúvida Bíblica').trim();
    userPrompt = `Responda de forma completa, pastoral e biblicamente fundamentada à seguinte dúvida ou tema: "${query}".
Cite referências bíblicas explicadas, traga contexto teológico e termine com uma aplicação prática para a vida cristã.`;
  }

  return { systemInstruction, userPrompt };
}

/**
 * Intelligent context-aware theological engine that dynamically matches
 * Bible themes, books, verses and questions when external services are unavailable
 */
export function generateContextualTheologyFallback(payload: TheologyRequest): string {
  const { mode = 'exegesis', prompt = '', reference = '', audience = 'Igreja Geral', feelings = '' } = payload;
  const rawSubject = (reference || prompt || feelings || 'A Palavra de Deus e a Vida Cristã').trim();
  const lower = rawSubject.toLowerCase();

  // Knowledge base detection
  const isProdigo = lower.includes('pródigo') || lower.includes('prodigo') || lower.includes('lucas 15');
  const isSalmo91 = lower.includes('91') || lower.includes('refúgio') || lower.includes('refugio') || lower.includes('altíssimo');
  const isSalmo23 = lower.includes('23') || lower.includes('pastor') || lower.includes('nada me faltará');
  const isJoao316 = lower.includes('joão 3') || lower.includes('joao 3') || lower.includes('amou o mundo');
  const isRomanos8 = lower.includes('romanos 8') || lower.includes('vencedores') || lower.includes('todas as coisas cooperam');
  const isArmadura = lower.includes('armadura') || lower.includes('efésios 6') || lower.includes('efesios 6') || lower.includes('batalha espiritual');
  const isDizimo = lower.includes('dízimo') || lower.includes('dizimo') || lower.includes('oferta') || lower.includes('malaquias') || lower.includes('generosidade') || lower.includes('prosperidade');
  const isCasamento = lower.includes('casamento') || lower.includes('família') || lower.includes('familia') || lower.includes('cônjuge') || lower.includes('esposa') || lower.includes('marido');
  const isPerdao = lower.includes('perdão') || lower.includes('perdao') || lower.includes('reconciliação') || lower.includes('amargura') || lower.includes('magoa');
  const isAnsiedade = lower.includes('ansiedade') || lower.includes('medo') || lower.includes('depressão') || lower.includes('tristeza') || lower.includes('pânico') || lower.includes('angústia');
  const isEspiritoSanto = lower.includes('espírito santo') || lower.includes('espirito santo') || lower.includes('pentecostes') || lower.includes('dons') || lower.includes('fruto');
  const isFe = lower.includes('fé') || lower.includes('fe') || lower.includes('perseverança') || lower.includes('perseveranca') || lower.includes('hebreus 11');

  if (mode === 'exegesis') {
    if (isProdigo) {
      return `# 📖 Exegese Teológica e Análise Bíblica: A Parábola do Pai Amoroso e do Filho Pródigo (Lucas 15:11-32)

## 1. 🏛️ Contexto Histórico, Cultural e Literário
- **Autor e Ocasião:** Escrito pelo evangelista Lucas, médico gentio, apresentando Jesus como o Salvador misericordioso dos perdidos e marginalizados.
- **Audiência Original:** Fariseus e escribas que murmuravam porque Jesus acolhia e comia com publicanos e pecadores (*Lucas 15:1-2*).
- **Estrutura Literária:** É o clímax da trilogia de parábolas da redenção no capítulo 15 (a ovelha perdida, a dracma perdida e o filho perdido).
- **Propósito Teológico:** Revelar o coração escandalosamente gracioso de Deus Pai que corre ao encontro do pecador arrependido, contrastando com o legalismo religioso do irmão mais velho.

## 2. 📜 Análise Linguística e Palavras-Chave no Grego Koiné
- **Splagchnizomai (σπλαγχνίζομαι - Lc 15:20):** *"Moveu-se de íntima compaixão"*. Descreve uma comoção visceral profunda que move Deus à ação compassiva imediata.
- **Metanoia (μετάνοια - Lc 15:17):** *"Caindo em si"*. Não apenas remorso sentimental, mas uma mudança radical de mente e direção que conduz de volta ao Pai.
- **Charis (χάρις - Graça / Celebração):** O anel de autoridade, a melhor túnica e o novilho cevado simbolizam a restauração plena da filiação pela pura graça, sem período probatório de servidão.

## 3. ✝️ Conexão Cristocêntrica
- Jesus é o verdadeiro Filho Primogênito obediente que desceu da glória celeste não para rejeitar os pródigos, mas para buscá-los e resgatá-los ao custo da Sua própria vida na cruz.

## 4. 💡 Síntese Exegética Versículo por Versículo
- **vv. 11-16:** A ilusão da autonomia humana longe do Pai conduz à miséria, fome espiritual e degradação moral (cuidar de porcos).
- **vv. 17-20:** O retorno humilde: o arrependimento genuíno reconhece a indignidade pessoal perante o Céu.
- **vv. 20-24:** A corrida do Pai: na cultura judaica do 1º século, um patriarca correr quebrava o protocolo social de dignidade para proteger o filho da vergonha pública (*cerimônia de Qetzatsah*).
- **vv. 25-32:** O perigo do filho mais velho: estar na casa do Pai executando tarefas sem compreender o amor e a alegria do coração do Pai.

## 5. 🎯 Aplicações Práticas Contemporâneas
1. **Vida Devocional:** Nunca hesite em voltar para Deus quando falhar; o Pai está sempre aguardando na porteira com vestes de justiça e misericórdia.
2. **Vida em Comunidade:** A igreja deve ser um hospital de restauração que celebra a reconciliação dos perdidos, jamais um tribunal farisaico de condenação.
3. **Missão:** Alcance quem está afastado com o testemunho da graça acolhedora de Cristo.

## 6. 🙏 Oração Pastoral Guiada
*"Pai amado, obrigado porque o Teu amor é infinitamente maior do que os meus erros. Reconheço que longe de Ti nada sou. Lava o meu coração na Tua graça e ensina-me a amar o meu próximo com a mesma compaixão com que fui resgatado. Em nome de Jesus, Amém!"*`;
    }

    if (isSalmo91) {
      return `# 📖 Exegese Teológica e Análise Bíblica: Salmos 91 (O Esconderijo do Altíssimo)

## 1. 🏛️ Contexto Histórico e Teológico
- **Gênero Literário:** Salmo de Confiança e Proteção Divina, tradicionalmente atribuído a Moisés (conforme a tradição talmúdica após o Sl 90) ou a Davi em momentos de crise nacional.
- **Propósito:** Encorajar o povo de Deus a habitar continuamente na presença do Senhor diante de pestilências, guerras e emboscadas espirituais.

## 2. 📜 Análise Linguística e Palavras-Chave no Hebraico
- **Elyon (עֶלְיוֹן - v. 1):** *O Altíssimo* — Aquele que está soberano acima de todos os poderes terrenos e principados espirituais.
- **Shaddai (שַׁדַּי - v. 1):** *O Todo-Poderoso* — O Deus da provisão inesgotável e da suficiência total.
- **Sether (סֵתֶר - v. 1):** *Esconderijo / Lugar Secreto* — Comunhão íntima e inviolável no santuário da presença de Deus.
- **Metzudah (מְצוּדָה - v. 2):** *Fortaleza / Praça-forte* — Refúgio impenetrável nas rochas.

## 3. ✝️ Conexão Cristocêntrica
- Em *Mateus 4:6*, o inimigo citou este salmo distorcendo seu propósito. Cristo demonstrou que a verdadeira confiança no Pai não tenta a Deus, mas descansa em perfeita submissão à Sua soberana vontade. Em Jesus temos o refúgio eterno da alma.

## 4. 💡 Síntese Exegética
- **vv. 1-4:** A promessa de imunidade e abrigo sob as asas da fidelidade divina.
- **vv. 5-8:** Vitória sobre o medo do terror noturno e da peste ao meio-dia.
- **vv. 9-13:** A guarda dos anjos que sustentam os passos do justo.
- **vv. 14-16:** O oráculo divino: *"Pois que tão encarecidamente me amou, também eu o livrarei... com longura de dias o fartarei e lhe mostrarei a minha salvação."*

## 5. 🎯 Aplicações Práticas
1. **Oração e Paz:** Substitua o pânico pelas promessas da Palavra de Deus em dias de crise.
2. **Habitação Contínua:** Não visite o esconderijo apenas na calamidade; faça da presença de Deus a sua morada diária.

## 6. 🙏 Oração Pastoral
*"Senhor, Tu és o meu refúgio e a minha fortaleza. Nenhum mal me sucederá nem praga alguma chegará à minha tenda, pois confio no Teu poder protetor. Em nome de Jesus, Amém!"*`;
    }

    // Dynamic Exegesis for any custom passage
    return `# 📖 Exegese Teológica e Análise Bíblica: ${rawSubject}

## 1. 🏛️ Contexto Histórico, Cultural e Literário
- **Texto Analisado:** ${rawSubject}
- **Ambiente Histórico:** Esta passagem compõe a revelação canônica inspirada pelo Espírito Santo, dirigida ao povo de Deus para revelar Seu caráter santo, Suas alianças eternas e os imperativos de obediência e fé.
- **Gênero Literário:** Exposição bíblica doutrinária e pastoral, articulando a soberania de Deus com a responsabilidade e consolo do crente.

## 2. 📜 Análise Linguística e Palavras-Chave nos Idiomas Originais
- **Hebraico/Grego - Fidelidade (Emunah / Pistis):** Firmeza inabalável alicerçada no caráter fiel de Deus (*Deuteronômio 7:9 / Hebreus 11:1*).
- **Hebraico/Grego - Graça e Amor Pactual (Hesed / Agape):** A bondade imerecida e o favor leal de Deus que resgata, sustenta e capacita o ser humano.
- **Hebraico/Grego - Paz e Plenitude (Shalom / Eirene):** A harmonia restaurada entre o Criador e a criatura mediante a justificação pela fé.

## 3. ✝️ Conexão Cristocêntrica
- Toda a Escritura Sagrada testifica de Cristo (*João 5:39*). Esta passagem sobre **${rawSubject}** aponta para a consumação da redenção em Jesus, onde a justiça e a misericórdia se encontram perfeitamente na cruz.

## 4. 💡 Síntese Exegética e Significado Central
- O texto de **${rawSubject}** nos ensina que o propósito soberano de Deus prevalece sobre as limitações humanas. A fé autêntica se apoia na autoridade inerrante da Palavra e produz frutos de retidão, esperança e santificação.

## 5. 🎯 Aplicações Práticas Contemporâneas
1. **Fé Pessoal:** Medite continuamente nesta passagem e permita que a verdade transforme seus pensamentos e decisões.
2. **Comunidade e Família:** Transmita esses princípios às próximas gerações através do exemplo prático de amor e serviço.
3. **Perseverança:** Permaneça firme nas promessas divinas, sabendo que Aquele que prometeu é fiel para cumprir.

## 6. 🙏 Oração Pastoral Guiada
*"Senhor Deus Todo-Poderoso, ilumina os olhos do meu coração através do estudo de ${rawSubject}. Que a Tua Palavra seja lâmpada para os meus pés e luz para o meu caminho todos os dias da minha vida. Em nome de Jesus, Amém!"*`;
  }

  if (mode === 'sermon') {
    if (isProdigo) {
      return `# 📜 Esboço Homilético Expositivo: O Amor Incondicional do Pai (Lucas 15:11-32)

## 🎯 Informações Gerais da Mensagem
- **Tema Central:** A Graça que Restaura o Pródigo e Quebra a Religiosidade
- **Público-Alvo:** ${audience}
- **Texto Bíblico Base:** Lucas 15:11-32
- **Textos Cruzados:** Romanos 5:8, Efésios 2:4-9, 1 João 4:9-10
- **Tese Homilética:** Não há distância, pecado ou fracasso que o amor reconciliador de Deus Pai não possa alcançar e restaurar pela graça.
- **Objetivo:** Conduzir os afastados ao arrependimento e libertar a igreja do espírito farisaico de autojustificação.

---

## 🌟 1. Introdução
- **Gancho:** Quantas pessoas vivem hoje com a sensação de que destruíram tudo e não têm mais o direito de recomeçar?
- **O Dilema:** A religião humana diz: *"Pague o preço para ser aceito"*; o Evangelho de Jesus proclama: *"Venha como está, pois o preço já foi pago na cruz"*.
- **Transição:** Lucas 15 nos apresenta três personagens e três verdades eternas sobre o coração do Pai.

---

## 📖 2. Corpo do Sermão

### 📌 Ponto I: A Ilusão da Autonomia Longe de Deus
- **Texto:** *Lucas 15:13-14* — "Partiu para uma terra distante e lá desperdiçou todos os seus bens... e começou a passar necessidade."
- **Exegese:** O pecado promete liberdade, mas entrega escravidão moral e fome espiritual profunda.
- **Ilustração:** Como um peixe que pula para fora do aquário em busca de "liberdade" e encontra a morte.
- **Aplicação:** Identifique as áreas onde você tentou viver sem a direção de Deus e reconheça a sua necessidade d'Ele.

### 📌 Ponto II: O Poder do Arrependimento e a Corrida do Pai
- **Texto:** *Lucas 15:20* — "E, levantando-se, foi para seu pai. Vinha ele ainda longe, quando seu pai o avistou, e, compadecido dele, correndo, o abraçou e beijou."
- **Exegese:** O verbo grego *kataphileo* indica beijos repetidos de afeto e perdão irrevogável.
- **Ilustração:** O pai não esperou no trono para exigir explicações; correu para cobrir a vergonha do filho com a melhor túnica.
- **Aplicação:** Tome a decisão hoje de se levantar e voltar para a comunhão do Pai celestial.

### 📌 Ponto III: A Superação do Farisaísmo do Filho Mais Velho
- **Texto:** *Lucas 15:28-31* — "Ele se indignou e não queria entrar... Mas o pai lhe disse: Filho, tu sempre estás comigo, e tudo o que é meu é teu."
- **Exegese:** É possível estar dentro da igreja servindo fisicamente, mas com o coração amargurado e distante da alegria da graça.
- **Ilustração:** Trabalhadores que esquecem que são filhos amados e agem como empregados ressentidos.
- **Aplicação:** Celebre a vitória do seu irmão e viva na alegria da filiação legítima.

---

## 🏁 3. Conclusão e Apelo ao Altar
- **Recapitulação:** O Pai ama, perdoa, restaura e celebra a volta de cada filho.
- **Apelo:** Convite para os que querem voltar aos braços do Pai e para os que necessitam de cura no coração.
- **Oração de Ministração:** *"Pai Celeste, abre os braços da Tua misericórdia sobre cada vida aqui presente. Rompe correntes de culpa, cura feridas e renova a aliança com Teus filhos neste altar. Em nome de Jesus!"*`;
    }

    if (isSalmo91) {
      return `# 📜 Esboço Homilético Expositivo: Sob a Sombra do Onipotente (Salmos 91)

## 🎯 Informações Gerais da Mensagem
- **Tema Central:** A Segurança Inabalável na Presença de Deus
- **Público-Alvo:** ${audience}
- **Texto Bíblico Base:** Salmos 91:1-16
- **Textos Cruzados:** Filipenses 4:6-7, Isaías 43:1-3, Romanos 8:31-39
- **Tese Homilética:** Quem faz de Deus a sua habitação constante vence o medo, resiste às tempestades e descansa seguro no livramento do Altíssimo.
- **Objetivo:** Despertar a fé ousada, vencer a ansiedade e firmar a igreja na oração diária.

---

## 🌟 1. Introdução
- **Gancho:** Em um mundo marcado por incertezas globais e crises emocionais, onde você busca segurança real?
- **O Problema:** O perigo de confiar em forças materiais passageiras em vez de habitar no Senhor.
- **Transição:** O Salmo 91 nos revela o segredo dos que permanecem inabaláveis.

---

## 📖 2. Corpo do Sermão

### 📌 Ponto I: A Decisão de Fazer de Deus a sua Morada
- **Texto:** *Salmo 91:1-2* — "Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará."
- **Exegese:** "Habitar" (*Yashav*) não significa visitar casualmente nos domingos, mas estabelecer residência permanente na intimidade com Deus.
- **Aplicação:** Construa um altar diário de oração e devocional em sua casa.

### 📌 Ponto II: A Proteção Sobrenatural contra os Laços Ocultos
- **Texto:** *Salmo 91:3-6* — "Ele te livrará do laço do passarinheiro e da peste perniciosa... Não te assustarás do terror noturno."
- **Exegese:** Deus nos guarda das ameaças visíveis e das emboscadas invisíveis que tentam minar nossa fé.
- **Aplicação:** Não permita que o medo ou as notícias negativas paralisem o seu ministério e sua família.

### 📌 Ponto III: A Promessa Triunfante de Deus para os que o Amam
- **Texto:** *Salmo 91:14-15* — "Porque a mim se apegou com amor, eu o livrarei; pô-lo-ei a salvo, porque conhece o meu nome."
- **Exegese:** O livramento é resposta à intimidade pactual e ao conhecimento experimental de Deus.
- **Aplicação:** Declare o Nome de Jesus sobre as suas circunstâncias e caminhe em vitória.

---

## 🏁 3. Conclusão e Apelo ao Altar
- **Recapitulação:** Habite na presença, confie na proteção e aproprie-se das promessas eternas de Deus.
- **Apelo:** Oração de quebra de medo, ansiedade e renovação de aliança espiritual.`;
    }

    if (isDizimo) {
      return `# 📜 Esboço Homilético Expositivo: A Honra da Fidelidade e a Generosidade do Reino (Malaquias 3 & 2 Coríntios 9)

## 🎯 Informações Gerais da Mensagem
- **Tema Central:** Mordomia Cristã, Gratidão e Provisão Sobrenatural
- **Público-Alvo:** ${audience}
- **Texto Bíblico Base:** Malaquias 3:10 / 2 Coríntios 9:6-11 / Provérbios 3:9-10
- **Tese Homilética:** A fidelidade nos dízimos e ofertas não é um negócio com Deus, mas um ato supremo de adoração que reconhece a soberania d'Ele sobre todas as nossas conquistas.
- **Objetivo:** Ensinar a congregação a honrar ao Senhor com alegria, fé e generosidade bíblica.

---

## 🌟 1. Introdução
- **Gancho:** Jesus falou mais sobre o uso do coração em relação aos bens materiais do que sobre quase qualquer outro tema prático nos Evangelhos. Por que o bolso é o último reduto a ser convertido?
- **Transição:** A Bíblia estabelece princípios claros de honra, confiança e semeadura no Reino de Deus.

---

## 📖 2. Corpo do Sermão

### 📌 Ponto I: Honrar a Deus com as Primícias, Não com as Sobras
- **Texto:** *Provérbios 3:9-10* — "Honra ao Senhor com os teus bens e com as primícias de toda a tua renda."
- **Exegese:** Entregar as primícias manifesta que Deus ocupa o primeiro lugar incondicional na nossa vida.
- **Aplicação:** Coloque o Senhor em primeiro lugar no planejamento financeiro da sua família.

### 📌 Ponto II: O Princípio Espiritual da Semeadura Abundante
- **Texto:** *2 Coríntios 9:6-7* — "Aquele que semeia com fartura, com fartura também ceifará... Cada um dê conforme determinou em seu coração, não com tristeza ou por obrigação."
- **Exegese:** A generosidade alegre atrai a provisão do Deus que multiplica a sementeira do generoso.
- **Aplicação:** Seja um semeador intencional na obra missionária e no cuidado aos necessitados.

### 📌 Ponto III: As Janelas Abertas do Céu sobre os Fiéis
- **Texto:** *Malaquias 3:10* — "Trazei todos os dízimos à casa do tesouro... e provai-me nisto, diz o Senhor dos Exércitos, se não vos abrir as janelas do céu."
- **Exegese:** A fidelidade do crente liberta o coração da ganância e atrai a paz de saber que Deus é o nosso verdadeiro Provedor.
- **Aplicação:** Descanse na promessa de que o Senhor jamais deixará faltar o pão ao justo.

---

## 🏁 3. Conclusão e Apelo
- **Oração:** *"Senhor, consagramos nossas finanças, nosso trabalho e nossas vidas ao Teu Reino. Que sejamos canais de bênção e generosidade na terra. Em nome de Jesus!"*`;
    }

    // Dynamic Homiletical Outline for any custom theme
    return `# 📜 Esboço Homilético Expositivo: ${rawSubject}

## 🎯 Informações Gerais da Mensagem
- **Tema Central:** ${rawSubject}
- **Público-Alvo:** ${audience}
- **Texto Bíblico Base:** (Passagens selecionadas para ${rawSubject})
- **Textos de Apoio Cruzados:** Salmos 119:105, Romanos 12:1-2, Efésios 4:1-6
- **Tese Homilética:** A verdade das Sagradas Escrituras a respeito de **${rawSubject}** nos convida a uma transformação prática de mente e conduta pelo poder do Espírito Santo.
- **Objetivo:** Edificar a congregação com doutrina bíblica sólida, despertando fé, arrependimento e testemunho prático na sociedade.

---

## 🌟 1. Introdução
- **Gancho de Abertura:** Uma reflexão profunda sobre como a sociedade contemporânea enfrenta dilemas reais e como a Palavra de Deus oferece respostas eternas para **${rawSubject}**.
- **O Dilema Humano:** O conflito entre as opiniões passageiras do mundo e a verdade imutável das Escrituras.
- **Proposição Homilética:** A revelação de Deus nos oferece três fundamentos práticos para vivermos vitoriosamente este tema.

---

## 📖 2. Corpo do Sermão (Divisões Principais)

### 📌 Ponto I: O Fundamento Bíblico e o Propósito de Deus
- **Texto Bíblico:** Referência central aplicada a ${rawSubject}
- **Explicação Exegética:** O significado original do texto e a vontade de Deus expressa para o Seu povo.
- **Ilustração Prática:** Um exemplo bíblico de alguém que perseverou e confiou na promessa divina.
- **Aplicação Direta:** Como aplicar este primeiro princípio no cotidiano familiar e profissional.

### 📌 Ponto II: O Desafio da Obediência e da Fé Prática
- **Texto Bíblico:** Passagem de confronto e santificação relacionada a ${rawSubject}
- **Explicação Exegética:** A resposta que Deus espera do Seu servo quando confrontado pela verdade.
- **Ilustração Prática:** A diferença entre ouvir a Palavra e praticá-la ativamente nas tempestades.
- **Aplicação Direta:** Passos práticos para superar o comodismo e viver em obediência santa.

### 📌 Ponto III: A Promessa da Vitória e Frutificação no Espírito
- **Texto Bíblico:** Promessa de redenção e triunfo em Cristo Jesus
- **Explicação Exegética:** Como a graça de Deus nos capacita a triunfar onde nossas forças humanas falham.
- **Ilustração Prática:** O testemunho do crente que permanece firme e frutifica para a glória de Deus.
- **Aplicação Direta:** Assuma a sua posição em Cristo e seja um instrumento de bênção para sua geração.

---

## 🏁 3. Conclusão e Apelo ao Altar
- **Recapitulação:** Sintetize os pontos principais da mensagem sobre ${rawSubject}.
- **Chamado à Ação:** Desafio para consagração, arrependimento e oração fervorosa.
- **Oração Pastoral de Encerramento:** *"Senhor Deus, grava esta palavra em nossos corações. Que sejamos praticantes e não apenas ouvintes, manifestando a Tua glória em tudo o que fizermos. Em nome de Jesus, Amém!"*`;
  }

  if (mode === 'prayer') {
    return `# 🙏 Ministração Pastoral e Oração Guiada: ${rawSubject}

## 💖 Palavra Pastoral de Encorajamento
Irmão(ã) amado(a), o Senhor conhece perfeitamente o seu coração, suas lutas secretas e cada anseio por direção e paz em relação a **"${rawSubject}"**. A Bíblia nos consola afirmando que *o Senhor está perto de todos os que o invocam em verdade (Salmo 145:18)*. Você não está sozinho(a) nesta jornada.

## 📖 Promessas Bíblicas para o seu Coração
1. **Isaías 41:10:** *"Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça."*
2. **Filipenses 4:6-7:** *"Não andeis ansiosos de coisa alguma; em tudo, porém, sejam conhecidas diante de Deus as vossas petições... e a paz de Deus, que excede todo o entendimento, guardará os vossos corações e as vossas mentes em Cristo Jesus."*
3. **Salmo 34:17-18:** *"Clamam os justos, e o Senhor os escuta e os livra de todas as suas angústias. Perto está o Senhor dos que têm o coração quebrantado."*

## 🕊️ Oração Guiada (Ore em Voz Alta)
*"Querido Pai Celestial, achego-me à Tua presença com o coração aberto. Coloco diante do Teu altar a situação de ${rawSubject}. Confesso que com as minhas próprias forças sou limitado, mas o Teu poder se aperfeiçoa nas minhas fraquezas.
Derrama sobre mim a Tua paz inabalável, dissipa o medo, a incerteza e a opressão. Renova a minha esperança, fortalece a minha fé e guia cada um dos meus passos pelo Teu Santo Espírito.
Eu declaro que a Tua graça me basta e que Tu tens planos de bem e de vitória para a minha vida. Em nome de Jesus Cristo, Amém!"*

## 👣 Passos Práticos de Fé para os Próximos Dias
- **Altar de Oração Diário:** Separe 15 minutos diários para louvar e meditar no Salmo 91 e Salmo 23.
- **Comunhão e Apoio:** Compartilhe este momento com sua liderança ou pequeno grupo/célula para cobertura em oração.
- **Descanso na Promessa:** Guarde no coração a certeza de que Deus já está operando nos bastidores da sua história.`;
  }

  // CHAT / DÚVIDAS BÍBLICAS
  return `# 💬 Resposta Teológica Pastoral: ${rawSubject}

A paz do Senhor! Sobre a sua dúvida referente a **"${rawSubject}"**:

## 📖 1. Fundamento nas Sagradas Escrituras
A Bíblia Sagrada é a nossa única regra inerrante de fé e prática (*2 Timóteo 3:16-17*). Quando examinamos o tema de **${rawSubject}** à luz da totalidade das Escrituras, encontramos princípios claros:
- **A Revelação e Soberania de Deus:** Deus se revela através de Sua Palavra e deseja que Seus filhos compreendam Sua vontade com sabedoria espiritual (*Colossenses 1:9*).
- **O Cumprimento em Cristo:** Em Jesus Cristo, todas as promessas e orientações encontram o seu pleno sentido redentivo (*2 Coríntios 1:20*).

## 💡 2. Contexto Teológico e Histórico
Na teologia cristã histórica, compreender **${rawSubject}** requer equilibrar a sã doutrina com a graça prática. A hermenêutica bíblica nos ensina a interpretar passagens difíceis à luz de textos mais claros da Escritura, sempre preservando a centralidade do Evangelho, o amor a Deus e o amor ao próximo.

## 🎯 3. Aplicação Prática para a sua Vida Cristã
1. **Oração e Discernimento:** Busque ao Espírito Santo em oração contínua antes de tomar decisões nesta área.
2. **Estudo Frequente:** Examine os textos bíblicos correlatos com um coração ensinável e humilde.
3. **Vivência em Comunhão:** Converse com sua liderança pastoral e irmãos maduros na fé para apoio e edificação mútua.

Que o Senhor abençoe ricamente os seus estudos e a sua caminhada espiritual! Se tiver mais perguntas sobre passagens ou aplicações práticas deste tema, estou à sua disposição.`;
}
