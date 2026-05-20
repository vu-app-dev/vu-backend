import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { JobService } from '../services/job.service';
import { CompanyAuth } from 'src/common/decorators/company-auth.decorator';
import { CompanyUserTypeEnum } from '../../companies/enums/company-user-type.enum';
import { CreateJobInput } from '../inputs/create-job.input';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '../../auth-base/user/entities/user.entity';
import { UpdateJobInput } from '../inputs/update-job.input';
import { PaginatedJobQueryInput } from '../inputs/paginated-job-query.input';
import { Job } from '../entities/job.entity';
import { PaginatedResponse } from 'src/common/types/paginated-response.type';
import {
  ApiExtraModels,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';

@ApiExtraModels(CreateJobInput, UpdateJobInput)
@ApiTags('Jobs')
@ApiBearerAuth('access-token')
@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  // ------------------------------- Get --------------------------------------- //
  @Get('public-get/:jobId')
  @ApiOperation({ summary: 'Get job details by ID' })
  @ApiParam({
    name: 'jobId',
    format: 'uuid',
    example: 'f168e302-f8a4-4cd4-9f7e-f09180f48eec',
  })
  @ApiOkResponse({ type: Job })
  async getPublicJob(
    @Param('jobId', ParseUUIDPipe) jobId: string
  ): Promise<Job> {
    return this.jobService.getPublicJob(jobId);
  }

  @CompanyAuth()
  @Get('get/:jobId')
  @ApiOperation({ summary: 'Get job details by ID' })
  @ApiParam({
    name: 'jobId',
    format: 'uuid',
    example: 'f168e302-f8a4-4cd4-9f7e-f09180f48eec',
  })
  @ApiOkResponse({ type: Job })
  async getJob(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @CurrentUser() user: User,
  ): Promise<Job> {
    return this.jobService.getJob(jobId, user);
  }

  @Get('get_paginated')
  @CompanyAuth()
  @ApiOperation({ summary: 'Get paginated jobs for current company' })
  @ApiQuery({
    name: 'paginate',
    required: false,
    style: 'deepObject',
    explode: true,
    schema: {
      type: 'object',
      properties: {
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
      },
    },
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    style: 'deepObject',
    explode: true,
    schema: {
      type: 'object',
      properties: {
        search: { type: 'string', example: 'backend' },
        status: { type: 'string', example: 'ACTIVE' },
        type: { type: 'string', example: 'FULL_TIME' },
      },
    },
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    style: 'deepObject',
    explode: true,
    schema: {
      type: 'object',
      properties: {
        field: { type: 'string', example: 'createdAt' },
        dir: { type: 'string', example: 'DESC' },
      },
    },
  })
  @ApiOkResponse({ description: 'Paginated jobs response' })
  async getPaginatedJobs(
    @CurrentUser() user: User,
    @Query() query: PaginatedJobQueryInput,
  ): Promise<PaginatedResponse<Job>> {
    return this.jobService.getPaginatedJobs(query, user);
  }

  // ------------------------------- Post --------------------------------------- //
  @CompanyAuth({
    types: [CompanyUserTypeEnum.OWNER, CompanyUserTypeEnum.EDITOR],
  })
  @Post('create')
  @ApiOperation({ summary: 'Create a new job for current company' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['input'],
      properties: {
        input: { $ref: getSchemaPath(CreateJobInput) },
      },
      example: {
        input: {
          title: 'Senior Backend Engineer',
          description: 'Build and maintain scalable NestJS services and APIs.',
          type: 'FULL_TIME',
          departments: ['Engineering', 'Backend'],
          requirements: '3+ years with Node.js, TypeScript, and PostgreSQL.',
          sendEmailToCandidates: true,
          shareFeedback: true,
          startDate: 1775001600000,
          endDate: 1777680000000,
          mockIds: ['50d05366-a485-4b84-a2cc-f7bb0f58472e'],
        },
      },
    },
  })
  @ApiOkResponse({ type: Job })
  async createJob(
    @Body('input') input: CreateJobInput,
    @CurrentUser() user: User,
  ): Promise<Job> {
    return this.jobService.createJob(input, user);
  }

  // ------------------------------ Patch --------------------------------------- //
  @CompanyAuth({
    types: [CompanyUserTypeEnum.OWNER, CompanyUserTypeEnum.EDITOR],
  })
  @Patch('update/:jobId')
  @ApiOperation({ summary: 'Update an existing job by ID' })
  @ApiParam({
    name: 'jobId',
    format: 'uuid',
    example: 'f168e302-f8a4-4cd4-9f7e-f09180f48eec',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['input'],
      properties: {
        input: { $ref: getSchemaPath(UpdateJobInput) },
      },
      example: {
        input: {
          title: 'Lead Backend Engineer',
          shareFeedback: false,
        },
      },
    },
  })
  @ApiOkResponse({ type: Job })
  async updateJob(
    @Body('input') input: UpdateJobInput,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @CurrentUser() user: User,
  ): Promise<Job> {
    return this.jobService.updateJob(jobId, input, user);
  }

  // ------------------------------ Delete --------------------------------------- //
  @CompanyAuth({
    types: [CompanyUserTypeEnum.OWNER, CompanyUserTypeEnum.EDITOR],
  })
  @Delete('delete/:jobId')
  @ApiOperation({ summary: 'Delete a job by ID' })
  @ApiParam({
    name: 'jobId',
    format: 'uuid',
    example: 'f168e302-f8a4-4cd4-9f7e-f09180f48eec',
  })
  @ApiOkResponse({ description: 'Job deleted successfully' })
  async deleteJob(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.jobService.deleteJob(jobId, user);
  }
}
