// apps/frontend/src/pages/Login.tsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login } from '../services/auth.service';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Detalle decorativo de la banda roja cruzada de fondo */}
      <div className="absolute top-0 left-[-20%] w-[150%] h-[120px] bg-riverRed -rotate-12 opacity-80 blur-[2px] pointer-events-none" />

      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl z-10">
        {/* Encabezado / Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white text-riverRed font-black text-2xl shadow-md border-2 border-riverRed mb-3">
            CARP
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">River Plate App</h2>
          <p className="text-sm text-neutral-400 mt-1">Ingresá con tu cuenta para ver el minuto a minuto</p>
        </div>

        {/* Alerta de Error en caso de credenciales inválidas */}
        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-200 text-sm p-3 rounded-xl mb-5 text-center">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tuusuario@river.com"
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl px-4 py-3 text-sm outline-none transition-all duration-300"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl px-4 py-3 text-sm outline-none transition-all duration-300"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-riverRed hover:bg-red-700 disabled:bg-neutral-800 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg shadow-red-900/30 active:scale-[0.98] mt-2 flex items-center justify-center cursor-pointer"
          >
            {loading ? 'Validando pase...' : 'Entrar a la Cancha 🏟️'}
          </button>
        </form>

        {/* Footer del login */}
        <p className="text-center text-xs text-neutral-500 mt-6">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="text-riverRed hover:underline font-semibold">
            Registrate acá
          </Link>
        </p>
      </div>
    </div>
  );
}