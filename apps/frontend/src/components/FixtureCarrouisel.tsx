'use client';

import { useEffect, useState } from 'react';

// Definimos cómo luce un partido según lo que manda tu backend
interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  competition: string;
  status: string;
  type: string;
}

export default function FixtureCarousel() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Le pegamos al endpoint de tu backend (ajustá el puerto si tu back corre en otro)
    const fetchMatches = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/matches');
        if (!res.ok) throw new Error('Error al cargar los partidos');
        const data = await res.json();
        setMatches(data);
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-8 font-bold text-gray-500">Cargando la pasión... ⏳</div>;
  }

  if (matches.length === 0) {
    return <div className="text-center p-4 text-gray-500">No hay partidos programados.</div>;
  }

  return (
    <div className="w-full overflow-x-auto pb-6 pt-4 hide-scrollbar">
      {/* Contenedor flexible para el scroll horizontal */}
      <div className="flex space-x-4 px-4 w-max snap-x">
        {matches.map((match) => {
          // Formateamos la fecha a formato local argentino
          const dateObj = new Date(match.date);
          const formattedDate = dateObj.toLocaleDateString('es-AR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          });
          const formattedTime = dateObj.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
          });

          // Lógica de colores: si es el PRÓXIMO, lo pintamos de los colores de River
          const isNext = match.type === 'NEXT';
          const cardBg = isNext 
            ? 'bg-red-700 text-white shadow-red-900/50' 
            : 'bg-white text-gray-800 border border-gray-200 shadow-md';

          return (
            <div 
              key={match.id} 
              className={`flex flex-col justify-between w-72 rounded-2xl shadow-lg p-5 flex-shrink-0 snap-center ${cardBg}`}
            >
              {/* Torneo */}
              <div className="text-xs font-black uppercase tracking-widest text-center mb-4 opacity-80">
                {match.competition}
              </div>

              {/* Equipos y Resultado */}
              <div className="flex justify-between items-center mb-5">
                <div className="flex flex-col items-center w-1/3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full mb-2 flex items-center justify-center text-sm font-black text-gray-700 shadow-inner">
                    {match.homeTeam.substring(0, 3).toUpperCase()}
                  </div>
                  <span className="text-xs text-center font-bold truncate w-full">{match.homeTeam}</span>
                </div>

                <div className="flex flex-col items-center justify-center w-1/3">
                  {match.status === 'FINISHED' || match.status === 'LIVE' ? (
                    <div className="text-3xl font-black tracking-tighter">
                      {match.homeScore} - {match.awayScore}
                    </div>
                  ) : (
                    <div className="text-sm font-black opacity-60">VS</div>
                  )}
                  
                  {match.status === 'LIVE' && (
                    <span className="mt-1 text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse font-bold">
                      {match.minute}'
                    </span>
                  )}
                  {match.status === 'FINISHED' && (
                    <span className="mt-1 text-[10px] font-bold opacity-70">FINAL</span>
                  )}
                </div>

                <div className="flex flex-col items-center w-1/3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full mb-2 flex items-center justify-center text-sm font-black text-gray-700 shadow-inner">
                    {match.awayTeam.substring(0, 3).toUpperCase()}
                  </div>
                  <span className="text-xs text-center font-bold truncate w-full">{match.awayTeam}</span>
                </div>
              </div>

              {/* Fecha y Hora */}
              <div className={`text-xs text-center font-semibold mt-auto ${isNext ? 'text-red-100' : 'text-gray-500'}`}>
                {formattedDate} • {formattedTime} hs
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}