export const DEVOCIONAIS = [
  {
    title: "A Paz que Excede",
    verse: "E a paz de Deus, que excede todo o entendimento, guardará os vossos corações.",
    reference: "Filipenses 4:7",
    text: "Em meio às tempestades da vida, a ansiedade tenta tomar conta de nossa mente. Mas Deus nos oferece uma paz sobrenatural.",
    book: "Filipenses", chapter: 4, verseNumber: 7,
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600"
  },
  {
    title: "Nova Criatura",
    verse: "Assim que, se alguém está em Cristo, nova criatura é; as coisas velhas já passaram; eis que tudo se fez novo.",
    reference: "2 Coríntios 5:17",
    text: "O poder de Deus tem a capacidade de transformar nossa identidade por completo. Você foi renovado nEle.",
    book: "2 Coríntios", chapter: 5, verseNumber: 17,
    image: "https://images.unsplash.com/photo-1444464666168-49b626f86641?auto=format&fit=crop&q=80&w=600"
  },
  {
    title: "Força no Senhor",
    verse: "Posso todas as coisas em Cristo que me fortalece.",
    reference: "Filipenses 4:13",
    text: "Sua força pode ter limites, mas a força dAquele que habita em você é infinita. Repouse em Deus.",
    book: "Filipenses", chapter: 4, verseNumber: 13,
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600"
  },
  {
    title: "Caminho de Luz",
    verse: "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho.",
    reference: "Salmos 119:105",
    text: "Quando o futuro parecer escuro e incerto, a Palavra de Deus iluminará o próximo passo que você deve dar.",
    book: "Salmos", chapter: 119, verseNumber: 105,
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=600"
  },
  {
    title: "O Pote de Barro",
    verse: "Temos, porém, este tesouro em vasos de barro, para que a excelência do poder seja de Deus, e não de nós.",
    reference: "2 Coríntios 4:7",
    text: "Nossa fragilidade não é um obstáculo para Deus, mas sim o palco onde Ele demonstra a Sua glória e poder.",
    book: "2 Coríntios", chapter: 4, verseNumber: 7,
    image: "https://images.unsplash.com/photo-1610706240003-8868dfd0ea6a?auto=format&fit=crop&q=80&w=600"
  },
  {
    title: "Renovação Diária",
    verse: "As misericórdias do Senhor são a causa de não sermos consumidos, porque as suas misericórdias não têm fim; renovam-se cada manhã.",
    reference: "Lamentações 3:22-23",
    text: "Não importa como foi o seu ontem, o favor de Deus amanheceu junto com você no dia de hoje.",
    book: "Lamentações", chapter: 3, verseNumber: 22,
    image: "https://images.unsplash.com/photo-1498429152472-9a433d9ddf3b?auto=format&fit=crop&q=80&w=600"
  },
  {
    title: "Fé Valente",
    verse: "Espera no Senhor, anima-te, e ele fortalecerá o teu coração; espera, pois, no Senhor.",
    reference: "Salmos 27:14",
    text: "A coragem nem sempre é a ausência de medo, mas sim a certeza de que Deus está segurando sua mão enquanto você avança.",
    book: "Salmos", chapter: 27, verseNumber: 14,
    image: "https://images.unsplash.com/photo-1483726234545-481d6e8804cb?auto=format&fit=crop&q=80&w=600"
  },
  {
    title: "Refúgio Seguro",
    verse: "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.",
    reference: "Salmos 46:1",
    text: "Nas tempestades inesperadas, temos um porto seguro onde sempre podemos ancorar.",
    book: "Salmos", chapter: 46, verseNumber: 1,
    image: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&q=80&w=600"
  },
  {
    title: "Descanso Verdadeiro",
    verse: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.",
    reference: "Mateus 11:28",
    text: "Jesus nos convida a deixar o peso da ansiedade aos Seus pés e encontrar descanso verdadeiro para a alma.",
    book: "Mateus", chapter: 11, verseNumber: 28,
    image: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&q=80&w=600"
  },
  {
    title: "Amor Incondicional",
    verse: "Mas Deus prova o seu amor para conosco, em que Cristo morreu por nós, sendo nós ainda pecadores.",
    reference: "Romanos 5:8",
    text: "O Criador do universo não esperou que fôssemos perfeitos para nos abraçar com Sua graça.",
    book: "Romanos", chapter: 5, verseNumber: 8,
    image: "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&q=80&w=600"
  }
];

export const getDailyDevotional = () => {
    const now = new Date();
    // Atualiza o devocional às 8h da manhã
    const dateToUse = new Date(now);
    if (dateToUse.getHours() < 8) {
        dateToUse.setDate(dateToUse.getDate() - 1);
    }
    const start = new Date(dateToUse.getFullYear(), 0, 0);
    const diff = dateToUse.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    return DEVOCIONAIS[dayOfYear % DEVOCIONAIS.length];
};
