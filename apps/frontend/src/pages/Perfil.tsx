// apps/frontend/src/pages/Perfil.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser, updateCurrentUser } from '../services/me.service';
import type { CurrentUser } from '../services/me.service';
import { getNews } from '../services/news.service';
import type { Match } from '../services/matches.service';
import { getMyAllPredictions } from '../services/predictions.service';
import { timeAgo } from '../utils/time';

interface PredEntry {
  matchId: string;
  pred: 'home' | 'draw' | 'away';
  match: Match | null;
}

const PRED_LABELS: Record<string, string> = {
  home: 'Local gana',
  draw: 'Empate',
  away: 'Visitante gana',
};

const PRED_COLORS: Record<string, string> = {
  home: 'text-green-400 border-green-800/50 bg-green-950/20',
  draw: 'text-yellow-400 border-yellow-800/50 bg-yellow-950/20',
  away: 'text-red-400 border-red-800/50 bg-red-950/20',
};

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin: { label: 'Administrador', color: 'bg-red-950/40 text-riverRed border-red-900/40' },
  editor: { label: 'Editor', color: 'bg-blue-950/40 text-blue-400 border-blue-900/40' },
  user: { label: 'Hincha', color: 'bg-neutral-800 text-neutral-300 border-neutral-700' },
};

export default function Perfil() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<{ msg: string; error: boolean } | null>(null);

  const [newsCount, setNewsCount] = useState<number | null>(null);
  const [predictions, setPredictions] = useState<PredEntry[]>([]);

  useEffect(() => {
    Promise.all([getCurrentUser(true), getNews()]).then(([u, news]) => {
      setUser(u);
      if (u) {
        setDisplayName(u.display_name);
        setAvatarUrl(u.avatar_url ?? '');
        setNewsCount(news.filter((n) => n.authorId === u.id).length);
      }
      setLoading(false);
    });

    getMyAllPredictions().then((preds) => {
      setPredictions(
        preds.map((p) => ({
          matchId: p.matchId,
          pred: p.choice,
          match: p.match || null,
        }))
      );
    });
  }, []);

  const showFlash = (msg: string, error = false) => {
    setFlash({ msg, error });
    setTimeout(() => setFlash(null), 3500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      showFlash('El nombre no puede estar vacío.', true);
      return;
    }
    setSaving(true);
    try {
      const updated = await updateCurrentUser({
        display_name: displayName.trim(),
        avatar_url: avatarUrl.trim() || undefined,
      });
      setUser(updated);
      setEditing(false);
      showFlash('Perfil actualizado correctamente.');
    } catch {
      showFlash('Error al guardar los cambios.', true);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (user) {
      setDisplayName(user.display_name);
      setAvatarUrl(user.avatar_url ?? '');
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 mt-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-riverRed mx-auto mb-4"></div>
        <p className="text-neutral-400">Cargando perfil…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 mt-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Sesión no iniciada</h2>
        <Link to="/login" className="text-riverRed font-semibold hover:underline">
          Ir al login →
        </Link>
      </div>
    );
  }

  const roleInfo = ROLE_LABELS[user.role] ?? ROLE_LABELS.user;
  const initials = user.display_name
    .split(' ')
    .filter((w) => w.length > 0)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const memberSince = new Date(user.created_at).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const inputClass =
    'w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl px-4 py-2.5 text-sm outline-none transition-all';
  const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5';

  return (
    <div className="max-w-2xl mx-auto px-4 mt-6 pb-12 space-y-5">
      {/* Flash */}
      {flash && (
        <div
          className={`p-3 rounded-xl text-sm border ${
            flash.error
              ? 'bg-red-950/30 border-red-900/50 text-red-200'
              : 'bg-green-950/30 border-green-900/50 text-green-200'
          }`}
        >
          {flash.msg}
        </div>
      )}

      {/* Card principal */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-br from-red-950/50 via-neutral-900 to-neutral-950" />

        {/* Avatar + info */}
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full border-4 border-neutral-900 overflow-hidden bg-riverRed flex items-center justify-center flex-shrink-0">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.display_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-2xl font-black text-white">{initials}</span>
              )}
            </div>

            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-riverRed text-sm font-semibold px-4 py-2 rounded-xl transition-all"
              >
                Editar perfil
              </button>
            )}
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black">{user.display_name}</h1>
            <p className="text-sm text-neutral-400">{user.email}</p>
            <div className="flex items-center gap-2 pt-1">
              <span
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${roleInfo.color}`}
              >
                {roleInfo.label}
              </span>
              <span className="text-[11px] text-neutral-500">Miembro desde {memberSince}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario edición */}
      {editing && (
        <form
          onSubmit={handleSave}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4"
        >
          <h2 className="font-bold text-sm uppercase tracking-wider text-riverRed">Editar perfil</h2>

          <div>
            <label className={labelClass}>Nombre de usuario</label>
            <input
              className={inputClass}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className={labelClass}>URL de avatar</label>
            <input
              type="url"
              className={inputClass}
              placeholder="https://ejemplo.com/foto.jpg"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt="preview"
                className="mt-2 w-16 h-16 rounded-full object-cover border border-neutral-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={cancelEdit}
              className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-riverRed hover:bg-red-700 disabled:bg-neutral-800 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-900/30"
            >
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {newsCount !== null && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-center">
            <div className="text-3xl font-black text-riverRed">{newsCount}</div>
            <div className="text-[11px] text-neutral-500 uppercase tracking-wider mt-1">
              {newsCount === 1 ? 'Noticia publicada' : 'Noticias publicadas'}
            </div>
          </div>
        )}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 text-center">
          <div className="text-3xl font-black text-white">
            {timeAgo(user.created_at).replace('hace ', '')}
          </div>
          <div className="text-[11px] text-neutral-500 uppercase tracking-wider mt-1">En la comunidad</div>
        </div>
      </div>

      {/* Historial de predicciones */}
      {predictions.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
            Mis predicciones ({predictions.length})
          </h3>
          <div className="space-y-2">
            {predictions.map((entry) => {
              const m = entry.match;
              return (
                <div
                  key={entry.matchId}
                  className="flex items-center justify-between gap-3 p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm"
                >
                  <div className="flex-1 min-w-0">
                    {m ? (
                      <>
                        <Link
                          to={`/partidos/${m.id}`}
                          className="font-semibold truncate block hover:text-riverRed transition-colors"
                        >
                          {m.homeTeam} vs {m.awayTeam}
                        </Link>
                        <div className="text-[11px] text-neutral-500 mt-0.5">
                          {m.competition} · {new Date(m.date).toLocaleDateString('es-AR')}
                          {m.status === 'finished' && m.homeScore !== null && (
                            <span className="ml-1 font-bold text-neutral-400">
                              ({m.homeScore}–{m.awayScore})
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <span className="text-neutral-500 text-xs">Partido no disponible</span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border flex-shrink-0 ${PRED_COLORS[entry.pred]}`}
                  >
                    {PRED_LABELS[entry.pred]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Accesos rápidos para admin/editor */}
      {(user.role === 'admin' || user.role === 'editor') && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
            Acceso rápido
          </h3>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin"
              className="text-sm bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-riverRed px-4 py-2 rounded-xl transition-all font-semibold"
            >
              Panel Admin →
            </Link>
            {user.role === 'admin' && (
              <Link
                to="/admin/partidos"
                className="text-sm bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-riverRed px-4 py-2 rounded-xl transition-all font-semibold"
              >
                Gestionar partidos →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
