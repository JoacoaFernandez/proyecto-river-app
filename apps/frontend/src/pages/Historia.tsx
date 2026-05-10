// apps/frontend/src/pages/Historia.tsx

/* ─── Datos estáticos ──────────────────────────────────────────────────────── */

const STATS = [
  { label: 'Año de fundación', value: '1901' },
  { label: 'Socios', value: '+100.000' },
  { label: 'Capacidad Monumental', value: '84.567' },
];

interface Trophy {
  name: string;
  count: number;
  years: string;
  icon: string;
  category: 'internacional' | 'nacional' | 'historico';
}

const TROPHIES: Trophy[] = [
  // ── Internacional ─────────────────────────────────────────────────────────
  {
    name: 'Copa Libertadores',
    count: 4,
    years: '1986 · 1996 · 2015 · 2018',
    icon: '🏆',
    category: 'internacional',
  },
  {
    name: 'Copa Sudamericana',
    count: 1,
    years: '2014',
    icon: '🥇',
    category: 'internacional',
  },
  {
    name: 'Copa Intercontinental',
    count: 1,
    years: '1986',
    icon: '🌍',
    category: 'internacional',
  },
  {
    name: 'Recopa Sudamericana',
    count: 3,
    years: '2015 · 2016 · 2019',
    icon: '🏅',
    category: 'internacional',
  },
  {
    name: 'Supercopa Sudamericana',
    count: 1,
    years: '1997',
    icon: '🎖️',
    category: 'internacional',
  },
  {
    name: 'Copa Interamericana',
    count: 1,
    years: '1987',
    icon: '🌎',
    category: 'internacional',
  },
  {
    name: 'Copa J.League-Sudamericana',
    count: 1,
    years: '2015',
    icon: '🎌',
    category: 'internacional',
  },

  // ── Nacional ──────────────────────────────────────────────────────────────
  {
    name: 'Primera División',
    count: 38,
    years: 'Desde 1920',
    icon: '⭐',
    category: 'nacional',
  },
  {
    name: 'Copa Argentina',
    count: 3,
    years: '2016 · 2017 · 2019',
    icon: '🏆',
    category: 'nacional',
  },
  {
    name: 'Supercopa Argentina',
    count: 3,
    years: '2017 · 2019 · 2023',
    icon: '🥈',
    category: 'nacional',
  },
  {
    name: 'Trofeo de Campeones',
    count: 2,
    years: '2021 · 2023',
    icon: '🎯',
    category: 'nacional',
  },

  // ── Histórico ─────────────────────────────────────────────────────────────
  {
    name: 'Copa Aldao',
    count: 5,
    years: '1936 · 1937 · 1941 · 1945 · 1947',
    icon: '📜',
    category: 'historico',
  },
  {
    name: 'Copa Ibarguren',
    count: 4,
    years: '1937 · 1941 · 1942 · 1952',
    icon: '📜',
    category: 'historico',
  },
  {
    name: 'Copa Adrián C. Escobar',
    count: 1,
    years: '1941',
    icon: '📜',
    category: 'historico',
  },
  {
    name: 'Copa de Competencia JC',
    count: 1,
    years: '1914',
    icon: '📜',
    category: 'historico',
  },
  {
    name: 'Copa de Competencia LAF',
    count: 1,
    years: '1932',
    icon: '📜',
    category: 'historico',
  },
  {
    name: 'Cup Tie Competition',
    count: 1,
    years: '1914',
    icon: '📜',
    category: 'historico',
  },
  {
    name: 'Copa Campeonato',
    count: 1,
    years: '2014',
    icon: '📜',
    category: 'historico',
  },
];

interface Idol {
  name: string;
  position: string;
  era: string;
  nickname?: string;
  description: string;
  number?: number;
}

