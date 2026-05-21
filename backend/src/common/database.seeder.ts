import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, OnboardingStatus, KycStatus } from '../modules/users/entities/user.entity';


@Injectable()
export class DatabaseSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    const userCount = await this.usersRepository.count();
    if (userCount > 0) {
      return; // Database already seeded
    }

    console.log('🌱 Seeding database with demo users...');

    const hashedPassword = await bcrypt.hash('Password123!', 10);

    const demoUsers = [
      {
        email: 'admin@adaptivecbc.com',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        isEmailVerified: true,
        onboardingStatus: OnboardingStatus.COMPLETED,
      },
      {
        email: 'institution@adaptivecbc.com',
        password: hashedPassword,
        firstName: 'School',
        lastName: 'Manager',
        role: UserRole.INSTITUTION_ADMIN,
        isActive: true,
        isEmailVerified: true,
        onboardingStatus: OnboardingStatus.COMPLETED,
        kycStatus: KycStatus.APPROVED,
      },
      {
        email: 'teacher@adaptivecbc.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Kamau',
        role: UserRole.TEACHER,
        isActive: true,
        isEmailVerified: true,
        onboardingStatus: OnboardingStatus.COMPLETED,
        grade: null,
      },
      {
        email: 'tutor@adaptivecbc.com',
        password: hashedPassword,
        firstName: 'Sarah',
        lastName: 'Wanjiku',
        role: UserRole.TUTOR,
        isActive: true,
        isEmailVerified: true,
        onboardingStatus: OnboardingStatus.COMPLETED,
        grade: null,
      },
      {
        email: 'parent@adaptivecbc.com',
        password: hashedPassword,
        firstName: 'Mary',
        lastName: 'Odhiambo',
        role: UserRole.PARENT,
        isActive: true,
        isEmailVerified: true,
        onboardingStatus: OnboardingStatus.COMPLETED,
      },
      {
        email: 'student@adaptivecbc.com',
        password: hashedPassword,
        firstName: 'Brian',
        lastName: 'Mutua',
        role: UserRole.STUDENT,
        isActive: true,
        isEmailVerified: true,
        onboardingStatus: OnboardingStatus.COMPLETED,
        grade: 6,
        term: 1,
        stream: 'East',
      },
      {
        email: 'student2@adaptivecbc.com',
        password: hashedPassword,
        firstName: 'Grace',
        lastName: 'Achieng',
        role: UserRole.STUDENT,
        isActive: true,
        isEmailVerified: true,
        onboardingStatus: OnboardingStatus.COMPLETED,
        grade: 8,
        term: 2,
        stream: 'West',
      },
      {
        email: 'student-legacy@adaptivecbc.com',
        password: hashedPassword,
        firstName: 'Peter',
        lastName: 'Njoroge',
        role: UserRole.STUDENT,
        isActive: true,
        isEmailVerified: true,
        onboardingStatus: OnboardingStatus.NOT_STARTED,
        grade: null,
      },
    ];

    for (const userData of demoUsers) {
      const user = this.usersRepository.create(userData);
      await this.usersRepository.save(user);
    }

    console.log('✅ Database seeded with 8 demo users');
    console.log('📧 Admin: admin@adaptivecbc.com');
    console.log('📧 Institution: institution@adaptivecbc.com');
    console.log('📧 Teacher: teacher@adaptivecbc.com');
    console.log('📧 Tutor: tutor@adaptivecbc.com');
    console.log('📧 Parent: parent@adaptivecbc.com');
    console.log('📧 Student: student@adaptivecbc.com');
    console.log('🔑 Password: Password123!');
  }
}