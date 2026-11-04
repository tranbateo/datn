/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const rawSecret = configService.get<string>('JWT_SECRET');
    if (!rawSecret && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be configured in production');
    }
    const secret = rawSecret || 'dev_jwt_secret_fallback_only';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: any) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      id: payload.sub,
      userId: payload.sub,
      email: payload.email,
      role: payload.role || Role.STUDENT,
      schoolId: payload.schoolId || null,
      mustChangePassword: Boolean(payload.mustChangePassword),
    };
  }
}
