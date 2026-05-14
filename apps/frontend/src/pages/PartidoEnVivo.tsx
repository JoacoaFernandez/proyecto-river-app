// apps/frontend/src/pages/PartidoEnVivo.tsx
import { Link } from 'react-router-dom';
import { useLiveMatch, type LiveMatchData } from '../hooks/useLiveMatch';
import LiveChat from '../components/LiveChat';
import EventTimeline from '../components/EventTimeline';
import type { MatchEvent } from '../services/matches.service';

/** Convert legacy scoringPlays to MatchEvent[] for backward compatibility */
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

function TeamBlock({
  name,
  side,
  isRiver,
}: {
  name: string;
  side: 'home' | 'away';
  isRiver: boolean;
}) {
  const initials = name.substring(0, 3).toUpperCase();
  return (
    <div className={`flex flex-col items-center gap-3 flex-1 ${side === 'away' ? 'items-end' : 'items-start'} sm:items-center`}>
      <div
        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center font-black text-base border-2 shadow-lg ${
          isRiver
            ? 'bg-white text-riverRed border-riverRed'
            : 'bg-neutral-800 text-neutral-300 border-neutral-700'
        }`}
      >
        {initials}
      </div>
      <span className="font-bold text-sm text-center leading-tight">{name}</span>
    </div>
  );
}

export default function PartidoEnVivo() {
  const { match, connected, loading } = useLiveMatch();

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


  const isHome = /river plate/i.test(match.homeTeam);

  return (
    <div className="max-w-6xl mx-auto px-4 mt-8 pb-12 flex flex-col lg:flex-row gap-8">
      {/* Columna Izquierda: Partido en Vivo */}
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
          <TeamBlock
            name={match.homeTeam}
            side="home"
            isRiver={isHome}
          />

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

            {/* Minuto */}
            <div className="bg-riverRed/20 border border-riverRed/40 rounded-lg px-3 py-1 text-center">
              <span className="text-riverRed font-black text-lg tabular-nums">
                {match.displayClock}'
              </span>
              {match.period === 2 && (
                <span className="text-[9px] text-neutral-500 block uppercase tracking-widest">2° Tiempo</span>
              )}
            </div>
          </div>

          <TeamBlock
            name={match.awayTeam}
            side="away"
            isRiver={!isHome}
          />
        </div>
      </section>

      {/* Cronología de eventos */}
      {(match.events.length > 0 || match.scoringPlays.length > 0) && (
        <EventTimeline
          events={match.events.length > 0 ? match.events : scoringPlaysToEvents(match)}
          compact
        />
      )}

        {/* Info actualización */}
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
