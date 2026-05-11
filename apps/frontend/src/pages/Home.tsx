// apps/frontend/src/pages/Home.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getNews } from '../services/news.service';
import { getLiveDashboard } from '../services/live.service';
import { timeAgo } from '../utils/time';

export default function Home() {
  const [nextMatch, setNextMatch] = useState<any>(null);
  const [lastMatch, setLastMatch] = useState<any>(null);
  const [table, setTable] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [dashboard, newsList] = await Promise.all([getLiveDashboard(), getNews()]);

        setNews(Array.isArray(newsList) ? newsList : []);

        if (dashboard) {
          setNextMatch(dashboard.nextMatch);
          setLastMatch(dashboard.lastMatch);
          setTable(dashboard.standings || []);
          setStats(dashboard.stats || null);
        }
      } catch (err) {
        console.error('❌ Error cargando datos en el Home:', err);
        setNextMatch(null);
        setLastMatch(null);
        setTable([]);
        setStats(null);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!nextMatch) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const matchDate = new Date(nextMatch.date).getTime();
      const distance = matchDate - now;

      if (distance < 0) {
        setCountdown('¡En juego!');
        clearInterval(interval);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

      setCountdown(`${days}d ${hours}h ${minutes}m`);
    }, 1000);

    return () => clearInterval(interval);
  }, [nextMatch]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-riverRed mx-auto mb-4"></div>
          <p className="text-neutral-400">Abriendo las puertas del Monumental...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Próximo Partido */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 relative shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Próximo Partido</h2>
              {countdown && (
                <span className="bg-red-950/40 text-riverRed border border-red-900/50 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                  Faltan: {countdown}
                </span>
              )}
            </div>

            {nextMatch ? (
              <div className="flex flex-col items-center">
                <div className="text-xs text-neutral-400 mb-4">{nextMatch.competition} • Estadio Monumental</div>

                <div className="flex items-center justify-between w-full mb-6">
                  <div className="text-center w-1/3">
                    <div className="w-14 h-14 mx-auto bg-white rounded-full flex items-center justify-center mb-2 shadow-inner">
                      <span className="text-riverRed font-black text-sm">
                        {nextMatch.homeTeam.substring(0, 3).toUpperCase()}
                      </span>
                    </div>
                    <span className="block font-bold truncate">{nextMatch.homeTeam}</span>
                  </div>

                  <div className="text-center w-1/3 flex flex-col items-center">
                    <div className="text-2xl font-black text-white">
                      {new Date(nextMatch.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-sm text-neutral-500 font-medium">
                      {new Date(nextMatch.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                    </div>
                  </div>

                  <div className="text-center w-1/3">
                    <div className="w-14 h-14 mx-auto bg-neutral-800 border border-neutral-700 rounded-full flex items-center justify-center mb-2">
                      <span className="text-neutral-400 font-black text-sm">
                        {nextMatch.awayTeam.substring(0, 3).toUpperCase()}
                      </span>
                    </div>
                    <span className="block font-bold truncate">{nextMatch.awayTeam}</span>
                  </div>
                </div>

                <Link
                  to="/partidos/proximo"
                  className="w-full bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-riverRed text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-md active:scale-[0.98] text-center"
                >
                  Ver detalle del partido →
                </Link>
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500 text-sm">No hay próximo partido programado.</div>
            )}
          </section>

          {/* 2. Último Resultado */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 relative shadow-xl">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4">Último Resultado</h2>
            {lastMatch ? (
              <div className="flex flex-col">
                <div className="text-xs text-neutral-400 mb-4 text-center">
                  {lastMatch.competition} • {new Date(lastMatch.date).toLocaleDateString('es-AR')}
                </div>

                <div className="flex items-center justify-between mb-5">
                  <div className="text-center w-1/3">
                    <span className="block font-bold truncate">{lastMatch.homeTeam}</span>
                  </div>

                  <div className="flex items-center gap-4 bg-neutral-950 px-4 py-2 rounded-xl border border-neutral-800">
                    <span
                      className={`text-3xl font-black ${
                        lastMatch.homeScore > lastMatch.awayScore ? 'text-white' : 'text-neutral-500'
                      }`}
                    >
                      {lastMatch.homeScore ?? 0}
                    </span>
                    <span className="text-neutral-600 font-bold">-</span>
                    <span
                      className={`text-3xl font-black ${
                        lastMatch.awayScore > lastMatch.homeScore ? 'text-white' : 'text-neutral-500'
                      }`}
                    >
                      {lastMatch.awayScore ?? 0}
                    </span>
                  </div>

                  <div className="text-center w-1/3">
                    <span className="block font-bold truncate">{lastMatch.awayTeam}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500 text-sm">No hay resultados recientes.</div>
            )}
          </section>

          {/* 3. Noticias Destacadas */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-wide">Noticias Destacadas</h2>
              <Link to="/noticias" className="text-xs text-riverRed font-semibold cursor-pointer hover:underline">
                Ver todas ↗
              </Link>
            </div>

            {news.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {news.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    to={`/noticias/${item.id}`}
                    className="bg-neutral-900 border border-neutral-800 hover:border-riverRed rounded-2xl p-4 transition-all duration-300 group flex flex-col justify-between shadow-lg h-full"
                  >
                    <div>
                      <div className="w-full h-32 rounded-xl mb-4 overflow-hidden border border-neutral-800 group-hover:border-riverRed/50 transition-colors">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full bg-neutral-950 flex items-center justify-center">
                            <span className="text-4xl opacity-50">📰</span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-riverRed uppercase tracking-wider bg-red-950/30 border border-red-900/30 px-2 py-0.5 rounded-full">
                          {item.category || 'Actualidad'}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-medium">
                          {timeAgo(item.publishedAt ?? item.createdAt)}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white group-hover:text-riverRed transition-colors line-clamp-3">
                        {item.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-neutral-900 border border-neutral-800 rounded-2xl text-neutral-500 text-sm">
                Buscando primicias... ✍️
              </div>
            )}
          </section>
        </div>

        {/* COLUMNA LATERAL */}
        <div className="space-y-6">
          {/* 4. Tabla de Posiciones */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span>🏆</span> Liga Profesional
            </h2>
            <div className="w-full text-sm">
              <div className="flex text-neutral-500 border-b border-neutral-800 pb-2 mb-2 font-semibold text-xs uppercase tracking-wider">
                <div className="w-6 text-center">#</div>
                <div className="flex-1 px-2">Equipo</div>
                <div className="w-8 text-center">Pts</div>
                <div className="w-8 text-center">PJ</div>
              </div>
              {table.slice(0, 10).map((row) => (
                <div
                  key={row.pos}
                  className={`flex py-2.5 items-center border-b border-neutral-800/50 last:border-0 ${
                    row.team.includes('River Plate') ? 'bg-red-950/20 rounded-lg font-bold text-white' : 'text-neutral-300'
                  }`}
                >
                  <div
                    className={`w-6 text-center text-xs ${
                      row.team.includes('River Plate') ? 'text-riverRed' : 'text-neutral-500'
                    }`}
                  >
                    {row.pos}
                  </div>
                  <div className="flex-1 px-2 truncate">{row.team}</div>
                  <div className={`w-8 text-center ${row.team.includes('River Plate') ? 'text-riverRed' : ''}`}>
                    {row.pts}
                  </div>
                  <div className="w-8 text-center text-neutral-500">{row.pj}</div>
                </div>
              ))}
            </div>
            <Link
              to="/competiciones"
              className="block text-center w-full mt-4 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-riverRed text-white font-semibold text-xs py-2.5 rounded-xl transition-all"
            >
              Ver tabla completa →
            </Link>
          </section>

          {/* 5. Estadísticas Rápidas */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span>📊</span> Estadísticas de Temporada
            </h2>
            {stats ? (
              <div className="space-y-5">
                <div className="grid grid-cols-4 gap-2 text-center bg-neutral-950 border border-neutral-800 p-3 rounded-xl">
                  <div>
                    <div className="text-lg font-black text-white">{stats.pj}</div>
                    <div className="text-[10px] text-neutral-500 uppercase font-bold">PJ</div>
                  </div>
                  <div>
                    <div className="text-lg font-black text-green-500">{stats.pg}</div>
                    <div className="text-[10px] text-neutral-500 uppercase font-bold">G</div>
                  </div>
                  <div>
                    <div className="text-lg font-black text-yellow-500">{stats.pe}</div>
                    <div className="text-[10px] text-neutral-500 uppercase font-bold">E</div>
                  </div>
                  <div>
                    <div className="text-lg font-black text-red-500">{stats.pp}</div>
                    <div className="text-[10px] text-neutral-500 uppercase font-bold">P</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm border-b border-neutral-800/50 pb-2">
                    <span className="text-neutral-400">Goles a favor</span>
                    <span className="font-bold text-white bg-neutral-800 px-2 py-0.5 rounded-md">{stats.gf}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-neutral-800/50 pb-2">
                    <span className="text-neutral-400">Goles en contra</span>
                    <span className="font-bold text-white bg-neutral-800 px-2 py-0.5 rounded-md">{stats.gc}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-neutral-800/50 pb-2">
                    <span className="text-neutral-400">Racha actual</span>
                    <span className="font-bold text-green-400 text-xs uppercase tracking-wider">{stats.streak}</span>
                  </div>
                </div>

                <Link
                  to="/estadisticas"
                  className="block text-center w-full mt-4 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-riverRed text-white font-semibold text-xs py-2.5 rounded-xl transition-all"
                >
                  Ver estadísticas completas →
                </Link>
              </div>
            ) : (
              <div className="text-center text-sm text-neutral-500 py-8">Las estadísticas no están disponibles.</div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
