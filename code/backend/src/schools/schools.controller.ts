import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Res,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SchoolsService } from './schools.service';
import { SchoolsImportService } from './schools-import.service';
import {
  CreateSchoolDto,
  UpdateSchoolDto,
  UpdateByokKeyDto,
} from './dto/schools.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';
import type { Response } from 'express';

interface RequestWithUser {
  user: {
    id: string;
    role: Role;
    schoolId: string | null;
  };
}

@ApiTags('Schools')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schools')
export class SchoolsController {
  constructor(
    private readonly schoolsService: SchoolsService,
    private readonly schoolsImportService: SchoolsImportService,
  ) {}

  // -------------------------------------------------------------
  // System Admin Endpoints
  // -------------------------------------------------------------
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new school (System Admin)' })
  @Post()
  create(@Body() dto: CreateSchoolDto) {
    return this.schoolsService.create(dto);
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all schools (System Admin)' })
  @Get()
  findAll() {
    return this.schoolsService.findAll();
  }

  // -------------------------------------------------------------
  // School Admin: License & BYOK
  // -------------------------------------------------------------
  @Roles(Role.ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get current school license & AI quota status' })
  @Get('license/me')
  getMySchoolLicense(@Req() req: RequestWithUser) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Tài khoản không thuộc trường học nào.');
    }
    return this.schoolsService.getLicense(schoolId);
  }

  @Roles(Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Update BYOK API key (Bring Your Own Key)' })
  @Put('license/byok')
  updateByokKey(@Req() req: RequestWithUser, @Body() dto: UpdateByokKeyDto) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Tài khoản không thuộc trường học nào.');
    }
    return this.schoolsService.updateByokKey(schoolId, dto);
  }

  // -------------------------------------------------------------
  // School Admin: Import / Export Operations
  // -------------------------------------------------------------
  @Roles(Role.ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Download template Excel for Bulk Import' })
  @Get('import/template')
  downloadTemplate(@Res() res: Response) {
    const buffer = this.schoolsImportService.generateTemplate();

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=Template_Import_TruongHoc.xlsx',
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Roles(Role.SCHOOL_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Preview import file with Dry-run validation' })
  @ApiConsumes('multipart/form-data')
  @Post('import/preview')
  @UseInterceptors(FileInterceptor('file'))
  async previewImport(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file Excel để kiểm tra.');
    }
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Tài khoản không thuộc trường học nào.');
    }
    return this.schoolsImportService.previewImport(schoolId, file.buffer);
  }

  @Roles(Role.SCHOOL_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Execute transactional batch import from Excel' })
  @ApiConsumes('multipart/form-data')
  @Post('import/execute')
  @UseInterceptors(FileInterceptor('file'))
  async executeImport(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file Excel để import.');
    }
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Tài khoản không thuộc trường học nào.');
    }
    return this.schoolsImportService.executeImport(schoolId, file.buffer);
  }

  @Roles(Role.SCHOOL_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Export issued account credentials for classes' })
  @Get('export/credentials')
  async exportCredentials(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Param('classId') classId?: string,
  ) {
    const schoolId = req.user.schoolId;
    if (!schoolId) {
      throw new BadRequestException('Tài khoản không thuộc trường học nào.');
    }
    const buffer = await this.schoolsImportService.exportCredentials(
      schoolId,
      classId,
    );

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        'attachment; filename=Danh_Sach_Tai_Khoan_Cap_Phat.xlsx',
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  // -------------------------------------------------------------
  // School Details & Updates
  // -------------------------------------------------------------
  @Roles(Role.ADMIN, Role.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get school details' })
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    if (req.user.role === Role.SCHOOL_ADMIN && req.user.schoolId !== id) {
      throw new ForbiddenException('Không có quyền truy cập trường học khác.');
    }
    return this.schoolsService.findOne(id);
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update school status/name (System Admin)' })
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSchoolDto) {
    return this.schoolsService.update(id, dto);
  }
}
