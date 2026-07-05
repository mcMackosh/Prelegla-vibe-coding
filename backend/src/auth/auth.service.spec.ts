import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock } };
  let jwtService: { sign: jest.Mock };

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn(), create: jest.fn() } };
    jwtService = { sign: jest.fn().mockReturnValue('signed-jwt') };
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
    );
  });

  describe('signUp', () => {
    it('creates a new user with a hashed password and returns an access token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 1,
        email: 'a@b.com',
        password: 'hashed',
      });

      const result = await service.signUp({
        email: 'a@b.com',
        password: 'password123',
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'a@b.com' }),
        }),
      );
      const [[createArgs]] = prisma.user.create.mock.calls as [
        [{ data: { password: string } }],
      ];
      const createdPassword = createArgs.data.password;
      expect(createdPassword).not.toBe('password123');
      expect(await bcrypt.compare('password123', createdPassword)).toBe(true);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        email: 'a@b.com',
      });
      expect(result).toEqual({ accessToken: 'signed-jwt', email: 'a@b.com' });
    });

    it('throws ConflictException when the email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'a@b.com',
        password: 'hashed',
      });

      await expect(
        service.signUp({ email: 'a@b.com', password: 'password123' }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('signIn', () => {
    it('returns an access token when the password matches', async () => {
      const hashed = await bcrypt.hash('password123', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'a@b.com',
        password: hashed,
      });

      const result = await service.signIn({
        email: 'a@b.com',
        password: 'password123',
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        email: 'a@b.com',
      });
      expect(result).toEqual({ accessToken: 'signed-jwt', email: 'a@b.com' });
    });

    it('throws UnauthorizedException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.signIn({ email: 'a@b.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the password does not match', async () => {
      const hashed = await bcrypt.hash('correct-password', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        email: 'a@b.com',
        password: hashed,
      });

      await expect(
        service.signIn({ email: 'a@b.com', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
