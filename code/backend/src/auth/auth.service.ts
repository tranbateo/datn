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
  RequestPasswordResetDto,
} from './dto/auth.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
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

  async sendEmailOtp(_dto: RegisterDto) {
    // BR-AUTH-003: Public registration is closed
    throw new ForbiddenException(
      'Hệ thống hiện không mở đăng ký tự do. Tài khoản được cấp bởi Quản trị viên Nhà trường.',
    );
  }

  async verifyEmailOtp(_dto: VerifyOtpDto) {
    throw new ForbiddenException(
      'Hệ thống hiện không mở đăng ký tự do. Tài khoản được cấp bởi Quản trị viên Nhà trường.',
    );
  }

  async login(dto: LoginDto) {
    const rawIdentifier = dto.identifier || dto.email;
    if (!rawIdentifier) {
      throw new BadRequestException(
        'Vui lòng nhập Email, Mã học sinh hoặc Số điện thoại.',
      );
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
          AND: [{ schoolId: school.id }, { OR: orConditions }],
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

      if (
        user.school.licenseExpiresAt &&
        new Date() > user.school.licenseExpiresAt
      ) {
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

    // 2FA / OTP check for ADMIN, SCHOOL_ADMIN, and TEACHER (when ENABLE_EMAIL_2FA=true and SMTP is configured)
    const enableEmail2fa =
      this.configService.get<string>('ENABLE_EMAIL_2FA') === 'true';
    const mailUser = this.configService.get<string>('MAIL_USER');
    const mailPass = this.configService.get<string>('MAIL_PASS');

    if (
      enableEmail2fa &&
      mailUser &&
      mailPass &&
      (user.role === 'ADMIN' ||
        user.role === 'SCHOOL_ADMIN' ||
        user.role === 'TEACHER') &&
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
          from: `"EduAI" <${mailUser}>`,
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

    // Generate tokens
    const tokens = await this.generateTokens(
      user.id,
      user.email || user.studentCode || user.phone || '',
      user.role,
      user.fullName,
      user.schoolId,
      user.mustChangePassword,
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

    this.loginOtpStore.delete(email);

    const tokens = await this.generateTokens(
      user.id,
      user.email || user.studentCode || user.phone || '',
      user.role,
      user.fullName,
      user.schoolId,
      user.mustChangePassword,
    );

    return {
      ...tokens,
      mustChangePassword: user.mustChangePassword,
    };
  }

  async firstTimeChangePassword(
    userId: string,
    dto: FirstTimeChangePasswordDto,
  ) {
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
      throw new BadRequestException(
        'Mật khẩu mới không được trùng với mật khẩu cũ.',
      );
    }

    const newHash = await bcrypt.hash(dto.newPassword + pepper, 10);
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
    });

    // Issue new tokens with mustChangePassword: false
    const tokens = await this.generateTokens(
      updatedUser.id,
      updatedUser.email || updatedUser.studentCode || updatedUser.phone || '',
      updatedUser.role,
      updatedUser.fullName,
      updatedUser.schoolId,
      false,
    );

    return {
      success: true,
      message: 'Đổi mật khẩu thành công.',
      mustChangePassword: false,
      ...tokens,
    };
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    fullName: string | null,
    schoolId: string | null,
    mustChangePassword = false,
  ) {
    const payload = {
      sub: userId,
      email,
      role,
      schoolId,
      mustChangePassword,
    };
    const plainToken = crypto.randomBytes(32).toString('hex');
    const refreshToken = `${userId}.${plainToken}`;
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

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
        mustChangePassword,
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

    const sha256Hash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    const isValid =
      user.refreshTokenHash === sha256Hash ||
      (user.refreshTokenHash.startsWith('$2') &&
        (await bcrypt.compare(refreshToken, user.refreshTokenHash)));
    if (!isValid) {
      throw new UnauthorizedException('INVALID_REFRESH_TOKEN');
    }

    const payload = {
      sub: user.id,
      email: user.email || user.studentCode || user.phone || '',
      role: user.role,
      schoolId: user.schoolId,
      mustChangePassword: user.mustChangePassword,
    };
    const plainToken = crypto.randomBytes(32).toString('hex');
    const newRefreshToken = `${user.id}.${plainToken}`;
    const newRefreshTokenHash = crypto
      .createHash('sha256')
      .update(newRefreshToken)
      .digest('hex');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: newRefreshTokenHash },
    });

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: newRefreshToken,
    };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto) {
    const rawIdentifier = (dto.identifier || '').trim();
    if (!rawIdentifier) {
      throw new BadRequestException(
        'Vui lòng nhập Mã tài khoản, Email hoặc Số điện thoại.',
      );
    }

    if (
      dto.role !== Role.STUDENT &&
      dto.role !== Role.TEACHER &&
      dto.role !== Role.PARENT
    ) {
      throw new BadRequestException(
        'Vui lòng chọn vai trò Học sinh, Giáo viên hoặc Phụ huynh.',
      );
    }

    const user = await this.prisma.user.findFirst({
      where: {
        role: dto.role,
        OR: [
          { studentCode: rawIdentifier },
          { email: { equals: rawIdentifier, mode: 'insensitive' } },
          { phone: rawIdentifier },
        ],
      },
      include: {
        school: { select: { id: true, name: true } },
        classEnrollments: {
          where: { status: 'ACTIVE' },
          take: 1,
          include: {
            class: {
              select: {
                id: true,
                name: true,
                homeroomTeacherId: true,
                homeroomTeacher: {
                  select: { id: true, fullName: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestException(
        'Không tìm thấy tài khoản khớp với vai trò và thông tin đã nhập. Vui lòng kiểm tra lại Mã tài khoản (chú ý chữ hoa/thường), Email hoặc SĐT.',
      );
    }

    if (!user.isActive) {
      throw new BadRequestException(
        'Tài khoản này đang bị tạm khóa. Vui lòng liên hệ trực tiếp Văn phòng nhà trường.',
      );
    }

    const cleanReason = (dto.reason || '').trim().slice(0, 300) || null;

    // Avoid duplicate PENDING requests for the same user
    const existingPending = await this.prisma.$queryRawUnsafe<
      Array<{ id: string }>
    >(
      `SELECT id FROM "PasswordResetRequest" WHERE "userId" = $1::uuid AND status = 'PENDING' ORDER BY "createdAt" DESC LIMIT 1`,
      user.id,
    );

    let requestId: string;
    if (existingPending.length > 0) {
      requestId = existingPending[0].id;
      await this.prisma.$executeRawUnsafe(
        `UPDATE "PasswordResetRequest" SET identifier = $1, reason = $2, "createdAt" = now() WHERE id = $3::uuid`,
        rawIdentifier,
        cleanReason,
        requestId,
      );
    } else {
      const inserted = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `INSERT INTO "PasswordResetRequest" ("schoolId", "userId", role, identifier, reason, status)
         VALUES ($1::uuid, $2::uuid, $3, $4, $5, 'PENDING')
         RETURNING id`,
        user.schoolId,
        user.id,
        user.role,
        rawIdentifier,
        cleanReason,
      );
      requestId = inserted[0]?.id;
    }

    // Notify School Admins (and Homeroom Teacher if Student)
    const recipientIds = new Set<string>();
    const schoolAdmins = await this.prisma.user.findMany({
      where: {
        ...(user.schoolId ? { schoolId: user.schoolId } : {}),
        role: { in: [Role.ADMIN, Role.SCHOOL_ADMIN] },
        isActive: true,
      },
      select: { id: true },
    });
    schoolAdmins.forEach((a) => recipientIds.add(a.id));

    const activeClass = user.classEnrollments?.[0]?.class || null;
    const homeroomTeacher = activeClass?.homeroomTeacher || null;
    if (user.role === Role.STUDENT && homeroomTeacher?.id) {
      recipientIds.add(homeroomTeacher.id);
    }

    const roleLabel =
      user.role === Role.STUDENT
        ? 'Học sinh'
        : user.role === Role.TEACHER
          ? 'Giáo viên'
          : 'Phụ huynh';
    const userDisplay = `${user.fullName || rawIdentifier}${
      user.studentCode ? ` (${user.studentCode})` : ''
    }${activeClass?.name ? ` - ${activeClass.name}` : ''}`;

    const notificationsData = Array.from(recipientIds).map((recipientId) => ({
      userId: recipientId,
      title: `Yêu cầu cấp lại mật khẩu (${roleLabel})`,
      body: `${roleLabel} ${userDisplay} đã gửi yêu cầu cấp lại mật khẩu.${
        cleanReason ? ` Ghi chú: ${cleanReason}` : ''
      }`,
    }));

    if (notificationsData.length > 0) {
      await this.prisma.notification.createMany({
        data: notificationsData,
      });
    }

    const handlerText =
      user.role === Role.STUDENT
        ? homeroomTeacher?.fullName
          ? `Giáo viên chủ nhiệm ${homeroomTeacher.fullName}${activeClass?.name ? ` (${activeClass.name})` : ''} và Quản trị viên nhà trường`
          : 'Giáo viên chủ nhiệm và Quản trị viên nhà trường'
        : 'Quản trị viên nhà trường';

    return {
      success: true,
      requestId,
      role: user.role,
      schoolName: user.school?.name || 'Nhà trường',
      homeroomTeacherName:
        user.role === Role.STUDENT ? homeroomTeacher?.fullName || null : null,
      className: user.role === Role.STUDENT ? activeClass?.name || null : null,
      handlerText,
      message: `Đã gửi yêu cầu cấp lại mật khẩu tới ${handlerText}. Sau khi được cấp mật khẩu tạm, vui lòng đăng nhập để đặt mật khẩu mới.`,
    };
  }

  async logout(userId: string) {
    // BR-AUTH-001: Revoke session refresh token on logout
    await this.prisma.user.updateMany({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
    return { success: true };
  }
}
