import React, { useEffect, useState } from 'react';
import { Church, Clock, MapPin, Heart, Users, MessageSquare, GraduationCap, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useTheme } from '../lib/ThemeContext';

export default function About() {
  const { churchName, logoUrl } = useTheme();
  const [churchInfo, setChurchInfo] = useState<any>({});

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'church_config'), (snap) => {
      if (snap.exists()) setChurchInfo(snap.data());
    });
    return () => unsub();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4 pb-28 space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-purple-900/40 via-[#14141B] to-[#0D0D14] border border-white/10 p-6 sm:p-8 text-center space-y-4 shadow-2xl">
        <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/15 mx-auto flex items-center justify-center overflow-hidden">
          {logoUrl ? (
            <img src={logoUrl} alt={churchName} className="w-16 h-16 object-contain" />
          ) : (
            <Church className="w-10 h-10 text-purple-300" />
          )}
        </div>
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300">
            Nossa Identidade & Visão
          </span>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
            {churchName || 'Ministério Frutos do Espírito'}
          </h1>
          <p className="text-sm text-white/75 max-w-xl mx-auto leading-relaxed">
            {churchInfo.aboutText ||
              'Uma igreja acolhedora fundamentada na Palavra de Deus, comprometida com o discipulado, a comunhão em células e a manifestação dos Frutos do Espírito.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-3xl bg-[#14141B]/95 border border-white/10 p-6 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Horários de Cultos e Reuniões
          </h2>
          <ul className="text-sm text-white/75 space-y-2">
            <li>• <strong className="text-white">Culto de Celebração:</strong> Domingo às 19h00</li>
            <li>• <strong className="text-white">Culto da Palavra & Oração:</strong> Quarta-feira às 19h30</li>
            <li>• <strong className="text-white">Células nos Lares:</strong> Quinta e Sexta-feira às 20h00</li>
            <li>• <strong className="text-white">Escola Ministerial:</strong> Sábados e Online no App</li>
          </ul>
        </div>

        <div className="rounded-3xl bg-[#14141B]/95 border border-white/10 p-6 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-400" />
            Localização & Contato
          </h2>
          <p className="text-sm text-white/75 leading-relaxed">
            {churchInfo.address || 'Consulte nossa agenda ou fale conosco pelo Chat da Comunidade para visitar uma célula próxima a você.'}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              to="/cells"
              className="px-3.5 py-2 rounded-xl bg-purple-600/25 border border-purple-400/30 text-purple-200 text-xs font-bold inline-flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              Encontrar Célula
            </Link>
            <Link
              to="/chat"
              className="px-3.5 py-2 rounded-xl bg-white/10 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Falar no Chat
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Link
          to="/courses"
          className="p-4 rounded-2xl bg-[#14141B]/90 border border-white/10 hover:border-purple-400/40 transition space-y-1.5"
        >
          <GraduationCap className="w-5 h-5 text-purple-400" />
          <p className="text-sm font-bold text-white">Escola & Cursos</p>
          <p className="text-xs text-white/55">Formação e certificados</p>
        </Link>
        <Link
          to="/validar-certificado"
          className="p-4 rounded-2xl bg-[#14141B]/90 border border-white/10 hover:border-amber-400/40 transition space-y-1.5"
        >
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <p className="text-sm font-bold text-white">Validar Certificado</p>
          <p className="text-xs text-white/55">Autenticidade por código</p>
        </Link>
        <Link
          to="/give"
          className="p-4 rounded-2xl bg-[#14141B]/90 border border-white/10 hover:border-emerald-400/40 transition space-y-1.5 col-span-2 sm:col-span-1"
        >
          <Heart className="w-5 h-5 text-emerald-400" />
          <p className="text-sm font-bold text-white">Dízimos & Ofertas</p>
          <p className="text-xs text-white/55">Contribua com a obra</p>
        </Link>
      </div>
    </div>
  );
}
