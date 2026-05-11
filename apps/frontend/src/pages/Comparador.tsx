// apps/frontend/src/pages/Comparador.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { getPlayers, getPlayerStats } from '../services/players.service';
import type { Player, PlayerStats } from '../services/players.service';

const POSITION_ORDER = ['Portero', 'Defensa', 'Mediocampista', 'Delantero'];

function sortPlayers(players: Player[]) {
  return [...players].sort((a, b) => {
    const pi = POSITION_ORDER.findIndex((p) => a.position?.includes(p));
    const pj = POSITION_ORDER.findIndex((p) => b.position?.includes(p));
    if (pi !== pj) return pi - pj;
    return (a.number ?? 99) - (b.number ?? 99);
  });
}

interface StatRow {
  label: string;
  key: keyof PlayerStats;
  format?: (v: number | string | null) => string;
  highlight?: 'high' | 'low';
}

const STAT_ROWS: StatRow[] = [
  { label: 'Partidos jugados', key: 'appearances', highlight: 'high' },
  { label: 'Titularidades', key: 'lineups', highlight: 'high' },
  { label: 'Minutos', key: 'minutes', highlight: 'high' },
  { label: 'Goles', key: 'goals', highlight: 'high' },
  { label: 'Asistencias', key: 'assists', highlight: 'high' },
  { label: 'Tarjetas amarillas', key: 'yellowCards', highlight: 'low' },
  { label: 'Tarjetas rojas', key: 'redCards', highlight: 'low' },
  {
    label: 'Rating promedio',
    key: 'rating',
    format: (v) => (v ? Number(v).toFixed(2) : '—'),
    highlight: 'high',
  },
];

function fmt(v: number | string | null, format?: (v: number | string | null) => string): string {
  if (format) return format(v);
  return v !== null && v !== undefined ? String(v) : '—';
}

function PlayerSelector({
  label,
  players,
  value,
  onChange,
}: {
  label: string;
  players: Player[];
  value: string;
  onChange: (id: string) => void;
}) {
  const sorted = sortPlayers(players);
  return (
    <div className="flex-1 min-w-0">
      <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl px-4 py-3 text-sm outline-none transition-all"
      >
        <option value="">— Elegir jugador —</option>
        {sorted.map((p) => (
          <option key={p.id} value={p.id}>
            {p.number ? `#${p.number} ` : ''}{p.name} ({p.position})
          </option>
        ))}
      </select>
    </div>
  );
}

function PlayerCard({ player, stats, loading }: { player: Player; stats: PlayerStats | null; loading: boolean }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-center">
      {player.photo ? (
        <img
          src={player.photo}
          alt={player.name}
          className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-neutral-800 mb-3"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : (
        <div className="w-20 h-20 rounded-full mx-auto bg-riverRed/20 border-2 border-riverRed/30 flex items-center justify-center mb-3">
          <span className="text-2xl font-black text-riverRed">
            {player.name.charAt(0)}
          </span>
        </div>
      )}
      <Link to={`/plantel/${player.id}`} className="font-black text-base hover:text-riverRed transition-colors">
        {player.name}
      </Link>
      <div className="text-xs text-neutral-400 mt-1">{player.position}</div>
      {stats && (
        <div className="text-[10px] text-neutral-500 mt-0.5">
          Temporada {stats.season}
        </div>
      )}
      {loading && (
        <div className="mt-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-riverRed mx-auto" />
        </div>
      )}
    </div>
  );
}

