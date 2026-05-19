import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Put, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { DigitalLibraryService } from './digital-library.service';
import { CreatePastPaperDto, UpdatePastPaperDto, PastPaperSearchParams, UploadOcrDto, ReviewQuestionDto, CreateReviewDto } from './dto/digital-library.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('digital-library')
@Controller('digital-library')
export class DigitalLibraryController {
  constructor(private readonly digitalLibraryService: DigitalLibraryService) {}

  @Get('papers')
  @ApiOperation({ summary: 'Get all past papers with filters' })
  @ApiQuery({ name: 'subjectId', required: false })
  @ApiQuery({ name: 'grade', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'term', required: false, type: Number })
  @ApiQuery({ name: 'paperType', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllPapers(@Query() params: PastPaperSearchParams) {
    return this.digitalLibraryService.findAllPastPapers(params);
  }

  @Get('my-papers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get public + my institution papers' })
  @ApiQuery({ name: 'subjectId', required: false })
  @ApiQuery({ name: 'grade', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'term', required: false, type: Number })
  @ApiQuery({ name: 'paperType', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMyPapers(@Request() req, @Query() params: PastPaperSearchParams) {
    return this.digitalLibraryService.findAllPastPapers(params, req.user.institutionId);
  }

  @Get('papers/featured')
  @ApiOperation({ summary: 'Get featured past papers' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getFeaturedPapers(@Query('limit') limit: number = 10) {
    return this.digitalLibraryService.getFeaturedPapers(limit);
  }

  @Get('papers/recent')
  @ApiOperation({ summary: 'Get recent past papers' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecentPapers(@Query('limit') limit: number = 10) {
    return this.digitalLibraryService.getRecentPapers(limit);
  }

  @Get('papers/popular')
  @ApiOperation({ summary: 'Get popular past papers' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPopularPapers(@Query('limit') limit: number = 10) {
    return this.digitalLibraryService.getPopularPapers(limit);
  }

  @Get('papers/:id')
  @ApiOperation({ summary: 'Get past paper details' })
  async getPaper(@Param('id') id: string) {
    return this.digitalLibraryService.findOnePastPaper(id);
  }

  @Get('papers/:id/questions')
  @ApiOperation({ summary: 'Get questions from past paper' })
  async getPaperQuestions(@Param('id') id: string) {
    return this.digitalLibraryService.getPastPaperQuestions(id);
  }

  @Get('papers/:id/reviews')
  @ApiOperation({ summary: 'Get reviews for past paper' })
  async getPaperReviews(@Param('id') id: string) {
    return this.digitalLibraryService.getPaperReviews(id);
  }

  @Get('papers/:id/rating')
  @ApiOperation({ summary: 'Get average rating for past paper' })
  async getPaperRating(@Param('id') id: string) {
    return this.digitalLibraryService.getPaperAverageRating(id);
  }

  @Post('papers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.TUTOR, UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new past paper entry' })
  async createPaper(@Request() req, @Body() createDto: CreatePastPaperDto) {
    return this.digitalLibraryService.createPastPaper(createDto, req.user.id, req.user.institutionId);
  }

  @Post('papers/:id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.TUTOR, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Publish past paper' })
  async publishPaper(@Request() req, @Param('id') id: string) {
    return this.digitalLibraryService.publishPastPaper(id, req.user.id);
  }

  @Post('papers/:id/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.TUTOR, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Archive past paper' })
  async archivePaper(@Param('id') id: string) {
    return this.digitalLibraryService.archivePastPaper(id);
  }

  @Post('papers/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.TUTOR, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reject past paper' })
  async rejectPaper(@Request() req, @Param('id') id: string, @Body() body: { reason?: string }) {
    return this.digitalLibraryService.rejectPastPaper(id, req.user.id, body.reason);
  }

  @Get('admin/papers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List all papers for moderation (admin)' })
  async getModerationPapers(@Query() params: { status?: string; page?: number; limit?: number; search?: string }) {
    return this.digitalLibraryService.findAllPapersForModeration(params);
  }

  @Post('papers/:id/download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Record download and return file URL' })
  async downloadPaper(@Param('id') id: string) {
    await this.digitalLibraryService.incrementDownloadCount(id);
    return this.digitalLibraryService.findOnePastPaper(id);
  }

  @Put('papers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.TUTOR, UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update past paper' })
  async updatePaper(@Param('id') id: string, @Body() updateDto: UpdatePastPaperDto) {
    return this.digitalLibraryService.updatePastPaper(id, updateDto);
  }

  @Post('papers/:id/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add review to past paper' })
  async addReview(@Request() req, @Param('id') id: string, @Body() reviewDto: CreateReviewDto) {
    return this.digitalLibraryService.addReview(id, reviewDto, req.user.id);
  }

  @Post('ocr/upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.TUTOR, UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload paper for OCR processing' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        subjectId: { type: 'string', example: 'uuid-of-subject' },
        grade: { type: 'number', example: 7 },
        paperType: { type: 'string', example: 'exam' },
        year: { type: 'number', example: 2024 },
        term: { type: 'number', example: 1 },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadForOcr(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadOcrDto,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    const fileData = {
      url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      size: file.size,
      mimeType: file.mimetype,
    };
    return this.digitalLibraryService.createOcrJob(uploadDto, req.user.id, fileData, file.originalname);
  }

  @Get('ocr/status/:jobId')
  @ApiOperation({ summary: 'Get OCR processing status' })
  async getOcrStatus(@Param('jobId') jobId: string) {
    return this.digitalLibraryService.getOcrJobStatus(jobId);
  }

  @Post('ocr/save')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.TUTOR, UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Save OCR extracted questions' })
  async saveOcrQuestions(@Request() req, @Body() saveDto: { jobId: string; questions: any[] }) {
    return this.digitalLibraryService.saveOcrQuestions(saveDto.jobId, saveDto.questions, req.user.id);
  }

  @Post('ocr/:jobId/process')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Process OCR job (trigger processing)' })
  async processOcr(@Param('jobId') jobId: string) {
    return this.digitalLibraryService.processOcrJob(jobId);
  }

  @Get('papers/:id/review-questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.TUTOR, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get questions pending review' })
  async getQuestionsForReview(@Param('id') id: string) {
    return this.digitalLibraryService.getQuestionsForReview(id);
  }

  @Post('papers/:id/review-question')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.TUTOR, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Review and approve/reject a question' })
  async reviewQuestion(@Request() req, @Param('id') id: string, @Body() reviewDto: ReviewQuestionDto) {
    return this.digitalLibraryService.reviewQuestion(id, reviewDto, req.user.id);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all paper categories' })
  async getCategories() {
    return this.digitalLibraryService.getAllCategories();
  }

  @Get('filters/years')
  @ApiOperation({ summary: 'Get available years for filtering' })
  async getYearOptions() {
    return this.digitalLibraryService.getYearFilterOptions();
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new category' })
  async createCategory(@Body() categoryData: any) {
    return this.digitalLibraryService.createCategory(categoryData);
  }
}