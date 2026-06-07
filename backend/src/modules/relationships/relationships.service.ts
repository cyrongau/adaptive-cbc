import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRelationship, RelationshipType, VerificationStatus } from './entities/relationship.entity';
import { User } from '../users/entities/user.entity';
import { EmailService } from '../../common/email.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RelationshipsService {
  private readonly logger = new Logger(RelationshipsService.name);

  constructor(
    @InjectRepository(UserRelationship)
    private relationshipRepository: Repository<UserRelationship>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private emailService: EmailService,
  ) {}

  async createRelationship(data: {
    userId: string;
    relatedUserId?: string;
    relationshipType: RelationshipType;
    relatedUserEmail?: string;
    relatedUserPhone?: string;
  }): Promise<UserRelationship> {
    const existing = await this.findExistingRelationship(data);
    if (existing) {
      if (data.relatedUserEmail) {
        existing.invitationToken = uuidv4();
        existing.relatedUserPhone = data.relatedUserPhone || existing.relatedUserPhone;
        const savedExisting = await this.relationshipRepository.save(existing);
        await this.sendParentInvitation(savedExisting);
        return savedExisting;
      }
      throw new ConflictException('Relationship already exists');
    }

    const relationship = this.relationshipRepository.create({
      userId: data.userId,
      relatedUserId: data.relatedUserId,
      relatedUserEmail: data.relatedUserEmail,
      relatedUserPhone: data.relatedUserPhone,
      relationshipType: data.relationshipType,
      verificationStatus: VerificationStatus.UNVERIFIED,
      invitationToken: uuidv4(),
      permissions: this.getDefaultPermissions(data.relationshipType),
    });
    const savedRelationship = await this.relationshipRepository.save(relationship);

    if (data.relatedUserEmail) {
      await this.sendParentInvitation(savedRelationship);
    }

    return savedRelationship;
  }

  async resendInvitation(data: {
    userId: string;
    relationshipType: RelationshipType;
    relatedUserEmail: string;
    relatedUserPhone?: string;
  }): Promise<UserRelationship> {
    let relationship = await this.findExistingRelationship(data);

    if (!relationship) {
      relationship = this.relationshipRepository.create({
        userId: data.userId,
        relatedUserEmail: data.relatedUserEmail,
        relatedUserPhone: data.relatedUserPhone,
        relationshipType: data.relationshipType,
        verificationStatus: VerificationStatus.UNVERIFIED,
        invitationToken: uuidv4(),
        permissions: this.getDefaultPermissions(data.relationshipType),
      });
    } else {
      relationship.invitationToken = uuidv4();
      relationship.relatedUserPhone = data.relatedUserPhone || relationship.relatedUserPhone;
    }

    const savedRelationship = await this.relationshipRepository.save(relationship);
    await this.sendParentInvitation(savedRelationship);
    return savedRelationship;
  }

  private async findExistingRelationship(data: {
    userId: string;
    relatedUserId?: string;
    relatedUserEmail?: string;
    relationshipType: RelationshipType;
  }): Promise<UserRelationship | null> {
    const query = this.relationshipRepository.createQueryBuilder('relationship')
      .where('relationship.userId = :userId', { userId: data.userId })
      .andWhere('relationship.relationshipType = :relationshipType', { relationshipType: data.relationshipType })
      .andWhere('relationship.isActive = true');

    if (data.relatedUserId) {
      query.andWhere('relationship.relatedUserId = :relatedUserId', { relatedUserId: data.relatedUserId });
    } else if (data.relatedUserEmail) {
      query.andWhere('LOWER(relationship.relatedUserEmail) = LOWER(:relatedUserEmail)', { relatedUserEmail: data.relatedUserEmail });
    } else {
      return null;
    }

    return query.getOne();
  }

  private async sendParentInvitation(relationship: UserRelationship): Promise<void> {
    const student = await this.usersRepository.findOne({ where: { id: relationship.userId } });
    if (!student || !relationship.relatedUserEmail) return;

    const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
    const invitationUrl = `${appUrl.replace(/\/$/, '')}/register?invitationToken=${relationship.invitationToken}`;
    const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Your child';

    const result = await this.emailService.send({
      to: relationship.relatedUserEmail,
      subject: `${studentName} invited you to Adaptive CBC`,
      html: this.emailService.generateParentInvitationEmail({
        studentName,
        relationshipType: relationship.relationshipType,
        invitationUrl,
      }),
      text: `${studentName} invited you to connect on Adaptive CBC. Accept the invitation: ${invitationUrl}`,
    });

    if (!result.success) {
      this.logger.warn(`Parent invitation email was not sent to ${relationship.relatedUserEmail}: ${result.message}`);
    }
  }

  async getRelationshipsForUser(userId: string, type?: RelationshipType): Promise<UserRelationship[]> {
    const query = this.relationshipRepository.createQueryBuilder('r')
      .where('r.userId = :userId AND r.isActive = true', { userId });
    if (type) {
      query.andWhere('r.relationshipType = :type', { type });
    }
    return query.getMany();
  }

  async getRelationshipsForRelatedUser(relatedUserId: string, type?: RelationshipType): Promise<UserRelationship[]> {
    const query = this.relationshipRepository.createQueryBuilder('r')
      .where('r.relatedUserId = :relatedUserId AND r.isActive = true', { relatedUserId });
    if (type) {
      query.andWhere('r.relationshipType = :type', { type });
    }
    return query.getMany();
  }

  async getChildrenForParent(parentUserId: string): Promise<UserRelationship[]> {
    return this.relationshipRepository.createQueryBuilder('r')
      .leftJoinAndSelect('r.student', 'student')
      .where('r.relatedUserId = :parentUserId AND r.isActive = true', { parentUserId })
      .andWhere('r.relationshipType IN (:...types)', {
        types: [RelationshipType.PARENT, RelationshipType.MOTHER, RelationshipType.FATHER, RelationshipType.GUARDIAN],
      })
      .getMany();
  }

  async getParentsForStudent(studentUserId: string): Promise<UserRelationship[]> {
    return this.relationshipRepository.createQueryBuilder('r')
      .leftJoinAndSelect('r.parent', 'parent')
      .where('r.userId = :studentUserId AND r.isActive = true', { studentUserId })
      .andWhere('r.relationshipType IN (:...types)', {
        types: [RelationshipType.PARENT, RelationshipType.MOTHER, RelationshipType.FATHER, RelationshipType.GUARDIAN],
      })
      .getMany();
  }

  async verifyRelationship(id: string, verifiedBy: string, status: VerificationStatus): Promise<UserRelationship> {
    const relationship = await this.relationshipRepository.findOne({ where: { id } });
    if (!relationship) {
      throw new NotFoundException('Relationship not found');
    }
    relationship.verificationStatus = status;
    relationship.verifiedBy = verifiedBy;
    return this.relationshipRepository.save(relationship);
  }

  async acceptInvitation(invitationToken: string, parentUserId: string): Promise<UserRelationship> {
    const relationship = await this.relationshipRepository.findOne({
      where: { invitationToken, isActive: true },
    });
    if (!relationship) {
      throw new NotFoundException('Invitation not found or expired');
    }

    relationship.relatedUserId = parentUserId;
    relationship.verificationStatus = VerificationStatus.BASIC_VERIFIED;
    relationship.verifiedBy = parentUserId;
    relationship.invitationToken = null;
    return this.relationshipRepository.save(relationship);
  }

  async removeRelationship(id: string): Promise<void> {
    const relationship = await this.relationshipRepository.findOne({ where: { id } });
    if (!relationship) {
      throw new NotFoundException('Relationship not found');
    }
    relationship.isActive = false;
    await this.relationshipRepository.save(relationship);
  }

  private getDefaultPermissions(type: RelationshipType): Record<string, boolean> {
    const base: Record<string, boolean> = {
      can_view_performance: true,
      can_view_activity: true,
      can_chat_tutors: false,
      can_modify_profile: false,
      can_submit_assignments: false,
      can_pay_fees: false,
    };

    if ([RelationshipType.PARENT, RelationshipType.MOTHER, RelationshipType.FATHER, RelationshipType.GUARDIAN].includes(type)) {
      base.can_chat_tutors = true;
    }
    if (type === RelationshipType.SPONSOR) {
      base.can_pay_fees = true;
      base.can_view_performance = false;
    }
    if (type === RelationshipType.TEACHER || type === RelationshipType.SCHOOL_ADMIN) {
      base.can_modify_profile = true;
      base.can_chat_tutors = true;
    }
    return base;
  }
}
