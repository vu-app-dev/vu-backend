import { BaseModel } from 'src/common/database/base-model';
import { Column, Entity, OneToMany, OneToOne } from 'typeorm';
import { UserTypeEnum } from '../enums/user.enum';
import { SessionEntity } from '../../session/entities/session.entity';
import { CompanyUser } from 'src/modules/app/companies/entities/company-user.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class User extends BaseModel {
  @Column()
  email: string;

  @Exclude()
  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  jobTitle: string;

  @Column({ default: false })
  verified: boolean;

  @Column({ nullable: true })
  profilePictureUrl: string;

  @Column({ type: 'enum', enum: UserTypeEnum, default: UserTypeEnum.USER })
  userType: UserTypeEnum;

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  @OneToMany(() => SessionEntity, (session) => session.user)
  sessions: SessionEntity[];

  @OneToOne(() => CompanyUser, (companyUser) => companyUser.user)
  companyUser: CompanyUser;
}
