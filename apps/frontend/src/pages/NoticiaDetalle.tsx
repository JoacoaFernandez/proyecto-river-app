// apps/frontend/src/pages/NoticiaDetalle.tsx
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Heart, Share2, FileText, Inbox, ExternalLink } from 'lucide-react';
import {
  addComment,
  deleteComment,
  getComments,
  getLikes,
  getNewsById,
  getRelatedNews,
  reportComment,
  toggleCommentLike,
  toggleLike,
} from '../services/news.service';
import type { NewsComment, NewsItem } from '../services/news.service';
import { getCurrentUser } from '../services/me.service';
import type { CurrentUser } from '../services/me.service';
import { timeAgo } from '../utils/time';

export default function NoticiaDetalle() {
  const { id } = useParams<{ id: string }>();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [shared, setShared] = useState(false);

  const [me, setMe] = useState<CurrentUser | null>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const [comments, setComments] = useState<NewsComment[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [commentLikes, setCommentLikes] = useState<Record<string, { liked: boolean; count: number }>>({});

  const [related, setRelated] = useState<NewsItem[]>([]);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getCurrentUser().then(setMe);
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getNewsById(id), getLikes(id), getComments(id), getRelatedNews(id)]).then(
      ([newsData, likesData, commentsData, relatedData]) => {
        setNews(newsData);
        setLikeCount(likesData.count);
        setLiked(likesData.liked);
        setComments(commentsData);
        setRelated(relatedData);

        const initialLikes: Record<string, { liked: boolean; count: number }> = {};
        commentsData.forEach((c) => {
          initialLikes[c.id] = { liked: false, count: c._count?.likes ?? 0 };
          c.replies?.forEach((r) => {
            initialLikes[r.id] = { liked: false, count: r._count?.likes ?? 0 };
          });
        });
        setCommentLikes(initialLikes);
        setLoading(false);
      },
    );
  }, [id]);

  const handleShare = async () => {
    if (!news) return;
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: news.title, text: news.title, url: shareUrl });
        return;
      } catch { /* cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch { /* no clipboard */ }
  };

  const handleLike = async () => {
    if (!me || !id) return;
    setLikeLoading(true);
    try {
      const res = await toggleLike(id);
      setLiked(res.liked);
      setLikeCount(res.count);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentBody.trim()) return;
    setSubmittingComment(true);
    try {
      const newComment = await addComment(id, commentBody.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentLikes((prev) => ({ ...prev, [newComment.id]: { liked: false, count: 0 } }));
      setCommentBody('');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAddReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!id || !replyBody.trim()) return;
    setSubmittingReply(true);
    try {
      const reply = await addComment(id, replyBody.trim(), parentId);
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId ? { ...c, replies: [...(c.replies ?? []), reply] } : c,
        ),
      );
      setCommentLikes((prev) => ({ ...prev, [reply.id]: { liked: false, count: 0 } }));
      setReplyBody('');
      setReplyingTo(null);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteComment = async (commentId: string, parentId?: string) => {
    if (!id || !confirm('¿Eliminar este comentario?')) return;
    await deleteComment(id, commentId);
    if (parentId) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId ? { ...c, replies: c.replies?.filter((r) => r.id !== commentId) } : c,
        ),
      );
    } else {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  const handleReportComment = async (commentId: string) => {
    if (!id || !confirm('¿Reportar este comentario como inapropiado?')) return;
    await reportComment(id, commentId);
    alert('Comentario reportado. El equipo de moderación lo revisará.');
  };

  const handleToggleCommentLike = async (commentId: string) => {
    if (!me || !id) return;
    const res = await toggleCommentLike(id, commentId);
    setCommentLikes((prev) => ({ ...prev, [commentId]: res }));
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
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-4">
          <Inbox className="w-7 h-7 text-neutral-500" />
        </div>
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

  const paragraphs = news.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const bodyParagraphs = paragraphs.length > 1 ? paragraphs : [news.body.trim()];

  function extractYouTubeId(text: string): string | null {
    const m = text.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/,
    );
    return m ? m[1] : null;
  }

  function renderParagraph(p: string, idx: number) {
    const ytId = extractYouTubeId(p);
    if (ytId) {
      return (
        <div key={idx} className="aspect-video rounded-2xl overflow-hidden border border-neutral-800">
          <iframe
            src={`https://www.youtube.com/embed/${ytId}`}
            title="Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      );
    }
    return <p key={idx}>{p}</p>;
  }

  function CommentCard({
    c,
    parentId,
  }: {
    c: NewsComment;
    parentId?: string;
  }) {
    const cl = commentLikes[c.id] ?? { liked: false, count: c._count?.likes ?? 0 };
    const canDelete = me && (me.id === c.userId || me.role === 'admin');
    const canReport = me && me.id !== c.userId;

    return (
      <div className={`bg-neutral-900 border border-neutral-800 rounded-2xl p-4 ${parentId ? '' : ''}`}>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-400 flex-shrink-0">
              {c.user.display_name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-semibold">{c.user.display_name}</span>
            <span className="text-[11px] text-neutral-500">{timeAgo(c.createdAt)}</span>
            {c.reportedAt && me?.role === 'admin' && (
              <span className="text-[10px] bg-red-950/40 text-red-400 border border-red-900/40 px-2 py-0.5 rounded-full">
                Reportado
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleToggleCommentLike(c.id)}
              disabled={!me}
              className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border transition-all ${
                cl.liked
                  ? 'bg-red-950/30 border-riverRed text-riverRed'
                  : 'border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-600 disabled:opacity-40'
              }`}
            >
              <Heart className={`w-3 h-3 ${cl.liked ? 'fill-current' : ''}`} />
              {cl.count > 0 && <span>{cl.count}</span>}
            </button>
            {!parentId && me && (
              <button
                onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                className="text-[11px] text-neutral-500 hover:text-white transition-colors"
              >
                Responder
              </button>
            )}
            {canReport && (
              <button
                onClick={() => handleReportComment(c.id)}
                className="text-[11px] text-neutral-600 hover:text-yellow-500 transition-colors"
              >
                Reportar
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => handleDeleteComment(c.id, parentId)}
                className="text-[11px] text-neutral-600 hover:text-riverRed transition-colors"
              >
                Eliminar
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-neutral-300 leading-relaxed">{c.body}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 mt-6 pb-12">
      {/* Breadcrumb */}
      <div className="text-sm text-neutral-500 mb-6">
        <Link to="/noticias" className="hover:text-white">Noticias</Link>
        <span className="mx-2">/</span>
        <span className="text-white truncate">{news.title.slice(0, 60)}{news.title.length > 60 ? '…' : ''}</span>
      </div>

      <article className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Imagen de portada */}
        {news.imageUrl ? (
          <img
            src={news.imageUrl}
            alt={news.title}
            className="w-full aspect-[16/9] object-cover border-b border-neutral-800"
          />
        ) : (
          <div className="aspect-[16/9] bg-gradient-to-br from-red-950/30 via-neutral-900 to-neutral-950 flex items-center justify-center border-b border-neutral-800">
            <FileText className="w-16 h-16 text-neutral-700" />
          </div>
        )}

        <div className="p-6 md:p-10">
          {/* Meta */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {news.urgent && (
              <span className="text-[10px] font-black text-white uppercase tracking-widest bg-riverRed px-3 py-1 rounded-full animate-pulse">
                🚨 URGENTE
              </span>
            )}
            <span className="text-[10px] font-bold text-riverRed uppercase tracking-widest bg-red-950/30 border border-red-900/40 px-3 py-1 rounded-full">
              {news.category}
            </span>
            <span className="text-xs text-neutral-500">·</span>
            <span className="text-xs text-neutral-500" title={fullDate}>{dateLabel}</span>
          </div>

          {/* Título */}
          <h1 className="text-2xl md:text-4xl font-black leading-tight mb-4">{news.title}</h1>

          {/* Autor + acciones */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-neutral-800 flex-wrap">
            <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-sm font-bold text-neutral-400 flex-shrink-0">
              {news.author?.display_name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">
                {news.author?.display_name ?? 'Redacción River App'}
              </div>
              <div className="text-[11px] text-neutral-500">{fullDate}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                disabled={!me || likeLoading}
                className={`flex items-center gap-1.5 text-xs border px-3 py-2 rounded-xl transition-all ${
                  liked
                    ? 'bg-red-950/40 border-riverRed text-riverRed'
                    : 'bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-neutral-300 disabled:opacity-40'
                }`}
                title={me ? undefined : 'Iniciá sesión para dar like'}
              >
                <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
                {likeCount > 0 && <span>{likeCount}</span>}
              </button>
              <button
                onClick={handleShare}
                className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-riverRed text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-2"
              >
                {shared ? '✓ Copiado' : <><Share2 className="w-3.5 h-3.5" /> Compartir</>}
              </button>
            </div>
          </div>

          {/* Cuerpo */}
          <div className="space-y-4 text-[15px] leading-relaxed text-neutral-200">
            {bodyParagraphs.map((p, idx) => renderParagraph(p, idx))}
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
                Leer la nota original <ExternalLink className="w-4 h-4" />
              </a>
              <p className="text-[11px] text-neutral-500 mt-2">
                Esta nota fue importada desde Diario Olé.
              </p>
            </div>
          )}
        </div>
      </article>

      {/* Artículos relacionados */}
      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="text-base font-bold mb-4 text-neutral-300 uppercase tracking-widest text-[11px]">
            Notas relacionadas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {related.map((r) => (
              <Link
                key={r.id}
                to={`/noticias/${r.id}`}
                className="bg-neutral-900 border border-neutral-800 hover:border-riverRed rounded-2xl overflow-hidden group transition-all flex gap-3 p-3"
              >
                {r.imageUrl ? (
                  <img
                    src={r.imageUrl}
                    alt={r.title}
                    className="w-20 h-20 object-cover rounded-xl flex-shrink-0 border border-neutral-700"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-20 h-20 flex-shrink-0 bg-neutral-800 rounded-xl flex items-center justify-center border border-neutral-700">
                    <FileText className="w-6 h-6 text-neutral-600" />
                  </div>
                )}
                <div className="flex flex-col justify-center min-w-0">
                  <span className="text-[9px] font-bold text-riverRed uppercase tracking-widest mb-1">{r.category}</span>
                  <p className="text-xs font-semibold text-white line-clamp-3 group-hover:text-riverRed transition-colors">
                    {r.title}
                  </p>
                  <span className="text-[10px] text-neutral-500 mt-1">{timeAgo(r.publishedAt ?? r.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Sección comentarios */}
      <section className="mt-6">
        <h2 className="text-lg font-bold mb-4">
          Comentarios{' '}
          {comments.length > 0 && (
            <span className="text-neutral-500 font-normal text-sm">({comments.length})</span>
          )}
        </h2>

        {/* Form nuevo comentario */}
        {me ? (
          <form
            onSubmit={handleAddComment}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mb-4 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-400 flex-shrink-0">
                {me.display_name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold">{me.display_name}</span>
            </div>
            <textarea
              ref={commentInputRef}
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Escribí tu comentario…"
              rows={3}
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none"
              required
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingComment || !commentBody.trim()}
                className="bg-riverRed hover:bg-red-700 disabled:bg-neutral-800 disabled:text-neutral-500 px-5 py-2 rounded-xl text-sm font-semibold transition-all"
              >
                {submittingComment ? 'Enviando…' : 'Comentar'}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mb-4 text-sm text-neutral-400 text-center">
            <Link to="/login" className="text-riverRed font-semibold hover:underline">
              Iniciá sesión
            </Link>{' '}
            para dejar un comentario.
          </div>
        )}

        {/* Lista de comentarios */}
        {comments.length === 0 ? (
          <div className="text-sm text-neutral-500 text-center py-6">
            Sé el primero en comentar.
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id}>
                <CommentCard c={c} />

                {/* Replies */}
                {(c.replies ?? []).length > 0 && (
                  <div className="ml-6 mt-2 space-y-2 border-l-2 border-neutral-800 pl-4">
                    {(c.replies ?? []).map((r) => (
                      <CommentCard key={r.id} c={r} parentId={c.id} />
                    ))}
                  </div>
                )}

                {/* Reply form */}
                {replyingTo === c.id && me && (
                  <form
                    onSubmit={(e) => handleAddReply(e, c.id)}
                    className="ml-6 mt-2 border-l-2 border-riverRed pl-4 space-y-2"
                  >
                    <textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder={`Responder a ${c.user.display_name}…`}
                      rows={2}
                      autoFocus
                      className="w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl px-3 py-2 text-sm outline-none transition-all resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => { setReplyingTo(null); setReplyBody(''); }}
                        className="text-[11px] text-neutral-500 hover:text-white transition-colors px-3 py-1.5"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={submittingReply || !replyBody.trim()}
                        className="bg-riverRed hover:bg-red-700 disabled:bg-neutral-800 disabled:text-neutral-500 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all"
                      >
                        {submittingReply ? 'Enviando…' : 'Responder'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Volver */}
      <div className="text-center mt-8">
        <Link to="/noticias" className="text-neutral-400 hover:text-white text-sm">
          ← Volver a todas las noticias
        </Link>
      </div>
    </div>
  );
}
