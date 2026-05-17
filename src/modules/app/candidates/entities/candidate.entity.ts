import { BaseModel } from 'src/common/database/base-model';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Job } from '../../jobs/entities/job.entity';
import { CandidateQuestion } from './candidate-question.entity';
import { CandidateCvAnalysis } from './candidate-cv-analysis.entity';
import { CandidatePerformance } from './candidate-performance.entity';
import { Company } from '../../companies/entities/company.entity';
import { CandidateStatusEnum } from '../enums/candidate-status.enum';

@Entity()
export class Candidate extends BaseModel {
  @ManyToOne(() => Job, (job) => job.candidates, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'jobId' })
  job: Job;

  @ManyToOne(() => Company, (company) => company.candidates, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ nullable: true })
  jobId?: string;

  @Column()
  companyId: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  cvUrl: string;

  @Column({
    type: 'enum',
    enum: CandidateStatusEnum,
    default: CandidateStatusEnum.PENDING,
  })
  status: CandidateStatusEnum;

  @OneToMany(() => CandidateQuestion, (question) => question.candidate)
  questions: CandidateQuestion[];

  @OneToOne(() => CandidateCvAnalysis, (analysis) => analysis.candidate)
  analysis: CandidateCvAnalysis;

  @OneToOne(() => CandidatePerformance, (performance) => performance.candidate)
  performance: CandidatePerformance;
}
