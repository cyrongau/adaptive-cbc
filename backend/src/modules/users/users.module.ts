import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { InstitutionsModule } from '../institutions/institutions.module';
import { EmailModule } from '../../common/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), forwardRef(() => InstitutionsModule), EmailModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}