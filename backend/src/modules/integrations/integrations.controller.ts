import { Controller, Get, Patch, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { IntegrationType, IntegrationStatus } from './entities/integration.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import {
  UpdateIntegrationDto,
  SmtpConfigDto,
  FirebaseFcmConfigDto,
  TwilioSmsConfigDto,
  WhatsAppConfigDto,
  MpesaConfigDto,
  TestSmtpDto,
  TestSmsDto,
  TestWhatsAppDto,
  TestMpesaDto,
} from './dto/integration.dto';

@ApiTags('integrations')
@Controller('integrations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@ApiBearerAuth('JWT-auth')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all integrations (super admin only)' })
  async getAllIntegrations() {
    return this.integrationsService.getAllIntegrations();
  }

  @Get(':type')
  @ApiOperation({ summary: 'Get integration by type' })
  async getIntegration(@Param('type') type: IntegrationType) {
    return this.integrationsService.getIntegrationByType(type);
  }

  @Patch(':type')
  @ApiOperation({ summary: 'Update integration settings' })
  async updateIntegration(@Param('type') type: IntegrationType, @Body() dto: UpdateIntegrationDto) {
    return this.integrationsService.updateIntegration(type, dto);
  }

  @Post('smtp/config')
  @ApiOperation({ summary: 'Configure SMTP settings' })
  async configureSmtp(@Body() config: SmtpConfigDto) {
    return this.integrationsService.updateIntegration(IntegrationType.SMTP, { config, status: IntegrationStatus.ACTIVE });
  }

  @Post('smtp/test')
  @ApiOperation({ summary: 'Test SMTP configuration' })
  async testSmtp(@Body() body: { config: SmtpConfigDto; test: TestSmtpDto }) {
    const result = await this.integrationsService.testSmtp(body.config, body.test);
    return {
      ...result,
      testedAt: new Date().toISOString(),
    };
  }

  @Post('firebase-fcm/config')
  @ApiOperation({ summary: 'Configure Firebase FCM settings' })
  async configureFirebaseFcm(@Body() config: FirebaseFcmConfigDto) {
    return this.integrationsService.updateIntegration(IntegrationType.FIREBASE_FCM, { config, status: IntegrationStatus.ACTIVE });
  }

  @Post('firebase-fcm/test')
  @ApiOperation({ summary: 'Test Firebase FCM configuration' })
  async testFirebaseFcm(@Body() config: FirebaseFcmConfigDto) {
    const result = await this.integrationsService.testFirebaseFcm(config);
    return {
      ...result,
      testedAt: new Date().toISOString(),
    };
  }

  @Post('twilio-sms/config')
  @ApiOperation({ summary: 'Configure Twilio SMS settings' })
  async configureTwilioSms(@Body() config: TwilioSmsConfigDto) {
    return this.integrationsService.updateIntegration(IntegrationType.TWILIO_SMS, { config });
  }

  @Post('twilio-sms/test')
  @ApiOperation({ summary: 'Test Twilio SMS configuration' })
  async testTwilioSms(@Body() body: { config: TwilioSmsConfigDto; test: TestSmsDto }) {
    const result = await this.integrationsService.testTwilioSms(body.config, body.test);
    return {
      ...result,
      testedAt: new Date().toISOString(),
    };
  }

  @Post('whatsapp/config')
  @ApiOperation({ summary: 'Configure WhatsApp settings' })
  async configureWhatsApp(@Body() config: WhatsAppConfigDto) {
    return this.integrationsService.updateIntegration(IntegrationType.WHATSAPP, { config });
  }

  @Post('whatsapp/test')
  @ApiOperation({ summary: 'Test WhatsApp configuration' })
  async testWhatsApp(@Body() body: { config: WhatsAppConfigDto; test: TestWhatsAppDto }) {
    const result = await this.integrationsService.testWhatsApp(body.config, body.test);
    return {
      ...result,
      testedAt: new Date().toISOString(),
    };
  }

  @Post('mpesa/config')
  @ApiOperation({ summary: 'Configure M-Pesa settings' })
  async configureMpesa(@Body() config: MpesaConfigDto) {
    return this.integrationsService.updateIntegration(IntegrationType.MPESA, { config });
  }

  @Post('mpesa/test')
  @ApiOperation({ summary: 'Test M-Pesa configuration' })
  async testMpesa(@Body() body: { config: MpesaConfigDto; test: TestMpesaDto }) {
    const result = await this.integrationsService.testMpesa(body.config, body.test);
    return {
      ...result,
      testedAt: new Date().toISOString(),
    };
  }
}
