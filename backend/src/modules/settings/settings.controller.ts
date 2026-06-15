import { Controller, Get, Patch, Post, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { UpdatePlatformSettingsDto, UpdatePracticeConfigDto, UpdateUserSettingsDto } from './dto/settings.dto';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('platform')
  @ApiOperation({ summary: 'Get platform-wide settings' })
  async getPlatformSettings() {
    return this.settingsService.getPlatformSettings();
  }

  @Patch('platform')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update platform-wide settings (super admin only)' })
  async updatePlatformSettings(@Body() dto: UpdatePlatformSettingsDto) {
    return this.settingsService.updatePlatformSettings(dto);
  }

  @Post('platform/logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload platform logo (super admin only)' })
  @UseInterceptors(FileInterceptor('logo', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = join(process.cwd(), 'uploads', 'platform');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = `platform-logo-${Date.now()}${extname(file.originalname)}`;
        cb(null, uniqueSuffix);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async uploadPlatformLogo(@UploadedFile() file: Express.Multer.File) {
    const logoUrl = `/uploads/platform/${file.filename}`;
    await this.settingsService.updatePlatformSettings({ logoUrl });
    return { logoUrl, message: 'Platform logo uploaded successfully' };
  }

  @Post('platform/favicon')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload platform favicon (super admin only)' })
  @UseInterceptors(FileInterceptor('favicon', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = join(process.cwd(), 'uploads', 'platform');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = `platform-favicon-${Date.now()}${extname(file.originalname)}`;
        cb(null, uniqueSuffix);
      },
    }),
    limits: { fileSize: 2 * 1024 * 1024 },
  }))
  async uploadPlatformFavicon(@UploadedFile() file: Express.Multer.File) {
    const faviconUrl = `/uploads/platform/${file.filename}`;
    await this.settingsService.updatePlatformSettings({ faviconUrl });
    return { faviconUrl, message: 'Platform favicon uploaded successfully' };
  }

  @Get('practice')
  @ApiOperation({ summary: 'Get practice session defaults and limits' })
  async getPracticeConfig() {
    return this.settingsService.getPracticeConfig();
  }

  @Patch('practice')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update practice session defaults (super admin only)' })
  async updatePracticeConfig(@Body() dto: UpdatePracticeConfigDto) {
    return this.settingsService.updatePracticeConfig(dto);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user settings' })
  async getUserSettings(@Param('userId') userId: string) {
    return this.settingsService.getUserSettings(userId);
  }

  @Patch('user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current user settings' })
  async updateUserSettings(@Request() req, @Body() dto: UpdateUserSettingsDto) {
    return this.settingsService.updateUserSettings(req.user.id, dto);
  }
}
