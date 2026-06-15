import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { StudentProfile } from './entities/student-profile.entity';
import { User } from '../users/entities/user.entity';
import { TrustedDevice } from '../trusted-devices/entities/trusted-device.entity';
import { LoginAttempt } from '../security/login-attempt.entity';
import { AccountRecovery } from '../security/account-recovery.entity';
import { SecurityEvent } from '../security/security-event.entity';
import { RelationshipsModule } from '../relationships/relationships.module';
import { InstitutionsModule } from '../institutions/institutions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../../common/email.module';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentProfile,
      User,
      TrustedDevice,
      LoginAttempt,
      AccountRecovery,
      SecurityEvent,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'cbc_jwt_secret_key_2024_adaptive'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '1d'),
        },
      }),
      inject: [ConfigService],
    }),
    RelationshipsModule,
    InstitutionsModule,
    NotificationsModule,
    EmailModule,
    SecurityModule,
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
