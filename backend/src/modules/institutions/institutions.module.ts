import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstitutionsService } from './institutions.service';
import { InstitutionsController } from './institutions.controller';
import { Institution, InstitutionAdmin, InstitutionStudent, InstitutionTeacher } from './entities/institution.entity';
import { SchoolJoinRequest } from './entities/school-join-request.entity';
import { StudentRegister } from './entities/student-register.entity';
import { PromotionLog, StudentTransfer } from './entities/promotion-transfer.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Institution, InstitutionAdmin, InstitutionStudent, InstitutionTeacher, SchoolJoinRequest, StudentRegister, PromotionLog, StudentTransfer]),
    forwardRef(() => UsersModule),
  ],
  controllers: [InstitutionsController],
  providers: [InstitutionsService],
  exports: [InstitutionsService],
})
export class InstitutionsModule {}