import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from './entities/system-setting.entity';
import { UserSetting } from './entities/user-setting.entity';
import { UpdatePlatformSettingsDto, UpdateUserSettingsDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SystemSetting)
    private systemSettingRepository: Repository<SystemSetting>,
    @InjectRepository(UserSetting)
    private userSettingRepository: Repository<UserSetting>,
  ) {}

  async getPlatformSettings() {
    const defaults = {
      platformName: 'Adaptive CBC',
      emailVerification: true,
      maintenanceMode: false,
      allowRegistration: true,
    };

    const settings = await this.systemSettingRepository.find();
    const result = { ...defaults };

    for (const setting of settings) {
      if (setting.value !== null) {
        Object.assign(result, setting.value);
      }
    }

    return result;
  }

  async updatePlatformSettings(dto: UpdatePlatformSettingsDto) {
    const current = await this.getPlatformSettings();
    const updated = { ...current, ...dto };

    const existing = await this.systemSettingRepository.findOne({
      where: { key: 'platform' },
    });

    if (existing) {
      existing.value = updated;
      await this.systemSettingRepository.save(existing);
    } else {
      const newSetting = this.systemSettingRepository.create({
        key: 'platform',
        value: updated,
        description: 'Platform-wide settings',
      });
      await this.systemSettingRepository.save(newSetting);
    }

    return updated;
  }

  async getUserSettings(userId: string) {
    const defaults = {
      notifications: {
        emailNotifications: true,
        assignmentReminders: true,
        progressReports: true,
        marketingEmails: false,
      },
      security: {
        twoFactorEnabled: false,
        sessionTimeout: 30,
        passwordExpiry: 90,
      },
      preferences: {},
    };

    const userSettings = await this.userSettingRepository.findOne({
      where: { userId },
    });

    if (!userSettings) {
      return defaults;
    }

    return {
      notifications: userSettings.notifications || defaults.notifications,
      security: userSettings.security || defaults.security,
      preferences: userSettings.preferences || defaults.preferences,
    };
  }

  async updateUserSettings(userId: string, dto: UpdateUserSettingsDto) {
    const current = await this.getUserSettings(userId);
    const updated = {
      notifications: {
        ...current.notifications,
        ...(dto.notifications || {}),
      },
      security: {
        ...current.security,
        ...(dto.security || {}),
      },
      preferences: {
        ...current.preferences,
        ...(dto.preferences || {}),
      },
    };

    const existing = await this.userSettingRepository.findOne({
      where: { userId },
    });

    if (existing) {
      existing.notifications = updated.notifications;
      existing.security = updated.security;
      existing.preferences = updated.preferences;
      await this.userSettingRepository.save(existing);
    } else {
      const newSetting = this.userSettingRepository.create({
        userId,
        notifications: updated.notifications,
        security: updated.security,
        preferences: updated.preferences,
      });
      await this.userSettingRepository.save(newSetting);
    }

    return updated;
  }
}
