// apps/frontend/src/pages/Historia.tsx
import { useState } from 'react';

/* ─── Palmarés ─────────────────────────────────────────────────────────────── */

interface TrophyGroup {
  category: string;
  subtitle: string;
  items: { name: string; count: number; years: number[] | string; icon: string }[];
}

const PALMARES: TrophyGroup[] = [
  {
    category: 'Internacional',
    subtitle: 'Títulos continentales y mundiales',
    items: [
      { name: 'Copa Libertadores',      count: 4, icon: '🏆', years: [1986, 1996, 2015, 2018] },
      { name: 'Copa Intercontinental',  count: 1, icon: '🌍', years: [1986] },
      { name: 'Copa Sudamericana',      count: 1, icon: '🥇', years: [2014] },
      { name: 'Recopa Sudamericana',    count: 3, icon: '🏅', years: [2015, 2016, 2019] },
      { name: 'Supercopa Sudamericana', count: 1, icon: '🎖️', years: [1997] },
      { name: 'Copa Interamericana',    count: 1, icon: '🌎', years: [1987] },
      { name: 'Copa J.League-CONMEBOL', count: 1, icon: '🎌', years: [2015] },
    ],
  },
  {
    category: 'Nacional',
    subtitle: 'Títulos en el fútbol argentino',
    items: [
      {
        name: 'Primera División', count: 38, icon: '⭐',
        years: [1920,1932,1936,1937,1941,1942,1945,1947,1952,1953,1955,1956,1957,
                1966,1969,1972,1975,1975,1977,1979,1980,1981,1986,1990,1991,1993,
                1994,1996,1997,1999,2002,2003,2004,2008,2014,2021,2023,2024],
      },
      { name: 'Copa Argentina',      count: 3, icon: '🏆', years: [2016, 2017, 2019] },
      { name: 'Supercopa Argentina', count: 3, icon: '🥈', years: [2017, 2019, 2023] },
      { name: 'Trofeo de Campeones', count: 2, icon: '🎯', years: [2021, 2023] },
    ],
  },
  {
    category: 'Copas Históricas',
    subtitle: 'Torneos de la era amateur y primeros años profesionales',
    items: [
      { name: 'Copa Aldao',              count: 5, icon: '📜', years: [1936,1937,1941,1945,1947] },
      { name: 'Copa Ibarguren',          count: 4, icon: '📜', years: [1937,1941,1942,1952] },
      { name: 'Copa Adrián C. Escobar',  count: 1, icon: '📜', years: [1941] },
      { name: 'Copa de Competencia JC',  count: 1, icon: '📜', years: [1914] },
      { name: 'Copa de Competencia LAF', count: 1, icon: '📜', years: [1932] },
      { name: 'Cup Tie Competition',     count: 1, icon: '📜', years: [1914] },
      { name: 'Copa Campeonato',         count: 1, icon: '📜', years: [2014] },
    ],
  },
];

/* ─── Ídolos ────────────────────────────────────────────────────────────────── */

interface Idol {
  name: string;
  lastName: string;
  position: string;
  era: string;
  nickname: string;
  description: string;
  number: number;
  goals?: number;
  apps?: number;
  titles?: number;
  accentColor: string;
  facts: string[];
}

