import { db, auth } from '../lib/firebase';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

export interface CourseLesson {
  id: string;
  title: string;
  durationMinutes: number;
  summary: string;
  content: string;
  bibleReference?: string;
  youtubeId?: string;
}

export interface CourseQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export const DEFAULT_DRIVE_COURSES_URL =
  'https://drive.google.com/drive/folders/1ddJ5O9okG8fex3Iq2msNPujnZriLdeTS?usp=drive_link';

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  category: 'Discipulado' | 'Liderança' | 'Teologia' | 'Ministério';
  level: 'Iniciante' | 'Intermediário' | 'Avançado';
  instructor: string;
  workloadHours: number;
  coverGradient: string;
  badgeLabel: string;
  driveUrl?: string;
  lessons: CourseLesson[];
  quiz: CourseQuizQuestion[];
  createdAt?: any;
}

export interface CourseProgress {
  courseId: string;
  userId: string;
  completedLessonIds: string[];
  quizPassed: boolean;
  quizScore?: number;
  completedAtIso?: string;
  certificateCode?: string;
}

export interface CourseCertificate {
  code: string;
  courseId: string;
  courseTitle: string;
  instructor: string;
  workloadHours: number;
  studentUid: string;
  studentName: string;
  studentEmail?: string;
  issuedAtIso: string;
}

