import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { Transactional } from 'typeorm-transactional';
import {
  RegisterManagerInput,
  RegisterUserInput,
} from '../inputs/register-manager.input';
import { RequestVerificationCodeInput } from '../inputs/request-verification-code.input';
import {
  ResetPasswordInput,
  VerifyEmailVerificationCodeInput,
} from '../inputs/verify-code.input';
import { LoginInput } from '../inputs/login.input';
import { User } from '../../user/entities/user.entity';
import { Auth } from 'src/common/decorators/auth.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { SessionEntity } from '../../session/entities/session.entity';
import { CurrentSessionId } from 'src/common/decorators/session.decorator';
import { LoginResponse } from '../responses/login.response';
import {
  ApiExtraModels,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';

@ApiExtraModels(
  RegisterManagerInput,
  RegisterUserInput,
  RequestVerificationCodeInput,
  VerifyEmailVerificationCodeInput,
  ResetPasswordInput,
  LoginInput,
)
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Transactional()
  @Post('register_manager')
  @ApiOperation({ summary: 'Register a company manager and create a company' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['input'],
      properties: {
        input: { $ref: getSchemaPath(RegisterManagerInput) },
      },
      example: {
        input: {
          userInput: {
            email: 'manager@acme.com',
            password: 'StrongPass1',
            confirmPassword: 'StrongPass1',
            firstName: 'Aya',
            lastName: 'Hassan',
            phone: '+201001234567',
            profilePictureUrl: 'https://cdn.example.com/profiles/aya.jpg',
          },
          companyInput: {
            name: 'Acme Labs',
            industry: 'Tech',
            website: 'https://acme.com',
            phone: '+201009876543',
            logoUrl: 'https://cdn.example.com/logos/acme.png',
            description: 'We build AI-based hiring products.',
          },
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Manager account and company created' })
  async registerAsCompanyManager(
    @Body('input') input: RegisterManagerInput,
  ): Promise<boolean> {
    return await this.authService.registerCompanyManager(input);
  }

  @Transactional()
  @Post('companies/:companyId/join_request')
  @ApiOperation({ summary: 'Submit a join request to an existing company' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['input'],
      properties: {
        input: { $ref: getSchemaPath(RegisterUserInput) },
      },
      example: {
        input: {
          email: 'employee@acme.com',
          password: 'StrongPass1',
          confirmPassword: 'StrongPass1',
          firstName: 'Youssef',
          lastName: 'Ali',
          phone: '+201055512345',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Join request submitted successfully' })
  async newCompanyJoinRequest(
    @Body('input') input: RegisterUserInput,
    @Param('companyId') companyId: string,
  ): Promise<boolean> {
    return await this.authService.newCompanyJoinRequest(input, companyId);
  }

  @Transactional()
  @Post('code_verify_request')
  @ApiOperation({ summary: 'Request an email verification/reset code' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['input'],
      properties: {
        input: { $ref: getSchemaPath(RequestVerificationCodeInput) },
      },
      examples: {
        emailVerification: {
          value: {
            input: {
              email: 'candidate@acme.com',
              useCase: 'EMAIL_VERIFICATION',
            },
          },
        },
        passwordReset: {
          value: {
            input: {
              email: 'candidate@acme.com',
              useCase: 'PASSWORD_RESET',
            },
          },
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Verification code sent successfully' })
  async requestVerificationCode(
    @Body('input') input: RequestVerificationCodeInput,
  ): Promise<boolean> {
    return await this.authService.requestVerificationCode(input);
  }

  @Transactional()
  @Post('verify_email')
  @ApiOperation({ summary: 'Verify email using code and return login payload' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['input'],
      properties: {
        input: { $ref: getSchemaPath(VerifyEmailVerificationCodeInput) },
      },
      example: {
        input: {
          email: 'candidate@acme.com',
          code: '482913',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Email verified and authenticated session created',
    type: LoginResponse,
  })
  async verifyEmail(
    @Body('input') input: VerifyEmailVerificationCodeInput,
  ): Promise<LoginResponse> {
    return await this.authService.verifyEmailVerificationCode(input);
  }

  @Transactional()
  @Post('reset_password')
  @ApiOperation({ summary: 'Reset password using verification code' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['input'],
      properties: {
        input: { $ref: getSchemaPath(ResetPasswordInput) },
      },
      example: {
        input: {
          email: 'candidate@acme.com',
          code: '482913',
          newPassword: 'NewStrongPass1',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Password reset successfully' })
  async resetPassword(
    @Body('input') input: ResetPasswordInput,
  ): Promise<boolean> {
    return await this.authService.resetPassword(input);
  }

  @Transactional()
  @Post('login')
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['input'],
      properties: {
        input: { $ref: getSchemaPath(LoginInput) },
      },
      example: {
        input: {
          email: 'manager@acme.com',
          password: 'StrongPass1',
        },
      },
    },
  })
  @ApiCreatedResponse({ description: 'User logged in', type: LoginResponse })
  async login(@Body('input') input: LoginInput): Promise<LoginResponse> {
    return await this.authService.login(input);
  }

  @Transactional()
  @Post('logout')
  @Auth()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout current session only' })
  @ApiCreatedResponse({ description: 'Logged out from current device' })
  async logout(
    @CurrentUser() user: User,
    @CurrentSessionId() sessionId: number,
  ): Promise<boolean> {
    return await this.authService.logout(user.id, sessionId);
  }

  @Transactional()
  @Post('logout_all_devices')
  @Auth()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout from all active sessions' })
  @ApiCreatedResponse({ description: 'Logged out from all devices' })
  async logoutFromAllDevices(@CurrentUser() user: User): Promise<boolean> {
    return await this.authService.logoutFromAllDevices(user.id);
  }
}
