import {
  IsArray,
  IsString,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  @IsOptional()
  selectedOption?: string;

  @IsString()
  @IsOptional()
  textAnswer?: string;
}

export class SubmitQuizDto {
  @IsString()
  @IsOptional()
  attemptId?: string;

  @IsString()
  @IsOptional()
  exitReason?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
