import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TutorProfile, TutorApplication, TutorStatus, VerificationLevel } from './entities/tutor.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class TutorsService {
  constructor(
    @InjectRepository(TutorProfile)
    private profileRepository: Repository<TutorProfile>,
    @InjectRepository(TutorApplication)
    private applicationRepository: Repository<TutorApplication>,
    private usersService: UsersService,
  ) {}

  async applyAsTutor(userId: string, applicationData: {
    bio: string;
    qualifications: string;
    experienceYears: number;
    subjects: { subjectId: string; subjectName: string; hourlyRate: number }[];
  }): Promise<TutorApplication> {
    const existingProfile = await this.profileRepository.findOne({ where: { userId } });
    if (existingProfile) {
      throw new ConflictException('You already have a tutor profile');
    }

    const existingApplication = await this.applicationRepository.findOne({
      where: { userId, status: TutorStatus.PENDING },
    });
    if (existingApplication) {
      throw new ConflictException('You already have a pending application');
    }

    const application = this.applicationRepository.create({
      userId,
      ...applicationData,
      status: TutorStatus.PENDING,
    });

    await this.usersService.update(userId, { role: 'tutor' as any });

    return this.applicationRepository.save(application);
  }

  async getApplication(userId: string): Promise<TutorApplication> {
    const application = await this.applicationRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!application) {
      throw new NotFoundException('No application found');
    }

    return application;
  }

  async approveApplication(applicationId: string, reviewedBy: string, reviewNotes?: string): Promise<TutorApplication> {
    const application = await this.applicationRepository.findOne({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    application.status = TutorStatus.APPROVED;
    application.reviewedBy = reviewedBy;
    application.reviewNotes = reviewNotes;

    await this.applicationRepository.save(application);

    const profile = this.profileRepository.create({
      userId: application.userId,
      bio: application.bio,
      qualifications: application.qualifications,
      experienceYears: application.experienceYears,
      subjects: application.subjects,
      status: TutorStatus.APPROVED,
    });

    await this.profileRepository.save(profile);

    return application;
  }

  async rejectApplication(applicationId: string, reviewedBy: string, reviewNotes: string): Promise<TutorApplication> {
    const application = await this.applicationRepository.findOne({ where: { id: applicationId } });
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    application.status = TutorStatus.REJECTED;
    application.reviewedBy = reviewedBy;
    application.reviewNotes = reviewNotes;

    return this.applicationRepository.save(application);
  }

  async createProfile(userId: string, profileData: Partial<TutorProfile>): Promise<TutorProfile> {
    let profile = await this.profileRepository.findOne({ where: { userId } });

    if (profile) {
      Object.assign(profile, profileData);
      return this.profileRepository.save(profile);
    }

    profile = this.profileRepository.create({
      userId,
      ...profileData,
    });

    return this.profileRepository.save(profile);
  }

  async getProfile(userId: string): Promise<TutorProfile> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException('Tutor profile not found');
    }

    return profile;
  }

  async getProfileById(id: string): Promise<TutorProfile> {
    const profile = await this.profileRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException('Tutor profile not found');
    }

    return profile;
  }

  async findAllTutors(filters?: {
    subjectId?: string;
    grade?: number;
    minRating?: number;
    isAvailable?: boolean;
  }): Promise<TutorProfile[]> {
    const query = this.profileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('profile.status = :status', { status: TutorStatus.APPROVED });

    if (filters?.subjectId) {
      query.andWhere(':subjectId = ANY(profile.subjects)', { subjectId: filters.subjectId });
    }

    if (filters?.grade) {
      query.andWhere(':grade = ANY(profile.teachingGrades)', { grade: filters.grade });
    }

    if (filters?.minRating) {
      query.andWhere('profile.rating >= :minRating', { minRating: filters.minRating });
    }

    if (filters?.isAvailable) {
      query.andWhere('profile.isAvailableForOnline = :isAvailable', { isAvailable: true });
    }

    return query.orderBy('profile.rating', 'DESC').getMany();
  }

  async updateAvailability(userId: string, availability: any[]): Promise<TutorProfile> {
    const profile = await this.getProfile(userId);
    profile.availability = availability;
    return this.profileRepository.save(profile);
  }

  async updateStatus(userId: string, status: TutorStatus): Promise<TutorProfile> {
    const profile = await this.getProfile(userId);
    profile.status = status;
    return this.profileRepository.save(profile);
  }

  async updateRating(userId: string, newRating: number): Promise<TutorProfile> {
    const profile = await this.getProfile(userId);
    const currentRating = profile.rating || 0;
    const totalSessions = profile.totalSessions || 0;

    profile.rating = ((currentRating * totalSessions) + newRating) / (totalSessions + 1);
    profile.totalSessions += 1;

    if (profile.rating >= 4.5) {
      profile.verificationLevel = VerificationLevel.VERIFIED;
    } else if (profile.rating >= 3.5) {
      profile.verificationLevel = VerificationLevel.BASIC;
    }

    return this.profileRepository.save(profile);
  }

  async searchTutors(query: string): Promise<TutorProfile[]> {
    return this.profileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('profile.status = :status', { status: TutorStatus.APPROVED })
      .andWhere('(profile.bio ILIKE :query OR profile.headline ILIKE :query OR user.firstName ILIKE :query OR user.lastName ILIKE :query)', {
        query: `%${query}%`,
      })
      .orderBy('profile.rating', 'DESC')
      .getMany();
  }
}