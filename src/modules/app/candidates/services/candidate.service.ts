import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Candidate } from '../entities/candidate.entity';
import { CandidateQuestion } from '../entities/candidate-question.entity';
import { CandidateCvAnalysis } from '../entities/candidate-cv-analysis.entity';
import { CandidatePerformance } from '../entities/candidate-performance.entity';
import { Repository } from 'typeorm';
import { User } from '../../auth-base/user/entities/user.entity';
import { StatusCodeEnum } from 'src/common/enums/status-code.enum';
import { PaginatedCandidateQueryInput } from '../inputs/paginated-candidate-query.input';
import { PaginatedResponse } from 'src/common/types/paginated-response.type';
import { AppHelperService } from 'src/modules/core/helper/helper.services';
import { UpdateCandidateStatusInput } from '../inputs/update-candidate-status.input';
import { SortDirectionEnum } from 'src/common/enums/sort.enum';
import { CandidateSortFieldsEnum } from '../enums/candidate-sort-fields.enum';
import { ApplyForJobInput } from '../inputs/apply-for-job.input';
import { Job } from '../../jobs/entities/job.entity';
import { Company } from '../../companies/entities/company.entity';
import { FileReferenceService } from 'src/modules/core/file/services/file-reference.service';
import { FileModelNameEnum } from 'src/modules/core/file/enums/file-model.enum';
import { CreatePerformanceInput } from '../inputs/create-performance.input';
import { CreateCvAnalysisInput } from '../inputs/create-cv-analysis.input';
import { CreateQuestionInput } from '../inputs/create-question.input';
import { UpdatePerformanceCheatInput } from '../inputs/update-performance-cheat.input';

@Injectable()
export class CandidateService {
  constructor(
    @InjectRepository(Candidate)
    private readonly candidateRepo: Repository<Candidate>,
    @InjectRepository(CandidateQuestion)
    private readonly questionRepo: Repository<CandidateQuestion>,
    @InjectRepository(CandidateCvAnalysis)
    private readonly cvAnalysisRepo: Repository<CandidateCvAnalysis>,
    @InjectRepository(CandidatePerformance)
    private readonly performanceRepo: Repository<CandidatePerformance>,
    private readonly appHelper: AppHelperService,
    private readonly fileReferenceService: FileReferenceService,
  ) {}

  async applyForJob(
    companyId: string,
    jobId: string,
    input: ApplyForJobInput,
  ): Promise<{ candidateId: string }> {
    const { name, email, cvUrl } = input;

    const candidate = this.candidateRepo.create({
      jobId,
      companyId,
      name,
      email,
      cvUrl,
    });

    await this.fileReferenceService.markFilesAsReferenced(
      [cvUrl],
      FileModelNameEnum.CANDIDATE,
    );

    const saved = await this.candidateRepo.save(candidate);

    return { candidateId: saved.id };
  }

  async getCandidate(candidateId: string, user: User) {
    const candidate = await this.candidateRepo.findOne({
      where: { id: candidateId },
      relations: {
        questions: true,
        analysis: true,
        performance: true,
      },
    });

    if (!candidate)
      throw new HttpException(
        'Candidate Not Found',
        StatusCodeEnum.CANDIDATE_NOT_FOUND,
      );

    this.validateCandidateUser(candidate, user);

    return candidate;
  }

