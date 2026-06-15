import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RiskEngineService } from './risk-engine.service';
import { LoginAttempt } from './login-attempt.entity';
import { AccountRecovery } from './account-recovery.entity';
import { SecurityEvent } from './security-event.entity';
import { TrustedDevice } from '../trusted-devices/entities/trusted-device.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([LoginAttempt, AccountRecovery, SecurityEvent, TrustedDevice]),
  ],
  providers: [RiskEngineService],
  exports: [RiskEngineService],
})
export class SecurityModule {}
