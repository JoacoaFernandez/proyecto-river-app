import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SurveysService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.survey.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { votes: true } } },
    });
  }

  async findActive() {
    return this.prisma.survey.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { votes: true } } },
    });
  }

  async getResults(id: string) {
    const survey = await this.prisma.survey.findUnique({ where: { id } });
    if (!survey) throw new NotFoundException('Encuesta no encontrada');

    const votes = await this.prisma.surveyVote.groupBy({
      by: ['optionId'],
      where: { surveyId: id },
      _count: { optionId: true },
    });

    const total = votes.reduce((sum, v) => sum + v._count.optionId, 0);
    const options = (survey.options as { id: string; label: string }[]).map((opt) => {
      const found = votes.find((v) => v.optionId === opt.id);
      const count = found?._count.optionId ?? 0;
      return { ...opt, count, percent: total > 0 ? Math.round((count / total) * 100) : 0 };
    });

    return { id: survey.id, question: survey.question, active: survey.active, total, options };
  }

  async getUserVote(surveyId: string, userId: string) {
    return this.prisma.surveyVote.findUnique({
      where: { surveyId_userId: { surveyId, userId } },
    });
  }

  async vote(surveyId: string, userId: string, optionId: string) {
    const survey = await this.prisma.survey.findUnique({ where: { id: surveyId } });
    if (!survey) throw new NotFoundException('Encuesta no encontrada');
    if (!survey.active) throw new ForbiddenException('La encuesta está cerrada');

    const options = survey.options as { id: string }[];
    if (!options.find((o) => o.id === optionId)) {
      throw new NotFoundException('Opción inválida');
    }

    const existing = await this.prisma.surveyVote.findUnique({
      where: { surveyId_userId: { surveyId, userId } },
    });
    if (existing) throw new ConflictException('Ya votaste en esta encuesta');

    return this.prisma.surveyVote.create({
      data: { surveyId, userId, optionId },
    });
  }

  async create(data: { question: string; options: { id: string; label: string }[] }) {
    return this.prisma.survey.create({
      data: { question: data.question, options: data.options },
    });
  }

  async close(id: string) {
    return this.prisma.survey.update({
      where: { id },
      data: { active: false, closedAt: new Date() },
    });
  }

  async remove(id: string) {
    return this.prisma.survey.delete({ where: { id } });
  }
}
