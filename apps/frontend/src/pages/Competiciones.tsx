// apps/frontend/src/pages/Competiciones.tsx
import { useEffect, useMemo, useState } from 'react';
import {
  getCompetitions,
  getStandings,
  type Competition,
  type PlayoffMatch,
  type PlayoffSeed,
  type PlayoffsBracket,
  type StandingRow,
  type StandingsGroup,
} from '../services/competitions.service';

const RIVER_RX = /river\s*plate|^river$/i;

function zoneFor(
  pos: number,
  totalRows: number,
  advanceTop: number,
): { color: string; label: string } | null {
  if (advanceTop <= 3) {
    // Grupos de Copa: Top 2 avanzan al Round of 16
    if (pos <= 2) return { color: 'bg-green-500/10 border-l-2 border-green-500', label: 'R16' };
    return null;
  }
  // Liga Argentina
  if (pos <= advanceTop) return { color: 'bg-green-500/10 border-l-2 border-green-500', label: 'Octavos' };
  if (totalRows >= 15 && pos > totalRows - 4)
    return { color: 'bg-red-500/10 border-l-2 border-red-500', label: 'Descenso' };
  return null;
}

function isRiver(team: string | undefined | null): boolean {
  return !!team && RIVER_RX.test(team);
}

function ZoneTable({ group, advanceTop = 8 }: { group: StandingsGroup; advanceTop?: number }) {
  const totalRows = group.standings.length;
  const hasRiver = group.standings.some((r) => isRiver(r.team));
  return (
    <div
      className={`bg-neutral-900 border rounded-2xl overflow-hidden ${
        hasRiver ? 'border-riverRed/50 shadow-lg shadow-red-900/20' : 'border-neutral-800'
      }`}
    >
      <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
        <h3 className="font-black tracking-wide uppercase text-sm">
          {group.name}
          {hasRiver && (
            <span className="ml-2 text-[10px] text-riverRed font-bold uppercase">· River</span>
          )}
        </h3>
        <span className="text-[10px] text-neutral-500">{totalRows} equipos</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold border-b border-neutral-800">
              <th className="text-center py-3 px-2 w-10">#</th>
              <th className="text-left py-3 px-2">Equipo</th>
              <th className="text-center py-3 px-2 w-10">PJ</th>
              <th className="text-center py-3 px-2 w-10">G</th>
              <th className="text-center py-3 px-2 w-10">E</th>
              <th className="text-center py-3 px-2 w-10">P</th>
              <th className="text-center py-3 px-2 w-10">DG</th>
              <th className="text-center py-3 px-2 w-12 text-riverRed">Pts</th>
            </tr>
          </thead>
          <tbody>
            {group.standings.map((row: StandingRow) => {
              const river = isRiver(row.team);
              const zone = zoneFor(row.pos, totalRows, advanceTop);
              return (
                <tr
                  key={`${group.key}-${row.pos}-${row.team}`}
                  className={`border-b border-neutral-800/50 last:border-0 transition-colors hover:bg-neutral-800/40 ${
                    river ? 'bg-red-950/40 font-bold' : zone?.color ?? ''
                  }`}
                >
                  <td className={`text-center py-2.5 px-2 tabular-nums ${river ? 'text-riverRed' : 'text-neutral-500'}`}>
                    {row.pos}
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {row.teamLogo && (
                        <img
                          src={row.teamLogo}
                          alt=""
                          className="w-5 h-5 object-contain flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <span className={`truncate ${river ? 'text-white' : ''}`}>{row.team}</span>
                    </div>
                  </td>
                  <td className="text-center py-2.5 px-2 tabular-nums">{row.pj}</td>
                  <td className="text-center py-2.5 px-2 tabular-nums text-green-400">{row.pg}</td>
                  <td className="text-center py-2.5 px-2 tabular-nums text-yellow-400">{row.pe}</td>
                  <td className="text-center py-2.5 px-2 tabular-nums text-red-400">{row.pp}</td>
                  <td
                    className={`text-center py-2.5 px-2 tabular-nums ${
                      row.dif > 0 ? 'text-green-400' : row.dif < 0 ? 'text-red-400' : 'text-neutral-400'
                    }`}
                  >
                    {row.dif > 0 ? '+' : ''}
                    {row.dif}
                  </td>
                  <td className={`text-center py-2.5 px-2 tabular-nums font-black ${river ? 'text-riverRed' : 'text-white'}`}>
                    {row.pts}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BracketSide({
  side,
  isWinner,
  isLoser,
  score,
}: {
  side: PlayoffSeed | null;
  isWinner: boolean;
  isLoser: boolean;
  score: number | null;
}) {
  if (!side) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-neutral-500">
        <span className="w-4 h-4 rounded-full border border-neutral-700 flex-shrink-0" />
        <span className="italic text-sm flex-1 truncate">A confirmar</span>
        <span className="w-6 text-right text-xs tabular-nums text-neutral-700">—</span>
      </div>
    );
  }

  const river = isRiver(side.team);

  let textCls = 'text-neutral-200';
  if (isWinner) textCls = 'text-green-400 font-bold';
  else if (isLoser) textCls = 'text-neutral-500 line-through decoration-neutral-700';
  else if (river) textCls = 'text-white font-semibold';

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 ${
        river && !isLoser ? 'bg-red-950/30' : ''
      }`}
    >
      {side.teamLogo ? (
        <img
          src={side.teamLogo}
          alt=""
          className={`w-4 h-4 object-contain flex-shrink-0 ${isLoser ? 'opacity-40' : ''}`}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <span className="w-4 h-4 rounded-full bg-neutral-700 flex-shrink-0" />
      )}
      <span className={`text-sm flex-1 truncate ${textCls}`}>{side.team}</span>
      <span
        className={`w-6 text-right text-sm tabular-nums ${
          isWinner ? 'text-green-400 font-bold' : isLoser ? 'text-neutral-500' : 'text-neutral-300'
        }`}
      >
        {score != null ? score : '—'}
      </span>
    </div>
  );
}

function BracketCard({ match }: { match: PlayoffMatch }) {
  const finished = match.status === 'finished';
  const homeWon = finished && match.winner === 'home';
  const awayWon = finished && match.winner === 'away';
  const homeLost = finished && match.winner === 'away';
  const awayLost = finished && match.winner === 'home';

  const hasRiver = isRiver(match.home?.team) || isRiver(match.away?.team);

  return (
    <div
      className={`bg-neutral-900 border rounded-lg overflow-hidden divide-y divide-neutral-800 ${
        hasRiver ? 'border-riverRed/50 shadow-md shadow-red-900/20' : 'border-neutral-800'
      }`}
    >
      <BracketSide
        side={match.home}
        isWinner={homeWon}
        isLoser={homeLost}
        score={match.homeScore}
      />
      <BracketSide
        side={match.away}
        isWinner={awayWon}
        isLoser={awayLost}
        score={match.awayScore}
      />
      {match.penaltyDecided && finished && (
        <div className="px-3 py-1 text-[10px] text-yellow-500/80 text-center">
          definido por penales
        </div>
      )}
    </div>
  );
}

function BracketColumn({ title, matches }: { title: string; matches: PlayoffMatch[] }) {
  return (
    <div className="flex-1 min-w-[200px] flex flex-col">
      <div className="text-[11px] uppercase tracking-widest font-black text-neutral-400 text-center pb-3 border-b border-neutral-800 mb-3">
        {title}
      </div>
      <div className="flex-1 flex flex-col justify-around gap-3">
        {matches.map((m) => (
          <BracketCard key={`${m.round}-${m.slot}`} match={m} />
        ))}
      </div>
    </div>
  );
}

function Bracket({ data }: { data: PlayoffsBracket }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="text-xl font-black tracking-wide uppercase">Cuadro de Playoffs</h2>
        <p className="text-xs text-neutral-500 mt-1">{data.format}</p>
      </div>

      <div className="overflow-x-auto -mx-5 px-5">
        <div className="flex gap-4 min-w-[820px]">
          <BracketColumn title="Octavos de Final" matches={data.rounds.octavos} />
          <BracketColumn title="Cuartos de Final" matches={data.rounds.cuartos} />
          <BracketColumn title="Semifinales" matches={data.rounds.semis} />
          <BracketColumn title="Final" matches={data.rounds.final} />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-[11px] text-neutral-500 pt-2 border-t border-neutral-800">
        <span>
          <span className="inline-block w-3 h-3 bg-green-400/30 border border-green-400/40 rounded-sm align-middle mr-1.5" />
          Ganador
        </span>
        <span>
          <span className="inline-block w-3 h-3 bg-neutral-800 border border-neutral-700 rounded-sm align-middle mr-1.5" />
          Pendiente / A confirmar
        </span>
        <span>
          <span className="inline-block w-3 h-3 bg-red-950/40 border border-riverRed/50 rounded-sm align-middle mr-1.5" />
          Cruce de River
        </span>
      </div>
    </div>
  );
}

export default function Competiciones() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [groups, setGroups] = useState<StandingsGroup[]>([]);
  const [playoffs, setPlayoffs] = useState<PlayoffsBracket | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingStandings, setLoadingStandings] = useState(false);

  useEffect(() => {
    setLoadingList(true);
    getCompetitions().then((list) => {
      setCompetitions(list);
      const def = list.find((c) => c.hasStandings) ?? list[0] ?? null;
      setSelected(def?.code ?? null);
      setLoadingList(false);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoadingStandings(true);
    getStandings(selected)
      .then((res) => {
        setGroups(res?.groups ?? []);
        setPlayoffs(res?.playoffs ?? null);
      })
      .finally(() => setLoadingStandings(false));
  }, [selected]);

  const selectedMeta = competitions.find((c) => c.code === selected) ?? null;
  const isCopa = selectedMeta?.type === 'cup';
  const advanceTop = isCopa ? 2 : 8;

  const orderedGroups = useMemo(() => {
    if (groups.length < 2) return groups;
    const idxRiver = groups.findIndex((g) => g.standings.some((r) => isRiver(r.team)));
    if (idxRiver <= 0) return groups;
    const reordered = [...groups];
    const [riverGroup] = reordered.splice(idxRiver, 1);
    reordered.unshift(riverGroup);
    return reordered;
  }, [groups]);

  return (
    <div className="max-w-6xl mx-auto px-4 mt-6 pb-12 space-y-6">
      <div className="border-b border-neutral-800 pb-4">
        <h1 className="text-2xl font-black tracking-wide uppercase">Competiciones</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Tabla de posiciones y formato de los torneos en los que juega River.
        </p>
      </div>

      {loadingList ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-riverRed mx-auto"></div>
        </div>
      ) : competitions.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center text-sm text-neutral-500">
          No hay competiciones configuradas todavía.
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {competitions.map((c) => {
              const active = selected === c.code;
              return (
                <button
                  key={c.code}
                  onClick={() => setSelected(c.code)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-riverRed text-white shadow-lg shadow-red-900/30'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-riverRed hover:text-white'
                  }`}
                >
                  {c.shortName}
                </button>
              );
            })}
          </div>

          {selectedMeta && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-xl font-black">{selectedMeta.name}</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {selectedMeta.country} · {selectedMeta.type === 'league' ? 'Liga' : 'Copa'}
                  </p>
                </div>
                {selectedMeta.hasStandings && orderedGroups.length > 0 && (
                  <span className="text-xs text-neutral-500">
                    {orderedGroups.length === 1
                      ? `${orderedGroups[0].standings.length} equipos`
                      : `${orderedGroups.length} ${isCopa ? 'grupos' : 'zonas'} · ${orderedGroups.reduce(
                          (acc, g) => acc + g.standings.length,
                          0,
                        )} equipos`}
                  </span>
                )}
              </div>
            </div>
          )}

          {loadingStandings ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-riverRed mx-auto"></div>
              <p className="text-neutral-400 text-sm mt-3">Cargando tabla…</p>
            </div>
          ) : !selectedMeta?.hasStandings ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-3">🏆</div>
              <h3 className="font-bold mb-2">{selectedMeta?.name}</h3>
              <p className="text-sm text-neutral-400 max-w-md mx-auto">
                Esta competición se juega en formato de copa con fase de grupos y eliminatorias. La
                tabla de grupos y el bracket eliminatorio van a estar disponibles próximamente.
              </p>
            </div>
          ) : orderedGroups.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center text-sm text-neutral-500">
              No pudimos traer la tabla en este momento. Reintentá en un rato.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500/40 border-l-2 border-green-500"></div>
                  <span className="text-neutral-400">
                    {isCopa ? 'Clasifican al Round of 16 (Top 2 por grupo)' : 'Clasifican a octavos (Top 8)'}
                  </span>
                </div>
                {!isCopa && orderedGroups.some((g) => g.standings.length >= 15) && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500/40 border-l-2 border-red-500"></div>
                    <span className="text-neutral-400">Zona de descenso (orientativo)</span>
                  </div>
                )}
              </div>

              <div
                className={`grid gap-4 ${
                  orderedGroups.length >= 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
                }`}
              >
                {orderedGroups.map((g) => (
                  <ZoneTable key={g.key} group={g} advanceTop={advanceTop} />
                ))}
              </div>

              {playoffs && <Bracket data={playoffs} />}
            </>
          )}
        </>
      )}
    </div>
  );
}
