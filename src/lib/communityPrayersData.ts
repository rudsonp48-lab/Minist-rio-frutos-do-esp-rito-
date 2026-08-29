export interface PrayerComment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content?: string;
  audioUrl?: string;
  audioDuration?: number;
  imageUrl?: string;
  createdAt: string;
  likes?: string[];
}

export type PostCategoryType = 
  | 'culto' 
  | 'noticia' 
  | 'video' 
  | 'oracao' 
  | 'testemunho' 
  | 'saude' 
  | 'familia' 
  | 'financas' 
  | 'espiritual' 
  | 'urgente' 
  | 'agradecimento' 
  | 'geral';

export interface CommunityPrayerPost {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  userPhoto?: string;
  title: string;
  content: string;
  category: PostCategoryType | string;
  isAnonymous: boolean;
  createdAtIso: string;
  likes: string[];
  commentsCount?: number;
  comments?: PrayerComment[];
  imageUrl?: string;
  imageUrls?: string[];
  videoUrl?: string;
  videoType?: 'file' | 'youtube' | 'external';
  videoThumbnail?: string;
  audioUrl?: string;
  audioDuration?: number;
  answered?: boolean;
  testimony?: string;
  isPinned?: boolean;
  location?: string;
  tags?: string[];
}

export const INITIAL_COMMUNITY_PRAYERS: CommunityPrayerPost[] = [
  {
    id: 'seed-culto-celebracao-domingo',
    userId: 'system-pastor-marcos',
    userName: 'Pr. Marcos Silva',
    userRole: 'Pastor Presidente',
    userPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    title: 'Relato do Culto de Celebração: Noite Poderosa de Salvação e Avivamento! 🔥🙌',
    content: 'Que noite gloriosa no Culto de Domingo! Tivemos mais de 14 pessoas entregando a vida a Jesus, o mover do Espírito Santo foi marcante no louvor e o Senhor curou muitos corações. Parabéns a toda a equipe de acolhimento e ao ministério de louvor pelo coração sacerdotal. Confira alguns registros deste mover!',
    category: 'culto',
    isAnonymous: false,
    createdAtIso: new Date(Date.now() - 3600000 * 2).toISOString(),
    likes: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8', 'user-9'],
    commentsCount: 4,
    isPinned: true,
    location: 'Templo Central - Culto da Noite',
    tags: ['#CultoDeDomingo', '#Avivamento', '#VidasParaCristo', '#IgrejaViva'],
    imageUrl: 'https://images.unsplash.com/photo-1519491050282-cf00c82424b4?auto=format&fit=crop&q=80&w=1200',
    imageUrls: [
      'https://images.unsplash.com/photo-1519491050282-cf00c82424b4?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&q=80&w=1200'
    ],
    comments: [
      {
        id: 'c1',
        userId: 'system-pra-sarah',
        userName: 'Pra. Sarah Oliveira',
        userPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        content: 'Foi inesquecível! A presença de Deus encheu a nave da igreja. Que alegria ver tantas famílias reconciliadas!',
        createdAt: 'Há 1 hora'
      },
      {
        id: 'c2',
        userId: 'system-carolina-mendes',
        userName: 'Carolina Mendes',
        userPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
        content: 'Glória a Deus pelas fotos! Minha mãe aceitou a Jesus nesse culto, que resposta de oração! 😭❤️',
        createdAt: 'Há 45 min'
      }
    ]
  },
  {
    id: 'seed-video-batismo-jovens',
    userId: 'system-lucas-worship',
    userName: 'Lucas Alencar',
    userRole: 'Ministério de Louvor & Jovens',
    userPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    title: 'VÍDEO: Melhores Momentos do Batismo nas Águas & Vigília Radical 🌊🎥',
    content: 'Compartilhando com toda a congregação o vídeo resumo do nosso último batismo nas águas e da noite de vigília dos jovens! Foram 28 novos irmãos descendo às águas batismais e confirmando sua aliança pública com Cristo. Aperte o play e sinta a unção desse momento!',
    category: 'video',
    isAnonymous: false,
    createdAtIso: new Date(Date.now() - 3600000 * 5).toISOString(),
    likes: ['user-1', 'user-3', 'user-4', 'user-8', 'user-10', 'user-12', 'user-15'],
    commentsCount: 3,
    location: 'Chácara Peniel & Templo',
    tags: ['#Batismo', '#JovensComProposito', '#NovaCriatura', '#Louvor'],
    videoUrl: 'https://www.youtube.com/watch?v=0k5iA5eQJ9A',
    videoType: 'youtube',
    videoThumbnail: 'https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&q=80&w=1200',
    comments: [
      {
        id: 'c3',
        userId: 'system-joao-lider',
        userName: 'João Batista',
        userPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
        content: 'Coisa linda ver a juventude apaixonada pela presença de Jesus! Parabéns a toda liderança!',
        createdAt: 'Há 3 horas'
      }
    ]
  },
  {
    id: 'seed-noticia-missoes-gospel',
    userId: 'system-pra-sarah',
    userName: 'Pra. Sarah Oliveira',
    userRole: 'Pastora de Missões & Ensino',
    userPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    title: 'Mundo Cristão: Cruzada no Sertão Nordestino leva Água e o Evangelho a 12 Povoados 🌍📖',
    content: 'Notícia de impacto do Reino: Nossos missionários parceiros no Sertão concluíram a perfuração de 3 poços artesianos e distribuíram mais de 1.500 Bíblias e cestas básicas nesta semana. Centenas de pessoas ouviram pela primeira vez as Boas Novas da Salvação. Continuemos orando e contribuindo com as missões no Brasil e no mundo!',
    category: 'noticia',
    isAnonymous: false,
    createdAtIso: new Date(Date.now() - 3600000 * 9).toISOString(),
    likes: ['user-2', 'user-5', 'user-6', 'user-9', 'user-11', 'user-14'],
    commentsCount: 2,
    location: 'Campo Missionário Sertão',
    tags: ['#Missoes', '#MundoGospel', '#EvangelhoPratico', '#SertaoParaCristo'],
    imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=1200',
    comments: [
      {
        id: 'c4',
        userId: 'system-pastor-marcos',
        userName: 'Pr. Marcos Silva',
        userPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        content: 'A igreja existe para missões! Que honra sermos braços de Deus alcançando o sertão.',
        createdAt: 'Há 6 horas'
      }
    ]
  },
  {
    id: 'seed-pra-sarah-curas',
    userId: 'system-pra-sarah',
    userName: 'Pra. Sarah Oliveira',
    userRole: 'Pastora de Ensino',
    userPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    title: 'Intercessão Urgente: Cirurgia e Recuperação da Irmã Tereza 🩺🕊️',
    content: 'Irmãos, peço oração pela irmã Tereza que fará um procedimento cirúrgico amanhã às 8h. Declaramos as mãos do Médico dos Médicos sobre os cirurgiões e uma recuperação rápida e sem dores.',
    category: 'saude',
    isAnonymous: false,
    createdAtIso: new Date(Date.now() - 3600000 * 14).toISOString(),
    likes: ['user-1', 'user-3', 'user-7', 'user-8', 'user-12'],
    commentsCount: 2,
    tags: ['#OracaoPelaSaude', '#CuraDivina', '#FamiliaNaFe'],
    comments: [
      {
        id: 'c5',
        userId: 'system-joao-lider',
        userName: 'João Batista',
        userPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
        content: 'Nossa célula já está em corrente de oração pela irmã Tereza! Vai dar tudo certo em nome de Jesus.',
        createdAt: 'Há 10 horas'
      }
    ]
  },
  {
    id: 'seed-lucas-worship-testemunho',
    userId: 'system-lucas-worship',
    userName: 'Lucas Alencar',
    userRole: 'Ministério de Louvor',
    userPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    title: 'TESTEMUNHO: Deus abriu as portas de emprego! 🎉💼',
    content: 'Gostaria de agradecer a todos que oraram por mim no mural mês passado. Depois de 6 meses procurando emprego na área de tecnologia, hoje fui contratado com um salário além do que pedi!',
    category: 'agradecimento',
    isAnonymous: false,
    answered: true,
    testimony: 'O Senhor honrou as nossas orações! Não desanimem nos momentos de prova.',
    createdAtIso: new Date(Date.now() - 3600000 * 20).toISOString(),
    likes: ['user-1', 'user-2', 'user-4', 'user-9', 'user-10', 'user-11', 'user-12', 'user-13'],
    commentsCount: 3,
    tags: ['#Testemunho', '#Vitoria', '#DeusProvedor'],
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200',
    comments: [
      {
        id: 'c6',
        userId: 'system-pastor-marcos',
        userName: 'Pr. Marcos Silva',
        userPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        content: 'Aleluia Lucas! Deus é fiel para cumprir todas as Suas promessas na vida dos que confiam Nele! 🎉🔥',
        createdAt: 'Há 18 horas'
      }
    ]
  }
];
