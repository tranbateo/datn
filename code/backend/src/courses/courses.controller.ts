import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { Prisma, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

interface RequestWithUser {
  user: {
    id: string;
    role: Role;
    schoolId: string | null;
  };
}

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles(Role.TEACHER, Role.ADMIN, Role.SCHOOL_ADMIN)
  create(
    @Body() createCourseDto: Prisma.CourseCreateInput,
    @Req() req: RequestWithUser,
  ) {
    return this.coursesService.create(createCourseDto, req.user);
  }

  @Get()
  findAll(@Req() req: RequestWithUser) {
    return this.coursesService.findAll(req.user);
  }

  @Post(':id/enroll')
  @Roles(Role.STUDENT)
  enroll(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.coursesService.enrollCourse(id, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.coursesService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(Role.TEACHER, Role.ADMIN, Role.SCHOOL_ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateCourseDto: Prisma.CourseUpdateInput,
    @Req() req: RequestWithUser
  ) {
    return this.coursesService.update(id, updateCourseDto, req.user);
  }

  @Delete(':id')
  @Roles(Role.TEACHER, Role.ADMIN, Role.SCHOOL_ADMIN)
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.coursesService.remove(id, req.user);
  }
}
