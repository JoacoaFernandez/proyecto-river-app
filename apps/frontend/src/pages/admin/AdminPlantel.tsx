// apps/frontend/src/pages/admin/AdminPlantel.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Plus, User, AlertTriangle } from 'lucide-react';
import {
  createPlayer,
  deletePlayer,
  getPlayers,
  updatePlayer,
  type Player,
} from '../../services/players.service';
import { api } from '../../services/api';

const positionLabel: Record<string, string> = {
  Goalkeeper: 'Arquero',
  Defender: 'Defensor',
  Midfielder: 'Mediocampista',
  Attacker: 'Delantero',
};

const STATUS_OPTIONS = [
  { value: 'available',  label: 'Disponible',  color: 'text-green-400' },
  { value: 'injured',    label: 'Lesionado',   color: 'text-red-400' },
  { value: 'suspended',  label: 'Suspendido',  color: 'text-orange-400' },
  { value: 'loaned',     label: 'Cedido',      color: 'text-yellow-400' },
];

const STATUS_DOT: Record<string, string> = {
  available: 'bg-green-500',
  injured:   'bg-red-500',
  suspended: 'bg-orange-500',
  loaned:    'bg-yellow-500',
};

const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'];

const inputClass =
  'w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl px-4 py-2.5 text-sm outline-none transition-all';
const labelClass =
  'block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5';

interface PlayerForm {
  name: string;
  position: string;
  subPosition: string;
  number: string;
  age: string;
  nationality: string;
  photo: string;
  status: string;
  nickname: string;
  preferredFoot: string;
  joinedAt: string;
  injuryType: string;
  injuryZone: string;
  injuryReturnDate: string;
}

const SUB_POSITION_OPTIONS = [
  { value: '',    label: '(auto)',         group: '' },
  { value: 'GK',  label: 'Arquero (GK)',   group: 'Arquero' },
  { value: 'CB',  label: 'Central (CB)',   group: 'Defensa' },
  { value: 'LB',  label: 'Lat. Izq. (LB)', group: 'Defensa' },
  { value: 'RB',  label: 'Lat. Der. (RB)', group: 'Defensa' },
  { value: 'CDM', label: 'Volante def. (CDM)', group: 'Medio' },
  { value: 'CM',  label: 'Volante central (CM)', group: 'Medio' },
  { value: 'CAM', label: 'Enganche (CAM)', group: 'Medio' },
  { value: 'LM',  label: 'Volante izq. (LM)', group: 'Medio' },
  { value: 'RM',  label: 'Volante der. (RM)', group: 'Medio' },
  { value: 'LW',  label: 'Extremo izq. (LW)', group: 'Delantero' },
  { value: 'RW',  label: 'Extremo der. (RW)', group: 'Delantero' },
  { value: 'CF',  label: 'Centro delantero (CF)', group: 'Delantero' },
];

const emptyForm: PlayerForm = {
  name: '',
  position: 'Midfielder',
  subPosition: '',
  number: '',
  age: '',
  nationality: '',
  photo: '',
  status: 'available',
  nickname: '',
  preferredFoot: '',
  joinedAt: '',
  injuryType: '',
  injuryZone: '',
  injuryReturnDate: '',
};

function playerToForm(p: Player): PlayerForm {
  return {
    name: p.name,
    position: p.position,
    subPosition: p.subPosition ?? '',
    number: p.number != null ? String(p.number) : '',
    age: p.age != null ? String(p.age) : '',
    nationality: p.nationality ?? '',
    photo: p.photo ?? '',
    status: p.status ?? 'available',
    nickname: p.nickname ?? '',
    preferredFoot: p.preferredFoot ?? '',
    joinedAt: p.joinedAt ? p.joinedAt.substring(0, 10) : '',
    injuryType: p.injuryType ?? '',
    injuryZone: p.injuryZone ?? '',
    injuryReturnDate: p.injuryReturnDate ? p.injuryReturnDate.substring(0, 10) : '',
  };
}

