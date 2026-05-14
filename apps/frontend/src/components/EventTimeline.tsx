// apps/frontend/src/components/EventTimeline.tsx
import type { MatchEvent } from '../services/matches.service';

const EVENT_CONFIG: Record<string, { icon: string; color: string; bgColor: string; label: string }> = {
  'goal':         { icon: '⚽', color: 'text-green-400', bgColor: 'bg-green-950/40 border-green-900/40', label: 'Gol' },
  'own-goal':     { icon: '⚽', color: 'text-orange-400', bgColor: 'bg-orange-950/40 border-orange-900/40', label: 'Gol en contra' },
  'penalty-goal': { icon: '🎯', color: 'text-green-400', bgColor: 'bg-green-950/40 border-green-900/40', label: 'Penal convertido' },
  'penalty-miss': { icon: '❌', color: 'text-red-400', bgColor: 'bg-red-950/30 border-red-900/30', label: 'Penal errado' },
  'yellow-card':  { icon: '🟨', color: 'text-yellow-400', bgColor: 'bg-yellow-950/30 border-yellow-900/30', label: 'Amarilla' },
  'red-card':     { icon: '🟥', color: 'text-red-400', bgColor: 'bg-red-950/40 border-red-900/40', label: 'Roja' },
  'substitution': { icon: '🔄', color: 'text-blue-400', bgColor: 'bg-blue-950/30 border-blue-900/30', label: 'Cambio' },
  'var':          { icon: '📺', color: 'text-purple-400', bgColor: 'bg-purple-950/30 border-purple-900/30', label: 'VAR' },
  'period-start': { icon: '▶️', color: 'text-neutral-400', bgColor: 'bg-neutral-800/50 border-neutral-700/50', label: 'Inicio' },
  'period-end':   { icon: '⏸️', color: 'text-neutral-400', bgColor: 'bg-neutral-800/50 border-neutral-700/50', label: 'Fin' },
};

const PERIOD_LABELS: Record<number, string> = {
  1: '1er Tiempo',
  2: '2do Tiempo',
  3: 'Tiempo Extra',
};

function EventRow({ event }: { event: MatchEvent }) {
  const config = EVENT_CONFIG[event.type] ?? {
    icon: '📋', color: 'text-neutral-400', bgColor: 'bg-neutral-800/50 border-neutral-700/50', label: event.type,
  };

  return (
    <div className="flex items-start gap-3 group">
      {/* Minute badge */}
      <div className="flex-shrink-0 w-12 text-right">
        <span className="text-xs font-black text-neutral-500 tabular-nums">{event.minute}'</span>
      </div>

      {/* Timeline dot + line */}
      <div className="flex-shrink-0 flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm ${config.bgColor} group-hover:scale-110 transition-transform`}>
          {config.icon}
        </div>
      </div>

      {/* Event content */}
      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${config.color}`}>
            {config.label}
          </span>
          <span className="text-[10px] text-neutral-600">{event.team}</span>
        </div>

        {event.type === 'substitution' ? (
          <div className="text-sm mt-0.5">
            <span className="text-green-400 font-semibold">↑ {event.playerInName ?? '?'}</span>
            <span className="text-neutral-600 mx-1.5">por</span>
            <span className="text-red-400 font-semibold">↓ {event.playerName ?? '?'}</span>
          </div>
        ) : (
          <div className="text-sm mt-0.5">
            {event.playerName && (
              <span className="font-semibold text-white">{event.playerName}</span>
            )}
            {event.assistName && (
              <span className="text-neutral-500 text-xs ml-1.5">(asist. {event.assistName})</span>
            )}
          </div>
        )}

        {event.detail && (
          <p className="text-xs text-neutral-500 mt-0.5">{event.detail}</p>
        )}
      </div>
    </div>
  );
}

interface EventTimelineProps {
  events: MatchEvent[];
  compact?: boolean;
}

export default function EventTimeline({ events, compact = false }: EventTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center text-sm text-neutral-500">
        No hay eventos registrados para este partido.
      </div>
    );
  }

  // Group by period
  const periods = new Map<number, MatchEvent[]>();
  for (const e of events) {
    const list = periods.get(e.period) ?? [];
    list.push(e);
    periods.set(e.period, list);
  }

  const sortedPeriods = [...periods.entries()].sort(([a], [b]) => a - b);

  return (
    <div className={`bg-neutral-900 border border-neutral-800 rounded-2xl ${compact ? 'p-4' : 'p-5'} space-y-4`}>
      <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-riverRed inline-block" />
        Cronología del partido
      </h3>

      {sortedPeriods.map(([period, periodEvents]) => (
        <div key={period}>
          {/* Period separator */}
          {sortedPeriods.length > 1 && (
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-neutral-800" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 bg-neutral-900 px-2">
                {PERIOD_LABELS[period] ?? `Período ${period}`}
              </span>
              <div className="h-px flex-1 bg-neutral-800" />
            </div>
          )}

          {/* Events list */}
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[4.25rem] top-4 bottom-4 w-px bg-neutral-800" />

            <div className="space-y-1">
              {periodEvents.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
