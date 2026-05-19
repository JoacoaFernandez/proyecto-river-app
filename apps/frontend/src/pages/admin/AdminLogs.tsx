// apps/frontend/src/pages/admin/AdminLogs.tsx
import { useEffect, useState } from 'react';
import { Activity, RefreshCw, AlertTriangle, FileText, MessageSquare } from 'lucide-react';
import { getMetrics, type MetricsSnapshot } from '../../services/metrics.service';

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function StatCard({
  label,
  value,
  subValue,
  tone = 'default',
}: {
  label: string;
  value: number | string;
  subValue?: string;
  tone?: 'default' | 'green' | 'red' | 'yellow';
}) {
  const toneCls =
    tone === 'green'
      ? 'border-green-800/50 bg-green-950/20'
      : tone === 'red'
      ? 'border-red-800/50 bg-red-950/20'
      : tone === 'yellow'
      ? 'border-yellow-800/50 bg-yellow-950/20'
      : 'border-neutral-800 bg-neutral-900';
  return (
    <div className={`border rounded-2xl p-4 ${toneCls}`}>
      <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1">{label}</div>
      <div className="text-2xl font-black tabular-nums">{value}</div>
      {subValue && <div className="text-[11px] text-neutral-500 mt-1">{subValue}</div>}
    </div>
  );
}

export default function AdminLogs() {
  const [data, setData] = useState<MetricsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const res = await getMetrics();
    if (res) setData(res);
    else setError('No se pudo obtener metricas.');
    setLoading(false);
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-wide uppercase flex items-center gap-2">
            <Activity className="w-6 h-6 text-riverRed" />
            Sistema y Metricas
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Snapshot en vivo de la base de datos y el proceso del backend. Refresca cada 30s.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="bg-riverRed hover:bg-red-700 disabled:bg-neutral-800 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refrescar
        </button>
      </div>

      {error && (
        <div className="bg-red-950/30 border border-red-800/50 text-red-300 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {data && (
        <>
          {/* Process */}
          <section>
            <h2 className="text-xs uppercase tracking-widest text-neutral-500 font-bold mb-3">Proceso backend</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Uptime" value={formatUptime(data.process.uptimeSeconds)} />
              <StatCard label="Memoria RSS" value={`${data.process.memoryMb} MB`} />
              <StatCard label="Node" value={data.process.nodeVersion} />
              <StatCard
                label="Ultimo snapshot"
                value={new Date(data.timestamp).toLocaleTimeString('es-AR')}
              />
            </div>
          </section>

          {/* DB Counts */}
          <section>
            <h2 className="text-xs uppercase tracking-widest text-neutral-500 font-bold mb-3">Usuarios y comunidad</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Usuarios" value={data.counts.users} subValue={`${data.counts.newUsers24h} nuevos (24h)`} />
              <StatCard
                label="Baneados"
                value={data.counts.bannedUsers}
                tone={data.counts.bannedUsers > 0 ? 'red' : 'default'}
              />
              <StatCard label="Predicciones" value={data.counts.predictions} subValue={`${data.counts.wonPredictions} acertadas`} />
              <StatCard label="Favoritos" value={data.counts.favorites} />
            </div>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-widest text-neutral-500 font-bold mb-3">Contenido</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Partidos" value={data.counts.matches} />
              <StatCard label="Noticias" value={data.counts.news} subValue={`${data.counts.draftNews} borradores`} />
              <StatCard label="Ratings cargados" value={data.counts.ratings} />
              <StatCard label="Encuestas activas" value={data.counts.activeSurveys} />
            </div>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-widest text-neutral-500 font-bold mb-3">Moderacion y actividad</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Comentarios" value={data.counts.comments} subValue={`${data.counts.hiddenComments} ocultos`} />
              <StatCard
                label="Reportados pendientes"
                value={data.counts.reportedComments}
                tone={data.counts.reportedComments > 0 ? 'yellow' : 'green'}
              />
              <StatCard label="Mensajes chat (24h)" value={data.counts.liveChatMsgs24h} />
              <StatCard label="Snapshot" value={new Date(data.timestamp).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })} />
            </div>
          </section>

          {/* Recent news */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
              <h3 className="font-bold flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-riverRed" />
                Noticias recientes (7d)
              </h3>
              {data.recentNews.length === 0 ? (
                <p className="text-xs text-neutral-500">Sin noticias en los ultimos 7 dias.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.recentNews.map((n) => (
                    <li key={n.id} className="flex items-center gap-2 border-b border-neutral-800/50 pb-2 last:border-0 last:pb-0">
                      {n.urgent && <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />}
                      <span className="flex-1 truncate text-neutral-200">{n.title}</span>
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold border ${
                        n.status === 'published' ? 'border-green-700/50 text-green-400 bg-green-950/30' :
                        n.status === 'draft' ? 'border-neutral-700 text-neutral-400 bg-neutral-800' :
                        'border-neutral-700 text-neutral-400 bg-neutral-800'
                      }`}>
                        {n.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
              <h3 className="font-bold flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-yellow-400" />
                Comentarios reportados pendientes
              </h3>
              {data.recentReportedComments.length === 0 ? (
                <p className="text-xs text-neutral-500">Nada para moderar.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {data.recentReportedComments.map((c) => (
                    <li key={c.id} className="border-b border-neutral-800/50 pb-2 last:border-0 last:pb-0">
                      <div className="text-[10px] text-neutral-500">
                        {c.user?.display_name ?? 'Anon'} ·{' '}
                        {c.reportedAt ? new Date(c.reportedAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </div>
                      <div className="text-neutral-300 line-clamp-2">{c.body}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
