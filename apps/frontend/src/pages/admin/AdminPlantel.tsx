// apps/frontend/src/pages/admin/AdminPlantel.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Plus, User } from 'lucide-react';
import {
  createPlayer,
  deletePlayer,
  getPlayers,
  updatePlayer,
  type Player,
} from '../../services/players.service';

const positionLabel: Record<string, string> = {
  Goalkeeper: 'Arquero',
  Defender: 'Defensor',
  Midfielder: 'Mediocampista',
  Attacker: 'Delantero',
};

const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'];

const inputClass =
  'w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl px-4 py-2.5 text-sm outline-none transition-all';
const labelClass =
  'block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5';

interface PlayerForm {
  name: string;
  position: string;
  number: string;
  age: string;
  nationality: string;
  photo: string;
}

const emptyForm: PlayerForm = {
  name: '',
  position: 'Midfielder',
  number: '',
  age: '',
  nationality: '',
  photo: '',
};

export default function AdminPlantel() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Crear
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PlayerForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // Editar
  const [editing, setEditing] = useState<Player | null>(null);
  const [editForm, setEditForm] = useState<PlayerForm>(emptyForm);
  const [saving, setSaving] = useState(false);

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

  const toPayload = (f: PlayerForm) => ({
    name: f.name.trim(),
    position: f.position,
    number: f.number ? parseInt(f.number, 10) : undefined,
    age: f.age ? parseInt(f.age, 10) : undefined,
    nationality: f.nationality.trim() || undefined,
    photo: f.photo.trim() || undefined,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { flash('El nombre es obligatorio.', true); return; }
    setSubmitting(true);
    try {
      await createPlayer(toPayload(form));
      flash('✅ Jugador agregado al plantel.');
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (err: any) {
      flash(err?.response?.data?.message || 'Error al crear jugador.', true);
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (p: Player) => {
    setEditing(p);
    setEditForm({
      name: p.name,
      position: p.position,
      number: p.number != null ? String(p.number) : '',
      age: p.age != null ? String(p.age) : '',
      nationality: p.nationality ?? '',
      photo: p.photo ?? '',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editForm.name.trim()) { flash('El nombre es obligatorio.', true); return; }
    setSaving(true);
    try {
      await updatePlayer(editing.id, toPayload(editForm));
      flash('✅ Jugador actualizado.');
      setEditing(null);
      await load();
    } catch (err: any) {
      flash(err?.response?.data?.message || 'Error al guardar.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar a ${name} del plantel? Esta acción no se puede deshacer.`)) return;
    try {
      await deletePlayer(id);
      flash(`${name} fue removido del plantel.`);
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
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-riverRed hover:bg-red-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-900/30"
        >
          {showForm
            ? <><X className="w-4 h-4" /> Cancelar</>
            : <><Plus className="w-4 h-4" /> Nuevo jugador</>
          }
        </button>
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

      {/* Form crear */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-sm uppercase tracking-wider text-riverRed">Nuevo jugador manual</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nombre completo *</label>
              <input
                type="text"
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Marcelo Gallardo"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Posición *</label>
              <select className={inputClass} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                {POSITIONS.map((p) => <option key={p} value={p}>{positionLabel[p]}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Dorsal</label>
              <input type="number" min="1" max="99" className={inputClass} value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="Ej: 10" />
            </div>
            <div>
              <label className={labelClass}>Edad</label>
              <input type="number" min="15" max="50" className={inputClass} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="Ej: 27" />
            </div>
            <div>
              <label className={labelClass}>Nacionalidad</label>
              <input type="text" className={inputClass} value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} placeholder="Ej: Argentina" />
            </div>
            <div>
              <label className={labelClass}>Foto (URL)</label>
              <input type="url" className={inputClass} value={form.photo} onChange={(e) => setForm({ ...form, photo: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setForm(emptyForm); setShowForm(false); }} className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="bg-riverRed hover:bg-red-700 disabled:bg-neutral-800 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-900/30">
              {submitting ? 'Guardando…' : 'Agregar jugador'}
            </button>
          </div>
        </form>
      )}

      {/* Buscador */}
      <div className="relative">
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
                    <User className="w-4 h-4 text-neutral-600" />
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

              <div className="md:w-40 flex md:justify-end gap-2">
                <Link
                  to={`/plantel/${p.id}`}
                  className="text-xs bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 px-3 py-1.5 rounded-lg transition-all"
                >
                  Ver
                </Link>
                <button
                  onClick={() => openEdit(p)}
                  className="text-xs bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 px-3 py-1.5 rounded-lg transition-all"
                >
                  Editar
                </button>
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

      {/* Modal editar */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSave}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-2xl space-y-4 shadow-2xl my-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-black text-lg">Editar jugador</h2>
              <button type="button" onClick={() => setEditing(null)} className="text-neutral-500 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nombre completo *</label>
                <input type="text" className={inputClass} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div>
                <label className={labelClass}>Posición *</label>
                <select className={inputClass} value={editForm.position} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}>
                  {POSITIONS.map((p) => <option key={p} value={p}>{positionLabel[p]}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Dorsal</label>
                <input type="number" min="1" max="99" className={inputClass} value={editForm.number} onChange={(e) => setEditForm({ ...editForm, number: e.target.value })} placeholder="Ej: 10" />
              </div>
              <div>
                <label className={labelClass}>Edad</label>
                <input type="number" min="15" max="50" className={inputClass} value={editForm.age} onChange={(e) => setEditForm({ ...editForm, age: e.target.value })} placeholder="Ej: 27" />
              </div>
              <div>
                <label className={labelClass}>Nacionalidad</label>
                <input type="text" className={inputClass} value={editForm.nationality} onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })} placeholder="Ej: Argentina" />
              </div>
              <div>
                <label className={labelClass}>Foto (URL)</label>
                <input type="url" className={inputClass} value={editForm.photo} onChange={(e) => setEditForm({ ...editForm, photo: e.target.value })} placeholder="https://..." />
                {editForm.photo && (
                  <img src={editForm.photo} alt="preview" className="mt-2 w-12 h-12 rounded-full object-cover border border-neutral-700" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setEditing(null)} className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="bg-riverRed hover:bg-red-700 disabled:bg-neutral-800 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-900/30">
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
