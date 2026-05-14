import { motion } from 'motion/react';
import { Settings as SettingsIcon, Bell, Shield, Eye, Database, Info, ChevronRight, Moon, Globe, Terminal, Cpu, Share2, Youtube, ShieldAlert, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { auth } from '../lib/firebase';
import { Link } from 'react-router-dom';

import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

const ADMIN_EMAIL = 'rudson.p48@gmail.com';

export default function Settings() {
  const user = auth.currentUser;
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'app_config', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data());
      }
    });
    return () => unsubscribe();
  }, []);

  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'default'
  );

  const requestNotifications = async () => {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações digitais.');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === 'granted') {
      new Notification('Ecclesia Nexus', {
        body: 'Protocolo de Notificações Ativado com Sucesso.',
        icon: 'https://www.google.com/favicon.ico'
      });
    }
  };

  const settingsGroups = [
    {
      title: config?.settingsTitles?.sync || 'Configurações de Sincronia',
      items: [
        { 
          icon: Bell, 
          label: 'Notificações Push', 
          description: notifPermission === 'granted' ? 'SYNC ATIVO (100%)' : 'REQUER AUTORIZAÇÃO', 
          color: 'text-yellow-400',
          onClick: requestNotifications
        },
        { icon: Moon, label: 'Cyber Dark Mode', description: 'Otimização Vision Noturna', color: 'text-zinc-500' },
        { icon: Globe, label: 'Localização/Idioma', description: 'Português // Atlas-BR', color: 'text-blue-500' },
      ]
    },
    {
      title: config?.settingsTitles?.security || 'Segurança & Criptografia',
      items: [
        { icon: Shield, label: 'Firewall de Privacidade', description: 'Gerenciamento de Dados Privados', color: 'text-green-500' },
        { icon: Eye, label: 'Módulo de Visibilidade', description: 'Configuração de Stealth Mode', color: 'text-purple-500' },
        { icon: Database, label: 'Fluxo de Backup', description: 'Sincronização em Nuvem (Cloud)', color: 'text-orange-500' },
      ]
    },
    {
      title: config?.settingsTitles?.core || 'Núcleo do Sistema',
      items: [
        { icon: Terminal, label: 'Terminal v3.1.2', description: 'Registro de Atividades do Core', color: 'text-zinc-700' },
        { icon: Cpu, label: 'Processamento', description: 'Status de Hardware Virtual', color: 'text-zinc-700' },
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-16 pb-32">
      <header className="pt-12 px-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-12 md:w-16 h-[2px] bg-yellow-400 glow-yellow shadow-xl" />
          <span className="text-yellow-400 text-[10px] md:text-[11px] font-display font-black uppercase tracking-[0.5em] text-glow">Panel // Ajustes do Core</span>
        </div>
        <h1 className="text-5xl md:text-8xl font-display font-black italic uppercase tracking-tighter leading-none text-white">Interface de <br /><span className="text-yellow-400">Configurações</span></h1>
        <p className="text-zinc-600 font-medium max-w-xl mt-6 md:mt-8 text-[9px] md:text-[10px] uppercase tracking-widest opacity-60 leading-relaxed italic">Ajuste os parâmetros de sincronização e segurança do seu Nexus Ecclesia.</p>
      </header>

      {isAdmin && (
        <section className="px-4 md:px-0 mb-12">
          <Link to="/admin" className="block p-1 glass rounded-[3rem] border-red-500/20 hover:border-red-500/40 transition-all shadow-2xl group overflow-hidden">
             <div className="bg-red-500/5 rounded-[2.9rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6 md:gap-10">
                   <div className="w-16 h-16 md:w-20 md:h-20 glass flex items-center justify-center rounded-2xl md:rounded-[1.5rem] glow-red border-red-500/20">
                      <ShieldAlert className="w-8 h-8 md:w-10 md:h-10 text-red-500 animate-pulse" />
                   </div>
                   <div className="space-y-1">
                      <div className="flex items-center gap-3">
                         <h3 className="text-2xl md:text-4xl font-display font-black uppercase italic tracking-tighter text-white">Painel Gerenciador</h3>
                         <span className="bg-red-500 text-black px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest">Nível 00</span>
                      </div>
                      <p className="text-zinc-600 text-[9px] md:text-[10px] font-black uppercase tracking-widest">Controle Total de Banners e Conteúdo Global</p>
                   </div>
                </div>
                <div className="w-full md:w-auto bg-red-500 text-black px-12 py-6 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 group-hover:scale-105 transition-all shadow-2xl glow-red">
                   <LayoutDashboard className="w-5 h-5" />
                   Acessar Matrix
                </div>
             </div>
          </Link>
        </section>
      )}

      <div className="space-y-10 md:space-y-12 px-4 md:px-0">
        {settingsGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-4 md:space-y-6">
            <div className="flex items-center gap-4 px-6 md:px-8">
               <div className="w-1.5 h-1.5 bg-zinc-800 rounded-full" />
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">{group.title}</h3>
            </div>
            
            <div className="glass-dark bg-zinc-950/40 border border-white/5 rounded-[2.5rem] md:rounded-[4rem] overflow-hidden shadow-2xl backdrop-blur-xl">
              {group.items.map((item, iIdx) => (
                <button
                  key={iIdx}
                  onClick={item.onClick}
                  className="w-full flex items-center justify-between p-6 md:p-10 hover:bg-yellow-400/5 transition-all border-b border-white/5 last:border-0 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex items-center gap-6 md:gap-10 relative z-10">
                    <div className={`w-12 h-12 md:w-16 md:h-16 glass flex items-center justify-center rounded-xl md:rounded-[1.2rem] border-white/5 group-hover:scale-110 group-hover:border-yellow-400/40 transition-all shadow-xl ${item.color}`}>
                      <item.icon className="w-5 h-5 md:w-7 md:h-7" />
                    </div>
                    <div className="text-left">
                      <p className="font-display font-black uppercase italic tracking-widest text-base md:text-lg text-white group-hover:text-yellow-400 transition-colors uppercase">{item.label}</p>
                      <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-zinc-700 mt-1 md:mt-2 italic group-hover:text-white/40">{item.description}</p>
                    </div>
                  </div>
                  <div className="glass w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl group-hover:border-yellow-400/20 transition-all">
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-zinc-800 group-hover:text-yellow-400 group-hover:translate-x-2 transition-all duration-500" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* YouTube API Card 2.0 */}
      <section className="px-2 md:px-0">
        <div className="glass-dark bg-yellow-400 text-black p-12 md:p-20 rounded-[5rem] relative overflow-hidden shadow-4xl group">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-black/5 blur-[80px] rounded-full translate-x-1/4 -translate-y-1/4" />
          
          <div className="max-w-2xl relative z-10 space-y-10">
            <div className="flex items-center gap-5">
               <div className="w-14 h-14 bg-black/10 flex items-center justify-center rounded-2xl">
                 <Youtube className="w-8 h-8" />
               </div>
               <h4 className="text-4xl font-display font-black italic uppercase tracking-tighter">Sincronização de Mídia</h4>
            </div>
            
            <p className="text-[11px] font-black uppercase tracking-[0.2em] leading-loose opacity-70 italic max-w-xl">
              Para integrar o fluxo de áudio e vídeo do YouTube (E-Podcast, Sinfonias Gospel), configure sua chave API no repositório de ambiente.
            </p>
            
            <div className="bg-black/5 p-8 rounded-[2rem] font-mono text-[10px] break-all border border-black/10 shadow-inner group-hover:bg-black/10 transition-all">
              <span className="opacity-40">// ADICIONAR AO ARQUIVO .ENV</span> <br />
              <span className="text-sm font-bold tracking-tighter">VITE_YOUTUBE_API_KEY = SUA_CHAVE_AQUI</span>
            </div>

            <button className="flex items-center gap-4 text-xs font-black uppercase tracking-widest bg-black text-white px-10 py-5 rounded-3xl hover:scale-105 active:scale-95 transition-all">
               Documentação da API <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <footer className="text-center space-y-4">
         <div className="w-20 h-[1px] bg-zinc-900 mx-auto" />
         <p className="text-[8px] text-zinc-800 uppercase font-black tracking-[0.5em]">
           ECCLESIA DIGITAL ARCHITECTURE • BUILT 2026
         </p>
      </footer>
    </div>
  );
}
