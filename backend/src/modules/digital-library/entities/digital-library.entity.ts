import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum PastPaperStatus {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  PENDING_REVIEW = 'pending_review',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
}

export enum PaperType {
  PAST_PAPER = 'past_paper',
  REVISION_KIT = 'revision_kit',
  Mock_EXAM = 'mock_exam',
  WORK_SHEET = 'work_sheet',
  NOTES = 'notes',
}

export enum ReviewStatus {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEEDS_REVISION = 'needs_revision',
}

export enum ContentVisibility {
  PUBLIC = 'public',
  INSTITUTION_ONLY = 'institution_only',
}

@Entity('past_papers')
export class PastPaper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'enum', enum: PaperType, default: PaperType.PAST_PAPER })
  paperType: PaperType;

  @Column()
  subjectId: string;

  @Column({ type: 'int' })
  grade: number;

  @Column({ nullable: true })
  year: number;

  @Column({ nullable: true })
  term: number;

  @Column({ nullable: true })
  examSeries: string;

  @Column({ nullable: true })
  source: string;

  @Column({ nullable: true })
  fileUrl: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'int', default: 0 })
  pageCount: number;

  @Column({ type: 'enum', enum: PastPaperStatus, default: PastPaperStatus.DRAFT })
  status: PastPaperStatus;

  @Column({ type: 'enum', enum: ContentVisibility, default: ContentVisibility.PUBLIC })
  visibility: ContentVisibility;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    originalFileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: Date;
    ocrConfidence?: number;
    pageDimensions?: { width: number; height: number }[];
  };

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ default: false })
  isPremium: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ type: 'int', default: 0 })
  downloadCount: number;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ nullable: true })
  createdBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  createdByUser: User;

  @Column({ nullable: true })
  institutionId: string;

  @Column({ nullable: true })
  verifiedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verifiedBy' })
  verifiedByUser: User;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('paper_questions')
export class PaperQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  pastPaperId: string;

  @ManyToOne(() => PastPaper)
  @JoinColumn({ name: 'pastPaperId' })
  pastPaper: PastPaper;

  @Column({ type: 'int' })
  pageNumber: number;

  @Column({ type: 'int' })
  questionNumber: number;

  @Column({ type: 'text' })
  questionText: string;

  @Column({ type: 'text', nullable: true })
  extractedText: string;

  @Column({ type: 'jsonb', nullable: true })
  options: { id: string; text: string; isCorrect: boolean }[];

  @Column({ nullable: true })
  correctAnswer: string;

  @Column({ type: 'text', nullable: true })
  solution: string;

  @Column({ type: 'jsonb', nullable: true })
  imageUrls: string[];

  @Column({ nullable: true })
  topicId: string;

  @Column({ type: 'enum', enum: ReviewStatus, default: ReviewStatus.NEEDS_REVISION })
  reviewStatus: ReviewStatus;

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string;

  @Column({ type: 'jsonb', nullable: true })
  aiMetadata: { confidence: number; model: string; extractedAt: Date };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('paper_categories')
export class PaperCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('paper_reviews')
export class PaperReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  pastPaperId: string;

  @ManyToOne(() => PastPaper)
  @JoinColumn({ name: 'pastPaperId' })
  pastPaper: PastPaper;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('ocr_jobs')
export class OcrJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileName: string;

  @Column({ type: 'enum', enum: PastPaperStatus, default: PastPaperStatus.PROCESSING })
  status: PastPaperStatus;

  @Column({ nullable: true })
  pastPaperId: string;

  @Column({ type: 'jsonb', nullable: true })
  originalFile: {
    url: string;
    size: number;
    mimeType: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  processingResult: {
    totalPages: number;
    questionsExtracted: number;
    confidence: number;
    processingTime: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  extractedData: {
    text: string;
    questions: any[];
    images: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  errors: string[];

  @Column({ nullable: true })
  processedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}