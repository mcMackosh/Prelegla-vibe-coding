import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { TemplatesService } from '../templates/templates.service';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let prisma: {
    document: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock };
  };
  let templatesService: { listDocumentTypes: jest.Mock };

  beforeEach(() => {
    prisma = {
      document: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    templatesService = {
      listDocumentTypes: jest.fn().mockReturnValue([
        {
          id: 'mutual-nda',
          name: 'Mutual Non-Disclosure Agreement',
          description: '',
          status: 'available',
        },
        {
          id: 'cloud-service-agreement',
          name: 'Cloud Service Agreement',
          description: '',
          status: 'available',
        },
      ]),
    };
    service = new DocumentsService(
      prisma as unknown as PrismaService,
      templatesService as unknown as TemplatesService,
    );
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

    it('creates a document with an explicit, known document type', async () => {
      prisma.document.create.mockResolvedValue({
        id: 2,
        type: 'cloud-service-agreement',
        title: 'Acme CSA',
        createdAt: new Date('2026-01-01'),
      });

      await service.create(7, {
        type: 'cloud-service-agreement',
        title: 'Acme CSA',
        data: { customer: 'Acme' },
      });

      expect(prisma.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ type: 'cloud-service-agreement' }),
        }),
      );
    });

    it('throws BadRequestException for an unknown document type', async () => {
      await expect(
        service.create(7, { type: 'not-a-real-type', title: 'x', data: {} }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.document.create).not.toHaveBeenCalled();
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
