import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  VerifyOtpDto,
  LoginDto,
  RefreshTokenDto,
  FirstTimeChangePasswordDto,
} from './dto/auth.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user (Closed in School B2B)' })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.sendEmailOtp(dto);
  }

  @ApiOperation({ summary: 'Verify OTP and create user (Closed in School B2B)' })
  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyEmailOtp(dto);
  }

  @ApiOperation({ summary: 'Login user via StudentCode, Email or Phone' })
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Verify login OTP for Admin and Teacher' })
  @Post('verify-login-otp')
  async verifyLoginOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyLoginOtp(dto);
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password on first login' })
  @Post('first-time-change-password')
  async firstTimeChangePassword(
    @Req() req: { user: { id: string } },
    @Body() dto: FirstTimeChangePasswordDto,
  ) {
    return this.authService.firstTimeChangePassword(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke refresh token session' })
  @Post('logout')
  async logout(@Req() req: { user: { id: string } }) {
    return this.authService.logout(req.user.id);
  }
}