  async getPaginatedCandidates(
    query: PaginatedCandidateQueryInput,
    user: User,
  ): Promise<PaginatedResponse<Candidate>> {
    const companyId = user.companyUser.companyId;
    const { filter, paginate, sort } = query;
    const page = paginate?.page || 1,
      limit = paginate?.limit || 10;

    const qb = this.candidateRepo
      .createQueryBuilder('candidate')
      .leftJoinAndSelect('candidate.performance', 'performance')
      .leftJoinAndSelect('candidate.analysis', 'analysis')
      .where('candidate.companyId = :companyId', { companyId });

    if (filter) {
      if (filter.search) {
        const search = `%${this.appHelper.trimAllSpaces(filter.search)}%`;
        qb.andWhere(
          '(candidate.name ILIKE :search OR candidate.email ILIKE :search)',
          { search },
        );
      }

      if (filter.jobId)
        qb.andWhere('candidate.jobId = :jobId', { jobId: filter.jobId });

      if (filter.status)
        qb.andWhere('candidate.status = :status', { status: filter.status });

      if (filter.cheat)
        qb.andWhere('performance.cheat = :cheat', { cheat: filter.cheat });

      if (filter.minScore !== undefined)
        qb.andWhere('performance.score >= :minScore', {
          minScore: Math.ceil(filter.minScore),
        });

      if (filter.maxScore !== undefined)
        qb.andWhere('performance.score <= :maxScore', {
          maxScore: Math.floor(filter.maxScore),
        });
    }

    const sortDirection = sort?.dir || SortDirectionEnum.DESC;

    switch (sort?.field) {
      case CandidateSortFieldsEnum.NAME:
        qb.orderBy('candidate.name', sortDirection);
        break;
      case CandidateSortFieldsEnum.SCORE:
        qb.orderBy('performance.score', sortDirection);
        break;
      case CandidateSortFieldsEnum.CREATED_AT:
      default:
        qb.orderBy('candidate.createdAt', sortDirection);
        break;
    }

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      hasNext: total > page * limit,
      hasPrevious: page > 1,
    };
  }

  async updateCandidateStatus(
    // TODO: Need reply to the candidate when status is updated - one-time updatable
    candidateId: string,
    input: UpdateCandidateStatusInput,
    user: User,
  ) {
    const { status } = input;
    const candidate = await this.candidateRepo.findOne({
      where: { id: candidateId },
      relations: { performance: true },
    });
    if (!candidate)
      throw new HttpException(
        'Candidate Not Found',
        StatusCodeEnum.CANDIDATE_NOT_FOUND,
      );

    this.validateCandidateUser(candidate, user);

    candidate.status = status;
    await this.candidateRepo.save(candidate);

    return true;
  }

  async createPerformance(candidateId: string, input: CreatePerformanceInput) {
    const candidate = await this.candidateRepo.findOne({
      where: { id: candidateId },
    });
    if (!candidate)
      throw new HttpException(
        'Candidate Not Found',
        StatusCodeEnum.CANDIDATE_NOT_FOUND,
      );

    const existing = await this.performanceRepo.findOne({
      where: { candidateId },
    });
    if (existing)
      throw new HttpException(
        'Performance already exists for this candidate',
        StatusCodeEnum.CANDIDATE_NOT_FOUND,
      );

    const performance = this.performanceRepo.create({
      ...input,
      candidateId,
    });
    await this.performanceRepo.save(performance);
    return true;
  }

  async createCvAnalysis(candidateId: string, input: CreateCvAnalysisInput) {
    const candidate = await this.candidateRepo.findOne({
      where: { id: candidateId },
    });
    if (!candidate)
      throw new HttpException(
        'Candidate Not Found',
        StatusCodeEnum.CANDIDATE_NOT_FOUND,
      );

    const existing = await this.cvAnalysisRepo.findOne({
      where: { candidateId },
    });
    if (existing)
      throw new HttpException(
        'CV analysis already exists for this candidate',
        StatusCodeEnum.CANDIDATE_NOT_FOUND,
      );

    const analysis = this.cvAnalysisRepo.create({
      ...input,
      candidateId,
    });
    await this.cvAnalysisRepo.save(analysis);
    return true;
  }

  async createQuestion(candidateId: string, input: CreateQuestionInput) {
    const candidate = await this.candidateRepo.findOne({
      where: { id: candidateId },
    });
    if (!candidate)
      throw new HttpException(
        'Candidate Not Found',
        StatusCodeEnum.CANDIDATE_NOT_FOUND,
      );

    const question = this.questionRepo.create({
      ...input,
      candidateId,
    });
    await this.questionRepo.save(question);
    return true;
  }

  async updatePerformanceCheat(
    candidateId: string,
    input: UpdatePerformanceCheatInput,
  ) {
    const performance = await this.performanceRepo.findOne({
      where: { candidateId },
    });
    if (!performance)
      throw new HttpException(
        'Performance Not Found',
        StatusCodeEnum.CANDIDATE_NOT_FOUND,
      );

    performance.cheat = input.cheat;
    await this.performanceRepo.save(performance);
    return true;
  }

  // Private Methods
  private validateCandidateUser(candidate: Candidate, user: User) {
    if (candidate.companyId !== user.companyUser.companyId) {
      throw new HttpException(
        'You can not access this candidate',
        StatusCodeEnum.FORBIDDEN,
      );
    }
  }
}
