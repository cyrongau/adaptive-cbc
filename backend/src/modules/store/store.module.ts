import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { Product, Cart, CartItem, Order, OrderItem } from './entities/store.entity';
import { FinancialModule } from '../financial/financial.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { EnrollmentModule } from '../enrollment/enrollment.module';
import { MinioService } from '../../common/minio.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Cart, CartItem, Order, OrderItem]), FinancialModule, IntegrationsModule, EnrollmentModule],
  controllers: [StoreController],
  providers: [StoreService, MinioService],
  exports: [StoreService],
})
export class StoreModule {}

