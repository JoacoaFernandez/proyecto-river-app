// apps/frontend/src/pages/Noticias.tsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, FileText, Star } from 'lucide-react';
import { getNews, type NewsItem } from '../services/news.service';
import { timeAgo } from '../utils/time';

const PAGE_SIZE = 12;

function excerpt(body: string, maxChars = 180) {
  const clean = body.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxChars) return clean;
  return clean.slice(0, maxChars).trimEnd() + '…';
}

export default function Noticias() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    getNews()
      .then(setNews)
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set(news.map((n) => n.category).filter(Boolean));
    return Array.from(set).sort();
  }, [news]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return news.filter((n) => {
      if (category !== 'all' && n.category !== category) return false;
      if (term && !n.title.toLowerCase().includes(term) && !n.body.toLowerCase().includes(term)) {
        return false;
      }
      return true;
    });
  }, [news, search, category]);

  // Reset de página cuando cambian filtros
  useEffect(() => {
    setPage(1);
  }, [search, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice(0, page * PAGE_SIZE);
  const canLoadMore = visible.length < filtered.length;

  const featured = filtered[0] ?? null;
  const rest = featured ? visible.slice(1) : visible;

  return (
    <div className="max-w-6xl mx-auto px-4 mt-6 pb-12">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-4 mb-6">
        <h2 className="text-2xl font-black tracking-wide uppercase">Noticias del Millonario</h2>
        <p className="text-sm text-neutral-400 mt-1">
          {loading
            ? 'Cargando noticias...'
            : `${filtered.length} ${filtered.length === 1 ? 'nota' : 'notas'} disponibles`}
        </p>
      </div>

      {/* Filtros */}
      {!loading && news.length > 0 && (
        <div className="space-y-3 mb-8">
          {categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
              <button
                onClick={() => setCategory('all')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  category === 'all'
                    ? 'bg-riverRed text-white shadow-lg shadow-red-900/30'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-riverRed hover:text-white'
                }`}
              >
                Todas
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    category === c
                      ? 'bg-riverRed text-white shadow-lg shadow-red-900/30'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-riverRed hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título o contenido…"
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
        </div>
      )}

      {/* Estados */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-riverRed mx-auto mb-4"></div>
          <p className="text-neutral-400">Buscando primicias del Más Grande…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-neutral-900 border border-neutral-800 rounded-2xl text-neutral-500 text-sm">
          {search.trim() || category !== 'all'
            ? 'No hay noticias que coincidan con esos criterios.'
            : 'Todavía no hay noticias publicadas.'}
        </div>
      ) : (
        <>
          {/* Destacada */}
          {featured && page === 1 && !search && category === 'all' && (
            <Link
              to={`/noticias/${featured.id}`}
              className="block bg-neutral-900 border border-neutral-800 hover:border-riverRed rounded-2xl overflow-hidden mb-6 group transition-all"
            >
              <div className="md:flex">
                <div className="md:w-1/2 aspect-video md:aspect-auto overflow-hidden">
                  {featured.imageUrl ? (
                    <img src={featured.imageUrl} alt={featured.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-950/40 to-neutral-950 flex items-center justify-center">
                      <FileText className="w-14 h-14 text-neutral-700" />
                    </div>
                  )}
                </div>
                <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-riverRed uppercase tracking-widest bg-red-950/30 border border-red-900/40 px-2 py-1 rounded-full">
                      <Star className="w-2.5 h-2.5" /> Destacada
                    </span>
                    <span className="text-[10px] text-neutral-500">{featured.category}</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black mb-3 group-hover:text-riverRed transition-colors">
                    {featured.title}
                  </h3>
                  <p className="text-sm text-neutral-400 mb-4">{excerpt(featured.body, 220)}</p>
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>{featured.author?.display_name ?? 'Redacción River App'}</span>
                    <span>{timeAgo(featured.publishedAt ?? featured.createdAt)}</span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Grid del resto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.map((n) => (
              <Link
                key={n.id}
                to={`/noticias/${n.id}`}
                className="bg-neutral-900 border border-neutral-800 hover:border-riverRed rounded-2xl overflow-hidden group transition-all flex flex-col"
              >
                <div className="aspect-video overflow-hidden border-b border-neutral-800">
                  {n.imageUrl ? (
                    <img src={n.imageUrl} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-950 flex items-center justify-center">
                      <FileText className="w-10 h-10 text-neutral-700 group-hover:text-neutral-600 transition-colors" />
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-riverRed uppercase tracking-widest bg-red-950/30 border border-red-900/40 px-2 py-0.5 rounded-full">
                      {n.category}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      {timeAgo(n.publishedAt ?? n.createdAt)}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2 line-clamp-3 group-hover:text-riverRed transition-colors">
                    {n.title}
                  </h3>
                  <p className="text-xs text-neutral-400 line-clamp-3 mb-3 flex-1">
                    {excerpt(n.body, 140)}
                  </p>
                  <span className="text-[11px] text-neutral-600 mt-auto">
                    {n.author?.display_name ?? 'Redacción River App'}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Paginado */}
          {canLoadMore && (
            <div className="text-center mt-8">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-riverRed px-6 py-3 rounded-xl text-sm font-semibold transition-all"
              >
                Cargar más noticias ({filtered.length - visible.length} restantes)
              </button>
            </div>
          )}

          {!canLoadMore && filtered.length > PAGE_SIZE && (
            <div className="text-center mt-8 text-xs text-neutral-500">
              Mostrando todas las noticias disponibles ({filtered.length} de {filtered.length})
              {totalPages > 1 && ` · ${totalPages} páginas cargadas`}
            </div>
          )}
        </>
      )}
    </div>
  );
}
