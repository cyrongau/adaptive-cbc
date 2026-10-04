import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TutorsService } from './tutors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import {
  BookTutorDto, ConfirmBookingDto, CancelBookingDto, EndSessionDto,
  CreateReviewDto, SetAvailabilitySlotsDto,
} from './dto/tutor.dto';

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create or update tutor profile' })
  async createProfile(@Request() req, @Body() profileData: any) {
    return this.tutorsService.createProfile(req.user.id, profileData);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update tutor profile (alias)' })
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update tutor availability' })
  async updateAvailability(@Request() req, @Body() availability: any[]) {
    return this.tutorsService.updateAvailability(req.user.id, availability);
  }

  // ========================
  // AVAILABILITY SLOTS
  // ========================

  @Post('availability/slots')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Set weekly availability slots' })
  async setAvailabilitySlots(@Request() req, @Body() dto: SetAvailabilitySlotsDto) {
    return this.tutorsService.setAvailabilitySlots(req.user.id, dto);
  }

  @Get('availability/slots')
  @ApiOperation({ summary: 'Get a tutor\'s available slots' })
  async getAvailableSlots(@Query('tutorId') tutorId: string) {
    return this.tutorsService.getAvailableSlots(tutorId);
  }

  // ========================
  // BOOKINGS
  // ========================

  @Post('book')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Book a tutoring session' })
  async createBooking(@Request() req, @Body() dto: BookTutorDto) {
    return this.tutorsService.createBooking(req.user.id, dto);
  }

  @Get('bookings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my bookings' })
  @ApiQuery({ name: 'status', required: false })
  async getBookings(@Request() req, @Query('status') status?: string) {
    const role = req.user.role;
    if (role === 'tutor' || role === 'teacher') {
      return this.tutorsService.getBookingsForTutor(req.user.id, status as any);
    }
    return this.tutorsService.getBookingsForStudent(req.user.id, status as any);
  }

  @Patch('bookings/:id/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Confirm a booking request (tutor)' })
  async confirmBooking(@Param('id') id: string, @Request() req, @Body() dto: ConfirmBookingDto) {
    return this.tutorsService.confirmBooking(id, req.user.id, dto.responseMessage);
  }

  @Patch('bookings/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel a booking' })
  async cancelBooking(@Param('id') id: string, @Request() req, @Body() dto: CancelBookingDto) {
    return this.tutorsService.cancelBooking(id, req.user.id, dto.reason);
  }

  // ========================
  // SESSIONS
  // ========================

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my tutoring sessions' })
  @ApiQuery({ name: 'status', required: false })
  async getSessions(@Request() req, @Query('status') status?: string) {
    const role = req.user.role;
    if (role === 'tutor' || role === 'teacher') {
      return this.tutorsService.getSessionsForTutor(req.user.id, status as any);
    }
    return this.tutorsService.getSessionsForStudent(req.user.id, status as any);
  }

  @Post('sessions/:id/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Start a tutoring session (tutor)' })
  async startSession(@Param('id') id: string, @Request() req) {
    return this.tutorsService.startSession(id, req.user.id);
  }

  @Post('sessions/:id/end')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'End a tutoring session (tutor)' })
  async endSession(@Param('id') id: string, @Request() req, @Body() dto: EndSessionDto) {
    return this.tutorsService.endSession(id, req.user.id, dto.notes);
  }

  @Post('sessions/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancel a session' })
  async cancelSession(@Param('id') id: string, @Request() req, @Body() dto: CancelBookingDto) {
    return this.tutorsService.cancelSession(id, req.user.id, dto.reason);
  }

  @Get('sessions/:id/token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get LiveKit token for a session' })
  async getSessionToken(@Param('id') id: string, @Request() req) {
    return this.tutorsService.getSessionToken(id, req.user.id, req.user.role);
  }

  @Get('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get a single session by ID' })
  async getSession(@Param('id') id: string, @Request() req) {
    return this.tutorsService.getSessionById(id, req.user.id);
  }

  // ========================
  // REVIEWS
  // ========================

  @Post('reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Review a completed session (student)' })
  async createReview(@Request() req, @Body() dto: CreateReviewDto) {
    return this.tutorsService.createReview(req.user.id, dto);
  }

  @Get('reviews/:tutorId')
  @ApiOperation({ summary: 'Get reviews for a tutor' })
  async getTutorReviews(@Param('tutorId') tutorId: string) {
    return this.tutorsService.getTutorReviews(tutorId);
  }

  // ========================
  // STUDENTS
  // ========================

  @Get('students')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my students (tutor)' })
  async getMyStudents(@Request() req) {
    return this.tutorsService.getTutorStudents(req.user.id);
  }

  // ========================
  // STATS
  // ========================

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TUTOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get tutor dashboard stats' })
  async getStats(@Request() req) {
    return this.tutorsService.getTutorStats(req.user.id);
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