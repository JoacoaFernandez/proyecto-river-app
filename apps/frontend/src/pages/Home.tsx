// ...existing code...
import { useState, useEffect } from 'react';
import { getLatestMatch, getUpcomingMatches } from '../services/matches.service';
import { getNews } from '../services/news.service';
import Plantel from './Plantel'; 

interface HomeProps {
  onLogout: () => void;
}

export default function Home({ onLogout }: HomeProps) {
  const [activeTab, setActiveTab] = useState<'inicio' | 'plantel'>('inicio'); 
  const [match, setMatch] = useState<any>(null);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        console.log('📡 Consultando partidos y noticias al backend...');
        const [latestMatch, newsList, upcomingList] = await Promise.all([
          getLatestMatch(),
          getNews(),
          getUpcomingMatches(10),
        ]);
        
        console.log('⚽ Partido recibido del backend:', latestMatch);
        console.log('🗓 Próximos partidos:', upcomingList);
        console.log('📰 Noticias recibidas del backend:', newsList);

        setUpcoming(Array.isArray(upcomingList) ? upcomingList : []);
        setNews(Array.isArray(newsList) ? newsList : []);

        // Preferir partido "latest" (live/next/latest). Si no hay, usar primer upcoming.
        if (latestMatch) {
          setMatch(latestMatch);
        } else if (Array.isArray(upcomingList) && upcomingList.length > 0) {
          setMatch(upcomingList[0]);
        } else {
          setMatch(null);
        }
      } catch (err) {
        console.error('❌ Error cargando datos en el Home:', err);
        setMatch(null);
        setUpcoming([]);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-12">
      {/* Navbar */}
      <nav className="bg-neutral-900 border-b border-neutral-800 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('inicio')}>
              <div className="w-10 h-10 rounded-full bg-white text-riverRed font-black flex items-center justify-center border border-riverRed text-lg">
                CARP
              </div>
              <span className="font-bold text-lg tracking-wide">River App</span>
            </div>
            
            <div className="hidden sm:flex items-center gap-4">
              <button
                onClick={() => setActiveTab('inicio')}
                className={`text-sm font-semibold transition-colors ${activeTab === 'inicio' ? 'text-riverRed border-b-2 border-riverRed pb-1' : 'text-neutral-400 hover:text-white'}`}
              >
                Inicio 🏟️
              </button>
              <button
                onClick={() => setActiveTab('plantel')}
                className={`text-sm font-semibold transition-colors ${activeTab === 'plantel' ? 'text-riverRed border-b-2 border-riverRed pb-1' : 'text-neutral-400 hover:text-white'}`}
              >
                Plantel 🏃‍♂️
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab('plantel')}
              className="sm:hidden bg-neutral-800 text-xs px-3 py-1.5 rounded-lg text-neutral-300"
            >
              Plantel
            </button>
            <button
              onClick={onLogout}
              className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-riverRed text-xs sm:text-sm px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer"
            >
              Cerrar Sesión 🚪
            </button>
          </div>
        </div>
      </nav>

      {/* RENDERIZADO CONDICIONAL */}
      {activeTab === 'plantel' ? (
        <Plantel />
      ) : (
        <div className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-riverRed mx-auto mb-4"></div>
              <p className="text-neutral-400">Abriendo las puertas del Monumental...</p>
            </div>
          ) : (
            <>
              {/* TARJETA DE PARTIDO */}
              <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
                {match && match.status === 'live' && (
                  <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse uppercase tracking-wider">
                    En Vivo • {match.minute || 0}'
                  </div>
                )}
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">
                  {match && match.status === 'live' ? 'Partido en Curso' : 'Último Partido / Próximo'}
                </h3>
                
                {match ? (
                  <div className="flex items-center justify-between my-6">
                    <div className="text-center w-1/3">
                      <span className="block text-lg font-bold truncate">{match.homeTeam}</span>
                      <span className="text-xs text-neutral-500">Local</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-center">
                      <span className="text-4xl font-black">{match.homeScore ?? 0}</span>
                      <span className="text-neutral-600 font-bold text-xl">:</span>
                      <span className="text-4xl font-black">{match.awayScore ?? 0}</span>
                    </div>

                    <div className="text-center w-1/3">
                      <span className="block text-lg font-bold truncate">{match.awayTeam}</span>
                      <span className="text-xs text-neutral-500">Visitante</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-neutral-500 text-sm">
                    No hay partidos registrados en el fixture todavía.
                  </div>
                )}
              </section>

              {/* CARRUSEL DE PRÓXIMOS PARTIDOS */}
              <section className="bg-transparent">
                <h4 className="text-sm text-neutral-400 uppercase tracking-wider mb-3">Próximos partidos</h4>
                {upcoming.length === 0 ? (
                  <div className="text-neutral-500 text-sm">No hay próximos partidos en el fixture.</div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-3 snap-x">
                    {upcoming.map((m) => (
                      <div key={m.id} className="min-w-[220px] bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex-shrink-0 snap-start">
                        <div className="text-xs text-neutral-400">{m.competition}</div>
                        <div className="mt-2 font-bold text-lg truncate">
                          {new Date(m.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="text-sm truncate">{m.homeTeam}</div>
                          <div className="text-xl font-black">{m.homeScore ?? 0} : {m.awayScore ?? 0}</div>
                          <div className="text-sm text-right truncate">{m.awayTeam}</div>
                        </div>
                        <div className="mt-2 text-xs text-neutral-500">Estado: {m.status}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* SECCIÓN DE PRENSA - CLICK PARA IR A OLÉ */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-wide">Prensa Millonaria</h2>
                  <span className="text-xs bg-neutral-900 border border-neutral-800 text-neutral-400 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Periodista IA Activo
                  </span>
                </div>

                {news.length > 0 ? (
                  <div className="grid gap-6">
                    {news.map((item: any) => (
                      <a 
                        key={item.id} 
                        href={item.url || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block group bg-neutral-900 border border-neutral-800 hover:border-riverRed rounded-2xl p-6 transition-all duration-300 shadow-lg cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-riverRed bg-red-950/30 border border-red-900/50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {item.category || 'Actualidad'}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {new Date(item.createdAt).toLocaleDateString('es-AR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2 leading-snug group-hover:text-riverRed transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-neutral-400 leading-relaxed line-clamp-3">
                          {item.body}
                        </p>
                        
                        {item.url && (
                          <div className="mt-4 text-right">
                            <span className="text-xs font-semibold text-neutral-500 group-hover:text-riverRed transition-colors">
                              Leer nota completa en Olé ↗
                            </span>
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-neutral-900 border border-neutral-800 rounded-2xl text-neutral-500 text-sm">
                    El robot periodista está buscando primicias en el entrenamiento... ✍️
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      )}
    </div>
  );
}
// ...existing code...