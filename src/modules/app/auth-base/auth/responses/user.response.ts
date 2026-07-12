import { OmitType } from '@nestjs/mapped-types';
import { User } from '../../user/entities/user.entity';

export class UserResponse extends OmitType(User, ['password'] as const) {
  constructor(user: User) {
    super();
    const { password, ...rest } = user;
    Object.assign(this, rest);
  }
}
