import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

type FakeRequest = { headers: { authorization?: string }; userId?: number };

function contextWithHeader(authorization?: string): {
  context: ExecutionContext;
  request: FakeRequest;
} {
  const request: FakeRequest = { headers: { authorization } };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

describe('JwtAuthGuard', () => {
  let jwtService: { verify: jest.Mock };
  let guard: JwtAuthGuard;

  beforeEach(() => {
    jwtService = { verify: jest.fn() };
    guard = new JwtAuthGuard(jwtService as unknown as JwtService);
  });

  it('allows the request and attaches userId when the token is valid', () => {
    jwtService.verify.mockReturnValue({ sub: 42 });
    const { context, request } = contextWithHeader('Bearer valid-token');

    expect(guard.canActivate(context)).toBe(true);
    expect(request.userId).toBe(42);
  });

  it('throws UnauthorizedException when the header is missing', () => {
    const { context } = contextWithHeader(undefined);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when the scheme is not Bearer', () => {
    const { context } = contextWithHeader('Basic abc123');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException when verification fails', () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('bad token');
    });
    const { context } = contextWithHeader('Bearer invalid-token');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
