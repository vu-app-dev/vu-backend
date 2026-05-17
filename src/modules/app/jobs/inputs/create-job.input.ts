import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { JobTypeEnum } from '../enums/job-type.enum';
import { IsTimestamp } from 'src/common/validators/timestamp.validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateJobInput {
  @ApiProperty({
    example: 'Senior Backend Engineer',
    minLength: 3,
    maxLength: 30,
  })
  @MaxLength(30)
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  title: string;

  @ApiProperty({
    example: 'Build and maintain scalable NestJS services and APIs.',
    minLength: 10,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @MinLength(10)
  description: string;

  @ApiProperty({ enum: JobTypeEnum, example: JobTypeEnum.FULL_TIME })
  @IsEnum(JobTypeEnum)
  type: JobTypeEnum;

  @ApiProperty({
    type: [String],
    example: ['Engineering', 'Backend'],
    maxItems: 10,
  })
  @ArrayNotEmpty()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  departments: string[];

  @ApiProperty({
    example: '3+ years with Node.js, TypeScript, and PostgreSQL.',
    minLength: 10,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @MinLength(3)
  requirements: string;

  @ApiProperty({
    example: true,
    description: 'Send invitation emails to candidates when job is active',
  })
  @IsBoolean()
  sendEmailToCandidates: boolean;

  @ApiProperty({
    example: true,
    description: 'Share interview feedback with candidates',
  })
  @IsBoolean()
  shareFeedback: boolean;

  @ApiProperty({
    example: 1775001600000,
    description: 'Job start date as Unix timestamp in milliseconds',
  })
  @IsTimestamp({ message: 'startDate must be a valid timestamp' })
  startDate: number;

  @ApiProperty({
    example: 1777680000000,
    description: 'Job end date as Unix timestamp in milliseconds',
  })
  @IsTimestamp({ message: 'endDate must be a valid timestamp' })
  endDate: number;

  @ApiProperty({
    type: [String],
    format: 'uuid',
    example: ['50d05366-a485-4b84-a2cc-f7bb0f58472e'],
    maxItems: 10,
    description: 'List of associated mock interview IDs',
  })
  @ArrayMaxSize(10)
  @IsUUID('4', { each: true })
  mockIds: string[];
}
