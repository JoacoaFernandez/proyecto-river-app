import { PrismaService } from '../prisma/prisma.service';
export declare class SurveysService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        _count: {
            votes: number;
        };
    } & {
        id: string;
        options: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        question: string;
        active: boolean;
        closedAt: Date | null;
    })[]>;
    findActive(): Promise<({
        _count: {
            votes: number;
        };
    } & {
        id: string;
        options: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        question: string;
        active: boolean;
        closedAt: Date | null;
    }) | null>;
    getResults(id: string): Promise<{
        id: string;
        question: string;
        active: boolean;
        total: number;
        options: {
            count: number;
            percent: number;
            id: string;
            label: string;
        }[];
    }>;
    getUserVote(surveyId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        surveyId: string;
        optionId: string;
    } | null>;
    vote(surveyId: string, userId: string, optionId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        surveyId: string;
        optionId: string;
    }>;
    create(data: {
        question: string;
        options: {
            id: string;
            label: string;
        }[];
    }): Promise<{
        id: string;
        options: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        question: string;
        active: boolean;
        closedAt: Date | null;
    }>;
    close(id: string): Promise<{
        id: string;
        options: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        question: string;
        active: boolean;
        closedAt: Date | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        options: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        question: string;
        active: boolean;
        closedAt: Date | null;
    }>;
}
