import { Controller, Get, Query, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';

@Controller('curriculum')
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  @Get('subjects')
  getSubjects(@Query('grade') gradeStr: string) {
    if (!gradeStr) {
      throw new BadRequestException('Query parameter "grade" is required');
    }
    const grade = parseInt(gradeStr, 10);
    if (isNaN(grade) || grade < 1 || grade > 12) {
      throw new BadRequestException('Grade must be an integer between 1 and 12');
    }
    return this.curriculumService.getSubjectsByGrade(grade);
  }
}
