import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto, UpdateEnrollmentDto } from './dto/enrollment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('enrollment')
@Controller('enrollment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post()
  @ApiOperation({ summary: 'Enroll in a course (Student only)' })
  async create(@Body() dto: CreateEnrollmentDto, @Request() req) {
    return this.enrollmentService.createEnrollment(dto, req.user.id);
  }

  @Get('my-enrollments')
  @ApiOperation({ summary: 'Get current user enrollments' })
  async findMyEnrollments(@Request() req) {
    return this.enrollmentService.findMyEnrollments(req.user.id);
  }

  @Get('my-enrollments/:courseId')
  @ApiOperation({ summary: 'Check if user is enrolled in a specific course' })
  async findMyActiveEnrollment(@Param('courseId') courseId: string, @Request() req) {
    return this.enrollmentService.findMyActiveEnrollment(req.user.id, courseId);
  }

  @Post(':id/drop')
  @ApiOperation({ summary: 'Drop an enrollment (Student only)' })
  async dropEnrollment(@Param('id') id: string, @Request() req) {
    return this.enrollmentService.dropEnrollment(req.user.id, id);
  }

  @Put(':id/progress')
  @ApiOperation({ summary: 'Update enrollment progress' })
  async updateProgress(@Param('id') id: string, @Body('progressPercentage') progressPercentage: number) {
    return this.enrollmentService.updateProgress(id, progressPercentage);
  }

  @Get('course/:courseId/stats')
  @ApiOperation({ summary: 'Get enrollment stats for a course' })
  async getCourseStats(@Param('courseId') courseId: string) {
    return this.enrollmentService.getEnrollmentStats(courseId);
  }

  @Get('course/:courseId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all enrollments for a course (Admin/Teacher)' })
  async findByCourse(@Param('courseId') courseId: string) {
    return this.enrollmentService.findByCourse(courseId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Get all enrollments (Admin only)' })
  async findAll() {
    return this.enrollmentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get enrollment by ID' })
  async findOne(@Param('id') id: string) {
    return this.enrollmentService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Update enrollment (Admin only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateEnrollmentDto) {
    return this.enrollmentService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete enrollment (Super Admin only)' })
  async remove(@Param('id') id: string) {
    return this.enrollmentService.remove(id);
  }
}