export default function Comparador() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  const [idA, setIdA] = useState('');
  const [idB, setIdB] = useState('');

  const [playerA, setPlayerA] = useState<Player | null>(null);
  const [playerB, setPlayerB] = useState<Player | null>(null);
  const [statsA, setStatsA] = useState<PlayerStats | null>(null);
  const [statsB, setStatsB] = useState<PlayerStats | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);

  useEffect(() => {
    getPlayers().then((p) => { setPlayers(p); setLoadingPlayers(false); });
  }, []);

  useEffect(() => {
    if (!idA) { setPlayerA(null); setStatsA(null); return; }
    const p = players.find((pl) => pl.id === idA) ?? null;
    setPlayerA(p);
    if (p) {
      setLoadingA(true);
      setStatsA(null);
      getPlayerStats(idA).then(setStatsA).finally(() => setLoadingA(false));
    }
  }, [idA, players]);

  useEffect(() => {
    if (!idB) { setPlayerB(null); setStatsB(null); return; }
    const p = players.find((pl) => pl.id === idB) ?? null;
    setPlayerB(p);
    if (p) {
      setLoadingB(true);
      setStatsB(null);
      getPlayerStats(idB).then(setStatsB).finally(() => setLoadingB(false));
    }
  }, [idB, players]);

  const canCompare = playerA && playerB && statsA && statsB;

  return (
    <div className="max-w-4xl mx-auto px-4 mt-6 pb-12 space-y-5">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-4">
        <h1 className="text-2xl font-black tracking-wide uppercase">Comparador de jugadores</h1>
        <p className="text-sm text-neutral-400 mt-1">Elegí dos jugadores para comparar sus estadísticas</p>
      </div>

      {/* Selectores */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
        {loadingPlayers ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-riverRed" />
          </div>
        ) : (
          <div className="flex gap-4 flex-col sm:flex-row">
            <PlayerSelector label="Jugador A" players={players} value={idA} onChange={setIdA} />
            <div className="flex items-end justify-center pb-3">
              <span className="text-lg font-black text-neutral-700">VS</span>
            </div>
            <PlayerSelector label="Jugador B" players={players} value={idB} onChange={setIdB} />
          </div>
        )}
      </div>

      {/* Cards de jugadores seleccionados */}
      {(playerA || playerB) && (
        <div className="grid grid-cols-2 gap-4">
          {playerA ? (
            <PlayerCard player={playerA} stats={statsA} loading={loadingA} />
          ) : (
            <div className="bg-neutral-900 border border-dashed border-neutral-800 rounded-2xl p-5 flex items-center justify-center min-h-[120px]">
              <span className="text-xs text-neutral-600">Jugador A</span>
            </div>
          )}
          {playerB ? (
            <PlayerCard player={playerB} stats={statsB} loading={loadingB} />
          ) : (
            <div className="bg-neutral-900 border border-dashed border-neutral-800 rounded-2xl p-5 flex items-center justify-center min-h-[120px]">
              <span className="text-xs text-neutral-600">Jugador B</span>
            </div>
          )}
        </div>
      )}

      {/* Tabla comparativa */}
      {canCompare && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-neutral-800">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
              Comparativa estadísticas · Temporada {statsA.season}
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left px-5 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                  Estadística
                </th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-riverRed uppercase tracking-widest truncate">
                  {playerA.name.split(' ')[0]}
                </th>
                <th className="text-center px-4 py-3 text-[10px] font-bold text-blue-400 uppercase tracking-widest truncate">
                  {playerB.name.split(' ')[0]}
                </th>
              </tr>
            </thead>
            <tbody>
              {STAT_ROWS.map((row, idx) => {
                const valA = statsA[row.key] as number | string | null;
                const valB = statsB[row.key] as number | string | null;
                const numA = Number(valA);
                const numB = Number(valB);
                const aBetter =
                  row.highlight === 'high' ? numA > numB :
                  row.highlight === 'low' ? numA < numB : false;
                const bBetter =
                  row.highlight === 'high' ? numB > numA :
                  row.highlight === 'low' ? numB < numA : false;

                return (
                  <tr key={row.key} className={`border-b border-neutral-800/50 ${idx % 2 === 0 ? 'bg-neutral-950/30' : ''}`}>
                    <td className="px-5 py-3 text-neutral-400 text-xs">{row.label}</td>
                    <td className={`text-center px-4 py-3 font-bold tabular-nums ${aBetter ? 'text-riverRed' : 'text-neutral-300'}`}>
                      {fmt(valA, row.format)}
                    </td>
                    <td className={`text-center px-4 py-3 font-bold tabular-nums ${bBetter ? 'text-blue-400' : 'text-neutral-300'}`}>
                      {fmt(valB, row.format)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Estado vacío */}
      {!playerA && !playerB && !loadingPlayers && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-neutral-500" />
          </div>
          <p className="text-neutral-400 text-sm">Seleccioná dos jugadores para ver la comparativa.</p>
        </div>
      )}

      <div className="text-center">
        <Link to="/estadisticas" className="text-neutral-400 hover:text-white text-sm">
          ← Ver estadísticas generales
        </Link>
      </div>
    </div>
  );
}
