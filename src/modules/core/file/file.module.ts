import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileService } from './services/file.service';
import { FileController } from './controllers/file.controller';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import { FileEntity } from './entities/file.entity';
import { FileReferenceService } from './services/file-reference.service';
import { RemoveUnreferenceFiles } from './crons/remove-unreference-files.crons';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([FileEntity]),
    MulterModule.register({
      storage: multer.memoryStorage(),
    }),
  ],
  controllers: [FileController],
  providers: [FileService, FileReferenceService, RemoveUnreferenceFiles],
  exports: [FileReferenceService],
})
export class FileModule {}
