// apps/frontend/src/pages/Home.tsx
import { useState, useEffect } from 'react';
import { getLatestMatch } from '../services/matches.service';
import { getNews } from '../services/news.service';

interface HomeProps {
  onLogout: () => void;
}

export default function Home({ onLogout }: HomeProps) {
  // Estados reales para la base de datos
  const [match, setMatch] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargamos los datos reales al montar la pantalla
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [latestMatch, newsList] = await Promise.all([
        getLatestMatch(),
        getNews()
      ]);
      
      if (latestMatch) setMatch(latestMatch);
      setNews(newsList);
      setLoading(false);
    };

    loadData();

    // Opcional: Cada 30 segundos refrescamos el partido por si está en vivo
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-12">
      {/* Navbar */}
      <nav className="bg-neutral-900 border-b border-neutral-800 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white text-riverRed font-black flex items-center justify-center border border-riverRed text-lg">
              CARP
            </div>
            <span className="font-bold text-lg tracking-wide">River App</span>
          </div>
          <button
            onClick={onLogout}
            className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-riverRed text-sm px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer"
          >
            Cerrar Sesión 🚪
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-riverRed mx-auto mb-4"></div>
            <p className="text-neutral-400">Abriendo las puertas del Monumental...</p>
          </div>
        ) : (
          <>
            {/* TARJETA DE PARTIDO REAL */}
            <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
              {match && match.status === 'live' && (
                <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse uppercase tracking-wider">
                  En Vivo • {match.minute}'
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

            {/* SECCIÓN DE PRENSA - NOTICIAS IA REALES */}
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
                    <article key={item.id} className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-6 transition-all duration-300 shadow-lg">
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
                      <h3 className="text-lg font-bold text-white mb-2 leading-snug">{item.title}</h3>
                      <p className="text-sm text-neutral-400 leading-relaxed">{item.body}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-neutral-900 border border-neutral-800 rounded-2xl text-neutral-500 text-sm">
                  El robot periodista está analizando las novedades en la concentración... ✍️
                </div>
              )}
            </section>
          </>
        )}

      </div>
    </div>
  );
}