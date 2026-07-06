import { IsArray, IsNumber, IsString, Min, Max } from 'class-validator';

export class CreateCvAnalysisInput {
  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @IsString()
  summary: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;
}
