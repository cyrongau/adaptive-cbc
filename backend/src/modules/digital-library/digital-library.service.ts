import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PastPaper, PaperQuestion, PaperCategory, PaperReview, OcrJob, PastPaperStatus, ReviewStatus, PaperType, ContentVisibility } from './entities/digital-library.entity';
import { CreatePastPaperDto, UpdatePastPaperDto, PastPaperSearchParams, UploadOcrDto, ReviewQuestionDto, CreateReviewDto } from './dto/digital-library.dto';

@Injectable()
export class DigitalLibraryService {
  constructor(
    @InjectRepository(PastPaper)
    private pastPaperRepository: Repository<PastPaper>,
    @InjectRepository(PaperQuestion)
    private questionRepository: Repository<PaperQuestion>,
    @InjectRepository(PaperCategory)
    private categoryRepository: Repository<PaperCategory>,
    @InjectRepository(PaperReview)
    private reviewRepository: Repository<PaperReview>,
    @InjectRepository(OcrJob)
    private ocrJobRepository: Repository<OcrJob>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async findAllPastPapers(params: PastPaperSearchParams, userInstitutionId?: string): Promise<{ papers: PastPaper[]; total: number; page: number; limit: number }> {
    const { subjectId, grade, year, term, paperType, status, search, isPremium, page = 1, limit = 20 } = params;

    const query = this.pastPaperRepository.createQueryBuilder('paper')
      .where('paper.status = :status', { status: status || PastPaperStatus.PUBLISHED });

    // Visibility filtering: public OR (institution_only AND user belongs to that institution)
    query.andWhere('(paper.visibility = :public OR (paper.visibility = :institutionOnly AND paper.institutionId = :userInstitutionId))', {
      public: 'public',
      institutionOnly: 'institution_only',
      userInstitutionId: userInstitutionId || '',
    });

    if (subjectId) {
      query.andWhere('paper.subjectId = :subjectId', { subjectId });
    }

    if (grade) {
      query.andWhere('paper.grade = :grade', { grade });
    }

    if (year) {
      query.andWhere('paper.year = :year', { year });
    }

    if (term) {
      query.andWhere('paper.term = :term', { term });
    }

    if (paperType) {
      query.andWhere('paper.paperType = :paperType', { paperType });
    }

    if (search) {
      query.andWhere('(paper.title ILIKE :search OR paper.description ILIKE :search OR paper.tags && :searchArray)', {
        search: `%${search}%`,
        searchArray: [search],
      });
    }

    if (isPremium !== undefined) {
      query.andWhere('paper.isPremium = :isPremium', { isPremium });
    }

    const total = await query.getCount();

    query.skip((page - 1) * limit).take(limit)
      .orderBy('paper.createdAt', 'DESC');

    const papers = await query.getMany();

    return { papers, total, page, limit };
  }

  async findOnePastPaper(id: string): Promise<PastPaper> {
    const paper = await this.pastPaperRepository.findOne({
      where: { id },
    });

    if (!paper) {
      throw new NotFoundException(`Past paper with ID ${id} not found`);
    }

    paper.viewCount += 1;
    await this.pastPaperRepository.save(paper);

    return paper;
  }

  async getPastPaperQuestions(pastPaperId: string): Promise<PaperQuestion[]> {
    return this.questionRepository.find({
      where: { pastPaperId, reviewStatus: ReviewStatus.APPROVED },
      order: { pageNumber: 'ASC', questionNumber: 'ASC' },
    });
  }

  async createPastPaper(createDto: CreatePastPaperDto, userId: string, userInstitutionId?: string): Promise<PastPaper> {
    const paper = this.pastPaperRepository.create({
      ...createDto,
      createdBy: userId,
      institutionId: createDto.visibility === 'institution_only' ? userInstitutionId : null,
      status: PastPaperStatus.DRAFT,
    });

    return this.pastPaperRepository.save(paper);
  }

  async updatePastPaper(id: string, updateDto: UpdatePastPaperDto): Promise<PastPaper> {
    const paper = await this.findOnePastPaper(id);
    Object.assign(paper, updateDto);
    return this.pastPaperRepository.save(paper);
  }

  async publishPastPaper(id: string, userId: string): Promise<PastPaper> {
    const paper = await this.findOnePastPaper(id);
    paper.status = PastPaperStatus.PUBLISHED;
    paper.publishedAt = new Date();
    paper.verifiedBy = userId;
    return this.pastPaperRepository.save(paper);
  }

  async archivePastPaper(id: string): Promise<PastPaper> {
    const paper = await this.findOnePastPaper(id);
    paper.status = PastPaperStatus.ARCHIVED;
    return this.pastPaperRepository.save(paper);
  }

  async rejectPastPaper(id: string, userId: string, reason?: string): Promise<PastPaper> {
    const paper = await this.findOnePastPaper(id);
    paper.status = PastPaperStatus.REJECTED;
    paper.verifiedBy = userId;
    if (reason) {
      paper.metadata = {
        ...paper.metadata,
        rejectionReason: reason,
      };
    }
    return this.pastPaperRepository.save(paper);
  }

  async findAllPapersForModeration(params: { status?: string; page?: number; limit?: number; search?: string }): Promise<{ papers: any[]; total: number; page: number; limit: number }> {
    const { status, page = 1, limit = 20, search } = params;

    const query = this.pastPaperRepository.createQueryBuilder('paper')
      .leftJoinAndSelect('paper.createdByUser', 'author')
      .leftJoinAndSelect('paper.verifiedByUser', 'reviewer')
      .orderBy('paper.createdAt', 'DESC');

    if (status) {
      query.andWhere('paper.status = :status', { status });
    }

    if (search) {
      query.andWhere('(paper.title ILIKE :search OR paper.description ILIKE :search)', { search: `%${search}%` });
    }

    const total = await query.getCount();
    query.skip((page - 1) * limit).take(limit);

    const papers = await query.getMany();

    return { papers, total, page, limit };
  }

  async getQuestionsForModeration(pastPaperId: string): Promise<PaperQuestion[]> {
    return this.questionRepository.find({
      where: { pastPaperId },
      order: { pageNumber: 'ASC', questionNumber: 'ASC' },
    });
  }

  async incrementDownloadCount(id: string): Promise<void> {
    const paper = await this.findOnePastPaper(id);
    paper.downloadCount += 1;
    await this.pastPaperRepository.save(paper);
  }

  async createOcrJob(uploadDto: UploadOcrDto, userId: string, fileData: { url: string; size: number; mimeType: string }, uploadedFileName?: string): Promise<OcrJob> {
    const fileName = uploadedFileName || uploadDto.fileName || 'uploaded-document';
    const paper = await this.createPastPaper({
      title: fileName.replace(/\.[^/.]+$/, ''),
      paperType: uploadDto.paperType,
      subjectId: uploadDto.subjectId,
      grade: uploadDto.grade,
      year: uploadDto.year,
      term: uploadDto.term,
      examSeries: uploadDto.examSeries,
      source: uploadDto.source,
      status: PastPaperStatus.PROCESSING,
    }, userId);

    const job = this.ocrJobRepository.create({
      fileName,
      status: PastPaperStatus.PROCESSING,
      pastPaperId: paper.id,
      originalFile: fileData,
      startedAt: new Date(),
    });

    const savedJob = await this.ocrJobRepository.save(job);

    this.triggerOcrProcessing(savedJob.id, fileData, fileName);

    return savedJob;
  }

  private async triggerOcrProcessing(jobId: string, fileData: { url: string; size: number; mimeType: string }, fileName: string = 'document.pdf'): Promise<void> {
    const ocrServiceUrl = this.configService.get('OCR_SERVICE_URL', 'http://ocr-service:8003');

    try {
      const FormData = (await import('form-data')).default;
      const formData = new FormData();

      if (fileData.url.startsWith('data:')) {
        const base64Data = fileData.url.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        formData.append('file', buffer, {
          filename: fileName,
          contentType: fileData.mimeType,
        });
      } else {
        const fs = await import('fs');
        const filePath = fileData.url.startsWith('/') ? fileData.url : join(process.cwd(), fileData.url);
        if (fs.existsSync(filePath)) {
          const fileStream = fs.createReadStream(filePath);
          formData.append('file', fileStream, {
            filename: fileName,
            contentType: fileData.mimeType,
          });
        } else {
          throw new Error(`File not found: ${filePath}`);
        }
      }

      const response = await this.httpService.axiosRef.post(`${ocrServiceUrl}/upload`, formData, {
        headers: formData.getHeaders(),
        timeout: 120000,
      });

      if (response.data?.jobId) {
        this.pollOcrStatus(jobId, response.data.jobId);
      }
    } catch (error) {
      console.error('Failed to trigger OCR processing:', error.message);
      const job = await this.ocrJobRepository.findOne({ where: { id: jobId } });
      if (job) {
        job.errors = (job.errors || []).concat(`OCR trigger failed: ${error.message}`);
        await this.ocrJobRepository.save(job);
      }
    }
  }

  private async pollOcrStatus(dbJobId: string, ocrJobId: string, attempts: number = 0): Promise<void> {
    if (attempts >= 60) {
      console.warn(`OCR job ${ocrJobId} timed out after 60 attempts`);
      return;
    }

    const ocrServiceUrl = this.configService.get('OCR_SERVICE_URL', 'http://ocr-service:8003');

    try {
      const response = await this.httpService.axiosRef.get(`${ocrServiceUrl}/status/${ocrJobId}`);
      const { status, result, error } = response.data;

      if (status === 'completed' && result) {
        await this.finalizeOcrJob(dbJobId, result);
      } else if (status === 'failed') {
        await this.failOcrJob(dbJobId, error || 'OCR processing failed');
      } else {
        setTimeout(() => this.pollOcrStatus(dbJobId, ocrJobId, attempts + 1), 5000);
      }
    } catch (err) {
      console.error('OCR status poll error:', err.message);
      setTimeout(() => this.pollOcrStatus(dbJobId, ocrJobId, attempts + 1), 5000);
    }
  }

  private async finalizeOcrJob(jobId: string, result: any): Promise<void> {
    const job = await this.ocrJobRepository.findOne({ where: { id: jobId } });
    if (!job) return;

    job.status = PastPaperStatus.PENDING_REVIEW;
    job.completedAt = new Date();
    job.processingResult = {
      totalPages: result.pages || 1,
      questionsExtracted: result.questions?.length || 0,
      confidence: result.confidence || 0,
      processingTime: result.processingTime || 0,
    };
    job.extractedData = {
      text: result.text,
      questions: result.questions,
    };

    await this.ocrJobRepository.save(job);

    const paper = await this.pastPaperRepository.findOne({ where: { id: job.pastPaperId } });
    if (paper) {
      paper.status = PastPaperStatus.PENDING_REVIEW;
      paper.pageCount = result.pages || 1;
      paper.metadata = {
        ...paper.metadata,
        ocrConfidence: result.confidence || 0,
      };
      await this.pastPaperRepository.save(paper);

      if (result.questions?.length > 0) {
        const questions = result.questions.map((q: any, idx: number) =>
          this.questionRepository.create({
            pastPaperId: paper.id,
            extractedText: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            reviewStatus: ReviewStatus.NEEDS_REVISION,
            aiMetadata: {
              confidence: q.confidence || 0.7,
              model: 'tesseract-ocr',
              extractedAt: new Date().toISOString(),
            },
          })
        );
        await this.questionRepository.save(questions);
      }
    }
  }

  private async failOcrJob(jobId: string, error: string): Promise<void> {
    const job = await this.ocrJobRepository.findOne({ where: { id: jobId } });
    if (!job) return;

    job.status = PastPaperStatus.REJECTED;
    job.errors = (job.errors || []).concat(error);
    job.completedAt = new Date();
    await this.ocrJobRepository.save(job);

    const paper = await this.pastPaperRepository.findOne({ where: { id: job.pastPaperId } });
    if (paper) {
      paper.status = PastPaperStatus.REJECTED;
      await this.pastPaperRepository.save(paper);
    }
  }

  async processOcrJob(jobId: string): Promise<OcrJob> {
    const job = await this.ocrJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('OCR job not found');
    }

    if (job.status === PastPaperStatus.PENDING_REVIEW || job.status === PastPaperStatus.PUBLISHED) {
      return job;
    }

    const ocrServiceUrl = this.configService.get('OCR_SERVICE_URL', 'http://ocr-service:8003');

    try {
      const fileData = job.originalFile;
      
      if (fileData?.url?.startsWith('data:')) {
        const base64Data = fileData.url.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        
        const FormData = (await import('form-data')).default;
        const formData = new FormData();
        formData.append('file', buffer, {
          filename: job.fileName,
          contentType: fileData.mimeType,
        });

        const response = await this.httpService.axiosRef.post(`${ocrServiceUrl}/upload`, formData, {
          headers: formData.getHeaders(),
          timeout: 60000,
        });

        if (response.data?.jobId) {
          this.pollOcrStatus(jobId, response.data.jobId);
        }
      } else {
        const formData = new FormData();
        formData.append('fileUrl', fileData?.url || '');
        formData.append('mimeType', fileData?.mimeType || 'application/pdf');

        const response = await this.httpService.axiosRef.post(`${ocrServiceUrl}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000,
        });

        if (response.data?.jobId) {
          this.pollOcrStatus(jobId, response.data.jobId);
        }
      }

      return job;
    } catch (error) {
      throw new BadRequestException(`Failed to start OCR processing: ${error.message}`);
    }
  }

  async getOcrJobStatus(jobId: string): Promise<any> {
    const job = await this.ocrJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('OCR job not found');
    }

    let status = 'processing';
    let progress = 0;
    let result: any = null;

    if (job.status === PastPaperStatus.PROCESSING) {
      status = 'processing';
      progress = job.processingResult ? Math.min(90, (job.processingResult as any).progress || 30) : 30;
    } else if (job.status === PastPaperStatus.PENDING_REVIEW) {
      status = 'completed';
      progress = 100;
      result = job.extractedData || {};
    } else if (job.status === PastPaperStatus.REJECTED) {
      status = 'failed';
      progress = 0;
      result = { error: (job.errors || []).join(', ') || 'OCR processing failed' };
    } else if (job.status === PastPaperStatus.PUBLISHED) {
      status = 'completed';
      progress = 100;
      result = job.extractedData || {};
    }

    return { status, progress, result };
  }

  async saveOcrQuestions(jobId: string, questions: any[], userId: string): Promise<any> {
    const job = await this.ocrJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('OCR job not found');
    }

    const paper = await this.pastPaperRepository.findOne({ where: { id: job.pastPaperId } });
    if (!paper) {
      throw new NotFoundException('Associated paper not found');
    }

    const savedQuestions = questions.map((q, idx) =>
      this.questionRepository.create({
        pastPaperId: paper.id,
        extractedText: q.text || q.question || '',
        options: q.options || [],
        correctAnswer: q.answer || q.correctAnswer || null,
        reviewStatus: ReviewStatus.APPROVED,
        questionNumber: idx + 1,
        reviewedBy: userId,
        aiMetadata: {
          confidence: q.confidence || 0.8,
          model: 'tesseract-ocr',
          extractedAt: new Date().toISOString(),
          savedBy: userId,
        },
      })
    );

    await this.questionRepository.save(savedQuestions);

    paper.status = PastPaperStatus.PUBLISHED;
    await this.pastPaperRepository.save(paper);

    job.status = PastPaperStatus.PUBLISHED;
    job.completedAt = new Date();
    await this.ocrJobRepository.save(job);

    return { saved: savedQuestions.length, paperId: paper.id };
  }

  async reviewQuestion(paperId: string, reviewDto: ReviewQuestionDto, userId: string): Promise<PaperQuestion> {
    const question = await this.questionRepository.findOne({ where: { id: reviewDto.questionId, pastPaperId: paperId } });
    
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (reviewDto.questionText) question.questionText = reviewDto.questionText;
    if (reviewDto.options) question.options = reviewDto.options;
    if (reviewDto.correctAnswer) question.correctAnswer = reviewDto.correctAnswer;
    if (reviewDto.solution) question.solution = reviewDto.solution;
    if (reviewDto.reviewNotes) question.reviewNotes = reviewDto.reviewNotes;
    
    question.reviewStatus = reviewDto.reviewStatus;
    question.reviewedBy = userId;

    return this.questionRepository.save(question);
  }

  async getQuestionsForReview(paperId: string): Promise<PaperQuestion[]> {
    return this.questionRepository.find({
      where: { pastPaperId: paperId },
      order: { pageNumber: 'ASC', questionNumber: 'ASC' },
    });
  }

  async addReview(pastPaperId: string, reviewDto: CreateReviewDto, userId: string): Promise<PaperReview> {
    const existingReview = await this.reviewRepository.findOne({
      where: { pastPaperId, userId },
    });

    if (existingReview) {
      existingReview.rating = reviewDto.rating;
      existingReview.comment = reviewDto.comment;
      return this.reviewRepository.save(existingReview);
    }

    const review = this.reviewRepository.create({
      ...reviewDto,
      userId,
    });

    return this.reviewRepository.save(review);
  }

  async getPaperReviews(pastPaperId: string): Promise<PaperReview[]> {
    return this.reviewRepository.find({
      where: { pastPaperId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPaperAverageRating(pastPaperId: string): Promise<{ averageRating: number; totalReviews: number }> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .where('review.pastPaperId = :pastPaperId', { pastPaperId })
      .select('AVG(review.rating)', 'averageRating')
      .addSelect('COUNT(*)', 'totalReviews')
      .getRawOne();

    return {
      averageRating: parseFloat(result?.averageRating || '0'),
      totalReviews: parseInt(result?.totalReviews || '0'),
    };
  }

  async getAllCategories(): Promise<PaperCategory[]> {
    return this.categoryRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async createCategory(categoryData: Partial<PaperCategory>): Promise<PaperCategory> {
    const category = this.categoryRepository.create(categoryData);
    return this.categoryRepository.save(category);
  }

  async getFeaturedPapers(limit: number = 10): Promise<PastPaper[]> {
    return this.pastPaperRepository.find({
      where: { isFeatured: true, status: PastPaperStatus.PUBLISHED, visibility: ContentVisibility.PUBLIC },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getRecentPapers(limit: number = 10): Promise<PastPaper[]> {
    return this.pastPaperRepository.find({
      where: { status: PastPaperStatus.PUBLISHED, visibility: ContentVisibility.PUBLIC },
      order: { publishedAt: 'DESC' },
      take: limit,
    });
  }

  async getPopularPapers(limit: number = 10): Promise<PastPaper[]> {
    return this.pastPaperRepository.find({
      where: { status: PastPaperStatus.PUBLISHED, visibility: ContentVisibility.PUBLIC },
      order: { downloadCount: 'DESC', viewCount: 'DESC' },
      take: limit,
    });
  }

  async getYearFilterOptions(): Promise<number[]> {
    const result = await this.pastPaperRepository
      .createQueryBuilder('paper')
      .select('DISTINCT paper.year', 'year')
      .where('paper.year IS NOT NULL')
      .orderBy('year', 'DESC')
      .getRawMany();

    return result.map(r => r.year).filter(Boolean);
  }
}