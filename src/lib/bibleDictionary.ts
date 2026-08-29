export interface DictionaryTerm {
  term: string;
  original: string; // Hebraico ou Grego
  transliteration: string;
  category: 'Teologia' | 'Lugares' | 'Doutrina' | 'Aliança' | 'Espírito Santo';
  definition: string;
  keyVerse: string;
}

export const BIBLE_DICTIONARY: DictionaryTerm[] = [
  {
    term: 'Graça',
    original: 'חֵן / χάρις',
    transliteration: 'Chen (Heb.) / Charis (Gr.)',
    category: 'Doutrina',
    definition: 'Favor imerecido de Deus concedido aos seres humanos para salvação, capacitação e transformação espiritual sem que haja qualquer mérito humano.',
    keyVerse: 'Efésios 2:8-9'
  },
  {
    term: 'Justificação',
    original: 'δικαίωσις',
    transliteration: 'Dikaiosis (Gr.)',
    category: 'Teologia',
    definition: 'Ato judicial de Deus pelo qual Ele declara o pecador perdoado e reto diante dEle, com base nos méritos perfeitos do sacrifício de Cristo.',
    keyVerse: 'Romanos 5:1'
  },
  {
    term: 'Paráclito',
    original: 'παράκλητος',
    transliteration: 'Parakletos (Gr.)',
    category: 'Espírito Santo',
    definition: 'Aquele chamado para estar ao lado; Consolador, Advogado, Auxiliador, Intercessor e Fortalecedor espiritual enviado pelo Pai.',
    keyVerse: 'João 14:16, 26'
  },
  {
    term: 'Shekinah',
    original: 'שכינה',
    transliteration: 'Shekhinah (Heb.)',
    category: 'Teologia',
    definition: 'A habitação visível e gloriosa da presença divina manifestada entre o Seu povo, como na nuvem no Tabernáculo e no Templo.',
    keyVerse: 'Êxodo 40:34-35'
  },
  {
    term: 'Ágape',
    original: 'ἀγάπη',
    transliteration: 'Agape (Gr.)',
    category: 'Doutrina',
    definition: 'O amor divino, incondicional, sacrificial e eterno de Deus que busca o bem supremo do outro independentemente de reciprocidade.',
    keyVerse: '1 Coríntios 13:4-8; 1 João 4:8'
  },
  {
    term: 'Shalom',
    original: 'שָׁלוֹם',
    transliteration: 'Shalom (Heb.)',
    category: 'Aliança',
    definition: 'Paz profunda, integridade, bem-estar, restauração, plenitude de vida e comunhão perfeita com o Criador.',
    keyVerse: 'Números 6:24-26; Filipenses 4:7'
  },
  {
    term: 'Redenção',
    original: 'ἀπολύτρωσις',
    transliteration: 'Apolytrosis (Gr.)',
    category: 'Doutrina',
    definition: 'Libertação do cativeiro do pecado e da morte mediante o pagamento do preço supremo: o sangue de Jesus Cristo.',
    keyVerse: 'Colossenses 1:14; 1 Pedro 1:18-19'
  },
  {
    term: 'Propiciação',
    original: 'ἱλασμός',
    transliteration: 'Hilasmos (Gr.)',
    category: 'Teologia',
    definition: 'O sacrifício expiatório que satisfaz plenamente a justiça santa de Deus e aplaca a Sua ira contra o pecado, reconciliando o homem com o Pai.',
    keyVerse: '1 João 2:2; Romanos 3:25'
  },
  {
    term: 'Betel',
    original: 'בֵּית־אֵל',
    transliteration: 'Beit-El (Heb.)',
    category: 'Lugares',
    definition: 'Casa de Deus. Lugar sagrado onde Jacó teve a visão da escada para o céu e renovou a aliança abraâmica com o Senhor.',
    keyVerse: 'Gênesis 28:17-19'
  },
  {
    term: 'Santificação',
    original: 'ἁγιασμός',
    transliteration: 'Hagiasmos (Gr.)',
    category: 'Doutrina',
    definition: 'Processo contínuo pelo qual o Espírito Santo purifica o crente do pecado, conformando-o à imagem e caráter de Cristo Jesus.',
    keyVerse: '1 Tessalonicenses 4:3; Hebreus 12:14'
  },
  {
    term: 'Querubins',
    original: 'כְּרוּבִים',
    transliteration: 'Keruvim (Heb.)',
    category: 'Teologia',
    definition: 'Seres celestiais de alta ordem associados à santidade inegociável de Deus, guardiões do trono divino e da Arca da Aliança.',
    keyVerse: 'Êxodo 25:18-22; Ezequiel 10'
  },
  {
    term: 'Maranata',
    original: 'μαρὰν ἀθά',
    transliteration: 'Maran-atha (Aram.)',
    category: 'Aliança',
    definition: 'Expressão aramaica da igreja primitiva que significa: "O nosso Senhor vem!" ou "Vem, Senhor Jesus!".',
    keyVerse: '1 Coríntios 16:22; Apocalipse 22:20'
  }
];
