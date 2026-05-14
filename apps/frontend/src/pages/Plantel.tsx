// apps/frontend/src/pages/Plantel.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, User, AlertTriangle } from 'lucide-react';
import { getPlayers, type Player } from '../services/players.service';

type PositionFilter = 'all' | 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Attacker';
type SortKey = 'number' | 'name' | 'position';

const positionFilters: { key: PositionFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'Goalkeeper', label: 'Arqueros' },
  { key: 'Defender', label: 'Defensores' },
  { key: 'Midfielder', label: 'Mediocampistas' },
  { key: 'Attacker', label: 'Delanteros' },
];

const positionLabel: Record<string, string> = {
  Goalkeeper: 'Arquero',
  Defender: 'Defensor',
  Midfielder: 'Mediocampista',
  Attacker: 'Delantero',
};

const positionOrder: Record<string, number> = {
  Goalkeeper: 0,
  Defender: 1,
  Midfielder: 2,
  Attacker: 3,
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  available:  { label: 'Disponible',  color: 'text-green-400',  dot: 'bg-green-500' },
  injured:    { label: 'Lesionado',   color: 'text-red-400',    dot: 'bg-red-500' },
  loaned:     { label: 'Cedido',      color: 'text-yellow-400', dot: 'bg-yellow-500' },
  suspended:  { label: 'Suspendido',  color: 'text-orange-400', dot: 'bg-orange-500' },
};

export default function Plantel() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PositionFilter>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('number');

  useEffect(() => {
    setLoading(true);
    getPlayers()
      .then(setPlayers)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = players.filter((p) => {
      if (filter !== 'all' && p.position !== filter) return false;
      if (term && !p.name.toLowerCase().includes(term)) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortKey === 'number') {
        if (a.number == null && b.number == null) return 0;
        if (a.number == null) return 1;
        if (b.number == null) return -1;
        return a.number - b.number;
      }
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      if (sortKey === 'position') {
        const pa = positionOrder[a.position] ?? 99;
        const pb = positionOrder[b.position] ?? 99;
        return pa - pb || a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [players, filter, search, sortKey]);

  const counts = useMemo(() => {
    const acc: Record<string, number> = { all: players.length };
    for (const p of players) {
      acc[p.position] = (acc[p.position] ?? 0) + 1;
    }
    return acc;
  }, [players]);

  const injuredCount = useMemo(
    () => players.filter((p) => p.status === 'injured').length,
    [players],
  );

  return (
    <div className="max-w-6xl mx-auto px-4 mt-6 pb-12">
      {/* Encabezado */}
      <div className="border-b border-neutral-800 pb-4 mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-wide uppercase">El Plantel Millonario</h2>
          <p className="text-sm text-neutral-400 mt-1">
            {players.length > 0
              ? `${players.length} jugadores en el plantel`
              : 'Cargando jugadores…'}
          </p>
        </div>
        {injuredCount > 0 && (
          <div className="flex items-center gap-1.5 bg-red-950/40 border border-red-900/50 px-3 py-1.5 rounded-xl text-xs text-red-400 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            {injuredCount} lesionado{injuredCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Filtros + buscador */}
      <div className="space-y-3 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {positionFilters.map((opt) => {
            const active = filter === opt.key;
            const count = counts[opt.key] ?? 0;
            return (
              <button
                key={opt.key}
                onClick={() => setFilter(opt.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-riverRed text-white shadow-lg shadow-red-900/30'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-riverRed hover:text-white'
                }`}
              >
                <span>{opt.label}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    active ? 'bg-red-900/40' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar jugador por nombre…"
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-riverRed text-white rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort controls */}
          <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1">
            {(['number', 'name', 'position'] as SortKey[]).map((key) => {
              const labels = { number: '#', name: 'A-Z', position: 'Pos' };
              return (
                <button
                  key={key}
                  onClick={() => setSortKey(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    sortKey === key
                      ? 'bg-riverRed text-white'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {labels[key]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grilla */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-riverRed mx-auto mb-4"></div>
          <p className="text-neutral-400">Reuniendo al equipo en el vestuario…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-neutral-900 border border-neutral-800 rounded-2xl text-neutral-500 text-sm">
          {search.trim() || filter !== 'all'
            ? 'No hay jugadores que coincidan con esos criterios.'
            : 'Aún no hay jugadores registrados en el plantel.'}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((p) => {
            const injured = p.status === 'injured';
            const statusCfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.available;
            return (
              <Link
                key={p.id}
                to={`/plantel/${p.id}`}
                className={`bg-neutral-900 border rounded-2xl p-4 text-center hover:-translate-y-0.5 transition-all duration-200 relative group overflow-hidden ${
                  injured
                    ? 'border-red-900/50 hover:border-red-700'
                    : 'border-neutral-800 hover:border-riverRed'
                }`}
              >
                {/* Dorsal de fondo */}
                <div className="absolute right-2 top-1 text-6xl font-black text-neutral-800/40 select-none group-hover:text-riverRed/20 transition-all">
                  #{p.number ?? '–'}
                </div>

                {/* Warning badge for injured */}
                {injured && (
                  <div className="absolute top-2 left-2 z-10">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  </div>
                )}

                {/* Foto */}
                <div className={`w-20 h-20 bg-neutral-950 rounded-full mx-auto mb-3 flex items-center justify-center border-2 transition-all overflow-hidden ${
                  injured
                    ? 'border-red-900/60 group-hover:border-red-600'
                    : 'border-neutral-800 group-hover:border-riverRed'
                }`}>
                  {p.photo ? (
                    <img
                      src={p.photo}
                      alt={p.name}
                      className="rounded-full w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <User className="w-8 h-8 text-neutral-700" />
                  )}
                </div>

                <h4 className="font-bold text-sm text-white truncate relative z-10">{p.name}</h4>
                <p className="text-[11px] text-neutral-500 mt-0.5 truncate">{p.nationality ?? 'Argentina'}</p>
                <p className="text-[10px] font-semibold text-riverRed uppercase tracking-widest mt-2">
                  {positionLabel[p.position] ?? p.position}
                </p>
                <div className={`flex items-center justify-center gap-1 mt-1.5 text-[9px] font-semibold ${statusCfg.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                  {statusCfg.label}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
