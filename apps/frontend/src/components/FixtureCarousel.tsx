import { useState, useEffect } from 'react';
import { getLiveDashboard } from '../services/live.service';

export default function FixtureCarousel() {
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const dashboard = await getLiveDashboard();
        setUpcoming(Array.isArray(dashboard?.upcomingMatches) ? dashboard.upcomingMatches : []);
      } catch (error) {
        console.error('Error fetching upcoming matches:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatches();
  }, []);

  if (loading) {
    return <div className="text-neutral-400 text-center py-8">Cargando fixture...</div>;
  }

  if (upcoming.length === 0) {
    return <div className="text-neutral-500 text-sm">No hay próximos partidos en el fixture.</div>;
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
      {upcoming.map((m) => (
        <div key={m.id} className="min-w-[260px] bg-neutral-900 border border-neutral-800 hover:border-riverRed transition-colors rounded-xl p-5 flex-shrink-0 snap-start shadow-lg">
          <div className="text-xs text-neutral-400 font-semibold mb-2 uppercase tracking-wider">{m.competition}</div>
          <div className="mt-1 font-black text-xl truncate text-white">
            {new Date(m.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
          </div>
          <div className="text-xs text-neutral-500 mb-5 font-medium">
            {new Date(m.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hrs
          </div>
          
          <div className="flex flex-col gap-3 mt-2 bg-neutral-950 rounded-lg p-3 border border-neutral-800">
            <div className="flex justify-between items-center">
              <span className={`text-sm font-bold truncate ${m.homeTeam.toLowerCase().includes('river') ? 'text-white' : 'text-neutral-400'}`}>
                {m.homeTeam}
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-neutral-800 pt-2">
              <span className={`text-sm font-bold truncate ${m.awayTeam.toLowerCase().includes('river') ? 'text-white' : 'text-neutral-400'}`}>
                {m.awayTeam}
              </span>
            </div>
          </div>
          
          <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-center text-neutral-500 bg-neutral-950 py-2 rounded-lg border border-neutral-800">
            {m.status === 'live' ? 'En Vivo' : m.status === 'finished' ? 'Finalizado' : 'Programado'}
          </div>
        </div>
      ))}
    </div>
  );
}