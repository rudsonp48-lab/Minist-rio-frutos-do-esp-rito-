import { useState } from 'react';
import { Users, MapPin, Map, Share2, Search, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

const CELLS_DATA = [
  { id: 1, name: 'Célula Centro', leader: 'Pr. João', address: 'Rua Principal, 123 - Centro', day: 'Quarta-feira, 20:00' },
  { id: 2, name: 'Célula Zona Sul', leader: 'Dc. Maria', address: 'Av. Sul, 456 - Bairro Sul', day: 'Quinta-feira, 19:30' },
  { id: 3, name: 'Célula Universitária', leader: 'Miss. Carlos', address: 'Rua da Faculdade, 789 - Campus', day: 'Sábado, 17:00' },
];

export default function Cells() {
  const [search, setSearch] = useState('');

  const filteredCells = CELLS_DATA.filter(cell => cell.name.toLowerCase().includes(search.toLowerCase()) || cell.address.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-transparent w-full text-white font-sans max-w-7xl mx-auto px-6 pb-32">
      <header className="py-8">
        <div className="flex flex-col">
          <h1 className="text-4xl lg:text-5xl font-display font-bold tracking-tight text-white mb-2">Pequenos Grupos</h1>
          <p className="text-white/60 text-lg">Encontre uma célula perto de você e viva em comunhão.</p>
        </div>
      </header>

      <div className="mb-8 relative">
        <label className="absolute left-6 top-1/2 -translate-y-1/2">
          <Search className="w-5 h-5 text-white/40" />
        </label>
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por bairro, nome ou líder..." 
          className="w-full h-16 bg-white/5 border border-white/10 rounded-full pl-14 pr-6 text-white placeholder:text-white/30 outline-none focus:border-[var(--theme-color)] transition-colors text-lg"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-4">
            {filteredCells.map(cell => (
              <motion.div 
                key={cell.id} 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="ios-card bg-white dark:bg-white/5 p-6 rounded-[24px] border border-black/5 dark:border-white/10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between group"
              >
                 <div>
                    <div className="flex items-center gap-2 mb-2">
                       <span className="px-2.5 py-1 rounded-full bg-[var(--theme-color)]/20 text-[var(--theme-color)] text-[10px] font-bold uppercase tracking-widest leading-none border border-[var(--theme-color)]/20">
                         Ativa
                       </span>
                    </div>
                    <h3 className="text-2xl font-bold dark:text-white text-black mb-1">{cell.name}</h3>
                    <p className="text-sm font-semibold dark:text-white/50 text-black/50 mb-3">Líder: {cell.leader}</p>
                    
                    <div className="flex flex-col gap-2">
                       <div className="flex items-start gap-2 text-sm dark:text-white/80 text-black/80">
                         <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-[var(--theme-color)]" />
                         <span>{cell.address}</span>
                       </div>
                    </div>
                 </div>

                 <div className="flex items-center gap-3 w-full md:w-auto">
                    <button className="flex-1 md:flex-none h-12 px-6 rounded-xl bg-black/5 dark:bg-white/10 dark:hover:bg-white/20 hover:bg-black/10 transition-colors flex items-center justify-center font-bold text-sm text-black dark:text-white">
                      Participar
                    </button>
                    <a 
                      href={`https://wa.me/?text=${encodeURIComponent(`Conheça a ${cell.name}! Nos reunimos todo(a) ${cell.day} em: ${cell.address}. Vem com a gente! ${window.location.origin}/cells`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-12 h-12 shrink-0 rounded-xl bg-green-500 hover:bg-green-600 transition-colors shadow-lg flex items-center justify-center text-white"
                    >
                      <Share2 className="w-5 h-5" />
                    </a>
                 </div>
              </motion.div>
            ))}
            
            {filteredCells.length === 0 && (
              <div className="p-12 text-center rounded-[24px] border border-white/5 border-dashed">
                <Map className="w-10 h-10 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">Nenhuma célula encontrada com esse endereço.</p>
              </div>
            )}
         </div>

         <div className="space-y-6">
            <div className="aspect-square rounded-[32px] overflow-hidden ios-card relative border border-white/10 group">
               <iframe 
                 src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d117006.12642598379!2d-46.73698048601662!3d-23.588820464673894!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce5a2b2ed7f3a1%3A0xab35da2f5ca62674!2sSão%20Paulo%2C%20SP!5e0!3m2!1spt-BR!2sbr!4v1714488390886!5m2!1spt-BR!2sbr" 
                 className="w-full h-full absolute inset-0 grayscale contrast-125 opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                 loading="lazy"
               ></iframe>
               <div className="absolute inset-0 bg-[var(--theme-color)] mix-blend-color opacity-30 pointer-events-none"></div>
               <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                 <Map className="w-4 h-4" /> Visaõ do Mapa
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
