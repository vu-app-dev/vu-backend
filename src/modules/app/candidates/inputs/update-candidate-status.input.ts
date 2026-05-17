import { IsEnum, IsIn } from 'class-validator';
import { CandidateStatusEnum } from '../enums/candidate-status.enum';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCandidateStatusInput {
  @ApiProperty({
    enum: [CandidateStatusEnum.ACCEPTED, CandidateStatusEnum.REJECTED],
    example: CandidateStatusEnum.ACCEPTED,
    description: 'Final decision for candidate',
  })
  @IsEnum(CandidateStatusEnum)
  @IsIn([CandidateStatusEnum.ACCEPTED, CandidateStatusEnum.REJECTED, CandidateStatusEnum.SHORTLISTED])
  status: CandidateStatusEnum;
}
