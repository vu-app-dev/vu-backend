import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Mock } from '../entities/mock.entity';
import { FindOptionsWhere, ILike, In, Repository } from 'typeorm';
import {
  CreateMockInput,
  MockQuestionInput,
} from '../inputs/create-mock.input';
import { MockQuestion } from '../entities/mock-question.entity';
import { UpdateMockInput } from '../inputs/update-mock.input';
import { StatusCodeEnum } from 'src/common/enums/status-code.enum';
import { User } from '../../auth-base/user/entities/user.entity';
import { PaginatedMockQueryInput } from '../inputs/paginated-mock-query.input';
import { AppHelperService } from 'src/modules/core/helper/helper.services';
import { PaginatedResponse } from 'src/common/types/paginated-response.type';
import { Job } from '../../jobs/entities/job.entity';
import { JobMock } from '../../jobs/entities/job-mock.entity';
import { SortDirectionEnum } from 'src/common/enums/sort.enum';
import { MockSortFieldsEnum } from '../enums/mock-sort-fields.enum';

@Injectable()
export class MockService {
  constructor(
    @InjectRepository(Mock) private readonly mockRepo: Repository<Mock>,
    @InjectRepository(MockQuestion)
    private readonly mockQuestionRepo: Repository<MockQuestion>,
    private readonly appHelper: AppHelperService,
    @InjectRepository(Job) private readonly jobRepo: Repository<Job>,
    @InjectRepository(JobMock)
    private readonly jobMockRepo: Repository<JobMock>,
  ) {}

  async getMock(mockId: string, user: User) {
    const mock = await this.mockRepo.findOne({
      where: { id: mockId },
      relations: { questions: true, mockJobs: { job: true } },
    });

    if (!mock)
      throw new HttpException('Mock Not Found', StatusCodeEnum.MOCK_NOT_FOUND);

    this.validateMockUser(mock, user);

    return mock;
  }

  async getPaginatedMocks(
    query: PaginatedMockQueryInput,
    user: User,
  ): Promise<PaginatedResponse<Mock>> {
    const companyId = user.companyUser.companyId;
    const { filter, paginate, sort } = query;

    const qb = this.mockRepo
      .createQueryBuilder('mock')
      .leftJoinAndSelect('mock.questions', 'question')
      .leftJoinAndSelect('mock.mockJobs', 'mockJob')
      .leftJoinAndSelect('mockJob.job', 'job')
      .where('mock."companyId" = :companyId', { companyId });

    if (filter) {
      if (filter.search) {
        const search = `%${this.appHelper.trimAllSpaces(filter.search)}%`;
        qb.andWhere(
          '(mock.title ILIKE :search OR mock.description ILIKE :search OR mock.topics::text ILIKE :search OR mock.technologies::text ILIKE :search)',
          { search },
        );
      }
      if (filter.difficulty) {
        qb.andWhere('mock.difficulty = :difficulty', {
          difficulty: filter.difficulty,
        });
      }
      if (filter.type) {
        qb.andWhere('mock.type = :type', { type: filter.type });
      }
      if (filter.enableFollowUpQuestions !== undefined) {
        qb.andWhere(
          'mock."enableFollowUpQuestions" = :enableFollowUpQuestions',
          { enableFollowUpQuestions: filter.enableFollowUpQuestions },
        );
      }
      if (filter.enableRecordReplay !== undefined) {
        qb.andWhere('mock."enableRecordReplay" = :enableRecordReplay', {
          enableRecordReplay: filter.enableRecordReplay,
        });
      }
    }

    const page = paginate?.page || 1,
      limit = paginate?.limit || 10;

    const sortDirection = sort?.dir || SortDirectionEnum.DESC;

    switch (sort?.field) {
      case MockSortFieldsEnum.TITLE:
        qb.orderBy('mock.title', sortDirection);
        break;
      case MockSortFieldsEnum.CREATED_AT:
      default:
        qb.orderBy('mock.createdAt', sortDirection);
        break;
    }

    const [items, total] = await qb
      .take(limit)
      .skip((page - 1) * limit)
      .getManyAndCount();

    for (const item of items) {
      if (item.questions?.length) {
        item.questions.sort((a, b) => a.order - b.order);
      }
    }

    return {
      items,
      total,
      hasNext: total > page * limit,
      hasPrevious: page > 1,
    };
  }

