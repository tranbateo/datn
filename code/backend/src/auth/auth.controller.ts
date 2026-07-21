import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  VerifyOtpDto,
  LoginDto,
  RefreshTokenDto,
} from './dto/auth.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user and send OTP' })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.sendEmailOtp(dto);
  }

  @ApiOperation({ summary: 'Verify OTP and create user' })
  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyEmailOtp(dto);
  }

  @ApiOperation({ summary: 'Login user' })
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
}
