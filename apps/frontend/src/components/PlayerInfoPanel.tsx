// apps/frontend/src/components/PlayerInfoPanel.tsx
import { Link } from 'react-router-dom';
import type { LineupEntry, PlayerAlert } from '../services/formations.service';

const ROLE_LABEL: Record<string, string> = {
  GK: 'Portero',
  DEF: 'Defensor',
  MID: 'Mediocampista',
  ATK: 'Delantero',
};

export default function PlayerInfoPanel({
  slot,
  alert,
  onClose,
}: {
  slot: LineupEntry;
  alert?: PlayerAlert;
  onClose: () => void;
}) {
  const p = slot.player;
  if (!p) return null;

  const statusLabel = alert?.type === 'injury' ? 'Baja' :
                      alert?.type === 'suspension' ? 'Suspendido' :
                      p.virtual ? 'Por confirmar' :
                      'Disponible';
  const statusColor = alert ? 'text-red-400' :
                      p.virtual ? 'text-yellow-400' :
                      'text-green-400';
  const statusDot = alert ? '🔴' : p.virtual ? '🟡' : '🟢';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm bg-neutral-900 border border-neutral-700 rounded-3xl p-6 shadow-2xl z-10 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white text-xs transition-all"
        >
          ✕
        </button>

        {/* PROBABLE badge */}
        <div className="mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest bg-amber-950/50 text-amber-400 border border-amber-800/50 px-2 py-0.5 rounded-full">
            Formación Probable
          </span>
        </div>

        {/* Avatar + nombre */}
        <div className="flex items-center gap-4 mb-5">
          {p.photo ? (
            <img
              src={p.photo}
              alt={p.name}
              className="w-16 h-16 rounded-2xl object-cover bg-neutral-800 flex-shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black flex-shrink-0 shadow-lg"
              style={{ background: p.virtual ? '#475569' : 'linear-gradient(135deg, #E30613 0%, #a00000 100%)' }}
            >
              {p.number ?? '?'}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-black text-lg leading-tight truncate">{p.name}</div>
            <div className="text-sm text-neutral-500 mt-0.5">
              #{p.number ?? '–'} · {ROLE_LABEL[slot.role] ?? slot.role}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-2.5 text-sm mb-4 border border-neutral-800 rounded-2xl p-4 bg-neutral-950/50">
          <div className="flex justify-between items-center">
            <span className="text-neutral-500">Posición</span>
            <span className="font-semibold">{p.position}</span>
          </div>
          {p.nationality && (
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">Nacionalidad</span>
              <span className="font-semibold">{p.nationality}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-neutral-500">Estado</span>
            <span className={`font-semibold ${statusColor}`}>{statusDot} {statusLabel}</span>
          </div>
        </div>

        {/* Alert detail */}
        {alert && (
          <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl px-3 py-2.5 text-xs text-amber-300 mb-4">
            {alert.detail}
          </div>
        )}

        {p.virtual && (
          <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl px-3 py-2.5 text-xs text-blue-300 mb-4">
            Jugador detectado en el último partido pero no registrado en el plantel.
          </div>
        )}

        {/* Profile link */}
        {!p.virtual && (
          <Link
            to={`/plantel/${p.id}`}
            onClick={onClose}
            className="block text-center text-xs font-bold bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 py-3 rounded-xl transition-all text-neutral-300 hover:text-white"
          >
            Ver perfil completo →
          </Link>
        )}
      </div>
    </div>
  );
}
