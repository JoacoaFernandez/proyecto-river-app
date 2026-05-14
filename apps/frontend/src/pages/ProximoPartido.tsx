// apps/frontend/src/pages/ProximoPartido.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { getLiveDashboard } from '../services/live.service';
import { getLineup, type LineupResponse } from '../services/formations.service';
import { getH2H, type Match } from '../services/matches.service';
import { getMatchPrediction } from '../services/ai.service';
import ReactMarkdown from 'react-markdown';
import CanchaTactica from '../components/CanchaTactica';
import { Bot, Sparkles, AlertCircle } from 'lucide-react';

const TEAM_COLORS: Record<string, { bg: string; text: string }> = {
  'boca juniors': { bg: '#1a3f9e', text: '#f5c518' },
  'racing club': { bg: '#1a1a2e', text: '#e0e0e0' },
  'independiente': { bg: '#b01c2e', text: '#ffffff' },
  'san lorenzo': { bg: '#1c3d8f', text: '#d32f2f' },
  'estudiantes': { bg: '#e8c12a', text: '#1a1a1a' },
  'vélez sársfield': { bg: '#0d5c2f', text: '#ffffff' },
  'velez sarsfield': { bg: '#0d5c2f', text: '#ffffff' },
  'lanús': { bg: '#1b5e20', text: '#ffffff' },
  'lanus': { bg: '#1b5e20', text: '#ffffff' },
  'talleres': { bg: '#0a4a8c', text: '#ffffff' },
  'huracán': { bg: '#c62828', text: '#f5f5f5' },
  'huracan': { bg: '#c62828', text: '#f5f5f5' },
  'belgrano': { bg: '#1a56a0', text: '#ffffff' },
  'rosario central': { bg: '#f5c518', text: '#1a1a1a' },
};

function teamStyle(name: string): { bg: string; text: string } {
  if (/river\s*plate|^river$/i.test(name)) return { bg: '#E30613', text: '#ffffff' };
  const key = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const [k, v] of Object.entries(TEAM_COLORS)) {
    if (key.includes(k)) return v;
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return { bg: `hsl(${hue}, 55%, 28%)`, text: '#f5f5f5' };
}

function abbrev(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  if (words.length === 2) return (words[0][0] + words[1].slice(0, 2)).toUpperCase();
  return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
}

function TeamBadge({ name }: { name: string }) {
  const { bg, text } = teamStyle(name);
  const isRiver = /river\s*plate|^river$/i.test(name);
  return (
    <div
      className="w-24 h-24 md:w-28 md:h-28 rounded-3xl flex items-center justify-center font-black text-2xl md:text-3xl mx-auto flex-shrink-0 shadow-xl"
      style={{
        background: isRiver ? 'linear-gradient(135deg, #E30613 0%, #a00000 100%)' : bg,
        color: text,
        boxShadow: isRiver ? '0 8px 32px rgba(227,6,19,0.45)' : `0 4px 16px rgba(0,0,0,0.4)`,
      }}
    >
      {abbrev(name)}
    </div>
  );
}

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

const RIVER_RX = /river\s*plate|^river$/i;

