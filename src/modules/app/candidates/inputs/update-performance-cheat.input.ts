import { IsEnum } from 'class-validator';
import { CandidateCheatEnum } from '../enums/candidate-cheat.enum';

export class UpdatePerformanceCheatInput {
  @IsEnum(CandidateCheatEnum)
  cheat: CandidateCheatEnum;
}
