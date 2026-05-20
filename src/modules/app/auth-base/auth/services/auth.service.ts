import { HttpException, Injectable } from '@nestjs/common';
import {
  RegisterManagerInput,
  RegisterUserInput,
} from '../inputs/register-manager.input';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusCodeEnum } from 'src/common/enums/status-code.enum';
import { RequestVerificationCodeInput } from '../inputs/request-verification-code.input';
import { MailService } from 'src/modules/core/mail/services/mail.service';
import {
  ResetPasswordInput,
  VerifyEmailVerificationCodeInput,
} from '../inputs/verify-code.input';
import { LoginInput } from '../inputs/login.input';
import { CompanyService } from '../../../companies/services/company.service';
import { User } from '../../user/entities/user.entity';
import { UserVerificationCodeService } from '../../user/services/user-verification-code.service';
import { SessionService } from '../../session/services/session.service';
import { UserVerificationCodeUseCaseEnum } from '../../user/enums/user-verification-code.enum';
import { UserTypeEnum } from '../../user/enums/user.enum';
import { AuthHelperService } from 'src/modules/core/helper/auth-helper.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly companyService: CompanyService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly authHelper: AuthHelperService,
    private readonly userVerificationCodeService: UserVerificationCodeService,
    private readonly sessionService: SessionService,
    private readonly mailService: MailService,
  ) {}

  async registerCompanyManager(input: RegisterManagerInput): Promise<boolean> {
    const { companyInput, userInput } = input;

    const newUser = await this.registerUser(
      userInput,
      UserTypeEnum.COMPANY_USER,
    );

    await this.companyService.createNewCompany(companyInput, newUser.id);

    return true;
  }

  private async registerUser(input: RegisterUserInput, userType: UserTypeEnum) {
    const isUserExist = await this.userRepo.findOne({
      where: { email: input.email, verified: true },
    });
    if (isUserExist) {
      throw new HttpException(
        'User Email Already Exist',
        StatusCodeEnum.ALREADY_EXIST,
      );
    }
    //Delete any unverified user with this email
    await this.userRepo.delete({ email: input.email });

    if (input.password !== input.confirmPassword) {
      throw new HttpException(
        'Password Must be similar to ConfirmPassword',
        StatusCodeEnum.INVALID_PASSWORD,
      );
    }

    // TODO: validate profile pic url

    const newUser = await this.userRepo.save({
      ...input,
      verified: false,
      userType,
      password: await this.authHelper.hashPassword(input.password),
    });

    return newUser;
  }

  async requestVerificationCode(input: RequestVerificationCodeInput) {
    const { email, useCase } = input;

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new HttpException('User Not Found', StatusCodeEnum.NOT_FOUND);
    }

    switch (useCase) {
      case UserVerificationCodeUseCaseEnum.EMAIL_VERIFICATION:
        await this.handleEmailVerificationRequest(user);
        break;
      case UserVerificationCodeUseCaseEnum.PASSWORD_RESET:
        await this.handlePasswordResetRequest(user);
        break;
      default:
        throw new HttpException(
          'Invalid Verification Code Use Case',
          StatusCodeEnum.BAD_REQUEST,
        );
    }
    return true;
  }

  async handleEmailVerificationRequest(user: User) {
    if (user.verified) {
      throw new HttpException(
        'User Already Verified',
        StatusCodeEnum.ALREADY_VERIFIED,
      );
    }
    const verificationCode =
      await this.userVerificationCodeService.createVerificationCode(
        user.id,
        UserVerificationCodeUseCaseEnum.EMAIL_VERIFICATION,
      );

    await this.mailService.sendMail(
      user.email,
      `VU Account Verification Code`,
      `Your Request VerificationCode for VU Account is ${verificationCode.code}`,
    );

    return true;
  }

  async handlePasswordResetRequest(user: User) {
    if (!user.verified) {
      throw new HttpException('Forbidden', StatusCodeEnum.FORBIDDEN);
    }

    const verificationCode =
      await this.userVerificationCodeService.createVerificationCode(
        user.id,
        UserVerificationCodeUseCaseEnum.PASSWORD_RESET,
      );

    await this.mailService.sendMail(
      user.email,
      `VU Password Reset Code`,
      `Your Password Reset Request VerificationCode for VU Account is ${verificationCode.code}`,
    );

    return true;
  }

  async verifyEmailVerificationCode(input: VerifyEmailVerificationCodeInput) {
    const { email, code } = input;

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new HttpException('User Not Found', StatusCodeEnum.NOT_FOUND);
    }

    if (user.verified) {
      throw new HttpException(
        'User Already Verified',
        StatusCodeEnum.ALREADY_VERIFIED,
      );
    }

    await this.userVerificationCodeService.verifyVerificationCode(
      user.id,
      code,
      UserVerificationCodeUseCaseEnum.EMAIL_VERIFICATION,
    );

    await this.userRepo.update(user.id, {
      verified: true,
    });

    const session = await this.sessionService.createNewSession(user.id);
    const token = await this.authHelper.generateJwtToken(session.id);

    return { token };
  }

  async login(input: LoginInput) {
    const user = await this.userRepo.findOne({
      where: {
        email: input.email,
      },
    });

    if (!user) {
      throw new HttpException(
        'Bad Credentials',
        StatusCodeEnum.BAD_CREDENTIALS,
      );
    }

    const correctPassword = await this.authHelper.comparePassword(
      input.password,
      user.password,
    );

    if (!correctPassword) {
      throw new HttpException(
        'Bad Credentials',
        StatusCodeEnum.BAD_CREDENTIALS,
      );
    }
    const session = await this.sessionService.createNewSession(user.id);
    const token = await this.authHelper.generateJwtToken(session.id);

    return { token };
  }

  async resetPassword(input: ResetPasswordInput) {
    const { code, email, newPassword } = input;

    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new HttpException('User Not Found', StatusCodeEnum.NOT_FOUND);
    }

    await this.userVerificationCodeService.verifyVerificationCode(
      user.id,
      code,
      UserVerificationCodeUseCaseEnum.PASSWORD_RESET,
    );

    await this.userRepo.update(user.id, {
      password: await this.authHelper.hashPassword(newPassword),
    });

    return true;
  }

  async logout(userId: string, sessionId: number) {
    await this.sessionService.deleteUserSessions(userId, sessionId);

    return true;
  }

  async logoutFromAllDevices(userId: string) {
    await this.sessionService.deleteUserSessions(userId);

    return true;
  }

  async newCompanyJoinRequest(input: RegisterUserInput, companyId: string) {
    const company = await this.companyService.getCompanyById(companyId);

    const newUser = await this.registerUser(input, UserTypeEnum.COMPANY_USER);

    await this.companyService.addNewUserRequestToCompany(
      company.id,
      newUser.id,
    );

    return true;
  }
}
