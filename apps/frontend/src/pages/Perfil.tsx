// apps/frontend/src/pages/Perfil.tsx
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getCurrentUser,
  updateCurrentUser,
  changePassword,
  deleteAccount,
  clearCurrentUser,
} from '../services/me.service';
import type { CurrentUser } from '../services/me.service';
import { getMyAllPredictions } from '../services/predictions.service';
import { api } from '../services/api';

function resizeImageToBase64(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

interface PredEntry {
  matchId: string;
  choice: string;
  status: string;
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number | null;
    awayScore: number | null;
    status: string;
    competition: string | null;
    date: string;
  } | null;
}

interface RankingEntry {
  id: string;
  display_name: string;
  points: number;
  avatar_url: string | null;
}

interface Badge {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  earned: boolean;
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin: { label: 'Administrador', color: 'bg-red-950/40 text-riverRed border-red-900/40' },
  editor: { label: 'Editor', color: 'bg-blue-950/40 text-blue-400 border-blue-900/40' },
  user: { label: 'Hincha', color: 'bg-neutral-800 text-neutral-300 border-neutral-700' },
};

function computeBadges(
  preds: PredEntry[],
  memberSince: string,
  points: number,
  hasAvatar: boolean,
): Badge[] {
  const total = preds.length;
  const won = preds.filter((p) => p.status === 'won').length;
  const consecutive = (() => {
    let max = 0, cur = 0;
    for (const p of [...preds].sort(
      (a, b) => new Date(a.match?.date ?? 0).getTime() - new Date(b.match?.date ?? 0).getTime()
    )) {
      if (p.status === 'won') { cur++; max = Math.max(max, cur); }
      else if (p.status === 'lost') cur = 0;
    }
    return max;
  })();
  const memberDays = (Date.now() - new Date(memberSince).getTime()) / (1000 * 60 * 60 * 24);

  return [
    {
      id: 'bienvenido',
      emoji: '🏟️',
      name: 'Bienvenido',
      desc: 'Se unió a la comunidad de River',
      earned: true,
    },
    {
      id: 'foto',
      emoji: '📸',
      name: 'Cara Visible',
      desc: 'Agregó una foto de perfil',
      earned: hasAvatar,
    },
    {
      id: 'primer_prode',
      emoji: '🎯',
      name: 'Primer Prode',
      desc: 'Realizó su primera predicción',
      earned: total >= 1,
    },
    {
      id: 'adivino',
      emoji: '🔮',
      name: 'Adivino',
      desc: 'Acertó al menos 1 predicción',
      earned: won >= 1,
    },
    {
      id: 'racha',
      emoji: '🔥',
      name: 'En Racha',
      desc: 'Acertó 3 predicciones seguidas',
      earned: consecutive >= 3,
    },
    {
      id: 'halcon',
      emoji: '🦅',
      name: 'Ojo de Halcón',
      desc: 'Acertó 5 o más predicciones',
      earned: won >= 5,
    },
    {
      id: 'puntos',
      emoji: '⭐',
      name: 'Acumulador',
      desc: 'Llegó a 50 puntos',
      earned: points >= 50,
    },
    {
      id: 'fiel',
      emoji: '❤️',
      name: 'Hincha Fiel',
      desc: 'Miembro por más de 30 días',
      earned: memberDays >= 30,
    },
    {
      id: 'profeta',
      emoji: '🌟',
      name: 'Profeta',
      desc: 'Acertó 10 o más predicciones',
      earned: won >= 10,
    },
  ];
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm uppercase tracking-wider text-riverRed">{title}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-white text-xl leading-none">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputClass =
  'w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl px-4 py-2.5 text-sm outline-none transition-all';
const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5';

export default function Perfil() {
  const navigate = useNavigate();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<{ msg: string; error: boolean } | null>(null);

  const [predictions, setPredictions] = useState<PredEntry[]>([]);
  const [ranking, setRanking] = useState<RankingEntry[]>([]);

  const [avatarError, setAvatarError] = useState(false);

  const [modal, setModal] = useState<
    'editProfile' | 'password' | 'notifications' | 'deleteAccount' | null
  >(null);

  // Edit profile form
  const [displayName, setDisplayName] = useState('');
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [avatarFileName, setAvatarFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [fanSince, setFanSince] = useState('');
  const [saving, setSaving] = useState(false);

  // Password form
  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [newPwd2, setNewPwd2] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  // Notifications form
  const [notifGoals, setNotifGoals] = useState(true);
  const [notifMatch, setNotifMatch] = useState(true);
  const [notifNews, setNotifNews] = useState(false);
  const [quietFrom, setQuietFrom] = useState('');
  const [quietTo, setQuietTo] = useState('');
  const [notifSaving, setNotifSaving] = useState(false);

  // Delete account form
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const showFlash = (msg: string, error = false) => {
    setFlash({ msg, error });
    setTimeout(() => setFlash(null), 3500);
  };

  useEffect(() => {
    Promise.all([getCurrentUser(true), getMyAllPredictions()])
      .then(([u, preds]) => {
        setUser(u);
        setAvatarError(false);
        if (u) {
          setDisplayName(u.display_name);
          setCity(u.city ?? '');
          setCountry(u.country ?? '');
          setFanSince(u.fanSince ? String(u.fanSince) : '');
          setNotifGoals(u.notifGoals);
          setNotifMatch(u.notifMatch);
          setNotifNews(u.notifNews);
          setQuietFrom(u.quietFrom != null ? String(u.quietFrom) : '');
          setQuietTo(u.quietTo != null ? String(u.quietTo) : '');
        }
        setPredictions(
          preds.map((p: any) => ({
            matchId: p.matchId,
            choice: p.choice,
            status: p.status,
            match: p.match || null,
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    api.get<RankingEntry[]>('/auth/ranking').then((res) => setRanking(res.data)).catch(() => {});
  }, []);

  const openModal = (m: typeof modal) => {
    if (m === 'editProfile' && user) {
      setDisplayName(user.display_name);
      setAvatarBase64(null);
      setAvatarFileName('');
      setCity(user.city ?? '');
      setCountry(user.country ?? '');
      setFanSince(user.fanSince ? String(user.fanSince) : '');
    }
    if (m === 'notifications' && user) {
      setNotifGoals(user.notifGoals);
      setNotifMatch(user.notifMatch);
      setNotifNews(user.notifNews);
      setQuietFrom(user.quietFrom != null ? String(user.quietFrom) : '');
      setQuietTo(user.quietTo != null ? String(user.quietTo) : '');
    }
    setDeleteConfirm('');
    setCurPwd(''); setNewPwd(''); setNewPwd2('');
    setModal(m);
  };

  const handleLogout = () => {
    localStorage.removeItem('river_app_token');
    clearCurrentUser();
    navigate('/login');
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFileName(file.name);
    try {
      const b64 = await resizeImageToBase64(file);
      setAvatarBase64(b64);
    } catch {
      showFlash('No se pudo procesar la imagen.', true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) { showFlash('El nombre no puede estar vacío.', true); return; }
    setSaving(true);
    try {
      const updated = await updateCurrentUser({
        display_name: displayName.trim(),
        avatar_url: avatarBase64 ?? (user?.avatar_url ?? undefined),
        city: city.trim() || null,
        country: country.trim() || null,
        fanSince: fanSince ? parseInt(fanSince) : null,
      });
      setUser(updated);
      setAvatarError(false);
      setModal(null);
      window.dispatchEvent(new Event('user:updated'));
      showFlash('Perfil actualizado correctamente.');
    } catch {
      showFlash('Error al guardar los cambios.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== newPwd2) { showFlash('Las contraseñas no coinciden.', true); return; }
    if (newPwd.length < 6) { showFlash('La nueva contraseña debe tener al menos 6 caracteres.', true); return; }
    setPwdSaving(true);
    try {
      await changePassword(curPwd, newPwd);
      setModal(null);
      showFlash('Contraseña actualizada correctamente.');
    } catch {
      showFlash('Contraseña actual incorrecta.', true);
    } finally {
      setPwdSaving(false);
    }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotifSaving(true);
    try {
      const updated = await updateCurrentUser({
        notifGoals,
        notifMatch,
        notifNews,
        quietFrom: quietFrom !== '' ? parseInt(quietFrom) : null,
        quietTo: quietTo !== '' ? parseInt(quietTo) : null,
      });
      setUser(updated);
      setModal(null);
      showFlash('Preferencias de notificaciones guardadas.');
    } catch {
      showFlash('Error al guardar las preferencias.', true);
    } finally {
      setNotifSaving(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirm !== 'ELIMINAR') { showFlash('Escribe ELIMINAR para confirmar.', true); return; }
    setDeleting(true);
    try {
      await deleteAccount();
      localStorage.removeItem('river_app_token');
      clearCurrentUser();
      navigate('/login');
    } catch {
      showFlash('Error al eliminar la cuenta.', true);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 mt-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-riverRed mx-auto mb-4" />
        <p className="text-neutral-400">Cargando perfil…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 mt-12 text-center">
        <h2 className="text-xl font-bold mb-2">Sesión no iniciada</h2>
        <Link to="/login" className="text-riverRed font-semibold hover:underline">
          Ir al login →
        </Link>
      </div>
    );
  }

  const roleInfo = ROLE_LABELS[user.role] ?? ROLE_LABELS.user;
  const initials = user.display_name
    .split(' ').filter((w) => w.length > 0).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  const memberSince = new Date(user.created_at).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const totalPreds = predictions.length;
  const wonPreds = predictions.filter((p) => p.status === 'won').length;
  const accuracy = totalPreds > 0 ? Math.round((wonPreds / totalPreds) * 100) : 0;
  const myRank = ranking.findIndex((r) => r.id === user.id);
  const badges = computeBadges(predictions, user.created_at, user.points, !!user.avatar_url);

  const HOURS = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="max-w-2xl mx-auto px-4 mt-6 pb-12 space-y-5">
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
        <div className="h-24 bg-gradient-to-br from-red-950/50 via-neutral-900 to-neutral-950" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="w-20 h-20 rounded-full border-4 border-neutral-900 overflow-hidden bg-riverRed flex items-center justify-center flex-shrink-0">
              {user.avatar_url && !avatarError ? (
                <img
                  src={user.avatar_url}
                  alt={user.display_name}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span className="text-2xl font-black text-white">{initials}</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openModal('editProfile')}
                className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-riverRed text-sm font-semibold px-4 py-2 rounded-xl transition-all"
              >
                Editar perfil
              </button>
              <button
                onClick={handleLogout}
                className="bg-neutral-950 hover:bg-red-950/40 border border-neutral-800 hover:border-red-900/50 text-neutral-400 hover:text-red-400 text-sm font-semibold px-4 py-2 rounded-xl transition-all"
              >
                Salir
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black">{user.display_name}</h1>
            <p className="text-sm text-neutral-400">{user.email}</p>
            {(user.city || user.country) && (
              <p className="text-sm text-neutral-500">
                📍 {[user.city, user.country].filter(Boolean).join(', ')}
              </p>
            )}
            {user.fanSince && (
              <p className="text-xs text-neutral-500">Hincha desde {user.fanSince}</p>
            )}
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

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-center">
          <div className="text-2xl font-black text-riverRed">{user.points}</div>
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider mt-1">Puntos</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-center">
          <div className="text-2xl font-black text-white">
            {myRank >= 0 ? `#${myRank + 1}` : '—'}
          </div>
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider mt-1">Ranking</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-center">
          <div className="text-2xl font-black text-white">{accuracy}%</div>
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider mt-1">Precisión</div>
        </div>
      </div>

      {/* Insignias */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Insignias</h3>
          <span className="text-xs text-neutral-500">{badges.filter(b => b.earned).length}/{badges.length} obtenidas</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                b.earned
                  ? 'bg-gradient-to-b from-amber-950/30 to-neutral-950 border-amber-700/50 shadow-sm shadow-amber-900/20'
                  : 'bg-neutral-950 border-neutral-800/50'
              }`}
            >
              {!b.earned && (
                <span className="absolute top-1.5 right-1.5 text-[9px] text-neutral-600">🔒</span>
              )}
              <span className={`text-2xl ${b.earned ? '' : 'grayscale opacity-30'}`}>{b.emoji}</span>
              <span className={`text-[10px] font-bold leading-tight ${b.earned ? 'text-amber-300' : 'text-neutral-600'}`}>
                {b.name}
              </span>
              <span className={`text-[9px] leading-tight ${b.earned ? 'text-neutral-400' : 'text-neutral-700'}`}>
                {b.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Ranking general */}
      {ranking.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
            Ranking general (Top 10)
          </h3>
          <div className="space-y-2">
            {ranking.slice(0, 10).map((r, i) => {
              const isMe = r.id === user.id;
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
              return (
                <div
                  key={r.id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border text-sm transition-all ${
                    isMe
                      ? 'bg-red-950/20 border-red-900/40'
                      : 'bg-neutral-950 border-neutral-800'
                  }`}
                >
                  <div className="w-6 text-center flex-shrink-0">
                    {medal ? (
                      <span>{medal}</span>
                    ) : (
                      <span className="text-neutral-500 text-xs font-bold">#{i + 1}</span>
                    )}
                  </div>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                      isMe ? 'bg-riverRed' : 'bg-neutral-800'
                    }`}
                  >
                    {r.avatar_url ? (
                      <img
                        src={r.avatar_url}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).replaceWith(document.createTextNode(r.display_name[0]?.toUpperCase() ?? '')); }}
                      />
                    ) : (
                      r.display_name[0]?.toUpperCase()
                    )}
                  </div>
                  <span className={`flex-1 font-semibold ${isMe ? 'text-red-300' : ''}`}>
                    {r.display_name}
                    {isMe && <span className="ml-1 text-[10px] text-red-400 font-bold">Vos</span>}
                  </span>
                  <span className="text-riverRed font-black">{r.points} pts</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historial de predicciones */}
      {predictions.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
            Mis predicciones ({predictions.length})
          </h3>
          <div className="space-y-2">
            {predictions.map((entry) => {
              const m = entry.match;
              const statusLabel =
                entry.status === 'won'
                  ? { text: 'Acertó ✓', cls: 'text-green-400 border-green-800/50 bg-green-950/20' }
                  : entry.status === 'lost'
                  ? { text: 'Falló ✗', cls: 'text-red-400 border-red-800/50 bg-red-950/20' }
                  : { text: 'Pendiente', cls: 'text-neutral-400 border-neutral-700 bg-neutral-900' };
              const choiceLabel =
                entry.choice === 'home'
                  ? 'Local gana'
                  : entry.choice === 'draw'
                  ? 'Empate'
                  : 'Visitante gana';
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
                        <div className="text-[10px] text-neutral-500 mt-0.5">
                          Mi predicción: <span className="text-neutral-300">{choiceLabel}</span>
                        </div>
                      </>
                    ) : (
                      <span className="text-neutral-500 text-xs">Partido no disponible</span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border flex-shrink-0 ${statusLabel.cls}`}
                  >
                    {statusLabel.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin quick access */}
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

      {/* Account actions */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-2">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">
          Cuenta
        </h3>
        <button
          onClick={() => openModal('notifications')}
          className="w-full flex items-center justify-between px-4 py-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all text-sm font-semibold"
        >
          <span>🔔 Notificaciones</span>
          <span className="text-neutral-500">›</span>
        </button>
        <button
          onClick={() => openModal('password')}
          className="w-full flex items-center justify-between px-4 py-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all text-sm font-semibold"
        >
          <span>🔒 Cambiar contraseña</span>
          <span className="text-neutral-500">›</span>
        </button>
        <button
          onClick={() => openModal('deleteAccount')}
          className="w-full flex items-center justify-between px-4 py-3 bg-red-950/10 hover:bg-red-950/20 border border-red-900/30 hover:border-red-800/50 rounded-xl transition-all text-sm font-semibold text-red-400"
        >
          <span>🗑 Eliminar cuenta</span>
          <span className="text-red-800">›</span>
        </button>
      </div>

      {/* Modal: Editar perfil */}
      {modal === 'editProfile' && (
        <Modal title="Editar perfil" onClose={() => setModal(null)}>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className={labelClass}>Nombre de usuario</label>
              <input className={inputClass} value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Foto de perfil</label>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full border border-neutral-700 overflow-hidden bg-neutral-800 flex items-center justify-center flex-shrink-0 flex-none">
                  {(avatarBase64 || user?.avatar_url) ? (
                    <img
                      src={avatarBase64 ?? user!.avatar_url!}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-neutral-500 text-xl">👤</span>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-riverRed text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
                  >
                    {avatarFileName || 'Elegir foto…'}
                  </button>
                  <p className="text-[10px] text-neutral-500 mt-1">JPG, PNG o GIF — se redimensiona automáticamente</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Ciudad</label>
                <input className={inputClass} placeholder="Buenos Aires" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>País</label>
                <input className={inputClass} placeholder="Argentina" value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Hincha desde (año)</label>
              <input
                type="number"
                className={inputClass}
                placeholder="1995"
                min={1900}
                max={new Date().getFullYear()}
                value={fanSince}
                onChange={(e) => setFanSince(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setModal(null)}
                className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="bg-riverRed hover:bg-red-700 disabled:bg-neutral-800 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-900/30">
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Cambiar contraseña */}
      {modal === 'password' && (
        <Modal title="Cambiar contraseña" onClose={() => setModal(null)}>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className={labelClass}>Contraseña actual</label>
              <input type="password" className={inputClass} value={curPwd} onChange={(e) => setCurPwd(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Nueva contraseña</label>
              <input type="password" className={inputClass} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required minLength={6} />
            </div>
            <div>
              <label className={labelClass}>Confirmar nueva contraseña</label>
              <input type="password" className={inputClass} value={newPwd2} onChange={(e) => setNewPwd2(e.target.value)} required minLength={6} />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setModal(null)}
                className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
                Cancelar
              </button>
              <button type="submit" disabled={pwdSaving}
                className="bg-riverRed hover:bg-red-700 disabled:bg-neutral-800 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-900/30">
                {pwdSaving ? 'Guardando…' : 'Cambiar contraseña'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Notificaciones */}
      {modal === 'notifications' && (
        <Modal title="Notificaciones" onClose={() => setModal(null)}>
          <form onSubmit={handleSaveNotifications} className="space-y-4">
            {[
              { label: 'Goles', value: notifGoals, set: setNotifGoals },
              { label: 'Partidos', value: notifMatch, set: setNotifMatch },
              { label: 'Noticias', value: notifNews, set: setNotifNews },
            ].map(({ label, value, set }) => (
              <label key={label} className="flex items-center justify-between cursor-pointer select-none">
                <span className="text-sm font-semibold">{label}</span>
                <button
                  type="button"
                  onClick={() => set(!value)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-riverRed' : 'bg-neutral-700'}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </label>
            ))}
            <div>
              <label className={labelClass}>Horario silencioso (de / a)</label>
              <div className="grid grid-cols-2 gap-3">
                <select
                  className={inputClass}
                  value={quietFrom}
                  onChange={(e) => setQuietFrom(e.target.value)}
                >
                  <option value="">Sin límite</option>
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                  ))}
                </select>
                <select
                  className={inputClass}
                  value={quietTo}
                  onChange={(e) => setQuietTo(e.target.value)}
                >
                  <option value="">Sin límite</option>
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setModal(null)}
                className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
                Cancelar
              </button>
              <button type="submit" disabled={notifSaving}
                className="bg-riverRed hover:bg-red-700 disabled:bg-neutral-800 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-900/30">
                {notifSaving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Eliminar cuenta */}
      {modal === 'deleteAccount' && (
        <Modal title="Eliminar cuenta" onClose={() => setModal(null)}>
          <form onSubmit={handleDeleteAccount} className="space-y-4">
            <p className="text-sm text-neutral-400">
              Esta acción es <span className="text-red-400 font-bold">irreversible</span>. Se eliminarán tu cuenta, predicciones y todos tus datos.
            </p>
            <div>
              <label className={labelClass}>Escribe ELIMINAR para confirmar</label>
              <input
                className={inputClass}
                placeholder="ELIMINAR"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => setModal(null)}
                className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={deleting || deleteConfirm !== 'ELIMINAR'}
                className="bg-red-800 hover:bg-red-700 disabled:bg-neutral-800 disabled:text-neutral-600 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              >
                {deleting ? 'Eliminando…' : 'Eliminar cuenta'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
