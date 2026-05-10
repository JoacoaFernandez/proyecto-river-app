// apps/frontend/src/components/CanchaTactica.tsx
import type { LineupEntry, LineupResponse } from '../services/formations.service';

const VB_W = 100;
const VB_H = 150;
const SCALE_Y = VB_H / 100;

function lastName(full: string): string {
  const parts = full.split(' ').filter(Boolean);
  return parts[parts.length - 1] ?? full;
}

function PlayerToken({ slot }: { slot: LineupEntry }) {
  const x = slot.x;
  const y = slot.y * SCALE_Y;
  const p = slot.player;

  return (
    <g transform={`translate(${x} ${y})`}>
      {/* Sombra debajo del token */}
      <ellipse cx="0" cy="6" rx="4.2" ry="0.8" fill="black" opacity="0.35" />

      {/* Anillo + cuerpo */}
      <circle r="5.5" fill="#0a0a0a" stroke="white" strokeWidth="0.35" />
      <circle r="4.8" fill={p ? '#E30613' : '#525252'} />

      {/* Dorsal */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize="4.2"
        fontWeight="900"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {p?.number ?? '?'}
      </text>

      {/* Apellido */}
      <g transform="translate(0 9.5)">
        <rect x="-9" y="-2.2" width="18" height="4" rx="0.8" fill="black" opacity="0.55" />
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize="2.6"
          fontWeight="700"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          {p ? lastName(p.name).toUpperCase() : 'A CONFIRMAR'}
        </text>
      </g>
    </g>
  );
}

function Pitch() {
  return (
    <g>
      {/* Fondo con franjas */}
      <rect x="0" y="0" width={VB_W} height={VB_H} fill="#0d5c3a" />
      <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#cancha-stripes)" />

      {/* Borde exterior */}
      <rect
        x="2"
        y="2"
        width={VB_W - 4}
        height={VB_H - 4}
        fill="none"
        stroke="white"
        strokeWidth="0.5"
        opacity="0.85"
      />

      {/* Línea media + círculo central */}
      <line x1="2" y1={VB_H / 2} x2={VB_W - 2} y2={VB_H / 2} stroke="white" strokeWidth="0.5" opacity="0.85" />
      <circle cx="50" cy={VB_H / 2} r="11" fill="none" stroke="white" strokeWidth="0.5" opacity="0.85" />
      <circle cx="50" cy={VB_H / 2} r="0.8" fill="white" opacity="0.85" />

      {/* Área grande arriba (rival) */}
      <rect x="22" y="2" width="56" height="22" fill="none" stroke="white" strokeWidth="0.5" opacity="0.85" />
      <rect x="35" y="2" width="30" height="8" fill="none" stroke="white" strokeWidth="0.5" opacity="0.85" />
      <circle cx="50" cy="16.5" r="0.8" fill="white" opacity="0.85" />
      {/* Semicírculo del área */}
      <path d="M 41 24 A 9 9 0 0 0 59 24" fill="none" stroke="white" strokeWidth="0.5" opacity="0.85" />

      {/* Área grande abajo (propia) */}
      <rect x="22" y={VB_H - 24} width="56" height="22" fill="none" stroke="white" strokeWidth="0.5" opacity="0.85" />
      <rect x="35" y={VB_H - 10} width="30" height="8" fill="none" stroke="white" strokeWidth="0.5" opacity="0.85" />
      <circle cx="50" cy={VB_H - 16.5} r="0.8" fill="white" opacity="0.85" />
      <path d={`M 41 ${VB_H - 24} A 9 9 0 0 1 59 ${VB_H - 24}`} fill="none" stroke="white" strokeWidth="0.5" opacity="0.85" />
    </g>
  );
}

export default function CanchaTactica({ data }: { data: LineupResponse }) {
  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className="w-full h-auto block"
      style={{ filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.5))' }}
    >
      <defs>
        <pattern id="cancha-stripes" patternUnits="userSpaceOnUse" width="100" height="15">
          <rect width="100" height="7.5" fill="#0d5c3a" />
          <rect y="7.5" width="100" height="7.5" fill="#0f6c44" />
        </pattern>
      </defs>
      <Pitch />
      {data.lineup.map((slot, i) => (
        <PlayerToken key={`${slot.role}-${i}`} slot={slot} />
      ))}
    </svg>
  );
}
