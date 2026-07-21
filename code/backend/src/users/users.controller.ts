/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
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
    const user = req.user; // from JwtStrategy
    const userId = user.id || user.userId;
    return this.usersService.syncUser(userId, user.email, user.role);
  }

  @ApiOperation({ summary: 'Create user manually (Admin only)' })
  @Post()
  @Roles(Role.ADMIN)
  async create(@Request() req: any, @Body() createUserDto: CreateUserDto) {
    const adminId = req.user.id || req.user.userId;
    const user = await this.usersService.create(createUserDto);
    await this.auditLogService.logAction(adminId, 'CREATE_USER', 'User', {
      targetUserId: user.id,
    });
    return user;
  }

  @ApiOperation({ summary: 'List all users' })
  @Get()
  @Roles(Role.ADMIN, Role.TEACHER)
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: 'Get current user profile' })
  @Get('profile')
  getProfile(@Request() req: any) {
    const userId = req.user.id || req.user.userId;
    return this.usersService.findOne(userId);
  }

  @ApiOperation({ summary: 'Get user by id' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @ApiOperation({ summary: 'Update current user profile' })
  @Patch('profile')
  updateProfile(@Request() req: any, @Body() updateUserDto: UpdateUserDto) {
    const userId = req.user.id || req.user.userId;
    return this.usersService.update(userId, updateUserDto);
  }

  @ApiOperation({ summary: 'Update any user profile (Admin only)' })
  @Patch(':id')
  @Roles(Role.ADMIN)
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() adminUpdateUserDto: AdminUpdateUserDto,
  ) {
    const adminId = req.user.id || req.user.userId;
    const user = await this.usersService.update(id, adminUpdateUserDto);
    await this.auditLogService.logAction(adminId, 'UPDATE_USER', 'User', {
      targetUserId: id,
      changes: adminUpdateUserDto,
    });
    return user;
  }

  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Request() req: any, @Param('id') id: string) {
    const adminId = req.user.id || req.user.userId;
    const user = await this.usersService.remove(id);
    await this.auditLogService.logAction(adminId, 'DELETE_USER', 'User', {
      targetUserId: id,
    });
    return user;
  }
}
