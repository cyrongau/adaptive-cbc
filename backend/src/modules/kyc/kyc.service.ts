import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycApplication, KycStatus } from './entities/kyc-application.entity';
import { SubmitKycDto, ReviewKycDto } from './dto/kyc.dto';

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(KycApplication)
    private kycRepository: Repository<KycApplication>,
  ) {}

  async submit(userId: string, dto: SubmitKycDto): Promise<KycApplication> {
    const existing = await this.kycRepository.findOne({
      where: { userId, status: KycStatus.PENDING },
    });

    if (existing) {
      throw new BadRequestException('You already have a pending KYC application');
    }

    const application = this.kycRepository.create({
      ...dto,
      userId,
    });

    return this.kycRepository.save(application);
  }

  async findByUser(userId: string): Promise<KycApplication[]> {
    return this.kycRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(status?: string): Promise<KycApplication[]> {
    const where: any = {};
    if (status) {
      where.status = status;
    }
    return this.kycRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<KycApplication> {
    const application = await this.kycRepository.findOne({ where: { id } });
    if (!application) {
      throw new NotFoundException('KYC application not found');
    }
    return application;
  }

  async review(id: string, reviewerId: string, dto: ReviewKycDto): Promise<KycApplication> {
    const application = await this.findOne(id);

    if (application.status !== KycStatus.PENDING && application.status !== KycStatus.UNDER_REVIEW) {
      throw new BadRequestException('Application has already been reviewed');
    }

    application.status = dto.action === 'approved' ? KycStatus.APPROVED : KycStatus.REJECTED;
    application.reviewedBy = reviewerId;
    application.reviewedAt = new Date();
    application.rejectionReason = dto.action === 'rejected' ? dto.rejectionReason : null;
    application.notes = dto.notes;

    return this.kycRepository.save(application);
  }

  async getStats(): Promise<any> {
    const total = await this.kycRepository.count();
    const pending = await this.kycRepository.count({ where: { status: KycStatus.PENDING } });
    const approved = await this.kycRepository.count({ where: { status: KycStatus.APPROVED } });
    const rejected = await this.kycRepository.count({ where: { status: KycStatus.REJECTED } });
    const underReview = await this.kycRepository.count({ where: { status: KycStatus.UNDER_REVIEW } });

    return { total, pending, approved, rejected, underReview };
  }
}