// apps/frontend/src/pages/admin/AdminDashboard.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, PenLine, Users, Calendar, Globe, FileText, UserPlus } from 'lucide-react';
import { getNews } from '../../services/news.service';
import { getPlayers } from '../../services/players.service';
import { getLiveDashboard } from '../../services/live.service';
import { api } from '../../services/api';
import { timeAgo } from '../../utils/time';

interface Metrics {
  noticias: number;
  publicadas: number;
  borradores: number;
  jugadores: number;
  proximosPartidos: number;
  usuariosTotal: number;
  usuariosNuevos: number;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [latestNews, setLatestNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getNews(),
      getPlayers(),
      getLiveDashboard(),
      api.get('/auth/admin/stats').then((r) => r.data).catch(() => ({ total: 0, newThisWeek: 0 })),
    ])
      .then(([news, players, dashboard, userStats]) => {
        setLatestNews(news.slice(0, 5));
        setMetrics({
          noticias: news.length,
          publicadas: news.filter((n) => n.status === 'published').length,
          borradores: news.filter((n) => n.status === 'draft').length,
          jugadores: players.length,
          proximosPartidos: dashboard?.upcomingMatches?.length ?? 0,
          usuariosTotal: userStats.total,
          usuariosNuevos: userStats.newThisWeek,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-riverRed mx-auto mb-4"></div>
        <p className="text-neutral-400">Cargando métricas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black mb-1">Dashboard</h1>
        <p className="text-sm text-neutral-400">Vista general del contenido publicado en River App.</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Noticias', value: metrics?.noticias ?? 0, sub: `${metrics?.publicadas ?? 0} publicadas`, Icon: Newspaper, color: 'text-blue-400' },
          { label: 'Borradores', value: metrics?.borradores ?? 0, sub: 'Sin publicar', Icon: PenLine, color: 'text-yellow-400' },
          { label: 'Plantel', value: metrics?.jugadores ?? 0, sub: 'Jugadores', Icon: Users, color: 'text-green-400' },
          { label: 'Partidos', value: metrics?.proximosPartidos ?? 0, sub: 'Próximos', Icon: Calendar, color: 'text-riverRed' },
          { label: 'Usuarios', value: metrics?.usuariosTotal ?? 0, sub: 'Registrados', Icon: Users, color: 'text-purple-400' },
          { label: 'Nuevos', value: metrics?.usuariosNuevos ?? 0, sub: 'Esta semana', Icon: UserPlus, color: 'text-emerald-400' },
        ].map((m) => (
          <div key={m.label} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition-all">
            <div className="flex justify-between items-start mb-3">
              <m.Icon className={`w-5 h-5 ${m.color}`} />
            </div>
            <div className="text-3xl font-black">{m.value}</div>
            <div className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mt-1">{m.label}</div>
            <div className="text-[11px] text-neutral-500 mt-1">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Acciones rápidas */}
      <section>
        <h2 className="text-lg font-bold mb-4">Acciones rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/partidos"
            className="bg-neutral-900 border border-neutral-800 hover:border-riverRed rounded-2xl p-5 transition-all group"
          >
            <Calendar className="w-6 h-6 mb-3 text-neutral-400 group-hover:text-riverRed transition-colors" />
            <div className="font-bold mb-1 group-hover:text-riverRed transition-colors">Gestionar partidos</div>
            <div className="text-xs text-neutral-500">Crear, editar estado y resultado de partidos.</div>
          </Link>

          <Link
            to="/admin/noticias"
            className="bg-neutral-900 border border-neutral-800 hover:border-riverRed rounded-2xl p-5 transition-all group"
          >
            <Newspaper className="w-6 h-6 mb-3 text-neutral-400 group-hover:text-riverRed transition-colors" />
            <div className="font-bold mb-1 group-hover:text-riverRed transition-colors">Gestionar noticias</div>
            <div className="text-xs text-neutral-500">Crear, editar y eliminar artículos publicados.</div>
          </Link>

          <Link
            to="/admin/plantel"
            className="bg-neutral-900 border border-neutral-800 hover:border-riverRed rounded-2xl p-5 transition-all group"
          >
            <Users className="w-6 h-6 mb-3 text-neutral-400 group-hover:text-riverRed transition-colors" />
            <div className="font-bold mb-1 group-hover:text-riverRed transition-colors">Ver plantel</div>
            <div className="text-xs text-neutral-500">Revisar y administrar jugadores del primer equipo.</div>
          </Link>

          <Link
            to="/"
            className="bg-neutral-900 border border-neutral-800 hover:border-riverRed rounded-2xl p-5 transition-all group"
          >
            <Globe className="w-6 h-6 mb-3 text-neutral-400 group-hover:text-riverRed transition-colors" />
            <div className="font-bold mb-1 group-hover:text-riverRed transition-colors">Ver app pública</div>
            <div className="text-xs text-neutral-500">Volver a la vista que ven los hinchas.</div>
          </Link>
        </div>
      </section>

      {/* Últimas noticias */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Últimas noticias publicadas</h2>
          <Link to="/admin/noticias" className="text-xs text-riverRed font-semibold hover:underline">
            Ver todas →
          </Link>
        </div>

        {latestNews.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center text-sm text-neutral-500">
            Todavía no hay noticias.
          </div>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            {latestNews.map((n, i) => (
              <Link
                key={n.id}
                to={`/noticias/${n.id}`}
                className={`flex items-center gap-4 p-4 hover:bg-neutral-800/50 transition-colors ${
                  i !== latestNews.length - 1 ? 'border-b border-neutral-800' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-neutral-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{n.title}</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">
                    {n.author?.display_name ?? 'Anónimo'} · {timeAgo(n.publishedAt ?? n.createdAt)}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${
                    n.status === 'published'
                      ? 'bg-green-950/40 text-green-400 border-green-900/40'
                      : 'bg-yellow-950/40 text-yellow-400 border-yellow-900/40'
                  }`}
                >
                  {n.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
