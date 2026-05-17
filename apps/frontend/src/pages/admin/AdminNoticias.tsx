// apps/frontend/src/pages/admin/AdminNoticias.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Plus, Flag } from 'lucide-react';
import RichTextEditor from '../../components/RichTextEditor';
import {
  createNews,
  deleteComment,
  deleteNews,
  getNews,
  getReportedComments,
  triggerAiNews,
  updateNews,
} from '../../services/news.service';
import type { NewsItem, ReportedComment } from '../../services/news.service';
import { timeAgo } from '../../utils/time';

const inputClass =
  'w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl px-4 py-2.5 text-sm outline-none transition-all';
const labelClass =
  'block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5';

type Tab = 'noticias' | 'reportados';

export default function AdminNoticias() {
  const [tab, setTab] = useState<Tab>('noticias');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [reported, setReported] = useState<ReportedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Form crear
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Actualidad');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled'>('published');
  const [imageUrl, setImageUrl] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [publishedAt, setPublishedAt] = useState('');

  // Modal editar
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    category: '',
    body: '',
    status: 'published' as 'draft' | 'published' | 'scheduled',
    imageUrl: '',
    urgent: false,
    publishedAt: '',
  });

  const loadNews = async () => {
    setLoading(true);
    const [list, rep] = await Promise.all([getNews(), getReportedComments()]);
    setNews(list);
    setReported(rep);
    setLoading(false);
  };

  useEffect(() => {
    loadNews();
  }, []);

  const flash = (msg: string, isError = false) => {
    if (isError) { setError(msg); setInfo(null); }
    else { setInfo(msg); setError(null); }
    setTimeout(() => { setError(null); setInfo(null); }, 4000);
  };

  const resetForm = () => {
    setTitle(''); setBody(''); setCategory('Actualidad');
    setStatus('published'); setImageUrl(''); setUrgent(false); setPublishedAt('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) { flash('El título y el cuerpo son obligatorios.', true); return; }
    setSubmitting(true);
    try {
      await createNews({
        title: title.trim(), body: body.trim(), category, status,
        imageUrl: imageUrl.trim() || undefined, urgent,
        publishedAt: status === 'scheduled' && publishedAt ? publishedAt : undefined,
      });
      flash('✅ Noticia creada correctamente.');
      resetForm(); setShowForm(false); await loadNews();
    } catch (err: any) {
      flash(err?.response?.data?.message || 'Error al crear la noticia.', true);
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (n: NewsItem) => {
    setEditing(n);
    setEditForm({
      title: n.title, category: n.category, body: n.body,
      status: n.status as 'draft' | 'published' | 'scheduled',
      imageUrl: n.imageUrl ?? '', urgent: n.urgent,
      publishedAt: n.publishedAt ? new Date(n.publishedAt).toISOString().slice(0, 16) : '',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editForm.title.trim() || !editForm.body.trim()) { flash('El título y el cuerpo son obligatorios.', true); return; }
    setSaving(true);
    try {
      await updateNews(editing.id, {
        title: editForm.title.trim(), category: editForm.category.trim(),
        body: editForm.body.trim(), status: editForm.status,
        imageUrl: editForm.imageUrl.trim() || undefined, urgent: editForm.urgent,
        publishedAt: editForm.status === 'scheduled' && editForm.publishedAt ? editForm.publishedAt : undefined,
      });
      flash('✅ Noticia actualizada.');
      setEditing(null); await loadNews();
    } catch (err: any) {
      flash(err?.response?.data?.message || 'Error al guardar.', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, titleToDelete: string) => {
    if (!confirm(`¿Eliminar "${titleToDelete}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteNews(id);
      flash('Noticia eliminada.');
      await loadNews();
    } catch (err: any) {
      flash(err?.response?.data?.message || 'Error al eliminar.', true);
    }
  };

  const handleDeleteReported = async (newsId: string, commentId: string) => {
    if (!confirm('¿Eliminar este comentario reportado?')) return;
    try {
      await deleteComment(newsId, commentId);
      setReported((prev) => prev.filter((r) => r.id !== commentId));
      flash('Comentario eliminado.');
    } catch (err: any) {
      flash(err?.response?.data?.message || 'Error al eliminar el comentario.', true);
    }
  };

  const handleTriggerAi = async () => {
    if (!confirm('¿Generar una noticia nueva con IA? Esto consume tu cuota de Gemini.')) return;
    setAiBusy(true);
    try {
      await triggerAiNews();
      flash('🤖 Robot de prensa ejecutado. Refrescando lista…');
      await loadNews();
    } catch (err: any) {
      flash(err?.response?.data?.message || 'Error al disparar el redactor IA.', true);
    } finally {
      setAiBusy(false);
    }
  };

  function statusBadge(s: string) {
    const map: Record<string, string> = {
      published: 'bg-green-950/40 text-green-400 border-green-900/40',
      draft: 'bg-yellow-950/40 text-yellow-400 border-yellow-900/40',
      scheduled: 'bg-blue-950/40 text-blue-400 border-blue-900/40',
    };
    const label: Record<string, string> = { published: 'Publicada', draft: 'Borrador', scheduled: 'Programada' };
    return (
      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${map[s] ?? map.draft}`}>
        {label[s] ?? s}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1">Gestión de noticias</h1>
          <p className="text-sm text-neutral-400">
            {loading ? 'Cargando…' : `${news.length} ${news.length === 1 ? 'nota' : 'notas'} totales`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleTriggerAi} disabled={aiBusy}
            className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-riverRed disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl text-sm font-semibold transition-all">
            {aiBusy ? '⏳ Generando…' : '🤖 Generar con IA'}
          </button>
          <button onClick={() => setShowForm((s) => !s)}
            className="bg-riverRed hover:bg-red-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-900/30 flex items-center gap-1.5">
            {showForm ? <><X className="w-4 h-4" /> Cancelar</> : <><Plus className="w-4 h-4" /> Nueva noticia</>}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-800 pb-0">
        {(['noticias', 'reportados'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all border-b-2 -mb-px ${
              tab === t ? 'border-riverRed text-white' : 'border-transparent text-neutral-500 hover:text-white'
            }`}>
            {t === 'noticias' ? 'Noticias' : (
              <span className="flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5" /> Reportados
                {reported.length > 0 && (
                  <span className="bg-riverRed text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{reported.length}</span>
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Flash */}
      {(error || info) && (
        <div className={`p-3 rounded-xl text-sm border ${error ? 'bg-red-950/30 border-red-900/50 text-red-200' : 'bg-green-950/30 border-green-900/50 text-green-200'}`}>
          {error || info}
        </div>
      )}

      {tab === 'noticias' && (
        <>
          {/* Form crear */}
          {showForm && (
            <form onSubmit={handleCreate} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
              <h2 className="font-bold text-sm uppercase tracking-wider text-riverRed">Nueva noticia manual</h2>
              <div>
                <label className={labelClass}>Título</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: River goleó a San Lorenzo…" className={inputClass} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Categoría</label>
                  <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Actualidad" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Estado</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={inputClass}>
                    <option value="published">Publicada</option>
                    <option value="draft">Borrador</option>
                    <option value="scheduled">Programada</option>
                  </select>
                </div>
              </div>
              {status === 'scheduled' && (
                <div>
                  <label className={labelClass}>Fecha y hora de publicación</label>
                  <input type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} className={inputClass} required />
                </div>
              )}
              <div>
                <label className={labelClass}>Cuerpo</label>
                <RichTextEditor value={body} onChange={setBody} placeholder="Escribí el contenido de la nota…" />
              </div>
              <div>
                <label className={labelClass}>Imagen de portada (URL)</label>
                <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://ejemplo.com/imagen.jpg" className={inputClass} />
                {imageUrl && <img src={imageUrl} alt="preview" className="mt-2 rounded-xl h-32 object-cover w-full" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)}
                  className="w-4 h-4 accent-riverRed rounded" />
                <span className="text-sm font-semibold">🚨 Marcar como urgente (muestra banner rojo)</span>
              </label>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
                  className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting}
                  className="bg-riverRed hover:bg-red-700 disabled:bg-neutral-800 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-900/30">
                  {submitting ? 'Guardando…' : 'Crear noticia'}
                </button>
              </div>
            </form>
          )}

          {/* Lista */}
          {loading ? (
            <div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-riverRed mx-auto"></div></div>
          ) : news.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center text-sm text-neutral-500">
              Todavía no hay noticias. Creá la primera con el botón de arriba.
            </div>
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="hidden md:flex items-center gap-4 p-4 border-b border-neutral-800 text-[11px] font-bold uppercase tracking-widest text-neutral-500">
                <div className="flex-1">Título</div>
                <div className="w-28">Categoría</div>
                <div className="w-28">Estado</div>
                <div className="w-32">Fecha</div>
                <div className="w-40 text-right">Acciones</div>
              </div>

              {news.map((n) => (
                <div key={n.id} className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 border-b border-neutral-800 last:border-0 hover:bg-neutral-800/30 transition-colors">
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    {n.imageUrl && (
                      <img src={n.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-neutral-700 flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {n.urgent && <span className="text-[9px] font-black text-white bg-riverRed px-1.5 py-0.5 rounded-full flex-shrink-0">🚨</span>}
                        <div className="text-sm font-semibold truncate">{n.title}</div>
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">{n.author?.display_name ?? 'Anónimo'}</div>
                    </div>
                  </div>

                  <div className="md:w-28 flex-shrink-0">
                    <span className="text-[10px] font-bold text-riverRed uppercase tracking-widest bg-red-950/30 border border-red-900/40 px-2 py-1 rounded-full">{n.category}</span>
                  </div>

                  <div className="md:w-28 flex-shrink-0">{statusBadge(n.status)}</div>

                  <div className="md:w-32 text-[11px] text-neutral-500 flex-shrink-0">
                    {n.status === 'scheduled' && n.publishedAt
                      ? `📅 ${new Date(n.publishedAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                      : timeAgo(n.publishedAt ?? n.createdAt)
                    }
                  </div>

                  <div className="md:w-40 flex md:justify-end gap-2 flex-shrink-0">
                    <Link to={`/noticias/${n.id}`} className="text-xs bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 px-3 py-1.5 rounded-lg transition-all">Ver</Link>
                    <button onClick={() => openEdit(n)} className="text-xs bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 px-3 py-1.5 rounded-lg transition-all">Editar</button>
                    <button onClick={() => handleDelete(n.id, n.title)} className="text-xs bg-neutral-950 hover:bg-red-950/40 border border-neutral-800 hover:border-riverRed text-neutral-300 hover:text-riverRed px-3 py-1.5 rounded-lg transition-all">Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'reportados' && (
        <div className="space-y-3">
          {reported.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center text-sm text-neutral-500">
              No hay comentarios reportados. ✅
            </div>
          ) : reported.map((r) => (
            <div key={r.id} className="bg-neutral-900 border border-red-900/40 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold">{r.user.display_name}</span>
                    <span className="text-[11px] text-neutral-500">en</span>
                    <Link to={`/noticias/${r.news.id}`} className="text-[11px] text-riverRed hover:underline truncate max-w-[200px]">{r.news.title}</Link>
                    <span className="text-[10px] text-neutral-600">· {timeAgo(r.reportedAt)}</span>
                  </div>
                  <p className="text-sm text-neutral-300">{r.body}</p>
                </div>
                <button onClick={() => handleDeleteReported(r.newsId, r.id)}
                  className="flex-shrink-0 text-xs bg-red-950/40 hover:bg-red-950/70 border border-red-900/40 text-red-300 px-3 py-1.5 rounded-lg transition-all">
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
          <form onSubmit={handleSave} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-2xl space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-lg">Editar noticia</h2>
              <button type="button" onClick={() => setEditing(null)} className="text-neutral-500 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div>
              <label className={labelClass}>Título</label>
              <input className={inputClass} value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Categoría</label>
                <input className={inputClass} value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Estado</label>
                <select className={inputClass} value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as typeof editForm.status })}>
                  <option value="published">Publicada</option>
                  <option value="draft">Borrador</option>
                  <option value="scheduled">Programada</option>
                </select>
              </div>
            </div>

            {editForm.status === 'scheduled' && (
              <div>
                <label className={labelClass}>Fecha y hora de publicación</label>
                <input type="datetime-local" className={inputClass} value={editForm.publishedAt} onChange={(e) => setEditForm({ ...editForm, publishedAt: e.target.value })} />
              </div>
            )}

            <div>
              <label className={labelClass}>Imagen de portada (URL)</label>
              <input type="url" className={inputClass} value={editForm.imageUrl} onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })} placeholder="https://ejemplo.com/imagen.jpg" />
              {editForm.imageUrl && <img src={editForm.imageUrl} alt="preview" className="mt-2 rounded-xl h-32 object-cover w-full" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
            </div>

            <div>
              <label className={labelClass}>Cuerpo</label>
              <RichTextEditor value={editForm.body} onChange={(html) => setEditForm({ ...editForm, body: html })} minHeight="320px" />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={editForm.urgent} onChange={(e) => setEditForm({ ...editForm, urgent: e.target.checked })}
                className="w-4 h-4 accent-riverRed rounded" />
              <span className="text-sm font-semibold">🚨 Marcar como urgente (envía push notifications)</span>
            </label>

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setEditing(null)} className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">Cancelar</button>
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