const IDOLS: Idol[] = [
  {
    name: 'Ángel Labruna',
    position: 'Delantero',
    era: '1939 – 1960',
    nickname: 'El Angelito',
    description: 'Máximo ídolo histórico. 515 goles con la banda. Pieza central de La Máquina.',
    number: 9,
  },
  {
    name: 'Amadeo Carrizo',
    position: 'Arquero',
    era: '1945 – 1968',
    nickname: 'El Señor del Arco',
    description: 'Precursor del arquero moderno. Revolucionó la posición con su salida en juego.',
    number: 1,
  },
  {
    name: 'Norberto "Beto" Alonso',
    position: 'Mediocampista',
    era: '1971 – 1984',
    nickname: 'Beto',
    description: 'Genio zurdo de gambeta imposible. Símbolo de los tricampeonatos del 75.',
    number: 10,
  },
  {
    name: 'Ramón Díaz',
    position: 'Delantero',
    era: '1977 – 1988',
    nickname: 'El Tolo',
    description: 'Goleador de los 80. Luego DT de River en dos etapas, ganando varios campeonatos.',
    number: 9,
  },
  {
    name: 'Enzo Francescoli',
    position: 'Mediocampista',
    era: '1994 – 1997',
    nickname: 'El Príncipe',
    description: 'Uruguayo elegante y técnico. Ídolo máximo de Zidane. Tetracampeón con River.',
    number: 10,
  },
  {
    name: 'Marcelo Gallardo',
    position: 'Mediocampista',
    era: '1994 – 2009',
    nickname: 'El Muñeco',
    description: 'Jugador y luego el DT más exitoso de la historia del club. Ganó la Copa Sudamericana 2014 y las Libertadores 2015 y 2018 como entrenador.',
    number: 10,
  },
  {
    name: 'Ariel Ortega',
    position: 'Mediocampista',
    era: '1993 – 2008',
    nickname: 'El Burrito',
    description: 'Endemoniado zurdo de habilidad única. Referente de las últimas décadas del siglo XX.',
    number: 7,
  },
  {
    name: 'Radamel Falcao García',
    position: 'Delantero',
    era: '2005 – 2009',
    nickname: 'El Tigre',
    description: 'Goleador colombiano que despegó su carrera en River antes de brillar en Europa.',
    number: 9,
  },
];

interface Moment {
  year: string;
  title: string;
  description: string;
  highlight?: boolean;
}

const TIMELINE: Moment[] = [
  {
    year: '1901',
    title: 'Fundación del Club',
    description: 'El 25 de mayo, un grupo de jóvenes del barrio de La Boca funda el Club Atlético River Plate.',
  },
  {
    year: '1923',
    title: 'Llegada a Núñez',
    description: 'El club se traslada al barrio de Núñez, donde construirá su identidad definitiva.',
  },
  {
    year: '1938',
    title: 'Inauguración del Monumental',
    description: 'Se inaugura el Estadio Monumental Antonio Vespucio Liberti, el más grande de Argentina.',
  },
  {
    year: '1941–47',
    title: 'La Máquina',
    description:
      'El equipo más recordado de la historia. Labruna, Moreno, Pedernera, Muñoz y Loustau arrasaron al fútbol argentino.',
    highlight: true,
  },
  {
    year: '1975',
    title: 'Tricampeonato',
    description: 'Con Beto Alonso como figura, River gana tres títulos en el año: Nacional, Metropolitano y Nacional.',
    highlight: true,
  },
  {
    year: '1986',
    title: 'Primera Copa Libertadores',
    description:
      'Bajo la conducción de Héctor Veira, River vence a América de Cali y conquista su primera Libertadores. Luego derrota al Steaua de Bucarest y gana la Copa Intercontinental.',
    highlight: true,
  },
  {
    year: '1993–97',
    title: 'Quinteto de oro',
    description:
      'La era dorada de Francescoli, Ortega, Crespo y Gallardo. River gana 5 campeonatos argentinos y conquista su segunda Copa Libertadores en 1996 venciendo a América de Cali.',
    highlight: true,
  },
  {
    year: '2014',
    title: 'Copa Sudamericana',
    description:
      'Primer año de Marcelo Gallardo como DT. River vence a Atlético Nacional en la final y conquista su primera Copa Sudamericana.',
    highlight: true,
  },
  {
    year: '2015',
    title: 'Copa Libertadores — La Tercera',
    description:
      'Bajo el mando de Gallardo, River vence a Tigres de México 3-0 en la final y conquista su tercera Copa Libertadores.',
    highlight: true,
  },
  {
    year: '2018',
    title: 'La Final del Mundo',
    description:
      'En el Bernabéu de Madrid, River vence a Boca Juniors 3-1 en el partido más visto de la historia del fútbol argentino. Cuarta Copa Libertadores.',
    highlight: true,
  },
];

/* ─── Componentes ──────────────────────────────────────────────────────────── */

function TrophyCard({ t }: { t: Trophy }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col gap-2 hover:border-neutral-700 transition-colors">
      <div className="text-3xl">{t.icon}</div>
      <div className="text-4xl font-black text-riverRed tabular-nums leading-none">{t.count}</div>
      <div className="font-bold text-sm text-white leading-tight">{t.name}</div>
      <div className="text-[11px] text-neutral-500 leading-snug">{t.years}</div>
    </div>
  );
}

function IdolCard({ idol }: { idol: Idol }) {
  const initials = idol.name
    .split(' ')
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col gap-3 hover:border-riverRed/40 transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 shrink-0 rounded-full bg-riverRed/15 border border-riverRed/30 flex items-center justify-center">
          <span className="text-riverRed font-black text-lg">{initials}</span>
        </div>
        <div className="min-w-0">
          <div className="font-black text-sm leading-tight">{idol.name}</div>
          {idol.nickname && (
            <div className="text-riverRed text-xs font-bold mt-0.5">"{idol.nickname}"</div>
          )}
          <div className="text-[11px] text-neutral-500 mt-1">
            {idol.position} · {idol.era}
          </div>
        </div>
        {idol.number && (
          <div className="ml-auto text-3xl font-black text-neutral-700 tabular-nums shrink-0">
            {idol.number}
          </div>
        )}
      </div>
      <p className="text-xs text-neutral-400 leading-relaxed border-t border-neutral-800 pt-3">
        {idol.description}
      </p>
    </div>
  );
}

