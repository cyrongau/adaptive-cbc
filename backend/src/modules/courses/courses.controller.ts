import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Request, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto, CreateCourseModuleDto, CreateCourseLessonDto, CreateCourseReviewDto } from './dto/course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuid } from 'uuid';

@ApiTags('courses')
@Controller('courses')
@ApiBearerAuth('JWT-auth')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new course (Teacher/Tutor)' })
  async create(@Body() dto: CreateCourseDto, @Request() req) {
    return this.coursesService.create(dto, req.user.id);
  }

  @Get('my-courses')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current instructor\'s courses' })
  async findMyCourses(@Request() req) {
    return this.coursesService.findByTeacher(req.user.id);
  }

  @Get('published')
  @ApiOperation({ summary: 'Get all published courses (public)' })
  async findAllPublished(@Query('subject') subject?: string, @Query('grade') grade?: number, @Query('level') level?: string, @Query('search') search?: string) {
    return this.coursesService.findAllPublished({ subject, grade: grade ? Number(grade) : undefined, level, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  async findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update course' })
  async update(@Param('id') id: string, @Body() dto: UpdateCourseDto, @Request() req) {
    return this.coursesService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete course' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.coursesService.remove(id, req.user.id);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Publish course' })
  async publish(@Param('id') id: string, @Request() req) {
    return this.coursesService.publish(id, req.user.id);
  }

  @Patch(':id/archive')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Archive course' })
  async archive(@Param('id') id: string, @Request() req) {
    return this.coursesService.archive(id, req.user.id);
  }

  @Patch(':id/thumbnail')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: join(process.cwd(), 'uploads', 'courses'),
      filename: (req, file, cb) => {
        const name = `course-${uuid()}${extname(file.originalname)}`;
        cb(null, name);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload course thumbnail' })
  async uploadThumbnail(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Request() req) {
    const url = `/uploads/courses/${file.filename}`;
    return this.coursesService.update(id, { thumbnail: url }, req.user.id);
  }

  // === MODULES ===
  @Post(':courseId/modules')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a module in a course' })
  async createModule(@Param('courseId') courseId: string, @Body() dto: CreateCourseModuleDto, @Request() req) {
    return this.coursesService.createModule(courseId, dto, req.user.id);
  }

  @Get(':courseId/modules')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all modules for a course' })
  async getModules(@Param('courseId') courseId: string) {
    return this.coursesService.getModules(courseId);
  }

  @Put(':courseId/modules/:moduleId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a module' })
  async updateModule(@Param('moduleId') moduleId: string, @Body() dto: Partial<CreateCourseModuleDto>, @Request() req) {
    return this.coursesService.updateModule(moduleId, dto, req.user.id);
  }

  @Delete(':courseId/modules/:moduleId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a module' })
  async deleteModule(@Param('moduleId') moduleId: string, @Request() req) {
    return this.coursesService.deleteModule(moduleId, req.user.id);
  }

  // === LESSONS ===
  @Post(':courseId/modules/:moduleId/lessons')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a lesson in a module' })
  async createLesson(@Param('moduleId') moduleId: string, @Body() dto: CreateCourseLessonDto, @Request() req) {
    return this.coursesService.createLesson(moduleId, dto, req.user.id);
  }

  @Put(':courseId/modules/:moduleId/lessons/:lessonId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a lesson' })
  async updateLesson(@Param('lessonId') lessonId: string, @Body() dto: Partial<CreateCourseLessonDto>, @Request() req) {
    return this.coursesService.updateLesson(lessonId, dto, req.user.id);
  }

  @Delete(':courseId/modules/:moduleId/lessons/:lessonId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a lesson' })
  async deleteLesson(@Param('lessonId') lessonId: string, @Request() req) {
    return this.coursesService.deleteLesson(lessonId, req.user.id);
  }

  // === RESOURCES ===
  @Post(':courseId/resources')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: join(process.cwd(), 'uploads', 'courses', 'resources'),
      filename: (req, file, cb) => {
        const name = `res-${uuid()}${extname(file.originalname)}`;
        cb(null, name);
      },
    }),
    limits: { fileSize: 100 * 1024 * 1024 },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a resource file' })
  async uploadResource(@Param('courseId') courseId: string, @UploadedFile() file: Express.Multer.File, @Request() req, @Body() body: any) {
    const url = `/uploads/courses/resources/${file.filename}`;
    const ext = extname(file.originalname).toLowerCase();
    const typeMap: Record<string, string> = {
      '.pdf': 'pdf', '.mp3': 'audio', '.wav': 'audio', '.ogg': 'audio',
      '.mp4': 'video', '.webm': 'video', '.avi': 'video',
      '.doc': 'document', '.docx': 'document', '.txt': 'document', '.ppt': 'document', '.pptx': 'document',
      '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.gif': 'image', '.webp': 'image',
    };
    return this.coursesService.createResource(courseId, {
      title: body.title || file.originalname,
      type: (typeMap[ext] || 'other') as any,
      url,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      lessonId: body.lessonId || undefined,
    }, req.user.id);
  }

  @Get(':courseId/resources')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all resources for a course' })
  async getResources(@Param('courseId') courseId: string) {
    return this.coursesService.getResources(courseId);
  }

  @Delete(':courseId/resources/:resourceId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a resource' })
  async deleteResource(@Param('resourceId') resourceId: string, @Request() req) {
    return this.coursesService.deleteResource(resourceId, req.user.id);
  }

  // === REVIEWS ===
  @Post(':courseId/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add a review (Student only)' })
  async createReview(@Param('courseId') courseId: string, @Body() dto: CreateCourseReviewDto, @Request() req) {
    return this.coursesService.createReview(courseId, dto, req.user.id);
  }

  @Get(':courseId/reviews')
  @ApiOperation({ summary: 'Get course reviews' })
  async getReviews(@Param('courseId') courseId: string) {
    return this.coursesService.getReviews(courseId);
  }

  @Get(':courseId/reviews/stats')
  @ApiOperation({ summary: 'Get review statistics' })
  async getReviewStats(@Param('courseId') courseId: string) {
    return this.coursesService.getReviewStats(courseId);
  }

  @Delete(':courseId/reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a review' })
  async deleteReview(@Param('reviewId') reviewId: string, @Request() req) {
    return this.coursesService.deleteReview(reviewId, req.user.id);
  }

  // === CERTIFICATES ===
  @Post(':courseId/certificates/issue/:studentId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Issue a certificate to a student' })
  async issueCertificate(@Param('courseId') courseId: string, @Param('studentId') studentId: string, @Request() req) {
    return this.coursesService.issueCertificate(courseId, studentId, req.user.id);
  }

  @Get(':courseId/certificates')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get certificates for a course' })
  async getCourseCertificates(@Param('courseId') courseId: string, @Request() req) {
    return this.coursesService.getCourseCertificates(courseId, req.user.id);
  }

  @Get('certificates/my')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my certificates (Student)' })
  async getMyCertificates(@Request() req) {
    return this.coursesService.getMyCertificates(req.user.id);
  }

  // === ANALYTICS ===
  @Get(':id/analytics')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get course analytics' })
  async getAnalytics(@Param('id') id: string, @Request() req) {
    return this.coursesService.getAnalytics(id, req.user.id);
  }
}