function H2HSection({ rival }: { rival: string }) {
  const [h2h, setH2h] = useState<Match[]>([]);
  const [h2hLoading, setH2hLoading] = useState(true);

  useEffect(() => {
    if (!rival) return;
    setH2hLoading(true);
    getH2H(rival, 6)
      .then(setH2h)
      .finally(() => setH2hLoading(false));
  }, [rival]);

  const summary = h2h.reduce(
    (acc, m) => {
      const isHome = RIVER_RX.test(m.homeTeam);
      const our = isHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
      const them = isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);
      if (our > them) acc.w++;
      else if (our === them) acc.d++;
      else acc.l++;
      return acc;
    },
    { w: 0, d: 0, l: 0 },
  );

  return (
    <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
      <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">
        Historial vs {rival}
      </h3>

      {h2hLoading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-riverRed" />
        </div>
      ) : h2h.length === 0 ? (
        <p className="text-sm text-neutral-500 text-center py-4">
          Sin partidos registrados vs {rival}.
        </p>
      ) : (
        <>
          {/* Resumen W/D/L */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Victorias', value: summary.w, color: 'text-green-400' },
              { label: 'Empates', value: summary.d, color: 'text-yellow-400' },
              { label: 'Derrotas', value: summary.l, color: 'text-red-400' },
            ].map((s) => (
              <div key={s.label} className="bg-neutral-950 border border-neutral-800 rounded-xl py-3 text-center">
                <div className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</div>
                <div className="text-[9px] uppercase tracking-widest text-neutral-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Lista de partidos */}
          <div className="space-y-2">
            {h2h.map((m) => {
              const isHome = RIVER_RX.test(m.homeTeam);
              const our = isHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
              const them = isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);
              const result: 'W' | 'D' | 'L' = our > them ? 'W' : our === them ? 'D' : 'L';
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-sm"
                >
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                      result === 'W'
                        ? 'bg-green-500/20 text-green-400 border border-green-700/40'
                        : result === 'D'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-700/40'
                        : 'bg-red-500/20 text-red-400 border border-red-700/40'
                    }`}
                  >
                    {result === 'W' ? 'G' : result === 'D' ? 'E' : 'P'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">
                      {m.homeTeam} {m.homeScore ?? '?'} – {m.awayScore ?? '?'} {m.awayTeam}
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      {m.competition} · {new Date(m.date).toLocaleDateString('es-AR')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

function AiPredictionSection({ matchId }: { matchId: string }) {
  const [prediction, setPrediction] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!matchId) return;
    setLoading(true);
    setError(false);
    getMatchPrediction(matchId)
      .then((res) => {
        if (res) setPrediction(res);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [matchId]);

  return (
    <section className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
      <div className="bg-gradient-to-r from-red-600/10 to-transparent p-5 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center text-red-500 border border-red-900/30">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-widest flex items-center gap-2">
              El Oráculo Millonario
              <span className="bg-red-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                IA LIVE
              </span>
            </h3>
            <p className="text-[10px] text-neutral-500 uppercase font-medium tracking-tighter mt-0.5">
              Análisis predictivo basado en datos
            </p>
          </div>
        </div>
        <Sparkles className="text-red-500/30" size={20} />
      </div>

      <div className="p-5">
        {loading ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-800 animate-pulse" />
              <div className="h-4 bg-neutral-800 rounded w-1/3 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-neutral-800 rounded w-full animate-pulse" />
              <div className="h-3 bg-neutral-800 rounded w-5/6 animate-pulse" />
              <div className="h-3 bg-neutral-800 rounded w-4/5 animate-pulse" />
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <AlertCircle className="text-neutral-600" size={32} />
            <p className="text-sm text-neutral-500 max-w-[200px]">
              No se pudo conectar con el Oráculo en este momento.
            </p>
          </div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none prose-p:text-neutral-300 prose-strong:text-white prose-strong:font-black">
            <ReactMarkdown>{prediction || ''}</ReactMarkdown>
          </div>
        )}
      </div>

      <div className="px-5 py-3 bg-neutral-950/50 border-t border-neutral-800 text-[9px] text-neutral-500 italic text-center">
        Nota: Esta predicción es generada por IA y no garantiza resultados reales. Juega con responsabilidad.
      </div>
    </section>
  );
}

export default function ProximoPartido() {
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [prediction, setPrediction] = useState<Pred>(null);
  const [predStored, setPredStored] = useState<Pred>(null);
  const [predLoading, setPredLoading] = useState(false);
  const isAuthenticated = !!localStorage.getItem('river_app_token');

  useEffect(() => {
    getLiveDashboard()
      .then((d) => setMatch(d?.nextMatch ?? null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!match) return;
    const hash = window.location.hash;
    if (!hash) return;
    const el = document.querySelector(hash);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [match]);

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
    if (!match || !isAuthenticated) return;
    import('../services/predictions.service').then(({ getMyPrediction }) => {
      getMyPrediction(match.id).then((res) => {
        if (res) setPredStored(res.choice as Pred);
      });
    });
  }, [match, isAuthenticated]);

  const handlePredict = async (p: Pred) => {
    if (!match || predStored) return;
    if (!isAuthenticated) {
      alert('Inicia sesión para participar del Prode');
      return;
    }
    
    setPredLoading(true);
    setPrediction(p);
    
    try {
      const { createPrediction } = await import('../services/predictions.service');
      await createPrediction(match.id, p as 'home' | 'draw' | 'away');
      setPredStored(p);
    } catch (e) {
      alert('Hubo un error al guardar tu predicción.');
      setPrediction(null);
    } finally {
      setPredLoading(false);
    }
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
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-7 h-7 text-neutral-500" />
        </div>
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
        <div className="flex items-center justify-between max-w-3xl mx-auto gap-4">
          <div className="flex flex-col items-center gap-3 flex-1">
            <TeamBadge name={match.homeTeam} />
            <div className="font-bold text-base text-center">{match.homeTeam}</div>
            <div className="text-xs text-neutral-500 uppercase tracking-wider">Local</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-2xl font-black text-neutral-700">VS</div>
          </div>
          <div className="flex flex-col items-center gap-3 flex-1">
            <TeamBadge name={match.awayTeam} />
            <div className="font-bold text-base text-center">{match.awayTeam}</div>
            <div className="text-xs text-neutral-500 uppercase tracking-wider">Visitante</div>
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
                    disabled={predLoading}
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

      {/* Oráculo de IA */}
      <AiPredictionSection matchId={match.id} />

      {/* Formación probable: cancha SVG con XI titular */}
      <div id="formacion">
        <FormacionSection />
      </div>

      <H2HSection rival={rival} />
    </div>
  );
}