const IDOLS: Idol[] = [
  {
    name: 'Ángel', lastName: 'Labruna',
    position: 'Delantero', era: '1939 – 1960', nickname: 'El Angelito', number: 9,
    goals: 293, apps: 515, titles: 6,
    accentColor: '#E30613',
    description: 'Máximo goleador histórico del club y pieza central de La Máquina. Jugó 21 temporadas seguidas con la banda y luego fue DT campeón.',
    facts: [
      '293 goles en 515 partidos oficiales',
      'Campeón en 5 ligas como jugador y 1 como DT',
      'Referente de La Máquina junto a Pedernera y Moreno',
      'Elegido en el equipo ideal de la historia de Argentina',
    ],
  },
  {
    name: 'Amadeo', lastName: 'Carrizo',
    position: 'Arquero', era: '1945 – 1968', nickname: 'El Señor del Arco', number: 1,
    apps: 520, titles: 6,
    accentColor: '#1a3a8f',
    description: 'Precursor del arquero moderno: salía a cortar centros, usaba las manos fuera del área y comandaba la defensa antes de que se inventaran los términos para eso.',
    facts: [
      '520 partidos oficiales con River, récord histórico del club',
      'Convocado al Seleccionado argentino más de 20 años',
      'Pionero del uso de guantes en América del Sur',
      'Considerado el mejor arquero de la historia de Argentina del siglo XX',
    ],
  },
  {
    name: 'Norberto', lastName: 'Alonso',
    position: 'Mediocampista', era: '1971 – 1984', nickname: '"Beto"', number: 10,
    goals: 105, apps: 388, titles: 8,
    accentColor: '#E30613',
    description: 'Zurdo de fantasía imposible. Símbolo del tricampeonato del 75 y referente indiscutido de toda una generación de hinchas millonarios.',
    facts: [
      '388 partidos, 105 goles como mediocampista',
      'Figura del histórico tricampeonato de 1975',
      'Ídolo de la Copa Libertadores 1976 (finalista)',
      'Elegido en el equipo ideal de la liga argentina de los 70',
    ],
  },
  {
    name: 'Enzo', lastName: 'Francescoli',
    position: 'Mediocampista', era: '1994 – 1997', nickname: 'El Príncipe', number: 10,
    goals: 51, apps: 154, titles: 5,
    accentColor: '#8B5CF6',
    description: 'Uruguayo de elegancia única, fue el jugador más completo que pasó por el club en los 90. Zidane lo idolatraba y nombró a su hijo "Enzo" en su honor.',
    facts: [
      '51 goles en 154 partidos, impresionante para mediocampista',
      'Campeón de la Copa Libertadores 1996',
      'Zinedine Zidane lo eligió como su ídolo máximo',
      'Tres veces Mejor Jugador de Sudamérica',
    ],
  },
  {
    name: 'Marcelo', lastName: 'Gallardo',
    position: 'Mediocampista / DT', era: '1994 – presente', nickname: 'El Muñeco', number: 10,
    goals: 70, apps: 330, titles: 16,
    accentColor: '#D97706',
    description: 'La figura más importante de la historia moderna del club. Como jugador, capitán y símbolo. Como DT, el más ganador de todos los tiempos con 14 títulos, incluyendo 2 Copa Libertadores.',
    facts: [
      '14 títulos como DT (2014–2022), récord absoluto del club',
      'Único técnico en ganar 2 Libertadores con River (2015 y 2018)',
      'Como jugador: 330 partidos y 70 goles',
      'Regresó como DT en 2024, sumando más conquistas',
    ],
  },
  {
    name: 'Ariel', lastName: 'Ortega',
    position: 'Mediocampista', era: '1993 – 2008', nickname: 'El Burrito', number: 7,
    goals: 88, apps: 357, titles: 7,
    accentColor: '#059669',
    description: 'Endemoniado zurdo salteño con tres etapas en River. Poseía una técnica deslumbrante y un desequilibrio individual fuera de serie.',
    facts: [
      '357 partidos en tres etapas diferentes en el club',
      'Cuatro veces campeón nacional con River',
      'Figura del Mundial 1998 con Argentina (cuartos de final)',
      'Catalogado como uno de los mejores gambeteadores de su generación',
    ],
  },
  {
    name: 'Ramón', lastName: 'Díaz',
    position: 'Delantero', era: '1977 – 1988', nickname: 'El Tolo', number: 9,
    goals: 152, apps: 338, titles: 5,
    accentColor: '#E30613',
    description: 'Goleador despiadado de los 80. Luego DT de River en dos etapas ganando varios títulos. Padre de Emiliano Díaz y constructor de una dinastía futbolística.',
    facts: [
      '152 goles en 338 partidos, segundo goleador histórico',
      'Figura del Mundial 1982 con Argentina (cuartos de final)',
      'Como DT ganó más de 5 títulos nacionales con River',
      'Elegido en el equipo del siglo del fútbol argentino',
    ],
  },
  {
    name: 'Radamel', lastName: 'Falcao',
    position: 'Delantero', era: '2005 – 2009', nickname: 'El Tigre', number: 9,
    goals: 50, apps: 95, titles: 1,
    accentColor: '#DC2626',
    description: 'Goleador colombiano que despegó su carrera en River antes de convertirse en uno de los mejores delanteros del mundo en el Atlético de Madrid y el Monaco.',
    facts: [
      '50 goles en 95 partidos: uno cada dos partidos',
      'Surgido en las inferiores de River antes de explotar en Europa',
      'Máximo goleador de la Liga Europa 2011-12 con Atlético de Madrid',
      'Ídolo colombiano forjado en el Monumental',
    ],
  },
];

