import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Param,
  Ip,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import {
  RegisterStudentDto,
  StudentLoginDto,
  AcceptParentInvitationDto,
  ApproveDeviceDto,
  InitiateRecoveryDto,
  CompleteRecoveryDto,
  ParentPinResetDto,
  NotifyParentDto,
} from './dto/register-student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('students')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new student (no email required)' })
  async register(@Body() dto: RegisterStudentDto) {
    return this.studentsService.register(dto);
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      path: '/',
    };

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });
    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Student login with username/admission number + PIN' })
  async login(@Body() dto: StudentLoginDto, @Ip() ip: string, @Res({ passthrough: true }) res: Response) {
    const result = await this.studentsService.studentLogin(dto, ip);
    if (result.tokens) {
      this.setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
    }
    return result;
  }

  @Post('accept-parent-invitation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept parent invitation and create parent account' })
  async acceptParentInvitation(@Body() dto: AcceptParentInvitationDto) {
    return this.studentsService.acceptParentInvitation(dto);
  }

  @Post('recovery/initiate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate PIN recovery' })
  async initiateRecovery(@Body() dto: InitiateRecoveryDto) {
    return this.studentsService.initiateRecovery(dto.identifier);
  }

  @Post('recovery/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete PIN recovery with OTP' })
  async completeRecovery(@Body() dto: CompleteRecoveryDto) {
    return this.studentsService.completeRecovery(dto.recoveryId, dto.otp, dto.newPin);
  }

  @Post('parent-pin-reset')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Parent resets child PIN with OTP' })
  async parentPinReset(@Req() req: Request, @Body() dto: ParentPinResetDto) {
    const user = (req as any).user;
    return this.studentsService.parentPinReset(user.id, dto.studentId, dto.otp, dto.newPin);
  }

  @Post('approve-device')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT, UserRole.INSTITUTION_ADMIN, UserRole.TEACHER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a student device' })
  async approveDevice(@Req() req: Request, @Body() dto: ApproveDeviceDto) {
    const user = (req as any).user;
    return this.studentsService.approveDevice(user.id, dto.studentId, dto.deviceId);
  }

  @Get('pending-approvals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT, UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get pending device approvals for parent/institution' })
  async getPendingApprovals(@Req() req: Request) {
    const user = (req as any).user;
    return this.studentsService.getPendingApprovals(user.id, user.role);
  }

  @Get('children-devices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all trusted devices for a parent\'s children' })
  async getChildrenDevices(@Req() req: Request) {
    const user = (req as any).user;
    return this.studentsService.getDevicesForParent(user.id);
  }

  @Post('enroll')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enroll a student into the institution' })
  async enrollStudent(@Req() req: Request, @Body() body: { studentId: string; admissionNumber: string; grade?: number; stream?: string }) {
    const user = (req as any).user;
    return this.studentsService.enrollStudent(user.id, user.institutionId, body);
  }

  @Post('request-enrollment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Student requests to join a school' })
  async requestEnrollment(@Req() req: Request, @Body() body: { institutionId: string; admissionNumber?: string; fullName?: string }) {
    const user = (req as any).user;
    return this.studentsService.requestSchoolEnrollment(user.id, body.institutionId, body.admissionNumber, body.fullName);
  }

  @Get('pending-enrollment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List pending enrollment requests for the institution' })
  async getPendingEnrollments(@Req() req: Request) {
    const user = (req as any).user;
    return this.studentsService.getPendingEnrollments(user.id, user.institutionId, user.role);
  }

  @Post('enrollment/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve or reject an enrollment request' })
  async reviewEnrollment(@Req() req: Request, @Body() body: { requestId: string; action: 'approved' | 'rejected'; reason?: string }) {
    const user = (req as any).user;
    return this.studentsService.reviewEnrollmentRequest(body.requestId, user.id, body.action, body.reason);
  }

  @Get('admin-pin-list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List students with temporary PINs for admin' })
  async getAdminPinList(@Req() req: Request) {
    const user = (req as any).user;
    return this.studentsService.getAdminPinList(user.institutionId);
  }

  @Post('notify-parent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Notify parent about pending device approval (no auth required)' })
  async notifyParent(@Body() dto: NotifyParentDto) {
    return this.studentsService.notifyParentsByDevice(dto.deviceId);
  }

  @Get('parent-pin-list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PARENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'List children with temporary PINs for parent' })
  async getParentPinList(@Req() req: Request) {
    const user = (req as any).user;
    return this.studentsService.getParentPinList(user.id);
  }
}
