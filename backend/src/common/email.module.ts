import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from './email.service';
import { Integration } from '../modules/integrations/entities/integration.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Integration])],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
