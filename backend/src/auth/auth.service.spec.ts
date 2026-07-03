import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('signUp returns ok status with the submitted email', () => {
    expect(service.signUp({ email: 'a@b.com', password: 'password123' })).toEqual({
      status: 'ok',
      email: 'a@b.com',
    });
  });

  it('signIn returns ok status with the submitted email', () => {
    expect(service.signIn({ email: 'a@b.com', password: 'password123' })).toEqual({
      status: 'ok',
      email: 'a@b.com',
    });
  });
});
