import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Delete, Patch, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { InstitutionsService } from './institutions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

@ApiTags('institutions')
@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new institution (admin)' })
  async create(@Body() institutionData: any) {
    return this.institutionsService.create(institutionData);
  }

  @Post('create-and-assign-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create institution and assign an existing user as admin' })
  async createAndAssignAdmin(@Body() data: { userId: string; institutionData: any }) {
    const institution = await this.institutionsService.create(data.institutionData);
    await this.institutionsService.addAdmin(institution.id, data.userId, 'admin');
    return { institution, message: 'Institution created and admin assigned successfully' };
  }

  @Post('promote-to-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Promote a teacher/tutor to institution admin and assign institution' })
  async promoteToAdmin(@Body() data: { userId: string; institutionId?: string; institutionData?: any }) {
    return this.institutionsService.promoteToAdmin(data.userId, data.institutionId, data.institutionData);
  }

  @Get()
  @ApiOperation({ summary: 'Get all institutions' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false })
  async findAll(
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.institutionsService.findAll({ status: status as any, type: type as any });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my institution' })
  async getMyInstitution(@Request() req) {
    return this.institutionsService.getMyInstitution(req.user.id);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Search institutions by name, code, or county' })
  async search(@Query('q') query: string) {
    return this.institutionsService.searchInstitutions(query);
  }

  @Get('search/senior-secondary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Search Senior Secondary schools (for transitioning students)' })
  async searchSeniorSecondary(@Query('q') query: string) {
    return this.institutionsService.searchInstitutionsByType(query, 'senior_secondary');
  }

  @Get('my-join-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my join requests (student)' })
  async getMyJoinRequests(@Request() req) {
    return this.institutionsService.getMyJoinRequests(req.user.id);
  }

  @Get('my-school')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my school info, enrollment, and teachers (student)' })
  async getMySchool(@Request() req) {
    return this.institutionsService.getStudentSchoolInfo(req.user.id);
  }

  @Get('awaiting-placement')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all students awaiting Senior Secondary placement (super admin)' })
  async getAwaitingPlacement() {
    return this.institutionsService.getAwaitingPlacementStudents();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get institution by ID' })
  async findOne(@Param('id') id: string) {
    return this.institutionsService.findOne(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get institution by code' })
  async findByCode(@Param('code') code: string) {
    return this.institutionsService.findByCode(code);
  }

  @Post(':id/admins')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add admin to institution' })
  async addAdmin(@Param('id') id: string, @Body() data: { userId: string; role?: string }) {
    return this.institutionsService.addAdmin(id, data.userId, data.role);
  }

  @Get(':id/admins')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get institution admins' })
  async getAdmins(@Param('id') id: string) {
    return this.institutionsService.getInstitutionAdmins(id);
  }

  @Post(':id/students')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add student to institution' })
  async addStudent(@Param('id') id: string, @Body() data: {
    studentId: string;
    admissionNumber?: string;
    stream?: string;
    grade?: number;
  }) {
    return this.institutionsService.addStudent(id, data.studentId, data);
  }

  @Get(':id/students')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.TEACHER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get institution students' })
  async getStudents(@Param('id') id: string) {
    return this.institutionsService.getInstitutionStudents(id);
  }

  @Delete(':id/students/:studentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove student from institution' })
  async removeStudent(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.institutionsService.removeStudent(id, studentId);
  }

  @Post(':id/teachers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add teacher to institution' })
  async addTeacher(@Param('id') id: string, @Body() data: {
    teacherId: string;
    subjects?: string[];
    streams?: string[];
  }) {
    return this.institutionsService.addTeacher(id, data.teacherId, data);
  }

  @Get(':id/teachers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.TEACHER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get institution teachers' })
  async getTeachers(@Param('id') id: string) {
    return this.institutionsService.getInstitutionTeachers(id);
  }

  @Post(':id/settings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update institution settings' })
  async updateSettings(@Param('id') id: string, @Body() settings: any) {
    return this.institutionsService.updateInstitutionSettings(id, settings);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update institution details' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.institutionsService.update(id, data);
  }

  @Post(':id/logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = join(process.cwd(), 'uploads', 'institutions');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const institutionId = req.params.id;
          const uniqueSuffix = `${institutionId}-logo-${Date.now()}${extname(file.originalname)}`;
          cb(null, uniqueSuffix);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload institution logo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        logo: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadLogo(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    const logoUrl = `/uploads/institutions/${file.filename}`;
    await this.institutionsService.update(id, { logo: logoUrl });
    return { logoUrl, message: 'Logo uploaded successfully' };
  }

  @Delete(':id/logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove institution logo' })
  async removeLogo(@Param('id') id: string) {
    await this.institutionsService.update(id, { logo: null });
    return { message: 'Logo removed successfully' };
  }

  @Post(':id/banner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @UseInterceptors(
    FileInterceptor('banner', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = join(process.cwd(), 'uploads', 'institutions');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const institutionId = req.params.id;
          const uniqueSuffix = `${institutionId}-banner-${Date.now()}${extname(file.originalname)}`;
          cb(null, uniqueSuffix);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload institution banner' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        banner: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadBanner(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    const bannerUrl = `/uploads/institutions/${file.filename}`;
    await this.institutionsService.update(id, { bannerUrl: bannerUrl });
    return { bannerUrl, message: 'Banner uploaded successfully' };
  }

  @Delete(':id/banner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove institution banner' })
  async removeBanner(@Param('id') id: string) {
    await this.institutionsService.update(id, { bannerUrl: null });
    return { message: 'Banner removed successfully' };
  }



  @Post(':id/join-request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Request to join a school (student)' })
  async requestJoin(@Request() req, @Param('id') id: string, @Body() data: { fullName: string; admissionNumber: string }) {
    return this.institutionsService.requestJoin(id, req.user.id, data.fullName, data.admissionNumber);
  }

  @Post(':id/placement-request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Request placement at a Senior Secondary school (transitioning student)' })
  async requestPlacement(@Request() req, @Param('id') id: string, @Body() data: { admissionNumber: string; stream?: string }) {
    return this.institutionsService.requestPlacement(id, req.user.id, data.admissionNumber, data.stream);
  }

  @Get(':id/join-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.TEACHER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get join requests for institution' })
  async getJoinRequests(@Param('id') id: string, @Query('status') status?: string) {
    return this.institutionsService.getJoinRequests(id, status);
  }



  @Post('join-requests/:requestId/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.TEACHER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Review a join request (approve/reject)' })
  async reviewJoinRequest(
    @Request() req,
    @Param('requestId') requestId: string,
    @Body() data: { action: 'approved' | 'rejected'; reason?: string },
  ) {
    return this.institutionsService.reviewJoinRequest(requestId, req.user.id, data.action, data.reason);
  }

  @Get(':id/join-stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.TEACHER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get join request statistics' })
  async getJoinStats(@Param('id') id: string) {
    return this.institutionsService.getJoinRequestStats(id);
  }

  @Post(':id/bulk-students')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.TEACHER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Bulk upload students via CSV data' })
  async bulkUploadStudents(
    @Param('id') id: string,
    @Body() data: { students: { fullName: string; admissionNumber: string; grade?: number; stream?: string }[] },
  ) {
    return this.institutionsService.bulkUploadStudents(id, data.students);
  }

  @Get(':id/student-register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get institution student register' })
  async getStudentRegister(@Param('id') id: string) {
    return this.institutionsService.getStudentRegister(id);
  }

  @Post(':id/student-register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add student to institution register' })
  async addToStudentRegister(
    @Param('id') id: string,
    @Body() data: { studentName: string; grade: number; admissionNumber: string; stream?: string },
  ) {
    return this.institutionsService.addToStudentRegister(id, data);
  }

  @Post(':id/student-register/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Bulk add students to register via CSV data' })
  async bulkAddToStudentRegister(
    @Param('id') id: string,
    @Body() data: { students: { studentName: string; grade: number; admissionNumber: string; stream?: string }[] },
  ) {
    return this.institutionsService.bulkAddToStudentRegister(id, data.students);
  }

  @Delete(':id/student-register/:registerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove student from institution register' })
  async removeFromStudentRegister(
    @Param('id') id: string,
    @Param('registerId') registerId: string,
  ) {
    return this.institutionsService.removeFromStudentRegister(id, registerId);
  }

  @Post(':id/student-register/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Verify if a student is in the institution register' })
  async verifyStudentInRegister(
    @Param('id') id: string,
    @Body() data: { studentName: string; admissionNumber: string },
  ) {
    return this.institutionsService.verifyStudentInRegister(id, data.studentName, data.admissionNumber);
  }

  @Get(':id/promotion-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Check if student promotion is due for this institution' })
  async getPromotionStatus(@Param('id') id: string) {
    return this.institutionsService.getPromotionStatus(id);
  }

  @Post(':id/promote-students')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Promote all students to next grade (institution admin only)' })
  async promoteStudents(@Request() req, @Param('id') id: string) {
    return this.institutionsService.promoteInstitutionStudents(id, req.user.id);
  }

  @Post(':id/transfer-student')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Transfer a student to another institution' })
  async transferStudent(
    @Request() req,
    @Param('id') id: string,
    @Body() data: { studentId: string; toInstitutionCode: string; reason?: string },
  ) {
    return this.institutionsService.transferStudent(id, data.studentId, data.toInstitutionCode, req.user.id, data.reason);
  }

  @Get(':id/transfer-history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get transfer history for this institution' })
  async getTransferHistory(@Param('id') id: string) {
    return this.institutionsService.getTransferHistory(id);
  }

  @Delete(':id/teachers/:teacherId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove a teacher from this institution' })
  async removeTeacher(@Param('id') id: string, @Param('teacherId') teacherId: string) {
    return this.institutionsService.removeTeacherFromInstitution(id, teacherId);
  }

  @Patch(':id/suspend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Suspend an institution (super admin only)' })
  async suspendInstitution(
    @Param('id') id: string,
    @Body() data: { reason?: string },
  ) {
    return this.institutionsService.suspendInstitution(id, data.reason);
  }

  @Post('promote-public-students')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Manually trigger public student promotion (super admin only)' })
  async promotePublicStudents(@Request() req) {
    return this.institutionsService.promotePublicStudents(req.user.id);
  }



  @Post(':id/accept-placement')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Accept a transitioning student into this Senior Secondary school' })
  async acceptPlacement(
    @Request() req,
    @Param('id') id: string,
    @Body() data: { studentId: string; admissionNumber: string; stream?: string },
  ) {
    return this.institutionsService.acceptPlacement(id, data.studentId, data.admissionNumber, data.stream || null, req.user.id);
  }

  @Post('upload-document')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = join(process.cwd(), 'uploads', 'kyc-documents');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req: any, file, cb) => {
          const uniqueSuffix = `${req.user.id}-${Date.now()}${extname(file.originalname)}`;
          cb(null, uniqueSuffix);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(pdf|jpg|jpeg|png)$/i)) {
          return cb(new Error('Only PDF, JPG, and PNG files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload KYC document (certificate, TSC letter)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadKycDocument(@UploadedFile() file: Express.Multer.File) {
    const url = `/uploads/kyc-documents/${file.filename}`;
    return { url, message: 'Document uploaded successfully' };
  }
}