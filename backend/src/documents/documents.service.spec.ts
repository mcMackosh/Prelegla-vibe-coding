import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let prisma: {
    document: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      document: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    service = new DocumentsService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('serializes the data field and defaults the type to mutual-nda', async () => {
      const createdAt = new Date('2026-01-01');
      prisma.document.create.mockResolvedValue({
        id: 1,
        type: 'mutual-nda',
        title: 'Acme x Globex',
        createdAt,
      });

      const result = await service.create(7, {
        title: 'Acme x Globex',
        data: { partyAName: 'Acme' },
      });

      expect(prisma.document.create).toHaveBeenCalledWith({
        data: {
          userId: 7,
          type: 'mutual-nda',
          title: 'Acme x Globex',
          data: JSON.stringify({ partyAName: 'Acme' }),
        },
      });
      expect(result).toEqual({
        id: 1,
        type: 'mutual-nda',
        title: 'Acme x Globex',
        createdAt,
      });
    });
  });

  describe('findAllForUser', () => {
    it('lists only summary fields ordered newest first', async () => {
      prisma.document.findMany.mockResolvedValue([]);

      await service.findAllForUser(7);

      expect(prisma.document.findMany).toHaveBeenCalledWith({
        where: { userId: 7 },
        orderBy: { createdAt: 'desc' },
        select: { id: true, type: true, title: true, createdAt: true },
      });
    });
  });

  describe('findOneForUser', () => {
    it('returns the parsed document when owned by the requesting user', async () => {
      const createdAt = new Date('2026-01-01');
      prisma.document.findUnique.mockResolvedValue({
        id: 1,
        userId: 7,
        type: 'mutual-nda',
        title: 'Acme x Globex',
        data: JSON.stringify({ partyAName: 'Acme' }),
        createdAt,
      });

      const result = await service.findOneForUser(7, 1);

      expect(result).toEqual({
        id: 1,
        type: 'mutual-nda',
        title: 'Acme x Globex',
        createdAt,
        data: { partyAName: 'Acme' },
      });
    });

    it('throws NotFoundException when the document does not exist', async () => {
      prisma.document.findUnique.mockResolvedValue(null);

      await expect(service.findOneForUser(7, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when the document belongs to another user', async () => {
      prisma.document.findUnique.mockResolvedValue({
        id: 1,
        userId: 99,
        type: 'mutual-nda',
        title: 'Acme x Globex',
        data: '{}',
        createdAt: new Date(),
      });

      await expect(service.findOneForUser(7, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
