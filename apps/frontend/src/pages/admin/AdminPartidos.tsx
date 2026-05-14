import { useEffect, useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { Match, MatchEvent } from '../../services/matches.service';
import {
  createMatchAdmin,
  deleteMatchAdmin,
  getAllMatchesAdmin,
  updateMatchAdmin,
  getMatchEvents,
} from '../../services/matches.service';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Programado', color: 'bg-blue-950/40 text-blue-400 border-blue-900/40' },
  live: { label: 'En Vivo', color: 'bg-green-950/40 text-green-400 border-green-900/40' },
  finished: { label: 'Finalizado', color: 'bg-neutral-800 text-neutral-400 border-neutral-700' },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toLocalInputValue(dateStr: string) {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminPartidos() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<{ msg: string; error: boolean } | null>(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    homeTeam: 'River Plate',
    awayTeam: '',
    date: '',
    competition: '',
    stadium: '',
  });

  // Edit modal
  const [editing, setEditing] = useState<Match | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    status: '',
    homeScore: '',
    awayScore: '',
    minute: '',
    competition: '',
    stadium: '',
    date: '',
  });

  // Events (read-only, auto-synced from ESPN)
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const showFlash = (msg: string, error = false) => {
    setFlash({ msg, error });
    setTimeout(() => setFlash(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAllMatchesAdmin();
      setMatches(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch {
      showFlash('Error al cargar partidos.', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.awayTeam.trim() || !form.date) {
      showFlash('Rival y fecha son obligatorios.', true);
      return;
    }
    setCreating(true);
    try {
      await createMatchAdmin({
        homeTeam: form.homeTeam.trim(),
        awayTeam: form.awayTeam.trim(),
        date: new Date(form.date).toISOString(),
        competition: form.competition.trim() || undefined,
        stadium: form.stadium.trim() || undefined,
      });
      showFlash('✅ Partido creado.');
      setForm({ homeTeam: 'River Plate', awayTeam: '', date: '', competition: '', stadium: '' });
      setShowCreate(false);
      await load();
    } catch (err: any) {
      showFlash(err?.response?.data?.message || 'Error al crear el partido.', true);
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (m: Match) => {
    setEditing(m);
    setEditForm({
      status: m.status,
      homeScore: m.homeScore?.toString() ?? '0',
      awayScore: m.awayScore?.toString() ?? '0',
      minute: m.minute?.toString() ?? '0',
      competition: m.competition ?? '',
      stadium: m.stadium ?? '',
      date: toLocalInputValue(m.date),
    });
    // Load events for this match
    setEventsLoading(true);
    getMatchEvents(m.id).then((ev) => {
      setEvents(ev);
      setEventsLoading(false);
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await updateMatchAdmin(editing.id, {
        status: editForm.status,
        homeScore: parseInt(editForm.homeScore) || 0,
        awayScore: parseInt(editForm.awayScore) || 0,
        minute: parseInt(editForm.minute) || 0,
        competition: editForm.competition || undefined,
        stadium: editForm.stadium || undefined,
        date: new Date(editForm.date).toISOString(),
      });
      showFlash('✅ Partido actualizado.');
      setEditing(null);
      await load();
    } catch (err: any) {
      showFlash(err?.response?.data?.message || 'Error al guardar.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m: Match) => {
    if (!confirm(`¿Eliminar "${m.homeTeam} vs ${m.awayTeam}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteMatchAdmin(m.id);
      showFlash('Partido eliminado.');
      await load();
    } catch (err: any) {
      showFlash(err?.response?.data?.message || 'Error al eliminar.', true);
    }
  };

  const inputClass = 'w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl px-4 py-2.5 text-sm outline-none transition-all';
  const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1">Gestión de Partidos</h1>
          <p className="text-sm text-neutral-400">
            {loading ? 'Cargando…' : `${matches.length} partido${matches.length !== 1 ? 's' : ''} en base de datos`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate((s) => !s)}
          className="bg-riverRed hover:bg-red-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-900/30"
        >
          {showCreate
            ? <><X className="w-4 h-4" /> Cancelar</>
            : <><Plus className="w-4 h-4" /> Partido manual</>
          }
        </button>
      </div>

      {/* Flash */}
      {flash && (
        <div className={`p-3 rounded-xl text-sm border ${flash.error ? 'bg-red-950/30 border-red-900/50 text-red-200' : 'bg-green-950/30 border-green-900/50 text-green-200'}`}>
          {flash.msg}
        </div>
      )}

      {/* Aviso sync */}
      <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-xl p-3 text-xs text-yellow-300/80">
        Los partidos sincronizados desde la API se actualizan automáticamente cada 10 minutos. Los partidos marcados como <strong>Manual</strong> no se sobreescriben.
      </div>

      {/* Form crear */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-sm uppercase tracking-wider text-riverRed">Nuevo partido manual</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Equipo local</label>
              <input className={inputClass} value={form.homeTeam} onChange={(e) => setForm({ ...form, homeTeam: e.target.value })} required />
            </div>
            <div>
              <label className={labelClass}>Equipo visitante</label>
              <input className={inputClass} placeholder="Ej: Boca Juniors" value={form.awayTeam} onChange={(e) => setForm({ ...form, awayTeam: e.target.value })} required />
            </div>
            <div>
              <label className={labelClass}>Fecha y hora</label>
              <input type="datetime-local" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <label className={labelClass}>Competición</label>
              <input className={inputClass} placeholder="Liga Profesional" value={form.competition} onChange={(e) => setForm({ ...form, competition: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Estadio</label>
              <input className={inputClass} placeholder="Estadio Monumental" value={form.stadium} onChange={(e) => setForm({ ...form, stadium: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowCreate(false)} className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={creating} className="bg-riverRed hover:bg-red-700 disabled:bg-neutral-800 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-900/30">
              {creating ? 'Creando…' : 'Crear partido'}
            </button>
          </div>
        </form>
      )}

      {/* Lista */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-riverRed mx-auto"></div>
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center text-sm text-neutral-500">
          No hay partidos en la base de datos.
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_160px_120px_80px_140px] gap-4 p-4 border-b border-neutral-800 text-[11px] font-bold uppercase tracking-widest text-neutral-500">
            <div>Partido</div>
            <div>Fecha</div>
            <div>Competición</div>
            <div>Estado</div>
            <div className="text-right">Acciones</div>
          </div>

          {matches.map((m) => {
            const st = STATUS_LABELS[m.status] ?? STATUS_LABELS.scheduled;
            return (
              <div key={m.id} className="grid grid-cols-1 md:grid-cols-[1fr_160px_120px_80px_140px] gap-3 md:gap-4 items-center p-4 border-b border-neutral-800 last:border-0 hover:bg-neutral-800/30 transition-colors">
                <div>
                  <div className="font-semibold text-sm">
                    {m.homeTeam} <span className="text-neutral-500 mx-1">vs</span> {m.awayTeam}
                    {m.status === 'finished' && (
                      <span className="ml-2 text-riverRed font-black">{m.homeScore} - {m.awayScore}</span>
                    )}
                    {m.status === 'live' && (
                      <span className="ml-2 text-green-400 font-bold text-xs">{m.homeScore} - {m.awayScore} · {m.minute}'</span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-1">
                    {m.stadium && <span className="text-[11px] text-neutral-500">{m.stadium}</span>}
                    {m.manualOverride && (
                      <span className="text-[10px] font-bold bg-purple-950/40 text-purple-400 border border-purple-900/40 px-1.5 py-0.5 rounded-full">Manual</span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-neutral-400">{formatDate(m.date)}</div>

                <div className="text-[11px] text-neutral-400 truncate">{m.competition ?? '—'}</div>

                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${st.color}`}>
                    {st.label}
                  </span>
                </div>

                <div className="flex md:justify-end gap-2">
                  <button
                    onClick={() => openEdit(m)}
                    className="text-xs bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 px-3 py-1.5 rounded-lg transition-all"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(m)}
                    className="text-xs bg-neutral-950 hover:bg-red-950/40 border border-neutral-800 hover:border-riverRed text-neutral-300 hover:text-riverRed px-3 py-1.5 rounded-lg transition-all"
                  >
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-2xl space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-black text-lg">Editar partido</h2>
              <button type="button" onClick={() => setEditing(null)} className="text-neutral-500 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-neutral-400 -mt-2">
              {editing.homeTeam} vs {editing.awayTeam}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Estado</label>
                <select className={inputClass} value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="scheduled">Programado</option>
                  <option value="live">En Vivo</option>
                  <option value="finished">Finalizado</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Minuto</label>
                <input type="number" min="0" max="120" className={inputClass} value={editForm.minute} onChange={(e) => setEditForm({ ...editForm, minute: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Goles {editing.homeTeam.split(' ')[0]}</label>
                <input type="number" min="0" className={inputClass} value={editForm.homeScore} onChange={(e) => setEditForm({ ...editForm, homeScore: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Goles {editing.awayTeam.split(' ')[0]}</label>
                <input type="number" min="0" className={inputClass} value={editForm.awayScore} onChange={(e) => setEditForm({ ...editForm, awayScore: e.target.value })} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Competición</label>
              <input className={inputClass} value={editForm.competition} onChange={(e) => setEditForm({ ...editForm, competition: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Estadio</label>
              <input className={inputClass} value={editForm.stadium} onChange={(e) => setEditForm({ ...editForm, stadium: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Fecha y hora</label>
              <input type="datetime-local" className={inputClass} value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
            </div>

            {/* ── Eventos del Partido (auto-sync desde ESPN) ── */}
            <div className="border-t border-neutral-800 pt-4 mt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-riverRed mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-riverRed" />
                Eventos del partido
              </h3>
              <p className="text-[10px] text-neutral-600 mb-3">
                Los eventos se importan automáticamente desde ESPN.
              </p>

              {eventsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-riverRed mx-auto" />
                </div>
              ) : events.length === 0 ? (
                <p className="text-xs text-neutral-500 text-center py-3 bg-neutral-950 border border-neutral-800 rounded-xl">
                  Sin eventos registrados. Se importarán automáticamente cuando finalice el partido.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {events.map((ev) => (
                    <div key={ev.id} className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs">
                      <span className="font-bold text-neutral-500 tabular-nums w-8">{ev.minute}'</span>
                      <span className={`font-bold uppercase tracking-wider text-[10px] ${
                        ev.type.includes('goal') ? 'text-green-400' :
                        ev.type.includes('card') ? (ev.type === 'yellow-card' ? 'text-yellow-400' : 'text-red-400') :
                        ev.type === 'substitution' ? 'text-blue-400' :
                        ev.type === 'var' ? 'text-purple-400' : 'text-neutral-400'
                      }`}>
                        {ev.type}
                      </span>
                      <span className="flex-1 text-neutral-300 truncate">
                        {ev.playerName ?? ''}
                        {ev.type === 'substitution' && ev.playerInName ? ` → ${ev.playerInName}` : ''}
                        {ev.assistName ? ` (${ev.assistName})` : ''}
                      </span>
                      <span className="text-[10px] text-neutral-600 truncate max-w-[80px]">{ev.team}</span>
                    </div>
                  ))}
                </div>
              )}
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
