// apps/backend/prisma/create-admin.ts
//
// Script para crear (o promover) un usuario admin del River App.
// Uso:
//   npm run create:admin -- --email=admin@river.com --password=Secret123 --name="Admin"
// O via env:
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NAME=... npm run create:admin
//
// Si el usuario ya existe, lo promueve a role=admin (no cambia su password).

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

function getArg(name: string): string | undefined {
  const flag = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(flag));
  return found ? found.slice(flag.length) : undefined;
}

async function main() {
  const email = getArg('email') || process.env.ADMIN_EMAIL;
  const password = getArg('password') || process.env.ADMIN_PASSWORD;
  const display_name = getArg('name') || process.env.ADMIN_NAME || 'River Admin';

  if (!email || !password) {
    console.error('❌ Faltan credenciales.');
    console.error('   Usá: --email=... --password=... [--name="..."]');
    console.error('   o variables: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ La contraseña debe tener al menos 8 caracteres.');
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role === 'admin') {
      console.log(`✅ ${email} ya es admin. No hay cambios.`);
      return;
    }
    const updated = await prisma.user.update({
      where: { email },
      data: { role: 'admin' },
    });
    console.log(`✅ Usuario ${updated.email} promovido a admin.`);
    return;
  }

  const password_hash = await bcrypt.hash(password, 12);
  const created = await prisma.user.create({
    data: {
      email,
      password_hash,
      display_name,
      role: 'admin',
    },
  });

  console.log(`✅ Admin creado:`);
  console.log(`   id:    ${created.id}`);
  console.log(`   email: ${created.email}`);
  console.log(`   name:  ${created.display_name}`);
  console.log(`   role:  ${created.role}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
