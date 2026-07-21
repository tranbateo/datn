/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { RegisterDto, VerifyOtpDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  // In-memory store for Registration OTPs
  private otpStore = new Map<
    string,
    {
      otp: string;
      expiresAt: number;
      userData: any;
    }
  >();

  // In-memory store for Login OTPs
  private loginOtpStore = new Map<
    string,
    {
      otp: string;
      expiresAt: number;
      userId: string;
    }
  >();

  private transporter: nodemailer.Transporter;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendEmailOtp(dto: RegisterDto) {
    const { email, password, fullName, role } = dto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('EMAIL_EXISTS');
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store temporarily
    this.otpStore.set(email, {
      otp,
      expiresAt,
      userData: { email, password, fullName, role },
    });

    try {
      await this.transporter.sendMail({
        from: `"EduAI" <${this.configService.get<string>('MAIL_USER')}>`,
        to: email,
        subject: 'Mã xác thực đăng ký EduAI',
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Xin chào ${fullName || email},</h2>
            <p>Cảm ơn bạn đã đăng ký EduAI. Mã xác thực (OTP) của bạn là:</p>
            <h1 style="color: #4f46e5; letter-spacing: 5px;">${otp}</h1>
            <p>Mã này sẽ hết hạn sau 5 phút.</p>
          </div>
        `,
      });
      return { message: 'OTP đã được gửi đến email của bạn.' };
    } catch (error) {
      console.error('Failed to send email:', error);
      this.otpStore.delete(email); // Cleanup on failure
      throw new InternalServerErrorException('EMAIL_SEND_FAILED');
    }
  }

  async verifyEmailOtp(dto: VerifyOtpDto) {
    const { email, otp } = dto;
    const record = this.otpStore.get(email);

    if (!record) {
      throw new BadRequestException('OTP_NOT_FOUND');
    }

    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(email);
      throw new BadRequestException('OTP_EXPIRED');
    }

    if (record.otp !== otp) {
      throw new BadRequestException('OTP_INVALID');
    }

    // Create User
    const { password, fullName, role } = record.userData;

    // Bcrypt + Pepper
    const pepper =
      this.configService.get<string>('PASSWORD_PEPPER') || 'DEFAULT_PEPPER';
    const passwordHash = await bcrypt.hash(password + pepper, 10);

    if (role === 'ADMIN') {
      throw new BadRequestException('UNAUTHORIZED_ADMIN_REGISTRATION');
    }

    const newUser = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: role || 'STUDENT',
        isActive: role === 'TEACHER' ? false : true,
      },
    });

    // Cleanup
    this.otpStore.delete(email);

    // Issue JWT
    const payload = {
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };
    const plainToken = crypto.randomBytes(32).toString('hex');
    const refreshToken = `${newUser.id}.${plainToken}`;
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await this.prisma.user.update({
      where: { id: newUser.id },
      data: { refreshTokenHash },
    });

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      },
    };
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('PENDING_APPROVAL');
    }

    const pepper =
      this.configService.get<string>('PASSWORD_PEPPER') || 'DEFAULT_PEPPER';
    const isPasswordValid = await bcrypt.compare(
      password + pepper,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    // Require OTP for ADMIN and TEACHER roles
    if (user.role === 'ADMIN' || user.role === 'TEACHER') {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

      this.loginOtpStore.set(email, {
        otp,
        expiresAt,
        userId: user.id,
      });

      try {
        await this.transporter.sendMail({
          from: `"EduAI" <${this.configService.get<string>('MAIL_USER')}>`,
          to: email,
          subject: 'Mã xác thực đăng nhập EduAI',
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>Xin chào ${user.fullName || email},</h2>
              <p>Mã xác thực (OTP) đăng nhập của bạn là:</p>
              <h1 style="color: #4f46e5; letter-spacing: 5px;">${otp}</h1>
              <p>Mã này sẽ hết hạn sau 5 phút.</p>
            </div>
          `,
        });
        return {
          requireOtp: true,
          email: user.email,
          message: 'OTP đã được gửi đến email của bạn.',
        };
      } catch (error) {
        console.error('Failed to send login email:', error);
        this.loginOtpStore.delete(email); // Cleanup on failure
        throw new InternalServerErrorException('EMAIL_SEND_FAILED');
      }
    }

    // Generate tokens for STUDENT and PARENT roles
    return this.generateTokens(user.id, user.email, user.role, user.fullName);
  }

  async verifyLoginOtp(dto: VerifyOtpDto) {
    const { email, otp } = dto;
    const record = this.loginOtpStore.get(email);

    if (!record) {
      throw new BadRequestException('OTP_NOT_FOUND');
    }

    if (Date.now() > record.expiresAt) {
      this.loginOtpStore.delete(email);
      throw new BadRequestException('OTP_EXPIRED');
    }

    if (record.otp !== otp) {
      throw new BadRequestException('OTP_INVALID');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: record.userId },
    });

    if (!user) {
      this.loginOtpStore.delete(email);
      throw new BadRequestException('USER_NOT_FOUND');
    }

    // Cleanup
    this.loginOtpStore.delete(email);

    return this.generateTokens(user.id, user.email, user.role, user.fullName);
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    fullName: string | null,
  ) {
    const payload = { sub: userId, email, role };
    const plainToken = crypto.randomBytes(32).toString('hex');
    const refreshToken = `${userId}.${plainToken}`;
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken,
      user: {
        id: userId,
        email,
        fullName,
        role,
      },
    };
  }

  async refreshTokens(dto: { refreshToken: string }) {
    const { refreshToken } = dto;
    const parts = refreshToken.split('.');
    if (parts.length !== 2) {
      throw new UnauthorizedException('INVALID_REFRESH_TOKEN');
    }

    const userId = parts[0];
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('INVALID_REFRESH_TOKEN');
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) {
      throw new UnauthorizedException('INVALID_REFRESH_TOKEN');
    }

    // Generate new tokens (Rotation)
    const payload = { sub: user.id, email: user.email, role: user.role };
    const plainToken = crypto.randomBytes(32).toString('hex');
    const newRefreshToken = `${user.id}.${plainToken}`;
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: newRefreshTokenHash },
    });

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: newRefreshToken,
    };
  }
}
