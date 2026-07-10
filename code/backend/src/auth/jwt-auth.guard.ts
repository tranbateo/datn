/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

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
        id: 'user-mock-id', // Sẽ map với một user có thật sau, hoặc chỉ dùng để pass guard
        userId: 'student1@test.com', // Dùng email tạm để query hoặc có thể để trống tuỳ logic
        role: 'STUDENT',
      };
    }
    return user;
  }
}
