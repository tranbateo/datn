/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Add custom authentication logic here if needed
    return super.canActivate(context);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      // Bỏ qua lỗi xác thực tạm thời để test UI ở Phase 2
      // Trả về một mock user (lấy từ dữ liệu seed.ts)
      console.warn('⚠️ No token provided, using Mock User for testing!');
      return {
        id: '00000000-0000-0000-0000-000000000000', // Sẽ map với một user có thật sau, hoặc chỉ dùng để pass guard
        userId: '00000000-0000-0000-0000-000000000000', // Dùng UUID chuẩn để Prisma không bị lỗi
        email: 'student1@test.com',
        role: Role.STUDENT,
      };
    }
    return user;
  }
}