export default function AdminPlantel() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PlayerForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [editing, setEditing] = useState<Player | null>(null);
  const [editForm, setEditForm] = useState<PlayerForm>(emptyForm);
  const [editPhotos, setEditPhotos] = useState<string[]>([]);
  const [photoInput, setPhotoInput] = useState('');
  const [editStats, setEditStats] = useState({
    goals: '', assists: '', appearances: '', minutes: '', yellow: '', red: '',
  });
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSyncInjuries = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await api.post<{ synced: number; matched: number; espnFound: number }>('/players/sync-injuries-espn');
      const { matched, espnFound } = res.data;
      if (matched > 0) {
        flash(`✅ ${matched} jugador(es) marcado(s) como lesionado(s) (ESPN encontró ${espnFound}).`);
        await load();
      } else if (espnFound === 0) {
        flash('ESPN no devolvió lesionados — marcá manualmente desde "Editar".', true);
      } else {
        flash(`ESPN reportó ${espnFound} lesionado(s) pero ninguno matcheó con el plantel actual.`, true);
      }
    } catch (e: any) {
      flash(e?.response?.data?.message ?? 'Error al sincronizar lesionados.', true);
    } finally {
      setSyncing(false);
    }
  };

  const load = async () => {
    setLoading(true);
    const list = await getPlayers();
    setPlayers(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const flash = (msg: string, isError = false) => {
    if (isError) { setError(msg); setInfo(null); }
    else { setInfo(msg); setError(null); }
    setTimeout(() => { setError(null); setInfo(null); }, 4000);
  };

  const formToPayload = (f: PlayerForm) => ({
    name: f.name.trim(),
    position: f.position,
    subPosition: f.subPosition || null,
    number: f.number ? parseInt(f.number, 10) : undefined,
    age: f.age ? parseInt(f.age, 10) : undefined,
    nationality: f.nationality.trim() || undefined,
    photo: f.photo.trim() || undefined,
    status: f.status,
    nickname: f.nickname.trim() || undefined,
    preferredFoot: f.preferredFoot || undefined,
    joinedAt: f.joinedAt || undefined,
    injuryType: f.status === 'injured' ? (f.injuryType.trim() || undefined) : null,
    injuryZone: f.status === 'injured' ? (f.injuryZone.trim() || undefined) : null,
    injuryReturnDate: f.status === 'injured' ? (f.injuryReturnDate || undefined) : null,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { flash('El nombre es obligatorio.', true); return; }
    setSubmitting(true);
    try {
      await createPlayer(formToPayload(form) as any);
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
    setEditForm(playerToForm(p));
    setEditPhotos(Array.isArray(p.photos) ? p.photos : []);
    setPhotoInput('');
    setEditStats({
      goals: p.manualGoals != null ? String(p.manualGoals) : '',
      assists: p.manualAssists != null ? String(p.manualAssists) : '',
      appearances: p.manualAppearances != null ? String(p.manualAppearances) : '',
      minutes: p.manualMinutes != null ? String(p.manualMinutes) : '',
      yellow: p.manualYellowCards != null ? String(p.manualYellowCards) : '',
      red: p.manualRedCards != null ? String(p.manualRedCards) : '',
    });
  };

  const parseStat = (s: string): number | null => {
    const t = s.trim();
    if (!t) return null;
    const n = parseInt(t, 10);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };

  const addPhoto = () => {
    const url = photoInput.trim();
    if (!url) return;
    if (editPhotos.includes(url)) return;
    setEditPhotos([...editPhotos, url]);
    setPhotoInput('');
  };

  const removePhoto = (url: string) => {
    setEditPhotos(editPhotos.filter((u) => u !== url));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editForm.name.trim()) { flash('El nombre es obligatorio.', true); return; }
    setSaving(true);
    try {
      await updatePlayer(editing.id, {
        ...formToPayload(editForm),
        photos: editPhotos,
        manualGoals: parseStat(editStats.goals),
        manualAssists: parseStat(editStats.assists),
        manualAppearances: parseStat(editStats.appearances),
        manualMinutes: parseStat(editStats.minutes),
        manualYellowCards: parseStat(editStats.yellow),
        manualRedCards: parseStat(editStats.red),
      } as any);
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

  const injuredCount = players.filter((p) => p.status === 'injured').length;

  const StatusFields = ({ f, setF }: { f: PlayerForm; setF: (v: PlayerForm) => void }) => (
    <>
      <div>
        <label className={labelClass}>Estado físico</label>
        <select
          className={inputClass}
          value={f.status}
          onChange={(e) => setF({ ...f, status: e.target.value })}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {f.status === 'injured' && (
        <>
          <div>
            <label className={labelClass}>Tipo de lesión</label>
            <input
              type="text"
              className={inputClass}
              value={f.injuryType}
              onChange={(e) => setF({ ...f, injuryType: e.target.value })}
              placeholder="Ej: Muscular, Ligamentaria, Ósea…"
            />
          </div>
          <div>
            <label className={labelClass}>Zona afectada</label>
            <input
              type="text"
              className={inputClass}
              value={f.injuryZone}
              onChange={(e) => setF({ ...f, injuryZone: e.target.value })}
              placeholder="Ej: Muslo derecho, Rodilla izquierda…"
            />
          </div>
          <div>
            <label className={labelClass}>Regreso estimado</label>
            <input
              type="date"
              className={inputClass}
              value={f.injuryReturnDate}
              onChange={(e) => setF({ ...f, injuryReturnDate: e.target.value })}
            />
          </div>
        </>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1">Plantel</h1>
          <p className="text-sm text-neutral-400">
            {loading
              ? 'Cargando jugadores…'
              : `${players.length} jugadores`}
            {injuredCount > 0 && (
              <span className="ml-3 inline-flex items-center gap-1 text-red-400">
                <AlertTriangle className="w-3 h-3" />
                {injuredCount} lesionado{injuredCount > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSyncInjuries}
            disabled={syncing}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900 border border-neutral-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            title="Intentar detectar lesionados desde ESPN. Nunca pisa estados manuales."
          >
            <AlertTriangle className="w-4 h-4" />
            {syncing ? 'Sincronizando…' : 'Detectar lesionados (ESPN)'}
          </button>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-2 bg-riverRed hover:bg-red-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-900/30"
          >
            {showForm ? <><X className="w-4 h-4" /> Cancelar</> : <><Plus className="w-4 h-4" /> Nuevo jugador</>}
          </button>
        </div>
      </div>

      {(error || info) && (
        <div className={`p-3 rounded-xl text-sm border ${error ? 'bg-red-950/30 border-red-900/50 text-red-200' : 'bg-green-950/30 border-green-900/50 text-green-200'}`}>
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
              <input type="text" className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Marcelo Gallardo" required />
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
            <StatusFields f={form} setF={setForm} />
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
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">
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
            <div className="w-28">Estado</div>
            <div className="w-48 text-right">Acciones</div>
          </div>

          {filtered.map((p) => {
            const dot = STATUS_DOT[p.status ?? 'available'] ?? STATUS_DOT.available;
            const statusColor = STATUS_OPTIONS.find((o) => o.value === (p.status ?? 'available'))?.color ?? 'text-green-400';
            return (
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
                      <img src={p.photo} alt={p.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <User className="w-4 h-4 text-neutral-600" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{p.name}</div>
                  {p.injuryType && p.status === 'injured' && (
                    <div className="text-[11px] text-red-400 truncate">{p.injuryType}{p.injuryZone ? ` — ${p.injuryZone}` : ''}</div>
                  )}
                </div>

                <div className="md:w-32 text-xs text-neutral-400">
                  {positionLabel[p.position] ?? p.position}
                </div>

                <div className="md:w-28">
                  <div className="relative inline-flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <select
                      value={p.status ?? 'available'}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        if (newStatus === p.status) return;
                        try {
                          await updatePlayer(p.id, {
                            status: newStatus,
                            // Si pasa a disponible, limpiar campos de lesión
                            ...(newStatus === 'available' ? { injuryType: null, injuryZone: null, injuryReturnDate: null } as any : {}),
                          });
                          flash(`✅ ${p.name} → ${STATUS_OPTIONS.find((o) => o.value === newStatus)?.label}`);
                          await load();
                        } catch {
                          flash('Error al cambiar estado.', true);
                        }
                      }}
                      className={`bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer outline-none focus:border-riverRed ${statusColor}`}
                      title="Cambiar estado rápido"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="md:w-48 flex md:justify-end gap-2 flex-wrap">
                  <Link to={`/plantel/${p.id}`} className="text-xs bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 px-3 py-1.5 rounded-lg transition-all">
                    Ver
                  </Link>
                  <button onClick={() => openEdit(p)} className="text-xs bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 px-3 py-1.5 rounded-lg transition-all">
                    Editar
                  </button>
                  <button onClick={() => handleDelete(p.id, p.name)} className="text-xs bg-neutral-950 hover:bg-red-950/40 border border-neutral-800 hover:border-riverRed text-neutral-300 hover:text-riverRed px-3 py-1.5 rounded-lg transition-all">
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
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
              <h2 className="font-black text-lg">Editar — {editing.name}</h2>
              <button type="button" onClick={() => setEditing(null)} className="text-neutral-500 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nombre completo *</label>
                <input type="text" className={inputClass} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div>
                <label className={labelClass}>Apodo</label>
                <input type="text" className={inputClass} value={editForm.nickname} onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })} placeholder='Ej: "Pulpo"' />
              </div>
              <div>
                <label className={labelClass}>Posición *</label>
                <select className={inputClass} value={editForm.position} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}>
                  {POSITIONS.map((p) => <option key={p} value={p}>{positionLabel[p]}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Sub-posición</label>
                <select className={inputClass} value={editForm.subPosition} onChange={(e) => setEditForm({ ...editForm, subPosition: e.target.value })}>
                  {SUB_POSITION_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <p className="text-[10px] text-neutral-500 mt-1">Determina dónde se ubica en la cancha (LB = lateral izquierdo, etc.). "(auto)" usa el genérico.</p>
              </div>
              <div>
                <label className={labelClass}>Pie hábil</label>
                <select className={inputClass} value={editForm.preferredFoot} onChange={(e) => setEditForm({ ...editForm, preferredFoot: e.target.value })}>
                  <option value="">Sin especificar</option>
                  <option value="right">Derecho</option>
                  <option value="left">Izquierdo</option>
                  <option value="both">Ambidiestro</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Dorsal</label>
                <input type="number" min="1" max="99" className={inputClass} value={editForm.number} onChange={(e) => setEditForm({ ...editForm, number: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Edad</label>
                <input type="number" min="15" max="50" className={inputClass} value={editForm.age} onChange={(e) => setEditForm({ ...editForm, age: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Nacionalidad</label>
                <input type="text" className={inputClass} value={editForm.nationality} onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>En River desde</label>
                <input type="date" className={inputClass} value={editForm.joinedAt} onChange={(e) => setEditForm({ ...editForm, joinedAt: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Foto (URL)</label>
                <input type="url" className={inputClass} value={editForm.photo} onChange={(e) => setEditForm({ ...editForm, photo: e.target.value })} />
                {editForm.photo && (
                  <img src={editForm.photo} alt="preview" className="mt-2 w-12 h-12 rounded-full object-cover border border-neutral-700" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
              </div>

              {/* Estado físico */}
              <div className="md:col-span-2 border-t border-neutral-800 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-riverRed mb-3">Estado físico</p>
              </div>
              <StatusFields f={editForm} setF={setEditForm} />

              {/* Galería de fotos */}
              <div className="md:col-span-2 border-t border-neutral-800 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-riverRed mb-2">Galería de fotos</p>
                <p className="text-[11px] text-neutral-500 mb-3">URLs de fotos del jugador (festejos, entrenamientos, partidos). Aparecen en su ficha como carrusel.</p>
                <div className="flex gap-2 mb-3">
                  <input
                    type="url"
                    placeholder="https://ejemplo.com/foto.jpg"
                    className={inputClass + ' flex-1'}
                    value={photoInput}
                    onChange={(e) => setPhotoInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPhoto(); } }}
                  />
                  <button
                    type="button"
                    onClick={addPhoto}
                    className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Agregar
                  </button>
                </div>
                {editPhotos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {editPhotos.map((url) => (
                      <div key={url} className="relative group">
                        <img
                          src={url}
                          alt=""
                          className="w-full aspect-square object-cover rounded-lg border border-neutral-700"
                          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(url)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Quitar foto"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Estadísticas manuales */}
              <div className="md:col-span-2 border-t border-neutral-800 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-riverRed mb-2">Estadísticas (override manual)</p>
                <p className="text-[11px] text-neutral-500 mb-3">
                  Dejá vacío para usar los datos automáticos de ESPN. Si cargás un valor, reemplaza el de ESPN en la ficha del jugador y el leaderboard.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  <div>
                    <label className={labelClass}>Goles</label>
                    <input type="number" min="0" className={inputClass} value={editStats.goals}
                      onChange={(e) => setEditStats({ ...editStats, goals: e.target.value })} placeholder="auto" />
                  </div>
                  <div>
                    <label className={labelClass}>Asist.</label>
                    <input type="number" min="0" className={inputClass} value={editStats.assists}
                      onChange={(e) => setEditStats({ ...editStats, assists: e.target.value })} placeholder="auto" />
                  </div>
                  <div>
                    <label className={labelClass}>Partidos</label>
                    <input type="number" min="0" className={inputClass} value={editStats.appearances}
                      onChange={(e) => setEditStats({ ...editStats, appearances: e.target.value })} placeholder="auto" />
                  </div>
                  <div>
                    <label className={labelClass}>Minutos</label>
                    <input type="number" min="0" className={inputClass} value={editStats.minutes}
                      onChange={(e) => setEditStats({ ...editStats, minutes: e.target.value })} placeholder="0" />
                  </div>
                  <div>
                    <label className={labelClass}>T. Amarillas</label>
                    <input type="number" min="0" className={inputClass} value={editStats.yellow}
                      onChange={(e) => setEditStats({ ...editStats, yellow: e.target.value })} placeholder="auto" />
                  </div>
                  <div>
                    <label className={labelClass}>T. Rojas</label>
                    <input type="number" min="0" className={inputClass} value={editStats.red}
                      onChange={(e) => setEditStats({ ...editStats, red: e.target.value })} placeholder="auto" />
                  </div>
                </div>
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
