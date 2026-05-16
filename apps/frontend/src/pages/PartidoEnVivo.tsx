// apps/frontend/src/pages/PartidoEnVivo.tsx
import { useState, useEffect } from 'react';
import { useTeamLogo } from '../hooks/useTeamLogo';
import { Link } from 'react-router-dom';
import { useLiveMatch, type LiveMatchData, type MatchStatLine } from '../hooks/useLiveMatch';
import LiveChat from '../components/LiveChat';
import EventTimeline from '../components/EventTimeline';
import type { MatchEvent } from '../services/matches.service';
import { getLineup, type LineupPlayer } from '../services/formations.service';

const RIVER_RX = /river\s*plate|^river$/i;

/** Convert legacy scoringPlays to MatchEvent[] */
function scoringPlaysToEvents(match: LiveMatchData): MatchEvent[] {
  return match.scoringPlays.map((sp, i) => ({
    id: `sp-${i}`,
    type: sp.type === 'penalty' ? 'penalty-goal' : sp.type,
    minute: parseInt(sp.minute.replace("'", ''), 10) || 0,
    team: sp.team,
    playerName: sp.scorer,
    playerInName: null,
    assistName: null,
    detail: null,
    period: sp.period,
  }));
}

/** Returns true if displayClock is in extra time (contains '+') */
function isExtraTime(clock: string) {
  return clock.includes('+');
}

function LiveBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 bg-red-950/60 border border-red-800 text-riverRed px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
      <span className="w-2 h-2 rounded-full bg-riverRed animate-pulse" />
      En Vivo
    </div>
  );
}

function ConnectionDot({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-neutral-500">
      <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-600'}`} />
      {connected ? 'Conectado' : 'Reconectando…'}
    </div>
  );
}

function NoLiveMatch({ connected }: { connected: boolean }) {
  return (
    <div className="max-w-xl mx-auto px-4 mt-16 text-center space-y-4">
      <div className="text-6xl">📡</div>
      <h2 className="text-xl font-black">No hay partido en vivo</h2>
      <p className="text-neutral-400 text-sm leading-relaxed">
        Esta pantalla se actualiza automáticamente cuando River está jugando.
        El marcador aparecerá aquí en tiempo real.
      </p>
      <div className="flex justify-center">
        <ConnectionDot connected={connected} />
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Link
          to="/partidos/proximo"
          className="bg-riverRed hover:bg-red-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          Ver próximo partido
        </Link>
        <Link
          to="/partidos"
          className="border border-neutral-700 hover:border-neutral-500 text-neutral-300 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          Ver fixture completo
        </Link>
      </div>
    </div>
  );
}

