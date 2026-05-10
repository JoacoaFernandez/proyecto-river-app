// apps/backend/src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export type Role = 'user' | 'editor' | 'admin';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
