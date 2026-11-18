import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';

export class GenerateQuizDto {
  @IsString()
  @IsOptional()
  courseId?: string;

  @IsString()
  @IsOptional()
  subjectId?: string;

  @IsString()
  @IsOptional()
  topic?: string;

  @IsInt()
  @Min(1)
  @Max(60)
  @IsOptional()
  numQuestions?: number = 35;

  @IsBoolean()
  @IsOptional()
  includeEssay?: boolean = true;
}
