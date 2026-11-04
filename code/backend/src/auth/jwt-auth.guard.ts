/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, _info: any, context: ExecutionContext) {
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
        )
      );
    }

    // Enforce first-time password change policy (BR-AUTH-003)
    if (user.mustChangePassword) {
      const req = context?.switchToHttp()?.getRequest();
      const url: string = req?.url || req?.originalUrl || '';
      const isAllowedRoute =
        url.includes('/auth/first-time-change-password') ||
        url.includes('/users/profile');

      if (!isAllowedRoute) {
        throw new ForbiddenException({
          statusCode: 403,
          error: 'MUST_CHANGE_PASSWORD',
          message:
            'Bắt buộc đổi mật khẩu khởi tạo ở lần đăng nhập đầu tiên trước khi truy cập hệ thống.',
        });
      }
    }

    return user;
  }
}
