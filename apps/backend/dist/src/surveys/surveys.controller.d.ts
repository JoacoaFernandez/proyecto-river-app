import { SurveysService } from './surveys.service';
export declare class SurveysController {
    private readonly surveysService;
    constructor(surveysService: SurveysService);
    getActive(): Promise<{
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
    } | null>;
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
    getMyVote(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        surveyId: string;
        optionId: string;
    } | null>;
    vote(id: string, body: {
        optionId: string;
    }, req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        surveyId: string;
        optionId: string;
    }>;
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
    create(body: {
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
