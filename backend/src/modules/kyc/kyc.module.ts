import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';
import { KycApplication } from './entities/kyc-application.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KycApplication])],
  controllers: [KycController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}