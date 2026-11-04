import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret && process.env.NODE_ENV === 'production') {
          throw new Error('JWT_SECRET must be configured in production');
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const expiresIn = (configService.get<string>('JWT_EXPIRES_IN') ||
          '4h') as any;
        return {
          secret: secret || 'dev_jwt_secret_fallback_only',
          signOptions: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            expiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService],
  exports: [PassportModule, JwtModule],
})
export class AuthModule {}
