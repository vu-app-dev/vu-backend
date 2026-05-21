import { BaseModel } from 'src/common/database/base-model';
import { Column, Entity, Index } from 'typeorm';
import { FileModelNameEnum } from '../enums/file-model.enum';

@Entity()
export class FileEntity extends BaseModel {
  @Column({ nullable: true })
  @Index()
  url: string;

  @Column({ type: 'enum', enum: FileModelNameEnum })
  modelName: FileModelNameEnum;

  @Column()
  name: string;

  @Column({ nullable: true })
  mimeType?: string;

  @Column({ nullable: true })
  size?: number;

  @Column({ nullable: false, default: false })
  hasReferenceAtDatabase: boolean;
}
