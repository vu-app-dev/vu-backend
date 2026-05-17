import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginateInput } from 'src/common/inputs/paginate.input';
import { DifficultyEnum } from '../enums/difficulty.enum';
import { MockTypeEnum } from '../enums/mock-type.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SortDirectionEnum } from 'src/common/enums/sort.enum';
import { MockSortFieldsEnum } from '../enums/mock-sort-fields.enum';

export class MockFilterInput {
  @ApiPropertyOptional({
    example: 'node',
    description: 'Text search for mock title/description',
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  search?: string;

  @ApiPropertyOptional({
    enum: DifficultyEnum,
    example: DifficultyEnum.MEDIUM,
  })
  @IsEnum(DifficultyEnum)
  @IsOptional()
  difficulty?: DifficultyEnum;

  @ApiPropertyOptional({
    enum: MockTypeEnum,
    example: MockTypeEnum.TECHNICAL,
  })
  @IsEnum(MockTypeEnum)
  @IsOptional()
  type?: MockTypeEnum;

  @ApiPropertyOptional({ example: true })
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  enableFollowUpQuestions?: boolean;

  @ApiPropertyOptional({ example: false })
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  enableRecordReplay?: boolean;
}

export class MockSortInput {
  @ApiPropertyOptional({
    enum: SortDirectionEnum,
    example: SortDirectionEnum.DESC,
  })
  @IsOptional()
  @IsEnum(SortDirectionEnum)
  dir?: SortDirectionEnum;

  @ApiProperty({
    enum: MockSortFieldsEnum,
    example: MockSortFieldsEnum.CREATED_AT,
  })
  @IsEnum(MockSortFieldsEnum)
  field: MockSortFieldsEnum;
}

export class PaginatedMockQueryInput extends PaginateInput {
  @ApiPropertyOptional({ type: () => MockFilterInput })
  @ValidateNested()
  @Type(() => MockFilterInput)
  @IsOptional()
  filter?: MockFilterInput;

  @ApiPropertyOptional({ type: () => MockSortInput })
  @ValidateNested()
  @Type(() => MockSortInput)
  @IsOptional()
  sort?: MockSortInput;
}
