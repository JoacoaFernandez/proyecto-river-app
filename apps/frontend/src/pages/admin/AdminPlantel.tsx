// apps/frontend/src/pages/admin/AdminPlantel.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { deletePlayer, getPlayers, type Player } from '../../services/players.service';

const positionLabel: Record<string, string> = {
  Goalkeeper: 'Arquero',
  Defender: 'Defensor',
  Midfielder: 'Mediocampista',
  Attacker: 'Delantero',
};

export default function AdminPlantel() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const list = await getPlayers();
    setPlayers(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const flash = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setInfo(null);
    } else {
      setInfo(msg);
      setError(null);
    }
    setTimeout(() => {
      setError(null);
      setInfo(null);
    }, 4000);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar a ${name} del plantel? Esta acción no se puede deshacer.`)) return;
    try {
      await deletePlayer(id);
      flash(`🗑️ ${name} fue removido del plantel.`);
      await load();
    } catch (err: any) {
      flash(err?.response?.data?.message || 'Error al eliminar.', true);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return players;
    return players.filter((p) => p.name.toLowerCase().includes(term));
  }, [players, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1">Plantel</h1>
          <p className="text-sm text-neutral-400">
            {loading
              ? 'Cargando jugadores…'
              : `${players.length} jugadores en el primer equipo`}
          </p>
        </div>
        <p className="text-xs text-neutral-500 italic max-w-sm">
          🔄 El plantel se sincroniza automáticamente con API-Football. Eliminá un jugador solo si
          ves que no corresponde al primer equipo.
        </p>
      </div>

      {/* Mensajes flash */}
      {(error || info) && (
        <div
          className={`p-3 rounded-xl text-sm border ${
            error
              ? 'bg-red-950/30 border-red-900/50 text-red-200'
              : 'bg-green-950/30 border-green-900/50 text-green-200'
          }`}
        >
          {error || info}
        </div>
      )}

      {/* Buscador */}
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

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-riverRed mx-auto"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center text-sm text-neutral-500">
          {search.trim() ? 'No hay jugadores con ese nombre.' : 'Todavía no hay jugadores cargados.'}
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="hidden md:flex items-center gap-4 p-4 border-b border-neutral-800 text-[11px] font-bold uppercase tracking-widest text-neutral-500">
            <div className="w-10">#</div>
            <div className="w-12"></div>
            <div className="flex-1">Nombre</div>
            <div className="w-32">Posición</div>
            <div className="w-28">País</div>
            <div className="w-16 text-center">Edad</div>
            <div className="w-32 text-right">Acciones</div>
          </div>

          {filtered.map((p) => (
            <div
              key={p.id}
              className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 border-b border-neutral-800 last:border-0 hover:bg-neutral-800/30 transition-colors"
            >
              <div className="md:w-10 text-sm font-bold text-neutral-500 tabular-nums">
                {p.number != null ? `#${p.number}` : '–'}
              </div>

              <div className="md:w-12">
                <div className="w-10 h-10 bg-neutral-950 rounded-full border border-neutral-800 flex items-center justify-center overflow-hidden">
                  {p.photo ? (
                    <img
                      src={p.photo}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-neutral-600">⚽</span>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{p.name}</div>
              </div>

              <div className="md:w-32 text-xs text-neutral-400">
                {positionLabel[p.position] ?? p.position}
              </div>

              <div className="md:w-28 text-xs text-neutral-400 truncate">
                {p.nationality ?? '–'}
              </div>

              <div className="md:w-16 text-xs text-neutral-400 md:text-center">
                {p.age != null ? `${p.age}` : '–'}
              </div>

              <div className="md:w-32 flex md:justify-end gap-2">
                <Link
                  to={`/plantel/${p.id}`}
                  className="text-xs bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 px-3 py-1.5 rounded-lg transition-all"
                >
                  Ver
                </Link>
                <button
                  onClick={() => handleDelete(p.id, p.name)}
                  className="text-xs bg-neutral-950 hover:bg-red-950/40 border border-neutral-800 hover:border-riverRed text-neutral-300 hover:text-riverRed px-3 py-1.5 rounded-lg transition-all"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
