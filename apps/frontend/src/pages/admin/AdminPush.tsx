// apps/frontend/src/pages/admin/AdminPush.tsx
import { useEffect, useState } from 'react';
import { Bell, Send, Users } from 'lucide-react';
import {
  broadcastPush,
  getSegmentCount,
  type PushSegment,
  type BroadcastResult,
} from '../../services/push-admin.service';

const SEGMENTS: Array<{ id: PushSegment; label: string; description: string }> = [
  { id: 'all', label: 'Todos', description: 'Cualquier dispositivo suscripto (incluye anónimos).' },
  { id: 'authenticated', label: 'Logueados', description: 'Solo dispositivos asociados a un usuario con sesión.' },
  { id: 'active7d', label: 'Activos (7d)', description: 'Usuarios que comentaron, votaron, predijeron o dieron like en los últimos 7 días.' },
  { id: 'notifGoals', label: 'Quieren goles', description: 'Usuarios con notif. de goles activada en su perfil.' },
  { id: 'notifMatch', label: 'Quieren partidos', description: 'Usuarios con notif. de partidos activada.' },
  { id: 'notifNews', label: 'Quieren noticias', description: 'Usuarios con notif. de noticias activada.' },
];

const inputClass =
  'w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl px-4 py-2.5 text-sm outline-none transition-all';
const labelClass =
  'block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5';

export default function AdminPush() {
  const [segment, setSegment] = useState<PushSegment>('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [count, setCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCount(null);
    getSegmentCount(segment).then(setCount);
  }, [segment]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!title.trim() || !body.trim()) {
      setError('Título y mensaje son obligatorios.');
      return;
    }
    if (!confirm(`¿Enviar este push a ${count ?? '?'} destinatario(s)?`)) return;
    setSending(true);
    try {
      const res = await broadcastPush({
        title: title.trim(),
        body: body.trim(),
        link: link.trim() || undefined,
        segment,
      });
      setResult(res);
      if (res.total === 0) {
        setError('No hay suscripciones en el segmento seleccionado.');
      } else {
        setTitle('');
        setBody('');
        setLink('');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al enviar el push.');
    } finally {
      setSending(false);
    }
  };

  const seg = SEGMENTS.find((s) => s.id === segment)!;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-wide uppercase flex items-center gap-2">
          <Bell className="w-6 h-6 text-riverRed" /> Notificaciones push
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Envía mensajes push segmentados a los suscriptos. Requiere VAPID configurado en el backend.
        </p>
      </div>

      <form onSubmit={handleSend} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
        {/* Segmento */}
        <div>
          <label className={labelClass}>Segmento</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {SEGMENTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSegment(s.id)}
                className={`text-left p-3 rounded-xl border text-xs transition-all ${
                  segment === s.id
                    ? 'border-riverRed bg-red-950/30 text-white'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="font-bold mb-0.5">{s.label}</div>
                <div className="text-[10px] text-neutral-500 leading-snug">{s.description}</div>
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-neutral-400 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2">
            <Users className="w-3.5 h-3.5 text-riverRed" />
            <span>
              Destinatarios estimados ({seg.label}):{' '}
              <span className="text-white font-bold tabular-nums">{count === null ? '…' : count}</span>
            </span>
          </div>
        </div>

        {/* Título */}
        <div>
          <label className={labelClass}>Título *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            className={inputClass}
            placeholder="Ej: ¡Gol de River!"
            required
          />
          <div className="text-[10px] text-neutral-600 mt-1 text-right">{title.length}/80</div>
        </div>

        {/* Mensaje */}
        <div>
          <label className={labelClass}>Mensaje *</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={200}
            rows={3}
            className={inputClass + ' resize-none'}
            placeholder="Ej: Min. 23 — Borja pone el 1-0 en el Monumental"
            required
          />
          <div className="text-[10px] text-neutral-600 mt-1 text-right">{body.length}/200</div>
        </div>

        {/* Link */}
        <div>
          <label className={labelClass}>Link (opcional)</label>
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className={inputClass}
            placeholder="/partidos/abc-123 o https://..."
          />
        </div>

        {error && (
          <div className="bg-red-950/30 border border-red-800/50 text-red-300 rounded-xl px-4 py-2.5 text-sm">
            {error}
          </div>
        )}

        {result && result.total > 0 && (
          <div className="bg-green-950/30 border border-green-800/50 text-green-300 rounded-xl px-4 py-2.5 text-sm">
            Enviadas: <strong>{result.sent}</strong> · Fallidas: {result.failed} · Total: {result.total}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={sending || count === 0}
            className="bg-riverRed hover:bg-red-700 disabled:bg-neutral-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-red-900/30"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Enviando…' : `Enviar a ${count ?? '?'} destinatario(s)`}
          </button>
        </div>
      </form>
    </div>
  );
}