export const DEFAULT_COURSES: Course[] = [
  {
    id: 'curso-fundamentos-fe',
    title: 'Fundamentos da Fé Cristã',
    subtitle: 'Primeiros passos no discipulado, vida de oração e identidade em Cristo.',
    category: 'Discipulado',
    level: 'Iniciante',
    instructor: 'Pr. Rudson & Equipe Pastoral',
    workloadHours: 6,
    coverGradient: 'from-purple-600 via-indigo-600 to-blue-700',
    badgeLabel: 'Essencial',
    lessons: [
      {
        id: 'ff-1',
        title: '1. O Novo Nascimento e a Graça de Deus',
        durationMinutes: 25,
        bibleReference: 'Efésios 2:8-10',
        summary: 'Entenda o significado da salvação pela graça mediante a fé e nossa nova identidade como filhos de Deus.',
        content:
          'A caminhada cristã começa não pelo esforço humano, mas pela graça revelada em Jesus Cristo. Em Efésios 2:8-10, Paulo nos lembra que somos feitura de Deus, criados em Cristo Jesus para as boas obras.\n\nPontos-chave:\n• A salvação é um presente gratuito recebido pela fé.\n• Em Cristo recebemos perdão, adoção e propósito eterno.\n• O novo nascimento transforma nossos desejos e direciona nossa vida para a glória de Deus.'
      },
      {
        id: 'ff-2',
        title: '2. A Palavra de Deus como Alicerce Diário',
        durationMinutes: 30,
        bibleReference: 'Salmos 119:105',
        summary: 'Como ler, meditar e aplicar as Escrituras no cotidiano de forma prática.',
        content:
          'A Bíblia não é apenas um livro histórico; ela é a Palavra viva de Deus que ilumina cada decisão. A prática diária da leitura devocional fortalece a fé e renova a mente.\n\nMétodo prático (O.I.A.):\n1. Observação: o que o texto diz?\n2. Interpretação: o que o texto significa no seu contexto?\n3. Aplicação: qual passo prático devo dar hoje?'
      },
      {
        id: 'ff-3',
        title: '3. Vida de Oração e Intimidade com o Pai',
        durationMinutes: 25,
        bibleReference: 'Mateus 6:6-13',
        summary: 'Aprendendo com a oração do Pai Nosso a desenvolver constância e comunhão.',
        content:
          'Orar é dialogar com o Pai celestial com sinceridade e reverência. Jesus ensinou no Pai Nosso um modelo completo: adoração, submissão à vontade de Deus, dependência diária, perdão e proteção espiritual.'
      },
      {
        id: 'ff-4',
        title: '4. Comunhão na Igreja e Batismo nas Águas',
        durationMinutes: 30,
        bibleReference: 'Atos 2:42-47',
        summary: 'A importância do Corpo de Cristo, da Ceia e do testemunho público pelo batismo.',
        content:
          'Ninguém cresce espiritualmente isolado. A igreja local é a família da fé onde servimos, somos corrigidos em amor e multiplicamos os frutos do Espírito.'
      }
    ],
    quiz: [
      {
        id: 'q1',
        question: 'Segundo Efésios 2:8-9, como recebemos a salvação?',
        options: [
          'Pelas nossas próprias obras e méritos',
          'Pela graça, mediante a fé, como dom de Deus',
          'Apenas por frequentar reuniões semanais'
        ],
        correctIndex: 1
      },
      {
        id: 'q2',
        question: 'Qual é o objetivo da aplicação prática no estudo bíblico?',
        options: [
          'Decorar versículos sem mudar atitudes',
          'Viver a Palavra de Deus nas decisões do dia a dia',
          'Substituir a oração pela leitura rápida'
        ],
        correctIndex: 1
      },
      {
        id: 'q3',
        question: 'Por que a comunhão na igreja local é indispensável?',
        options: [
          'Porque somos membros de um só Corpo e crescemos juntos em amor e serviço',
          'Apenas para cumprir uma tradição cultural',
          'Não é necessária após o batismo'
        ],
        correctIndex: 0
      }
    ]
  },
  {
    id: 'curso-escola-lideres',
    title: 'Escola de Líderes & Células',
    subtitle: 'Capacitação prática para liderança servidora, cuidado pastoral e multiplicação de células.',
    category: 'Liderança',
    level: 'Intermediário',
    instructor: 'Pr. Rudson & Liderança de Células',
    workloadHours: 10,
    coverGradient: 'from-amber-500 via-orange-600 to-rose-600',
    badgeLabel: 'Liderança',
    lessons: [
      {
        id: 'el-1',
        title: '1. O Caráter do Líder Segundo o Coração de Deus',
        durationMinutes: 35,
        bibleReference: 'Marcos 10:42-45',
        summary: 'Liderança cristã baseada em serviço, integridade e exemplo.',
        content:
          'Jesus redefiniu a grandeza no Reino: "Quem quiser tornar-se grande entre vocês deverá ser servo." Antes de liderar pessoas, o líder precisa ser guiado pelo Espírito Santo e manter integridade no secreto.'
      },
      {
        id: 'el-2',
        title: '2. Dinâmica de uma Célula Saudável',
        durationMinutes: 30,
        bibleReference: 'Romanos 12:9-16',
        summary: 'Quebra-gelo, louvor, compartilhamento da Palavra e oração mútua.',
        content:
          'Uma célula viva acolhe visitantes, promove comunhão sincera e gera discípulos. O líder facilita a participação de todos, evitando monólogos e estimulando a aplicação da Palavra.'
      },
      {
        id: 'el-3',
        title: '3. Formando Novos Líderes e Multiplicação',
        durationMinutes: 35,
        bibleReference: '2 Timóteo 2:2',
        summary: 'O princípio do discipulado geracional: investir em pessoas fiéis para multiplicar.',
        content:
          'Líderes saudáveis formam co-líderes desde o primeiro dia. Caminhar junto, delegar responsabilidades com amor e acompanhar de perto garante uma multiplicação alegre e frutífera.'
      }
    ],
    quiz: [
      {
        id: 'q1',
        question: 'Qual é o princípio central da liderança ensinada por Jesus em Marcos 10:45?',
        options: [
          'Autoritarismo e status',
          'Serviço humilde e entrega em amor',
          'Competição entre ministérios'
        ],
        correctIndex: 1
      },
      {
        id: 'q2',
        question: 'O que Paulo orienta em 2 Timóteo 2:2 sobre continuidade da liderança?',
        options: [
          'Centralizar todas as tarefas em uma única pessoa',
          'Transmitir o ensino a pessoas fiéis capazes de ensinar outros',
          'Evitar delegar responsabilidades'
        ],
        correctIndex: 1
      },
      {
        id: 'q3',
        question: 'Qual é o papel principal do líder durante a reunião da célula?',
        options: [
          'Facilitar a comunhão, o compartilhamento da Palavra e o cuidado mútuo',
          'Fazer um discurso longo sem ouvir os membros',
          'Substituir o culto de celebração da igreja'
        ],
        correctIndex: 0
      }
    ]
  },
  {
    id: 'curso-panorama-biblico',
    title: 'Panorama Bíblico Completo',
    subtitle: 'Compreenda a grande narrativa das Escrituras de Gênesis a Apocalipse centrada em Cristo.',
    category: 'Teologia',
    level: 'Intermediário',
    instructor: 'Departamento de Ensino Bíblico',
    workloadHours: 12,
    coverGradient: 'from-emerald-600 via-teal-600 to-cyan-700',
    badgeLabel: 'Teologia',
    lessons: [
      {
        id: 'pb-1',
        title: '1. Criação, Queda e Promessa da Redenção',
        durationMinutes: 35,
        bibleReference: 'Gênesis 1–3; 12:1-3',
        summary: 'A origem de todas as coisas, a entrada do pecado e a aliança com Abraão.',
        content:
          'Toda a Bíblia conta uma única história de redenção. Desde Gênesis 3:15 e a chamada de Abraão (Gênesis 12), Deus promete abençoar todas as famílias da terra por meio do Descendente prometido.'
      },
      {
        id: 'pb-2',
        title: '2. Êxodo, Lei, Reis e Profetas',
        durationMinutes: 40,
        bibleReference: 'Êxodo 19; Isaías 53',
        summary: 'A formação de Israel e as profecias messiânicas que apontam para Jesus.',
        content:
          'A libertação do Egito, o tabernáculo, os sacrifícios e a voz dos profetas preparam o caminho e apontam para o Cordeiro de Deus que tira o pecado do mundo.'
      },
      {
        id: 'pb-3',
        title: '3. Evangelhos, Igreja Primitiva e Nova Criação',
        durationMinutes: 40,
        bibleReference: 'Lucas 24:27; Apocalipse 21:1-5',
        summary: 'A obra consumada de Cristo, a missão da Igreja em Atos e a esperança eterna.',
        content:
          'Em Jesus todas as promessas encontram seu "Sim" e "Amém". Pela ação do Espírito Santo, a Igreja anuncia o Evangelho até os confins da terra aguardando Novos Céus e Nova Terra.'
      }
    ],
    quiz: [
      {
        id: 'q1',
        question: 'Qual é o fio condutor que une Antigo e Novo Testamento?',
        options: [
          'Apenas regras civis antigas',
          'O plano de redenção de Deus centrado em Jesus Cristo',
          'Histórias desconexas sem relação entre si'
        ],
        correctIndex: 1
      },
      {
        id: 'q2',
        question: 'Em Gênesis 12:3, o que Deus promete a Abraão?',
        options: [
          'Que por meio dele seriam benditas todas as famílias da terra',
          'Que ele nunca sairia de sua terra',
          'Que apenas uma cidade conheceria a Deus'
        ],
        correctIndex: 0
      },
      {
        id: 'q3',
        question: 'Como termina a grande narrativa bíblica em Apocalipse 21?',
        options: [
          'Com o esquecimento da criação',
          'Com Deus habitando eternamente com Seu povo em Novos Céus e Nova Terra',
          'Sem esperança de restauração'
        ],
        correctIndex: 1
      }
    ]
  },
  {
    id: 'curso-frutos-espirito',
    title: 'Os Frutos do Espírito na Prática',
    subtitle: 'Amadurecendo o caráter cristão segundo Gálatas 5:22-23 no lar, trabalho e ministério.',
    category: 'Ministério',
    level: 'Iniciante',
    instructor: 'Ministério Frutos do Espírito',
    workloadHours: 8,
    coverGradient: 'from-fuchsia-600 via-purple-600 to-violet-700',
    badgeLabel: 'Identidade',
    lessons: [
      {
        id: 'fe-1',
        title: '1. Amor, Alegria e Paz — A Raiz do Fruto',
        durationMinutes: 30,
        bibleReference: 'Gálatas 5:22-25',
        summary: 'Como o Espírito Santo produz amor ágape, alegria inabalável e paz que guarda o coração.',
        content:
          'Paulo usa "fruto" no singular: é uma unidade produzida pela permanência em Cristo (João 15:5). Quando andamos no Espírito, amor, alegria e paz governam nossa relação com Deus.'
      },
      {
        id: 'fe-2',
        title: '2. Longanimidade, Benignidade e Bondade',
        durationMinutes: 30,
        bibleReference: 'Colossenses 3:12-14',
        summary: 'Refletindo a paciência e a misericórdia de Cristo nos relacionamentos difíceis.',
        content:
          'O fruto do Espírito se torna visível principalmente sob pressão. Longanimidade é suportar com amor; benignidade e bondade são graça em movimento em favor do próximo.'
      },
      {
        id: 'fe-3',
        title: '3. Fidelidade, Mansidão e Domínio Próprio',
        durationMinutes: 30,
        bibleReference: '2 Pedro 1:5-8',
        summary: 'Constância na palavra dada, força sob controle e equilíbrio emocional e espiritual.',
        content:
          'Mansidão não é fraqueza, mas força submetida a Deus. Junto com a fidelidade e o domínio próprio, forma um caráter maduro e confiável para servir no Reino.'
      }
    ],
    quiz: [
      {
        id: 'q1',
        question: 'Por que Gálatas 5:22 usa a palavra "fruto" no singular?',
        options: [
          'Porque apenas uma virtude importa',
          'Porque todas as nove virtudes formam um único caráter produzido pelo Espírito Santo',
          'Porque depende apenas de temperamento natural'
        ],
        correctIndex: 1
      },
      {
        id: 'q2',
        question: 'Qual é o segredo para dar muito fruto segundo João 15:5?',
        options: [
          'Permanecer ligado em Cristo, a Videira Verdadeira',
          'Confiar exclusivamente na força própria',
          'Evitar contato com outras pessoas'
        ],
        correctIndex: 0
      },
      {
        id: 'q3',
        question: 'O que significa mansidão no contexto bíblico?',
        options: [
          'Covardia diante da verdade',
          'Força sob o controle e direção de Deus',
          'Indiferença aos problemas dos outros'
        ],
        correctIndex: 1
      }
    ]
  }
];