/* ─── Estadios ──────────────────────────────────────────────────────────────── */

interface Stadium {
  name: string;
  shortName: string;
  location: string;
  years: string;
  capacity: string;
  description: string;
  facts: string[];
  recordMatch?: string;
  recordAttendance?: string;
  isMain?: boolean;
}

const STADIUMS: Stadium[] = [
  {
    name: 'Estadio Isla Maciel',
    shortName: '1901 – 1908',
    location: 'La Boca, Buenos Aires',
    years: '1901 – 1908',
    capacity: 'Sin datos',
    description: 'Campo improvisado en el barrio obrero de La Boca donde River nació y creció sus primeros 7 años. Sin infraestructura formal, sin tribunas, sin vestuarios.',
    facts: [
      'El club se fundó el 25 de mayo de 1901 en este barrio',
      'Los colores originales de River eran blanco y negro',
      'Se compartía el espacio con otros clubes del barrio',
      'La rivalidad con Boca comenzó aquí, en el mismo barrio',
    ],
  },
  {
    name: 'Estadio Alvear y Tagle',
    shortName: '1908 – 1923',
    location: 'Recoleta, Buenos Aires',
    years: '1908 – 1923',
    capacity: '~10.000',
    description: 'Primer estadio con estructura más consolidada. River comenzó a captar hinchas de clase media y a diferenciarse socialmente de Boca, forjando el apodo "Los Millonarios".',
    facts: [
      'Aquí River adoptó definitivamente la banda roja diagonal',
      'La inspiración fue la camiseta de un marinero inglés',
      'El apodo "millonarios" nació por el pago por un jugador en esta época',
      'Fue la base para la profesionalización del club',
    ],
  },
  {
    name: 'Estadio Muñiz',
    shortName: '1923 – 1938',
    location: 'Núñez, Buenos Aires',
    years: '1923 – 1938',
    capacity: '~35.000',
    description: 'Estadio de transición hacia la grandeza. Escenario de los primeros campeonatos nacionales y de los años dorados del fútbol amateur argentino.',
    facts: [
      'Aquí River ganó sus primeros 8 campeonatos nacionales',
      'Se construyó la primera tribuna cubierta permanente',
      'Capacidad para 35.000 espectadores, récord para la época',
      'Base del equipo que se convirtió en bicampeón en 1937',
    ],
    recordAttendance: '~35.000',
    recordMatch: 'Clásico vs Boca Juniors, 1936',
  },
  {
    name: 'Estadio Monumental A. V. Liberti',
    shortName: '1938 – Hoy',
    location: 'Núñez, Buenos Aires',
    years: '1938 – Presente',
    capacity: '84.567',
    description: 'El estadio más grande de Argentina y de América del Sur. Remodelado entre 2019 y 2022, se convirtió en el primero en el continente con todas sus tribunas techadas. Sede del Mundial 2030.',
    facts: [
      'Inaugurado el 26 de mayo de 1938 con victoria 3-0 sobre Peñarol',
      'Sede de la Final del Mundial 1978: Argentina 3 – Países Bajos 1',
      'Remodelado en 2022: capacidad ampliada a 84.567 plazas',
      'Primer estadio de América con 100% de tribuna techada',
      'Sede confirmada del Mundial 2030 (centenario del primer Mundial)',
    ],
    recordAttendance: '84.567',
    recordMatch: 'Ampliación 2022 — lleno total vs Liga Profesional',
    isMain: true,
  },
];

/* ─── Línea de tiempo ───────────────────────────────────────────────────────── */

interface Moment {
  year: string;
  title: string;
  short: string;
  detail: string;
  type: 'trophy' | 'milestone' | 'stadium' | 'era';
}

