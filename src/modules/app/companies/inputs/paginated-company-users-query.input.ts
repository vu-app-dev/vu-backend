import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginateInput } from 'src/common/inputs/paginate.input';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CompanyUserFilterInput {
  @ApiPropertyOptional({
    example: 'aya',
    description: 'Search by user first or last name',
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  search?: string;
}

export class PaginatedCompanyUsersQueryInput extends PaginateInput {
  @ApiPropertyOptional({ type: () => CompanyUserFilterInput })
  @ValidateNested()
  @Type(() => CompanyUserFilterInput)
  @IsOptional()
  filter?: CompanyUserFilterInput;
}