function getProgressStorageKey(userId: string) {
  return `ecclesia_course_progress_${userId}`;
}

function getCertStorageKey(userId: string) {
  return `ecclesia_course_certs_${userId}`;
}

function readLocalProgress(userId: string): Record<string, CourseProgress> {
  try {
    const raw = localStorage.getItem(getProgressStorageKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalProgress(userId: string, map: Record<string, CourseProgress>) {
  try {
    localStorage.setItem(getProgressStorageKey(userId), JSON.stringify(map));
  } catch {}
}

function readLocalCerts(userId: string): CourseCertificate[] {
  try {
    const raw = localStorage.getItem(getCertStorageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalCerts(userId: string, list: CourseCertificate[]) {
  try {
    localStorage.setItem(getCertStorageKey(userId), JSON.stringify(list));
  } catch {}
}

export function subscribeToCourses(callback: (courses: Course[]) => void) {
  const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const customCourses: Course[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      } as Course));

      const mergedMap = new Map<string, Course>();
      customCourses.forEach((c) => mergedMap.set(c.id, c));
      DEFAULT_COURSES.forEach((c) => {
        if (!mergedMap.has(c.id)) mergedMap.set(c.id, c);
      });
      callback(Array.from(mergedMap.values()));
    },
    () => {
      callback(DEFAULT_COURSES);
    }
  );
}

export function subscribeToUserCourseProgress(
  userId: string,
  callback: (progressMap: Record<string, CourseProgress>) => void
) {
  if (!userId) {
    callback({});
    return () => {};
  }

  // Emit local cache immediately for instant UI responsiveness
  callback(readLocalProgress(userId));

  const q = query(collection(db, 'course_progress'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const merged = { ...readLocalProgress(userId) };
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data() as CourseProgress;
        if (data?.courseId) {
          merged[data.courseId] = data;
        }
      });
      saveLocalProgress(userId, merged);
      callback(merged);
    },
    () => {
      callback(readLocalProgress(userId));
    }
  );
}

