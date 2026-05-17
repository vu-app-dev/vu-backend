import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JobStatusEnum } from '../enums/job-status.enum';
import { JobTypeEnum } from '../enums/job-type.enum';
import { PaginateInput } from 'src/common/inputs/paginate.input';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SortDirectionEnum } from 'src/common/enums/sort.enum';
import { JobSortFieldsEnum } from '../enums/job-sort-fields.enum';

export class JobFilterInput {
  @ApiPropertyOptional({
    example: 'backend',
    description: 'Text search for job title/description',
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  search?: string;

  @ApiPropertyOptional({
    enum: JobStatusEnum,
    example: JobStatusEnum.ACTIVE,
  })
  @IsEnum(JobStatusEnum)
  @IsOptional()
  status?: JobStatusEnum;

  @ApiPropertyOptional({
    enum: JobTypeEnum,
    example: JobTypeEnum.FULL_TIME,
  })
  @IsEnum(JobTypeEnum)
  @IsOptional()
  type?: JobTypeEnum;
}

export class JobSortInput {
  @ApiPropertyOptional({
    enum: SortDirectionEnum,
    example: SortDirectionEnum.DESC,
  })
  @IsOptional()
  @IsEnum(SortDirectionEnum)
  dir?: SortDirectionEnum;

  @ApiProperty({
    enum: JobSortFieldsEnum,
    example: JobSortFieldsEnum.CREATED_AT,
  })
  @IsEnum(JobSortFieldsEnum)
  field: JobSortFieldsEnum;
}

export class PaginatedJobQueryInput extends PaginateInput {
  @ApiPropertyOptional({ type: () => JobFilterInput })
  @ValidateNested()
  @Type(() => JobFilterInput)
  @IsOptional()
  filter?: JobFilterInput;

  @ApiPropertyOptional({ type: () => JobSortInput })
  @ValidateNested()
  @Type(() => JobSortInput)
  @IsOptional()
  sort?: JobSortInput;
}
