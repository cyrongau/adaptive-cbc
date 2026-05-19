import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsArray, MinLength } from 'class-validator';
import { UsersService } from './users.service';
import { UpdateUserDto, CompleteOnboardingDto, SuspendUserDto, DemoteUserDto, ResubmitKycDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

class ApproveKycDto {
  @ApiPropertyOptional()
  reason?: string;
}

class CreateTeacherDto {
  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  subjects: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  streams?: string[];
}

class AddRoleDto {
  @ApiProperty({ enum: UserRole })
  @IsString()
  role: UserRole;
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req) {
    const user = await this.usersService.findOne(req.user.id);
    const { password, refreshToken, ...result } = user;
    return result;
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @Post('profile/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = join(process.cwd(), 'uploads', 'avatars');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = `${req.user.id}-${Date.now()}${extname(file.originalname)}`;
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
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    await this.usersService.update(req.user.id, { avatar: avatarUrl });
    return { avatarUrl, message: 'Avatar uploaded successfully' };
  }

  @Post('onboarding/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Complete student onboarding process' })
  async completeOnboarding(
    @Request() req,
    @Body() completeOnboardingDto: CompleteOnboardingDto,
  ) {
    return this.usersService.completeOnboarding(req.user.id, completeOnboardingDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all users (admin only)' })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    const { password, refreshToken, ...result } = user;
    return result;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update user details (admin only)' })
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete user (super admin only)' })
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Patch(':id/grade')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.TEACHER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update student grade (admin only)' })
  async updateStudentGrade(
    @Param('id') id: string,
    @Body() data: { grade?: number; term?: number; stream?: string; onboardingStatus?: string },
  ) {
    return this.usersService.update(id, {
      grade: data.grade,
      term: data.term,
      stream: data.stream,
      onboardingStatus: data.onboardingStatus,
    });
  }

  @Get('kyc/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get pending KYC applications (super admin only)' })
  async getPendingKycApplications() {
    return this.usersService.findPendingKycApplications();
  }

  @Post(':id/kyc/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Approve KYC application (super admin only)' })
  async approveKyc(@Param('id') id: string) {
    return this.usersService.approveKycApplication(id);
  }

  @Post(':id/kyc/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Reject KYC application (super admin only)' })
  async rejectKyc(@Param('id') id: string, @Body() dto: ApproveKycDto) {
    return this.usersService.rejectKycApplication(id, dto.reason || 'Application rejected');
  }

  @Post('kyc/resubmit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Resubmit KYC application (institution admin)' })
  async resubmitKyc(@Request() req, @Body() dto: ResubmitKycDto) {
    return this.usersService.resubmitKycApplication(req.user.id, dto.institutionApplication);
  }

  @Post('teachers/create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create teacher (institution admin only)' })
  async createTeacher(@Request() req, @Body() dto: CreateTeacherDto) {
    return this.usersService.createTeacherByInstitutionAdmin(req.user.id, dto);
  }

  @Post('roles/add')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add secondary role to user' })
  async addSecondaryRole(@Request() req, @Body() dto: AddRoleDto) {
    return this.usersService.addSecondaryRole(req.user.id, dto.role);
  }

  @Post('roles/remove')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove secondary role from user' })
  async removeSecondaryRole(@Request() req, @Body() dto: AddRoleDto) {
    return this.usersService.removeSecondaryRole(req.user.id, dto.role);
  }

  @Patch(':id/suspend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Suspend user account' })
  async suspendUser(@Request() req, @Param('id') id: string, @Body() suspendDto: SuspendUserDto) {
    return this.usersService.suspendUser(req.user.id, id, suspendDto.reason);
  }

  @Patch(':id/unsuspend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Unsuspend user account' })
  async unsuspendUser(@Request() req, @Param('id') id: string) {
    return this.usersService.unsuspendUser(req.user.id, id);
  }

  @Patch(':id/soft-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Soft delete user account' })
  async softDeleteUser(@Request() req, @Param('id') id: string) {
    return this.usersService.softDeleteUser(req.user.id, id);
  }

  @Patch(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Restore soft-deleted user account' })
  async restoreUser(@Request() req, @Param('id') id: string) {
    return this.usersService.restoreUser(req.user.id, id);
  }

  @Patch(':id/demote')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Demote user to different role (super admin only)' })
  async demoteUser(@Param('id') id: string, @Body() demoteDto: DemoteUserDto) {
    return this.usersService.demoteUser(id, demoteDto.newRole);
  }

  @Delete(':id/hard-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Permanently delete user (super admin only)' })
  async hardDeleteUser(@Param('id') id: string) {
    return this.usersService.hardDeleteUser(id);
  }
}