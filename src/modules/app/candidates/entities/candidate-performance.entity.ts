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

  @Column()
  score: number;

  @Column({ type: 'enum', enum: CandidateCheatEnum })
  cheat: CandidateCheatEnum;

  @Column()
  communication: number;

  @Column()
  problemSolving: number;

  @Column()
  technical: number;

  @Column()
  confidence: number;

  @Column()
  eyeContact: number;

  @Column()
  speaking: number;

  @Column()
  clarityOfExplanation: number;

  @Column()
  structuredThinking: number;

  @Column()
  askingClarifications: number;

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ type: 'text', nullable: true })
  overallSummary: string;
}
