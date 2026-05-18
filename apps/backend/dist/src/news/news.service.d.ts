import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
export declare class NewsService {
    private prisma;
    private push;
    constructor(prisma: PrismaService, push: PushService);
    private generateSlug;
    create(createNewsDto: CreateNewsDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        body: string;
        category: string;
        slug: string;
        url: string | null;
        publishedAt: Date | null;
        authorId: string;
        imageUrl: string | null;
        urgent: boolean;
        tags: string[];
    }>;
    findAll(): Promise<({
        author: {
            id: string;
            display_name: string;
            avatar_url: string | null;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        body: string;
        category: string;
        slug: string;
        url: string | null;
        publishedAt: Date | null;
        authorId: string;
        imageUrl: string | null;
        urgent: boolean;
        tags: string[];
    })[]>;
    findOne(id: string): Promise<{
        author: {
            id: string;
            display_name: string;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        body: string;
        category: string;
        slug: string;
        url: string | null;
        publishedAt: Date | null;
        authorId: string;
        imageUrl: string | null;
        urgent: boolean;
        tags: string[];
    }>;
    update(id: string, updateNewsDto: UpdateNewsDto): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        body: string;
        category: string;
        slug: string;
        url: string | null;
        publishedAt: Date | null;
        authorId: string;
        imageUrl: string | null;
        urgent: boolean;
        tags: string[];
    }>;
    remove(id: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        body: string;
        category: string;
        slug: string;
        url: string | null;
        publishedAt: Date | null;
        authorId: string;
        imageUrl: string | null;
        urgent: boolean;
        tags: string[];
    }>;
    getComments(newsId: string): Promise<({
        user: {
            id: string;
            display_name: string;
            avatar_url: string | null;
        };
        _count: {
            likes: number;
        };
        replies: ({
            user: {
                id: string;
                display_name: string;
                avatar_url: string | null;
            };
            _count: {
                likes: number;
            };
        } & {
            id: string;
            createdAt: Date;
            body: string;
            userId: string;
            newsId: string;
            parentId: string | null;
            reportedAt: Date | null;
            hidden: boolean;
        })[];
    } & {
        id: string;
        createdAt: Date;
        body: string;
        userId: string;
        newsId: string;
        parentId: string | null;
        reportedAt: Date | null;
        hidden: boolean;
    })[]>;
    addComment(newsId: string, userId: string, body: string, parentId?: string | null): Promise<{
        user: {
            id: string;
            display_name: string;
            avatar_url: string | null;
        };
        _count: {
            likes: number;
        };
        replies: {
            id: string;
            createdAt: Date;
            body: string;
            userId: string;
            newsId: string;
            parentId: string | null;
            reportedAt: Date | null;
            hidden: boolean;
        }[];
    } & {
        id: string;
        createdAt: Date;
        body: string;
        userId: string;
        newsId: string;
        parentId: string | null;
        reportedAt: Date | null;
        hidden: boolean;
    }>;
    removeComment(commentId: string, userId: string, userRole: string): Promise<{
        id: string;
        createdAt: Date;
        body: string;
        userId: string;
        newsId: string;
        parentId: string | null;
        reportedAt: Date | null;
        hidden: boolean;
    }>;
    toggleLike(newsId: string, userId: string): Promise<{
        liked: boolean;
        count: number;
    }>;
    getLikeStatus(newsId: string, userId: string | null): Promise<{
        liked: boolean;
        count: number;
    }>;
    getRelated(newsId: string, category: string): Promise<({
        author: {
            id: string;
            display_name: string;
            avatar_url: string | null;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        body: string;
        category: string;
        slug: string;
        url: string | null;
        publishedAt: Date | null;
        authorId: string;
        imageUrl: string | null;
        urgent: boolean;
        tags: string[];
    })[]>;
    publishScheduled(): Promise<void>;
    getAllCommentsAdmin(): Promise<({
        news: {
            id: string;
            title: string;
        };
        user: {
            id: string;
            display_name: string;
            avatar_url: string | null;
            isBanned: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        body: string;
        userId: string;
        newsId: string;
        parentId: string | null;
        reportedAt: Date | null;
        hidden: boolean;
    })[]>;
    getReportedComments(): Promise<({
        news: {
            id: string;
            title: string;
        };
        user: {
            id: string;
            display_name: string;
            avatar_url: string | null;
            isBanned: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        body: string;
        userId: string;
        newsId: string;
        parentId: string | null;
        reportedAt: Date | null;
        hidden: boolean;
    })[]>;
    hideComment(commentId: string): Promise<{
        id: string;
        createdAt: Date;
        body: string;
        userId: string;
        newsId: string;
        parentId: string | null;
        reportedAt: Date | null;
        hidden: boolean;
    }>;
    unhideComment(commentId: string): Promise<{
        id: string;
        createdAt: Date;
        body: string;
        userId: string;
        newsId: string;
        parentId: string | null;
        reportedAt: Date | null;
        hidden: boolean;
    }>;
    dismissReport(commentId: string): Promise<{
        id: string;
        createdAt: Date;
        body: string;
        userId: string;
        newsId: string;
        parentId: string | null;
        reportedAt: Date | null;
        hidden: boolean;
    }>;
    banUser(userId: string): Promise<{
        id: string;
        display_name: string;
        isBanned: boolean;
    }>;
    unbanUser(userId: string): Promise<{
        id: string;
        display_name: string;
        isBanned: boolean;
    }>;
    reportComment(commentId: string): Promise<{
        id: string;
        createdAt: Date;
        body: string;
        userId: string;
        newsId: string;
        parentId: string | null;
        reportedAt: Date | null;
        hidden: boolean;
    }>;
    toggleCommentLike(commentId: string, userId: string): Promise<{
        liked: boolean;
        count: number;
    }>;
}
