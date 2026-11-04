import { Module } from '@nestjs/common';
import { SchoolsController } from './schools.controller';
import { SchoolsService } from './schools.service';
import { SchoolsImportService } from './schools-import.service';

@Module({
  controllers: [SchoolsController],
  providers: [SchoolsService, SchoolsImportService],
  exports: [SchoolsService, SchoolsImportService],
})
export class SchoolsModule {}
