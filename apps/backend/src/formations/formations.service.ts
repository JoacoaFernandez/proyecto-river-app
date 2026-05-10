// apps/backend/src/formations/formations.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormationDto } from './dto/create-formation.dto';

export type SlotRole = 'GK' | 'DEF' | 'MID' | 'ATK';

export interface PitchSlot {
  /** 0..100 horizontal en la cancha (0 = izquierda, 100 = derecha) */
  x: number;
  /** 0..100 vertical (0 = arco rival arriba, 100 = arco propio abajo) */
  y: number;
  role: SlotRole;
}

export interface LineupPlayer {
  id: string;
  name: string;
  number: number | null;
  photo: string | null;
  nationality: string | null;
  position: string;
}

export interface LineupEntry extends PitchSlot {
  player: LineupPlayer | null;
}

export interface LineupResponse {
  scheme: string;
  schemes: string[];
  lineup: LineupEntry[];
  bench: LineupPlayer[];
}

const SUPPORTED_SCHEMES = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2'];
const POSITION_TO_ROLE: Record<string, SlotRole> = {
  Goalkeeper: 'GK',
  Defender: 'DEF',
  Midfielder: 'MID',
  Attacker: 'ATK',
};

@Injectable()
export class FormationsService {
  constructor(private prisma: PrismaService) {}

  // ── CRUD existente ────────────────────────────────────────────────────────────

  async create(createFormationDto: CreateFormationDto) {
    const { matchId } = createFormationDto;
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException(`El partido con ID ${matchId} no existe.`);
    }
    return this.prisma.formation.create({ data: createFormationDto });
  }

  async findAll() {
    return this.prisma.formation.findMany({ include: { match: true } });
  }

  async findOne(id: string) {
    const formation = await this.prisma.formation.findUnique({
      where: { id },
      include: { match: true },
    });
    if (!formation) {
      throw new NotFoundException(`La formación con ID ${id} no existe.`);
    }
    return formation;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.formation.delete({ where: { id } });
  }

  // ── Lineup táctico (XI sobre la cancha) ──────────────────────────────────────

  /**
   * Devuelve un XI titular probable para River sobre la cancha, calculado a partir
   * del plantel agrupado por posición. No persiste nada.
   *
   * Si el `scheme` pedido no está soportado, cae a 4-3-3.
   */
  async getLineup(rawScheme?: string): Promise<LineupResponse> {
    const scheme = SUPPORTED_SCHEMES.includes(rawScheme ?? '') ? rawScheme! : '4-3-3';
    const slots = this.computeSlots(scheme);

    const players = await this.prisma.player.findMany({
      orderBy: [{ number: 'asc' }, { name: 'asc' }],
    });

    // Agrupamos por rol ya normalizado
    const pools: Record<SlotRole, typeof players> = {
      GK: [],
      DEF: [],
      MID: [],
      ATK: [],
    };
    for (const p of players) {
      const role = POSITION_TO_ROLE[p.position];
      if (role) pools[role].push(p);
    }

    const used = new Set<string>();
    const lineup: LineupEntry[] = slots.map((slot) => {
      const pool = pools[slot.role] ?? [];
      const player = pool.find((p) => !used.has(p.id));
      if (player) used.add(player.id);
      return {
        ...slot,
        player: player ? this.toLineupPlayer(player) : null,
      };
    });

    const bench: LineupPlayer[] = players.filter((p) => !used.has(p.id)).map((p) => this.toLineupPlayer(p));

    return { scheme, schemes: SUPPORTED_SCHEMES, lineup, bench };
  }

  private toLineupPlayer(p: {
    id: string;
    name: string;
    number: number | null;
    photo: string | null;
    nationality: string | null;
    position: string;
  }): LineupPlayer {
    return {
      id: p.id,
      name: p.name,
      number: p.number,
      photo: p.photo,
      nationality: p.nationality,
      position: p.position,
    };
  }

  /**
   * Convierte un esquema tipo "4-3-3" o "4-2-3-1" en 11 coordenadas {x,y,role}.
   *
   * Orientación:
   *   - El arco propio (River) está abajo (y=100)
   *   - El arco rival está arriba (y=0)
   *   - El arquero queda cerca del arco propio
   *   - La línea de delanteros queda cerca del arco rival
   */
  private computeSlots(scheme: string): PitchSlot[] {
    const lines = scheme.split('-').map((n) => parseInt(n, 10));
    const slots: PitchSlot[] = [];

    // Arquero
    slots.push({ x: 50, y: 92, role: 'GK' });

    // Líneas de campo: defensa (más abajo, cerca del GK) → ataque (arriba)
    // Distribuimos las líneas entre y=68 (DEF) y y=18 (ATK)
    const yDef = 70;
    const yAtk = 18;
    const lineCount = lines.length;

    for (let li = 0; li < lineCount; li++) {
      const t = lineCount === 1 ? 0.5 : li / (lineCount - 1);
      const y = yDef - t * (yDef - yAtk);
      const role: SlotRole = li === 0 ? 'DEF' : li === lineCount - 1 ? 'ATK' : 'MID';

      const playersInLine = lines[li];
      for (let pi = 0; pi < playersInLine; pi++) {
        // Espaciado horizontal uniforme: si hay N jugadores, posiciones x_i = (i+1) * 100/(N+1)
        const x = ((pi + 1) * 100) / (playersInLine + 1);
        slots.push({ x, y, role });
      }
    }

    return slots;
  }
}
