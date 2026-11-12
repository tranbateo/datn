/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import {
  CreateUserDto,
  UpdateUserDto,
  AdminUpdateUserDto,
} from './dto/users.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuditLogService } from '../audit-log/audit-log.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @ApiOperation({ summary: 'Sync user from third-party provider' })
  @Post('sync')
  syncUser(@Request() req: any) {
    const user = req.user;
    const userId = user.id || user.userId;
    return this.usersService.syncUser(userId, user.email, user.role);
  }

  @ApiOperation({
    summary: 'Submit feedback / report AI or content error (FR-RAG-004)',
  })
  @Post('feedback')
  submitFeedback(
    @Request() req: any,
    @Body() body: { category?: string; content: string },
  ) {
    const userId = req.user.id || req.user.userId;
    return this.usersService.submitFeedback(
      userId,
      body.category,
      body.content,
    );
  }

  @ApiOperation({ summary: 'Create user manually (Admin only)' })
  @Post()
  @Roles(Role.ADMIN, Role.SCHOOL_ADMIN)
  async create(@Request() req: any, @Body() createUserDto: CreateUserDto) {
    const adminId = req.user.id || req.user.userId;
    const user = await this.usersService.create(
      createUserDto,
      req.user.schoolId,
    );
    await this.auditLogService.logAction(adminId, 'CREATE_USER', 'User', {
      targetUserId: user.id,
    });
    return user;
  }

  @ApiOperation({ summary: 'List all users in school' })
  @Get()
  @Roles(Role.ADMIN, Role.SCHOOL_ADMIN)
  findAll(@Request() req: any) {
    return this.usersService.findAll(req.user.schoolId);
  }

  @ApiOperation({ summary: 'Get current user profile' })
  @Get('profile')
  getProfile(@Request() req: any) {
    const userId = req.user.id || req.user.userId;
    return this.usersService.findOne(userId, req.user);
  }

  @ApiOperation({ summary: 'Get user by id' })
  @Get(':id')
  @Roles(Role.ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER)
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.usersService.findOne(id, req.user);
  }

  @ApiOperation({ summary: 'Upload avatar image file for current user' })
  @Post('profile/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadAvatar(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file ảnh đại diện.');
    }
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Định dạng ảnh không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP hoặc GIF.',
      );
    }
    const userId = req.user.id || req.user.userId;
    const base64DataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    return this.usersService.update(
      userId,
      { avatarUrl: base64DataUrl },
      req.user.role,
    );
  }

  @ApiOperation({ summary: 'Update current user profile (PATCH)' })
  @Patch('profile')
  updateProfile(@Request() req: any, @Body() updateUserDto: UpdateUserDto) {
    const userId = req.user.id || req.user.userId;
    return this.usersService.update(userId, updateUserDto, req.user.role);
  }

  @ApiOperation({ summary: 'Update current user profile (PUT)' })
  @Put('profile')
  updateProfilePut(@Request() req: any, @Body() updateUserDto: UpdateUserDto) {
    const userId = req.user.id || req.user.userId;
    return this.usersService.update(userId, updateUserDto, req.user.role);
  }

  @ApiOperation({ summary: 'Update any user profile (Admin only)' })
  @Patch(':id')
  @Roles(Role.ADMIN, Role.SCHOOL_ADMIN)
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() adminUpdateUserDto: AdminUpdateUserDto,
  ) {
    const adminId = req.user.id || req.user.userId;
    const user = await this.usersService.update(
      id,
      adminUpdateUserDto,
      req.user.role,
    );
    await this.auditLogService.logAction(adminId, 'UPDATE_USER', 'User', {
      targetUserId: id,
      changes: adminUpdateUserDto,
    });
    return user;
  }

  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @Delete(':id')
  @Roles(Role.ADMIN, Role.SCHOOL_ADMIN)
  async remove(@Request() req: any, @Param('id') id: string) {
    const adminId = req.user.id || req.user.userId;
    const user = await this.usersService.remove(id);
    await this.auditLogService.logAction(adminId, 'DELETE_USER', 'User', {
      targetUserId: id,
    });
    return user;
  }
}
