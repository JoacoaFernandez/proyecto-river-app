// apps/frontend/src/pages/ProximoPartido.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLiveDashboard } from '../services/live.service';
import { getLineup, type LineupResponse } from '../services/formations.service';
import CanchaTactica from '../components/CanchaTactica';

type Pred = 'home' | 'draw' | 'away' | null;

function FormacionSection() {
  const [data, setData] = useState<LineupResponse | null>(null);
  const [scheme, setScheme] = useState('4-3-3');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLineup(scheme)
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [scheme]);

  const schemes = data?.schemes ?? ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2'];
  const alertedIds = new Set((data?.alerts ?? []).map((a) => a.playerId));
  const replacementIds = new Set((data?.alerts ?? []).filter((a) => a.replacementId).map((a) => a.replacementId!));

  return (
    <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
              Formación probable
            </h3>
            {data?.source === 'last-match' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                Último partido
              </span>
            )}
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            {data?.source === 'last-match' && data.lastMatchInfo
              ? `Basada en el último partido vs ${data.lastMatchInfo.opponent} · ${new Date(data.lastMatchInfo.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}`
              : 'XI derivado del plantel actual. La alineación oficial se confirma antes del partido.'}
          </p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {schemes.map((s) => (
            <button
              key={s}
              onClick={() => setScheme(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold tabular-nums transition-all ${
                scheme === s
                  ? 'bg-riverRed text-white shadow-md shadow-red-900/30'
                  : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:border-riverRed hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Alertas de lesión / suspensión */}
      {data && data.alerts && data.alerts.length > 0 && (
        <div className="space-y-1.5">
          {data.alerts.map((alert) => (
            <div
              key={alert.playerId}
              className="flex items-center gap-2 bg-amber-950/30 border border-amber-800/40 rounded-xl px-3 py-2 text-[11px]"
            >
              <span>{alert.type === 'injury' ? '🤕' : '🟥'}</span>
              <span className="text-amber-300 flex-1">{alert.detail}</span>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-riverRed" />
        </div>
      ) : !data || data.lineup.length === 0 ? (
        <p className="text-neutral-500 text-sm text-center py-8">
          No se pudo cargar la formación.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 items-start">
          <div className="max-w-md mx-auto lg:max-w-none">
            <CanchaTactica data={data} />
          </div>
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 space-y-2">
            <h4 className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold pb-2 border-b border-neutral-800">
              Suplentes
            </h4>
            {data.bench.length === 0 ? (
              <p className="text-xs text-neutral-500">Sin suplentes disponibles.</p>
            ) : (
              <ul className="space-y-1 text-xs max-h-[480px] overflow-y-auto">
                {data.bench.map((p) => (
                  <li
                    key={p.id}
                    className={`flex items-center gap-2 py-1 border-b border-neutral-800/50 last:border-0 ${
                      replacementIds.has(p.id) ? 'bg-emerald-950/20 rounded px-1' : ''
                    }`}
                  >
                    {replacementIds.has(p.id) && (
                      <span className="text-emerald-400 font-bold text-[10px]">↑</span>
                    )}
                    {alertedIds.has(p.id) && !replacementIds.has(p.id) && (
                      <span className="text-amber-400 text-[10px]">⚠</span>
                    )}
                    {!replacementIds.has(p.id) && !alertedIds.has(p.id) && (
                      <span className="w-3" />
                    )}
                    <span className="w-6 text-center font-bold tabular-nums text-neutral-500">
                      {p.number ?? '–'}
                    </span>
                    <span className="flex-1 truncate text-neutral-300">{p.name}</span>
                    <span className="text-[9px] uppercase tracking-wider text-neutral-600">
                      {p.position.slice(0, 3)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default function ProximoPartido() {
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [prediction, setPrediction] = useState<Pred>(null);
  const [predStored, setPredStored] = useState<Pred>(null);

  useEffect(() => {
    getLiveDashboard()
      .then((d) => setMatch(d?.nextMatch ?? null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!match) return;

    const tick = () => {
      const distance = new Date(match.date).getTime() - Date.now();
      if (distance <= 0) {
        setCountdown({ d: 0, h: 0, m: 0, s: 0 });
        return;
      }
      setCountdown({
        d: Math.floor(distance / (1000 * 60 * 60 * 24)),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [match]);

  useEffect(() => {
    if (!match) return;
    const stored = localStorage.getItem(`river_pred_${match.id}`) as Pred;
    if (stored) setPredStored(stored);
  }, [match]);

  const handlePredict = (p: Pred) => {
    if (!match || predStored) return;
    setPrediction(p);
    localStorage.setItem(`river_pred_${match.id}`, p as string);
    setPredStored(p);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 mt-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-riverRed mx-auto mb-4"></div>
        <p className="text-neutral-400">Cargando próximo partido…</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-4xl mx-auto px-4 mt-12 text-center">
        <div className="text-6xl mb-4">📭</div>
        <h2 className="text-xl font-bold mb-2">No hay próximo partido programado</h2>
        <p className="text-neutral-400 mb-6">Volvé pronto, ya viene el siguiente.</p>
        <Link to="/" className="text-riverRed font-semibold hover:underline">
          ← Volver al inicio
        </Link>
      </div>
    );
  }

  const matchDate = new Date(match.date);
  const dayName = matchDate.toLocaleDateString('es-AR', { weekday: 'long' });
  const dayDate = matchDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
  const time = matchDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  const isHome = /river/i.test(match.homeTeam);
  const rival = isHome ? match.awayTeam : match.homeTeam;

  return (
    <div className="max-w-5xl mx-auto px-4 mt-8 space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-neutral-500">
        <Link to="/partidos" className="hover:text-white">Partidos</Link>
        <span className="mx-2">/</span>
        <span className="text-white">Próximo</span>
      </div>

      {/* Card principal del partido */}
      <section className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-block bg-red-950/40 text-riverRed border border-red-900/50 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-2">
            Próximo partido
          </div>
          <h1 className="text-2xl md:text-3xl font-black mt-2">
            {isHome ? 'River Plate' : rival} <span className="text-neutral-600 mx-2">vs</span> {isHome ? rival : 'River Plate'}
          </h1>
          <p className="text-sm text-neutral-400 mt-1 capitalize">
            {dayName}, {dayDate} • {time} hs
          </p>
          <p className="text-xs text-neutral-500 mt-1">{match.competition}</p>
        </div>

        {/* Cuenta regresiva */}
        {countdown && (
          <div className="grid grid-cols-4 gap-2 max-w-2xl mx-auto mb-8">
            {[
              { label: 'Días', value: countdown.d },
              { label: 'Horas', value: countdown.h },
              { label: 'Min', value: countdown.m },
              { label: 'Seg', value: countdown.s },
            ].map((u) => (
              <div key={u.label} className="bg-neutral-950 border border-neutral-800 rounded-2xl py-4 text-center">
                <div className="text-3xl md:text-4xl font-black text-riverRed tabular-nums">
                  {String(u.value).padStart(2, '0')}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mt-1">{u.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Equipos */}
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="text-center w-1/3">
            <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center mb-3 shadow-inner">
              <span className="text-riverRed font-black text-base">
                {match.homeTeam.substring(0, 3).toUpperCase()}
              </span>
            </div>
            <div className="font-bold text-sm">{match.homeTeam}</div>
            <div className="text-xs text-neutral-500 mt-1">Local</div>
          </div>
          <div className="text-3xl text-neutral-700 font-black">VS</div>
          <div className="text-center w-1/3">
            <div className="w-20 h-20 mx-auto bg-neutral-800 border border-neutral-700 rounded-full flex items-center justify-center mb-3">
              <span className="text-neutral-400 font-black text-base">
                {match.awayTeam.substring(0, 3).toUpperCase()}
              </span>
            </div>
            <div className="font-bold text-sm">{match.awayTeam}</div>
            <div className="text-xs text-neutral-500 mt-1">Visitante</div>
          </div>
        </div>
      </section>

      {/* Datos del partido */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Datos del partido</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between border-b border-neutral-800/50 pb-2">
              <span className="text-neutral-400">Estadio</span>
              <span className="font-semibold">{isHome ? 'Monumental' : 'Por confirmar'}</span>
            </li>
            <li className="flex justify-between border-b border-neutral-800/50 pb-2">
              <span className="text-neutral-400">Competición</span>
              <span className="font-semibold">{match.competition}</span>
            </li>
            <li className="flex justify-between border-b border-neutral-800/50 pb-2">
              <span className="text-neutral-400">Fecha</span>
              <span className="font-semibold capitalize">{dayName} {dayDate.split(',')[0]}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-neutral-400">Hora</span>
              <span className="font-semibold">{time} hs</span>
            </li>
          </ul>
        </div>

        {/* Predicción */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Tu predicción</h3>
          {predStored ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm text-neutral-300">
                Apostaste por:{' '}
                <span className="font-bold text-riverRed">
                  {predStored === 'home' ? match.homeTeam : predStored === 'away' ? match.awayTeam : 'Empate'}
                </span>
              </p>
              <p className="text-xs text-neutral-500 mt-1">Tu voto se guarda hasta el partido.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-neutral-500 mb-3">¿Quién gana?</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'home' as const, label: match.homeTeam.substring(0, 8), sub: 'Gana local' },
                  { key: 'draw' as const, label: 'Empate', sub: 'X' },
                  { key: 'away' as const, label: match.awayTeam.substring(0, 8), sub: 'Gana visit.' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => handlePredict(opt.key)}
                    className={`border rounded-xl py-3 text-center text-xs font-bold transition-all ${
                      prediction === opt.key
                        ? 'bg-red-950/40 text-riverRed border-red-900'
                        : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-riverRed hover:text-white'
                    }`}
                  >
                    <div className="truncate">{opt.label}</div>
                    <div className="text-[9px] text-neutral-500 mt-1 uppercase tracking-wider">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Formación probable: cancha SVG con XI titular */}
      <FormacionSection />

      <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 opacity-60">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Historial vs {rival}</h3>
        <p className="text-sm text-neutral-500">🚧 Próximamente: últimos enfrentamientos cara a cara.</p>
      </section>
    </div>
  );
}
