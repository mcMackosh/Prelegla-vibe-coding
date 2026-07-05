import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';

export type DocumentSummary = {
  id: number;
  type: string;
  title: string;
  createdAt: Date;
};

export type DocumentDetail = DocumentSummary & {
  data: Record<string, string>;
};

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: number,
    dto: CreateDocumentDto,
  ): Promise<DocumentSummary> {
    const document = await this.prisma.document.create({
      data: {
        userId,
        type: dto.type ?? 'mutual-nda',
        title: dto.title,
        data: JSON.stringify(dto.data),
      },
    });

    return {
      id: document.id,
      type: document.type,
      title: document.title,
      createdAt: document.createdAt,
    };
  }

  async findAllForUser(userId: number): Promise<DocumentSummary[]> {
    const documents = await this.prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, type: true, title: true, createdAt: true },
    });

    return documents;
  }

  async findOneForUser(userId: number, id: number): Promise<DocumentDetail> {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    if (document.userId !== userId) {
      throw new ForbiddenException('You do not have access to this document');
    }

    return {
      id: document.id,
      type: document.type,
      title: document.title,
      createdAt: document.createdAt,
      data: JSON.parse(document.data) as Record<string, string>,
    };
  }
}
