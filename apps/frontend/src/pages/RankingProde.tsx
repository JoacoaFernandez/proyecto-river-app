import { useEffect, useState } from 'react';
import { getRanking, type RankingUser } from '../services/predictions.service';
import { Trophy, Medal } from 'lucide-react';

export default function RankingProde() {
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRanking()
      .then(setRanking)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6 pb-12">
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-4 shadow-xl">
          <Trophy className="w-10 h-10 text-riverRed" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black mb-2">Ranking de Predicciones</h1>
        <p className="text-neutral-400">Compite contra otros hinchas acertando resultados.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-riverRed"></div>
        </div>
      ) : ranking.length === 0 ? (
        <div className="text-center py-12 bg-neutral-900 border border-neutral-800 rounded-3xl">
          <p className="text-neutral-500">Aún no hay puntos registrados.</p>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="grid grid-cols-[auto_1fr_auto] gap-4 p-4 border-b border-neutral-800 bg-neutral-950/50 text-xs font-bold text-neutral-500 uppercase tracking-widest">
            <div className="w-8 text-center">#</div>
            <div>Hincha</div>
            <div className="w-16 text-right">Puntos</div>
          </div>
          <div className="divide-y divide-neutral-800/50">
            {ranking.map((user, index) => {
              const isTop3 = index < 3;
              return (
                <div key={user.id} className="grid grid-cols-[auto_1fr_auto] gap-4 p-4 items-center hover:bg-neutral-800/20 transition-colors">
                  <div className="w-8 text-center font-black">
                    {index === 0 ? <Medal className="w-6 h-6 text-yellow-400 mx-auto" /> :
                     index === 1 ? <Medal className="w-6 h-6 text-neutral-300 mx-auto" /> :
                     index === 2 ? <Medal className="w-6 h-6 text-amber-700 mx-auto" /> :
                     <span className="text-neutral-500 text-lg">{index + 1}</span>}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center shrink-0 overflow-hidden border border-neutral-700">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-neutral-400">
                          {user.display_name.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className={`font-bold ${isTop3 ? 'text-white' : 'text-neutral-300'}`}>
                      {user.display_name}
                    </span>
                  </div>

                  <div className="w-16 text-right">
                    <span className="text-xl font-black text-riverRed tabular-nums">
                      {user.points}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
