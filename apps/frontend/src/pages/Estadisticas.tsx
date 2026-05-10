// apps/frontend/src/pages/Estadisticas.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLiveDashboard } from '../services/live.service';
import { getPastMatches } from '../services/matches.service';

interface TeamStats {
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  streak: string;
  topScorer: string;
}

const RIVER_RX = /river\s*plate|^river$/i;

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function formatRecent(match: any): { result: 'W' | 'D' | 'L'; rivalName: string; score: string } {
  const isHome = RIVER_RX.test(match.homeTeam);
  const our = isHome ? match.homeScore ?? 0 : match.awayScore ?? 0;
  const them = isHome ? match.awayScore ?? 0 : match.homeScore ?? 0;
  const rivalName = isHome ? match.awayTeam : match.homeTeam;
  const result: 'W' | 'D' | 'L' = our > them ? 'W' : our === them ? 'D' : 'L';
  return { result, rivalName, score: `${our}-${them}` };
}

export default function Estadisticas() {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [pastMatches, setPastMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getLiveDashboard(), getPastMatches(20)])
      .then(([dashboard, past]) => {
        setStats(dashboard?.stats ?? null);
        setPastMatches(Array.isArray(past) ? past : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const recent5 = useMemo(() => pastMatches.slice(0, 5).map(formatRecent), [pastMatches]);

  // Distribución por competición
  const byCompetition = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of pastMatches) {
      const c = m.competition || 'Sin competición';
      map[c] = (map[c] ?? 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [pastMatches]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 mt-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-riverRed mx-auto mb-4"></div>
        <p className="text-neutral-400">Cargando estadísticas…</p>
      </div>
    );
  }

  if (!stats || stats.pj === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 mt-12 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-xl font-bold mb-2">Aún no hay estadísticas</h2>
        <p className="text-neutral-400 mb-6">Cuando se sincronicen los partidos vamos a poder mostrarte los números reales.</p>
        <Link to="/" className="text-riverRed font-semibold hover:underline">← Volver al inicio</Link>
      </div>
    );
  }

  // KPIs derivados
  const winPct = pct(stats.pg, stats.pj);
  const drawPct = pct(stats.pe, stats.pj);
  const lossPct = 100 - winPct - drawPct;
  const goalDiff = stats.gf - stats.gc;
  const avgGoalsFor = (stats.gf / stats.pj).toFixed(2);
  const avgGoalsAgainst = (stats.gc / stats.pj).toFixed(2);
  const ptsEstimados = stats.pg * 3 + stats.pe;

  // Gradiente cónico para pizza: green → yellow → red
  const conicGradient = `conic-gradient(
    rgb(34 197 94) 0deg ${winPct * 3.6}deg,
    rgb(234 179 8) ${winPct * 3.6}deg ${(winPct + drawPct) * 3.6}deg,
    rgb(239 68 68) ${(winPct + drawPct) * 3.6}deg 360deg
  )`;

  return (
    <div className="max-w-6xl mx-auto px-4 mt-6 pb-12 space-y-6">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-4">
        <h1 className="text-2xl font-black tracking-wide uppercase">Estadísticas</h1>
        <p className="text-sm text-neutral-400 mt-1">Rendimiento de la temporada en curso.</p>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'PJ', value: stats.pj, color: 'text-white', sub: 'Partidos' },
          { label: 'Ganados', value: stats.pg, color: 'text-green-400', sub: `${winPct}% de los PJ` },
          { label: 'Empatados', value: stats.pe, color: 'text-yellow-400', sub: `${drawPct}% de los PJ` },
          { label: 'Perdidos', value: stats.pp, color: 'text-red-400', sub: `${lossPct}% de los PJ` },
        ].map((k) => (
          <div key={k.label} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-center">
            <div className={`text-3xl md:text-4xl font-black ${k.color}`}>{k.value}</div>
            <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mt-1">{k.label}</div>
            <div className="text-[11px] text-neutral-600 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </section>

      {/* Pizza + goles */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Distribución (donut) */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">
            Resultados de la temporada
          </h3>
          <div className="flex items-center gap-6">
            <div
              className="relative w-32 h-32 rounded-full flex-shrink-0"
              style={{ background: conicGradient }}
            >
              <div className="absolute inset-3 bg-neutral-900 rounded-full flex items-center justify-center flex-col">
                <span className="text-2xl font-black">{winPct}%</span>
                <span className="text-[9px] uppercase tracking-widest text-neutral-500">Victorias</span>
              </div>
            </div>
            <div className="flex-1 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                  <span className="text-neutral-300">Ganados</span>
                </div>
                <span className="font-bold">{stats.pg}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-yellow-500"></div>
                  <span className="text-neutral-300">Empates</span>
                </div>
                <span className="font-bold">{stats.pe}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-red-500"></div>
                  <span className="text-neutral-300">Perdidos</span>
                </div>
                <span className="font-bold">{stats.pp}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Goles a favor */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-center">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
            Goles a favor
          </h3>
          <div className="text-5xl font-black text-green-400 tabular-nums">{stats.gf}</div>
          <div className="text-xs text-neutral-500 mt-2">Promedio: {avgGoalsFor} por partido</div>
        </div>

        {/* Goles en contra */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-center">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
            Goles en contra
          </h3>
          <div className="text-5xl font-black text-red-400 tabular-nums">{stats.gc}</div>
          <div className="text-xs text-neutral-500 mt-2">Promedio: {avgGoalsAgainst} por partido</div>
        </div>
      </section>

      {/* Diferencia, racha, puntos estimados */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
            Diferencia de gol
          </h3>
          <div className={`text-4xl font-black tabular-nums ${goalDiff > 0 ? 'text-green-400' : goalDiff < 0 ? 'text-red-400' : 'text-neutral-300'}`}>
            {goalDiff > 0 ? '+' : ''}{goalDiff}
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
            Racha actual
          </h3>
          <div className="text-base font-bold text-green-400 mt-1">{stats.streak || '–'}</div>
          {recent5.length > 0 && (
            <div className="flex gap-1.5 mt-3">
              {recent5.map((m, i) => (
                <span
                  key={i}
                  title={`${m.rivalName} (${m.score})`}
                  className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-black ${
                    m.result === 'W'
                      ? 'bg-green-500/20 text-green-400 border border-green-700/40'
                      : m.result === 'D'
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-700/40'
                      : 'bg-red-500/20 text-red-400 border border-red-700/40'
                  }`}
                >
                  {m.result === 'W' ? 'G' : m.result === 'D' ? 'E' : 'P'}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
            Puntos acumulados
          </h3>
          <div className="text-4xl font-black tabular-nums text-riverRed">{ptsEstimados}</div>
          <div className="text-xs text-neutral-500 mt-2">3 por victoria + 1 por empate</div>
        </div>
      </section>

      {/* Últimos 5 partidos */}
      {pastMatches.length > 0 && (
        <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
              Últimos partidos
            </h3>
            <Link to="/partidos" className="text-xs text-riverRed font-semibold hover:underline">
              Ver fixture completo →
            </Link>
          </div>
          <div className="space-y-2">
            {pastMatches.slice(0, 8).map((m) => {
              const f = formatRecent(m);
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800"
                >
                  <span
                    className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-black flex-shrink-0 ${
                      f.result === 'W'
                        ? 'bg-green-500/20 text-green-400 border border-green-700/40'
                        : f.result === 'D'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-700/40'
                        : 'bg-red-500/20 text-red-400 border border-red-700/40'
                    }`}
                  >
                    {f.result === 'W' ? 'G' : f.result === 'D' ? 'E' : 'P'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">vs {f.rivalName}</div>
                    <div className="text-[11px] text-neutral-500">
                      {m.competition} · {new Date(m.date).toLocaleDateString('es-AR')}
                    </div>
                  </div>
                  <span className="font-black text-sm tabular-nums">{f.score}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Distribución por competición */}
      {byCompetition.length > 0 && (
        <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">
            Partidos por competición
          </h3>
          <div className="space-y-3">
            {byCompetition.map(([name, count]) => {
              const pctOfTotal = pct(count, pastMatches.length);
              return (
                <div key={name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-300">{name}</span>
                    <span className="text-neutral-500 text-xs">
                      {count} ({pctOfTotal}%)
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-riverRed transition-all"
                      style={{ width: `${pctOfTotal}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Placeholders honestos para lo que viene */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 opacity-70">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">
            Goleadores
          </h3>
          <div className="flex items-center gap-3 text-sm text-neutral-500">
            <span className="text-2xl">🚧</span>
            <span>Próximamente: ranking individual cuando tengamos datos por partido.</span>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 opacity-70">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">
            Comparativa de temporadas
          </h3>
          <div className="flex items-center gap-3 text-sm text-neutral-500">
            <span className="text-2xl">📈</span>
            <span>Próximamente: gráfico de evolución vs temporadas anteriores.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
