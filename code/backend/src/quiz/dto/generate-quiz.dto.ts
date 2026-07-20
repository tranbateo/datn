import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class GenerateQuizDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsOptional()
  topic?: string;

  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  numQuestions?: number = 5;
}