function TeamBlock({ name, side, isRiver }: { name: string; side: 'home' | 'away'; isRiver: boolean }) {
  const initials = name.substring(0, 3).toUpperCase();
  const logo = useTeamLogo(name);
  const [imgFailed, setImgFailed] = useState(false);
  const showLogo = logo && !imgFailed;

  return (
    <div className={`flex flex-col items-center gap-3 flex-1 ${side === 'away' ? 'items-end' : 'items-start'} sm:items-center`}>
      <div
        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg border-2 ${
          isRiver ? 'border-riverRed bg-neutral-900' : 'border-neutral-700 bg-neutral-800'
        }`}
      >
        {showLogo ? (
          <img
            src={logo}
            alt={name}
            className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className={`font-black text-base ${isRiver ? 'text-riverRed' : 'text-neutral-300'}`}>
            {initials}
          </span>
        )}
      </div>
      <span className="font-bold text-sm text-center leading-tight">{name}</span>
    </div>
  );
}

/** VAR banner — shown when the most recent event is a VAR review */
function VarBanner({ event }: { event: MatchEvent }) {
  return (
    <div className="bg-purple-950/50 border border-purple-700/60 rounded-2xl px-4 py-3 flex items-center gap-3 animate-pulse">
      <span className="text-2xl">📺</span>
      <div>
        <div className="text-purple-300 font-black text-sm uppercase tracking-widest">Revisión VAR</div>
        {event.detail && <p className="text-purple-400 text-xs mt-0.5">{event.detail}</p>}
        <p className="text-purple-500 text-[10px]">min. {event.minute}'</p>
      </div>
    </div>
  );
}

/** Statistics table */
function StatsPanel({ stats, homeTeam, awayTeam }: { stats: MatchStatLine[]; homeTeam: string; awayTeam: string }) {
  if (stats.length === 0) return null;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
      <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-riverRed inline-block" />
        Estadísticas del partido
      </h3>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-x-2 items-center text-[10px] font-bold text-neutral-500 uppercase tracking-widest pb-1 border-b border-neutral-800">
        <span className="truncate">{homeTeam}</span>
        <span className="text-center px-2"></span>
        <span className="text-right truncate">{awayTeam}</span>
      </div>

      <div className="space-y-3">
        {stats.map((s) => (
          <div key={s.label} className="space-y-1">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
              <span className="font-bold tabular-nums text-white">{s.home}</span>
              <span className="text-[10px] text-neutral-500 uppercase tracking-wide text-center px-1 min-w-[80px]">{s.label}</span>
              <span className="font-bold tabular-nums text-white text-right">{s.away}</span>
            </div>
            {s.homePct !== undefined && (
              <div className="flex h-1.5 rounded-full overflow-hidden bg-neutral-800">
                <div
                  className="bg-riverRed rounded-l-full transition-all duration-700"
                  style={{ width: `${s.homePct}%` }}
                />
                <div
                  className="bg-neutral-600 rounded-r-full flex-1 transition-all duration-700"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Substitution counter per team */
function SubCounter({ events, homeTeam }: { events: MatchEvent[]; homeTeam: string }) {
  const subs = events.filter((e) => e.type === 'substitution');
  const homeSubs = subs.filter((e) => RIVER_RX.test(homeTeam)
    ? RIVER_RX.test(e.team)
    : e.team.toLowerCase().includes(homeTeam.toLowerCase().slice(0, 4))
  );
  const awaySubs = subs.length - homeSubs.length;

  if (subs.length === 0) return null;

  const MAX = 5;

  function SubDots({ count }: { count: number }) {
    return (
      <div className="flex gap-1">
        {Array.from({ length: MAX }).map((_, i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full ${i < count ? 'bg-blue-400' : 'bg-neutral-700'}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3">
      <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Cambios realizados</div>
      <div className="flex items-center justify-between gap-4 text-xs">
        <div className="flex flex-col gap-1">
          <span className="text-neutral-400 text-[10px] truncate">{homeTeam}</span>
          <SubDots count={homeSubs.length} />
          <span className="text-neutral-500 text-[10px]">{homeSubs.length}/{MAX}</span>
        </div>
        <div className="text-2xl">🔄</div>
        <div className="flex flex-col gap-1 items-end">
          <span className="text-neutral-400 text-[10px] truncate">Rival</span>
          <SubDots count={awaySubs} />
          <span className="text-neutral-500 text-[10px]">{awaySubs}/{MAX}</span>
        </div>
      </div>
    </div>
  );
}

/** Live lineup section — shows starters, marks substituted players */
function LiveLineup({ events }: { events: MatchEvent[] }) {
  const [players, setPlayers] = useState<LineupPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLineup()
      .then((data) => {
        if (data) setPlayers(data.lineup.map((s) => s.player).filter(Boolean) as LineupPlayer[]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-riverRed" />
      </div>
    );
  }

  if (players.length === 0) return null;

  // Build substitution map: playerOut → playerIn
  const subsOut = new Set<string>();
  const subsIn = new Map<string, string>(); // playerInName → playerOutName
  for (const e of events) {
    if (e.type === 'substitution' && e.playerName && e.playerInName) {
      subsOut.add(e.playerName.toLowerCase());
      subsIn.set(e.playerInName.toLowerCase(), e.playerName);
    }
  }

  return (
    <ul className="space-y-1 text-xs">
      {players.map((p) => {
        const nameKey = p.name.toLowerCase();
        const isOut = subsOut.has(nameKey);
        const replacedBy = [...subsIn.entries()].find(([, out]) =>
          out.toLowerCase() === nameKey
        )?.[0];

        return (
          <li
            key={p.id}
            className={`flex items-center gap-2 py-1.5 px-2 rounded-lg ${isOut ? 'opacity-40' : ''}`}
          >
            <span className="w-6 text-center font-bold tabular-nums text-neutral-500 shrink-0">
              {p.number ?? '–'}
            </span>
            <span className={`flex-1 truncate ${isOut ? 'line-through text-neutral-600' : 'text-neutral-300'}`}>
              {p.name}
            </span>
            {isOut && replacedBy && (
              <span className="text-green-400 text-[10px] shrink-0 truncate max-w-[80px]">↑ {replacedBy}</span>
            )}
            {isOut && !replacedBy && (
              <span className="text-red-500 text-[10px] shrink-0">↓ Salió</span>
            )}
            <span className="text-[9px] uppercase tracking-wider text-neutral-600 shrink-0">
              {p.position.slice(0, 3)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function PartidoEnVivo() {
  const { match, connected, loading } = useLiveMatch();
  const [showStats, setShowStats] = useState(false);
  const [showLineup, setShowLineup] = useState(false);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 mt-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-riverRed mx-auto mb-4" />
        <p className="text-neutral-400">Conectando…</p>
      </div>
    );
  }

  if (!match) {
    return <NoLiveMatch connected={connected} />;
  }

  const isHome = RIVER_RX.test(match.homeTeam);
  const events = match.events.length > 0 ? match.events : scoringPlaysToEvents(match);
  const lastEvent = events[events.length - 1];
  const isVarActive = lastEvent?.type === 'var';
  const extraTime = isExtraTime(match.displayClock);

  const periodLabel =
    match.period === 1 ? '1er Tiempo' :
    match.period === 2 ? '2do Tiempo' :
    match.period === 3 ? 'Tiempo Extra' :
    `Período ${match.period}`;

  return (
    <div className="max-w-6xl mx-auto px-4 mt-8 pb-12 flex flex-col lg:flex-row gap-8">
      {/* Columna Izquierda */}
      <div className="flex-1 space-y-5">
        {/* Breadcrumb */}
        <div className="text-sm text-neutral-500">
          <Link to="/partidos" className="hover:text-white">Partidos</Link>
          <span className="mx-2">/</span>
          <span className="text-white">En Vivo</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <LiveBadge />
          <ConnectionDot connected={connected} />
        </div>

        {/* VAR Banner */}
        {isVarActive && <VarBanner event={lastEvent} />}

        {/* Scoreboard principal */}
        <section className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl">
          {/* Competición */}
          <div className="text-center mb-5">
            <p className="text-[11px] text-neutral-500 uppercase tracking-widest">{match.competition}</p>
            {match.venue && (
              <p className="text-[10px] text-neutral-600 mt-0.5">{match.venue}</p>
            )}
          </div>

          {/* Equipos + marcador */}
          <div className="flex items-center justify-between gap-2">
            <TeamBlock name={match.homeTeam} side="home" isRiver={isHome} />

            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl sm:text-6xl font-black tabular-nums leading-none text-white">
                  {match.homeScore}
                </span>
                <span className="text-2xl text-neutral-600 font-black">-</span>
                <span className="text-5xl sm:text-6xl font-black tabular-nums leading-none text-white">
                  {match.awayScore}
                </span>
              </div>

              {/* Minuto + período */}
              <div className={`border rounded-lg px-3 py-1 text-center ${extraTime ? 'bg-amber-950/30 border-amber-700/40' : 'bg-riverRed/20 border-riverRed/40'}`}>
                <span className={`font-black text-lg tabular-nums ${extraTime ? 'text-amber-400' : 'text-riverRed'}`}>
                  {match.displayClock}'
                </span>
                {extraTime && (
                  <span className="text-[9px] text-amber-600 block uppercase tracking-widest">Desc.</span>
                )}
                <span className="text-[9px] text-neutral-500 block uppercase tracking-widest">{periodLabel}</span>
              </div>
            </div>

            <TeamBlock name={match.awayTeam} side="away" isRiver={!isHome} />
          </div>
        </section>

        {/* Contador de cambios */}
        {events.length > 0 && (
          <SubCounter events={events} homeTeam={match.homeTeam} />
        )}

        {/* Alineación en vivo toggle */}
        <div>
          <button
            onClick={() => setShowLineup((v) => !v)}
            className="w-full flex items-center justify-between bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl px-4 py-3 text-sm font-bold text-neutral-300 hover:text-white transition-all"
          >
            <span className="flex items-center gap-2">
              <span>👕</span> Alineación de River
              <span className="text-[10px] font-normal text-neutral-500">(actualizada con cambios)</span>
            </span>
            <span className="text-neutral-600">{showLineup ? '▲' : '▼'}</span>
          </button>
          {showLineup && (
            <div className="mt-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-3">
              <LiveLineup events={events} />
            </div>
          )}
        </div>

        {/* Estadísticas toggle */}
        {match.statistics.length > 0 && (
          <div>
            <button
              onClick={() => setShowStats((v) => !v)}
              className="w-full flex items-center justify-between bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl px-4 py-3 text-sm font-bold text-neutral-300 hover:text-white transition-all"
            >
              <span className="flex items-center gap-2">
                <span>📊</span> Estadísticas del partido
              </span>
              <span className="text-neutral-600">{showStats ? '▲' : '▼'}</span>
            </button>
            {showStats && (
              <div className="mt-2">
                <StatsPanel stats={match.statistics} homeTeam={match.homeTeam} awayTeam={match.awayTeam} />
              </div>
            )}
          </div>
        )}

        {/* Cronología de eventos */}
        {events.length > 0 && (
          <EventTimeline events={events} compact />
        )}

        <p className="text-center text-[10px] text-neutral-600">
          Marcador actualizado automáticamente cada 30 segundos vía ESPN.
        </p>
      </div>

      {/* Columna Derecha: Chat en Vivo */}
      <div className="w-full lg:w-[400px] shrink-0">
        <LiveChat />
      </div>
    </div>
  );
}
