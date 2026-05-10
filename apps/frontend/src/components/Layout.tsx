// apps/frontend/src/components/Layout.tsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Inicio', icon: '🏟️', end: true },
  { to: '/partidos', label: 'Partidos', icon: '⚽', end: false },
  { to: '/plantel', label: 'Plantel', icon: '🏃‍♂️', end: false },
  { to: '/noticias', label: 'Noticias', icon: '📰', end: false },
  { to: '/mas', label: 'Más', icon: '≡', end: false },
];

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('river_app_token');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-20 md:pb-12">
      {/* Navegación Desktop */}
      <nav className="bg-neutral-900 border-b border-neutral-800 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <NavLink to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white text-riverRed font-black flex items-center justify-center border border-riverRed text-lg">
                CARP
              </div>
              <span className="font-bold text-lg tracking-wide hidden sm:block">River App</span>
            </NavLink>

            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `text-sm font-semibold transition-colors flex items-center gap-1 ${
                      isActive
                        ? 'text-riverRed border-b-2 border-riverRed pb-1'
                        : 'text-neutral-400 hover:text-white'
                    }`
                  }
                >
                  {item.label} {item.icon}
                </NavLink>
              ))}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-riverRed text-xs sm:text-sm px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer"
          >
            Cerrar Sesión 🚪
          </button>
        </div>
      </nav>

      <Outlet />

      {/* Navegación Mobile Bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-neutral-950 border-t border-neutral-900 flex justify-around p-2 z-50 pb-safe">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className="flex flex-col items-center justify-center p-2 w-16"
          >
            {({ isActive }) => (
              <>
                <span className={`text-xl mb-1 transition-transform ${isActive ? 'scale-110' : 'opacity-50'}`}>
                  {item.icon}
                </span>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider ${
                    isActive ? 'text-riverRed' : 'text-neutral-500'
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
