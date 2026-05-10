// apps/frontend/src/pages/Partidos.tsx
import { Link } from 'react-router-dom';
import FixtureCarousel from '../components/FixtureCarousel';

export default function Partidos() {
  return (
    <div className="max-w-6xl mx-auto px-4 mt-8">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-6">
        <h2 className="text-2xl font-black">Fixture</h2>
        <div className="flex items-center gap-4">
          <Link
            to="/partidos/en-vivo"
            className="flex items-center gap-1.5 text-sm font-bold text-neutral-400 hover:text-white transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-riverRed animate-pulse" />
            En Vivo
          </Link>
          <Link
            to="/partidos/proximo"
            className="text-sm text-riverRed font-semibold hover:underline"
          >
            Próximo →
          </Link>
        </div>
      </div>
      <FixtureCarousel />
    </div>
  );
}
