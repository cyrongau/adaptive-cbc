import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import { Material } from './entities/material.entity';
import { MinioService } from '../../common/minio.service';

@Module({
  imports: [TypeOrmModule.forFeature([Material])],
  controllers: [MaterialsController],
  providers: [MaterialsService, MinioService],
  exports: [MaterialsService],
})
export class MaterialsModule {}
