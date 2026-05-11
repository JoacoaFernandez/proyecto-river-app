import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  countUnread,
  getNotifications,
  markAllRead,
} from '../services/notifications.service';
import type { AppNotification } from '../services/notifications.service';
import { timeAgo } from '../utils/time';

const TYPE_ICON: Record<AppNotification['type'], string> = {
  match_live: '🔴',
  match_result: '⚽',
  match_upcoming: '📅',
  news: '📰',
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    const data = await getNotifications();
    setNotifications(data);
    setUnread(countUnread(data));
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen((o) => !o);
    if (!open) {
      markAllRead();
      setUnread(0);
    }
  };

  const handleClick = (n: AppNotification) => {
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl border border-neutral-800 hover:border-neutral-600 text-neutral-400 hover:text-white transition-all"
        title="Notificaciones"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-riverRed rounded-full text-[9px] font-black text-white flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed right-4 top-16 w-80 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl z-[200] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
            <span className="text-sm font-bold">Actividad reciente</span>
            <button
              onClick={() => { markAllRead(); setUnread(0); setOpen(false); }}
              className="text-[11px] text-neutral-500 hover:text-riverRed transition-colors"
            >
              Marcar todo como leído
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-riverRed mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-sm text-neutral-500">Sin actividad reciente.</div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-neutral-800/60 transition-colors border-b border-neutral-800/50 last:border-0"
                >
                  {n.type === 'news' && n.imageUrl ? (
                    <img
                      src={n.imageUrl}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-neutral-700"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICON[n.type]}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white leading-snug line-clamp-2">{n.title}</p>
                    {n.body && (
                      <p className="text-[11px] text-neutral-500 mt-0.5 truncate">{n.body}</p>
                    )}
                    <p className="text-[10px] text-neutral-600 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {n.type === 'match_live' && (
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
