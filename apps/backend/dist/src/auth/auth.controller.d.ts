import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { AuthUser } from './decorators/current-user.decorator';
import type { Request as ExpressRequest } from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        email: string;
        id: string;
        googleId: string | null;
        display_name: string;
        avatar_url: string | null;
        role: string;
        isBanned: boolean;
        created_at: Date;
        points: number;
        city: string | null;
        country: string | null;
        fanSince: number | null;
        notifGoals: boolean;
        notifMatch: boolean;
        notifNews: boolean;
        quietFrom: number | null;
        quietTo: number | null;
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            display_name: string;
            role: string;
        };
    }>;
    me(user: AuthUser): Promise<{
        email: string;
        id: string;
        googleId: string | null;
        display_name: string;
        avatar_url: string | null;
        role: string;
        isBanned: boolean;
        created_at: Date;
        points: number;
        city: string | null;
        country: string | null;
        fanSince: number | null;
        notifGoals: boolean;
        notifMatch: boolean;
        notifNews: boolean;
        quietFrom: number | null;
        quietTo: number | null;
    }>;
    updateMe(user: AuthUser, body: {
        display_name?: string;
        avatar_url?: string;
        city?: string | null;
        country?: string | null;
        fanSince?: number | null;
        notifGoals?: boolean;
        notifMatch?: boolean;
        notifNews?: boolean;
        quietFrom?: number | null;
        quietTo?: number | null;
    }): Promise<{
        email: string;
        id: string;
        googleId: string | null;
        display_name: string;
        avatar_url: string | null;
        role: string;
        isBanned: boolean;
        created_at: Date;
        points: number;
        city: string | null;
        country: string | null;
        fanSince: number | null;
        notifGoals: boolean;
        notifMatch: boolean;
        notifNews: boolean;
        quietFrom: number | null;
        quietTo: number | null;
    }>;
    changePassword(user: AuthUser, body: {
        currentPassword: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
    deleteMe(user: AuthUser): Promise<{
        message: string;
    }>;
    getTopRanking(): Promise<{
        id: string;
        display_name: string;
        avatar_url: string | null;
        points: number;
    }[]>;
    getAdminStats(): Promise<{
        total: number;
        newThisWeek: number;
    }>;
    getAllUsers(): Promise<{
        email: string;
        id: string;
        display_name: string;
        avatar_url: string | null;
        role: string;
        isBanned: boolean;
        created_at: Date;
        points: number;
        _count: {
            comments: number;
            predictions: number;
        };
    }[]>;
    updateUserRole(id: string, body: {
        role: string;
    }): Promise<{
        id: string;
        display_name: string;
        role: string;
    }>;
    banUser(id: string): Promise<{
        email: string;
        id: string;
        googleId: string | null;
        display_name: string;
        avatar_url: string | null;
        role: string;
        isBanned: boolean;
        created_at: Date;
        points: number;
        city: string | null;
        country: string | null;
        fanSince: number | null;
        notifGoals: boolean;
        notifMatch: boolean;
        notifNews: boolean;
        quietFrom: number | null;
        quietTo: number | null;
    }>;
    unbanUser(id: string): Promise<{
        email: string;
        id: string;
        googleId: string | null;
        display_name: string;
        avatar_url: string | null;
        role: string;
        isBanned: boolean;
        created_at: Date;
        points: number;
        city: string | null;
        country: string | null;
        fanSince: number | null;
        notifGoals: boolean;
        notifMatch: boolean;
        notifNews: boolean;
        quietFrom: number | null;
        quietTo: number | null;
    }>;
    uploadAvatar(file: Express.Multer.File, user: AuthUser, req: ExpressRequest): Promise<{
        email: string;
        id: string;
        googleId: string | null;
        display_name: string;
        avatar_url: string | null;
        role: string;
        isBanned: boolean;
        created_at: Date;
        points: number;
        city: string | null;
        country: string | null;
        fanSince: number | null;
        notifGoals: boolean;
        notifMatch: boolean;
        notifNews: boolean;
        quietFrom: number | null;
        quietTo: number | null;
    }>;
}
