"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const prisma = new client_1.PrismaClient();
function getArg(name) {
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
//# sourceMappingURL=create-admin.js.map