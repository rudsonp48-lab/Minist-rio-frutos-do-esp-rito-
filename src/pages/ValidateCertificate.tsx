import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Award, AlertCircle, ChevronLeft } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { CourseCertificate } from '../services/courseService';

export default function ValidateCertificate() {
  const [searchParams] = useSearchParams();
  const [codeInput, setCodeInput] = useState(searchParams.get('code') || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CourseCertificate | null>(null);
  const [notFound, setNotFound] = useState(false);

  const verifyCode = async (rawCode: string) => {
    const normalized = rawCode.trim().toUpperCase();
    if (!normalized) return;
    setLoading(true);
    setNotFound(false);
    setResult(null);

    try {
      const snap = await getDoc(doc(db, 'course_certificates', normalized));
      if (snap.exists()) {
        setResult(snap.data() as CourseCertificate);
        setLoading(false);
        return;
      }

      // Check local fallback cache for current user
      const uid = auth.currentUser?.uid;
      if (uid) {
        const raw = localStorage.getItem(`ecclesia_course_certs_${uid}`);
        const list: CourseCertificate[] = raw ? JSON.parse(raw) : [];
        const localMatch = list.find((c) => c.code.toUpperCase() === normalized);
        if (localMatch) {
          setResult(localMatch);
          setLoading(false);
          return;
        }
      }

      setNotFound(true);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initial = searchParams.get('code');
    if (initial) verifyCode(initial);
  }, [searchParams]);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-28 space-y-6">
      <Link
        to="/courses"
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-white transition"
      >
        <ChevronLeft className="w-4 h-4" />
        Voltar para Cursos
      </Link>

      <div className="rounded-3xl bg-[#14141B]/95 border border-white/10 p-6 sm:p-8 space-y-5 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-white">
              Validar Certificado
            </h1>
            <p className="text-xs sm:text-sm text-white/60">
              Confirme a autenticidade de certificados emitidos pelo Ministério Frutos do Espírito
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            verifyCode(codeInput);
          }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="Digite o código (ex: MFE-2026-ABCD)"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/15 text-sm font-mono text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !codeInput.trim()}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-bold transition"
          >
            {loading ? 'Verificando...' : 'Validar'}
          </button>
        </form>

        {result && (
          <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
              <Award className="w-5 h-5" />
              Certificado Autêntico e Válido
            </div>
            <div className="text-sm text-white/85 space-y-1">
              <p>Aluno(a): <strong className="text-white">{result.studentName}</strong></p>
              <p>Curso: <strong className="text-amber-300">{result.courseTitle}</strong></p>
              <p>Carga Horária: <strong>{result.workloadHours} horas</strong></p>
              <p>Instrutor: <strong>{result.instructor}</strong></p>
              <p>
                Emitido em:{' '}
                <strong>
                  {new Date(result.issuedAtIso).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </strong>
              </p>
              <p className="font-mono text-xs text-purple-300 pt-1">Código: {result.code}</p>
            </div>
          </div>
        )}

        {notFound && (
          <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-400/40 flex items-center gap-3 text-rose-200 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            Nenhum certificado encontrado com esse código. Confira se digitou exatamente como aparece no documento.
          </div>
        )}
      </div>
    </div>
  );
}
