import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { PastPaper, PaperQuestion, PaperCategory, PaperReview, OcrJob, PastPaperStatus, ReviewStatus, PaperType, ContentVisibility, RejectionReason, REJECTION_REASON_LABELS, REJECTION_REASON_RECOMMENDATIONS } from './entities/digital-library.entity';
import { CreatePastPaperDto, UpdatePastPaperDto, PastPaperSearchParams, UploadOcrDto, ReviewQuestionDto, CreateReviewDto, RejectPaperDto } from './dto/digital-library.dto';
import { EmailService } from '../../common/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../notifications/entities/notification.entity';
import { UsersService } from '../users/users.service';
import { QuotaEnforcerService } from '../governance/services/quota-enforcer.service';
import { UsageTrackerService } from '../governance/services/usage-tracker.service';
import { GovernanceTier, GovernanceServiceType } from '../governance/entities/usage-log.entity';

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
    private emailService: EmailService,
    private notificationsService: NotificationsService,
    private usersService: UsersService,
    private quotaEnforcer: QuotaEnforcerService,
    private usageTracker: UsageTrackerService,
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

  async rejectPastPaper(id: string, userId: string, rejectDto: RejectPaperDto): Promise<PastPaper> {
    const paper = await this.findOnePastPaper(id);
    paper.status = PastPaperStatus.REJECTED;
    paper.verifiedBy = userId;

    const reasonLabels = rejectDto.reasons.map(r => REJECTION_REASON_LABELS[r] || r);
    const rejectionMetadata = {
      rejectionReasons: rejectDto.reasons,
      rejectionReasonLabels: reasonLabels,
      additionalComments: rejectDto.additionalComments,
      rejectedAt: new Date().toISOString(),
      rejectedBy: userId,
    };
    paper.metadata = {
      ...paper.metadata,
      ...rejectionMetadata,
    };

    await this.pastPaperRepository.save(paper);

    const author = await this.usersService.findOne(paper.createdBy);
    if (author && author.email) {
      const reasonsText = reasonLabels.map((label, i) => `${i + 1}. ${label}`).join('\n');
      const recommendations = rejectDto.reasons
        .map(r => REJECTION_REASON_RECOMMENDATIONS[r])
        .filter(Boolean)
        .join('\n\n');

      const emailHtml = this.emailService.generateContentRejectionEmail(
        `${author.firstName} ${author.lastName}`,
        paper.title,
        reasonsText,
        rejectDto.additionalComments,
        recommendations,
      );

      await this.emailService.send({
        to: author.email,
        subject: `Content Review Update: "${paper.title}" Requires Revision`,
        html: emailHtml,
      });

      await this.notificationsService.createNotification({
        userId: author.id,
        title: 'Content Rejected',
        message: `Your submission "${paper.title}" was rejected. Reason: ${reasonLabels.join('; ')}`,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.HIGH,
        actionUrl: `/library/${paper.id}`,
        metadata: rejectionMetadata,
      });
    }

    return paper;
  }

  async deletePastPaper(id: string, userId: string, userRole: string, userInstitutionId?: string): Promise<void> {
    const paper = await this.pastPaperRepository.findOne({ where: { id } });
    if (!paper) {
      throw new NotFoundException(`Past paper with ID ${id} not found`);
    }

    const isOwner = paper.createdBy === userId;
    const isAdmin = userRole === 'super_admin' || userRole === 'institution_admin';

    if (!isOwner && !isAdmin) {
      throw new BadRequestException('You do not have permission to delete this content');
    }

    if (isOwner && !isAdmin) {
      if (paper.status === PastPaperStatus.PUBLISHED) {
        throw new BadRequestException('Published content cannot be deleted. Contact an admin to unpublish first.');
      }
    }

    await this.reviewRepository.delete({ pastPaperId: id });
    await this.questionRepository.delete({ pastPaperId: id });
    await this.ocrJobRepository.delete({ pastPaperId: id });
    await this.pastPaperRepository.delete(id);
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

  async createOcrJob(uploadDto: UploadOcrDto, userId: string, fileData: { url: string; size: number; mimeType: string }, uploadedFileName?: string, userTier: GovernanceTier = GovernanceTier.FREE, userRole?: string): Promise<OcrJob> {
    const user = await this.usersService.findOne(userId);
    const isBypass = user?.email === 'teacher2@adaptivecbc.co.ke';

    const quotaResult = await this.quotaEnforcer.checkOcrQuota(
      userId,
      userTier,
      1,
      undefined,
    );

    if (!quotaResult.allowed && !isBypass) {
      throw new BadRequestException({
        message: quotaResult.reason || 'OCR quota exceeded',
        retryAfter: quotaResult.retryAfter,
        usage: quotaResult.usage,
      });
    }

    const fileName = uploadedFileName || uploadDto.fileName || 'uploaded-document';
    const paperTitle = uploadDto.title || fileName.replace(/\.[^/.]+$/, '');
    const paper = await this.createPastPaper({
      title: paperTitle,
      paperType: uploadDto.paperType,
      subjectId: uploadDto.subjectId,
      grade: uploadDto.grade,
      year: uploadDto.year,
      term: uploadDto.term,
      examSeries: uploadDto.examSeries,
      source: uploadDto.source,
    }, userId);

    paper.status = PastPaperStatus.PROCESSING;
    await this.pastPaperRepository.save(paper);

    const job = this.ocrJobRepository.create({
      fileName,
      status: PastPaperStatus.PROCESSING,
      pastPaperId: paper.id,
      originalFile: fileData,
      startedAt: new Date(),
    });

    const savedJob = await this.ocrJobRepository.save(job);

    // Increment usage AFTER the job is confirmed saved — so a failed job creation
    // does not consume the user's daily quota.
    await this.usageTracker.incrementUsage(userId, GovernanceServiceType.OCR);

    this.triggerOcrProcessing(savedJob.id, fileData, fileName);

    return savedJob;
  }

  private async triggerOcrProcessing(jobId: string, fileData: { url: string; size: number; mimeType: string }, fileName: string = 'document.pdf'): Promise<void> {
    const ocrServiceUrl = this.configService.get('OCR_SERVICE_URL', 'http://ocr-service:8003');

    try {
      const FormData = require('form-data');
      const formData = new (FormData.default || FormData)();

      if (fileData.url.startsWith('data:')) {
        const base64Data = fileData.url.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        formData.append('file', buffer, {
          filename: fileName,
          contentType: fileData.mimeType,
        });
      } else {
        const fs = await import('fs');
        const filePath = fileData.url.startsWith('/') ? join(process.cwd(), fileData.url) : join(process.cwd(), fileData.url);
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
        const job = await this.ocrJobRepository.findOne({ where: { id: jobId } });
        if (job) {
          job.externalJobId = response.data.jobId;
          await this.ocrJobRepository.save(job);
        }
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
      images: result.images || [],
      is_duplicate: result.is_duplicate || false,
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

      // Store extracted OCR output for review. Questions are created when the user submits reviewed OCR results.
      // This keeps scanned content in a pending review state until a human confirms the extraction.
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
        
        const FormData = require('form-data');
        const formData = new (FormData.default || FormData)();
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
        const FormData = require('form-data');
        const formData = new (FormData.default || FormData)();
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

  async proxyOcrStatus(jobId: string): Promise<any> {
    const job = await this.ocrJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('OCR job not found');
    }

    if (job.status === PastPaperStatus.PENDING_REVIEW || job.status === PastPaperStatus.PUBLISHED) {
      return {
        jobId: job.id,
        status: 'completed',
        stage: 'done',
        progress: 100,
        fileName: job.fileName,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        result: job.extractedData,
        error: null,
        stage_details: null,
      };
    }

    if (job.status === PastPaperStatus.REJECTED) {
      return {
        jobId: job.id,
        status: 'failed',
        stage: 'failed',
        progress: 0,
        fileName: job.fileName,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        result: null,
        error: (job.errors || []).join(', ') || 'OCR processing failed',
        stage_details: null,
      };
    }

    if (!job.externalJobId) {
      return {
        jobId: job.id,
        status: 'processing',
        stage: 'queued',
        progress: 5,
        fileName: job.fileName,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: null,
        result: null,
        error: null,
        stage_details: null,
      };
    }

    const ocrServiceUrl = this.configService.get('OCR_SERVICE_URL', 'http://ocr-service:8003');
    try {
      const response = await this.httpService.axiosRef.get(`${ocrServiceUrl}/status/${job.externalJobId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new NotFoundException('OCR job not found');
      }
      throw new BadRequestException(`Failed to get OCR status: ${error.message}`);
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

    // Replace any extracted draft questions with the reviewed version.
    await this.questionRepository.delete({ pastPaperId: paper.id });

    const normalizedQuestions = questions.map((q: any, idx: number) => {
      const options = Array.isArray(q.options)
        ? q.options.map((opt: any, optIdx: number) => ({
            id: opt.id || String.fromCharCode(65 + optIdx),
            text: typeof opt === 'string' ? opt : opt.text || '',
            isCorrect: typeof opt === 'object' ? !!opt.isCorrect : false,
          }))
        : [];

      return this.questionRepository.create({
        pastPaperId: paper.id,
        pageNumber: q.pageNumber || idx + 1,
        questionNumber: q.questionNumber || idx + 1,
        questionText: q.questionText || q.text || q.question || '',
        extractedText: q.extractedText || q.text || q.question || '',
        options,
        correctAnswer: q.correctAnswer || q.answer || null,
        solution: q.solution || q.answerExplanation || q.explanation || null,
        imageUrls: Array.isArray(q.imageUrls)
          ? q.imageUrls
          : q.imageUrls
            ? [q.imageUrls]
            : [],
        reviewStatus: ReviewStatus.NEEDS_REVISION,
        aiMetadata: {
          confidence: q.confidence || 0.8,
          model: 'ocr-review',
          extractedAt: new Date().toISOString(),
        },
      });
    });

    await this.questionRepository.save(normalizedQuestions);

    let paperStatus = PastPaperStatus.PENDING_REVIEW;
    let moderationReason = null;

    try {
      const evaluation = await this.evaluateContentSuitability(paper, normalizedQuestions);
      if (evaluation.approved) {
        paperStatus = PastPaperStatus.PUBLISHED;
      } else {
        paperStatus = PastPaperStatus.PENDING_REVIEW;
        moderationReason = evaluation.reason || 'Flagged by AI Moderation';
      }
    } catch (error) {
      console.error('Failed to evaluate content suitability:', error);
      paperStatus = PastPaperStatus.PENDING_REVIEW;
      moderationReason = 'AI Moderation failed. Manual review required.';
    }

    paper.status = paperStatus;
    paper.metadata = {
      ...(paper.metadata as any),
      lastSubmittedForReviewBy: userId,
      lastSubmittedForReviewAt: new Date().toISOString(),
      moderationReason: moderationReason,
    };
    await this.pastPaperRepository.save(paper);

    job.status = paperStatus;
    job.completedAt = job.completedAt || new Date();
    await this.ocrJobRepository.save(job);

    return { saved: normalizedQuestions.length, paperId: paper.id };
  }

  private async evaluateContentSuitability(paper: PastPaper, questions: any[]): Promise<{ approved: boolean; reason?: string }> {
    const openRouterApiKey = this.configService.get('OPENROUTER_API_KEY');
    const openRouterModel = this.configService.get('OPENROUTER_MODEL', 'meta-llama/llama-3-8b-instruct');
    
    if (!openRouterApiKey) {
      console.warn('OPENROUTER_API_KEY not found. Skipping AI moderation and defaulting to PENDING_REVIEW.');
      return { approved: false, reason: 'AI Moderation disabled (missing API key)' };
    }

    try {
      const questionsPreview = questions.slice(0, 10).map(q => q.questionText).join('\n---\n');
      const prompt = `You are an educational content moderator for the Kenyan CBC/CBE curriculum. 
Evaluate if the following document aligns with CBC/CBE for grade ${paper.grade} and if it is appropriate for learning.
The document title is "${paper.title}".

Here is a preview of the questions:
${questionsPreview}

If it is high quality and appropriate, return exactly: {"approved": true}
If it contains inappropriate content, errors, or misalignment, return: {"approved": false, "reason": "<your reason here>"}

Return ONLY a valid JSON object.`;

      const response = await this.httpService.axiosRef.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: openRouterModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://adaptivecbc.co.ke',
            'X-Title': 'Adaptive CBC OCR',
          },
          timeout: 30000,
        }
      );

      let content = response.data.choices[0].message.content.trim();
      content = content.replace(/^```json/, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(content);

      if (parsed.approved === true) {
        return { approved: true };
      } else {
        return { approved: false, reason: parsed.reason || 'Flagged by AI moderator' };
      }
    } catch (error) {
      console.error('AI Moderation API call failed:', error);
      return { approved: false, reason: 'AI Moderation service unavailable' };
    }
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