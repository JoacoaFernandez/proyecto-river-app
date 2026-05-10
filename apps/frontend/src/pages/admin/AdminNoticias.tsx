// apps/frontend/src/pages/admin/AdminNoticias.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  createNews,
  deleteNews,
  getNews,
  triggerAiNews,
  type NewsItem,
} from '../../services/news.service';
import { timeAgo } from '../../utils/time';

export default function AdminNoticias() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Actualidad');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('published');

  const loadNews = async () => {
    setLoading(true);
    const list = await getNews();
    setNews(list);
    setLoading(false);
  };

  useEffect(() => {
    loadNews();
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

  const resetForm = () => {
    setTitle('');
    setBody('');
    setCategory('Actualidad');
    setStatus('published');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      flash('El título y el cuerpo son obligatorios.', true);
      return;
    }
    setSubmitting(true);
    try {
      await createNews({ title: title.trim(), body: body.trim(), category, status });
      flash('✅ Noticia creada correctamente.');
      resetForm();
      setShowForm(false);
      await loadNews();
    } catch (err: any) {
      flash(err?.response?.data?.message || 'Error al crear la noticia.', true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, titleToDelete: string) => {
    if (!confirm(`¿Eliminar "${titleToDelete}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    try {
      await deleteNews(id);
      flash('🗑️ Noticia eliminada.');
      await loadNews();
    } catch (err: any) {
      flash(err?.response?.data?.message || 'Error al eliminar.', true);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-1">Gestión de noticias</h1>
          <p className="text-sm text-neutral-400">
            {loading ? 'Cargando…' : `${news.length} ${news.length === 1 ? 'nota' : 'notas'} totales`}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleTriggerAi}
            disabled={aiBusy}
            className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-riverRed disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
          >
            {aiBusy ? '⏳ Generando…' : '🤖 Generar con IA'}
          </button>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="bg-riverRed hover:bg-red-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-900/30"
          >
            {showForm ? '✕ Cancelar' : '+ Nueva noticia'}
          </button>
        </div>
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

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: River goleó a San Lorenzo en el Monumental"
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl px-4 py-3 text-sm outline-none transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                Categoría
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Actualidad"
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl px-4 py-3 text-sm outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl px-4 py-3 text-sm outline-none transition-all"
              >
                <option value="published">Publicada</option>
                <option value="draft">Borrador</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
              Cuerpo
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escribí el contenido de la nota…"
              rows={8}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl px-4 py-3 text-sm outline-none transition-all resize-y"
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-riverRed hover:bg-red-700 disabled:bg-neutral-800 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-900/30"
            >
              {submitting ? 'Guardando…' : 'Crear noticia'}
            </button>
          </div>
        </form>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-riverRed mx-auto"></div>
        </div>
      ) : news.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center text-sm text-neutral-500">
          Todavía no hay noticias. Creá la primera con el botón de arriba.
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="hidden md:flex items-center gap-4 p-4 border-b border-neutral-800 text-[11px] font-bold uppercase tracking-widest text-neutral-500">
            <div className="flex-1">Título</div>
            <div className="w-28">Categoría</div>
            <div className="w-24">Estado</div>
            <div className="w-32">Publicada</div>
            <div className="w-32 text-right">Acciones</div>
          </div>

          {news.map((n) => (
            <div
              key={n.id}
              className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 border-b border-neutral-800 last:border-0 hover:bg-neutral-800/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{n.title}</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  {n.author?.display_name ?? 'Anónimo'}
                </div>
              </div>

              <div className="md:w-28">
                <span className="text-[10px] font-bold text-riverRed uppercase tracking-widest bg-red-950/30 border border-red-900/40 px-2 py-1 rounded-full">
                  {n.category}
                </span>
              </div>

              <div className="md:w-24">
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${
                    n.status === 'published'
                      ? 'bg-green-950/40 text-green-400 border-green-900/40'
                      : 'bg-yellow-950/40 text-yellow-400 border-yellow-900/40'
                  }`}
                >
                  {n.status}
                </span>
              </div>

              <div className="md:w-32 text-[11px] text-neutral-500">
                {timeAgo(n.publishedAt ?? n.createdAt)}
              </div>

              <div className="md:w-32 flex md:justify-end gap-2">
                <Link
                  to={`/noticias/${n.id}`}
                  className="text-xs bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 px-3 py-1.5 rounded-lg transition-all"
                >
                  Ver
                </Link>
                <button
                  onClick={() => handleDelete(n.id, n.title)}
                  className="text-xs bg-neutral-950 hover:bg-red-950/40 border border-neutral-800 hover:border-riverRed text-neutral-300 hover:text-riverRed px-3 py-1.5 rounded-lg transition-all"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