const TIMELINE: Moment[] = [
  {
    year: '1901', type: 'milestone',
    title: 'Fundación',
    short: 'Nace el Club Atlético River Plate en La Boca.',
    detail: 'El 25 de mayo de 1901, jóvenes de dos equipos barriales ("La Rosales" y "Santa Rosa") fundan el club en el barrio obrero de La Boca. Eligen el nombre "River Plate" como traducción inglesa de Río de la Plata. Sus colores originales eran el blanco y negro.',
  },
  {
    year: '1923', type: 'milestone',
    title: 'Llegada a Núñez',
    short: 'El club se muda al barrio de Núñez, donde permanecerá para siempre.',
    detail: 'El traslado al norte de la ciudad marca el inicio de una nueva identidad. River comienza a captar hinchas de clase media y alta. En esta época adopta definitivamente la banda roja diagonal, inspirada en la camiseta de un marinero inglés que se encontraron los socios del club.',
  },
  {
    year: '1931', type: 'milestone',
    title: 'Era profesional',
    short: 'River se suma al primer torneo profesional de Argentina.',
    detail: 'Al tornarse profesional el fútbol argentino, River fue uno de los clubes que apostó más fuerte al mercado de jugadores. Pagó sumas que para la época eran exorbitantes, lo que terminó de acuñar el apodo "Los Millonarios", que originalmente fue una burla de rivales.',
  },
  {
    year: '1938', type: 'stadium',
    title: 'Nace el Monumental',
    short: 'Se inaugura el estadio más grande de Argentina.',
    detail: 'El 26 de mayo de 1938, River venció a Peñarol de Uruguay 3-0 en el partido inaugural del Estadio Monumental Antonio Vespucio Liberti. El estadio fue diseñado para ser el más grande del país y tardó décadas en completar todas sus etapas de construcción.',
  },
  {
    year: '1941–47', type: 'era',
    title: 'La Máquina',
    short: 'El equipo más recordado de la historia del fútbol argentino.',
    detail: 'Labruna, Moreno, Pedernera, Muñoz y Loustau formaban una delantera de fantasía que arrasó el fútbol argentino durante casi una década. El periodista Borocotó los bautizó "La Máquina" al ver cómo funcionaban como piezas perfectas de un mecanismo. Anticiparon el fútbol de toque moderno décadas antes que los europeos.',
  },
  {
    year: '1975', type: 'trophy',
    title: 'Tricampeonato',
    short: 'River gana tres títulos nacionales en un mismo año.',
    detail: 'Con Beto Alonso como figura y Ángel Labruna —ex jugador de La Máquina— como DT, River ganó el Metropolitano, el Nacional y el Nacional en el mismo año 1975. Una hazaña irrepetible en el fútbol argentino. Fue la última gran generación antes de la era Gallardo.',
  },
  {
    year: '1978', type: 'milestone',
    title: 'El Monumental y el Mundial',
    short: 'La Final del Mundial 1978 se juega en el estadio de River.',
    detail: 'El 25 de junio de 1978, ante 71.483 espectadores, Argentina venció a Países Bajos 3-1 con goles de Kempes (2) y Bertoni en el Estadio Monumental. Fue la primera Copa del Mundo de Argentina y el partido más importante jugado en suelo riverplatense hasta ese momento.',
  },
  {
    year: '1986', type: 'trophy',
    title: 'Primera Copa Libertadores',
    short: 'River vence a América de Cali y llega al mundo.',
    detail: 'Bajo la conducción de Héctor Veira y con figuras como Alonso, Ramón Díaz y el uruguayo Alzamendi, River venció a América de Cali y conquistó su primera Copa Libertadores. Meses después, en Tokio, venció al Steaua de Bucarest 1-0 y se consagró campeón intercontinental. El mejor año de la historia del club hasta ese momento.',
  },
  {
    year: '1996', type: 'trophy',
    title: 'Segunda Copa Libertadores',
    short: 'La era dorada de Francescoli, Ortega y Gallardo.',
    detail: 'Con Enzo Francescoli como capitán, Ariel Ortega y un joven Marcelo Gallardo, River venció a América de Cali en la final. Fue el mejor equipo del continente entre 1993 y 1997, ganando 5 campeonatos argentinos y una Libertadores en ese período.',
  },
  {
    year: '2014', type: 'trophy',
    title: 'Gallardo DT · Copa Sudamericana',
    short: 'Primer título internacional con Gallardo en el banco.',
    detail: 'En su primer año como entrenador, Marcelo Gallardo llevó a River a la final de la Copa Sudamericana ante el Atlético Nacional de Colombia. La victoria inició una era de dominio continental sin precedentes en la historia del club.',
  },
  {
    year: '2015', type: 'trophy',
    title: 'Tercera Copa Libertadores',
    short: 'River vence a Tigres de México 3-0 en la final.',
    detail: 'El equipo de Gallardo desarrolló un fútbol extraordinario y aplastó a Tigres de México 3-0 en la final jugada en el Monumental. Lucas Alario y Giovanni Simeone fueron los goleadores. River también ganó la Copa Sudamericana, la Recopa Sudamericana y la Copa J.League ese año: un 2015 histórico.',
  },
  {
    year: '2018', type: 'trophy',
    title: 'La Final del Mundo · 4.ª Libertadores',
    short: 'River vence a Boca 3-1 en el Bernabéu de Madrid.',
    detail: 'La final más vista de la historia del fútbol de clubes. Tras incidentes que llevaron a trasladar el partido a Madrid, River venció a Boca Juniors 3-1 con goles de Palacios, Quintero y Pratto. Enzo Pérez, mediocampista, atajó durante 60 minutos con los guantes del lesionado Armani. La imagen más épica de la historia del club.',
  },
  {
    year: '2022', type: 'stadium',
    title: 'Monumental renovado',
    short: '84.567 plazas. El estadio más grande de América.',
    detail: 'Tras años de obras, el Estadio Monumental reabrió completamente remodelado con 84.567 plazas, convirtiéndose en el primero en América con la totalidad de sus tribunas techadas. Tendrá una tribuna adicional para el Mundial 2030, cuando Argentina coorganizará el torneo del centenario.',
  },
];

