// apps/frontend/src/pages/JugadorDetalle.tsx
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { UserX, Star, User } from 'lucide-react';
import { getPlayer, getPlayerStats, type Player, type PlayerStats } from '../services/players.service';

const positionLabel: Record<string, string> = {
  Goalkeeper: 'Arquero',
  Defender: 'Defensor',
  Midfielder: 'Mediocampista',
  Attacker: 'Delantero',
};

function StatBox({
  value,
  label,
  sub,
  highlight,
}: {
  value: string | number;
  label: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-center">
      <div className={`text-2xl font-black ${highlight ? 'text-riverRed' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mt-1">{label}</div>
      {sub && <div className="text-[10px] text-neutral-600 mt-0.5">{sub}</div>}
    </div>
  );
}

function formatBirthDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${d} ${months[parseInt(m) - 1]} ${y}`;
}

export default function JugadorDetalle() {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState<PlayerStats | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setImgError(false);
    setStats(undefined);

    getPlayer(id)
      .then(setPlayer)
      .finally(() => setLoading(false));

    getPlayerStats(id).then((s) => setStats(s ?? null));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 mt-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-riverRed mx-auto mb-4" />
        <p className="text-neutral-400">Cargando ficha del jugador…</p>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="max-w-4xl mx-auto px-4 mt-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-4">
          <UserX className="w-7 h-7 text-neutral-500" />
        </div>
        <h2 className="text-xl font-bold mb-2">Jugador no encontrado</h2>
        <p className="text-neutral-400 mb-6">No pudimos encontrar a ese jugador en el plantel.</p>
        <Link to="/plantel" className="text-riverRed font-semibold hover:underline">
          ← Volver al plantel
        </Link>
      </div>
    );
  }

  const positionDisplay = positionLabel[player.position] ?? player.position;
  const showPhoto = !!player.photo && !imgError;
  const statsLoading = stats === undefined;

  return (
    <div className="max-w-5xl mx-auto px-4 mt-6 space-y-6 pb-12">
      {/* Breadcrumb */}
      <div className="text-sm text-neutral-500">
        <Link to="/plantel" className="hover:text-white">Plantel</Link>
        <span className="mx-2">/</span>
        <span className="text-white">{player.name}</span>
      </div>

      {/* Header */}
      <section className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-4 -top-4 text-[16rem] font-black text-neutral-800/30 select-none leading-none pointer-events-none">
          #{player.number ?? '–'}
        </div>

        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Foto */}
          <div className="w-40 h-40 md:w-48 md:h-48 bg-neutral-950 rounded-full flex items-center justify-center border-4 border-riverRed shadow-2xl shadow-red-900/40 overflow-hidden flex-shrink-0">
            {showPhoto ? (
              <img
                src={player.photo!}
                alt={player.name}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <User className="w-16 h-16 text-neutral-700" />
            )}
          </div>

          {/* Info principal */}
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-red-950/40 text-riverRed border border-red-900/50 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-3">
              {positionDisplay}
            </div>

            <h1 className="text-3xl md:text-4xl font-black mb-3">{player.name}</h1>

            <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-1 text-sm text-neutral-400">
              {player.number != null && (
                <span>
                  <span className="text-neutral-500">Dorsal:</span>{' '}
                  <span className="text-white font-bold">#{player.number}</span>
                </span>
              )}
              {player.nationality && (
                <span>
                  <span className="text-neutral-500">País:</span>{' '}
                  <span className="text-white font-bold">{player.nationality}</span>
                </span>
              )}
              {player.age != null && (
                <span>
                  <span className="text-neutral-500">Edad:</span>{' '}
                  <span className="text-white font-bold">{player.age} años</span>
                </span>
              )}
              {stats?.height && (
                <span>
                  <span className="text-neutral-500">Altura:</span>{' '}
                  <span className="text-white font-bold">{stats.height}</span>
                </span>
              )}
              {stats?.weight && (
                <span>
                  <span className="text-neutral-500">Peso:</span>{' '}
                  <span className="text-white font-bold">{stats.weight}</span>
                </span>
              )}
            </div>

            {stats?.rating && (
              <div className="mt-4 inline-flex items-center gap-2 bg-yellow-950/30 border border-yellow-800/40 px-4 py-1.5 rounded-xl">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-yellow-300 font-black text-lg">{stats.rating}</span>
                <span className="text-neutral-500 text-xs">Rating promedio {stats.season}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats de temporada */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
            Estadísticas de temporada
          </h3>
          {stats && (
            <span className="text-[10px] text-neutral-600 border border-neutral-800 px-2 py-0.5 rounded-full">
              {stats.season}
            </span>
          )}
        </div>

        {statsLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-riverRed" />
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <StatBox value={stats.appearances} label="PJ" sub="Partidos" />
              <StatBox value={stats.goals} label="Goles" sub="En la temporada" highlight={stats.goals > 0} />
              <StatBox value={stats.assists} label="Asist." sub="Asistencias" highlight={stats.assists > 0} />
              <StatBox value={stats.minutes > 0 ? `${stats.minutes}'` : '–'} label="Min" sub="Minutos jugados" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <StatBox value={stats.lineups} label="Titular" sub="Veces de inicio" />
              <StatBox value={stats.yellowCards} label="Amarillas" sub="Tarjetas" />
              <StatBox value={stats.redCards} label="Rojas" sub="Tarjetas" />
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'PJ', sub: 'Partidos' },
              { label: 'Goles', sub: 'En la temporada' },
              { label: 'Asist.', sub: 'Asistencias' },
              { label: 'Min', sub: 'Minutos jugados' },
            ].map((s) => (
              <StatBox key={s.label} value="–" label={s.label} sub={s.sub} />
            ))}
          </div>
        )}
      </section>

      {/* Datos personales */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Datos personales</h3>
          <ul className="space-y-2.5 text-sm">
            <li className="flex justify-between border-b border-neutral-800/50 pb-2">
              <span className="text-neutral-400">Nombre completo</span>
              <span className="font-semibold">{player.name}</span>
            </li>
            <li className="flex justify-between border-b border-neutral-800/50 pb-2">
              <span className="text-neutral-400">Posición</span>
              <span className="font-semibold">{positionDisplay}</span>
            </li>
            <li className="flex justify-between border-b border-neutral-800/50 pb-2">
              <span className="text-neutral-400">Dorsal</span>
              <span className="font-semibold">{player.number != null ? `#${player.number}` : 'Sin asignar'}</span>
            </li>
            <li className="flex justify-between border-b border-neutral-800/50 pb-2">
              <span className="text-neutral-400">Nacionalidad</span>
              <span className="font-semibold">{player.nationality ?? 'No disponible'}</span>
            </li>
            <li className={`flex justify-between ${stats?.height ? 'border-b border-neutral-800/50 pb-2' : ''}`}>
              <span className="text-neutral-400">Edad</span>
              <span className="font-semibold">{player.age != null ? `${player.age} años` : 'No disponible'}</span>
            </li>
            {stats?.height && (
              <li className={`flex justify-between ${stats?.birthDate ? 'border-b border-neutral-800/50 pb-2' : ''}`}>
                <span className="text-neutral-400">Altura / Peso</span>
                <span className="font-semibold">
                  {stats.height}{stats.weight ? ` · ${stats.weight}` : ''}
                </span>
              </li>
            )}
            {stats?.birthDate && (
              <li className="flex justify-between">
                <span className="text-neutral-400">Nacimiento</span>
                <span className="font-semibold text-right">
                  {formatBirthDate(stats.birthDate)}
                  {stats.birthPlace && (
                    <span className="block text-[11px] text-neutral-500">
                      {stats.birthPlace}, {stats.birthCountry}
                    </span>
                  )}
                </span>
              </li>
            )}
          </ul>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Estado físico</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-semibold">Disponible</span>
          </div>
          <p className="text-xs text-neutral-500">
            Sin lesiones ni suspensiones reportadas. El jugador está apto para ser convocado.
          </p>
        </div>
      </section>
    </div>
  );
}
