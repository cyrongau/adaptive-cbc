import { Controller, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { UpdatePlatformSettingsDto, UpdateUserSettingsDto } from './dto/settings.dto';

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
