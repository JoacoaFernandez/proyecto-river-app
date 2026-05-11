// apps/frontend/src/pages/Home.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CalendarDays, Trophy, BarChart2, FileText } from 'lucide-react';
import { getNews } from '../services/news.service';
import { getLiveDashboard } from '../services/live.service';
import { timeAgo } from '../utils/time';

const RIVER_RX = /river\s*plate|^river$/i;

// Paleta de colores por equipo conocido
const TEAM_COLORS: Record<string, { bg: string; text: string }> = {
  'boca juniors': { bg: '#1a3f9e', text: '#f5c518' },
  'racing club': { bg: '#1a1a2e', text: '#e0e0e0' },
  'independiente': { bg: '#b01c2e', text: '#ffffff' },
  'san lorenzo': { bg: '#1c3d8f', text: '#d32f2f' },
  'estudiantes': { bg: '#e8c12a', text: '#1a1a1a' },
  'vélez sársfield': { bg: '#0d5c2f', text: '#ffffff' },
  'velez sarsfield': { bg: '#0d5c2f', text: '#ffffff' },
  'lanús': { bg: '#1b5e20', text: '#ffffff' },
  'lanus': { bg: '#1b5e20', text: '#ffffff' },
  'talleres': { bg: '#0a4a8c', text: '#ffffff' },
  'huracán': { bg: '#c62828', text: '#f5f5f5' },
  'huracan': { bg: '#c62828', text: '#f5f5f5' },
  'belgrano': { bg: '#1a56a0', text: '#ffffff' },
  'rosario central': { bg: '#f5c518', text: '#1a1a1a' },
};

function teamStyle(name: string): { bg: string; text: string } {
  if (RIVER_RX.test(name)) return { bg: '#E30613', text: '#ffffff' };
  const key = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const [k, v] of Object.entries(TEAM_COLORS)) {
    if (key.includes(k)) return v;
  }
  // Hash determinístico para el resto
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return { bg: `hsl(${hue}, 55%, 28%)`, text: '#f5f5f5' };
}

function abbrev(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  if (words.length === 2) return (words[0][0] + words[1].slice(0, 2)).toUpperCase();
  return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
}

