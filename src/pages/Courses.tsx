import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Award,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  Share2,
  Sparkles,
  Plus,
  X,
  Search,
  Lock,
  ShieldCheck,
  Trophy,
  ExternalLink,
  FolderOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useTheme } from '../lib/ThemeContext';
import {
  Course,
  CourseLesson,
  CourseProgress,
  CourseCertificate,
  DEFAULT_COURSES,
  DEFAULT_DRIVE_COURSES_URL,
  subscribeToCourses,
  subscribeToUserCourseProgress,
  subscribeToUserCertificates,
  toggleCourseLessonComplete,
  issueCourseCertificate,
  createCustomCourse,
} from '../services/courseService';

const CATEGORIES = ['Todos', 'Discipulado', 'Liderança', 'Teologia', 'Ministério'] as const;

export default function Courses() {
  const { churchName } = useTheme();
  const currentUser = auth.currentUser;
  const userId = currentUser?.uid || '';

  const [courses, setCourses] = useState<Course[]>(DEFAULT_COURSES);
  const [progressMap, setProgressMap] = useState<Record<string, CourseProgress>>({});
  const [certificates, setCertificates] = useState<CourseCertificate[]>([]);
  const [activeTab, setActiveTab] = useState<'catalog' | 'certificates'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Course player state
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [isIssuingCert, setIsIssuingCert] = useState(false);

  // Certificate modal
  const [previewCertificate, setPreviewCertificate] = useState<CourseCertificate | null>(null);

  // Admin state & create modal
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newCategory, setNewCategory] = useState<Course['category']>('Discipulado');
  const [newInstructor, setNewInstructor] = useState('Pr. Rudson');
  const [newHours, setNewHours] = useState(6);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonRef, setNewLessonRef] = useState('');
  const [newLessonContent, setNewLessonContent] = useState('');
  const [newDriveUrl, setNewDriveUrl] = useState('');
  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [globalDriveUrl, setGlobalDriveUrl] = useState<string>(DEFAULT_DRIVE_COURSES_URL);

  useEffect(() => {
    const unsubCourses = subscribeToCourses(setCourses);
    const unsubProgress = subscribeToUserCourseProgress(userId, setProgressMap);
    const unsubCerts = subscribeToUserCertificates(userId, setCertificates);
    const unsubConfig = onSnapshot(doc(db, 'settings', 'church_config'), (snap) => {
      if (snap.exists() && snap.data()?.coursesDriveUrl) {
        setGlobalDriveUrl(snap.data().coursesDriveUrl);
      }
    });

    if (currentUser) {
      if (currentUser.email === 'rudson.p48@gmail.com') {
        setIsAdmin(true);
      } else {
        getDoc(doc(db, 'admins', currentUser.uid))
          .then((snap) => setIsAdmin(snap.exists()))
          .catch(() => setIsAdmin(false));
      }
    }

    return () => {
      unsubCourses();
      unsubProgress();
      unsubCerts();
      unsubConfig();
    };
  }, [userId, currentUser]);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesCat = selectedCategory === 'Todos' || c.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        c.instructor.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [courses, selectedCategory, searchQuery]);

  const getCourseStats = (course: Course) => {
    const prog = progressMap[course.id];
    const completedIds = prog?.completedLessonIds || [];
    const totalLessons = course.lessons.length || 1;
    const percent = Math.round((completedIds.length / totalLessons) * 100);
    const allLessonsDone = completedIds.length >= course.lessons.length;
    return {
      prog,
      completedIds,
      percent: Math.min(100, percent),
      allLessonsDone,
      hasCertificate: Boolean(prog?.certificateCode),
    };
  };

  const handleOpenCourse = (course: Course) => {
    setActiveCourse(course);
    setActiveLessonIndex(0);
    setShowQuiz(false);
    setQuizAnswers({});
    setQuizResult(null);
  };

  const handleToggleLesson = async (course: Course, lesson: CourseLesson) => {
    if (!userId) return;
    const updated = await toggleCourseLessonComplete({
      userId,
      courseId: course.id,
      lessonId: lesson.id,
      currentProgress: progressMap[course.id],
    });
    setProgressMap((prev) => ({ ...prev, [course.id]: updated }));
  };

  const handleCompleteAndNext = async (course: Course, lesson: CourseLesson) => {
    const stats = getCourseStats(course);
    if (!stats.completedIds.includes(lesson.id)) {
      await handleToggleLesson(course, lesson);
    }
    if (activeLessonIndex < course.lessons.length - 1) {
      setActiveLessonIndex((prev) => prev + 1);
    } else {
      setShowQuiz(true);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!activeCourse) return;
    const questions = activeCourse.quiz;
    let correct = 0;
    questions.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) correct++;
    });
    const score = Math.round((correct / (questions.length || 1)) * 100);
    const passed = score >= 70;
    setQuizResult({ score, passed });

    if (passed) {
      setIsIssuingCert(true);
      try {
        const cert = await issueCourseCertificate({
          course: activeCourse,
          scorePercent: score,
          currentProgress: progressMap[activeCourse.id],
        });
        setPreviewCertificate(cert);
      } finally {
        setIsIssuingCert(false);
      }
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newLessonTitle.trim() || !newLessonContent.trim()) return;
    setIsSavingCourse(true);
    try {
      await createCustomCourse({
        title: newTitle.trim(),
        subtitle: newSubtitle.trim() || 'Formação ministerial para edificação da igreja.',
        category: newCategory,
        level: 'Iniciante',
        instructor: newInstructor.trim() || 'Equipe Pastoral',
        workloadHours: Number(newHours) || 4,
        driveUrl: newDriveUrl.trim() || globalDriveUrl,
        lessons: [
          {
            id: `lesson-${Date.now()}`,
            title: newLessonTitle.trim(),
            durationMinutes: 30,
            bibleReference: newLessonRef.trim() || undefined,
            summary: newSubtitle.trim() || newLessonTitle.trim(),
            content: newLessonContent.trim(),
          },
        ],
        quiz: [
          {
            id: 'q1',
            question: `Você concluiu o estudo de "${newTitle.trim()}" e está apto a aplicar os princípios aprendidos?`,
            options: [
              'Sim, conclui a aula e assumo o compromisso prático',
              'Ainda não concluí',
            ],
            correctIndex: 0,
          },
        ],
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewSubtitle('');
      setNewLessonTitle('');
      setNewLessonRef('');
      setNewLessonContent('');
      setNewDriveUrl('');
    } finally {
      setIsSavingCourse(false);
    }
  };

  const downloadCertificatePng = (cert: CourseCertificate) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 1120;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1600, 1120);
    bgGrad.addColorStop(0, '#0F0B1E');
    bgGrad.addColorStop(0.5, '#191330');
    bgGrad.addColorStop(1, '#0B0A14');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1600, 1120);

    // Outer & inner gold/purple borders
    ctx.strokeStyle = '#C084FC';
    ctx.lineWidth = 6;
    ctx.strokeRect(48, 48, 1504, 1024);

    ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(68, 68, 1464, 984);

    // Header
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FBBF24';
    ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
    ctx.fillText((churchName || 'MINISTÉRIO FRUTOS DO ESPÍRITO').toUpperCase(), 800, 160);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 64px Georgia, serif';
    ctx.fillText('CERTIFICADO DE CONCLUSÃO', 800, 250);

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '28px system-ui, -apple-system, sans-serif';
    ctx.fillText('Certificamos com alegria que', 800, 355);

    // Student Name
    ctx.fillStyle = '#E9D5FF';
    ctx.font = 'bold 62px Georgia, serif';
    ctx.fillText(cert.studentName, 800, 450);

    // Divider under student name
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(420, 478);
    ctx.lineTo(1180, 478);
    ctx.stroke();

    // Body text
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '30px system-ui, -apple-system, sans-serif';
    ctx.fillText('concluiu com êxito o curso de formação ministerial', 800, 550);

    ctx.fillStyle = '#FBBF24';
    ctx.font = 'bold 46px system-ui, -apple-system, sans-serif';
    ctx.fillText(cert.courseTitle, 800, 625);

    const formattedDate = new Date(cert.issuedAtIso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '26px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      `Carga horária: ${cert.workloadHours} horas  •  Emitido em ${formattedDate}`,
      800,
      700
    );

    // Signatures
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(260, 880);
    ctx.lineTo(660, 880);
    ctx.moveTo(940, 880);
    ctx.lineTo(1340, 880);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.fillText(cert.instructor, 460, 920);
    ctx.fillText(churchName || 'Ministério Frutos do Espírito', 1140, 920);

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '20px system-ui, -apple-system, sans-serif';
    ctx.fillText('Instrutor Responsável', 460, 952);
    ctx.fillText('Direção Pastoral', 1140, 952);

    // Verification Code
    ctx.fillStyle = '#C084FC';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`Código de Verificação: ${cert.code}`, 800, 1020);

    const link = document.createElement('a');
    link.download = `Certificado-${cert.courseId}-${cert.code}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleShareCertificate = async (cert: CourseCertificate) => {
    const text = `Concluí o curso "${cert.courseTitle}" no ${churchName || 'Ministério Frutos do Espírito'}! Certificado: ${cert.code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Meu Certificado', text });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(text);
      alert('Dados do certificado copiados para compartilhar!');
    } catch {}
  };

  // Course Detail / Lesson Player View
  if (activeCourse) {
    const stats = getCourseStats(activeCourse);
    const activeLesson = activeCourse.lessons[activeLessonIndex];
    const existingCert = certificates.find((c) => c.courseId === activeCourse.id);

    return (
      <div className="max-w-5xl mx-auto px-4 pt-4 pb-28 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setActiveCourse(null)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-white transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar aos Cursos
          </button>

          <div className="flex items-center gap-2">
            {(activeCourse.driveUrl || globalDriveUrl) && (
              <a
                href={activeCourse.driveUrl || globalDriveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 text-blue-200 text-xs sm:text-sm font-bold transition"
              >
                <FolderOpen className="w-4 h-4" />
                Materiais no Drive
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {existingCert && (
              <button
                onClick={() => setPreviewCertificate(existingCert)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-sm font-bold transition"
              >
                <Award className="w-4 h-4" />
                Ver Certificado
              </button>
            )}
          </div>
        </div>

        {/* Course Header */}
        <div className={`rounded-3xl p-6 bg-gradient-to-br ${activeCourse.coverGradient} relative overflow-hidden shadow-2xl`}>
          <div className="absolute inset-0 bg-black/35" />
          <div className="relative z-10 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-white">
                {activeCourse.category}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-black/30 text-[11px] font-semibold text-white/90">
                {activeCourse.workloadHours}h • {activeCourse.level}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">{activeCourse.title}</h1>
            <p className="text-sm text-white/85 max-w-2xl">{activeCourse.subtitle}</p>
            <div className="pt-2 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-white/90">
                <span>Progresso do curso ({stats.completedIds.length}/{activeCourse.lessons.length} aulas)</span>
                <span>{stats.percent}%</span>
              </div>
              <div className="h-2 rounded-full bg-black/30 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${stats.percent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lessons Sidebar */}
          <div className="lg:col-span-1 space-y-2.5">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-white/60 px-1">
              Módulos e Aulas
            </h2>
            {activeCourse.lessons.map((lesson, idx) => {
              const isDone = stats.completedIds.includes(lesson.id);
              const isCurrent = !showQuiz && idx === activeLessonIndex;
              return (
                <button
                  key={lesson.id}
                  onClick={() => {
                    setShowQuiz(false);
                    setActiveLessonIndex(idx);
                  }}
                  className={`w-full text-left p-3.5 rounded-2xl border transition flex items-start gap-3 ${
                    isCurrent
                      ? 'bg-purple-600/25 border-purple-400/50 text-white'
                      : 'bg-[#14141B]/90 border-white/10 hover:border-white/25 text-white/80'
                  }`}
                >
                  <span className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-white/30" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-snug">{lesson.title}</p>
                    <p className="text-[11px] text-white/50 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> {lesson.durationMinutes} min
                      {lesson.bibleReference && ` • ${lesson.bibleReference}`}
                    </p>
                  </div>
                </button>
              );
            })}

            {/* Final Quiz Button */}
            <button
              onClick={() => setShowQuiz(true)}
              className={`w-full text-left p-3.5 rounded-2xl border transition flex items-center gap-3 ${
                showQuiz
                  ? 'bg-amber-500/20 border-amber-400/60 text-amber-100'
                  : 'bg-[#14141B]/90 border-amber-400/30 hover:border-amber-400/60 text-amber-200'
              }`}
            >
              <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold">Avaliação & Certificado</p>
                <p className="text-[11px] text-amber-200/70">
                  {stats.hasCertificate
                    ? `Concluído (${stats.prog?.quizScore || 100}%)`
                    : stats.allLessonsDone
                    ? 'Liberado para emissão'
                    : 'Conclua as aulas para liberar'}
                </p>
              </div>
              {!stats.allLessonsDone && !stats.hasCertificate && (
                <Lock className="w-4 h-4 text-amber-300/60" />
              )}
            </button>
          </div>

          {/* Main Content: Lesson OR Quiz */}
          <div className="lg:col-span-2">
            {!showQuiz && activeLesson ? (
              <div className="rounded-3xl bg-[#14141B]/95 border border-white/10 p-6 space-y-5 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                      Aula {activeLessonIndex + 1} de {activeCourse.lessons.length}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-white mt-1">
                      {activeLesson.title}
                    </h2>
                  </div>
                  {activeLesson.bibleReference && (
                    <span className="px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-400/30 text-xs font-semibold text-purple-200">
                      📖 {activeLesson.bibleReference}
                    </span>
                  )}
                </div>

                {activeLesson.youtubeId && (
                  <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black">
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${activeLesson.youtubeId}`}
                      title={activeLesson.title}
                      allowFullScreen
                    />
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <p className="text-xs font-bold uppercase tracking-wider text-white/50 mb-1">Resumo da Aula</p>
                  <p className="text-sm text-white/85">{activeLesson.summary}</p>
                </div>

                <div className="text-sm sm:text-base text-white/90 leading-relaxed whitespace-pre-line">
                  {activeLesson.content}
                </div>

                <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => handleToggleLesson(activeCourse, activeLesson)}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition inline-flex items-center gap-2 ${
                      stats.completedIds.includes(activeLesson.id)
                        ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                        : 'bg-white/5 border-white/15 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {stats.completedIds.includes(activeLesson.id) ? 'Aula Concluída' : 'Marcar como Concluída'}
                  </button>

                  <button
                    onClick={() => handleCompleteAndNext(activeCourse, activeLesson)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-sm font-bold transition inline-flex items-center gap-2 shadow-lg"
                  >
                    {activeLessonIndex < activeCourse.lessons.length - 1
                      ? 'Concluir e Próxima Aula'
                      : 'Ir para Avaliação Final'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl bg-[#14141B]/95 border border-white/10 p-6 space-y-6 shadow-xl">
                <div className="border-b border-white/10 pb-4">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Avaliação Final
                  </span>
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-white mt-1">
                    Conquiste seu Certificado
                  </h2>
                  <p className="text-sm text-white/65 mt-1">
                    Acerte pelo menos 70% das questões para emitir o certificado oficial de {activeCourse.workloadHours}h.
                  </p>
                </div>

                {!stats.allLessonsDone && !stats.hasCertificate ? (
                  <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-center space-y-3">
                    <Lock className="w-8 h-8 text-amber-300 mx-auto" />
                    <p className="text-sm font-semibold text-amber-100">
                      Conclua todas as {activeCourse.lessons.length} aulas para liberar a avaliação final.
                    </p>
                    <button
                      onClick={() => setShowQuiz(false)}
                      className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-200 text-xs font-bold"
                    >
                      Voltar às Aulas
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {activeCourse.quiz.map((q, qIdx) => (
                      <div key={q.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                        <p className="text-sm font-bold text-white">
                          {qIdx + 1}. {q.question}
                        </p>
                        <div className="space-y-2">
                          {q.options.map((opt, oIdx) => {
                            const selected = quizAnswers[q.id] === oIdx;
                            return (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: oIdx }))}
                                className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-sm transition ${
                                  selected
                                    ? 'bg-purple-600/30 border-purple-400 text-white font-semibold'
                                    : 'bg-black/25 border-white/10 text-white/75 hover:border-white/25'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {quizResult && (
                      <div
                        className={`p-4 rounded-2xl border ${
                          quizResult.passed
                            ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-100'
                            : 'bg-rose-500/15 border-rose-400/40 text-rose-100'
                        }`}
                      >
                        <p className="font-bold text-sm">
                          {quizResult.passed
                            ? `Parabéns! Você atingiu ${quizResult.score}% e seu certificado foi emitido!`
                            : `Você atingiu ${quizResult.score}%. Revise as aulas e tente novamente (mínimo 70%).`}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      {existingCert && (
                        <button
                          onClick={() => setPreviewCertificate(existingCert)}
                          className="px-4 py-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-sm font-bold inline-flex items-center gap-2"
                        >
                          <Award className="w-4 h-4" />
                          Abrir Certificado Emitido
                        </button>
                      )}
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={
                          isIssuingCert ||
                          Object.keys(quizAnswers).length < activeCourse.quiz.length
                        }
                        className="ml-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 hover:brightness-110 disabled:opacity-50 text-white text-sm font-bold transition inline-flex items-center gap-2 shadow-lg"
                      >
                        <Award className="w-4 h-4" />
                        {isIssuingCert ? 'Emitindo Certificado...' : 'Finalizar e Emitir Certificado'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <CertificateModal
          certificate={previewCertificate}
          churchName={churchName}
          onClose={() => setPreviewCertificate(null)}
          onDownload={downloadCertificatePng}
          onShare={handleShareCertificate}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pt-4 pb-28 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Escola & Cursos</h1>
            <p className="text-xs sm:text-sm text-white/60">
              Capacitação bíblica e ministerial com certificado de conclusão
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/validar-certificado"
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/15 text-white/85 text-xs font-bold inline-flex items-center gap-1.5 transition"
          >
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            Validar
          </Link>
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-lg transition"
            >
              <Plus className="w-4 h-4" />
              Novo Curso
            </button>
          )}
        </div>
      </div>

      {/* Tabs: Cursos vs Meus Certificados */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#14141B] border border-white/10 w-fit">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'catalog'
              ? 'bg-purple-600 text-white shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Cursos ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab('certificates')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'certificates'
              ? 'bg-amber-500 text-black shadow'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Award className="w-4 h-4" />
          Meus Certificados ({certificates.length})
        </button>
      </div>

      {activeTab === 'catalog' ? (
        <>
          {/* Google Drive Materials Banner */}
          {globalDriveUrl && (
            <a
              href={globalDriveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 border border-blue-400/30 hover:border-blue-400/60 transition group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    Apostilas & Materiais dos Cursos (Google Drive)
                  </p>
                  <p className="text-xs text-white/65 truncate">
                    Acesse PDFs, slides e arquivos complementares liberados pelo ministério
                  </p>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-blue-500/25 text-blue-200 text-xs font-bold inline-flex items-center gap-1.5 shrink-0 group-hover:bg-blue-500 group-hover:text-white transition">
                Abrir Drive
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </a>
          )}

          {/* Search & Category Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cursos, trilhas ou professores..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#14141B]/90 border border-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/60"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition ${
                    selectedCategory === cat
                      ? 'bg-purple-600/30 border-purple-400 text-white'
                      : 'bg-white/5 border-white/10 text-white/65 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCourses.map((course) => {
              const stats = getCourseStats(course);
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl bg-[#14141B]/95 border border-white/10 overflow-hidden flex flex-col shadow-xl hover:border-purple-400/40 transition"
                >
                  <div className={`p-5 bg-gradient-to-br ${course.coverGradient} relative`}>
                    <div className="absolute inset-0 bg-black/25" />
                    <div className="relative z-10 flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-white uppercase tracking-wider">
                        {course.category}
                      </span>
                      {stats.hasCertificate ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-400 text-black text-[11px] font-bold inline-flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" /> Certificado Emitido
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-black/35 text-white/90 text-[11px] font-semibold">
                          {course.workloadHours}h • {course.lessons.length} aulas
                        </span>
                      )}
                    </div>
                    <h3 className="relative z-10 text-lg sm:text-xl font-display font-bold text-white mt-4 leading-snug">
                      {course.title}
                    </h3>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
                        {course.subtitle}
                      </p>
                      <p className="text-[11px] text-white/50 font-medium">
                        Instrutor: {course.instructor} • Nível {course.level}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-white/60 font-semibold">
                          <span>Progresso</span>
                          <span>{stats.percent}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-amber-400 rounded-full transition-all"
                            style={{ width: `${stats.percent}%` }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenCourse(course)}
                        className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-purple-600 text-white text-sm font-bold transition flex items-center justify-center gap-2"
                      >
                        <PlayCircle className="w-4 h-4" />
                        {stats.percent > 0 ? 'Continuar Curso' : 'Começar Curso'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {certificates.length === 0 ? (
            <div className="rounded-3xl bg-[#14141B]/90 border border-white/10 p-10 text-center space-y-3">
              <Award className="w-12 h-12 text-amber-400/70 mx-auto" />
              <h3 className="text-lg font-bold text-white">Nenhum certificado ainda</h3>
              <p className="text-sm text-white/60 max-w-md mx-auto">
                Conclua as aulas e a avaliação final de qualquer curso para emitir seu certificado oficial em PNG/PDF.
              </p>
              <button
                onClick={() => setActiveTab('catalog')}
                className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold"
              >
                Explorar Cursos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <div
                  key={cert.code}
                  className="rounded-3xl bg-gradient-to-br from-[#1C162D] to-[#12121A] border border-amber-400/30 p-5 space-y-4 shadow-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider font-bold text-amber-300">
                          Certificado Oficial
                        </p>
                        <h3 className="text-base font-bold text-white">{cert.courseTitle}</h3>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-white/70 space-y-1">
                    <p>Aluno(a): <span className="text-white font-semibold">{cert.studentName}</span></p>
                    <p>Carga horária: <span className="text-white font-semibold">{cert.workloadHours}h</span></p>
                    <p>Código: <span className="font-mono text-purple-300">{cert.code}</span></p>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setPreviewCertificate(cert)}
                      className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition"
                    >
                      Visualizar Certificado
                    </button>
                    <button
                      onClick={() => downloadCertificatePng(cert)}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold inline-flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      PNG
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Certificate Preview Modal */}
      <CertificateModal
        certificate={previewCertificate}
        churchName={churchName}
        onClose={() => setPreviewCertificate(null)}
        onDownload={downloadCertificatePng}
        onShare={handleShareCertificate}
      />

      {/* Admin Create Course Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.form
              onSubmit={handleCreateCourse}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-3xl bg-[#14141B] border border-white/15 p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Publicar Novo Curso
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <input
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Título do curso (ex: Batalha Espiritual)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white"
              />
              <input
                value={newSubtitle}
                onChange={(e) => setNewSubtitle(e.target.value)}
                placeholder="Descrição curta"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as Course['category'])}
                  className="px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white"
                >
                  <option value="Discipulado">Discipulado</option>
                  <option value="Liderança">Liderança</option>
                  <option value="Teologia">Teologia</option>
                  <option value="Ministério">Ministério</option>
                </select>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={newHours}
                  onChange={(e) => setNewHours(Number(e.target.value))}
                  placeholder="Carga horária (h)"
                  className="px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white"
                />
              </div>
              <input
                value={newInstructor}
                onChange={(e) => setNewInstructor(e.target.value)}
                placeholder="Instrutor"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white"
              />
              <input
                type="url"
                value={newDriveUrl}
                onChange={(e) => setNewDriveUrl(e.target.value)}
                placeholder="Link do Google Drive do curso (opcional)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white"
              />
              <div className="border-t border-white/10 pt-3 space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-purple-300">Aula 1</p>
                <input
                  required
                  value={newLessonTitle}
                  onChange={(e) => setNewLessonTitle(e.target.value)}
                  placeholder="Título da aula"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white"
                />
                <input
                  value={newLessonRef}
                  onChange={(e) => setNewLessonRef(e.target.value)}
                  placeholder="Referência bíblica (ex: Efésios 6:10-18)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white"
                />
                <textarea
                  required
                  rows={4}
                  value={newLessonContent}
                  onChange={(e) => setNewLessonContent(e.target.value)}
                  placeholder="Conteúdo completo da aula..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingCourse}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold"
              >
                {isSavingCourse ? 'Publicando...' : 'Publicar Curso'}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CertificateModal({
  certificate,
  churchName,
  onClose,
  onDownload,
  onShare,
}: {
  certificate: CourseCertificate | null;
  churchName: string;
  onClose: () => void;
  onDownload: (cert: CourseCertificate) => void;
  onShare: (cert: CourseCertificate) => void;
}) {
  if (!certificate) return null;

  const formattedDate = new Date(certificate.issuedAtIso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Certificado Verificado
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Visual Certificate Card */}
        <div className="rounded-3xl bg-gradient-to-br from-[#16102B] via-[#1F173B] to-[#0D0B16] border-2 border-purple-400/50 p-6 sm:p-10 text-center space-y-5 shadow-2xl relative overflow-hidden print:border-black print:bg-white print:text-black">
          <div className="absolute inset-3 rounded-2xl border border-amber-400/35 pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-300">
              {churchName || 'Ministério Frutos do Espírito'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white">
              Certificado de Conclusão
            </h2>
          </div>

          <p className="relative z-10 text-xs sm:text-sm text-white/75">
            Certificamos com alegria que
          </p>

          <div className="relative z-10 py-2 border-b border-purple-400/40 max-w-md mx-auto">
            <p className="text-2xl sm:text-3xl font-serif font-bold text-purple-200">
              {certificate.studentName}
            </p>
          </div>

          <div className="relative z-10 space-y-2">
            <p className="text-xs sm:text-sm text-white/80">
              concluiu com êxito o curso de formação ministerial
            </p>
            <p className="text-lg sm:text-2xl font-bold text-amber-300">
              {certificate.courseTitle}
            </p>
            <p className="text-xs text-white/70">
              Carga horária: <strong>{certificate.workloadHours} horas</strong> • Emitido em {formattedDate}
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-6 pt-6 max-w-lg mx-auto">
            <div className="border-t border-white/25 pt-2">
              <p className="text-xs font-bold text-white">{certificate.instructor}</p>
              <p className="text-[10px] text-white/55">Instrutor Responsável</p>
            </div>
            <div className="border-t border-white/25 pt-2">
              <p className="text-xs font-bold text-white">{churchName || 'Ministério Frutos do Espírito'}</p>
              <p className="text-[10px] text-white/55">Direção Pastoral</p>
            </div>
          </div>

          <p className="relative z-10 text-[11px] font-mono text-purple-300 pt-2">
            Código de Verificação: {certificate.code}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onDownload(certificate)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black text-sm font-bold inline-flex items-center gap-2 shadow-lg hover:brightness-110 transition"
          >
            <Download className="w-4 h-4" />
            Baixar Certificado (PNG)
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold inline-flex items-center gap-2 transition"
          >
            <Printer className="w-4 h-4" />
            Imprimir / PDF
          </button>
          <button
            onClick={() => onShare(certificate)}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold inline-flex items-center gap-2 transition"
          >
            <Share2 className="w-4 h-4" />
            Compartilhar
          </button>
        </div>
      </div>
    </div>
  );
}
