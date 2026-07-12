import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CompanyAuth } from 'src/common/decorators/company-auth.decorator';
import { ApiKeyAuth } from 'src/common/decorators/api-key-auth.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '../../auth-base/user/entities/user.entity';
import { CandidateService } from '../services/candidate.service';
import { Candidate } from '../entities/candidate.entity';
import { PaginatedResponse } from 'src/common/types/paginated-response.type';
import { PaginatedCandidateQueryInput } from '../inputs/paginated-candidate-query.input';
import { CompanyUserTypeEnum } from '../../companies/enums/company-user-type.enum';
import { UpdateCandidateStatusInput } from '../inputs/update-candidate-status.input';
import { ApplyForJobInput } from '../inputs/apply-for-job.input';
import { CreatePerformanceInput } from '../inputs/create-performance.input';
import { CreateCvAnalysisInput } from '../inputs/create-cv-analysis.input';
import { CreateQuestionInput } from '../inputs/create-question.input';
import { UpdatePerformanceCheatInput } from '../inputs/update-performance-cheat.input';
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

@ApiExtraModels(
  ApplyForJobInput,
  UpdateCandidateStatusInput,
  CreatePerformanceInput,
  CreateCvAnalysisInput,
  CreateQuestionInput,
  UpdatePerformanceCheatInput,
)
@ApiTags('Candidates')
@Controller('candidates')
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  // GET
  @CompanyAuth()
  @Get('get/:candidateId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get candidate details by ID' })
  @ApiParam({
    name: 'candidateId',
    format: 'uuid',
    example: 'deab2f9f-2507-4f26-9f39-069d95dce916',
  })
  @ApiOkResponse({ type: Candidate })
  async getCandidate(
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
    @CurrentUser() user: User,
  ): Promise<Candidate> {
    return this.candidateService.getCandidate(candidateId, user);
  }

  @CompanyAuth()
  @Get('video/:candidateId')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get optimized Cloudinary streaming URLs for a candidate video',
  })
  @ApiParam({
    name: 'candidateId',
    format: 'uuid',
    example: 'deab2f9f-2507-4f26-9f39-069d95dce916',
  })
  @ApiOkResponse({
    description: 'Cloudinary streaming URLs for the interview recording',
    schema: {
      type: 'object',
      properties: {
        publicId: { type: 'string' },
        hlsUrl: {
          type: 'string',
          description: 'Adaptive-bitrate HLS manifest (preferred stream)',
        },
        mp4Url: {
          type: 'string',
          description: 'Quality-optimized MP4 fallback',
        },
      },
    },
  })
  async getCandidateVideo(
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
    @CurrentUser() user: User,
  ) {
    return this.candidateService.getCandidateVideo(candidateId, user);
  }

  @Get('get_paginated')
  @CompanyAuth()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get paginated candidates for the current company' })
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
        search: { type: 'string', example: 'frontend' },
        status: { type: 'string', example: 'Shortlisted' },
        cheat: { type: 'string', example: 'Clean' },
        jobId: { type: 'string', format: 'uuid' },
        minScore: { type: 'number', example: 20 },
        maxScore: { type: 'number', example: 90 },
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
  @ApiOkResponse({
    description: 'Paginated candidates response',
  })
  async getPaginatedCandidates(
    @CurrentUser() user: User,
    @Query() query: PaginatedCandidateQueryInput,
  ): Promise<PaginatedResponse<Candidate>> {
    return this.candidateService.getPaginatedCandidates(query, user);
  }

  // POST
  @Post('apply/:companyId/:jobId')
  @ApiOperation({ summary: 'Apply for a specific company job' })
  @ApiParam({
    name: 'companyId',
    format: 'uuid',
    example: '9a0f5e03-2732-4b79-a2e3-0cc4491dcbec',
  })
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
        input: { $ref: getSchemaPath(ApplyForJobInput) },
      },
      example: {
        input: {
          name: 'Omar Nasser',
          email: 'omar.nasser@example.com',
          cvUrl: 'https://cdn.example.com/cv/omar-nasser.pdf',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Application submitted successfully' })
  async applyForJob(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body('input') input: ApplyForJobInput,
  ): Promise<{ candidateId: string }> {
    return this.candidateService.applyForJob(companyId, jobId, input);
  }

  // PATCH
  @CompanyAuth({
    types: [CompanyUserTypeEnum.OWNER, CompanyUserTypeEnum.EDITOR],
  })
  @Patch('update/:candidateId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update candidate final status' })
  @ApiParam({
    name: 'candidateId',
    format: 'uuid',
    example: 'deab2f9f-2507-4f26-9f39-069d95dce916',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['input'],
      properties: {
        input: { $ref: getSchemaPath(UpdateCandidateStatusInput) },
      },
      example: {
        input: {
          status: 'Accepted',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Candidate status updated' })
  async updateCandidateStatus(
    @Body('input') input: UpdateCandidateStatusInput,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.candidateService.updateCandidateStatus(
      candidateId,
      input,
      user,
    );
  }

  // AI Service Endpoints (API Key Auth)

  @ApiKeyAuth()
  @Post(':candidateId/performance')
  @ApiOperation({ summary: 'Create candidate performance (AI service)' })
  @ApiParam({ name: 'candidateId', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        score: { type: 'number' },
        cheat: { type: 'string' },
        communication: { type: 'number' },
        problemSolving: { type: 'number' },
        technical: { type: 'number' },
        confidence: { type: 'number' },
        eyeContact: { type: 'number' },
        speaking: { type: 'number' },
        clarityOfExplanation: { type: 'number' },
        structuredThinking: { type: 'number' },
        askingClarifications: { type: 'number', nullable: true },
        overallSummary: { type: 'string' },
        videoUrl: { type: 'string' },
      },
    },
  })
  @ApiOkResponse({ description: 'Performance created' })
  async createPerformance(
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
    @Body() input: CreatePerformanceInput,
  ): Promise<boolean> {
    return this.candidateService.createPerformance(candidateId, input);
  }

  @ApiKeyAuth()
  @Post(':candidateId/cv-analysis')
  @ApiOperation({ summary: 'Create candidate CV analysis (AI service)' })
  @ApiParam({ name: 'candidateId', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        skills: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        score: { type: 'number' },
      },
    },
  })
  @ApiOkResponse({ description: 'CV analysis created' })
  async createCvAnalysis(
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
    @Body() input: CreateCvAnalysisInput,
  ): Promise<boolean> {
    return this.candidateService.createCvAnalysis(candidateId, input);
  }

  @ApiKeyAuth()
  @Post(':candidateId/questions')
  @ApiOperation({ summary: 'Create candidate question (AI service)' })
  @ApiParam({ name: 'candidateId', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        question: { type: 'string' },
        answer: { type: 'string' },
        aiFeedback: { type: 'string' },
        strength: { type: 'array', items: { type: 'string' } },
        areasToImprove: { type: 'array', items: { type: 'string' } },
        score: { type: 'number' },
        durationInMinutes: { type: 'number' },
      },
    },
  })
  @ApiOkResponse({ description: 'Question created' })
  async createQuestion(
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
    @Body() input: CreateQuestionInput,
  ): Promise<boolean> {
    return this.candidateService.createQuestion(candidateId, input);
  }

  @ApiKeyAuth()
  @Patch(':candidateId/performance')
  @ApiOperation({ summary: 'Update candidate performance cheat status (AI service)' })
  @ApiParam({ name: 'candidateId', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        cheat: { type: 'string' },
      },
    },
  })
  @ApiOkResponse({ description: 'Performance cheat status updated' })
  async updatePerformanceCheat(
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
    @Body() input: UpdatePerformanceCheatInput,
  ): Promise<boolean> {
    return this.candidateService.updatePerformanceCheat(candidateId, input);
  }
}
