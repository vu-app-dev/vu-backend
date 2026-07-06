import { IsArray, IsNumber, IsString, Min, Max, IsOptional } from 'class-validator';

export class CreateQuestionInput {
  @IsString()
  question: string;

  @IsString()
  answer: string;

  @IsString()
  aiFeedback: string;

  @IsArray()
  @IsString({ each: true })
  strength: string[];

  @IsArray()
  @IsString({ each: true })
  areasToImprove: string[];

  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @IsNumber()
  @Min(0)
  durationInMinutes: number;
}
