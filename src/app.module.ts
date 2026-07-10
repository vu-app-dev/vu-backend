import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './common/database/typeorm.config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerInterceptor } from './common/interceptors/logger.interceptor';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { DataSource } from 'typeorm';
import { AuthModule } from './modules/app/auth-base/auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HelperModule } from './modules/core/helper/helper.module';
import { CompanyModule } from './modules/app/companies/company.module';
import { UserModule } from './modules/app/auth-base/user/user.module';
import { FileModule } from './modules/core/file/file.module';
import { CloudinaryModule } from './modules/core/cloudinary/cloudinary.module';
import { SessionModule } from './modules/app/auth-base/session/session.module';
import { AppExceptionFilter } from './common/filters/exception.filter';
import { MockModule } from './modules/app/mocks/mock.module';
import { JobModule } from './modules/app/jobs/job.module';
import { CandidateModule } from './modules/app/candidates/candidate.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: typeOrmConfig,
      async dataSourceFactory(options) {
        if (!options) {
          throw new Error('Invalid options passed');
        }
        return addTransactionalDataSource(new DataSource(options));
      },
    }),
    ScheduleModule.forRoot(),
    HelperModule,
    UserModule,
    CompanyModule,
    AuthModule,
    SessionModule,
    FileModule,
    CloudinaryModule,
    MockModule,
    JobModule,
    CandidateModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AppExceptionFilter,
    },
  ],
})
export class AppModule {}
