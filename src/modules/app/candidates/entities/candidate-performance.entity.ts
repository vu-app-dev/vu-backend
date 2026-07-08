import { BaseModel } from 'src/common/database/base-model';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Candidate } from './candidate.entity';
import { CandidateCheatEnum } from '../enums/candidate-cheat.enum';
@Entity()
export class CandidatePerformance extends BaseModel {
  @OneToOne(() => Candidate, (candidate) => candidate.performance, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'candidateId' })
  candidate: Candidate;

  @Column()
  candidateId: string;

  @Column({ type: 'float' })
  score: number;

  @Column({ type: 'enum', enum: CandidateCheatEnum })
  cheat: CandidateCheatEnum;

  @Column({ type: 'float' })
  communication: number;

  @Column({ type: 'float' })
  problemSolving: number;

  @Column({ type: 'float' })
  technical: number;

  @Column({ type: 'float' })
  confidence: number;

  @Column({ type: 'float' })
  eyeContact: number;

  @Column({ type: 'float' })
  speaking: number;

  @Column({ type: 'float' })
  clarityOfExplanation: number;

  @Column({ type: 'float' })
  structuredThinking: number;

  @Column({ type: 'float' })
  askingClarifications: number;

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ type: 'text', nullable: true })
  overallSummary: string;
}
