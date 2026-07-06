import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { CandidateCheatEnum } from '../enums/candidate-cheat.enum';

export class CreatePerformanceInput {
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @IsEnum(CandidateCheatEnum)
  cheat: CandidateCheatEnum;

  @IsNumber()
  @Min(0)
  @Max(100)
  communication: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  problemSolving: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  technical: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  confidence: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  eyeContact: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  speaking: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  clarityOfExplanation: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  structuredThinking: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  askingClarifications: number;

  @IsOptional()
  @IsString()
  overallSummary?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;
}
