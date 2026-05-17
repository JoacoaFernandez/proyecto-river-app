import { useEffect, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { getAllMatchesAdmin } from '../../services/matches.service';
import { getPlayers } from '../../services/players.service';
import {
  getLineup,
  getFormationForMatch,
  saveFormationForMatch,
} from '../../services/formations.service';
import type { LineupEntry, SavedSlot } from '../../services/formations.service';
import type { Match } from '../../services/matches.service';
import type { Player } from '../../services/players.service';

const SCHEMES = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2'];

const VB_W = 100;
const VB_H = 150;
const SCALE_Y = VB_H / 100;

function lastName(full: string) {
  const parts = full.split(' ').filter(Boolean);
  return parts[parts.length - 1] ?? full;
}

function Pitch() {
  return (
    <g>
      <rect x="0" y="0" width={VB_W} height={VB_H} fill="#0d5c3a" />
      <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#stripes-editor)" />
      <rect x="2" y="2" width={VB_W - 4} height={VB_H - 4} fill="none" stroke="white" strokeWidth="0.5" opacity="0.85" />
      <line x1="2" y1={VB_H / 2} x2={VB_W - 2} y2={VB_H / 2} stroke="white" strokeWidth="0.5" opacity="0.85" />
      <circle cx="50" cy={VB_H / 2} r="11" fill="none" stroke="white" strokeWidth="0.5" opacity="0.85" />
      <circle cx="50" cy={VB_H / 2} r="0.8" fill="white" opacity="0.85" />
      <rect x="22" y="2" width="56" height="22" fill="none" stroke="white" strokeWidth="0.5" opacity="0.85" />
      <rect x="35" y="2" width="30" height="8" fill="none" stroke="white" strokeWidth="0.5" opacity="0.85" />
      <circle cx="50" cy="16.5" r="0.8" fill="white" opacity="0.85" />
      <path d="M 41 24 A 9 9 0 0 0 59 24" fill="none" stroke="white" strokeWidth="0.5" opacity="0.85" />
      <rect x="22" y={VB_H - 24} width="56" height="22" fill="none" stroke="white" strokeWidth="0.5" opacity="0.85" />
      <rect x="35" y={VB_H - 10} width="30" height="8" fill="none" stroke="white" strokeWidth="0.5" opacity="0.85" />
      <circle cx="50" cy={VB_H - 16.5} r="0.8" fill="white" opacity="0.85" />
      <path d={`M 41 ${VB_H - 24} A 9 9 0 0 1 59 ${VB_H - 24}`} fill="none" stroke="white" strokeWidth="0.5" opacity="0.85" />
    </g>
  );
}

function SlotToken({
  slot, assigned, selected, onClick,
}: {
  slot: LineupEntry;
  assigned: Player | null;
  selected: boolean;
  onClick: () => void;
}) {
  const x = slot.x;
  const y = slot.y * SCALE_Y;
  return (
    <g transform={`translate(${x} ${y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      <ellipse cx="0" cy="6" rx="4.2" ry="0.8" fill="black" opacity="0.3" />
      {selected && <circle r="8" fill="white" opacity="0.25" />}
      <circle
        r="5.5"
        fill="#0a0a0a"
        stroke={selected ? '#fbbf24' : assigned ? 'white' : '#6b7280'}
        strokeWidth={selected ? 0.9 : 0.4}
      />
      <circle r="4.8" fill={assigned ? '#E30613' : '#374151'} />
      <text textAnchor="middle" dominantBaseline="central" fill="white" fontSize="4.2" fontWeight="900"
        style={{ fontFamily: 'system-ui', pointerEvents: 'none' }}>
        {assigned?.jersey_number ?? '?'}
      </text>
      <g transform="translate(0 9.5)" style={{ pointerEvents: 'none' }}>
        <rect x="-9" y="-2.2" width="18" height="4" rx="0.8" fill="black" opacity="0.55" />
        <text textAnchor="middle" dominantBaseline="central" fill="white" fontSize="2.6" fontWeight="700"
          style={{ fontFamily: 'system-ui' }}>
          {assigned ? lastName(assigned.name).toUpperCase() : slot.role}
        </text>
      </g>
      {!assigned && (
        <text textAnchor="middle" dominantBaseline="central" fill="#9ca3af" fontSize="5" fontWeight="900"
          style={{ fontFamily: 'system-ui', pointerEvents: 'none' }}>
          +
        </text>
      )}
    </g>
  );
}

export default function AdminFormaciones() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matchId, setMatchId] = useState('');
  const [scheme, setScheme] = useState('4-3-3');
  const [type, setType] = useState<'probable' | 'confirmada'>('probable');
  const [slots, setSlots] = useState<LineupEntry[]>([]);
  const [assignments, setAssignments] = useState<Record<number, string>>({});
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [playerSearch, setPlayerSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<{ msg: string; error: boolean } | null>(null);

  const showFlash = (msg: string, error = false) => {
    setFlash({ msg, error });
    setTimeout(() => setFlash(null), 4000);
  };

  // Load matches and players on mount
  useEffect(() => {
    Promise.all([getAllMatchesAdmin(), getPlayers()]).then(([m, p]) => {
      setMatches(m.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setPlayers(p);
    });
  }, []);

  // When match changes, load saved formation or auto-derive
  useEffect(() => {
    if (!matchId) { setSlots([]); setAssignments({}); return; }
    setLoading(true);
    Promise.all([
      getLineup(scheme),
      getFormationForMatch(matchId),
    ]).then(([lineupResp, saved]) => {
      const baseSlots = lineupResp?.lineup ?? [];
      setSlots(baseSlots);
      if (saved?.lineup) {
        const map: Record<number, string> = {};
        (saved.lineup as SavedSlot[]).forEach((s, i) => {
          if (s.playerId) map[i] = s.playerId;
        });
        setAssignments(map);
        setScheme(saved.scheme);
        setType(saved.type);
      } else {
        // Pre-fill from auto-derived lineup
        const map: Record<number, string> = {};
        baseSlots.forEach((s, i) => { if (s.player?.id) map[i] = s.player.id; });
        setAssignments(map);
      }
    }).finally(() => setLoading(false));
  }, [matchId]);

  // When scheme changes (without match change), reload slots
  useEffect(() => {
    if (!matchId) return;
    getLineup(scheme).then((resp) => {
      if (resp?.lineup) setSlots(resp.lineup);
    });
  }, [scheme]);

  const handleSlotClick = (idx: number) => {
    setSelectedIdx((prev) => (prev === idx ? null : idx));
    setPlayerSearch('');
  };

  const assignPlayer = (playerId: string) => {
    if (selectedIdx === null) return;
    setAssignments((prev) => ({ ...prev, [selectedIdx]: playerId }));
    setSelectedIdx(null);
  };

  const removeAssignment = (idx: number) => {
    setAssignments((prev) => { const n = { ...prev }; delete n[idx]; return n; });
  };

  const handleSave = async () => {
    if (!matchId) { showFlash('Seleccioná un partido primero.', true); return; }
    setSaving(true);
    try {
      const lineup: SavedSlot[] = slots.map((s, i) => ({
        x: s.x,
        y: s.y,
        role: s.role,
        playerId: assignments[i] ?? null,
      }));
      await saveFormationForMatch(matchId, scheme, type, lineup);
      showFlash('✅ Formación guardada.');
    } catch {
      showFlash('Error al guardar la formación.', true);
    } finally {
      setSaving(false);
    }
  };

  const assignedIds = new Set(Object.values(assignments));
  const selectedSlot = selectedIdx !== null ? slots[selectedIdx] : null;

  const filteredPlayers = players.filter((p) => {
    if (!selectedSlot) return false;
    const roleMatch =
      (selectedSlot.role === 'GK' && p.position === 'Goalkeeper') ||
      (selectedSlot.role === 'DEF' && p.position === 'Defender') ||
      (selectedSlot.role === 'MID' && p.position === 'Midfielder') ||
      (selectedSlot.role === 'ATK' && p.position === 'Attacker') ||
      true; // show all if no strict match
    const searchMatch = !playerSearch || p.name.toLowerCase().includes(playerSearch.toLowerCase());
    return searchMatch && roleMatch;
  }).sort((a, b) => {
    // Sort by role match first
    const roleOrder = { GK: 0, DEF: 1, MID: 2, ATK: 3 };
    const getRole = (pos: string) =>
      pos === 'Goalkeeper' ? 0 : pos === 'Defender' ? 1 : pos === 'Midfielder' ? 2 : 3;
    return getRole(a.position) - getRole(b.position);
  });

  const inputClass = 'w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl px-4 py-2.5 text-sm outline-none transition-all';
  const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black mb-1">Gestión de Formaciones</h1>
        <p className="text-sm text-neutral-400">Asigná jugadores a posiciones y guardá la formación probable o confirmada.</p>
      </div>

      {flash && (
        <div className={`p-3 rounded-xl text-sm border ${flash.error ? 'bg-red-950/30 border-red-900/50 text-red-200' : 'bg-green-950/30 border-green-900/50 text-green-200'}`}>
          {flash.msg}
        </div>
      )}

      {/* Configuración */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <label className={labelClass}>Partido</label>
          <select className={inputClass} value={matchId} onChange={(e) => setMatchId(e.target.value)}>
            <option value="">Seleccionar partido…</option>
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.homeTeam} vs {m.awayTeam} — {new Date(m.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Esquema</label>
          <select className={inputClass} value={scheme} onChange={(e) => setScheme(e.target.value)}>
            {SCHEMES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass}>Tipo</label>
          <div className="flex gap-2">
            {(['probable', 'confirmada'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-all border ${
                  type === t
                    ? t === 'confirmada'
                      ? 'bg-green-950/40 border-green-700/50 text-green-400'
                      : 'bg-blue-950/40 border-blue-700/50 text-blue-400'
                    : 'border-neutral-800 text-neutral-500 hover:text-white'
                }`}
              >
                {t === 'confirmada' ? '✅ Confirmada' : '🔵 Probable'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!matchId ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-16 text-center text-neutral-500 text-sm">
          Seleccioná un partido para empezar a armar la formación.
        </div>
      ) : loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-riverRed mx-auto" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">

          {/* Cancha */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-800 text-xs font-bold uppercase tracking-widest text-neutral-400 flex items-center justify-between">
              <span>Cancha — {scheme}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                type === 'confirmada'
                  ? 'bg-green-950/40 border-green-800/40 text-green-400'
                  : 'bg-blue-950/40 border-blue-800/40 text-blue-400'
              }`}>
                {type === 'confirmada' ? 'CONFIRMADA' : 'PROBABLE'}
              </span>
            </div>
            <div className="p-3">
              <svg
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                className="w-full h-auto block"
                style={{ filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.5))' }}
              >
                <defs>
                  <pattern id="stripes-editor" patternUnits="userSpaceOnUse" width="100" height="15">
                    <rect width="100" height="7.5" fill="#0d5c3a" />
                    <rect y="7.5" width="100" height="7.5" fill="#0f6c44" />
                  </pattern>
                </defs>
                <Pitch />
                {slots.map((slot, i) => {
                  const pid = assignments[i];
                  const player = pid ? (players.find((p) => p.id === pid) ?? null) : null;
                  return (
                    <SlotToken
                      key={i}
                      slot={slot}
                      assigned={player}
                      selected={selectedIdx === i}
                      onClick={() => handleSlotClick(i)}
                    />
                  );
                })}
              </svg>
            </div>
            <div className="px-4 pb-4">
              <p className="text-[10px] text-neutral-600 text-center mb-3">Tocá una posición para asignar un jugador</p>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-riverRed hover:bg-red-700 disabled:bg-neutral-800 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-900/20"
              >
                {saving ? 'Guardando…' : '💾 Guardar formación'}
              </button>
            </div>
          </div>

          {/* Panel de jugadores */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-neutral-800">
              {selectedIdx !== null ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">
                      Posición {selectedIdx + 1} — <span className="text-riverRed">{slots[selectedIdx]?.role}</span>
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">Elegí un jugador para esta posición</p>
                  </div>
                  <button onClick={() => { if (selectedIdx !== null) removeAssignment(selectedIdx); setSelectedIdx(null); }}
                    className="text-xs text-neutral-500 hover:text-riverRed border border-neutral-700 hover:border-riverRed px-2 py-1 rounded-lg transition-all flex items-center gap-1">
                    <X className="w-3 h-3" /> Quitar
                  </button>
                </div>
              ) : (
                <p className="text-sm text-neutral-500">← Tocá una posición en la cancha para asignar</p>
              )}
            </div>

            {/* Búsqueda */}
            {selectedIdx !== null && (
              <div className="px-4 pt-3 pb-2">
                <input
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-riverRed text-white rounded-xl px-3 py-2 text-sm outline-none transition-all"
                  placeholder="Buscar jugador…"
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            {/* Lista */}
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-800">
              {selectedIdx === null ? (
                // Show current XI summary
                <div className="p-4 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 mb-3">XI Titular asignado</p>
                  {slots.map((slot, i) => {
                    const pid = assignments[i];
                    const player = pid ? players.find((p) => p.id === pid) : null;
                    return (
                      <div key={i} onClick={() => handleSlotClick(i)}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-800 cursor-pointer transition-all group">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border flex-shrink-0 ${
                          player ? 'bg-riverRed border-red-800' : 'bg-neutral-800 border-neutral-700'
                        }`}>
                          {player?.jersey_number ?? slot.role[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate">{player?.name ?? 'Sin asignar'}</div>
                          <div className="text-[10px] text-neutral-500">{slot.role}</div>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-neutral-600 group-hover:text-riverRed transition-colors rotate-[-90deg]" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                filteredPlayers.map((p) => {
                  const isAssigned = assignedIds.has(p.id) && assignments[selectedIdx] !== p.id;
                  const isCurrent = assignments[selectedIdx] === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => !isAssigned && assignPlayer(p.id)}
                      disabled={isAssigned}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                        isCurrent
                          ? 'bg-riverRed/10 border-l-2 border-riverRed'
                          : isAssigned
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:bg-neutral-800'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 overflow-hidden border ${
                        isCurrent ? 'border-riverRed' : 'border-neutral-700'
                      }`}>
                        {p.photo ? (
                          <img src={p.photo} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-[10px] font-black text-neutral-500">
                            {p.jersey_number ?? '?'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{p.name}</div>
                        <div className="text-[10px] text-neutral-500">{p.position} {p.jersey_number ? `· #${p.jersey_number}` : ''}</div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-riverRed flex-shrink-0" />}
                      {isAssigned && <span className="text-[9px] text-neutral-600 font-bold">YA EN CAMPO</span>}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
