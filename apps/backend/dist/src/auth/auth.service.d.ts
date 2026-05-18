import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
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
    getProfile(userId: string): Promise<{
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
    updateProfile(userId: string, data: {
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
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    deleteAccount(userId: string): Promise<{
        message: string;
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
    updateUserRole(userId: string, role: string): Promise<{
        id: string;
        display_name: string;
        role: string;
    }>;
    getUserStats(): Promise<{
        total: number;
        newThisWeek: number;
    }>;
    getTopRanking(): Promise<{
        id: string;
        display_name: string;
        avatar_url: string | null;
        points: number;
    }[]>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            display_name: string;
            role: string;
        };
    }>;
}
