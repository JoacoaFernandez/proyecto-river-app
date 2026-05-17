// apps/frontend/src/pages/JugadorDetalle.tsx
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { UserX, Star, User, AlertTriangle, Calendar } from 'lucide-react';
import { getPlayer, getPlayerStats, type Player, type PlayerStats } from '../services/players.service';
import FavoriteButton from '../components/FavoriteButton';

const positionLabel: Record<string, string> = {
  Goalkeeper: 'Arquero',
  Defender: 'Defensor',
  Midfielder: 'Mediocampista',
  Attacker: 'Delantero',
};

const footLabel: Record<string, string> = {
  right: 'Derecho',
  left: 'Izquierdo',
  both: 'Ambidiestro',
};

const STATUS_CONFIG: Record<string, { label: string; dotColor: string; textColor: string; bgColor: string; borderColor: string }> = {
  available: {
    label: 'Disponible',
    dotColor: 'bg-green-500',
    textColor: 'text-green-400',
    bgColor: 'bg-green-950/30',
    borderColor: 'border-green-800/40',
  },
  injured: {
    label: 'Lesionado',
    dotColor: 'bg-red-500 animate-pulse',
    textColor: 'text-red-400',
    bgColor: 'bg-red-950/30',
    borderColor: 'border-red-800/40',
  },
  loaned: {
    label: 'Cedido',
    dotColor: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    bgColor: 'bg-yellow-950/30',
    borderColor: 'border-yellow-800/40',
  },
  suspended: {
    label: 'Suspendido',
    dotColor: 'bg-orange-500',
    textColor: 'text-orange-400',
    bgColor: 'bg-orange-950/30',
    borderColor: 'border-orange-800/40',
  },
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

function formatJoinedAt(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-AR', { year: 'numeric', month: 'long' });
}

function formatReturnDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
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
  const status = player.status ?? 'available';
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.available;
  const isInjured = status === 'injured';

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
          <div className={`w-40 h-40 md:w-48 md:h-48 bg-neutral-950 rounded-full flex items-center justify-center border-4 shadow-2xl overflow-hidden flex-shrink-0 ${
            isInjured ? 'border-red-700 shadow-red-900/40' : 'border-riverRed shadow-red-900/40'
          }`}>
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

            <div className="flex items-center gap-3 justify-center md:justify-start mb-1">
              <h1 className="text-3xl md:text-4xl font-black">{player.name}</h1>
              <FavoriteButton type="player" targetId={player.id} size="md" />
            </div>
            {player.nickname && (
              <p className="text-neutral-400 text-base italic mb-3">"{player.nickname}"</p>
            )}

            <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-1 text-sm text-neutral-400 mb-4">
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
              {player.preferredFoot && (
                <span>
                  <span className="text-neutral-500">Pie:</span>{' '}
                  <span className="text-white font-bold">{footLabel[player.preferredFoot] ?? player.preferredFoot}</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              {/* Estado badge */}
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border ${statusCfg.bgColor} ${statusCfg.borderColor}`}>
                <span className={`w-2 h-2 rounded-full ${statusCfg.dotColor}`} />
                <span className={`font-bold text-sm ${statusCfg.textColor}`}>{statusCfg.label}</span>
              </div>

              {stats?.rating && (
                <div className="inline-flex items-center gap-2 bg-yellow-950/30 border border-yellow-800/40 px-4 py-1.5 rounded-xl">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-yellow-300 font-black text-lg">{stats.rating}</span>
                  <span className="text-neutral-500 text-xs">Rating {stats.season}</span>
                </div>
              )}
            </div>
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
              <StatBox value={stats.yellowCards} label="Amarillas" sub="Tarjetas" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatBox value={stats.redCards} label="Rojas" sub="Tarjetas" />
              {stats.lineups > 0 && <StatBox value={stats.lineups} label="Titular" sub="Veces de inicio" />}
              {stats.minutes > 0 && <StatBox value={`${stats.minutes}'`} label="Min" sub="Minutos jugados" />}
              {stats.penaltyGoals > 0 && (
                <StatBox value={stats.penaltyGoals} label="Penales" sub="Goles de penal" highlight />
              )}
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

      {/* Datos personales + Estado físico */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Datos personales</h3>
          <ul className="space-y-2.5 text-sm">
            <li className="flex justify-between border-b border-neutral-800/50 pb-2">
              <span className="text-neutral-400">Nombre completo</span>
              <span className="font-semibold">{player.name}</span>
            </li>
            {player.nickname && (
              <li className="flex justify-between border-b border-neutral-800/50 pb-2">
                <span className="text-neutral-400">Apodo</span>
                <span className="font-semibold italic text-neutral-300">"{player.nickname}"</span>
              </li>
            )}
            <li className="flex justify-between border-b border-neutral-800/50 pb-2">
              <span className="text-neutral-400">Posición</span>
              <span className="font-semibold">{positionDisplay}</span>
            </li>
            <li className="flex justify-between border-b border-neutral-800/50 pb-2">
              <span className="text-neutral-400">Dorsal</span>
              <span className="font-semibold">{player.number != null ? `#${player.number}` : 'Sin asignar'}</span>
            </li>
            {player.preferredFoot && (
              <li className="flex justify-between border-b border-neutral-800/50 pb-2">
                <span className="text-neutral-400">Pie hábil</span>
                <span className="font-semibold">{footLabel[player.preferredFoot] ?? player.preferredFoot}</span>
              </li>
            )}
            <li className="flex justify-between border-b border-neutral-800/50 pb-2">
              <span className="text-neutral-400">Nacionalidad</span>
              <span className="font-semibold">{player.nationality ?? 'No disponible'}</span>
            </li>
            <li className={`flex justify-between ${stats?.height || player.joinedAt ? 'border-b border-neutral-800/50 pb-2' : ''}`}>
              <span className="text-neutral-400">Edad</span>
              <span className="font-semibold">{player.age != null ? `${player.age} años` : 'No disponible'}</span>
            </li>
            {stats?.height && (
              <li className={`flex justify-between ${stats?.birthDate || player.joinedAt ? 'border-b border-neutral-800/50 pb-2' : ''}`}>
                <span className="text-neutral-400">Altura / Peso</span>
                <span className="font-semibold">
                  {stats.height}{stats.weight ? ` · ${stats.weight}` : ''}
                </span>
              </li>
            )}
            {stats?.birthDate && (
              <li className={`flex justify-between ${player.joinedAt ? 'border-b border-neutral-800/50 pb-2' : ''}`}>
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
            {player.joinedAt && (
              <li className="flex justify-between">
                <span className="text-neutral-400">En River desde</span>
                <span className="font-semibold">{formatJoinedAt(player.joinedAt)}</span>
              </li>
            )}
          </ul>
        </div>

        {/* Panel estado físico */}
        <div className={`border rounded-2xl p-5 ${isInjured ? 'bg-red-950/20 border-red-900/40' : 'bg-neutral-900 border-neutral-800'}`}>
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Estado físico</h3>

          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${statusCfg.dotColor}`} />
            <span className={`text-base font-bold ${statusCfg.textColor}`}>{statusCfg.label}</span>
          </div>

          {isInjured ? (
            <div className="space-y-3">
              {player.injuryType && (
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-neutral-400">Lesión: </span>
                    <span className="font-semibold text-red-300">{player.injuryType}</span>
                    {player.injuryZone && (
                      <span className="text-neutral-500"> — {player.injuryZone}</span>
                    )}
                  </div>
                </div>
              )}
              {player.injuryReturnDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                  <div>
                    <span className="text-neutral-400">Regreso estimado: </span>
                    <span className="font-semibold">{formatReturnDate(player.injuryReturnDate)}</span>
                  </div>
                </div>
              )}
              {!player.injuryType && (
                <p className="text-xs text-red-400/70">Lesión reportada. Sin detalles disponibles.</p>
              )}
            </div>
          ) : status === 'loaned' ? (
            <p className="text-xs text-neutral-500">
              El jugador se encuentra cedido a otro club y no está disponible para River.
            </p>
          ) : status === 'suspended' ? (
            <p className="text-xs text-neutral-500">
              El jugador cumple una suspensión y no está disponible para el próximo partido.
            </p>
          ) : (
            <p className="text-xs text-neutral-500">
              Sin lesiones ni suspensiones reportadas. El jugador está apto para ser convocado.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
