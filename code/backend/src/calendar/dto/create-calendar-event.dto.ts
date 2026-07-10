import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class CreateCalendarEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  type: string; // "CLASS", "EXAM", "ASSIGNMENT", "MEETING"

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}
