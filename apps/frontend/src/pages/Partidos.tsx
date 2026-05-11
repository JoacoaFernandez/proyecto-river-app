// apps/frontend/src/pages/Partidos.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Link2, Check } from 'lucide-react';
import { getPastMatches, getUpcomingMatches } from '../services/matches.service';
import type { Match } from '../services/matches.service';

type Tab = 'proximos' | 'resultados';

const RIVER_RX = /river\s*plate|^river$/i;

function isRiver(name: string) {
  return RIVER_RX.test(name);
}

function matchResult(m: Match): 'W' | 'D' | 'L' | null {
  if (m.status !== 'finished' || m.homeScore === null || m.awayScore === null) return null;
  const riverHome = isRiver(m.homeTeam);
  const our = riverHome ? m.homeScore : m.awayScore;
  const them = riverHome ? m.awayScore : m.homeScore;
  return our > them ? 'W' : our < them ? 'L' : 'D';
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    day: d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }),
    time: d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
  };
}

function MatchCard({ m }: { m: Match }) {
  const result = matchResult(m);
  const isLive = m.status === 'live';
  const isFinished = m.status === 'finished';
  const { day, time } = formatDate(m.date);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/partidos/${m.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* no clipboard */
    }
  };

  const resultColor =
    result === 'W' ? 'border-green-700/50 bg-green-950/10' :
    result === 'L' ? 'border-red-800/50 bg-red-950/10' :
    result === 'D' ? 'border-yellow-700/50 bg-yellow-950/10' : '';

  const resultBadge =
    result === 'W' ? { label: 'Victoria', cls: 'bg-green-950/40 text-green-400 border-green-800/50' } :
    result === 'L' ? { label: 'Derrota', cls: 'bg-red-950/40 text-red-400 border-red-800/50' } :
    result === 'D' ? { label: 'Empate', cls: 'bg-yellow-950/40 text-yellow-400 border-yellow-800/50' } :
    null;

  return (
    <div className={`bg-neutral-900 border rounded-2xl p-5 transition-all hover:border-neutral-700 ${isLive ? 'border-green-700/60' : result ? resultColor : 'border-neutral-800'}`}>
      {/* Competición + fecha */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 truncate pr-2">
          {m.competition ?? 'Amistoso'}
        </span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {m.minute ? `${m.minute}'` : 'En vivo'}
            </span>
          )}
          {resultBadge && (
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${resultBadge.cls}`}>
              {resultBadge.label}
            </span>
          )}
          {!isLive && !isFinished && (
            <span className="text-[10px] text-neutral-500">{day} · {time}</span>
          )}
          {isFinished && (
            <span className="text-[10px] text-neutral-600">{day}</span>
          )}
        </div>
      </div>

      {/* Equipos + marcador */}
      <div className="flex items-center gap-3">
        {/* Local */}
        <div className="flex-1 min-w-0">
          <span className={`text-sm font-bold truncate block ${isRiver(m.homeTeam) ? 'text-white' : 'text-neutral-300'}`}>
            {m.homeTeam}
          </span>
          {m.stadium && !isFinished && !isLive && (
            <span className="text-[11px] text-neutral-600 truncate block mt-0.5">{m.stadium}</span>
          )}
        </div>

        {/* Marcador / vs */}
        <div className="flex-shrink-0 text-center">
          {isFinished || isLive ? (
            <div className={`flex items-center gap-1 bg-neutral-950 border px-3 py-1.5 rounded-xl ${isLive ? 'border-green-800/50' : 'border-neutral-800'}`}>
              <span className={`text-xl font-black tabular-nums ${isRiver(m.homeTeam) && result === 'W' ? 'text-white' : isRiver(m.awayTeam) && result === 'L' ? 'text-white' : 'text-neutral-300'}`}>
                {m.homeScore ?? 0}
              </span>
              <span className="text-neutral-600 text-sm mx-0.5">-</span>
              <span className={`text-xl font-black tabular-nums ${isRiver(m.awayTeam) && result === 'W' ? 'text-white' : isRiver(m.homeTeam) && result === 'L' ? 'text-white' : 'text-neutral-300'}`}>
                {m.awayScore ?? 0}
              </span>
            </div>
          ) : (
            <span className="text-xs font-bold text-neutral-600 bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-xl">VS</span>
          )}
        </div>

        {/* Visitante */}
        <div className="flex-1 min-w-0 text-right">
          <span className={`text-sm font-bold truncate block ${isRiver(m.awayTeam) ? 'text-white' : 'text-neutral-300'}`}>
            {m.awayTeam}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center gap-2">
        <Link
          to={`/partidos/${m.id}`}
          className="flex-1 flex items-center justify-center gap-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white font-semibold text-xs py-2 rounded-xl transition-all"
        >
          Ver detalles →
        </Link>
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-500 hover:text-white text-xs py-2 px-3 rounded-xl transition-all"
          title="Copiar enlace"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Link2 className="w-3.5 h-3.5" />}
        </button>
        {isLive && (
          <Link
            to="/partidos/en-vivo"
            className="flex items-center gap-1 bg-green-950/30 hover:bg-green-950/50 border border-green-800/50 text-green-400 font-bold text-xs py-2 px-3 rounded-xl transition-all"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            En vivo
          </Link>
        )}
      </div>
    </div>
  );
}

export default function Partidos() {
  const [tab, setTab] = useState<Tab>('proximos');
  const [upcoming, setUpcoming] = useState<Match[]>([]);
  const [past, setPast] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [competition, setCompetition] = useState('all');

  useEffect(() => {
    setLoading(true);
    Promise.all([getUpcomingMatches(20), getPastMatches(30)])
      .then(([u, p]) => {
        setUpcoming(Array.isArray(u) ? u : []);
        setPast(Array.isArray(p) ? p : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const liveMatch = useMemo(
    () => upcoming.find((m) => m.status === 'live') ?? past.find((m) => m.status === 'live') ?? null,
    [upcoming, past],
  );

  const competitions = useMemo(() => {
    const all = [...upcoming, ...past].map((m) => m.competition).filter(Boolean) as string[];
    return Array.from(new Set(all)).sort();
  }, [upcoming, past]);

  const currentList = tab === 'proximos' ? upcoming : past;

  const filtered = useMemo(() => {
    if (competition === 'all') return currentList;
    return currentList.filter((m) => m.competition === competition);
  }, [currentList, competition]);

  return (
    <div className="max-w-4xl mx-auto px-4 mt-6 pb-12 space-y-5">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-4">
        <h1 className="text-2xl font-black tracking-wide uppercase">Fixture</h1>
        <p className="text-sm text-neutral-400 mt-1">Calendario y resultados del Millonario</p>
      </div>

      {/* Banner partido en vivo */}
      {liveMatch && (
        <Link
          to="/partidos/en-vivo"
          className="flex items-center justify-between bg-green-950/20 border border-green-700/50 rounded-2xl px-5 py-4 hover:bg-green-950/30 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            <div>
              <div className="text-sm font-black text-green-400">PARTIDO EN VIVO</div>
              <div className="text-xs text-neutral-400 mt-0.5">
                {liveMatch.homeTeam} {liveMatch.homeScore ?? 0} - {liveMatch.awayScore ?? 0} {liveMatch.awayTeam}
                {liveMatch.minute ? ` · ${liveMatch.minute}'` : ''}
              </div>
            </div>
          </div>
          <span className="text-green-400 text-sm font-bold">Ver →</span>
        </Link>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {(['proximos', 'resultados'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setCompetition('all'); }}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === t
                ? 'bg-riverRed text-white shadow-lg shadow-red-900/30'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
            }`}
          >
            {t === 'proximos' ? `Próximos (${upcoming.length})` : `Resultados (${past.length})`}
          </button>
        ))}
      </div>

      {/* Filtro por competición */}
      {competitions.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          <button
            onClick={() => setCompetition('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${competition === 'all' ? 'bg-neutral-700 text-white' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'}`}
          >
            Todas
          </button>
          {competitions.map((c) => (
            <button
              key={c}
              onClick={() => setCompetition(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${competition === c ? 'bg-neutral-700 text-white' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'}`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-riverRed mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center text-sm text-neutral-500">
          {competition !== 'all' ? 'No hay partidos para esa competición.' : tab === 'proximos' ? 'No hay próximos partidos programados.' : 'No hay resultados disponibles.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <MatchCard key={m.id} m={m} />
          ))}
        </div>
      )}
    </div>
  );
}
