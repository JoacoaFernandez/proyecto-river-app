// apps/frontend/src/pages/Estadisticas.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { getLiveDashboard } from '../services/live.service';
import { getPastMatches } from '../services/matches.service';
import { getLeaderboard, type LeaderboardEntry } from '../services/players.service';

interface TeamStats {
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  streak: string;
  bestStreak?: string;
  penaltyGoals?: number;
  topScorer: string;
}

type SortCol = 'date' | 'goals' | 'possession' | 'shotsOnTarget' | 'totalShots' | 'corners' | 'fouls' | 'yellowCards';

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

function getRiverStat(match: any, key: string): number | null {
  if (!match.statistics) return null;
  const side = RIVER_RX.test(match.homeTeam) ? 'home' : 'away';
  const val = match.statistics[key]?.[side];
  return val != null ? Number(val) : null;
}

const positionLabel: Record<string, string> = {
  Goalkeeper: 'ARQ',
  Defender: 'DEF',
  Midfielder: 'MED',
  Attacker: 'DEL',
};

export default function Estadisticas() {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [pastMatches, setPastMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [sortCol, setSortCol] = useState<SortCol>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    Promise.all([getLiveDashboard(), getPastMatches(20)])
      .then(([dashboard, past]) => {
        setStats(dashboard?.stats ?? null);
        setPastMatches(Array.isArray(past) ? past : []);
      })
      .finally(() => setLoading(false));

    getLeaderboard()
      .then(setLeaderboard)
      .finally(() => setLeaderboardLoading(false));
  }, []);

  const recent5 = useMemo(() => pastMatches.slice(0, 5).map(formatRecent), [pastMatches]);

  const byCompetition = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of pastMatches) {
      const c = m.competition || 'Sin competición';
      map[c] = (map[c] ?? 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [pastMatches]);

  // Matches with statistics for the table
  const matchesWithStats = useMemo(() => {
    return pastMatches
      .filter((m) => m.statistics != null)
      .map((m) => {
        const isHome = RIVER_RX.test(m.homeTeam);
        const our = isHome ? m.homeScore ?? 0 : m.awayScore ?? 0;
        const them = isHome ? m.awayScore ?? 0 : m.homeScore ?? 0;
        return {
          ...m,
          rival: isHome ? m.awayTeam : m.homeTeam,
          result: (our > them ? 'W' : our === them ? 'D' : 'L') as 'W' | 'D' | 'L',
          score: `${our}-${them}`,
          riverGoals: our,
          riverPoss: getRiverStat(m, 'possession'),
          riverShotsOnTarget: getRiverStat(m, 'shotsOnTarget'),
          riverTotalShots: getRiverStat(m, 'totalShots'),
          riverCorners: getRiverStat(m, 'corners'),
          riverFouls: getRiverStat(m, 'fouls'),
          riverYellowCards: getRiverStat(m, 'yellowCards'),
        };
      });
  }, [pastMatches]);

  const sortedMatchStats = useMemo(() => {
    const arr = [...matchesWithStats];
    arr.sort((a, b) => {
      let va: number, vb: number;
      switch (sortCol) {
        case 'date':          va = new Date(a.date).getTime(); vb = new Date(b.date).getTime(); break;
        case 'goals':         va = a.riverGoals ?? 0;          vb = b.riverGoals ?? 0;          break;
        case 'possession':    va = a.riverPoss ?? -1;          vb = b.riverPoss ?? -1;          break;
        case 'shotsOnTarget': va = a.riverShotsOnTarget ?? -1; vb = b.riverShotsOnTarget ?? -1; break;
        case 'totalShots':    va = a.riverTotalShots ?? -1;    vb = b.riverTotalShots ?? -1;    break;
        case 'corners':       va = a.riverCorners ?? -1;       vb = b.riverCorners ?? -1;       break;
        case 'fouls':         va = a.riverFouls ?? -1;         vb = b.riverFouls ?? -1;         break;
        case 'yellowCards':   va = a.riverYellowCards ?? -1;   vb = b.riverYellowCards ?? -1;   break;
        default:              va = 0; vb = 0;
      }
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return arr;
  }, [matchesWithStats, sortCol, sortDir]);

  // Indices of best and worst matches (by possession, fallback to goals)
  const { bestMatchId, worstMatchId } = useMemo(() => {
    if (matchesWithStats.length === 0) return { bestMatchId: null, worstMatchId: null };
    const withPoss = matchesWithStats.filter((m) => m.riverPoss != null);
    if (withPoss.length === 0) return { bestMatchId: null, worstMatchId: null };
    const best = [...withPoss].sort((a, b) => (b.riverPoss ?? 0) - (a.riverPoss ?? 0))[0];
    const losses = withPoss.filter((m) => m.result === 'L');
    const worstPool = losses.length > 0 ? losses : withPoss;
    const worst = [...worstPool].sort((a, b) => (a.riverPoss ?? 100) - (b.riverPoss ?? 100))[0];
    return { bestMatchId: best.id, worstMatchId: worst?.id ?? null };
  }, [matchesWithStats]);

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortCol(col); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: SortCol }) => {
    if (sortCol !== col) return <ChevronsUpDown className="inline w-3 h-3 ml-0.5 text-neutral-600" />;
    return sortDir === 'asc'
      ? <ChevronUp className="inline w-3 h-3 ml-0.5 text-riverRed" />
      : <ChevronDown className="inline w-3 h-3 ml-0.5 text-riverRed" />;
  };

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

  const winPct = pct(stats.pg, stats.pj);
  const drawPct = pct(stats.pe, stats.pj);
  const lossPct = 100 - winPct - drawPct;
  const goalDiff = stats.gf - stats.gc;
  const avgGoalsFor = (stats.gf / stats.pj).toFixed(2);
  const avgGoalsAgainst = (stats.gc / stats.pj).toFixed(2);
  const ptsEstimados = stats.pg * 3 + stats.pe;
  const penaltyGoals = stats.penaltyGoals ?? 0;

  const conicGradient = `conic-gradient(
    rgb(34 197 94) 0deg ${winPct * 3.6}deg,
    rgb(234 179 8) ${winPct * 3.6}deg ${(winPct + drawPct) * 3.6}deg,
    rgb(239 68 68) ${(winPct + drawPct) * 3.6}deg 360deg
  )`;

  const thClass = 'px-3 py-2 text-left text-[10px] uppercase tracking-wider text-neutral-500 font-bold cursor-pointer hover:text-neutral-300 select-none whitespace-nowrap';

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
          {penaltyGoals > 0 && (
            <div className="flex gap-4 mt-3 text-xs">
              <span className="text-neutral-400">Juego: <b className="text-white">{stats.gf - penaltyGoals}</b></span>
              <span className="text-neutral-400">Penal: <b className="text-yellow-400">{penaltyGoals}</b></span>
            </div>
          )}
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

      {/* Diferencia, racha, puntos, promedio goles */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          {stats.bestStreak && stats.bestStreak !== '-' && (
            <div className="text-xs text-neutral-500 mt-2">
              Mejor: <span className="text-neutral-300 font-semibold">{stats.bestStreak}</span>
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

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
            Goles/PJ
          </h3>
          <div className="text-4xl font-black tabular-nums text-green-400">{avgGoalsFor}</div>
          <div className="text-xs text-neutral-500 mt-2">{avgGoalsAgainst} en contra por PJ</div>
        </div>
      </section>

      {/* Últimos partidos */}
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

      {/* Estadísticas por partido — tabla ordenable */}
      {sortedMatchStats.length > 0 && (
        <section className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
              Estadísticas por partido
            </h3>
            <div className="flex items-center gap-2 text-[10px] text-neutral-600">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-950 border border-green-700/40 inline-block" /> Mejor</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-950 border border-red-700/40 inline-block" /> Peor</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y border-neutral-800 bg-neutral-950/50">
                <tr>
                  <th className={thClass} onClick={() => toggleSort('date')}>
                    Fecha <SortIcon col="date" />
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-neutral-500 font-bold whitespace-nowrap">Rival</th>
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-neutral-500 font-bold">Res</th>
                  <th className={thClass} onClick={() => toggleSort('goals')}>
                    Goles <SortIcon col="goals" />
                  </th>
                  <th className={thClass} onClick={() => toggleSort('possession')}>
                    Pos% <SortIcon col="possession" />
                  </th>
                  <th className={thClass} onClick={() => toggleSort('totalShots')}>
                    Tiros <SortIcon col="totalShots" />
                  </th>
                  <th className={thClass} onClick={() => toggleSort('shotsOnTarget')}>
                    Al arco <SortIcon col="shotsOnTarget" />
                  </th>
                  <th className={thClass} onClick={() => toggleSort('corners')}>
                    Córners <SortIcon col="corners" />
                  </th>
                  <th className={`${thClass} hidden sm:table-cell`} onClick={() => toggleSort('fouls')}>
                    Faltas <SortIcon col="fouls" />
                  </th>
                  <th className={`${thClass} hidden sm:table-cell`} onClick={() => toggleSort('yellowCards')}>
                    <span title="Tarjetas amarillas">TA</span> <SortIcon col="yellowCards" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {sortedMatchStats.map((m) => {
                  const isBest = m.id === bestMatchId;
                  const isWorst = m.id === worstMatchId;
                  const resultColor =
                    m.result === 'W' ? 'text-green-400' : m.result === 'D' ? 'text-yellow-400' : 'text-red-400';
                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-neutral-800/40 transition-colors ${
                        isBest ? 'bg-green-950/30 ring-1 ring-inset ring-green-700/20' :
                        isWorst ? 'bg-red-950/30 ring-1 ring-inset ring-red-700/20' : ''
                      }`}
                    >
                      <td className="px-3 py-2.5 text-neutral-400 text-xs whitespace-nowrap">
                        {new Date(m.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                      </td>
                      <td className="px-3 py-2.5 max-w-[120px]">
                        <Link to={`/partidos/${m.id}`} className="hover:text-riverRed transition-colors">
                          <span className="truncate block text-xs font-medium">{m.rival}</span>
                        </Link>
                      </td>
                      <td className={`px-3 py-2.5 font-black text-xs ${resultColor}`}>
                        {m.score}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-center tabular-nums">
                        {m.riverGoals}
                      </td>
                      <td className="px-3 py-2.5 text-center tabular-nums text-xs">
                        {m.riverPoss != null ? `${m.riverPoss}%` : '–'}
                      </td>
                      <td className="px-3 py-2.5 text-center tabular-nums text-xs">
                        {m.riverTotalShots ?? '–'}
                      </td>
                      <td className="px-3 py-2.5 text-center tabular-nums text-xs">
                        {m.riverShotsOnTarget ?? '–'}
                      </td>
                      <td className="px-3 py-2.5 text-center tabular-nums text-xs">
                        {m.riverCorners ?? '–'}
                      </td>
                      <td className="px-3 py-2.5 text-center tabular-nums text-xs hidden sm:table-cell">
                        {m.riverFouls ?? '–'}
                      </td>
                      <td className="px-3 py-2.5 text-center tabular-nums text-xs hidden sm:table-cell">
                        {m.riverYellowCards != null ? (
                          <span className={m.riverYellowCards > 2 ? 'text-yellow-400 font-bold' : ''}>
                            {m.riverYellowCards}
                          </span>
                        ) : '–'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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

      {/* Comparador */}
      <Link
        to="/comparador"
        className="flex items-center justify-between bg-neutral-900 border border-neutral-800 hover:border-riverRed rounded-2xl p-5 transition-all group"
      >
        <div>
          <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Comparador de jugadores</div>
          <div className="text-sm text-neutral-300 group-hover:text-white transition-colors">
            Comparar estadísticas cara a cara entre dos jugadores del plantel
          </div>
        </div>
        <span className="text-riverRed font-bold text-lg ml-4">→</span>
      </Link>

      {/* Goleadores */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Goleadores</h3>
          {leaderboard.length > 0 && (
            <span className="text-[10px] text-neutral-600 border border-neutral-800 px-2 py-0.5 rounded-full">
              Temporada {leaderboard[0].season}
            </span>
          )}
        </div>

        {leaderboardLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-riverRed" />
          </div>
        ) : leaderboard.filter((p) => p.goals > 0).length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-6">
            Sin datos de goles disponibles aún.
          </p>
        ) : (
          <div className="space-y-2">
            {leaderboard
              .filter((p) => p.goals > 0)
              .slice(0, 10)
              .map((p, idx) => (
                <Link
                  key={p.id}
                  to={`/plantel/${p.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-all"
                >
                  <span className="w-5 text-center text-xs font-black text-neutral-500 tabular-nums">
                    {idx + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {p.photo ? (
                      <img
                        src={p.photo}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <User className="w-4 h-4 text-neutral-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{p.name}</div>
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider">
                      {positionLabel[p.position] ?? p.position}
                      {p.number != null && ` · #${p.number}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right flex-shrink-0">
                    <div>
                      <div className="text-lg font-black text-riverRed tabular-nums">{p.goals}</div>
                      <div className="text-[9px] uppercase tracking-widest text-neutral-500">Goles</div>
                    </div>
                    {p.assists > 0 && (
                      <div>
                        <div className="text-lg font-black text-blue-400 tabular-nums">{p.assists}</div>
                        <div className="text-[9px] uppercase tracking-widest text-neutral-500">Asist.</div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-neutral-400 tabular-nums">{p.appearances}</div>
                      <div className="text-[9px] uppercase tracking-widest text-neutral-500">PJ</div>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        )}
      </section>

      {/* Asistencias */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Asistencias</h3>
          {leaderboard.length > 0 && (
            <span className="text-[10px] text-neutral-600 border border-neutral-800 px-2 py-0.5 rounded-full">
              Temporada {leaderboard[0].season}
            </span>
          )}
        </div>

        {leaderboardLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400" />
          </div>
        ) : leaderboard.filter((p) => p.assists > 0).length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-6">
            Sin datos de asistencias disponibles aún.
          </p>
        ) : (
          <div className="space-y-2">
            {[...leaderboard]
              .filter((p) => p.assists > 0)
              .sort((a, b) => b.assists - a.assists || (b.goals + b.assists) - (a.goals + a.assists))
              .slice(0, 10)
              .map((p, idx) => (
                <Link
                  key={p.id}
                  to={`/plantel/${p.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-all"
                >
                  <span className="w-5 text-center text-xs font-black text-neutral-500 tabular-nums">
                    {idx + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {p.photo ? (
                      <img
                        src={p.photo}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <User className="w-4 h-4 text-neutral-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{p.name}</div>
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider">
                      {positionLabel[p.position] ?? p.position}
                      {p.number != null && ` · #${p.number}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right flex-shrink-0">
                    <div>
                      <div className="text-lg font-black text-blue-400 tabular-nums">{p.assists}</div>
                      <div className="text-[9px] uppercase tracking-widest text-neutral-500">Asist.</div>
                    </div>
                    {p.goals > 0 && (
                      <div>
                        <div className="text-lg font-black text-riverRed tabular-nums">{p.goals}</div>
                        <div className="text-[9px] uppercase tracking-widest text-neutral-500">Goles</div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-neutral-400 tabular-nums">{p.goals + p.assists}</div>
                      <div className="text-[9px] uppercase tracking-widest text-neutral-500">G+A</div>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
