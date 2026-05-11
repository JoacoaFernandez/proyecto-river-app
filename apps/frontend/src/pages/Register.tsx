// apps/frontend/src/pages/Register.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, register } from '../services/auth.service';

export default function Register() {
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await register(email.trim(), password, displayName.trim());
      // Auto-login después del registro
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Banda decorativa */}
      <div className="absolute top-0 left-[-20%] w-[150%] h-[120px] bg-riverRed -rotate-12 opacity-80 blur-[2px] pointer-events-none" />

      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white text-riverRed font-black text-2xl shadow-md border-2 border-riverRed mb-3">
            CARP
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Creá tu cuenta</h2>
          <p className="text-sm text-neutral-400 mt-1">Unite a la comunidad del Millonario</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-200 text-sm p-3 rounded-xl mb-5 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
              Nombre de usuario
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ej: Joaquín Millonario"
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl px-4 py-3 text-sm outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tuusuario@river.com"
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl px-4 py-3 text-sm outline-none transition-all"
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
              placeholder="Mínimo 6 caracteres"
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl px-4 py-3 text-sm outline-none transition-all"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-2">
              Confirmar contraseña
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repetí tu contraseña"
              className={`w-full bg-neutral-950 border text-white rounded-xl px-4 py-3 text-sm outline-none transition-all ${
                confirm && confirm !== password
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-neutral-800 focus:border-riverRed'
              }`}
              required
            />
            {confirm && confirm !== password && (
              <p className="text-xs text-red-400 mt-1">Las contraseñas no coinciden</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || (!!confirm && confirm !== password)}
            className="w-full bg-riverRed hover:bg-red-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-red-900/30 active:scale-[0.98] mt-2 flex items-center justify-center"
          >
            {loading ? 'Creando cuenta…' : 'Unirme al Millonario 🏟️'}
          </button>
        </form>

        <p className="text-center text-xs text-neutral-500 mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-riverRed hover:underline font-semibold">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
