// apps/frontend/src/pages/Partidos.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Link2, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPastMatches, getUpcomingMatches } from '../services/matches.service';
import type { Match } from '../services/matches.service';

type Tab = 'proximos' | 'resultados' | 'calendario';
type VenueFilter = 'all' | 'home' | 'away';
type ResultFilter = 'all' | 'W' | 'D' | 'L';

const RIVER_RX = /river\s*plate|^river$/i;
const PAGE_SIZE = 10;

function isRiver(name: string) { return RIVER_RX.test(name); }

function getSeason(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  return d.getMonth() >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
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

const POSTPONED_STATUSES = new Set(['postponed', 'PST', 'cancelled', 'CANC', 'suspended', 'TBD', 'ABD', 'INT', 'SUSP']);

function statusBadge(status: string): { label: string; cls: string } | null {
  if (status === 'postponed' || status === 'PST') return { label: 'Postergado', cls: 'bg-orange-950/40 text-orange-400 border-orange-800/50' };
  if (status === 'cancelled' || status === 'CANC') return { label: 'Cancelado', cls: 'bg-neutral-800 text-neutral-400 border-neutral-700' };
  if (status === 'suspended' || status === 'SUSP') return { label: 'Suspendido', cls: 'bg-orange-950/40 text-orange-400 border-orange-800/50' };
  if (status === 'TBD') return { label: 'A confirmar', cls: 'bg-neutral-800 text-neutral-400 border-neutral-700' };
  return null;
}

function MatchCard({ m }: { m: Match }) {
  const result = matchResult(m);
  const isLive = m.status === 'live';
  const isFinished = m.status === 'finished';
  const isPostponed = POSTPONED_STATUSES.has(m.status);
  const { day, time } = formatDate(m.date);
  const [copied, setCopied] = useState(false);
  const badge = statusBadge(m.status);

  const handleShare = async () => {
    const url = `${window.location.origin}/partidos/${m.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* no clipboard */ }
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
    <div className={`bg-neutral-900 border rounded-2xl p-5 transition-all hover:border-neutral-700 ${
      isLive ? 'border-green-700/60' :
      result ? resultColor :
      isPostponed ? 'border-orange-800/30 bg-orange-950/5' :
      'border-neutral-800'
    }`}>
      {/* Competición + estado */}
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
          {badge && (
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${badge.cls}`}>
              {badge.label}
            </span>
          )}
          {resultBadge && (
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${resultBadge.cls}`}>
              {resultBadge.label}
            </span>
          )}
          {!isLive && !isFinished && !isPostponed && (
            <span className="text-[10px] text-neutral-500">{day} · {time}</span>
          )}
          {(isFinished || isPostponed) && (
            <span className="text-[10px] text-neutral-600">{day}</span>
          )}
        </div>
      </div>

      {/* Equipos + marcador */}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <span className={`text-sm font-bold truncate block ${isRiver(m.homeTeam) ? 'text-white' : 'text-neutral-300'}`}>
            {m.homeTeam}
          </span>
          {m.stadium && !isFinished && !isLive && (
            <span className="text-[11px] text-neutral-600 truncate block mt-0.5">{m.stadium}</span>
          )}
        </div>

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
            <span className="text-xs font-bold text-neutral-600 bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-xl">
              {isPostponed ? '–' : 'VS'}
            </span>
          )}
        </div>

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

function CalendarView({ matches }: { matches: Match[] }) {
  const today = new Date();
  const [calDate, setCalDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = calDate.getFullYear();
  const month = calDate.getMonth();

  const matchesByDay = useMemo(() => {
    const map = new Map<number, Match[]>();
    matches.forEach(m => {
      const d = new Date(m.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(m);
      }
    });
    return map;
  }, [matches, year, month]);

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const monthName = calDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
        {/* Month navigator */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => { setCalDate(new Date(year, month - 1, 1)); setSelectedDay(null); }}
            className="w-9 h-9 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold capitalize text-sm">{monthName}</span>
          <button
            onClick={() => { setCalDate(new Date(year, month + 1, 1)); setSelectedDay(null); }}
            className="w-9 h-9 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-neutral-600 uppercase py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="space-y-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((day, di) => {
                if (day === null) return <div key={di} className="aspect-square" />;
                const dayMatches = matchesByDay.get(day) ?? [];
                const hasMatch = dayMatches.length > 0;
                const isToday = isCurrentMonth && day === today.getDate();
                const isSelected = selectedDay === day && hasMatch;
                return (
                  <button
                    key={di}
                    onClick={() => hasMatch ? setSelectedDay(isSelected ? null : day) : undefined}
                    disabled={!hasMatch}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all
                      ${isToday ? 'ring-1 ring-riverRed ring-offset-1 ring-offset-neutral-900' : ''}
                      ${isSelected
                        ? 'bg-riverRed text-white'
                        : hasMatch
                          ? 'bg-riverRed/15 hover:bg-riverRed/25 text-white border border-riverRed/40 cursor-pointer'
                          : 'text-neutral-700 cursor-default'
                      }
                    `}
                  >
                    {day}
                    {hasMatch && !isSelected && (
                      <span className="w-1 h-1 rounded-full bg-riverRed mt-0.5 block" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-[10px] text-neutral-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-riverRed/15 border border-riverRed/40 inline-block" />
            Partido
          </div>
          {isCurrentMonth && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md ring-1 ring-riverRed inline-block" />
              Hoy
            </div>
          )}
        </div>
      </div>

      {/* Selected day matches */}
      {selectedDay !== null && matchesByDay.get(selectedDay) && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
            {selectedDay} de {calDate.toLocaleDateString('es-AR', { month: 'long' })}
          </p>
          {matchesByDay.get(selectedDay)!.map(m => (
            <MatchCard key={m.id} m={m} />
          ))}
        </div>
      )}

      {matchesByDay.size === 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center text-sm text-neutral-500">
          Sin partidos en {monthName}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active, onClick, children, activeClass,
}: { active: boolean; onClick: () => void; children: React.ReactNode; activeClass?: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
        active
          ? activeClass ?? 'bg-neutral-700 text-white'
          : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

export default function Partidos() {
  const [tab, setTab] = useState<Tab>('proximos');
  const [upcoming, setUpcoming] = useState<Match[]>([]);
  const [past, setPast] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [competition, setCompetition] = useState('all');
  const [season, setSeason] = useState('all');
  const [venue, setVenue] = useState<VenueFilter>('all');
  const [result, setResult] = useState<ResultFilter>('all');
  const [page, setPage] = useState(PAGE_SIZE);

  useEffect(() => {
    setLoading(true);
    Promise.all([getUpcomingMatches(20), getPastMatches(60)])
      .then(([u, p]) => {
        setUpcoming(Array.isArray(u) ? u : []);
        setPast(Array.isArray(p) ? p : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const liveMatch = useMemo(
    () => upcoming.find(m => m.status === 'live') ?? past.find(m => m.status === 'live') ?? null,
    [upcoming, past],
  );

  const competitions = useMemo(() => {
    const src = tab === 'proximos' ? upcoming : past;
    const all = src.map(m => m.competition).filter(Boolean) as string[];
    return Array.from(new Set(all)).sort();
  }, [upcoming, past, tab]);

  const seasons = useMemo(() => {
    const all = [...upcoming, ...past].map(m => getSeason(m.date));
    return Array.from(new Set(all)).sort().reverse();
  }, [upcoming, past]);

  const allMatches = useMemo(() => [...upcoming, ...past], [upcoming, past]);

  const currentList = tab === 'proximos' ? upcoming : past;

  const filtered = useMemo(() => {
    return currentList
      .filter(m => competition === 'all' || m.competition === competition)
      .filter(m => season === 'all' || getSeason(m.date) === season)
      .filter(m => venue === 'all' || (venue === 'home' ? isRiver(m.homeTeam) : isRiver(m.awayTeam)))
      .filter(m => result === 'all' || matchResult(m) === result);
  }, [currentList, competition, season, venue, result]);

  const hasActiveFilters = competition !== 'all' || season !== 'all' || venue !== 'all' || result !== 'all';

  function resetFilters() {
    setCompetition('all');
    setSeason('all');
    setVenue('all');
    setResult('all');
    setPage(PAGE_SIZE);
  }

  function switchTab(t: Tab) {
    setTab(t);
    setResult('all');
    setPage(PAGE_SIZE);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 mt-6 pb-12 space-y-5">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-4">
        <h1 className="text-2xl font-black tracking-wide uppercase">Fixture</h1>
        <p className="text-sm text-neutral-400 mt-1">Calendario y resultados del Millonario</p>
      </div>

      {/* Banner en vivo */}
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
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {([
          { id: 'proximos' as Tab, label: `Próximos (${upcoming.length})` },
          { id: 'resultados' as Tab, label: `Resultados (${past.length})` },
          { id: 'calendario' as Tab, label: 'Calendario' },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex-shrink-0 ${
              tab === t.id
                ? 'bg-riverRed text-white shadow-lg shadow-red-900/30'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Calendar view */}
      {tab === 'calendario' && <CalendarView matches={allMatches} />}

      {/* List view */}
      {tab !== 'calendario' && (
        <>
          {/* Filtros */}
          <div className="space-y-2">
            {/* Temporada */}
            {seasons.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar items-center">
                <span className="text-[10px] text-neutral-600 uppercase tracking-widest flex-shrink-0 w-20">Temporada</span>
                <FilterChip active={season === 'all'} onClick={() => { setSeason('all'); setPage(PAGE_SIZE); }}>Todas</FilterChip>
                {seasons.map(s => (
                  <FilterChip key={s} active={season === s} onClick={() => { setSeason(s); setPage(PAGE_SIZE); }}>{s}</FilterChip>
                ))}
              </div>
            )}

            {/* Competición */}
            {competitions.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar items-center">
                <span className="text-[10px] text-neutral-600 uppercase tracking-widest flex-shrink-0 w-20">Copa</span>
                <FilterChip active={competition === 'all'} onClick={() => { setCompetition('all'); setPage(PAGE_SIZE); }}>Todas</FilterChip>
                {competitions.map(c => (
                  <FilterChip key={c} active={competition === c} onClick={() => { setCompetition(c); setPage(PAGE_SIZE); }}>{c}</FilterChip>
                ))}
              </div>
            )}

            {/* Condición */}
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar items-center">
              <span className="text-[10px] text-neutral-600 uppercase tracking-widest flex-shrink-0 w-20">Cancha</span>
              <FilterChip active={venue === 'all'} onClick={() => { setVenue('all'); setPage(PAGE_SIZE); }}>Todas</FilterChip>
              <FilterChip active={venue === 'home'} onClick={() => { setVenue('home'); setPage(PAGE_SIZE); }}>Local</FilterChip>
              <FilterChip active={venue === 'away'} onClick={() => { setVenue('away'); setPage(PAGE_SIZE); }}>Visitante</FilterChip>
            </div>

            {/* Resultado (solo tab resultados) */}
            {tab === 'resultados' && (
              <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar items-center">
                <span className="text-[10px] text-neutral-600 uppercase tracking-widest flex-shrink-0 w-20">Resultado</span>
                <FilterChip active={result === 'all'} onClick={() => { setResult('all'); setPage(PAGE_SIZE); }}>Todos</FilterChip>
                <FilterChip active={result === 'W'} onClick={() => { setResult('W'); setPage(PAGE_SIZE); }} activeClass="bg-green-900 text-green-300">Victorias</FilterChip>
                <FilterChip active={result === 'D'} onClick={() => { setResult('D'); setPage(PAGE_SIZE); }} activeClass="bg-yellow-900 text-yellow-300">Empates</FilterChip>
                <FilterChip active={result === 'L'} onClick={() => { setResult('L'); setPage(PAGE_SIZE); }} activeClass="bg-red-900 text-red-300">Derrotas</FilterChip>
              </div>
            )}

            {hasActiveFilters && (
              <div className="flex justify-end">
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 rounded-xl text-xs text-neutral-500 hover:text-white border border-neutral-800 hover:border-neutral-700 transition-all"
                >
                  Limpiar filtros ✕
                </button>
              </div>
            )}
          </div>

          {/* Lista de partidos */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-riverRed mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center text-sm text-neutral-500">
              {hasActiveFilters
                ? 'No hay partidos con esos filtros.'
                : tab === 'proximos'
                  ? 'No hay próximos partidos programados.'
                  : 'No hay resultados disponibles.'}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {filtered.slice(0, page).map(m => (
                  <MatchCard key={m.id} m={m} />
                ))}
              </div>
              {filtered.length > page && (
                <button
                  onClick={() => setPage(p => p + PAGE_SIZE)}
                  className="w-full py-3 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 hover:border-neutral-700 text-sm font-semibold text-neutral-400 hover:text-white transition-all"
                >
                  Ver más ({filtered.length - page} restantes)
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
