import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserVerificationCode } from '../entities/user-verification-codes.entity';
import { Repository } from 'typeorm';
import { UserVerificationCodeUseCaseEnum } from '../enums/user-verification-code.enum';
import { StatusCodeEnum } from 'src/common/enums/status-code.enum';
import { AppHelperService } from 'src/modules/core/helper/helper.services';

@Injectable()
export class UserVerificationCodeService {
  constructor(
    @InjectRepository(UserVerificationCode)
    private readonly userVerificationCodeRepo: Repository<UserVerificationCode>,
    private readonly helper: AppHelperService,
  ) {}

  async createVerificationCode(
    userId: string,
    useCase: UserVerificationCodeUseCaseEnum,
  ): Promise<UserVerificationCode> {
    await this.deleteUserVerificationCode(userId, useCase);

    return await this.userVerificationCodeRepo.save({
      userId,
      useCase,
      code:
        process.env.NODE_ENV === 'development'
          ? '1234'
          : this.helper.createRandomCodeNumber(4),
      expireAt: new Date(Date.now() + 15 * 60 * 1000),
    });
  }

  async deleteUserVerificationCode(
    userId: string,
    useCase: UserVerificationCodeUseCaseEnum,
  ) {
    await this.userVerificationCodeRepo.delete({
      user: { id: userId },
      useCase,
    });
  }

  async getUserVerificationCode(
    userId: string,
    useCase: UserVerificationCodeUseCaseEnum,
  ) {
    const code = await this.userVerificationCodeRepo.findOne({
      where: {
        user: { id: userId },
        useCase,
      },
    });

    if (!code) {
      throw new HttpException(
        'No Verification Code Found, Please Request a New One',
        StatusCodeEnum.NOT_FOUND,
      );
    }

    return code;
  }

  async verifyVerificationCode(
    userId: string,
    code: string,
    useCase: UserVerificationCodeUseCaseEnum,
  ) {
    const userVerificationCode = await this.getUserVerificationCode(
      userId,
      useCase,
    );

    if (
      userVerificationCode.code !== code ||
      userVerificationCode.expireAt < new Date()
    ) {
      throw new HttpException(
        'Invalid Verification Code',
        StatusCodeEnum.INVALID_VERIFICATION_CODE,
      );
    }

    await this.deleteUserVerificationCode(userId, useCase);
    return true;
  }
}