function TimelineItem({ moment, isLast }: { moment: Moment; isLast: boolean }) {
  return (
    <div className="flex gap-4">
      {/* Línea vertical + punto */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`w-3.5 h-3.5 rounded-full border-2 mt-1 shrink-0 ${
            moment.highlight
              ? 'bg-riverRed border-riverRed shadow-md shadow-red-900/50'
              : 'bg-neutral-800 border-neutral-600'
          }`}
        />
        {!isLast && <div className="w-px flex-1 bg-neutral-800 mt-1" />}
      </div>

      {/* Contenido */}
      <div className={`pb-8 ${isLast ? 'pb-0' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`text-xs font-black tabular-nums px-2 py-0.5 rounded ${
              moment.highlight
                ? 'bg-riverRed/20 text-riverRed'
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            {moment.year}
          </span>
          <span className="font-bold text-sm">{moment.title}</span>
        </div>
        <p className="text-xs text-neutral-400 leading-relaxed">{moment.description}</p>
      </div>
    </div>
  );
}

/* ─── Página principal ─────────────────────────────────────────────────────── */

export default function Historia() {
  const internacionales = TROPHIES.filter((t) => t.category === 'internacional');
  const nacionales = TROPHIES.filter((t) => t.category === 'nacional');
  const historicos = TROPHIES.filter((t) => t.category === 'historico');
  const totalTitles = TROPHIES.reduce((acc, t) => acc + t.count, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 mt-8 space-y-10 pb-12">
      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-red-950/30 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-8 shadow-2xl text-center">
        <div className="inline-block bg-red-950/40 text-riverRed border border-red-900/50 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
          El más grande
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-2 leading-tight">
          Historia de<br />
          <span className="text-riverRed">River Plate</span>
        </h1>
        <p className="text-neutral-400 text-sm max-w-xl mx-auto mt-3 leading-relaxed">
          Más de un siglo de gloria, pasión y títulos. El club con más socios de Argentina
          y referente del fútbol sudamericano.
        </p>

        <div className="grid grid-cols-3 gap-4 mt-8 max-w-lg mx-auto">
          {STATS.map((s) => (
            <div key={s.label} className="bg-neutral-950/60 rounded-2xl py-4 px-2">
              <div className="text-xl md:text-2xl font-black text-white">{s.value}</div>
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider mt-1 leading-tight">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 inline-block bg-riverRed/10 border border-riverRed/30 rounded-2xl px-6 py-3">
          <span className="text-4xl font-black text-riverRed">{totalTitles}</span>
          <span className="text-sm text-neutral-400 ml-2">títulos oficiales</span>
        </div>
      </section>

      {/* ── Palmarés Internacional ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
            Palmarés Internacional
          </h2>
          <p className="text-[11px] text-neutral-600 mt-0.5">Títulos continentales y mundiales</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {internacionales.map((t) => (
            <TrophyCard key={t.name} t={t} />
          ))}
        </div>
      </section>

      {/* ── Palmarés Nacional ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
            Palmarés Nacional
          </h2>
          <p className="text-[11px] text-neutral-600 mt-0.5">Títulos en el fútbol argentino</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {nacionales.map((t) => (
            <TrophyCard key={t.name} t={t} />
          ))}
        </div>
      </section>

      {/* ── Copas Históricas ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
            Copas Históricas
          </h2>
          <p className="text-[11px] text-neutral-600 mt-0.5">Torneos de la era amateur y primeros años profesionales</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {historicos.map((t) => (
            <TrophyCard key={t.name} t={t} />
          ))}
        </div>
      </section>

      {/* ── Timeline + Ídolos (columnas en desktop) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6 items-start">
        {/* Timeline */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
              Momentos históricos
            </h2>
            <p className="text-[11px] text-neutral-600 mt-0.5">Los hitos que marcaron la historia</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            {TIMELINE.map((m, i) => (
              <TimelineItem key={m.year} moment={m} isLast={i === TIMELINE.length - 1} />
            ))}
          </div>
        </section>

        {/* Ídolos */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
              Ídolos
            </h2>
            <p className="text-[11px] text-neutral-600 mt-0.5">Las leyendas que vistieron la banda</p>
          </div>
          <div className="space-y-3">
            {IDOLS.map((idol) => (
              <IdolCard key={idol.name} idol={idol} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