  async createMock(input: CreateMockInput, user: User) {
    const { questions, ...mockInput } = input;

    if (mockInput.jobIds.length) {
      await this.validateJobsExist(mockInput.jobIds);
    }

    let mock = this.mockRepo.create({
      ...mockInput,
      companyId: user.companyUser.companyId,
    });
    await this.mockRepo.save(mock);

    if (mockInput.jobIds.length) {
      await this.addJobsToMock(mock, mockInput.jobIds);
    }

    if (questions.length) {
      this.validateQuestionsOrder(questions.map((q) => q.order));
      mock = await this.addQuestionsToMock(mock, questions);
    }

    return mock;
  }

  async updateMock(mockId: string, input: UpdateMockInput, user: User) {
    const { jobIds, questions, ...mockData } = input;

    let mock = await this.mockRepo.findOne({
      where: { id: mockId },
    });

    if (!mock)
      throw new HttpException('Mock Not Found', StatusCodeEnum.MOCK_NOT_FOUND);

    this.validateMockUser(mock, user);

    Object.assign(mock, mockData);
    await this.mockRepo.save(mock);

    // if questions is null or undefined, no update
    // else, remove old question and add new questions
    if (questions) {
      await this.mockQuestionRepo.delete({ mockId });

      if (questions.length) {
        this.validateQuestionsOrder(questions.map((q) => q.order));
        mock = await this.addQuestionsToMock(mock, questions);
      }
    }

    if (jobIds) {
      await this.jobMockRepo.delete({ mockId });

      if (jobIds.length) {
        await this.addJobsToMock(mock, jobIds);
      }
    }

    return mock;
  }

  async deleteMock(mockId: string, user: User) {
    const mock = await this.mockRepo.findOne({
      where: { id: mockId },
    });

    const isInJobs = await this.jobMockRepo.findOne({
      where: { mockId },
    });

    if (isInJobs)
      throw new HttpException(
        'Mock is in use in some jobs and can not be deleted',
        StatusCodeEnum.MOCK_IN_USE,
      );

    if (!mock)
      throw new HttpException('Mock Not Found', StatusCodeEnum.MOCK_NOT_FOUND);

    this.validateMockUser(mock, user);

    await this.mockRepo.remove(mock);
    return true;
  }

  // ------------------------------- PRIVATE ------------------------------- //
  private validateMockUser(mock: Mock, user: User) {
    if (mock.companyId !== user.companyUser.companyId)
      throw new HttpException(
        'You can not access this mock',
        StatusCodeEnum.FORBIDDEN,
      );
  }

  private async addQuestionsToMock(
    mock: Mock,
    questionsInput: MockQuestionInput[],
  ) {
    const newQuestionsData = questionsInput.map((question) => ({
      ...question,
      mockId: mock.id,
    }));

    const newQuestions = await this.mockQuestionRepo.save(newQuestionsData);

    mock.questions = newQuestions;

    return mock;
  }

  private async validateJobsExist(jobIds: string[]) {
    const jobCount = await this.jobRepo.count({
      where: { id: In(jobIds) },
      select: { id: true },
    });

    if (jobCount !== jobIds.length)
      throw new HttpException('Job Not Found', StatusCodeEnum.JOB_NOT_FOUND);
  }

  private async addJobsToMock(mock: Mock, jobIds: string[]) {
    await this.validateJobsExist(jobIds);

    const mockJobsData = jobIds.map((jobId) => ({
      jobId,
      mockId: mock.id,
    }));

    const mockJobs = await this.jobMockRepo.save(mockJobsData);

    mock.mockJobs = mockJobs;

    return mock;
  }

  private validateQuestionsOrder(orders: number[]) {
    const isQuestionsOrderValid = this.appHelper.isValidSequence(orders);

    if (!isQuestionsOrderValid)
      throw new HttpException(
        'Questions order is not valid',
        StatusCodeEnum.BAD_REQUEST,
      );

    return;
  }
}
