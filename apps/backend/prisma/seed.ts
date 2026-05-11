// apps/backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

const RIVER_PLATE_TEAM_ID = 435;
const API_KEY = process.env.API_FOOTBALL_KEY;
const CURRENT_YEAR = new Date().getFullYear();

async function syncPlayers(apiKey: string) {
  console.log('📡 1. Descargando plantel real de River desde API-Football...');
  await prisma.player.deleteMany();

  const response = await axios.get('https://v3.football.api-sports.io/players/squads', {
    params: { team: RIVER_PLATE_TEAM_ID },
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'v3.football.api-sports.io',
    },
  });

  const squad = response.data.response?.[0]?.players;
  if (!squad || squad.length === 0) {
    console.log('⚠️ No se encontraron jugadores en la API.');
    return;
  }

  console.log(`📥 Guardando ${squad.length} jugadores en Render...`);
  for (const p of squad) {
    let dbPosition = 'Midfielder';
    if (p.position === 'Goalkeeper') dbPosition = 'Goalkeeper';
    if (p.position === 'Defender') dbPosition = 'Defender';
    if (p.position === 'Midfielder') dbPosition = 'Midfielder';
    if (p.position === 'Attacker') dbPosition = 'Attacker';

    await prisma.player.create({
      data: {
        name: p.name,
        position: dbPosition,
        number: p.number ?? 10,
        age: p.age ?? 25,
        photo: p.photo ?? null,
        nationality: 'Argentino',
      },
    });
  }
  console.log('✅ ¡Sincronización de plantel completada!');
}

async function syncFixture(apiKey: string) {
  console.log('📅 2. Descargando Fixture completo de River Plate...');
  await prisma.match.deleteMany();

  const response = await axios.get('https://v3.football.api-sports.io/fixtures', {
    params: {
      team: RIVER_PLATE_TEAM_ID,
      season: CURRENT_YEAR,
    },
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'v3.football.api-sports.io',
    },
  });

  const fixtures = response.data.response;
  if (!fixtures || fixtures.length === 0) {
    console.log('⚠️ No se encontraron partidos programados para esta temporada.');
    return;
  }

  console.log(`📥 Guardando ${fixtures.length} partidos en Render...`);

  for (const f of fixtures) {
    let dbStatus = 'scheduled';
    if (f.fixture.status.short === 'FT') dbStatus = 'finished';
    if (['1H', '2H', 'HT', 'ET', 'P'].includes(f.fixture.status.short)) dbStatus = 'live';

    await prisma.match.create({
      data: {
        homeTeam: f.teams.home.name,
        awayTeam: f.teams.away.name,
        homeScore: f.goals.home ?? 0,
        awayScore: f.goals.away ?? 0,
        minute: f.fixture.status.elapsed ?? 0,
        status: dbStatus,
        date: new Date(f.fixture.date),
        type: `apifootball-${f.fixture.id}`,
        updatedAt: new Date(),
      },
    });
  }
  console.log('✅ ¡Sincronización de fixture completada con éxito!');
}

async function main() {
  if (!API_KEY) {
    throw new Error('❌ No se encontró la variable API_FOOTBALL_KEY en el archivo .env');
  }

  await syncPlayers(API_KEY);
  console.log('----------------------------------------------------');
  await syncFixture(API_KEY);
  console.log('----------------------------------------------------');

  console.log('🎉 [ÉXITO TOTAL] ¡Plantel y fixture sincronizados!');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed automático:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
