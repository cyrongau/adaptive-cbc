import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TutorsService } from './tutors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('tutors')
@Controller('tutors')
export class TutorsController {
  constructor(private readonly tutorsService: TutorsService) {}

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Apply to become a tutor' })
  async apply(@Request() req, @Body() applicationData: {
    bio: string;
    qualifications: string;
    experienceYears: number;
    subjects: { subjectId: string; subjectName: string; hourlyRate: number }[];
  }) {
    return this.tutorsService.applyAsTutor(req.user.id, applicationData);
  }

  @Get('application')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my tutor application status' })
  async getMyApplication(@Request() req) {
    return this.tutorsService.getApplication(req.user.id);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my tutor profile' })
  async getMyProfile(@Request() req) {
    return this.tutorsService.getProfile(req.user.id);
  }

  @Post('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create or update tutor profile' })
  async updateProfile(@Request() req, @Body() profileData: any) {
    return this.tutorsService.createProfile(req.user.id, profileData);
  }

  @Get()
  @ApiOperation({ summary: 'Find all approved tutors' })
  @ApiQuery({ name: 'subjectId', required: false })
  @ApiQuery({ name: 'grade', required: false, type: Number })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  async findAll(
    @Query('subjectId') subjectId?: string,
    @Query('grade') grade?: number,
    @Query('minRating') minRating?: number,
  ) {
    return this.tutorsService.findAllTutors({ subjectId, grade, minRating });
  }

  @Get('search')
  @ApiOperation({ summary: 'Search tutors by name or bio' })
  @ApiQuery({ name: 'q', required: true })
  async search(@Query('q') query: string) {
    return this.tutorsService.searchTutors(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tutor profile by ID' })
  async getById(@Param('id') id: string) {
    return this.tutorsService.getProfileById(id);
  }

  @Post('availability')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update tutor availability' })
  async updateAvailability(@Request() req, @Body() availability: any[]) {
    return this.tutorsService.updateAvailability(req.user.id, availability);
  }

  @Post('application/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Approve tutor application (admin)' })
  async approveApplication(@Param('id') id: string, @Request() req, @Body() data: { reviewNotes?: string }) {
    return this.tutorsService.approveApplication(id, req.user.id, data.reviewNotes);
  }

  @Post('application/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reject tutor application (admin)' })
  async rejectApplication(@Param('id') id: string, @Request() req, @Body() data: { reviewNotes: string }) {
    return this.tutorsService.rejectApplication(id, req.user.id, data.reviewNotes);
  }
}