import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from '../entities/company.entity';
import { Repository } from 'typeorm';
import { CreateCompanyInput } from 'src/modules/app/auth-base/auth/inputs/register-manager.input';
import { StatusCodeEnum } from 'src/common/enums/status-code.enum';
import { CompanyUser } from '../entities/company-user.entity';
import { ReplyJoinRequestInput } from '../inputs/reply-join-request.input';
import { MailService } from 'src/modules/core/mail/services/mail.service';
import { CompanyUserTypeEnum } from '../enums/company-user-type.enum';
import { EditCompanyInput } from '../inputs/edit-company.input';
import { AppHelperService } from 'src/modules/core/helper/helper.services';
import { PaginatedResponse } from 'src/common/types/paginated-response.type';
import { PaginatedCompanyUsersQueryInput } from '../inputs/paginated-company-users-query.input';
import { FileReferenceService } from 'src/modules/core/file/services/file-reference.service';
import { FileModelNameEnum } from 'src/modules/core/file/enums/file-model.enum';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(CompanyUser)
    private readonly companyUserRepo: Repository<CompanyUser>,
    private readonly mailService: MailService,
    private readonly appHelper: AppHelperService,
    private readonly fileReferenceService: FileReferenceService,
  ) {}

  async getCompanyById(id: string) {
    const company = await this.companyRepo.findOne({
      where: { id },
    });

    if (!company)
      throw new HttpException(
        'Company Not Found',
        StatusCodeEnum.COMPANY_NOT_FOUND,
      );

    return company;
  }

  async createNewCompany(input: CreateCompanyInput, currentUserId: string) {
    const company = await this.companyRepo.findOne({
      where: { name: input.name },
    });
    if (company) {
      throw new HttpException(
        'Company Name Already Exist',
        StatusCodeEnum.ALREADY_EXIST,
      );
    }

    if (input.logoUrl) {
      await this.fileReferenceService.markFilesAsReferenced(
        [input.logoUrl],
        FileModelNameEnum.COMPANY,
      );
    }

    const newCompany = await this.companyRepo.save({
      ...input,
      managerId: currentUserId,
    });

    await this.companyUserRepo.save({
      userId: currentUserId,
      companyId: newCompany.id,
      approved: true,
      type: CompanyUserTypeEnum.OWNER,
    });

    return newCompany;
  }

  async addNewUserRequestToCompany(companyId: string, userId: string) {
    const alreadyInCompany = await this.companyUserRepo.findOne({
      where: { userId },
    });

    if (alreadyInCompany) {
      throw new HttpException(
        'User Already In Company',
        StatusCodeEnum.ALREADY_EXIST,
      );
    }

    return await this.companyUserRepo.save({
      userId,
      companyId,
    });
  }

  async replyJoinRequest(input: ReplyJoinRequestInput, companyId: string) {
    const { approved, userId, type } = input;

    const companyUser = await this.companyUserRepo.findOne({
      where: { userId, companyId },
      relations: { user: true, company: true },
      select: {
        id: true,
        companyId: true,
        userId: true,
        approved: true,
        type: true,
        user: { email: true },
        company: { name: true },
      },
    });

    if (!companyUser) {
      throw new HttpException(
        'No Join Request Found',
        StatusCodeEnum.NOT_FOUND,
      );
    }

    if (approved) {
      if (!type) {
        throw new BadRequestException('Type is required');
      }

      companyUser.approved = true;
      companyUser.type = type;
      await this.companyUserRepo.save(companyUser);

      await this.mailService.sendMail(
        companyUser.user.email,
        'Join Request Approved',
        `Congratulations, you have been approved to join <b>${companyUser.company.name}</b>`,
      );

      return true;
    }

    await this.companyUserRepo.delete({ companyId, userId });

    await this.mailService.sendMail(
      companyUser.user.email,
      'Join Request Declined',
      `You have been declined to join <b>${companyUser.company.name}</b>`,
    );

    return true;
  }

  async removeUserFromCompany(userId: string, companyId: string) {
    const companyUser = await this.companyUserRepo.findOne({
      where: { userId, companyId, approved: true },
      relations: { user: true, company: true },
      select: {
        id: true,
        companyId: true,
        userId: true,
        approved: true,
        type: true,
        user: { email: true },
        company: { name: true },
      },
    });

    if (!companyUser) {
      throw new HttpException(
        'Company User Not Found',
        StatusCodeEnum.COMPANY_USER_NOT_FOUND,
      );
    }

    await this.companyUserRepo.delete({ userId, companyId });

    await this.mailService.sendMail(
      companyUser.user.email,
      'Removed From Company',
      `You have been removed from <b>${companyUser.company.name}</b>`,
    );

    return true;
  }

  async editCompany(companyId: string, input: EditCompanyInput) {
    const company = await this.getCompanyById(companyId);
    Object.assign(company, input);
    await this.companyRepo.save(company);

    if (input.logoUrl && input.logoUrl !== company.logoUrl) {
      await this.fileReferenceService.unmarkFilesAsReferenced([
        company.logoUrl,
      ]);
      await this.fileReferenceService.markFilesAsReferenced(
        [input.logoUrl],
        FileModelNameEnum.COMPANY,
      );
    }

    return true;
  }

  async getJoinRequests(companyId: string): Promise<CompanyUser[]> {
    return await this.companyUserRepo.find({
      where: { companyId, approved: false },
      relations: { user: true },
      select: {
        id: true,
        userId: true,
        companyId: true,
        approved: true,
        type: true,
        createdAt: true,
        user: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          jobTitle: true,
          profilePictureUrl: true,
        },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getPaginatedCompanyUsers(
    companyId: string,
    query: PaginatedCompanyUsersQueryInput,
  ): Promise<PaginatedResponse<CompanyUser>> {
    const { filter, paginate } = query;

    const qb = this.companyUserRepo
      .createQueryBuilder('company_user')
      .leftJoinAndSelect('company_user.user', 'company_user_user')
      .where('company_user."companyId" = :companyId', { companyId })
      .andWhere('company_user.approved = true');

    if (filter?.search) {
      const search = `%${this.appHelper.trimAllSpaces(filter.search)}%`;
      qb.andWhere(
        "(REPLACE(company_user_user.\"firstName\", ' ', '') ILIKE :search OR REPLACE(company_user_user.\"lastName\", ' ', '') ILIKE :search OR REPLACE(CONCAT(company_user_user.\"firstName\", company_user_user.\"lastName\"), ' ', '') ILIKE :search)",
        { search },
      );
    }

    const page = paginate?.page || 1,
      limit = paginate?.limit || 10;

    const [items, total] = await qb
      .select([
        'company_user.id',
        'company_user.userId',
        'company_user.companyId',
        'company_user.approved',
        'company_user.type',
        'company_user.createdAt',
        'company_user_user.id',
        'company_user_user.firstName',
        'company_user_user.lastName',
        'company_user_user.email',
        'company_user_user.phone',
        'company_user_user.jobTitle',
        'company_user_user.profilePictureUrl',
      ])
      .orderBy('company_user.createdAt', 'DESC')
      .take(limit)
      .skip((page - 1) * limit)
      .getManyAndCount();

    return {
      items,
      total,
      hasNext: total > page * limit,
      hasPrevious: page > 1,
    };
  }
}
