import { Injectable } from '@nestjs/common';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';

/**
 * Placeholder auth logic for the V1 foundation. No password hashing or
 * persistence yet — real user storage lands with the auth feature ticket.
 */
@Injectable()
export class AuthService {
  signUp(dto: SignUpDto) {
    return { status: 'ok', email: dto.email };
  }

  signIn(dto: SignInDto) {
    return { status: 'ok', email: dto.email };
  }
}
