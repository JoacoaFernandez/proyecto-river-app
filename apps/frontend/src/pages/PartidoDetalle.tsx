// apps/frontend/src/pages/PartidoDetalle.tsx
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Inbox, Link2, Check, MapPin, Camera, X } from 'lucide-react';
import { getMatchById, getH2H } from '../services/matches.service';
import type { Match } from '../services/matches.service';
import EventTimeline from '../components/EventTimeline';
import MatchStatsPanel from '../components/MatchStatsPanel';
import FavoriteButton from '../components/FavoriteButton';
import { useTeamLogo } from '../hooks/useTeamLogo';

type DetailTab = 'resumen' | 'estadisticas' | 'h2h' | 'galeria';

const RIVER_RX = /river\s*plate|^river$/i;

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
  if (RIVER_RX.test(name)) return { bg: '#E30613', text: '#ffffff' };
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

function TeamBadge({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const { bg, text } = teamStyle(name);
  const isRiver = RIVER_RX.test(name);
  const logo = useTeamLogo(name);
  const [imgFailed, setImgFailed] = useState(false);
  const showLogo = logo && !imgFailed;
  const sizeClass =
    size === 'lg' ? 'w-24 h-24 md:w-28 md:h-28 rounded-3xl' :
    size === 'sm' ? 'w-10 h-10 rounded-xl' :
    'w-16 h-16 rounded-2xl';
  const imgSizeClass =
    size === 'lg' ? 'w-16 h-16 md:w-20 md:h-20' :
    size === 'sm' ? 'w-7 h-7' :
    'w-11 h-11';
  return (
    <div
      className={`${sizeClass} flex items-center justify-center font-black mx-auto flex-shrink-0 shadow-xl overflow-hidden`}
      style={{
        background: showLogo ? '#1a1a1a' : isRiver ? 'linear-gradient(135deg, #E30613 0%, #a00000 100%)' : bg,
        boxShadow: isRiver ? '0 8px 32px rgba(227,6,19,0.45)' : '0 4px 16px rgba(0,0,0,0.4)',
      }}
    >
      {showLogo ? (
        <img
          src={logo}
          alt={name}
          className={`${imgSizeClass} object-contain drop-shadow`}
          loading="lazy"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span style={{ color: text }}>{abbrev(name)}</span>
      )}
    </div>
  );
}

function H2HSection({ rival }: { rival: string }) {
  const [h2h, setH2h] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!rival) return;
    setLoading(true);
    getH2H(rival, 6).then(setH2h).finally(() => setLoading(false));
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

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-riverRed" />
        </div>
      ) : h2h.length === 0 ? (
        <p className="text-sm text-neutral-500 text-center py-4">Sin partidos registrados.</p>
      ) : (
        <>
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
          <div className="space-y-2">
            {h2h.map((m) => {
              const isHome = RIVER_RX.test(m.homeTeam);
              const our = isHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
              const them = isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);
              const result: 'W' | 'D' | 'L' = our > them ? 'W' : our === them ? 'D' : 'L';
              return (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-sm">
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                    result === 'W' ? 'bg-green-500/20 text-green-400 border border-green-700/40' :
                    result === 'D' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-700/40' :
                                     'bg-red-500/20 text-red-400 border border-red-700/40'
                  }`}>
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

export default function PartidoDetalle() {
  const { id } = useParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>('resumen');

  useEffect(() => {
    if (!id) return;
    getMatchById(id).then(setMatch).finally(() => setLoading(false));
  }, [id]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* no clipboard */ }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 mt-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-riverRed mx-auto mb-4" />
        <p className="text-neutral-400">Cargando partido…</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-4xl mx-auto px-4 mt-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-4">
          <Inbox className="w-7 h-7 text-neutral-500" />
        </div>
        <h2 className="text-xl font-bold mb-2">Partido no encontrado</h2>
        <Link to="/partidos" className="text-riverRed font-semibold hover:underline">
          ← Volver al fixture
        </Link>
      </div>
    );
  }

  const isRiverHome = RIVER_RX.test(match.homeTeam);
  const rival = isRiverHome ? match.awayTeam : match.homeTeam;
  const isFinished = match.status === 'finished';
  const isLive = match.status === 'live';
  const isScheduled = !isFinished && !isLive;

  const riverScore = isRiverHome ? match.homeScore : match.awayScore;
  const rivalScore = isRiverHome ? match.awayScore : match.homeScore;

  const result =
    isFinished && riverScore !== null && rivalScore !== null
      ? riverScore > rivalScore ? 'W' : riverScore < rivalScore ? 'L' : 'D'
      : null;

  const resultBadge =
    result === 'W' ? { label: 'Victoria', cls: 'bg-green-950/40 text-green-400 border-green-800/50' } :
    result === 'L' ? { label: 'Derrota', cls: 'bg-red-950/40 text-red-400 border-red-800/50' } :
    result === 'D' ? { label: 'Empate', cls: 'bg-yellow-950/40 text-yellow-400 border-yellow-800/50' } :
    null;

  const matchDate = new Date(match.date);
  const dayName = matchDate.toLocaleDateString('es-AR', { weekday: 'long' });
  const dayDate = matchDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
  const time = matchDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  const hasEvents = match.events && match.events.length > 0;
  const hasStats = isFinished && !!match.statistics;

  const hasPhotos = (match.photos?.length ?? 0) > 0;
  const tabs: { id: DetailTab; label: string }[] = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'estadisticas', label: 'Estadísticas' },
    { id: 'h2h', label: `H2H vs ${rival.split(' ')[0]}` },
    ...(hasPhotos ? [{ id: 'galeria' as DetailTab, label: `Galería (${match.photos!.length})` }] : []),
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 mt-6 pb-12 space-y-5">
      {/* Breadcrumb */}
      <div className="text-sm text-neutral-500 flex items-center justify-between flex-wrap gap-2">
        <div>
          <Link to="/partidos" className="hover:text-white">Fixture</Link>
          <span className="mx-2">/</span>
          <span className="text-white truncate">{match.homeTeam} vs {match.awayTeam}</span>
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton type="match" targetId={match.id} size="sm" />
          <button
            onClick={handleShare}
            className="text-xs bg-neutral-900 border border-neutral-800 hover:border-neutral-700 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
          >
            {copied
              ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copiado</>
              : <><Link2 className="w-3.5 h-3.5" /> Compartir</>
            }
          </button>
        </div>
      </div>

      {/* Card principal */}
      <section className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
        {/* Estado + competición */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 flex-wrap mb-2">
            {isLive && (
              <span className="flex items-center gap-1 bg-green-950/40 text-green-400 border border-green-800/50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                En vivo{match.minute ? ` · ${match.minute}'` : ''}
              </span>
            )}
            {resultBadge && (
              <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${resultBadge.cls}`}>
                {resultBadge.label}
              </span>
            )}
            {isScheduled && (
              <span className="bg-red-950/40 text-riverRed border border-red-900/50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                Próximo partido
              </span>
            )}
          </div>
          {match.competition && (
            <div className="text-xs text-neutral-500 uppercase tracking-widest">{match.competition}</div>
          )}
          <p className="text-sm text-neutral-400 mt-1 capitalize">
            {dayName}, {dayDate} · {time} hs
          </p>
        </div>

        {/* Equipos + marcador */}
        <div className="flex items-center justify-between max-w-lg mx-auto gap-4">
          <div className="flex flex-col items-center gap-3 flex-1">
            <TeamBadge name={match.homeTeam} size="lg" />
            <div className="font-bold text-sm text-center">{match.homeTeam}</div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Local</div>
          </div>

          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            {isFinished || isLive ? (
              <div className={`flex items-center gap-2 bg-neutral-950 border px-5 py-3 rounded-2xl ${isLive ? 'border-green-800/50' : 'border-neutral-800'}`}>
                <span className="text-4xl font-black tabular-nums">{match.homeScore ?? 0}</span>
                <span className="text-neutral-600 text-xl">–</span>
                <span className="text-4xl font-black tabular-nums">{match.awayScore ?? 0}</span>
              </div>
            ) : (
              <span className="text-lg font-black text-neutral-700 bg-neutral-950 border border-neutral-800 px-5 py-3 rounded-2xl">VS</span>
            )}
          </div>

          <div className="flex flex-col items-center gap-3 flex-1">
            <TeamBadge name={match.awayTeam} size="lg" />
            <div className="font-bold text-sm text-center">{match.awayTeam}</div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Visitante</div>
          </div>
        </div>

        {/* Estadio */}
        {match.stadium && (
          <div className="flex items-center justify-center gap-1 mt-4 text-xs text-neutral-500">
            <MapPin className="w-3.5 h-3.5" /> {match.stadium}
          </div>
        )}

        {/* Goleadores */}
        {(isFinished || isLive) && match.events && (() => {
          const GOAL_TYPES = ['goal', 'own-goal', 'penalty-goal'];
          const allGoals = match.events!.filter(e => GOAL_TYPES.includes(e.type));
          if (allGoals.length === 0) return null;
          const homeGoals = allGoals.filter(e => isRiverHome ? RIVER_RX.test(e.team) : !RIVER_RX.test(e.team));
          const awayGoals = allGoals.filter(e => isRiverHome ? !RIVER_RX.test(e.team) : RIVER_RX.test(e.team));
          return (
            <div className="mt-5 border-t border-neutral-800 pt-4">
              <div className="grid grid-cols-[1fr_2px_1fr] gap-x-4 max-w-lg mx-auto text-xs">
                <div className="space-y-1.5 text-right">
                  {homeGoals.map(e => (
                    <div key={e.id} className="flex items-center justify-end gap-1.5">
                      <span className={e.type === 'own-goal' ? 'text-orange-400' : 'text-neutral-300'}>
                        {e.playerName ?? '?'} {e.minute}'
                      </span>
                      <span>⚽</span>
                    </div>
                  ))}
                </div>
                <div className="bg-neutral-800 self-stretch" />
                <div className="space-y-1.5 text-left">
                  {awayGoals.map(e => (
                    <div key={e.id} className="flex items-center gap-1.5">
                      <span>⚽</span>
                      <span className={e.type === 'own-goal' ? 'text-orange-400' : 'text-neutral-300'}>
                        {e.playerName ?? '?'} {e.minute}'
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* Tab bar */}
      <div className="flex gap-2 border-b border-neutral-800 pb-0">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setDetailTab(t.id)}
            className={`px-4 py-2.5 text-sm font-bold transition-all border-b-2 -mb-px ${
              detailTab === t.id
                ? 'border-riverRed text-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Resumen */}
      {detailTab === 'resumen' && (
        <div className="space-y-5">
          {/* Info rápida */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Estado', value: isLive ? 'En vivo' : isFinished ? 'Finalizado' : 'Programado' },
              { label: 'Tipo', value: match.type ?? '—' },
              { label: 'Estadio', value: match.stadium ?? '—' },
              { label: 'Competición', value: match.competition ?? '—' },
            ].map((item) => (
              <div key={item.label} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-center">
                <div className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">{item.label}</div>
                <div className="text-sm font-semibold truncate">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Formación probable (solo si es próximo) */}
          {isScheduled && (
            <Link
              to="/partidos/proximo"
              className="flex items-center justify-between bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl px-5 py-4 transition-all group"
            >
              <div>
                <div className="text-sm font-bold text-white">Formación probable</div>
                <div className="text-xs text-neutral-500 mt-0.5">Ver alineación táctica del Millonario</div>
              </div>
              <span className="text-neutral-500 group-hover:text-white transition-colors text-sm">→</span>
            </Link>
          )}

          {/* Cronología de eventos */}
          {hasEvents && <EventTimeline events={match.events!} />}

          {!hasEvents && (isFinished || isLive) && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center text-sm text-neutral-500">
              Sin eventos registrados para este partido.
            </div>
          )}

          {isScheduled && !hasEvents && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center text-sm text-neutral-500">
              Los eventos del partido estarán disponibles una vez iniciado.
            </div>
          )}
        </div>
      )}

      {/* Tab: Estadísticas */}
      {detailTab === 'estadisticas' && (
        <div className="space-y-5">
          {hasStats ? (
            <MatchStatsPanel
              stats={match.statistics!}
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
            />
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center text-sm text-neutral-500">
              {isScheduled
                ? 'Las estadísticas estarán disponibles una vez finalizado el partido.'
                : isLive
                  ? 'Las estadísticas se actualizarán al finalizar el partido.'
                  : 'No hay estadísticas disponibles para este partido.'}
            </div>
          )}
        </div>
      )}

      {/* Tab: H2H */}
      {detailTab === 'h2h' && (
        <H2HSection rival={rival} />
      )}

      {/* Tab: Galería */}
      {detailTab === 'galeria' && hasPhotos && (
        <GallerySection photos={match.photos!} />
      )}

      {/* Links de acción */}
      <div className="flex gap-3 flex-wrap pt-2">
        {isLive && (
          <Link
            to="/partidos/en-vivo"
            className="flex items-center gap-2 bg-green-950/30 hover:bg-green-950/50 border border-green-800/50 text-green-400 font-bold text-sm px-5 py-3 rounded-xl transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Ver en vivo
          </Link>
        )}
        <Link
          to="/partidos"
          className="text-sm bg-neutral-900 border border-neutral-800 hover:border-neutral-700 px-5 py-3 rounded-xl transition-all font-semibold"
        >
          ← Volver al fixture
        </Link>
      </div>
    </div>
  );
}

function GallerySection({ photos }: { photos: string[] }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIdx(null);
      if (e.key === 'ArrowRight') setLightboxIdx((i) => (i === null ? null : (i + 1) % photos.length));
      if (e.key === 'ArrowLeft') setLightboxIdx((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIdx, photos.length]);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
      <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2 mb-4">
        <Camera className="w-3.5 h-3.5" />
        Galería del partido
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {photos.map((url, idx) => (
          <button
            key={idx}
            onClick={() => setLightboxIdx(idx)}
            className="relative aspect-square overflow-hidden rounded-lg bg-neutral-800 group"
          >
            <img
              src={url}
              alt={`Foto ${idx + 1}`}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </button>
        ))}
      </div>

      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIdx(null); }}
            className="absolute top-4 right-4 p-2 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-white"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => i === null ? null : (i - 1 + photos.length) % photos.length); }}
            className="absolute left-4 p-3 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-white text-xl font-bold"
            aria-label="Anterior"
          >
            ‹
          </button>
          <img
            src={photos[lightboxIdx]}
            alt={`Foto ${lightboxIdx + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => i === null ? null : (i + 1) % photos.length); }}
            className="absolute right-4 p-3 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-white text-xl font-bold"
            aria-label="Siguiente"
          >
            ›
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-neutral-400 bg-neutral-900/80 px-3 py-1 rounded-full">
            {lightboxIdx + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  );
}
