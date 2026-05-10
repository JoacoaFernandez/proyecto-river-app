// apps/frontend/src/pages/JugadorDetalle.tsx
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPlayer, type Player } from '../services/players.service';

const positionLabel: Record<string, string> = {
  Goalkeeper: 'Arquero',
  Defender: 'Defensor',
  Midfielder: 'Mediocampista',
  Attacker: 'Delantero',
};

const positionEmoji: Record<string, string> = {
  Goalkeeper: '🧤',
  Defender: '🛡️',
  Midfielder: '🧠',
  Attacker: '⚡',
};

export default function JugadorDetalle() {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setImgError(false);
    getPlayer(id)
      .then(setPlayer)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 mt-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-riverRed mx-auto mb-4"></div>
        <p className="text-neutral-400">Cargando ficha del jugador…</p>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="max-w-4xl mx-auto px-4 mt-12 text-center">
        <div className="text-6xl mb-4">🤷</div>
        <h2 className="text-xl font-bold mb-2">Jugador no encontrado</h2>
        <p className="text-neutral-400 mb-6">No pudimos encontrar a ese jugador en el plantel.</p>
        <Link to="/plantel" className="text-riverRed font-semibold hover:underline">
          ← Volver al plantel
        </Link>
      </div>
    );
  }

  const positionDisplay = positionLabel[player.position] ?? player.position;
  const positionIcon = positionEmoji[player.position] ?? '⚽';
  const showPhoto = !!player.photo && !imgError;

  return (
    <div className="max-w-5xl mx-auto px-4 mt-6 space-y-6 pb-12">
      {/* Breadcrumb */}
      <div className="text-sm text-neutral-500">
        <Link to="/plantel" className="hover:text-white">Plantel</Link>
        <span className="mx-2">/</span>
        <span className="text-white">{player.name}</span>
      </div>

      {/* Header de la ficha */}
      <section className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Dorsal gigante de fondo */}
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
              <span className="text-6xl font-black text-neutral-600">⚽</span>
            )}
          </div>

          {/* Info principal */}
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-red-950/40 text-riverRed border border-red-900/50 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-3">
              <span>{positionIcon}</span>
              <span>{positionDisplay}</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black mb-2">{player.name}</h1>

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
            </div>
          </div>
        </div>
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
            <li className="flex justify-between">
              <span className="text-neutral-400">Edad</span>
              <span className="font-semibold">{player.age != null ? `${player.age} años` : 'No disponible'}</span>
            </li>
          </ul>
        </div>

        {/* Estado físico — placeholder hasta tener data médica */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Estado físico</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-semibold">Disponible</span>
          </div>
          <p className="text-xs text-neutral-500">
            Sin lesiones ni suspensiones reportadas. El jugador está apto para ser convocado.
          </p>
        </div>
      </section>

      {/* Estadísticas — placeholder, todavía no hay endpoint */}
      <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">
          Estadísticas de la temporada
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'PJ', value: '–', sub: 'Partidos' },
            { label: 'Goles', value: '–', sub: 'En la temporada' },
            { label: 'Asist', value: '–', sub: 'Asistencias' },
            { label: 'Min', value: '–', sub: 'Minutos jugados' },
          ].map((s) => (
            <div key={s.label} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mt-1">{s.label}</div>
              <div className="text-[10px] text-neutral-600 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-neutral-500 mt-4 italic">
          🚧 Próximamente: las estadísticas las traemos desde la fuente del partido cuando terminemos esa integración.
        </p>
      </section>
    </div>
  );
}
