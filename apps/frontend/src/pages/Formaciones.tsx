// apps/frontend/src/pages/Formaciones.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getLineup,
  getFormationHistory,
  getFormationForMatch,
  type LineupResponse,
  type LineupEntry,
  type PlayerAlert,
  type FormHistoryEntry,
  type SavedFormation,
} from '../services/formations.service';
import { getPlayers, type Player } from '../services/players.service';
import CanchaTactica from '../components/CanchaTactica';
import PlayerInfoPanel from '../components/PlayerInfoPanel';

type FormTab = 'probable' | 'historial' | 'comparar';

const RIVER_RX = /river\s*plate|^river$/i;
const SCHEMES = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2'];

// ── Pestaña Probable ──────────────────────────────────────────────────────────

function ProbableTab() {
  const [data, setData] = useState<LineupResponse | null>(null);
  const [scheme, setScheme] = useState('4-3-3');
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<LineupEntry | null>(null);

  useEffect(() => {
    setLoading(true);
    getLineup(scheme)
      .then(setData)
      .finally(() => setLoading(false));
  }, [scheme]);

  const schemes = data?.schemes ?? SCHEMES;
  const alertedIds = new Set((data?.alerts ?? []).map((a: PlayerAlert) => a.playerId));
  const replacementIds = new Set((data?.alerts ?? []).filter((a) => a.replacementId).map((a) => a.replacementId!));

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Formación probable</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/50 text-amber-400 border border-amber-800/50">
              PROBABLE
            </span>
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
        {/* Scheme selector */}
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

      {/* Alerts */}
      {data?.alerts && data.alerts.length > 0 && (
        <div className="space-y-1.5">
          {data.alerts.map((alert) => (
            <div key={alert.playerId} className="flex items-center gap-2 bg-amber-950/30 border border-amber-800/40 rounded-xl px-3 py-2 text-[11px]">
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
        <p className="text-neutral-500 text-sm text-center py-8">No se pudo cargar la formación.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 items-start">
          <div className="max-w-md mx-auto lg:max-w-none">
            <CanchaTactica
              data={data}
              onPlayerClick={(slot) => setSelectedSlot(slot)}
            />
            <p className="text-center text-[10px] text-neutral-600 mt-2">Tocá un jugador para ver su ficha</p>
          </div>
          {/* Bench */}
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
                    {replacementIds.has(p.id) && <span className="text-emerald-400 font-bold text-[10px]">↑</span>}
                    {alertedIds.has(p.id) && !replacementIds.has(p.id) && <span className="text-amber-400 text-[10px]">⚠</span>}
                    {!replacementIds.has(p.id) && !alertedIds.has(p.id) && <span className="w-3" />}
                    <span className="w-6 text-center font-bold tabular-nums text-neutral-500">{p.number ?? '–'}</span>
                    <span className="flex-1 truncate text-neutral-300">{p.name}</span>
                    <span className="text-[9px] uppercase tracking-wider text-neutral-600">{p.position.slice(0, 3)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Player info panel */}
      {selectedSlot && data && (
        <PlayerInfoPanel
          slot={selectedSlot}
          alert={data.alerts?.find((a) => a.playerId === selectedSlot.player?.id)}
          onClose={() => setSelectedSlot(null)}
        />
      )}
    </div>
  );
}

// ── Pestaña Historial ─────────────────────────────────────────────────────────

function HistorialTab() {
  const [history, setHistory] = useState<FormHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFormationHistory(12).then(setHistory).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-riverRed" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center text-sm text-neutral-500">
        No hay partidos finalizados registrados.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((entry) => {
        const isRiverHome = RIVER_RX.test(entry.homeTeam);
        const riverScore = isRiverHome ? entry.homeScore : entry.awayScore;
        const rivalScore = isRiverHome ? entry.awayScore : entry.homeScore;
        const opponent = isRiverHome ? entry.awayTeam : entry.homeTeam;
        const result: 'W' | 'D' | 'L' | null =
          riverScore !== null && rivalScore !== null
            ? riverScore > rivalScore ? 'W' : riverScore < rivalScore ? 'L' : 'D'
            : null;

        const resultColor =
          result === 'W' ? 'border-green-700/50 bg-green-950/10' :
          result === 'L' ? 'border-red-800/50 bg-red-950/10' :
          result === 'D' ? 'border-yellow-700/50 bg-yellow-950/10' :
          'border-neutral-800';

        const resultBadge =
          result === 'W' ? { label: 'G', cls: 'bg-green-500/20 text-green-400 border-green-700/40' } :
          result === 'L' ? { label: 'P', cls: 'bg-red-500/20 text-red-400 border-red-700/40' } :
          result === 'D' ? { label: 'E', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-700/40' } :
          null;

        return (
          <div key={entry.matchId} className={`bg-neutral-900 border rounded-2xl p-4 ${resultColor}`}>
            <div className="flex items-center gap-3">
              {/* Result badge */}
              {resultBadge && (
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 border ${resultBadge.cls}`}>
                  {resultBadge.label}
                </span>
              )}

              {/* Match info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">
                  vs {opponent}
                  {riverScore !== null && rivalScore !== null && (
                    <span className="text-neutral-500 font-normal ml-2">
                      ({isRiverHome ? `${riverScore}-${rivalScore}` : `${rivalScore}-${riverScore}`})
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-neutral-500 mt-0.5">
                  {new Date(entry.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {entry.competition ? ` · ${entry.competition}` : ''}
                </div>
              </div>

              {/* Formation scheme */}
              <div className="flex-shrink-0 text-right">
                {entry.scheme ? (
                  <span className="text-xs font-black tabular-nums bg-neutral-800 border border-neutral-700 px-2.5 py-1 rounded-lg text-white">
                    {entry.scheme}
                  </span>
                ) : (
                  <span className="text-[10px] text-neutral-600">Sin datos</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Pestaña Comparar ──────────────────────────────────────────────────────────

function buildHistoricalLineup(saved: SavedFormation | null, players: Player[]): LineupResponse | null {
  if (!saved || !saved.lineup) return null;
  const byId = new Map(players.map((p) => [p.id, p]));
  const lineup: LineupEntry[] = saved.lineup.map((s) => {
    const pl = s.playerId ? byId.get(s.playerId) ?? null : null;
    return {
      x: s.x,
      y: s.y,
      role: s.role,
      player: pl
        ? {
            id: pl.id,
            name: pl.name,
            number: pl.number,
            photo: pl.photo,
            nationality: pl.nationality,
            position: pl.position,
          }
        : null,
    };
  });
  return {
    scheme: saved.scheme,
    schemes: [saved.scheme],
    lineup,
    bench: [],
    source: 'last-match',
    alerts: [],
  };
}

function CompararTab() {
  const [mode, setMode] = useState<'esquema' | 'historico'>('esquema');
  const [schemeA, setSchemeA] = useState('4-3-3');
  const [schemeB, setSchemeB] = useState('4-4-2');
  const [dataA, setDataA] = useState<LineupResponse | null>(null);
  const [dataB, setDataB] = useState<LineupResponse | null>(null);
  const [loadingA, setLoadingA] = useState(true);
  const [loadingB, setLoadingB] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<{ slot: LineupEntry; alert?: PlayerAlert } | null>(null);

  const [history, setHistory] = useState<FormHistoryEntry[]>([]);
  const [matchAId, setMatchAId] = useState<string>('');
  const [matchBId, setMatchBId] = useState<string>('');
  const [plantel, setPlantel] = useState<Player[]>([]);

  useEffect(() => {
    getFormationHistory(20).then((h) => {
      const withScheme = h.filter((e) => e.scheme);
      setHistory(withScheme);
      if (withScheme[0]) setMatchAId(withScheme[0].matchId);
      if (withScheme[1]) setMatchBId(withScheme[1].matchId);
    });
    getPlayers().then(setPlantel);
  }, []);

  useEffect(() => {
    if (mode !== 'esquema') return;
    setLoadingA(true);
    getLineup(schemeA).then(setDataA).finally(() => setLoadingA(false));
  }, [schemeA, mode]);

  useEffect(() => {
    if (mode !== 'esquema') return;
    setLoadingB(true);
    getLineup(schemeB).then(setDataB).finally(() => setLoadingB(false));
  }, [schemeB, mode]);

  useEffect(() => {
    if (mode !== 'historico' || !matchAId) return;
    setLoadingA(true);
    getFormationForMatch(matchAId)
      .then((saved) => setDataA(buildHistoricalLineup(saved, plantel)))
      .finally(() => setLoadingA(false));
  }, [matchAId, mode, plantel]);

  useEffect(() => {
    if (mode !== 'historico' || !matchBId) return;
    setLoadingB(true);
    getFormationForMatch(matchBId)
      .then((saved) => setDataB(buildHistoricalLineup(saved, plantel)))
      .finally(() => setLoadingB(false));
  }, [matchBId, mode, plantel]);

  function matchLabel(e: FormHistoryEntry): string {
    const isHome = RIVER_RX.test(e.homeTeam);
    const opp = isHome ? e.awayTeam : e.homeTeam;
    const dateStr = new Date(e.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
    const sc =
      e.homeScore != null && e.awayScore != null
        ? ` (${isHome ? `${e.homeScore}-${e.awayScore}` : `${e.awayScore}-${e.homeScore}`})`
        : '';
    return `${dateStr} · vs ${opp}${sc} · ${e.scheme}`;
  }

  function MatchSelector({ value, onChange }: { value: string; onChange: (id: string) => void }) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl px-3 py-2 text-xs outline-none"
      >
        {history.length === 0 && <option value="">(sin partidos)</option>}
        {history.map((e) => (
          <option key={e.matchId} value={e.matchId}>
            {matchLabel(e)}
          </option>
        ))}
      </select>
    );
  }

  function SchemeSelector({ value, onChange }: { value: string; onChange: (s: string) => void }) {
    return (
      <div className="flex gap-1.5 flex-wrap justify-center">
        {SCHEMES.map((s) => (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums transition-all ${
              value === s
                ? 'bg-riverRed text-white'
                : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:border-riverRed hover:text-white'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-neutral-500">
          {mode === 'esquema'
            ? 'Compará cómo se distribuyen los mismos jugadores en dos esquemas tácticos distintos.'
            : 'Compará las formaciones reales que jugó River en dos partidos del historial.'}
        </p>
        <div className="flex gap-1 bg-neutral-950 border border-neutral-800 rounded-xl p-1">
          <button
            onClick={() => setMode('esquema')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
              mode === 'esquema' ? 'bg-riverRed text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Esquemas
          </button>
          <button
            onClick={() => setMode('historico')}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
              mode === 'historico' ? 'bg-riverRed text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Partidos jugados
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Column A */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
          {mode === 'esquema' ? (
            <SchemeSelector value={schemeA} onChange={setSchemeA} />
          ) : (
            <MatchSelector value={matchAId} onChange={setMatchAId} />
          )}
          {loadingA ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-riverRed" /></div>
          ) : dataA ? (
            <CanchaTactica
              data={dataA}
              onPlayerClick={(slot, alert) => setSelectedSlot({ slot, alert })}
            />
          ) : (
            <p className="text-center text-xs text-neutral-500 py-12">Sin formación guardada para este partido.</p>
          )}
        </div>

        {/* Column B */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
          {mode === 'esquema' ? (
            <SchemeSelector value={schemeB} onChange={setSchemeB} />
          ) : (
            <MatchSelector value={matchBId} onChange={setMatchBId} />
          )}
          {loadingB ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-riverRed" /></div>
          ) : dataB ? (
            <CanchaTactica
              data={dataB}
              onPlayerClick={(slot, alert) => setSelectedSlot({ slot, alert })}
            />
          ) : (
            <p className="text-center text-xs text-neutral-500 py-12">Sin formación guardada para este partido.</p>
          )}
        </div>
      </div>

      <p className="text-center text-[10px] text-neutral-600">Tocá un jugador en cualquiera de las canchas para ver su ficha</p>

      {/* Player info panel */}
      {selectedSlot && (
        <PlayerInfoPanel
          slot={selectedSlot.slot}
          alert={selectedSlot.alert}
          onClose={() => setSelectedSlot(null)}
        />
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Formaciones() {
  const [tab, setTab] = useState<FormTab>('probable');

  const tabs: { id: FormTab; label: string }[] = [
    { id: 'probable', label: 'Probable' },
    { id: 'historial', label: 'Historial' },
    { id: 'comparar', label: 'Comparar' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 mt-6 pb-12 space-y-5">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-wide uppercase">Formaciones</h1>
          <p className="text-sm text-neutral-400 mt-1">Tácticas y alineaciones del Millonario</p>
        </div>
        <Link
          to="/partidos/proximo"
          className="text-xs font-semibold text-neutral-500 hover:text-white border border-neutral-800 hover:border-neutral-700 px-4 py-2 rounded-xl transition-all"
        >
          Próximo partido →
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-800 pb-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-bold transition-all border-b-2 -mb-px ${
              tab === t.id
                ? 'border-riverRed text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="pt-1">
        {tab === 'probable' && <ProbableTab />}
        {tab === 'historial' && <HistorialTab />}
        {tab === 'comparar' && <CompararTab />}
      </div>
    </div>
  );
}
