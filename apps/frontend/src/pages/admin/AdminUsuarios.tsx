import { useEffect, useState } from 'react';
import { Search, Shield, User, Ban } from 'lucide-react';
import { api } from '../../services/api';
import { timeAgo } from '../../utils/time';

interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: string;
  isBanned: boolean;
  points: number;
  created_at: string;
  _count: { predictions: number; comments: number };
}

const ROLES = ['user', 'editor', 'admin'];

const ROLE_STYLE: Record<string, string> = {
  admin: 'bg-riverRed/20 text-riverRed border-riverRed/30',
  editor: 'bg-blue-950/40 text-blue-400 border-blue-800/40',
  user: 'bg-neutral-800 text-neutral-400 border-neutral-700',
};

export default function AdminUsuarios() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'editor' | 'user' | 'banned'>('all');
  const [flash, setFlash] = useState<{ msg: string; error: boolean } | null>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const showFlash = (msg: string, error = false) => {
    setFlash({ msg, error });
    setTimeout(() => setFlash(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<AdminUser[]>('/auth/admin/users');
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setChangingRole(userId);
    try {
      await api.patch(`/auth/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      showFlash('✅ Rol actualizado.');
    } catch {
      showFlash('Error al cambiar el rol.', true);
    } finally {
      setChangingRole(null);
    }
  };

  const handleToggleBan = async (user: AdminUser) => {
    const action = user.isBanned ? 'desbanear' : 'banear';
    if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} a ${user.display_name}?`)) return;
    try {
      await api.patch(`/auth/admin/users/${user.id}/${user.isBanned ? 'unban' : 'ban'}`);
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isBanned: !u.isBanned } : u));
      showFlash(`✅ Usuario ${user.isBanned ? 'desbaneado' : 'baneado'}.`);
    } catch {
      showFlash('Error al cambiar el estado del usuario.', true);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch = !search ||
      u.display_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole =
      roleFilter === 'all' ? true :
      roleFilter === 'banned' ? u.isBanned :
      u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const inputClass = 'bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl px-4 py-2.5 text-sm outline-none transition-all';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black mb-1">Gestión de Usuarios</h1>
        <p className="text-sm text-neutral-400">
          {loading ? 'Cargando…' : `${users.length} usuario${users.length !== 1 ? 's' : ''} registrados`}
        </p>
      </div>

      {flash && (
        <div className={`p-3 rounded-xl text-sm border ${flash.error ? 'bg-red-950/30 border-red-900/50 text-red-200' : 'bg-green-950/30 border-green-900/50 text-green-200'}`}>
          {flash.msg}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            className={`${inputClass} pl-9 w-full`}
            placeholder="Buscar por nombre o email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'admin', 'editor', 'user', 'banned'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setRoleFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                roleFilter === f
                  ? f === 'banned' ? 'bg-red-950/40 border-riverRed/40 text-riverRed'
                    : f === 'admin' ? 'bg-riverRed/20 border-riverRed/40 text-riverRed'
                    : f === 'editor' ? 'bg-blue-950/40 border-blue-700/40 text-blue-400'
                    : 'bg-neutral-800 border-neutral-700 text-white'
                  : 'border-neutral-800 text-neutral-500 hover:text-white'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'banned' ? '🚫 Baneados' : f}
              {f !== 'all' && (
                <span className="ml-1.5 opacity-60">
                  {f === 'banned'
                    ? users.filter((u) => u.isBanned).length
                    : users.filter((u) => u.role === f).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-riverRed mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center text-sm text-neutral-500">
          No hay usuarios que coincidan con el filtro.
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_80px_100px_80px_120px] gap-4 px-5 py-3 border-b border-neutral-800 text-[11px] font-bold uppercase tracking-widest text-neutral-500">
            <div>Usuario</div>
            <div>Registrado</div>
            <div className="text-center">Puntos</div>
            <div className="text-center">Actividad</div>
            <div className="text-center">Rol</div>
            <div className="text-right">Acciones</div>
          </div>

          {filtered.map((u) => (
            <div
              key={u.id}
              className={`grid grid-cols-1 md:grid-cols-[2fr_1fr_80px_100px_80px_120px] gap-3 md:gap-4 items-center px-5 py-4 border-b border-neutral-800 last:border-0 transition-colors ${
                u.isBanned ? 'bg-red-950/10' : 'hover:bg-neutral-800/30'
              }`}
            >
              {/* Usuario */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden border border-neutral-700 bg-neutral-800">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-black text-neutral-400">
                      {u.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold truncate ${u.isBanned ? 'line-through text-neutral-500' : ''}`}>
                      {u.display_name}
                    </span>
                    {u.isBanned && <span className="text-[9px] bg-red-950/60 text-riverRed border border-red-900/40 px-1.5 py-0.5 rounded-full font-black flex-shrink-0">BANEADO</span>}
                  </div>
                  <div className="text-[11px] text-neutral-500 truncate">{u.email}</div>
                </div>
              </div>

              {/* Registrado */}
              <div className="text-[11px] text-neutral-500">{timeAgo(u.created_at)}</div>

              {/* Puntos */}
              <div className="text-center">
                <span className="text-sm font-bold text-riverRed">{u.points}</span>
              </div>

              {/* Actividad */}
              <div className="text-center text-[11px] text-neutral-500">
                <div>{u._count.predictions} prode{u._count.predictions !== 1 ? 's' : ''}</div>
                <div>{u._count.comments} comentario{u._count.comments !== 1 ? 's' : ''}</div>
              </div>

              {/* Rol */}
              <div className="flex justify-center">
                <select
                  value={u.role}
                  disabled={changingRole === u.id}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  className={`text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border outline-none cursor-pointer transition-all bg-neutral-950 ${ROLE_STYLE[u.role] ?? ROLE_STYLE.user}`}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Acciones */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleToggleBan(u)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    u.isBanned
                      ? 'bg-neutral-800 border-neutral-700 text-green-400 hover:bg-green-950/30 hover:border-green-700'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-riverRed hover:border-riverRed/50 hover:bg-red-950/20'
                  }`}
                >
                  {u.isBanned ? (
                    <><User className="w-3 h-3" /> Desbanear</>
                  ) : (
                    <><Ban className="w-3 h-3" /> Banear</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resumen */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: users.length, color: 'text-white' },
            { label: 'Admins', value: users.filter((u) => u.role === 'admin').length, color: 'text-riverRed' },
            { label: 'Editores', value: users.filter((u) => u.role === 'editor').length, color: 'text-blue-400' },
            { label: 'Baneados', value: users.filter((u) => u.isBanned).length, color: 'text-orange-400' },
          ].map((s) => (
            <div key={s.label} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[11px] text-neutral-500 uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
