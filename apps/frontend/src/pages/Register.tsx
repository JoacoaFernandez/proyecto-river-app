// apps/frontend/src/pages/Register.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { login, register } from '../services/auth.service';

export default function Register() {
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      <div
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{
          background:
            'radial-gradient(circle at 20% 0%, rgba(227,6,19,0.18), transparent 50%), radial-gradient(circle at 80% 100%, rgba(227,6,19,0.10), transparent 60%)',
        }}
      />

      <Link
        to="/"
        className="absolute top-5 left-5 inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors z-10"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al inicio
      </Link>

      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo + marca */}
          <div className="flex flex-col items-center mb-8">
            <span className="w-20 h-20 rounded-full border border-neutral-800 overflow-hidden bg-neutral-950 mb-4 shadow-xl shadow-red-950/30">
              <img src="/logo.png" alt="CARP Fans" className="w-full h-full object-cover" />
            </span>
            <h1 className="text-2xl font-black tracking-wide">CARP Fans</h1>
            <p className="text-sm text-neutral-500 mt-1">Unite a la comunidad del Millonario</p>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-7 shadow-2xl shadow-black/40">
            <div className="mb-6">
              <h2 className="text-lg font-bold">Crear cuenta</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Tarda menos de un minuto</p>
            </div>

            {error && (
              <div className="bg-red-950/40 border border-red-800/60 text-red-300 text-sm px-4 py-2.5 rounded-xl mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Nombre de usuario
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Cómo querés que te vean"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tuusuario@email.com"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-colors"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none transition-colors"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repetí la contraseña"
                    className={`w-full bg-neutral-950 border text-white rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-colors ${
                      confirm && confirm !== password
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-neutral-800 focus:border-riverRed'
                    }`}
                    required
                  />
                </div>
                {confirm && confirm !== password && (
                  <p className="text-xs text-red-400 mt-1">Las contraseñas no coinciden</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || (!!confirm && confirm !== password)}
                className="w-full bg-riverRed hover:bg-red-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-red-900/30 active:scale-[0.99] mt-2"
              >
                {loading ? 'Creando cuenta…' : 'Crear cuenta'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-neutral-500 mt-6">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="text-riverRed hover:underline font-semibold">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
