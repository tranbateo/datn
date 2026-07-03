import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Add custom authentication logic here if needed
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      console.error("=== JWT AUTH FAILED ===");
      console.error("Error:", err);
      console.error("User:", user);
      console.error("Info:", info);
      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
