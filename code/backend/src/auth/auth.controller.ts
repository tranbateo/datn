import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: any) {
    return this.authService.sendEmailOtp(dto);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto: any) {
    return this.authService.verifyEmailOtp(dto);
  }

  @Post('login')
  async login(@Body() dto: any) {
    return this.authService.login(dto);
  }
}
