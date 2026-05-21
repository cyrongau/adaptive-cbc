import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum PastPaperStatus {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  PENDING_REVIEW = 'pending_review',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
  FAILED = 'failed',
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

export enum RejectionReason {
  CURRICULUM_MISALIGNMENT = 'curriculum_misalignment',
  INACCURATE_CONTENT = 'inaccurate_content',
  INAPPROPRIATE_LANGUAGE = 'inappropriate_language',
  POOR_FORMATTING = 'poor_formatting',
  DUPLICATE_CONTENT = 'duplicate_content',
  OUTDATED_MATERIAL = 'outdated_material',
  MISSING_LEARNING_OBJECTIVES = 'missing_learning_objectives',
  INSUFFICIENT_DEPTH = 'insufficient_depth',
  COPYRIGHT_CONCERN = 'copyright_concern',
  AGE_INAPPROPRIATE = 'age_inappropriate',
  LOW_QUALITY_SCAN = 'low_quality_scan',
  INCOMPLETE_CONTENT = 'incomplete_content',
  WRONG_GRADE_LEVEL = 'wrong_grade_level',
  EXAM_INTEGRITY_VIOLATION = 'exam_integrity_violation',
  CULTURAL_SENSITIVITY = 'cultural_sensitivity',
}

export const REJECTION_REASON_LABELS: Record<RejectionReason, string> = {
  curriculum_misalignment: 'Not aligned with CBC curriculum',
  inaccurate_content: 'Contains factual errors or inaccuracies',
  inappropriate_language: 'Contains inappropriate or unprofessional language',
  poor_formatting: 'Poor formatting or layout makes it difficult to use',
  duplicate_content: 'Duplicate of existing content in the library',
  outdated_material: 'Content is outdated or no longer relevant',
  missing_learning_objectives: 'Missing clear learning objectives or outcomes',
  insufficient_depth: 'Insufficient depth or coverage of the topic',
  copyright_concern: 'Potential copyright or intellectual property concern',
  age_inappropriate: 'Content not suitable for the target grade level',
  low_quality_scan: 'Low quality scan or OCR extraction errors',
  incomplete_content: 'Content is incomplete or cut off mid-section',
  wrong_grade_level: 'Assigned to incorrect grade level',
  exam_integrity_violation: 'Violates exam integrity or assessment guidelines',
  cultural_sensitivity: 'Contains culturally insensitive or biased content',
};

export const REJECTION_REASON_RECOMMENDATIONS: Record<RejectionReason, string> = {
  curriculum_misalignment: 'Review the CBC curriculum guidelines for this subject and grade. Ensure all topics, competencies, and learning outcomes match the official KICD curriculum design. You can access the curriculum framework at the KICD portal.',
  inaccurate_content: 'Cross-reference your content with approved textbooks and official KICD materials. Verify all facts, formulas, and answers before resubmission. Consider having a subject specialist review the content.',
  inappropriate_language: 'Review the content for any informal, offensive, or unprofessional language. Use age-appropriate and culturally respectful terminology suitable for the Kenyan CBC learning environment.',
  poor_formatting: 'Format your document with clear headings, numbered questions, consistent fonts, and proper spacing. Use tables or structured layouts where appropriate. Ensure the document is readable on both screen and print.',
  duplicate_content: 'Search the digital library before uploading to ensure your content is unique. If you are updating existing material, use the edit feature on the original submission instead of creating a new entry.',
  outdated_material: 'Update your content to reflect the current CBC curriculum, recent syllabus changes, and contemporary examples. Remove references to deprecated assessment formats (e.g., KCPE) and replace with CBC-aligned alternatives.',
  missing_learning_objectives: 'Add clear learning objectives at the beginning of your material. State what learners should know or be able to do after engaging with the content. Align objectives with CBC core competencies and values.',
  insufficient_depth: 'Expand your content to provide adequate coverage of the topic. Include more questions, examples, explanations, or practice exercises. Ensure the material meets the expected depth for the target grade level.',
  copyright_concern: 'Ensure all content is either originally created by you or properly licensed for educational use. Remove any copyrighted images, texts, or materials without permission. Cite sources where applicable.',
  age_inappropriate: 'Adjust the complexity, language, and examples to match the cognitive level of the target grade. For lower grades, use simpler language and concrete examples. For upper grades, include more abstract reasoning and analysis.',
  low_quality_scan: 'Re-scan the document at a minimum of 300 DPI resolution. Ensure all text is clear and legible. Use a PDF format rather than images where possible. Check that OCR extraction produces accurate text before submitting.',
  incomplete_content: 'Complete all sections of your document before submitting. Ensure all questions have answers, all pages are included, and the document has a proper beginning and end. Review the full document before uploading.',
  wrong_grade_level: 'Verify the grade level assignment matches the content difficulty and curriculum expectations. Check the CBC curriculum progression to ensure topics are taught at the correct grade.',
  exam_integrity_violation: 'Ensure the content does not contain live exam papers or confidential assessment materials. Use only past papers that have been officially released or create original practice assessments that follow CBC assessment guidelines.',
  cultural_sensitivity: 'Review content for any cultural bias, stereotypes, or insensitive references. Ensure examples and scenarios are inclusive and representative of Kenya\'s diverse communities. Use culturally appropriate names, places, and contexts.',
};

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

  @Column({ nullable: true })
  externalJobId: string;

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