/* ─── Componentes ──────────────────────────────────────────────────────────── */

const TYPE_ICON: Record<Moment['type'], string> = {
  trophy: '🏆', milestone: '📍', stadium: '🏟️', era: '⚡',
};

function TrophySection({ group }: { group: TrophyGroup }) {
  const [expandedName, setExpandedName] = useState<string | null>(null);
  const total = group.items.reduce((s, i) => s + i.count, 0);

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{group.category}</h2>
          <p className="text-[11px] text-neutral-600 mt-0.5">{group.subtitle}</p>
        </div>
        <span className="text-xs text-neutral-600 tabular-nums">{total} títulos</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {group.items.map((t) => {
          const years = Array.isArray(t.years) ? t.years : [];
          const isExpanded = expandedName === t.name;
          return (
            <div
              key={t.name}
              onClick={() => years.length > 1 && setExpandedName(isExpanded ? null : t.name)}
              className={`bg-neutral-900 border rounded-2xl p-4 flex flex-col gap-2 transition-all ${years.length > 1 ? 'cursor-pointer' : ''} ${isExpanded ? 'border-riverRed/50' : 'border-neutral-800 hover:border-neutral-700'}`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="text-2xl">{t.icon}</span>
                <span className="text-3xl font-black text-riverRed tabular-nums leading-none">{t.count}</span>
              </div>
              <div className="font-bold text-xs text-white leading-tight">{t.name}</div>
              {isExpanded ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {years.map((y) => (
                    <span key={y} className="text-[10px] bg-riverRed/20 text-riverRed px-1.5 py-0.5 rounded font-bold tabular-nums">{y}</span>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-neutral-500 leading-snug">
                  {years.length > 0
                    ? years.length <= 4
                      ? years.join(' · ')
                      : `${years[0]} … ${years[years.length - 1]}`
                    : typeof t.years === 'string' ? t.years : ''}
                </div>
              )}
              {years.length > 4 && (
                <span className="text-[10px] text-riverRed font-bold">{isExpanded ? 'Ocultar ↑' : `Ver los ${t.count} años ↓`}</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function IdolGalleryCard({ idol }: { idol: Idol }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-neutral-700 transition-all cursor-pointer"
      onClick={() => setOpen((v) => !v)}
    >
      {/* Header tipo card de fútbol */}
      <div
        className="relative px-5 pt-5 pb-4 flex items-end justify-between"
        style={{ background: `linear-gradient(135deg, ${idol.accentColor}22 0%, transparent 70%)` }}
      >
        {/* Número enorme como fondo */}
        <span
          className="absolute right-3 top-1 text-[80px] font-black tabular-nums leading-none select-none pointer-events-none"
          style={{ color: `${idol.accentColor}18` }}
        >
          {idol.number}
        </span>

        <div className="relative z-10">
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{idol.position} · {idol.era}</div>
          <div className="text-xl font-black leading-tight mt-0.5">{idol.name}</div>
          <div className="text-2xl font-black leading-none" style={{ color: idol.accentColor }}>{idol.lastName}</div>
          <div className="text-xs font-bold mt-1" style={{ color: idol.accentColor }}>"{idol.nickname}"</div>
        </div>

        <div className="relative z-10 text-right">
          <div className="text-4xl font-black tabular-nums leading-none" style={{ color: idol.accentColor }}>
            {idol.number}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x divide-neutral-800 border-t border-neutral-800">
        {[
          { label: 'Partidos', value: idol.apps },
          { label: 'Goles',    value: idol.goals },
          { label: 'Títulos',  value: idol.titles },
        ].map(({ label, value }) => (
          <div key={label} className="py-3 text-center">
            <div className="text-lg font-black tabular-nums" style={{ color: value != null ? idol.accentColor : undefined }}>
              {value ?? '—'}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold">{label}</div>
          </div>
        ))}
      </div>

      {/* Expandible */}
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-96' : 'max-h-0'}`}>
        <div className="px-5 pb-5 pt-4 border-t border-neutral-800 space-y-3">
          <p className="text-xs text-neutral-300 leading-relaxed">{idol.description}</p>
          <ul className="space-y-1.5">
            {idol.facts.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[11px] text-neutral-400">
                <span style={{ color: idol.accentColor }} className="mt-0.5 shrink-0">▸</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="px-5 py-2.5 border-t border-neutral-800/50 text-[10px] text-neutral-600 text-center">
        {open ? 'Tocar para cerrar ↑' : 'Tocar para ver más ↓'}
      </div>
    </div>
  );
}

function StadiumCard({ s }: { s: Stadium }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`bg-neutral-900 border rounded-2xl overflow-hidden cursor-pointer transition-all ${s.isMain ? 'border-riverRed/30' : 'border-neutral-800 hover:border-neutral-700'}`}
      onClick={() => setOpen((v) => !v)}
    >
      <div className={`px-5 py-4 ${s.isMain ? 'bg-gradient-to-r from-red-950/20 to-transparent' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{s.shortName}</div>
            <h3 className="font-black text-sm leading-tight mt-0.5">{s.name}</h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">{s.location}</p>
          </div>
          <div className="text-right shrink-0">
            {s.capacity !== 'Sin datos' ? (
              <>
                <div className="text-xl font-black tabular-nums text-riverRed">{s.capacity}</div>
                <div className="text-[10px] text-neutral-500">espectadores</div>
              </>
            ) : (
              <div className="text-[11px] text-neutral-600 italic">Sin registro</div>
            )}
          </div>
        </div>
        <p className="text-xs text-neutral-400 leading-relaxed mt-3">{s.description}</p>
      </div>

      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-80' : 'max-h-0'}`}>
        <div className="px-5 pb-4 border-t border-neutral-800 pt-4 space-y-3">
          {s.recordMatch && (
            <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl px-3 py-2">
              <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide mb-0.5">Récord de asistencia</div>
              <div className="text-xs text-white font-semibold">{s.recordAttendance} espectadores</div>
              <div className="text-[11px] text-neutral-500">{s.recordMatch}</div>
            </div>
          )}
          <ul className="space-y-1.5">
            {s.facts.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[11px] text-neutral-400">
                <span className="text-riverRed mt-0.5 shrink-0">▸</span>{f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="px-5 py-2 border-t border-neutral-800/50 text-[10px] text-neutral-600 text-center">
        {open ? 'Tocar para cerrar ↑' : 'Ver datos e historia ↓'}
      </div>
    </div>
  );
}

function TimelineItem({ moment, isLast, isActive, onToggle }: {
  moment: Moment; isLast: boolean; isActive: boolean; onToggle: () => void;
}) {
  const isHighlight = moment.type === 'trophy' || moment.type === 'era';
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center shrink-0">
        <button
          onClick={onToggle}
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm transition-all mt-0.5 shrink-0 ${
            isHighlight
              ? 'border-riverRed bg-riverRed/20 shadow-md shadow-red-900/30'
              : 'border-neutral-700 bg-neutral-800'
          } ${isActive ? 'scale-110' : ''}`}
        >
          {TYPE_ICON[moment.type]}
        </button>
        {!isLast && <div className="w-px flex-1 bg-neutral-800 mt-1" />}
      </div>

      <div className={`pb-6 min-w-0 flex-1 ${isLast ? 'pb-0' : ''}`}>
        <button className="w-full text-left" onClick={onToggle}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-black tabular-nums px-2 py-0.5 rounded-md ${isHighlight ? 'bg-riverRed/20 text-riverRed' : 'bg-neutral-800 text-neutral-400'}`}>
              {moment.year}
            </span>
            <span className="font-bold text-sm leading-snug">{moment.title}</span>
            <span className="text-neutral-600 text-xs ml-auto shrink-0">{isActive ? '▲' : '▼'}</span>
          </div>
          <p className="text-xs text-neutral-500 leading-relaxed mt-1">{moment.short}</p>
        </button>

        <div className={`overflow-hidden transition-all duration-300 ${isActive ? 'max-h-64 mt-2' : 'max-h-0'}`}>
          <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl px-4 py-3">
            <p className="text-xs text-neutral-300 leading-relaxed">{moment.detail}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Página ─────────────────────────────────────────────────────────────────── */

const TOTAL_TITLES = PALMARES.flatMap((g) => g.items).reduce((s, i) => s + i.count, 0);

export default function Historia() {
  const [activeTimeline, setActiveTimeline] = useState<string | null>(null);

  const toggle = (key: string) => setActiveTimeline((prev) => (prev === key ? null : key));

  return (
    <div className="max-w-5xl mx-auto px-4 mt-8 space-y-12 pb-12">

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-red-950/30 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-8 shadow-2xl text-center">
        <div className="inline-block bg-red-950/40 text-riverRed border border-red-900/50 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
          El más grande
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-2 leading-tight">
          Historia de<br /><span className="text-riverRed">River Plate</span>
        </h1>
        <p className="text-neutral-400 text-sm max-w-xl mx-auto mt-3 leading-relaxed">
          Más de un siglo de gloria, pasión y títulos. El club con más socios de Argentina
          y referente del fútbol sudamericano.
        </p>
        <div className="grid grid-cols-3 gap-4 mt-8 max-w-lg mx-auto">
          {[
            { label: 'Año de fundación', value: '1901' },
            { label: 'Socios',           value: '+100.000' },
            { label: 'Cap. Monumental',  value: '84.567' },
          ].map((s) => (
            <div key={s.label} className="bg-neutral-950/60 rounded-2xl py-4 px-2">
              <div className="text-xl md:text-2xl font-black text-white">{s.value}</div>
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider mt-1 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 inline-block bg-riverRed/10 border border-riverRed/30 rounded-2xl px-6 py-3">
          <span className="text-4xl font-black text-riverRed">{TOTAL_TITLES}</span>
          <span className="text-sm text-neutral-400 ml-2">títulos oficiales</span>
        </div>
      </section>

      {/* ── Palmarés ── */}
      {PALMARES.map((group) => (
        <TrophySection key={group.category} group={group} />
      ))}

      {/* ── Ídolos — galería ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Ídolos históricos</h2>
          <p className="text-[11px] text-neutral-600 mt-0.5">Las leyendas que vistieron la banda roja · tocá cada card para ver estadísticas y datos</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {IDOLS.map((idol) => <IdolGalleryCard key={idol.lastName} idol={idol} />)}
        </div>
      </section>

      {/* ── Estadios ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Estadios históricos</h2>
          <p className="text-[11px] text-neutral-600 mt-0.5">Las casas de River · tocá cada card para ver datos, récords e historia</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STADIUMS.map((s) => <StadiumCard key={s.name} s={s} />)}
        </div>
      </section>

      {/* ── Línea de tiempo ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Línea de tiempo</h2>
          <p className="text-[11px] text-neutral-600 mt-0.5">
            Los hitos que marcaron la historia del club · tocá cada momento para leer más
          </p>
        </div>

        {/* Leyenda de íconos */}
        <div className="flex flex-wrap gap-3 text-[11px] text-neutral-500">
          {Object.entries(TYPE_ICON).map(([type, icon]) => (
            <span key={type} className="flex items-center gap-1">
              <span>{icon}</span>
              <span className="capitalize">{type === 'milestone' ? 'Hito' : type === 'trophy' ? 'Título' : type === 'stadium' ? 'Estadio' : 'Era'}</span>
            </span>
          ))}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          {TIMELINE.map((m, i) => (
            <TimelineItem
              key={m.year + m.title}
              moment={m}
              isLast={i === TIMELINE.length - 1}
              isActive={activeTimeline === m.year + m.title}
              onToggle={() => toggle(m.year + m.title)}
            />
          ))}
        </div>
      </section>

    </div>
  );
}
