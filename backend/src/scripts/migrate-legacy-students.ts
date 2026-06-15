import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../modules/users/entities/user.entity';
import { StudentProfile, StudentStatus } from '../modules/students/entities/student-profile.entity';
import * as argon2 from 'argon2';
import { randomInt } from 'crypto';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
  const profileRepo = app.get<Repository<StudentProfile>>(getRepositoryToken(StudentProfile));

  const existingProfileUserIds = await profileRepo.find({ select: ['userId'] });
  const existingIds = new Set(existingProfileUserIds.map(p => p.userId));

  const legacyUsers = await userRepo.find({
    where: { role: UserRole.STUDENT },
  });

  const pending = legacyUsers.filter(u => !existingIds.has(u.id));
  console.log(`Found ${pending.length} legacy students without profiles`);

  let created = 0;
  let errors = 0;

  for (const user of pending) {
    try {
      const username = `legacy_${user.id.slice(0, 8)}`;
      const pin = randomInt(1000, 9999).toString();
      const pinHash = await argon2.hash(pin);

      const profile = profileRepo.create({
        userId: user.id,
        username,
        pinHash,
        temporaryPin: pin,
        grade: user.grade || 1,
        studentStatus: StudentStatus.PIN_PENDING,
        institutionId: user.institutionId || null,
      });

      await profileRepo.save(profile);
      console.log(`  ✓ ${user.firstName} ${user.lastName} → username: ${username}, PIN: ${pin}`);
      created++;
    } catch (err) {
      console.error(`  ✗ Failed for ${user.email}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nDone: ${created} profiles created, ${errors} errors`);
  await app.close();
}

bootstrap().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
