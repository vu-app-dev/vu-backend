import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { EditUserInput } from '../inputs/edit-user.input';
import { ChangePasswordInput } from '../inputs/change-password.input';
import * as bcrypt from 'bcrypt';
import { StatusCodeEnum } from 'src/common/enums/status-code.enum';
import { FileReferenceService } from 'src/modules/core/file/services/file-reference.service';
import { FileModelNameEnum } from 'src/modules/core/file/enums/file-model.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly fileReferenceService: FileReferenceService,
  ) {}

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: {
        id,
      },
    });

    if (!user) {
      throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  async editUser(id: string, input: EditUserInput) {
    const user = await this.getUserById(id);
    Object.assign(user, input);

    if (
      input.profilePictureUrl &&
      input.profilePictureUrl !== user.profilePictureUrl
    ) {
      await this.fileReferenceService.unmarkFilesAsReferenced([
        user.profilePictureUrl,
      ]);
      await this.fileReferenceService.markFilesAsReferenced(
        [input.profilePictureUrl],
        FileModelNameEnum.USER,
      );
    }

    return await this.userRepo.save(user);
  }

  async changePassword(id: string, input: ChangePasswordInput) {
    const user = await this.getUserById(id);

    if (input.confirmPassword !== input.password) {
      throw new HttpException(
        'Password and confirm password must be the same',
        StatusCodeEnum.BAD_REQUEST,
      );
    }

    if (!(await bcrypt.compare(input.oldPassword, user.password))) {
      throw new HttpException(
        'Old password is incorrect',
        StatusCodeEnum.BAD_REQUEST,
      );
    }

    if (input.oldPassword === input.password) {
      throw new HttpException(
        'This password is the same as the old one',
        StatusCodeEnum.BAD_REQUEST,
      );
    }

    user.password = await bcrypt.hash(input.password, 10);
    await this.userRepo.save(user);

    return true;
  }
}
