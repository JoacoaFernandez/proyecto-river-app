// apps/backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

const RIVER_PLATE_TEAM_ID = 435; // ID oficial de River Plate
const API_KEY = process.env.API_FOOTBALL_KEY;

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

async function main() {
  if (!API_KEY) {
    throw new Error('❌ No se encontró la variable API_FOOTBALL_KEY en el archivo .env');
  }

  // 1. Sincroniza jugadores reales (Esto se hace una vez por temporada)
  await syncPlayers(API_KEY);
  console.log('----------------------------------------------------');
  
  console.log('🎉 [ÉXITO TOTAL] ¡Plantel sincronizado! El Fixture y las Noticias ahora se actualizan solos de fondo al prender el servidor.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed automático:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });