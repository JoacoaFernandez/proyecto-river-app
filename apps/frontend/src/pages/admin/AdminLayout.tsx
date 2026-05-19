// apps/frontend/src/pages/admin/AdminLayout.tsx
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, Newspaper, Users, LogOut, ArrowLeft, Trophy, UserCog, BarChart2, Activity, Bell, Upload } from 'lucide-react';
import { clearCurrentUser, getCurrentUser, type CurrentUser } from '../../services/me.service';

const navItems = [
  { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/admin/partidos', label: 'Partidos', Icon: Calendar, end: false },
  { to: '/admin/noticias', label: 'Noticias', Icon: Newspaper, end: false },
  { to: '/admin/plantel', label: 'Plantel', Icon: Users, end: false },
  { to: '/admin/formaciones', label: 'Formaciones', Icon: Trophy, end: false },
  { to: '/admin/usuarios', label: 'Usuarios', Icon: UserCog, end: false },
  { to: '/admin/encuestas', label: 'Encuestas', Icon: BarChart2, end: false },
  { to: '/admin/push', label: 'Push', Icon: Bell, end: false },
  { to: '/admin/import', label: 'Importar', Icon: Upload, end: false },
  { to: '/admin/logs', label: 'Sistema', Icon: Activity, end: false },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('river_app_token');
    clearCurrentUser();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="md:w-64 md:min-h-screen bg-neutral-900 border-b md:border-b-0 md:border-r border-neutral-800 flex flex-col">
        {/* Brand */}
        <div className="pl-3 pr-4 py-4 border-b border-neutral-800">
          <Link to="/" className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full border border-neutral-700 overflow-hidden flex items-center justify-center bg-neutral-950 flex-shrink-0">
              <img src="/logo.png" alt="CARP Fans" className="w-full h-full object-cover" />
            </span>
            <div>
              <div className="font-bold text-sm tracking-wide">CARP Fans</div>
              <div className="text-[10px] text-riverRed font-bold uppercase tracking-widest">Admin Panel</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-riverRed text-white shadow-lg shadow-red-900/30'
                    : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                }`
              }
            >
              <item.Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-neutral-800">
          {user && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-300">
                {user.display_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate">{user.display_name}</div>
                <div className="text-[10px] text-riverRed uppercase tracking-widest">{user.role}</div>
              </div>
            </div>
          )}
          <div className="space-y-1">
            <Link
              to="/"
              className="flex items-center gap-2 justify-center text-xs bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 px-3 py-2 rounded-lg transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver a la app
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 justify-center w-full text-xs bg-neutral-950 hover:bg-red-950/40 border border-neutral-800 hover:border-riverRed text-neutral-300 hover:text-riverRed px-3 py-2 rounded-lg transition-all"
            >
              <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6 md:p-10 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  );
}
