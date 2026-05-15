// apps/frontend/src/components/Layout.tsx
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home, Calendar, Users, Newspaper, BookOpen, Settings, User,
  Download, Bell, BellOff, LogOut, Trophy,
} from 'lucide-react';
import { clearCurrentUser, getCurrentUser } from '../services/me.service';
import type { CurrentUser } from '../services/me.service';
import { useMatchNotifications } from '../hooks/useMatchNotifications';
import { usePushSubscription } from '../hooks/usePushSubscription';
import NotificationBell from './NotificationBell';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

const baseNavItems = [
  { to: '/', label: 'Inicio', Icon: Home, end: true },
  { to: '/partidos', label: 'Partidos', Icon: Calendar, end: false },
  { to: '/plantel', label: 'Plantel', Icon: Users, end: false },
  { to: '/noticias', label: 'Noticias', Icon: Newspaper, end: false },
  { to: '/historia', label: 'Historia', Icon: BookOpen, end: false },
  { to: '/prode', label: 'Prode', Icon: Trophy, end: false },
];

const adminNavItem = { to: '/admin', label: 'Admin', Icon: Settings, end: false };

export default function Layout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { supported: notifSupported, permission, requestPermission } = useMatchNotifications();
  const { supported: pushSupported, subscribed: pushSubscribed, loading: pushLoading, subscribe: subscribePush, unsubscribe: unsubscribePush } = usePushSubscription();
  const { canInstall, install } = useInstallPrompt();

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isAdmin = user?.role === 'admin';
  const navItems = isAdmin ? [...baseNavItems, adminNavItem] : baseNavItems;

  const handleLogout = () => {
    localStorage.removeItem('river_app_token');
    clearCurrentUser();
    navigate('/login', { replace: true });
  };

  const initials = user?.display_name
    .split(' ')
    .filter((w) => w.length > 0)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') ?? '?';

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-20 md:pb-12">
      {/* Navegación Desktop */}
      <nav className="bg-neutral-900/95 backdrop-blur border-b border-neutral-800 px-6 py-3 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-3 group">
              <img
                src="/favicon.svg"
                alt="River App"
                className="w-9 h-9 rounded-full border border-neutral-700 group-hover:border-riverRed transition-colors"
              />
              <span className="font-black text-base tracking-wide hidden sm:block">River App</span>
            </NavLink>

            {/* Links desktop */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-red-950/40 text-riverRed'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                    }`
                  }
                >
                  <item.Icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Acciones derecha */}
          <div className="flex items-center gap-2">
            <NotificationBell />

            {notifSupported && permission !== 'denied' && (
              <button
                onClick={permission === 'granted' ? undefined : requestPermission}
                title={permission === 'granted' ? 'Notificaciones de partido activas' : 'Activar notificaciones de partido'}
                className={`p-2 rounded-xl border transition-all ${
                  permission === 'granted'
                    ? 'border-green-800/50 text-green-500 bg-green-950/20 cursor-default'
                    : 'border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-600'
                }`}
              >
                {permission === 'granted' ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </button>
            )}

            {pushSupported && !pushLoading && (
              <button
                onClick={pushSubscribed ? unsubscribePush : subscribePush}
                title={pushSubscribed ? 'Desactivar notificaciones urgentes' : 'Activar notificaciones urgentes (noticias)'}
                className={`p-2 rounded-xl border transition-all text-[10px] font-bold ${
                  pushSubscribed
                    ? 'border-riverRed/50 text-riverRed bg-red-950/20'
                    : 'border-neutral-800 text-neutral-400 hover:text-riverRed hover:border-riverRed/50'
                }`}
              >
                🚨
              </button>
            )}

            {/* Avatar dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="w-9 h-9 rounded-full bg-riverRed border-2 border-neutral-800 hover:border-riverRed flex items-center justify-center text-xs font-black text-white transition-all overflow-hidden"
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  initials
                )}
              </button>

              {menuOpen && (
                <div className="fixed right-4 top-16 w-52 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-[200]">
                  {user && (
                    <div className="px-4 py-3 border-b border-neutral-800">
                      <div className="text-sm font-semibold truncate">{user.display_name}</div>
                      <div className="text-[11px] text-neutral-500 truncate">{user.email}</div>
                    </div>
                  )}
                  <Link
                    to="/perfil"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 text-sm px-4 py-2.5 hover:bg-neutral-800 transition-colors"
                  >
                    <User className="w-4 h-4 text-neutral-400" />
                    Mi perfil
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 text-left text-sm px-4 py-2.5 hover:bg-red-950/40 text-neutral-300 hover:text-riverRed transition-colors border-t border-neutral-800"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Banner instalación PWA */}
      {canInstall && (
        <div className="bg-riverRed/10 border-b border-riverRed/20 px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Download className="w-4 h-4 text-riverRed flex-shrink-0" />
            <span className="text-neutral-200">Instalá River App en tu dispositivo</span>
          </div>
          <button
            onClick={install}
            className="bg-riverRed hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all shrink-0"
          >
            Instalar
          </button>
        </div>
      )}

      <Outlet />

      {/* Navegación Mobile Bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-neutral-950/95 backdrop-blur border-t border-neutral-800/80 flex justify-around py-2 z-50 pb-safe">
        {[...navItems, { to: '/perfil', label: 'Perfil', Icon: User, end: false }].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className="flex flex-col items-center justify-center p-2 min-w-[52px]"
          >
            {({ isActive }) => (
              <>
                <item.Icon
                  className={`w-5 h-5 mb-1 transition-all ${isActive ? 'text-riverRed' : 'text-neutral-500'}`}
                />
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider ${
                    isActive ? 'text-riverRed' : 'text-neutral-600'
                  }`}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
