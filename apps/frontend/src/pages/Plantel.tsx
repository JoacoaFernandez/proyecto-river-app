// apps/frontend/src/pages/Plantel.tsx
import { useState, useEffect } from 'react';
import { getPlayers } from '../services/players.service';

export default function Plantel() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const list = await getPlayers();
        // Nos aseguramos de que lo que recibimos sea un Array real
        if (Array.isArray(list)) {
          setPlayers(list);
        } else {
          console.warn('Los datos recibidos no tienen el formato de array esperado:', list);
          setPlayers([]);
        }
      } catch (error) {
        console.error('Error al cargar jugadores:', error);
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    };
    loadPlayers();
  }, []);

  // Agrupamos a los jugadores por su posición de forma segura
  const getPlayersByPosition = (position: string) => {
    if (!Array.isArray(players)) return [];
    return players.filter((p) => p && p.position?.toLowerCase().includes(position.toLowerCase()));
  };

  const positions = [
    { title: 'Arqueros 🧤', key: 'Goalkeeper' },
    { title: 'Defensores 🛡️', key: 'Defender' },
    { title: 'Mediocampistas 🧠', key: 'Midfielder' },
    { title: 'Delanteros ⚡', key: 'Attacker' },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-16 px-4 md:px-8 mt-6">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Título de la sección */}
        <div className="border-b border-neutral-800 pb-4">
          <h2 className="text-2xl font-black tracking-wide uppercase">El Plantel Millonario</h2>
          <p className="text-sm text-neutral-400 mt-1">Los defensores del manto sagrado para esta temporada.</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-riverRed mx-auto mb-4"></div>
            <p className="text-neutral-400">Reuniendo al equipo en el vestuario...</p>
          </div>
        ) : players.length > 0 ? (
          <div className="space-y-12">
            {positions.map((pos) => {
              const filteredList = getPlayersByPosition(pos.key);
              if (filteredList.length === 0) return null;

              return (
                <div key={pos.key} className="space-y-4">
                  <h3 className="text-lg font-bold text-riverRed border-l-4 border-riverRed pl-3 uppercase tracking-wider">
                    {pos.title}
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {filteredList.map((player) => (
                      <div 
                        key={player.id} 
                        className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-center hover:border-neutral-700 transition-all duration-300 relative group overflow-hidden"
                      >
                        {/* Dorsal del jugador de fondo */}
                        <div className="absolute right-2 top-0 text-5xl font-black text-neutral-800/40 select-none group-hover:text-riverRed/20 transition-all duration-300">
                          #{player.number || '10'}
                        </div>

                        {/* Foto / Placeholder del Jugador */}
                        <div className="w-20 h-20 bg-neutral-950 rounded-full mx-auto mb-3 flex items-center justify-center border-2 border-neutral-800 group-hover:border-riverRed transition-all duration-300">
                          {player.photo ? (
                            <img src={player.photo} alt={player.name} className="rounded-full w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl font-black text-neutral-600">⚽</span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm text-white truncate">{player.name}</h4>
                        <p className="text-xs text-neutral-500 mt-1">{player.nationality || 'Argentina'}</p>
                        <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mt-2">
                          Edad: {player.age || 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-neutral-900 border border-neutral-800 rounded-2xl text-neutral-500 text-sm">
            Aún no hay jugadores registrados en el plantel o hubo un problema al consultarlos. 🏃‍♂️💨
          </div>
        )}

      </div>
    </div>
  );
}