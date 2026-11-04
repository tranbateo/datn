/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import {
  RegisterDto,
  VerifyOtpDto,
  LoginDto,
  FirstTimeChangePasswordDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  // In-memory store for Registration OTPs (if needed internally)
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
    // BR-AUTH-003: Public registration is closed
    throw new ForbiddenException(
      'Hệ thống hiện không mở đăng ký tự do. Tài khoản được cấp bởi Quản trị viên Nhà trường.',
    );
  }

  async verifyEmailOtp(dto: VerifyOtpDto) {
    throw new ForbiddenException(
      'Hệ thống hiện không mở đăng ký tự do. Tài khoản được cấp bởi Quản trị viên Nhà trường.',
    );
  }

  async login(dto: LoginDto) {
    const rawIdentifier = dto.identifier || dto.email;
    if (!rawIdentifier) {
      throw new BadRequestException('Vui lòng nhập Email, Mã học sinh hoặc Số điện thoại.');
    }
    const identifier = rawIdentifier.trim();
    const { password, schoolCode } = dto;

    // Search user by email, studentCode, or phone
    const orConditions: any[] = [
      { email: identifier },
      { studentCode: identifier },
      { phone: identifier },
    ];

    let whereCondition: any = { OR: orConditions };

    if (schoolCode) {
      const school = await this.prisma.school.findUnique({
        where: { code: schoolCode.trim() },
      });
      if (school) {
        whereCondition = {
          AND: [
            { schoolId: school.id },
            { OR: orConditions },
          ],
        };
      }
    }

    const user = await this.prisma.user.findFirst({
      where: whereCondition,
      include: { school: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('PENDING_APPROVAL');
    }

    // License and School Status Check
    if (user.schoolId && user.school && user.role !== 'ADMIN') {
      if (!user.school.isActive) {
        throw new UnauthorizedException('SCHOOL_SUSPENDED');
      }

      if (user.school.licenseExpiresAt && new Date() > user.school.licenseExpiresAt) {
        // Only School Admin is permitted to log in when school license is expired
        if (user.role !== 'SCHOOL_ADMIN') {
          throw new UnauthorizedException('SCHOOL_LICENSE_EXPIRED');
        }
      }
    }

    // Validate Password with Pepper
    const pepper =
      this.configService.get<string>('PASSWORD_PEPPER') || 'DEFAULT_PEPPER';
    const isPasswordValid = await bcrypt.compare(
      password + pepper,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    // 2FA / OTP check for ADMIN, SCHOOL_ADMIN, and TEACHER (if they have an email)
    if (
      (user.role === 'ADMIN' || user.role === 'SCHOOL_ADMIN' || user.role === 'TEACHER') &&
      user.email
    ) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

      this.loginOtpStore.set(user.email, {
        otp,
        expiresAt,
        userId: user.id,
      });

      try {
        await this.transporter.sendMail({
          from: `"EduAI" <${this.configService.get<string>('MAIL_USER')}>`,
          to: user.email,
          subject: 'Mã xác thực đăng nhập EduAI',
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h2>Xin chào ${user.fullName || user.email},</h2>
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
        this.loginOtpStore.delete(user.email);
        throw new InternalServerErrorException('EMAIL_SEND_FAILED');
      }
    }

    // Generate tokens for users (STUDENT, PARENT, or roles without email OTP requirement)
    const tokens = await this.generateTokens(
      user.id,
      user.email || user.studentCode || user.phone || '',
      user.role,
      user.fullName,
      user.schoolId,
    );

    return {
      ...tokens,
      mustChangePassword: user.mustChangePassword,
    };
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

    // Cleanup OTP
    this.loginOtpStore.delete(email);

    const tokens = await this.generateTokens(
      user.id,
      user.email || user.studentCode || '',
      user.role,
      user.fullName,
      user.schoolId,
    );

    return {
      ...tokens,
      mustChangePassword: user.mustChangePassword,
    };
  }

  async firstTimeChangePassword(userId: string, dto: FirstTimeChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('USER_NOT_FOUND');
    }

    const pepper =
      this.configService.get<string>('PASSWORD_PEPPER') || 'DEFAULT_PEPPER';
    const isMatch = await bcrypt.compare(
      dto.currentPassword + pepper,
      user.passwordHash,
    );

    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác.');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Mật khẩu mới không được trùng với mật khẩu cũ.');
    }

    const newHash = await bcrypt.hash(dto.newPassword + pepper, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
    });

    return {
      success: true,
      message: 'Đổi mật khẩu thành công.',
      mustChangePassword: false,
    };
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    fullName: string | null,
    schoolId: string | null,
  ) {
    const payload = { sub: userId, email, role, schoolId };
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
        schoolId,
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
    const payload = {
      sub: user.id,
      email: user.email || user.studentCode || '',
      role: user.role,
      schoolId: user.schoolId,
    };
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