function TeamBadge({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const { bg, text } = teamStyle(name);
  const isRiver = RIVER_RX.test(name);
  const sizeClass = size === 'lg' ? 'w-20 h-20 text-xl' : size === 'sm' ? 'w-10 h-10 text-xs' : 'w-14 h-14 text-sm';
  return (
    <div
      className={`${sizeClass} rounded-2xl flex items-center justify-center font-black mx-auto flex-shrink-0 shadow-lg`}
      style={{
        background: isRiver ? 'linear-gradient(135deg, #E30613 0%, #a00000 100%)' : bg,
        color: text,
        boxShadow: isRiver ? '0 4px 20px rgba(227,6,19,0.4)' : undefined,
      }}
    >
      {abbrev(name)}
    </div>
  );
}

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
        console.error('Error cargando datos en el Home:', err);
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
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-neutral-800">
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Próximo Partido</h2>
              {countdown && (
                <span className="flex items-center gap-1.5 bg-red-950/40 text-riverRed border border-red-900/50 px-3 py-1 rounded-full text-xs font-bold tabular-nums">
                  <Clock className="w-3 h-3" />
                  {countdown}
                </span>
              )}
            </div>

            {nextMatch ? (
              <div className="p-5">
                <div className="flex items-center gap-1.5 mb-5 justify-center">
                  <span className="text-[10px] font-bold text-riverRed uppercase tracking-widest bg-red-950/30 border border-red-900/40 px-2.5 py-1 rounded-full">
                    {nextMatch.competition}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    {new Date(nextMatch.date).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {' · '}
                    {new Date(nextMatch.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className="flex-1 flex flex-col items-center gap-2.5">
                    <TeamBadge name={nextMatch.homeTeam} size="lg" />
                    <span className="text-sm font-bold text-center leading-tight">{nextMatch.homeTeam}</span>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Local</span>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-black text-neutral-600 uppercase tracking-widest">VS</span>
                  </div>

                  <div className="flex-1 flex flex-col items-center gap-2.5">
                    <TeamBadge name={nextMatch.awayTeam} size="lg" />
                    <span className="text-sm font-bold text-center leading-tight">{nextMatch.awayTeam}</span>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Visitante</span>
                  </div>
                </div>

                <Link
                  to="/partidos/proximo"
                  className="block w-full bg-riverRed hover:bg-red-700 text-white font-bold text-sm py-2.5 rounded-xl transition-all shadow-md shadow-red-900/30 text-center"
                >
                  Ver detalles →
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-5 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-neutral-800 flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-neutral-500" />
                </div>
                <p className="text-sm text-neutral-400 font-semibold">Sin partido programado</p>
                <p className="text-xs text-neutral-600 text-center">El calendario se actualiza automáticamente cuando se confirma el próximo fixture.</p>
                <Link to="/partidos" className="text-xs text-riverRed font-semibold hover:underline mt-1">Ver fixture completo →</Link>
              </div>
            )}
          </section>

          {/* 2. Último Resultado */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 pt-5 pb-4 border-b border-neutral-800">
              <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Último Resultado</h2>
            </div>

            {lastMatch ? (() => {
              const isHome = RIVER_RX.test(lastMatch.homeTeam);
              const ourScore = isHome ? (lastMatch.homeScore ?? 0) : (lastMatch.awayScore ?? 0);
              const theirScore = isHome ? (lastMatch.awayScore ?? 0) : (lastMatch.homeScore ?? 0);
              const riverWonPen = lastMatch.penaltyWinner && RIVER_RX.test(lastMatch.penaltyWinner);
              const result = ourScore > theirScore || riverWonPen ? 'G' : ourScore === theirScore ? 'E' : 'P';
              const resultColor = result === 'G' ? 'bg-green-500/20 text-green-400 border-green-700/40' : result === 'E' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-700/40' : 'bg-red-500/20 text-red-400 border-red-700/40';
              return (
                <div className="p-5">
                  <div className="flex items-center gap-2 justify-center mb-4">
                    <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg border ${resultColor}`}>
                      {result === 'G' ? (riverWonPen ? 'Victoria (pen.)' : 'Victoria') : result === 'E' ? 'Empate' : 'Derrota'}
                    </span>
                    <span className="text-[10px] text-neutral-500">{lastMatch.competition} · {new Date(lastMatch.date).toLocaleDateString('es-AR')}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex flex-col items-center gap-2">
                      <TeamBadge name={lastMatch.homeTeam} size="md" />
                      <span className="text-xs font-semibold text-center leading-tight truncate w-full text-center">{lastMatch.homeTeam}</span>
                    </div>

                    <div className="flex items-center gap-3 bg-neutral-950 border border-neutral-800 rounded-2xl px-5 py-3">
                      <span className={`text-4xl font-black tabular-nums ${lastMatch.homeScore >= lastMatch.awayScore ? 'text-white' : 'text-neutral-500'}`}>{lastMatch.homeScore ?? 0}</span>
                      <span className="text-neutral-700 font-black text-xl">–</span>
                      <span className={`text-4xl font-black tabular-nums ${lastMatch.awayScore >= lastMatch.homeScore ? 'text-white' : 'text-neutral-500'}`}>{lastMatch.awayScore ?? 0}</span>
                    </div>

                    <div className="flex-1 flex flex-col items-center gap-2">
                      <TeamBadge name={lastMatch.awayTeam} size="md" />
                      <span className="text-xs font-semibold text-center leading-tight truncate w-full text-center">{lastMatch.awayTeam}</span>
                    </div>
                  </div>
                </div>
              );
            })() : (
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
                      <div className="w-full aspect-video rounded-xl mb-4 overflow-hidden border border-neutral-800 group-hover:border-riverRed/50 transition-colors bg-neutral-950">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center ${item.imageUrl ? 'hidden' : ''}`}>
                          <FileText className="w-8 h-8 text-neutral-700" />
                        </div>
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
                Sin noticias disponibles todavía.
              </div>
            )}
          </section>
        </div>

        {/* COLUMNA LATERAL */}
        <div className="space-y-6">
          {/* 4. Tabla de Posiciones */}
          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5 text-riverRed" /> Liga Profesional
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
              <BarChart2 className="w-3.5 h-3.5 text-riverRed" /> Estadísticas de Temporada
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
