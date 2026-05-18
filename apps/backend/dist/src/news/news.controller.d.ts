import { NewsService } from './news.service';
import { NewsAiService } from './news-ai.service';
import { CreateNewsDto } from './dto/create-news.dto';
export declare class NewsController {
    private readonly newsService;
    private readonly newsAiService;
    constructor(newsService: NewsService, newsAiService: NewsAiService);
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
    triggerAiNews(): Promise<void>;
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
    hideComment(id: string): Promise<{
        id: string;
        createdAt: Date;
        body: string;
        userId: string;
        newsId: string;
        parentId: string | null;
        reportedAt: Date | null;
        hidden: boolean;
    }>;
    unhideComment(id: string): Promise<{
        id: string;
        createdAt: Date;
        body: string;
        userId: string;
        newsId: string;
        parentId: string | null;
        reportedAt: Date | null;
        hidden: boolean;
    }>;
    dismissReport(id: string): Promise<{
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
    getRelated(id: string): Promise<({
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
    update(id: string, body: any): Promise<{
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
    getComments(id: string): Promise<({
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
    addComment(id: string, body: {
        body: string;
        parentId?: string;
    }, req: any): Promise<{
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
    removeComment(commentId: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        body: string;
        userId: string;
        newsId: string;
        parentId: string | null;
        reportedAt: Date | null;
        hidden: boolean;
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
    toggleCommentLike(commentId: string, req: any): Promise<{
        liked: boolean;
        count: number;
    }>;
    toggleLike(id: string, req: any): Promise<{
        liked: boolean;
        count: number;
    }>;
    getLikes(id: string, req: any): Promise<{
        liked: boolean;
        count: number;
    }>;
}
