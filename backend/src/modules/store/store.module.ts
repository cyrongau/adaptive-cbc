import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { Product, Cart, CartItem, Order, OrderItem } from './entities/store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Cart, CartItem, Order, OrderItem])],
  controllers: [StoreController],
  providers: [StoreService],
  exports: [StoreService],
})
export class StoreModule {}
