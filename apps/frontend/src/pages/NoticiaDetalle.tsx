// apps/frontend/src/pages/NoticiaDetalle.tsx
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getNewsById, type NewsItem } from '../services/news.service';
import { timeAgo } from '../utils/time';

export default function NoticiaDetalle() {
  const { id } = useParams<{ id: string }>();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getNewsById(id)
      .then(setNews)
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = async () => {
    if (!news) return;
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: news.title, text: news.title, url: shareUrl });
        return;
      } catch {
        /* el usuario canceló, fallback a copy */
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      /* navegador sin clipboard, no hacemos nada */
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 mt-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-riverRed mx-auto mb-4"></div>
        <p className="text-neutral-400">Cargando noticia…</p>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="max-w-3xl mx-auto px-4 mt-12 text-center">
        <div className="text-6xl mb-4">📭</div>
        <h2 className="text-xl font-bold mb-2">Noticia no encontrada</h2>
        <p className="text-neutral-400 mb-6">No pudimos encontrar esa nota.</p>
        <Link to="/noticias" className="text-riverRed font-semibold hover:underline">
          ← Volver a noticias
        </Link>
      </div>
    );
  }

  const dateLabel = timeAgo(news.publishedAt ?? news.createdAt);
  const fullDate = new Date(news.publishedAt ?? news.createdAt).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Dividimos el body en párrafos por saltos de línea dobles, o por puntos largos como fallback
  const paragraphs = news.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const bodyParagraphs = paragraphs.length > 1 ? paragraphs : [news.body.trim()];

  return (
    <div className="max-w-3xl mx-auto px-4 mt-6 pb-12">
      {/* Breadcrumb */}
      <div className="text-sm text-neutral-500 mb-6">
        <Link to="/noticias" className="hover:text-white">Noticias</Link>
        <span className="mx-2">/</span>
        <span className="text-white truncate">{news.title.slice(0, 60)}{news.title.length > 60 ? '…' : ''}</span>
      </div>

      <article className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Imagen de portada (placeholder, no tenemos imágenes reales todavía) */}
        <div className="aspect-[16/9] bg-gradient-to-br from-red-950/30 via-neutral-900 to-neutral-950 flex items-center justify-center border-b border-neutral-800">
          <span className="text-8xl opacity-30">📰</span>
        </div>

        <div className="p-6 md:p-10">
          {/* Meta */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-[10px] font-bold text-riverRed uppercase tracking-widest bg-red-950/30 border border-red-900/40 px-3 py-1 rounded-full">
              {news.category}
            </span>
            <span className="text-xs text-neutral-500">·</span>
            <span className="text-xs text-neutral-500" title={fullDate}>{dateLabel}</span>
          </div>

          {/* Título */}
          <h1 className="text-2xl md:text-4xl font-black leading-tight mb-4">{news.title}</h1>

          {/* Autor */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-neutral-800">
            <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-sm font-bold text-neutral-400">
              {news.author?.display_name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">
                {news.author?.display_name ?? 'Redacción River App'}
              </div>
              <div className="text-[11px] text-neutral-500">{fullDate}</div>
            </div>
            <button
              onClick={handleShare}
              className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-riverRed text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-2"
            >
              {shared ? '✓ Copiado' : '🔗 Compartir'}
            </button>
          </div>

          {/* Cuerpo */}
          <div className="space-y-4 text-[15px] leading-relaxed text-neutral-200">
            {bodyParagraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>

          {/* Link a la fuente original */}
          {news.url && (
            <div className="mt-8 pt-6 border-t border-neutral-800">
              <a
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-neutral-950 hover:bg-riverRed border border-neutral-800 hover:border-riverRed text-sm font-semibold px-5 py-3 rounded-xl transition-all"
              >
                Leer la nota original ↗
              </a>
              <p className="text-[11px] text-neutral-500 mt-2">
                Esta nota fue importada desde Diario Olé.
              </p>
            </div>
          )}
        </div>
      </article>

      {/* Volver */}
      <div className="text-center mt-6">
        <Link to="/noticias" className="text-neutral-400 hover:text-white text-sm">
          ← Volver a todas las noticias
        </Link>
      </div>
    </div>
  );
}
