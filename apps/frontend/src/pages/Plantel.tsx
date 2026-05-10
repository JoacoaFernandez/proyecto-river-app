// apps/frontend/src/pages/Plantel.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPlayers, type Player } from '../services/players.service';

type PositionFilter = 'all' | 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Attacker';

const positionFilters: { key: PositionFilter; label: string; emoji: string }[] = [
  { key: 'all', label: 'Todos', emoji: '⚽' },
  { key: 'Goalkeeper', label: 'Arqueros', emoji: '🧤' },
  { key: 'Defender', label: 'Defensores', emoji: '🛡️' },
  { key: 'Midfielder', label: 'Mediocampistas', emoji: '🧠' },
  { key: 'Attacker', label: 'Delanteros', emoji: '⚡' },
];

const positionLabel: Record<string, string> = {
  Goalkeeper: 'Arquero',
  Defender: 'Defensor',
  Midfielder: 'Mediocampista',
  Attacker: 'Delantero',
};

export default function Plantel() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PositionFilter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    getPlayers()
      .then(setPlayers)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return players.filter((p) => {
      if (filter !== 'all' && p.position !== filter) return false;
      if (term && !p.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [players, filter, search]);

  const counts = useMemo(() => {
    const acc: Record<string, number> = { all: players.length };
    for (const p of players) {
      acc[p.position] = (acc[p.position] ?? 0) + 1;
    }
    return acc;
  }, [players]);

  return (
    <div className="max-w-6xl mx-auto px-4 mt-6 pb-12">
      {/* Encabezado */}
      <div className="border-b border-neutral-800 pb-4 mb-6">
        <h2 className="text-2xl font-black tracking-wide uppercase">El Plantel Millonario</h2>
        <p className="text-sm text-neutral-400 mt-1">
          {players.length > 0
            ? `${players.length} jugadores en el plantel`
            : 'Cargando jugadores…'}
        </p>
      </div>

      {/* Filtros + buscador */}
      <div className="space-y-3 mb-8">
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
                <span>{opt.emoji}</span>
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

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">🔍</span>
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-sm"
            >
              ✕
            </button>
          )}
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
            : 'Aún no hay jugadores registrados en el plantel. 🏃‍♂️💨'}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((p) => (
            <Link
              key={p.id}
              to={`/plantel/${p.id}`}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-center hover:border-riverRed hover:-translate-y-0.5 transition-all duration-200 relative group overflow-hidden"
            >
              {/* Dorsal de fondo */}
              <div className="absolute right-2 top-1 text-6xl font-black text-neutral-800/40 select-none group-hover:text-riverRed/20 transition-all">
                #{p.number ?? '–'}
              </div>

              {/* Foto */}
              <div className="w-20 h-20 bg-neutral-950 rounded-full mx-auto mb-3 flex items-center justify-center border-2 border-neutral-800 group-hover:border-riverRed transition-all overflow-hidden">
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
                  <span className="text-2xl font-black text-neutral-600">⚽</span>
                )}
              </div>

              <h4 className="font-bold text-sm text-white truncate relative z-10">{p.name}</h4>
              <p className="text-[11px] text-neutral-500 mt-0.5 truncate">{p.nationality ?? 'Argentina'}</p>
              <p className="text-[10px] font-semibold text-riverRed uppercase tracking-widest mt-2">
                {positionLabel[p.position] ?? p.position}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
