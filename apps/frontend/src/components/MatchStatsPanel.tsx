// apps/frontend/src/components/MatchStatsPanel.tsx
import type { MatchStatistics } from '../services/matches.service';

interface Props {
  stats: MatchStatistics;
  homeTeam: string;
  awayTeam: string;
}

// Possession donut using SVG
function PossessionDonut({ home, away, homeTeamName, awayTeamName }: { home: number; away: number; homeTeamName: string; awayTeamName: string }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const homePct = Math.min(Math.max(home, 0), 100);
  const homeDash = (homePct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Posesión</div>
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          {/* Away background */}
          <circle cx="60" cy="60" r={r} fill="none" stroke="#166534" strokeWidth="12" />
          {/* Home overlay */}
          <circle
            cx="60" cy="60" r={r}
            fill="none"
            stroke="#BE1522"
            strokeWidth="12"
            strokeDasharray={`${homeDash} ${circ}`}
            strokeLinecap="butt"
          />
        </svg>
        {/* Center logos / pct */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="text-xs font-black text-riverRed">{homePct.toFixed(1)}%</span>
          <span className="text-[9px] text-neutral-600">vs</span>
          <span className="text-xs font-black text-green-500">{(100 - homePct).toFixed(1)}%</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-[10px] font-semibold">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-riverRed inline-block" />
          <span className="text-neutral-400">{homeTeamName?.split(' ')[0] ?? 'Local'}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-green-600 inline-block" />
          <span className="text-neutral-400">{awayTeamName?.split(' ')[0] ?? 'Visitante'}</span>
        </span>
      </div>
    </div>
  );
}

// Comparison bar row
function StatRow({
  label,
  home,
  away,
  isCard = false,
}: {
  label: string;
  home: number | null;
  away: number | null;
  isCard?: boolean;
}) {
  if (home === null && away === null) return null;
  const h = home ?? 0;
  const a = away ?? 0;
  const total = h + a || 1;
  const homePct = (h / total) * 100;
  const awayPct = (a / total) * 100;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center py-2.5 border-b border-neutral-800/60 last:border-0">
      {/* Home side */}
      <div className="flex items-center gap-2 justify-end">
        <span className="text-sm font-black tabular-nums text-white">{h}</span>
        <div className="flex-1 max-w-[120px] h-2 bg-neutral-800 rounded-full overflow-hidden flex justify-end">
          <div
            className="h-full bg-riverRed rounded-full transition-all duration-700"
            style={{ width: `${homePct}%` }}
          />
        </div>
      </div>

      {/* Label center */}
      <div className="text-[11px] text-neutral-500 text-center whitespace-nowrap px-2 min-w-[120px]">
        {label}
      </div>

      {/* Away side */}
      <div className="flex items-center gap-2">
        <div className="flex-1 max-w-[120px] h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-600 rounded-full transition-all duration-700"
            style={{ width: `${awayPct}%` }}
          />
        </div>
        <span className="text-sm font-black tabular-nums text-white">{a}</span>
      </div>
    </div>
  );
}

// Team header abbreviation helper
function abbr(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);
}

// Initialise homeTeam / awayTeam inside closure
let homeTeam = '';
let awayTeam = '';

export default function MatchStatsPanel({ stats, homeTeam: ht, awayTeam: at }: Props) {

  const rows: Array<{ label: string; key: keyof MatchStatistics; isCard?: boolean }> = [
    { label: 'Tiros a puerta', key: 'shotsOnTarget' },
    { label: 'Tiros totales', key: 'totalShots' },
    { label: 'Faltas', key: 'fouls' },
    { label: 'Tarjetas amarillas', key: 'yellowCards', isCard: true },
    { label: 'Tarjetas rojas', key: 'redCards', isCard: true },
    { label: 'Córners', key: 'corners' },
    { label: 'Salvadas', key: 'saves' },
    { label: 'Fueras de juego', key: 'offsides' },
  ];

  const homePoss = stats.possession?.home ?? 50;
  const awayPoss = stats.possession?.away ?? 50;

  return (
    <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-riverRed inline-block" />
          Estadísticas del partido
        </h3>
      </div>

      {/* Team names */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center px-5 pb-2">
        <div className="text-right">
          <div className="text-xs font-black text-white">{abbr(ht)}</div>
          <div className="text-[10px] text-riverRed font-semibold truncate">{ht}</div>
        </div>
        <div className="w-8 h-8 bg-neutral-800 border border-neutral-700 rounded-full flex items-center justify-center">
          <span className="text-[10px] font-bold text-neutral-500">vs</span>
        </div>
        <div className="text-left">
          <div className="text-xs font-black text-white">{abbr(at)}</div>
          <div className="text-[10px] text-green-400 font-semibold truncate">{at}</div>
        </div>
      </div>

      {/* Possession donut */}
      {(homePoss || awayPoss) && (
        <div className="flex justify-center py-4 border-b border-neutral-800/60">
          <PossessionDonut home={homePoss} away={awayPoss} homeTeamName={ht} awayTeamName={at} />
        </div>
      )}

      {/* Stat rows */}
      <div className="px-5 pb-5 pt-2">
        {rows.map(({ label, key }) => {
          const val = stats[key] as { home: number | null; away: number | null } | undefined;
          if (!val) return null;
          return (
            <StatRow key={key} label={label} home={val.home} away={val.away} />
          );
        })}
      </div>
    </div>
  );
}