export function subscribeToUserCertificates(
  userId: string,
  callback: (certs: CourseCertificate[]) => void
) {
  if (!userId) {
    callback([]);
    return () => {};
  }

  callback(readLocalCerts(userId));

  const q = query(collection(db, 'course_certificates'), where('studentUid', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const map = new Map<string, CourseCertificate>();
      readLocalCerts(userId).forEach((c) => map.set(c.code, c));
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data() as CourseCertificate;
        if (data?.code) map.set(data.code, data);
      });
      const list = Array.from(map.values()).sort((a, b) =>
        b.issuedAtIso.localeCompare(a.issuedAtIso)
      );
      saveLocalCerts(userId, list);
      callback(list);
    },
    () => {
      callback(readLocalCerts(userId));
    }
  );
}

export async function toggleCourseLessonComplete(params: {
  userId: string;
  courseId: string;
  lessonId: string;
  currentProgress?: CourseProgress;
}): Promise<CourseProgress> {
  const existing = params.currentProgress || {
    courseId: params.courseId,
    userId: params.userId,
    completedLessonIds: [],
    quizPassed: false,
  };

  const already = existing.completedLessonIds.includes(params.lessonId);
  const completedLessonIds = already
    ? existing.completedLessonIds.filter((id) => id !== params.lessonId)
    : [...existing.completedLessonIds, params.lessonId];

  const updated: CourseProgress = {
    ...existing,
    userId: params.userId,
    courseId: params.courseId,
    completedLessonIds,
  };

  const localMap = readLocalProgress(params.userId);
  localMap[params.courseId] = updated;
  saveLocalProgress(params.userId, localMap);

  try {
    const docId = `${params.userId}_${params.courseId}`;
    await setDoc(
      doc(db, 'course_progress', docId),
      {
        ...updated,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.debug('[CourseService] Progress sync note:', err);
  }

  return updated;
}

export async function issueCourseCertificate(params: {
  course: Course;
  scorePercent: number;
  currentProgress?: CourseProgress;
}): Promise<CourseCertificate> {
  const user = auth.currentUser;
  if (!user) throw new Error('Faça login para emitir seu certificado.');

  const existingCode = params.currentProgress?.certificateCode;
  const year = new Date().getFullYear();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const code = existingCode || `MFE-${year}-${randomSuffix}`;
  const issuedAtIso = new Date().toISOString();

  const studentName =
    user.displayName || user.email?.split('@')[0] || 'Aluno(a) do Ministério';

  const certificate: CourseCertificate = {
    code,
    courseId: params.course.id,
    courseTitle: params.course.title,
    instructor: params.course.instructor,
    workloadHours: params.course.workloadHours,
    studentUid: user.uid,
    studentName,
    studentEmail: user.email || undefined,
    issuedAtIso,
  };

  const updatedProgress: CourseProgress = {
    courseId: params.course.id,
    userId: user.uid,
    completedLessonIds: params.course.lessons.map((l) => l.id),
    quizPassed: true,
    quizScore: params.scorePercent,
    completedAtIso: issuedAtIso,
    certificateCode: code,
  };

  // Persist locally immediately
  const localMap = readLocalProgress(user.uid);
  localMap[params.course.id] = updatedProgress;
  saveLocalProgress(user.uid, localMap);

  const localCerts = readLocalCerts(user.uid).filter((c) => c.code !== code);
  saveLocalCerts(user.uid, [certificate, ...localCerts]);

  try {
    await setDoc(
      doc(db, 'course_progress', `${user.uid}_${params.course.id}`),
      { ...updatedProgress, updatedAt: serverTimestamp() },
      { merge: true }
    );
    await setDoc(
      doc(db, 'course_certificates', code),
      { ...certificate, createdAt: serverTimestamp() },
      { merge: true }
    );
  } catch (err) {
    console.debug('[CourseService] Certificate Firestore sync note:', err);
  }

  return certificate;
}

export async function createCustomCourse(params: {
  title: string;
  subtitle: string;
  category: Course['category'];
  level: Course['level'];
  instructor: string;
  workloadHours: number;
  driveUrl?: string;
  lessons: CourseLesson[];
  quiz: CourseQuizQuestion[];
}) {
  const payload = {
    ...params,
    driveUrl: params.driveUrl?.trim() || '',
    coverGradient: 'from-purple-600 via-fuchsia-600 to-indigo-700',
    badgeLabel: params.category,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'courses'), payload);
  return ref.id;
}
