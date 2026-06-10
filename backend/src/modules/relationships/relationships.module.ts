import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RelationshipsService } from './relationships.service';
import { RelationshipsController } from './relationships.controller';
import { UserRelationship } from './entities/relationship.entity';
import { User } from '../users/entities/user.entity';
import { StudentRegister } from '../institutions/entities/student-register.entity';
import { EmailModule } from '../../common/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserRelationship, User, StudentRegister]), EmailModule],
  controllers: [RelationshipsController],
  providers: [RelationshipsService],
  exports: [RelationshipsService],
})
export class RelationshipsModule {}
