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
import { MockService } from '../services/mock.service';
import { CompanyAuth } from 'src/common/decorators/company-auth.decorator';
import { CompanyUserTypeEnum } from '../../companies/enums/company-user-type.enum';
import { CreateMockInput } from '../inputs/create-mock.input';
import { UpdateMockInput } from '../inputs/update-mock.input';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '../../auth-base/user/entities/user.entity';
import { PaginatedMockQueryInput } from '../inputs/paginated-mock-query.input';
import { PaginatedResponse } from 'src/common/types/paginated-response.type';
import { Mock } from '../entities/mock.entity';
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

@ApiExtraModels(CreateMockInput, UpdateMockInput)
@ApiTags('Mocks')
@ApiBearerAuth('access-token')
@Controller('mock')
export class MockController {
  constructor(private readonly mockService: MockService) {}

  // --------------------------- GET ---------------------------
  @Get('get/:mockId')
  @CompanyAuth()
  @ApiOperation({ summary: 'Get mock details by ID' })
  @ApiParam({
    name: 'mockId',
    format: 'uuid',
    example: '50d05366-a485-4b84-a2cc-f7bb0f58472e',
  })
  @ApiOkResponse({ type: Mock })
  async getMock(
    @Param('mockId', ParseUUIDPipe) mockId: string,
    @CurrentUser() user: User,
  ): Promise<Mock> {
    return this.mockService.getMock(mockId, user);
  }

  @Get('get_paginated')
  @CompanyAuth()
  @ApiOperation({ summary: 'Get paginated mocks for current company' })
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
        search: { type: 'string', example: 'node' },
        difficulty: { type: 'string', example: 'MEDIUM' },
        type: { type: 'string', example: 'TECHNICAL' },
        enableFollowUpQuestions: { type: 'boolean', example: true },
        enableRecordReplay: { type: 'boolean', example: false },
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
  @ApiOkResponse({ description: 'Paginated mocks response' })
  async getPaginatedMocks(
    @CurrentUser() user: User,
    @Query() query: PaginatedMockQueryInput,
  ): Promise<PaginatedResponse<Mock>> {
    return this.mockService.getPaginatedMocks(query, user);
  }

  // --------------------------- POST ---------------------------
  @Post('create')
  @CompanyAuth({
    types: [CompanyUserTypeEnum.OWNER, CompanyUserTypeEnum.EDITOR],
  })
  @ApiOperation({ summary: 'Create a new mock interview template' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['input'],
      properties: {
        input: { $ref: getSchemaPath(CreateMockInput) },
      },
      example: {
        input: {
          title: 'Node.js Backend Mock',
          description:
            'Assess Node.js API design, testing, and scalability thinking.',
          difficulty: 'MEDIUM',
          type: 'TECHNICAL',
          estimatedTimeInMinutes: 45,
          technologies: ['Node.js', 'NestJS', 'PostgreSQL'],
          topics: ['REST APIs', 'Testing', 'Performance'],
          jobIds: ['f168e302-f8a4-4cd4-9f7e-f09180f48eec'],
          enableFollowUpQuestions: true,
          enableRecordReplay: false,
          questions: [
            {
              title: 'Explain event loop in Node.js',
              description:
                'Describe phases and how asynchronous callbacks are scheduled.',
              difficulty: 'MEDIUM',
              estimatedTimeInMinutes: 5,
              order: 1,
              answerType: 'FREE_TEXT',
              correctAnswer:
                'The event loop manages async callback execution phases.',
            },
          ],
        },
      },
    },
  })
  @ApiOkResponse({ type: Mock })
  async createNewMock(
    @Body('input') input: CreateMockInput,
    @CurrentUser() user: User,
  ): Promise<Mock> {
    return this.mockService.createMock(input, user);
  }

  // --------------------------- PATCH ---------------------------
  @Patch('update/:mockId')
  @CompanyAuth({
    types: [CompanyUserTypeEnum.OWNER, CompanyUserTypeEnum.EDITOR],
  })
  @ApiOperation({ summary: 'Update a mock interview template' })
  @ApiParam({
    name: 'mockId',
    format: 'uuid',
    example: '50d05366-a485-4b84-a2cc-f7bb0f58472e',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['input'],
      properties: {
        input: { $ref: getSchemaPath(UpdateMockInput) },
      },
      example: {
        input: {
          title: 'Advanced Node.js Backend Mock',
          enableRecordReplay: true,
        },
      },
    },
  })
  @ApiOkResponse({ type: Mock })
  async updateMock(
    @Param('mockId', ParseUUIDPipe) mockId: string,
    @Body('input') input: UpdateMockInput,
    @CurrentUser() user: User,
  ): Promise<Mock> {
    return this.mockService.updateMock(mockId, input, user);
  }

  // --------------------------- DELETE ---------------------------
  @Delete('delete/:mockId')
  @CompanyAuth({
    types: [CompanyUserTypeEnum.OWNER, CompanyUserTypeEnum.EDITOR],
  })
  @ApiOperation({ summary: 'Delete a mock interview template' })
  @ApiParam({
    name: 'mockId',
    format: 'uuid',
    example: '50d05366-a485-4b84-a2cc-f7bb0f58472e',
  })
  @ApiOkResponse({ description: 'Mock deleted successfully' })
  async deleteMock(
    @Param('mockId', ParseUUIDPipe) mockId: string,
    @CurrentUser() user: User,
  ): Promise<boolean> {
    return this.mockService.deleteMock(mockId, user);
  }
}
